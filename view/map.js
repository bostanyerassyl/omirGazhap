// ─── STATE ───────────────────────────────────────────────────────────────────
let hoveredKey  = null;
let selectedKey = null;

function featureKey(feature) {
  const coords = feature.geometry?.coordinates?.[0]?.[0];
  if (!coords) return null;
  return `${coords[0].toFixed(7)},${coords[1].toFixed(7)}`;
}

// Converts a MapLibre internal feature object to a plain GeoJSON Feature.
// queryRenderedFeatures() returns internal MapLibre class instances that
// contain non-serializable objects — passing them directly to setData()
// causes "can't serialize object of unregistered class Hp".
// Extracting only geometry + properties gives us a plain JS object that
// JSON.stringify (and therefore setData) can handle.
function toPlainFeature(feature) {
  return {
    type: 'Feature',
    geometry: JSON.parse(JSON.stringify(feature.geometry)),
    properties: { ...feature.properties }
  };
}

// ─── BUILDING DATA STORE ─────────────────────────────────────────────────────
// A Map where each key is a coordinate string like "77.1079612,43.6740081"
// and each value is an object holding all your custom data for that building.
//
// Schema:
// {
//   description : string        — free-text description
//   tags        : string[]      — user-defined labels
//   banner      : string|null   — base64 image data URI
//   levels      : string|null   — your override, shown instead of tile value
//   type        : string|null   — building type override
//   roof        : string|null   — roof shape override
//   minHeight   : string|null   — min height override
// }
//
// When you add a backend, replace the two functions below with fetch() calls:
//   getBuilding  → GET  /api/buildings/:key
//   saveBuilding → POST /api/buildings/:key  with JSON body
//
const buildingStore = new Map();

buildingStore.set('77.1082789,43.6734785', {
  description: 'Omir Gazhap — a mysterious building that appears and disappears randomly. Some say it holds the secrets of the universe, while others claim it’s just a glitch in the matrix.',
  tags: ['mysterious', 'glitch', 'secret'],
  banner: null,
  levels: '5',
  type: 'commercial',
  roof: 'flat',
  minHeight: '10'
});

function getBuilding(key) {
  return buildingStore.get(key) ?? {
    description : '',
    tags        : [],
    banner      : null,
    levels      : null,
    type        : null,
    roof        : null,
    minHeight   : null,
  };
}

function saveBuilding(key, data) {
  buildingStore.set(key, data);
}

// ─── SIDEBAR DOM ─────────────────────────────────────────────────────────────
const bannerImg     = document.getElementById('banner-img');
const bannerUpload  = document.getElementById('banner-upload');
const bannerRemove  = document.getElementById('banner-remove');
const buildingName  = document.getElementById('building-name');
const buildingMeta  = document.getElementById('building-meta');
const descTextarea  = document.getElementById('desc-textarea');
const tagInput      = document.getElementById('tag-input');
const tagsContainer = document.getElementById('tags-container');
const btnSave       = document.getElementById('btn-save');

// Editable property inputs — prefer stored overrides over tile values
const inputLevels    = document.getElementById('prop-levels');
const inputType      = document.getElementById('prop-type');
const inputRoof      = document.getElementById('prop-roof');
const inputMinHeight = document.getElementById('prop-minheight');

let activeTags = [], activeBanner = null, activeKey = null, tileProps = {};

function openSidebar(key, props) {
  activeKey  = key;
  tileProps  = props;
  const data = getBuilding(key);

  buildingName.textContent = props.name || 'Building';
  buildingMeta.textContent = `key: ${key}`;

  // Use stored override if it exists, otherwise fall back to tile value
  inputLevels.value    = data.levels    ?? props['render_height']     ?? props['building_levels'] ?? props['levels'] ?? '';
  inputType.value      = data.type      ?? props['building']          ?? props['class']           ?? '';
  inputRoof.value      = data.roof      ?? props['roof_shape']        ?? '';
  inputMinHeight.value = data.minHeight ?? props['render_min_height'] ?? '';

  descTextarea.value = data.description;
  activeTags   = [...(data.tags ?? [])];
  activeBanner = data.banner ?? null;
  renderTags();
  renderBanner();

  btnSave.textContent = 'Save changes';
  btnSave.classList.remove('saved');
  btnSave.onclick = () => {
    saveBuilding(key, {
      description : descTextarea.value,
      tags        : [...activeTags],
      banner      : activeBanner,
      // Store whatever the user typed — null means "no override, use tile value"
      levels      : inputLevels.value    || null,
      type        : inputType.value      || null,
      roof        : inputRoof.value      || null,
      minHeight   : inputMinHeight.value || null,
    });
    btnSave.textContent = 'Saved ✓';
    btnSave.classList.add('saved');
    setTimeout(() => { btnSave.textContent = 'Save changes'; btnSave.classList.remove('saved'); }, 1800);
  };

  document.body.classList.add('sidebar-open');
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  activeKey = null;
}

document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

// ─── TAGS ─────────────────────────────────────────────────────────────────────
function renderTags() {
  tagsContainer.innerHTML = '';
  activeTags.forEach((tag, i) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${tag} <button class="tag-remove" data-i="${i}">×</button>`;
    tagsContainer.appendChild(el);
  });
}
tagsContainer.addEventListener('click', e => {
  if (e.target.classList.contains('tag-remove')) { activeTags.splice(+e.target.dataset.i, 1); renderTags(); }
});
tagInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && tagInput.value.trim()) { activeTags.push(tagInput.value.trim()); tagInput.value = ''; renderTags(); }
});

// ─── BANNER ───────────────────────────────────────────────────────────────────
function renderBanner() {
  if (activeBanner) { bannerImg.src = activeBanner; bannerImg.classList.add('loaded'); bannerRemove.classList.add('visible'); }
  else              { bannerImg.classList.remove('loaded'); bannerRemove.classList.remove('visible'); }
}
document.getElementById('sidebar-banner').addEventListener('click', e => { if (e.target !== bannerRemove) bannerUpload.click(); });
bannerUpload.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { activeBanner = ev.target.result; renderBanner(); };
  reader.readAsDataURL(file); e.target.value = '';
});
bannerRemove.addEventListener('click', e => { e.stopPropagation(); activeBanner = null; renderBanner(); });

// ─── MAP ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  let style;
  try {
    const res = await fetch('https://tiles.stadiamaps.com/styles/osm_bright.json');
    style = await res.json();
  } catch(err) {
    console.error('Style fetch failed:', err);
    return;
  }

  const map = new maplibregl.Map({
    container: 'map',
    style: style,
    center: [77.107961, 43.674008],
    zoom: 15
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {

    const emptyFC = () => ({ type: 'FeatureCollection', features: [] });

    map.addSource('hover-source',    { type: 'geojson', data: emptyFC() });
    map.addSource('selected-source', { type: 'geojson', data: emptyFC() });

    // Detect the correct source name — Stadia may call it something other than 'openmaptiles'
    const buildingLayers = map.getStyle().layers.filter(l => l['source-layer'] === 'building');
    const buildingSource = buildingLayers[0]?.source ?? 'openmaptiles';
    console.log('Building source name:', buildingSource);
    console.log('Building layers found:', buildingLayers.map(l => l.id));

    // Transparent hit-target over all buildings — 0.001 not 0 because some
    // GPU drivers skip hit-testing on fully transparent layers
    map.addLayer({
      id: 'building-hit',
      type: 'fill',
      source: buildingSource,
      'source-layer': 'building',
      paint: { 'fill-color': '#000000', 'fill-opacity': 0.001 }
    });

    map.addLayer({
      id: 'building-hover',
      type: 'fill',
      source: 'hover-source',
      paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.55 }
    });

    map.addLayer({
      id: 'building-selected',
      type: 'fill',
      source: 'selected-source',
      paint: { 'fill-color': '#f97316', 'fill-opacity': 0.65 }
    });

    map.addLayer({
      id: 'building-selected-outline',
      type: 'line',
      source: 'selected-source',
      paint: { 'line-color': '#ea580c', 'line-width': 2 }
    });

    // ── HOVER ────────────────────────────────────────────────────────────────
    map.on('mousemove', e => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['building-hit'] });

      if (!features.length) {
        if (hoveredKey !== null) {
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

      // toPlainFeature() is the critical fix — strips MapLibre internals
      // so setData() can serialize the object without throwing
      map.getSource('hover-source').setData({
        type: 'FeatureCollection',
        features: [toPlainFeature(features[0])]
      });
    });

    // ── CLICK ─────────────────────────────────────────────────────────────────
    map.on('click', e => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['building-hit'] });

      if (!features.length) {
        selectedKey = null;
        map.getSource('selected-source').setData(emptyFC());
        closeSidebar();
        return;
      }

      const feature = features[0];
      const key = featureKey(feature);
      if (!key) return;

      selectedKey = key;
      map.getSource('selected-source').setData({
        type: 'FeatureCollection',
        features: [toPlainFeature(feature)]
      });

      openSidebar(key, feature.properties ?? {});
    });

  });
});