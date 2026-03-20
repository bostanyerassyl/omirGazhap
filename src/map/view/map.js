import maplibregl from 'maplibre-gl';
import { openBuildingSidebar } from './buildings.js';
import { openFeatureSidebar, setFeaturePointFilters, setupDraw } from './features.js';
import { addFriend, loadFriends, setFriendsVisibility, teardownFriends } from './friends.js';
import { addPoi, loadPoi, setPoiVisibility, teardownPoi } from './poi.js';
import { closeSidebar } from './sidebar.js';
import { emitDeveloperObjectMapClick, registerMapActionHandlers } from '../../features/map/model/map-actions';
import { teardownTrafficLights } from './traffic-lights.js';

function featureKey(feature) {
  const coords = feature.geometry?.coordinates?.[0]?.[0];
  if (!coords) return null;
  return `${coords[0].toFixed(7)},${coords[1].toFixed(7)}`;
}

function toPlainFeature(feature) {
  return {
    type: 'Feature',
    geometry: JSON.parse(JSON.stringify(feature.geometry)),
    properties: { ...feature.properties }
  };
}

export async function initializeMapView() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('initializeMapView: #map element not found');
    return () => {};
  }

  let style;
  try {
    const res = await fetch('https://tiles.stadiamaps.com/styles/osm_bright.json');
    style = await res.json();
  } catch (err) {
    console.error('Style fetch failed:', err);
    return () => {};
  }

  const map = new maplibregl.Map({
    container: mapContainer,
    style,
    center: [77.107961, 43.674008],
    zoom: 15
  });
  map.addControl(new maplibregl.NavigationControl());

  let navStartMarker = null;
  let navEndMarker = null;
  let unregisterActions = null;
  let pendingPointPick = null;
  const developerMarkers = new Map();

  const statusColor = (status) => {
    if (status === 'completed') return '#10b981';
    if (status === 'delayed') return '#ef4444';
    if (status === 'planning') return '#3b82f6';
    return '#f59e0b';
  };

  const clearDeveloperMarkers = () => {
    for (const marker of developerMarkers.values()) marker.remove();
    developerMarkers.clear();
  };

  const setDeveloperObjects = (items = []) => {
    const nextIds = new Set(items.map((item) => item.id));
    for (const [id, marker] of developerMarkers.entries()) {
      if (nextIds.has(id)) continue;
      marker.remove();
      developerMarkers.delete(id);
    }

    for (const item of items) {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) continue;
      const existing = developerMarkers.get(item.id);
      if (existing) {
        existing.setLngLat([item.longitude, item.latitude]);
        const el = existing.getElement();
        el.style.borderColor = statusColor(item.status);
        el.title = `${item.name} (${item.status})`;
        continue;
      }
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'developer-object-marker';
      el.style.borderColor = statusColor(item.status);
      el.title = `${item.name} (${item.status})`;
      el.innerHTML = '<span class="developer-object-dot"></span>';
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        emitDeveloperObjectMapClick(item.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map);
      developerMarkers.set(item.id, marker);
    }
  };

  const clearRoute = () => {
    if (map.getLayer('nav-route-line')) map.removeLayer('nav-route-line');
    if (map.getSource('nav-route')) map.removeSource('nav-route');
    if (navStartMarker) { navStartMarker.remove(); navStartMarker = null; }
    if (navEndMarker) { navEndMarker.remove(); navEndMarker = null; }
  };

  const geocodeDestination = async (destination) => {
    const params = new URLSearchParams({
      q: destination,
      format: 'jsonv2',
      limit: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('Destination not found');
    const first = data[0];
    return {
      lon: Number(first.lon),
      lat: Number(first.lat),
      label: first.display_name,
    };
  };

  const profileForMode = (mode) => {
    if (mode === 'walk') return 'foot';
    if (mode === 'bike') return 'bike';
    if (mode === 'transit') return 'driving';
    return 'driving';
  };

  const getUserLocation = () => new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: Number(position.coords.longitude),
          lat: Number(position.coords.latitude),
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 30000,
      },
    );
  });

  const requestRoute = async ({ destination, mode }) => {
    try {
      const center = map.getCenter();
      const geo = await getUserLocation();
      const start = geo
        ? [geo.lng, geo.lat]
        : [center.lng, center.lat];
      const geocoded = await geocodeDestination(destination);
      const end = [geocoded.lon, geocoded.lat];

      const profile = profileForMode(mode);
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const routeRes = await fetch(osrmUrl);
      if (!routeRes.ok) throw new Error(`Routing failed (${routeRes.status})`);
      const routeData = await routeRes.json();
      const route = routeData?.routes?.[0];
      if (!route?.geometry?.coordinates?.length) throw new Error('No route found');

      clearRoute();
      map.addSource('nav-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry,
          properties: {},
        },
      });
      map.addLayer({
        id: 'nav-route-line',
        type: 'line',
        source: 'nav-route',
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });

      navStartMarker = new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat(start)
        .addTo(map);
      navEndMarker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat(end)
        .addTo(map);

      map.fitBounds([start, end], { padding: 80, maxZoom: 15, duration: 700 });

      return {
        ok: true,
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        destinationLabel: geocoded.label,
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Route build failed',
      };
    }
  };

  unregisterActions = registerMapActionHandlers({
    requestRoute,
    clearRoute,
    addFriend: async ({ name, avatarUrl, latitude, longitude }) => {
      const center = map.getCenter();
      return addFriend({
        name,
        avatar_url: avatarUrl,
        latitude: Number.isFinite(latitude) ? latitude : center.lat,
        longitude: Number.isFinite(longitude) ? longitude : center.lng,
      });
    },
    addPoi: async ({ category, name, description, latitude, longitude }) => {
      const center = map.getCenter();
      return addPoi({
        category,
        name,
        description,
        latitude: Number.isFinite(latitude) ? latitude : center.lat,
        longitude: Number.isFinite(longitude) ? longitude : center.lng,
      });
    },
    setFilters: ({ ramps, scooters, friends, events, buses, points, fire, water, electricity }) => {
      setFriendsVisibility(friends);
      setPoiVisibility({ ramps, scooters, events, buses });
      setFeaturePointFilters({
        points: points ?? true,
        fire: fire ?? true,
        water: water ?? true,
        electricity: electricity ?? true,
      });
    },
    setDeveloperObjects: (items) => {
      setDeveloperObjects(items ?? []);
    },
    focusDeveloperObject: (item) => {
      if (!item || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return;
      map.flyTo({
        center: [item.longitude, item.latitude],
        zoom: Math.max(15, map.getZoom()),
        duration: 600,
      });
    },
    pickPoint: async () => {
      if (pendingPointPick) {
        return { ok: false, error: 'Point pick is already in progress' };
      }
      map.getCanvas().style.cursor = 'crosshair';
      return new Promise((resolve) => {
        pendingPointPick = (lngLat) => {
          map.getCanvas().style.cursor = '';
          resolve({
            ok: true,
            latitude: lngLat.lat,
            longitude: lngLat.lng,
          });
        };
      });
    },
    getMapCenter: () => {
      const center = map.getCenter();
      return { latitude: center.lat, longitude: center.lng };
    },
  });

  map.on('styleimagemissing', (e) => {
    if (!e?.id || map.hasImage(e.id)) return;
    const empty = new Uint8Array([0, 0, 0, 0]);
    map.addImage(e.id, { width: 1, height: 1, data: empty });
  });

  map.on('load', async () => {
    const draw = await setupDraw(map);
    const emptyFC = () => ({ type: 'FeatureCollection', features: [] });

    map.addSource('hover-source', { type: 'geojson', data: emptyFC() });
    map.addSource('selected-source', { type: 'geojson', data: emptyFC() });

    const buildingSource = map.getStyle().layers
      .find(l => l['source-layer'] === 'building')?.source ?? 'openmaptiles';

    map.addLayer({
      id: 'building-hit', type: 'fill', source: buildingSource,
      'source-layer': 'building', paint: { 'fill-color': '#000', 'fill-opacity': 0.001 }
    });
    map.addLayer({
      id: 'building-hover', type: 'fill', source: 'hover-source',
      paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.55 }
    });
    map.addLayer({
      id: 'building-selected', type: 'fill', source: 'selected-source',
      paint: { 'fill-color': '#f97316', 'fill-opacity': 0.65 }
    });
    map.addLayer({
      id: 'building-selected-outline', type: 'line', source: 'selected-source',
      paint: { 'line-color': '#ea580c', 'line-width': 2 }
    });

    let hoveredKey = null;

    map.on('mousemove', e => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['building-hit'] });
      if (!features.length) {
        if (hoveredKey) {
          hoveredKey = null;
          map.getSource('hover-source').setData(emptyFC());
          map.getCanvas().style.cursor = '';
        }
        return;
      }
      const key = featureKey(features[0]);
      if (!key || key === hoveredKey) return;
      hoveredKey = key;
      map.getCanvas().style.cursor = 'pointer';
      map.getSource('hover-source').setData({
        type: 'FeatureCollection',
        features: [toPlainFeature(features[0])]
      });
    });

    let ignoreMapClickUntil = 0;
    map.on('draw.create', () => {
      ignoreMapClickUntil = Date.now() + 400;
    });

    map.on('click', e => {
      if (pendingPointPick) {
        const resolvePick = pendingPointPick;
        pendingPointPick = null;
        resolvePick(e.lngLat);
        return;
      }
      if (Date.now() < ignoreMapClickUntil) return;
      if (draw.getMode?.() && draw.getMode() !== 'simple_select') return;

      const drawFeatureIds = draw.getFeatureIdsAt(e.point);
      const buildingFeatures = map.queryRenderedFeatures(e.point, { layers: ['building-hit'] });
      const selectedDrawFeatures = draw.getSelected().features;

      if (drawFeatureIds.length > 0) {
        const clickedFeature = drawFeatureIds
          .map((id) => draw.get(id))
          .find((item) => item && item.properties?.point_hidden !== true);
        if (!clickedFeature) return;
        map.getSource('selected-source').setData(emptyFC());
        openFeatureSidebar(clickedFeature, draw, map);
        return;
      }

      if (buildingFeatures.length > 0) {
        const feature = buildingFeatures[0];
        const key = featureKey(feature);
        if (!key) return;
        map.getSource('selected-source').setData({
          type: 'FeatureCollection',
          features: [toPlainFeature(feature)]
        });
        openBuildingSidebar(key, feature.properties ?? {});

      } else if (selectedDrawFeatures.some((item) => item?.properties?.point_hidden !== true)) {
        const selectedVisibleFeature = selectedDrawFeatures.find((item) => item?.properties?.point_hidden !== true);
        if (!selectedVisibleFeature) return;
        map.getSource('selected-source').setData(emptyFC());
        openFeatureSidebar(selectedVisibleFeature, draw, map);

      } else {
        map.getSource('selected-source').setData(emptyFC());
        closeSidebar();
      }
    });

    await loadFriends(map);
    await loadPoi(map);
  });

  return () => {
    clearRoute();
    clearDeveloperMarkers();
    teardownFriends();
    teardownPoi();
    teardownTrafficLights();
    unregisterActions?.();
    map.remove();
  };
}
