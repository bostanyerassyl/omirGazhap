import maplibregl from 'maplibre-gl';
import { openBuildingSidebar } from './buildings.js';
import { openFeatureSidebar, setupDraw } from './features.js';
import { loadFriends } from './friends.js';
import { closeSidebar } from './sidebar.js';

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

    map.on('click', e => {
      const drawFeatureIds = draw.getFeatureIdsAt(e.point);
      const buildingFeatures = map.queryRenderedFeatures(e.point, { layers: ['building-hit'] });
      const selectedDrawFeatures = draw.getSelected().features;

      if (drawFeatureIds.length > 0) {
        // Draw feature click should win over building layer under it
        const clickedFeature = draw.get(drawFeatureIds[0]);
        if (!clickedFeature) return;
        map.getSource('selected-source').setData(emptyFC());
        openFeatureSidebar(clickedFeature, draw, map);
        return;
      }

      if (buildingFeatures.length > 0) {
        // Building click — ignore whatever draw just deselected
        const feature = buildingFeatures[0];
        const key = featureKey(feature);
        if (!key) return;
        map.getSource('selected-source').setData({
          type: 'FeatureCollection',
          features: [toPlainFeature(feature)]
        });
        openBuildingSidebar(key, feature.properties ?? {});

      } else if (selectedDrawFeatures.length > 0) {
        // Draw feature click
        map.getSource('selected-source').setData(emptyFC());
        openFeatureSidebar(selectedDrawFeatures[0], draw, map);

      } else {
        // Empty space
        map.getSource('selected-source').setData(emptyFC());
        closeSidebar();
      }
    });

    await loadFriends(map);
  });

  return () => {
    map.remove();
  };
}
