import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// TODO: Проверь путь до твоего инстанса Supabase! 
// Если он лежит в utils, поменяй путь импорта: import { supabase } from '../utils/supabase'
import { supabase } from '../services/supabase';

// Фикс иконок для react-leaflet в связке с бандлерами (Vite/Webpack)
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Строгая типизация фичи на карте
export interface MapFeature {
  id: string;
  type: 'Point' | 'LineString';
  geometry: {
    type: 'Point' | 'LineString';
    // Для Point: [lon, lat], для LineString: [[lon, lat], [lon, lat], ...] 
    coordinates: number[] | number[][];
  };
  color?: string;
  title?: string;
  description?: string;
  asset_id?: string;
}

export const LiveMap: React.FC = () => {
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Центр Алатау
  const DEFAULT_CENTER: [number, number] = [43.673943, 77.107664];

  useEffect(() => {
    let isMounted = true;

    // 1. SELECT * при монтировании
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from('Map Features')
          .select('*');

        if (sbError) throw sbError;

        if (isMounted && data) {
          setFeatures(data as MapFeature[]);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('LiveMap fetch error:', err);
          setError(err.message || 'Ошибка загрузки данных карты');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();

    // 2. ПОДПИСКА НА REALTIME (WebSockets)
    const channel = supabase.channel('map-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Map Features' }, // Строго название с пробелом!
        (payload) => {
          console.log('Realtime UPDATE payload:', payload);
          const updatedFeature = payload.new as MapFeature;
          
          // Реактивно подменяем старую фичу новой, чтобы триггернуть ререндер
          setFeatures((prevFeatures) =>
            prevFeatures.map((feature) =>
              feature.id === updatedFeature.id ? updatedFeature : feature
            )
          );
        }
      )
      // Опционально: ловим новые фичи, если скрипт в фоне добавляет датчики
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Map Features' },
        (payload) => {
          const newFeature = payload.new as MapFeature;
          setFeatures((prev) => [...prev, newFeature]);
        }
      )
      // Опционально: ловим удаление
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'Map Features' },
        (payload) => {
          setFeatures((prev) => prev.filter(f => f.id !== payload.old.id));
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Supabase Realtime Subscription error:', err);
        } else {
          console.log('Supabase Realtime status:', status);
        }
      });

    // Cleanup при размонтировании
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Хелпер: GeoJSON (Lon, Lat) -> Leaflet (Lat, Lon)
  const swapCoordinatesToLeafletFormat = (
    coords: number[] | number[][], 
    type: 'Point' | 'LineString'
  ): any => {
    if (type === 'Point') {
      const [lon, lat] = coords as number[];
      return [lat, lon] as [number, number];
    } else if (type === 'LineString') {
      return (coords as number[][]).map(([lon, lat]) => [lat, lon] as [number, number]);
    }
    return [];
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 border rounded-lg">
        <span className="text-gray-500 font-medium animate-pulse">Инициализация карты...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
        🚨 Ошибка: {error}
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden shadow-sm relative z-0">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={16} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {features.map((feature) => {
          // Защита от кривых данных в БД
          if (!feature.geometry || !feature.geometry.coordinates) return null;

          // РЕНДЕР ЛИНИЙ (ДОРОГ)
          if (feature.type === 'LineString' && feature.geometry.type === 'LineString') {
            const positions = swapCoordinatesToLeafletFormat(feature.geometry.coordinates, 'LineString');
            return (
              <Polyline
                key={feature.id}
                positions={positions}
                color={feature.color || '#3b82f6'} // Дефолтный синий, если цвета нет
                weight={6}       // Сделал пожирнее, чтобы на презентации было видно
                opacity={0.8}
              >
                <Popup>
                  <div className="p-1">
                    <strong className="block text-sm mb-1">{feature.title || 'Дорога / Участок'}</strong>
                    {feature.description && <p className="text-xs text-gray-600 mb-1">{feature.description}</p>}
                    <span className={`inline-block px-2 py-0.5 rounded text-xs text-white ${feature.color === 'red' ? 'bg-red-500' : 'bg-green-500'}`}>
                      {feature.color === 'red' ? 'Затор' : 'Свободно'}
                    </span>
                  </div>
                </Popup>
              </Polyline>
            );
          }

          // РЕНДЕР ТОЧЕК (СВЕТОФОРЫ, СЧЕТЧИКИ)
          if (feature.type === 'Point' && feature.geometry.type === 'Point') {
            const position = swapCoordinatesToLeafletFormat(feature.geometry.coordinates, 'Point');
            return (
              <Marker key={feature.id} position={position}>
                <Popup>
                  <div className="p-1">
                    <strong className="block text-sm mb-1">{feature.title || 'Объект инфраструктуры'}</strong>
                    {feature.description && <p className="text-xs text-gray-600">ID: {feature.description}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          }

          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
