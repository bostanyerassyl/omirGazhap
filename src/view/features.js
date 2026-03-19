import { supabase } from '../supabase.js';
import {
  dom, resetSidebar, openSidebar, renderBanner,
  getActiveBanner, getActiveContext, setActiveContext, setActiveBanner
} from './sidebar.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
export let activeFeature = null;
export let activeDraw    = null;

// When a building is clicked, map.js sets this to true so the
// draw.selectionchange handler that fires on the same click is ignored.

function setActiveFeature(f) { activeFeature = f; }
function setActiveDraw(d)    { activeDraw    = d; }

// ── STORE ─────────────────────────────────────────────────────────────────────
export async function loadFeatures() {
  const { data, error } = await supabase.from('Map Features').select('*');
  if (error) { console.error('loadFeatures error:', error.message); return null; }
  return {
    type: 'FeatureCollection',
    features: data.map(row => ({
      type: 'Feature',
      id: row.id,
      geometry: row.geometry,
      properties: {
        id:          row.id,
        title:       row.title,
        description: row.description,
        color:       row.color,
        image:       row.image,
        icon:        row.icon,
        icon_url:    row.icon_url,
      }
    }))
  };
}

export async function saveFeature(feature) {
  const id = feature.properties?.id;
  if (!id) { console.error('saveFeature: no id'); return; }
  const { error } = await supabase.from('Map Features').upsert({
    id,
    type:        feature.geometry.type,
    geometry:    feature.geometry,
    title:       feature.properties.title       ?? null,
    description: feature.properties.description ?? null,
    color:       feature.properties.color       ?? null,
    image:       feature.properties.image       ?? null,
    icon:        feature.properties.icon        ?? null,
    icon_url:    feature.properties.icon_url    ?? null,
  });
  if (error) console.error('saveFeature error:', error.message);
}

export async function deleteFeature(id) {
  const { error } = await supabase.from('Map Features').delete().eq('id', id);
  if (error) console.error('deleteFeature error:', error.message);
}

// ── ICON MARKERS ─────────────────────────────────────────────────────────────
const iconMarkers = new Map();

export function setActiveIcon(icon) {
  document.querySelectorAll('.icon-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.icon === (icon ?? 'none'))
  );
}

export function updateIconMarker(map, featureId, lngLat, icon, iconUrl) {
  iconMarkers.get(featureId)?.remove();
  iconMarkers.delete(featureId);
  if (!icon || icon === 'none') return;

  const el = document.createElement('div');
  el.className = 'point-icon-marker';
  el.innerHTML = (icon === 'custom' && iconUrl)
    ? `<img src="${iconUrl}" alt="icon" />`
    : icon;

  const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat(lngLat).addTo(map);
  iconMarkers.set(featureId, marker);
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
export async function openFeatureSidebar(feature, draw, map) {
  resetSidebar();

  const drawId = feature.id;
  const dbId   = feature.properties?.id ?? drawId;

  setActiveFeature(feature);
  setActiveDraw(draw);
  setActiveContext({ type: 'feature', id: dbId });

  dom.featureSection.style.display = 'block';
  dom.buildingSections.forEach(s => { if (s) s.style.display = 'none'; });
  dom.buildingName.textContent = feature.geometry.type;
  dom.buildingMeta.textContent = `Type: ${feature.geometry.type}`;
  openSidebar();

  const { data } = await supabase
    .from('Map Features')
    .select('title, description, color, image, icon, icon_url')
    .eq('id', dbId)
    .maybeSingle();

  // Guard: bail if a building was clicked while this fetch was running
  const currentContext = getActiveContext();
  if (currentContext?.type !== 'feature' || currentContext?.id !== dbId) return;

  dom.buildingName.textContent = data?.title || feature.geometry.type;
  document.getElementById('feature-title').value = data?.title ?? '';
  document.getElementById('feature-desc').value  = data?.description ?? '';
  document.getElementById('feature-color').value = data?.color ?? '#e74c3c';

  setActiveBanner(data?.image ?? null);
  renderBanner();

  const icon    = data?.icon     ?? null;
  const iconUrl = data?.icon_url ?? null;
  activeFeature.properties.icon     = icon;
  activeFeature.properties.icon_url = iconUrl;
  setActiveIcon(icon);

  dom.btnSave.onclick = async () => {
    dom.btnSave.textContent = 'Saving…';
    dom.btnSave.disabled    = true;

    const color = document.getElementById('feature-color').value;
    const updated = {
      ...activeFeature,
      properties: {
        ...activeFeature.properties,
        title:       document.getElementById('feature-title').value || null,
        description: document.getElementById('feature-desc').value  || null,
        color,
        image:       getActiveBanner()                ?? null,
        icon:        activeFeature.properties.icon     ?? null,
        icon_url:    activeFeature.properties.icon_url ?? null,
      }
    };

    // setFeatureProperty uses Draw's internal string ID, not the DB UUID
    activeDraw.setFeatureProperty(drawId, 'color', color);
    activeDraw.setFeatureProperty(drawId, 'title', updated.properties.title);
    map.triggerRepaint();

    await saveFeature(updated);
    dom.buildingName.textContent = updated.properties.title || activeFeature.geometry.type;

    dom.btnSave.textContent = 'Saved ✓';
    dom.btnSave.classList.add('saved');
    dom.btnSave.disabled = false;
    setTimeout(() => {
      dom.btnSave.textContent = 'Save changes';
      dom.btnSave.classList.remove('saved');
    }, 1800);
  };
}

// ── DRAW SETUP ────────────────────────────────────────────────────────────────
export async function setupDraw(map) {
  // No custom styles — MapboxDraw's defaults always render correctly.
  // Color via setFeatureProperty still works with the default theme.
  const draw = new MapboxDraw({
    displayControlsDefault: false,
  });

  map.addControl(draw);
  setActiveDraw(draw);

  // Live color preview
  document.getElementById('feature-color').addEventListener('input', e => {
    if (!activeFeature) return;
    draw.setFeatureProperty(activeFeature.id, 'portColor', e.target.value);
    map.triggerRepaint();
  });

  setupIconPicker(map, draw);

  const saved = await loadFeatures();
  if (saved) {
    draw.add(saved);
    for (const feat of saved.features) {
      if (feat.geometry.type === 'Point' && feat.properties.icon) {
        updateIconMarker(map, feat.id, feat.geometry.coordinates,
          feat.properties.icon, feat.properties.icon_url);
      }
    }
  }

  // Toolbar mode buttons
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
      const id = feature.properties.id ?? feature.id;
      await deleteFeature(id);
      draw.delete(feature.id);
      iconMarkers.get(feature.id)?.remove();
      iconMarkers.delete(feature.id);
    }
  });

  map.on('draw.create', async e => {
    const feature = e.features[0];
    feature.properties.id = crypto.randomUUID();
    draw.setFeatureProperty(feature.id, 'id', feature.properties.id);
    await saveFeature(feature);
    openFeatureSidebar(feature, draw, map);
  });

  map.on('draw.update', async e => {
    for (const feature of e.features) {
      await saveFeature(feature);
      if (feature.geometry.type === 'Point') {
        updateIconMarker(map, feature.id, feature.geometry.coordinates,
          feature.properties.icon, feature.properties.icon_url);
      }
    }
  });
  return draw;
  
}

// ── ICON PICKER ───────────────────────────────────────────────────────────────
function setupIconPicker(map, draw) {
  document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeFeature) return;
      if (btn.dataset.icon === 'custom') {
        const upload = document.getElementById('icon-upload');
        upload.value = '';
        upload.click();
        return;
      }
      const icon = btn.dataset.icon === 'none' ? null : btn.dataset.icon;
      activeFeature.properties.icon     = icon;
      activeFeature.properties.icon_url = null;
      setActiveIcon(icon);
      if (activeFeature.geometry.type === 'Point') {
        updateIconMarker(map, activeFeature.id,
          activeFeature.geometry.coordinates, icon, null);
      }
    });
  });

  document.getElementById('icon-upload').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file || !activeFeature) return;

    const filename = `icon_${activeFeature.properties.id}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage
      .from('building_images')
      .upload(filename, file, { upsert: true, contentType: file.type });

    if (error) { console.error('Icon upload failed:', error.message); return; }

    const { data } = supabase.storage.from('building_images').getPublicUrl(filename);
    activeFeature.properties.icon     = 'custom';
    activeFeature.properties.icon_url = data.publicUrl;
    setActiveIcon('custom');

    if (activeFeature.geometry.type === 'Point') {
      updateIconMarker(map, activeFeature.id,
        activeFeature.geometry.coordinates, 'custom', data.publicUrl);
    }
  });
}
