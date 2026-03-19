import { supabase } from '../supabase.js';
import MapboxDraw from '@mapbox/mapbox-gl-draw'
// ─── STATE ───────────────────────────────────────────────────────────────────
let hoveredKey = null;
let selectedKey = null;
let activeContext = null;
let activeFeature = null; // stores the full feature object while sidebar is open
let activeDraw = null; // stores the draw instance

// Builds a stable key from the first coordinate of the building polygon.
// This is our primary key — it maps 1:1 to a row in "Building Data".
function featureKey(feature) {
  const coords = feature.geometry?.coordinates?.[0]?.[0];
  if (!coords) return null;
  return `${coords[0].toFixed(7)},${coords[1].toFixed(7)}`;
}

// Strip MapLibre internal class instances so setData() can serialize the object.
function toPlainFeature(feature) {
  return {
    type: 'Feature',
    geometry: JSON.parse(JSON.stringify(feature.geometry)),
    properties: { ...feature.properties }
  };
}

// ─── FEATURE STORE (Supabase) ─────────────────────────────────────────────────

// Load all saved features from DB and return as a GeoJSON FeatureCollection
async function loadFeatures() {
  const { data, error } = await supabase
    .from('Map Features')
    .select('*');

  if (error) { console.error('loadFeatures error:', error.message); return null; }

  // Reconstruct GeoJSON FeatureCollection from DB rows
  return {
    type: 'FeatureCollection',
    features: data.map(row => ({
      type: 'Feature',
      id: row.id,
      geometry: row.geometry,
      properties: {
        id: row.id,
        title: row.title,
        description: row.description,
        color: row.color,
        image: row.image,  
      }
    }))
  };
}

// Save a single feature — upsert by id
async function saveFeature(feature) {
  const id = feature.properties?.id;
  if (!id) { console.error('saveFeature: no id on feature'); return; }

  const { error } = await supabase
    .from('Map Features')
    .upsert({
      id,
      type: feature.geometry.type,
      geometry: feature.geometry,
      title: feature.properties.title ?? null,
      description: feature.properties.description ?? null,
      color: feature.properties.color ?? null,
      image: feature.properties.image ?? null,
    });

  if (error) console.error('saveFeature error:', error.message);
}

// Delete a feature by id
async function deleteFeature(id) {
  const { error } = await supabase
    .from('Map Features')
    .delete()
    .eq('id', id);

  if (error) console.error('deleteFeature error:', error.message);
}

// ─── DRAW SETUP ───────────────────────────────────────────────────────────────
// Call this inside map.on('load', ...) after your existing layer setup

async function setupDraw(map) {

  const draw = new MapboxDraw({
    displayControlsDefault: false, 
    styles: drawStyles()          
  });

  // MapboxDraw adds itself as a MapLibre control
  map.addControl(draw);

  // Load existing features from DB into the draw canvas
  const saved = await loadFeatures();
  if (saved) draw.add(saved);

  // ── Toolbar buttons ───────────────────────────────────────────────────────
  document.querySelectorAll('.draw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      draw.changeMode(btn.dataset.mode);
      document.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('draw-delete').addEventListener('click', async () => {
    const selected = draw.getSelected();
    for (const feature of selected.features) {
      await deleteFeature(feature.properties.id ?? feature.id);
      draw.delete(feature.id);
    }
  });

  // ── Draw events ───────────────────────────────────────────────────────────

  // Fired when user finishes drawing a new feature
  map.on('draw.create', async e => {
    const feature = e.features[0];
    // Use the draw library's generated ID as our DB id
    feature.properties.id = feature.id;
    await saveFeature(feature);
    openFeatureSidebar(feature, draw);
  });

  // Fired when user moves/reshapes a feature
  map.on('draw.update', async e => {
    for (const feature of e.features) {
      await saveFeature(feature);
    }
  });

  // Fired when user clicks a feature in select mode
  map.on('draw.selectionchange', e => {
    if (e.features.length > 0) {
      openFeatureSidebar(e.features[0], draw);
    }
  });
}

function openFeatureSidebar(feature, draw) {
  activeContext = { type: 'feature', id: feature.properties?.id ?? feature.id };
  activeFeature = feature;  // ← store at module level
  activeDraw = draw;     // ← store at module level

  const props = feature.properties ?? {};

  // Hide building-specific sections, show feature section
  document.getElementById('feature-section').style.display = 'block';

  document.getElementById('building-name').textContent =
    props.title || feature.geometry.type;
  document.getElementById('building-meta').textContent =
    `Type: ${feature.geometry.type}`;

  document.getElementById('feature-title').value = props.title ?? '';
  document.getElementById('feature-desc').value = props.description ?? '';
  document.getElementById('feature-color').value = props.color ?? '#e74c3c';

  activeBanner = props.image ?? null;
  renderBanner();  

  document.body.classList.add('sidebar-open');

  // Save button writes back to DB and updates the draw feature's properties
  btnSave.textContent = 'Save changes';
  btnSave.classList.remove('saved');
  btnSave.onclick = async () => {
    btnSave.textContent = 'Saving…';
    btnSave.disabled = true;

    // Read props from activeFeature instead of closed-over feature
    const currentProps = activeFeature.properties ?? {};

    const updated = {
      ...activeFeature,
      properties: {
        ...currentProps,
        id: currentProps.id ?? activeFeature.id,
        title: document.getElementById('feature-title').value || null,
        description: document.getElementById('feature-desc').value || null,
        color: document.getElementById('feature-color').value,
        image: activeBanner ?? null,
      }
    };

    activeDraw.setFeatureProperty(activeFeature.id, 'title', updated.properties.title);
    activeDraw.setFeatureProperty(activeFeature.id, 'description', updated.properties.description);
    activeDraw.setFeatureProperty(activeFeature.id, 'color', updated.properties.color);

    await saveFeature(updated);

    document.getElementById('building-name').textContent =
      updated.properties.title || activeFeature.geometry.type;

    btnSave.textContent = 'Saved ✓';
    btnSave.classList.add('saved');
    btnSave.disabled = false;
    setTimeout(() => {
      btnSave.textContent = 'Save changes';
      btnSave.classList.remove('saved');
    }, 1800);
  };
}

// ─── DRAW STYLES ─────────────────────────────────────────────────────────────
// MapboxDraw uses its own style array — these control how drawn features look
function drawStyles() {
  return [
    // Polygon fill
    {
      id: 'gl-draw-polygon-fill', type: 'fill', filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: { 'fill-color': ['coalesce', ['get', 'user_color'], '#e74c3c'], 'fill-opacity': 0.3 }
    },
    // Polygon outline
    {
      id: 'gl-draw-polygon-stroke', type: 'line', filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      paint: { 'line-color': ['coalesce', ['get', 'user_color'], '#e74c3c'], 'line-width': 2 }
    },
    // Line
    {
      id: 'gl-draw-line', type: 'line', filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
      paint: { 'line-color': ['coalesce', ['get', 'user_color'], '#e74c3c'], 'line-width': 2 }
    },
    // Point
    {
      id: 'gl-draw-point', type: 'circle', filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
      paint: { 'circle-color': ['coalesce', ['get', 'user_color'], '#e74c3c'], 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
    },
    // Vertex points while editing
    {
      id: 'gl-draw-vertex', type: 'circle', filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
      paint: { 'circle-color': '#fff', 'circle-radius': 4, 'circle-stroke-width': 2, 'circle-stroke-color': '#3b82f6' }
    },
  ];
}

// ─── SUPABASE STORE ───────────────────────────────────────────────────────────
// getBuilding: fetch one row by key, return defaults if it doesn't exist yet
async function getBuilding(key) {
  const { data, error } = await supabase
    .from('Building Data')
    .select('*')
    .eq('key', key)
    .maybeSingle(); // returns null (not an error) when no row found
  console.log('getBuilding', { key, data, error });
  console.log('getBuilding data types');

  if (error) {
    console.error('getBuilding error:', error.message);
  }

  // If no row exists yet, every field is blank — the user fills them in
  return data ?? {
    title: null,
    description: null,
    image: null,
    tags: [],
    levels: null,
    type: null,
    roof: null,
    min_height: null,
  };
}

// saveBuilding: upsert — inserts on first save, updates on every save after
async function saveBuilding(key, data) {
  const { error } = await supabase
    .from('Building Data')
    .upsert({
      key,
      title: data.title || null,
      description: data.description || null,
      image: data.image || null,
      tags: data.tags?.length ? data.tags : null,
      levels: data.levels || null,
      type: data.type || null,
      roof: data.roof || null,
      min_height: data.minHeight || null,
    });

  if (error) console.error('saveBuilding error:', error.message);
}

// ─── SIDEBAR DOM ──────────────────────────────────────────────────────────────
const bannerImg = document.getElementById('banner-img');
const bannerUpload = document.getElementById('banner-upload');
const bannerRemove = document.getElementById('banner-remove');
const buildingName = document.getElementById('building-name');
const buildingTitleInput = document.getElementById('building-title-input');
const buildingMeta = document.getElementById('building-meta');
const descTextarea = document.getElementById('desc-textarea');
const tagInput = document.getElementById('tag-input');
const tagsContainer = document.getElementById('tags-container');
const btnSave = document.getElementById('btn-save');
const inputLevels = document.getElementById('prop-levels');
const inputType = document.getElementById('prop-type');
const inputRoof = document.getElementById('prop-roof');
const inputMinHeight = document.getElementById('prop-minheight');

let activeTags = [];
let activeBanner = null;
let activeKey = null;

// ── Inline title editing ─────────────────────────────────────────────────────
// Clicking the title div swaps it for an input; blur/Enter commits the value
buildingName.addEventListener('click', () => {
  buildingTitleInput.value = buildingName.textContent === 'Building' ? '' : buildingName.textContent;
  buildingName.style.display = 'none';
  buildingTitleInput.style.display = 'block';
  buildingTitleInput.focus();
});

function commitTitle() {
  const val = buildingTitleInput.value.trim();
  buildingName.textContent = val || 'Building';
  buildingName.style.display = 'block';
  buildingTitleInput.style.display = 'none';
}

buildingTitleInput.addEventListener('blur', commitTitle);
buildingTitleInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') buildingTitleInput.blur();
  if (e.key === 'Escape') {
    buildingTitleInput.value = buildingName.textContent;
    buildingTitleInput.blur();
  }
});

// ─── OPEN / CLOSE SIDEBAR ────────────────────────────────────────────────────
async function openSidebar(key, tileProps) {
  activeContext = { type: 'building', key };
  activeKey = key; // keep for backwards compatibility with banner upload and tags sections that also need the key

  // Show loading state immediately while fetch runs
  buildingName.textContent = '…';
  buildingMeta.textContent = `key: ${key}`;
  document.body.classList.add('sidebar-open');

  const data = await getBuilding(key);

  // Title: prefer stored title, fall back to OSM name, fall back to 'Building'
  const title = data.title || tileProps?.name || 'Building';
  buildingName.textContent = title;

  // Properties: prefer stored override, fall back to tile value
  inputLevels.value = data.levels ?? tileProps?.render_height ?? tileProps?.building_levels ?? '';
  inputType.value = data.type ?? tileProps?.building ?? tileProps?.class ?? '';
  inputRoof.value = data.roof ?? tileProps?.roof_shape ?? '';
  inputMinHeight.value = data.min_height ?? tileProps?.render_min_height ?? '';

  descTextarea.value = data.description ?? '';
  activeTags = Array.isArray(data.tags) ? [...data.tags] : [];
  activeBanner = data.image ?? null;

  renderTags();
  renderBanner();

  btnSave.textContent = 'Save changes';
  btnSave.classList.remove('saved');

  btnSave.onclick = async () => {
    btnSave.textContent = 'Saving…';
    btnSave.disabled = true;

    await saveBuilding(key, {
      title: buildingName.textContent === 'Building' ? null : buildingName.textContent,
      description: descTextarea.value || null,
      image: activeBanner ?? null,
      tags: [...activeTags],
      levels: inputLevels.value || null,
      type: inputType.value || null,
      roof: inputRoof.value || null,
      minHeight: inputMinHeight.value || null,
    });

    btnSave.textContent = 'Saved ✓';
    btnSave.classList.add('saved');
    btnSave.disabled = false;
    setTimeout(() => {
      btnSave.textContent = 'Save changes';
      btnSave.classList.remove('saved');
    }, 1800);
  };
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
  if (e.target.classList.contains('tag-remove')) {
    activeTags.splice(+e.target.dataset.i, 1);
    renderTags();
  }
});
tagInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && tagInput.value.trim()) {
    activeTags.push(tagInput.value.trim());
    tagInput.value = '';
    renderTags();
  }
});

// ─── BANNER ───────────────────────────────────────────────────────────────────
// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────
// Called when the user picks a file from the banner upload input.
// Uploads to Supabase Storage, then stores the public URL in activeBanner.
async function uploadBannerImage(file, key) {
  // Use the building key as the filename (replace comma with underscore)
  // so each building always overwrites its own image rather than creating duplicates
  const filename = `${key.replace(',', '_')}.${file.name.split('.').pop()}`;

  const { data, error } = await supabase.storage
    .from('building_images')   // ← replace with your actual bucket name
    .upload(filename, file, {
      upsert: true,             // overwrite if the file already exists
      contentType: file.type
    });

  if (error) {
    console.error('Upload failed:', error.message);
    return null;
  }

  // getPublicUrl is synchronous — no await needed
  const { data: urlData } = supabase.storage
    .from('building_images')   // ← same bucket name here
    .getPublicUrl(filename);

  return urlData.publicUrl;     // e.g. https://xyz.supabase.co/storage/v1/object/public/...
}
function renderBanner() {
  if (activeBanner) {
    bannerImg.src = activeBanner;
    bannerImg.classList.add('loaded');
    bannerRemove.classList.add('visible');
  } else {
    bannerImg.classList.remove('loaded');
    bannerRemove.classList.remove('visible');
  }
}
document.getElementById('sidebar-banner').addEventListener('click', e => {
  if (e.target !== bannerRemove) bannerUpload.click();
});
bannerUpload.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file || !activeContext) return;

  const localUrl = URL.createObjectURL(file);
  activeBanner = localUrl;
  renderBanner();
  bannerImg.style.opacity = '0.5';

  // Use building key or feature id as the filename
  const fileKey = activeContext.type === 'building'
    ? activeContext.key.replace(',', '_')
    : `feature_${activeContext.id}`;

  const filename = `${fileKey}.${file.name.split('.').pop()}`;

  const { error } = await supabase.storage
    .from('building_images')
    .upload(filename, file, { upsert: true, contentType: file.type });

  bannerImg.style.opacity = '1';

  if (error) {
    console.error('Upload failed:', error.message);
    activeBanner = null;
    renderBanner();
    return;
  }

  const { data: urlData } = supabase.storage
    .from('building_images')
    .getPublicUrl(filename);

  activeBanner = urlData.publicUrl;
  renderBanner();
  e.target.value = '';
});
bannerRemove.addEventListener('click', e => {
  e.stopPropagation();
  activeBanner = null;
  renderBanner();
});

// ─── MAP ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  let style;
  try {
    const res = await fetch('https://tiles.stadiamaps.com/styles/osm_bright.json');
    style = await res.json();
  } catch (err) {
    console.error('Style fetch failed:', err);
    return;
  }

  const map = new maplibregl.Map({
    container: 'map',
    style,
    center: [77.107961, 43.674008],
    zoom: 15
  });

  map.addControl(new maplibregl.NavigationControl());

  map.on('load', () => {

    const emptyFC = () => ({ type: 'FeatureCollection', features: [] });

    map.addSource('hover-source', { type: 'geojson', data: emptyFC() });
    map.addSource('selected-source', { type: 'geojson', data: emptyFC() });

    const buildingLayers = map.getStyle().layers.filter(l => l['source-layer'] === 'building');
    const buildingSource = buildingLayers[0]?.source ?? 'openmaptiles';

    // Invisible hit-target for all buildings — needed for mouse events to fire
    map.addLayer({
      id: 'building-hit',
      type: 'fill',
      source: buildingSource,
      'source-layer': 'building',
      paint: { 'fill-color': '#000000', 'fill-opacity': 0.001 }
    });

    // Blue fill on hover (driven by hover-source GeoJSON)
    map.addLayer({
      id: 'building-hover',
      type: 'fill',
      source: 'hover-source',
      paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.55 }
    });

    // Orange fill on select (driven by selected-source GeoJSON)
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

    // ── HOVER ──────────────────────────────────────────────────────────────
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
      map.getSource('hover-source').setData({
        type: 'FeatureCollection',
        features: [toPlainFeature(features[0])]
      });
    });

    // ── CLICK ──────────────────────────────────────────────────────────────
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
    setupDraw(map); // ← add this at the end of the load event handler
    loadFriends(map);
  });
});




//
//
// Friend Functionality
//
//
// ─── FRIEND MARKERS ──────────────────────────────────────────────────────────
// Stores maplibregl.Marker instances so we can update/remove them later
const friendMarkers = new Map(); // id → Marker

// Load all friends from DB and place them on the map
async function loadFriends(map) {
  const { data, error } = await supabase
    .from('Friends')
    .select('*');

  if (error) { console.error('loadFriends error:', error.message); return; }

  for (const friend of data) {
    addFriendMarker(map, friend);
  }

  // Subscribe to live location updates — fires whenever a row in Friends is updated
  supabase
    .channel('friends')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Friends' }, payload => {
      const f = payload.new;
      updateFriendPosition(f.id, f.longitude, f.latitude);
    })
    .subscribe();
}

// Create a single styled marker for a friend
function addFriendMarker(map, friend) {
  // Build the HTML element — circular avatar with name label below
  const el = document.createElement('div');
  el.className = 'friend-marker';
  el.dataset.id = friend.id;
  el.innerHTML = `
    <div class="friend-avatar">
      ${friend.avatar_url
      ? `<img src="${friend.avatar_url}" alt="${friend.name}" />`
      : `<span>${friend.name[0].toUpperCase()}</span>`  // fallback initial
    }
    </div>
    <div class="friend-name">${friend.name}</div>
  `;

  // Clicking a friend marker opens the sidebar with their info
  el.addEventListener('click', e => {
    e.stopPropagation(); // prevent map click from firing
    openFriendSidebar(friend);
  });

  const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([friend.longitude, friend.latitude])
    .addTo(map);

  friendMarkers.set(friend.id, marker);
}

// Update a friend's position (call this when you get a location update)
function updateFriendPosition(id, lng, lat) {
  const marker = friendMarkers.get(id);
  if (marker) marker.setLngLat([lng, lat]);
}

// Show friend info in the sidebar
function openFriendSidebar(friend) {
  activeContext = { type: 'friend', id: friend.id };

  document.getElementById('building-name').textContent = friend.name;
  document.getElementById('building-meta').textContent =
    `Last seen: ${new Date(friend.last_seen).toLocaleString()}`;

  // Show avatar as the banner
  activeBanner = friend.avatar_url ?? null;
  renderBanner();

  // Hide building/feature sections — friends are read-only for now
  document.getElementById('feature-section').style.display = 'none';
  document.querySelector('.section:has(#desc-textarea)').style.display = 'none';
  document.querySelector('.section:has(#tag-input)').style.display = 'none';
  document.querySelector('.section:has(.prop-grid)').style.display = 'none';

  // Show coordinates
  document.getElementById('building-meta').textContent =
    `📍 ${friend.latitude.toFixed(5)}, ${friend.longitude.toFixed(5)}
     · Last seen: ${new Date(friend.last_seen).toLocaleString()}`;

  btnSave.style.display = 'none'; // no save for friend markers
  document.body.classList.add('sidebar-open');
}