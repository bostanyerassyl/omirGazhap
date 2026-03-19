import MapboxDraw from '@mapbox/mapbox-gl-draw';
import maplibregl from 'maplibre-gl';
import { supabase } from '../supabase.js';
import {
  dom, resetSidebar, openSidebar, renderBanner,
  getActiveBanner, getActiveContext, setActiveContext, setActiveBanner
} from './sidebar.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
export let activeFeature = null;
export let activeDraw    = null;

const CAN_WRITE_OBSERVATIONS = new Set(['utilities', 'developer', 'industrialist', 'admin', 'akimat']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value ?? '').trim());
}

function getCurrentRole() {
  const fromDataset = document.getElementById('map')?.dataset?.role;
  if (fromDataset) return fromDataset;
  try {
    const raw = window.localStorage.getItem('auth.snapshot');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role ?? null;
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  try {
    const raw = window.localStorage.getItem('auth.snapshot');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const candidate = parsed?.user?.id ?? parsed?.id ?? null;
    return isUuid(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

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
        icon:        null,
        icon_url:    null,
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
  });
  if (error) {
    console.error('saveFeature error:', error.message);
    return error;
  }
  return null;
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
    .select('title, description, color, image')
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

  const icon    = activeFeature.properties?.icon     ?? null;
  const iconUrl = activeFeature.properties?.icon_url ?? null;
  activeFeature.properties.icon     = icon;
  activeFeature.properties.icon_url = iconUrl;
  setActiveIcon(icon);

  await setupObservationsUI({
    feature,
    dbId,
    role: getCurrentRole(),
  });

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

    const error = await saveFeature(updated);
    if (error) {
      dom.btnSave.textContent = 'Save failed';
      dom.btnSave.classList.remove('saved');
      dom.btnSave.classList.add('error');
      dom.btnSave.disabled = false;
      setTimeout(() => {
        dom.btnSave.textContent = 'Save changes';
        dom.btnSave.classList.remove('error');
      }, 2000);
      return;
    }
    dom.btnSave.classList.remove('error');
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

function getObservationInputValues(role) {
  const numeric = (id) => {
    const value = document.getElementById(id)?.value?.trim();
    if (!value) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  if (role === 'admin') {
    const raw = document.getElementById('observation-json')?.value?.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch {
      return null;
    }
  }

  const payload = {};
  if (role === 'utilities' || role === 'akimat') {
    const water = numeric('obs-water');
    const gas = numeric('obs-gas');
    const electricity = numeric('obs-electricity');
    if (water !== null) payload.water_m3 = water;
    if (gas !== null) payload.gas_m3 = gas;
    if (electricity !== null) payload.electricity_kwh = electricity;
  } else if (role === 'industrialist') {
    const gas = numeric('obs-gas');
    const electricity = numeric('obs-electricity');
    const pressure = numeric('obs-pressure');
    if (gas !== null) payload.gas_m3 = gas;
    if (electricity !== null) payload.electricity_kwh = electricity;
    if (pressure !== null) payload.pressure_bar = pressure;
  } else {
    const flow = numeric('obs-flow');
    const pressure = numeric('obs-pressure');
    if (flow !== null) payload.flow_m3 = flow;
    if (pressure !== null) payload.pressure_bar = pressure;
  }

  return Object.keys(payload).length ? payload : null;
}

function withClientAssetRef(payload, candidateAssetId) {
  if (!candidateAssetId) return payload;
  return {
    ...payload,
    _client_asset_ref: candidateAssetId,
  };
}

function renderObservationFields(role) {
  const container = document.getElementById('observation-fields');
  if (!container) return;
  if (role === 'admin') {
    container.innerHTML = `
      <div class="obs-row" style="grid-column: span 2">
        <label for="observation-json">Payload JSON</label>
        <textarea id="observation-json" class="prop-val" placeholder='{"flow_m3":0.79,"pressure_bar":2.03}'></textarea>
      </div>`;
    return;
  }

  if (role === 'utilities' || role === 'akimat') {
    container.innerHTML = `
      <div class="obs-row"><label for="obs-water">Water (m3)</label><input id="obs-water" class="prop-val" type="number" step="0.01" /></div>
      <div class="obs-row"><label for="obs-gas">Gas (m3)</label><input id="obs-gas" class="prop-val" type="number" step="0.01" /></div>
      <div class="obs-row" style="grid-column: span 2"><label for="obs-electricity">Electricity (kWh)</label><input id="obs-electricity" class="prop-val" type="number" step="0.01" /></div>`;
    return;
  }

  if (role === 'industrialist') {
    container.innerHTML = `
      <div class="obs-row"><label for="obs-gas">Gas (m3)</label><input id="obs-gas" class="prop-val" type="number" step="0.01" /></div>
      <div class="obs-row"><label for="obs-electricity">Electricity (kWh)</label><input id="obs-electricity" class="prop-val" type="number" step="0.01" /></div>
      <div class="obs-row" style="grid-column: span 2"><label for="obs-pressure">Pressure (bar)</label><input id="obs-pressure" class="prop-val" type="number" step="0.01" /></div>`;
    return;
  }

  container.innerHTML = `
    <div class="obs-row"><label for="obs-flow">Flow (m3)</label><input id="obs-flow" class="prop-val" type="number" step="0.01" /></div>
    <div class="obs-row"><label for="obs-pressure">Pressure (bar)</label><input id="obs-pressure" class="prop-val" type="number" step="0.01" /></div>`;
}

function renderObservations(listEl, rows) {
  if (!rows?.length) {
    listEl.innerHTML = '<div class="obs-item"><div class="obs-time">No data yet</div><div class="obs-payload">Add first observation for this point/context.</div></div>';
    return;
  }

  listEl.innerHTML = rows.map((row) => `
    <div class="obs-item">
      <div class="obs-time">${new Date(row.timestamp).toLocaleString()}</div>
      <div class="obs-payload">${JSON.stringify(row.payload, null, 2)}</div>
    </div>
  `).join('');
}

async function loadObservations({ assetId, locationId, caseId }) {
  let query = supabase
    .from('observations')
    .select('id, asset_id, location_id, case_id, timestamp, payload')
    .order('timestamp', { ascending: false })
    .limit(20);

  if (assetId && isUuid(assetId)) {
    query = query.eq('asset_id', assetId);
  } else if (locationId && isUuid(locationId)) {
    query = query.eq('location_id', locationId);
  } else if (caseId && isUuid(caseId)) {
    query = query.eq('case_id', caseId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('loadObservations error:', error.message);
    return { rows: [], error };
  }
  return { rows: data ?? [], error: null };
}

async function setupObservationsUI({ feature, dbId, role }) {
  const section = document.getElementById('observations-section');
  const list = document.getElementById('observations-list');
  const form = document.getElementById('observations-form');
  const roleHint = document.getElementById('observations-role-hint');
  const assetInput = document.getElementById('observation-asset-id');
  const assetHintEl = document.getElementById('observation-asset-hint');
  const saveBtn = document.getElementById('observation-save');
  const refreshBtn = document.getElementById('observation-refresh');
  if (!section || !list || !form || !roleHint || !assetInput || !saveBtn || !refreshBtn || !assetHintEl) return;

  if (feature.geometry.type !== 'Point') {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  const initialAssetId = feature.properties?.asset_id || '';
  const initialLocationId = feature.properties?.location_id || '';
  const initialCaseId = feature.properties?.case_id || '';
  const currentUserId = getCurrentUserId();
  assetInput.value = initialAssetId;
  assetHintEl.textContent = 'Optional. UUID format: 123e4567-e89b-12d3-a456-426614174000';

  const getLookupScope = () => {
    const lookupAssetId = assetInput.value.trim();
    const assetId = isUuid(lookupAssetId) ? lookupAssetId : null;
    const locationId = isUuid(initialLocationId) ? initialLocationId : null;
    const caseId = isUuid(initialCaseId) ? initialCaseId : null;
    return { assetId, locationId, caseId };
  };

  const loadAndRender = async () => {
    const result = await loadObservations(getLookupScope());
    if (result.error) {
      list.innerHTML = `<div class="obs-item"><div class="obs-time">Load failed</div><div class="obs-payload">${result.error.message}</div></div>`;
      return;
    }
    renderObservations(list, result.rows);
  };

  await loadAndRender();
  refreshBtn.onclick = () => { void loadAndRender(); };
  assetInput.onchange = () => { void loadAndRender(); };

  const isLinkedToAsset = Boolean(initialAssetId);
  const assetHint = isLinkedToAsset
    ? ''
    : 'This point is not linked to an asset yet. You can submit observations without Asset ID.';

  const canWrite = CAN_WRITE_OBSERVATIONS.has(role ?? '');
  if (!canWrite) {
    form.style.display = 'none';
    roleHint.textContent = role
      ? `${assetHint} Role "${role}" can view observations on points but cannot add new data.`.trim()
      : 'Sign in with a data-operator role to add observations.';
    return;
  }

  form.style.display = '';
  roleHint.textContent = role === 'akimat'
    ? `${assetHint} Government official mode enabled: you can submit official utility observations.`.trim()
    : `${assetHint} Role "${role}" data entry mode enabled.`.trim();
  renderObservationFields(role);

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    saveBtn.classList.remove('error');

    const rawAssetId = assetInput.value.trim();
    if (rawAssetId && !isUuid(rawAssetId)) {
      saveBtn.textContent = 'Invalid Asset ID';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      assetHintEl.textContent = 'Asset ID must be UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) or left blank.';
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 2200);
      return;
    }

    const nextAssetId = rawAssetId || null;
    const nextLocationId = isUuid(initialLocationId) ? initialLocationId : null;
    const nextCaseId = isUuid(initialCaseId) ? initialCaseId : null;
    const payload = getObservationInputValues(role);
    if (!payload) {
      saveBtn.textContent = 'Invalid data';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 1800);
      return;
    }

    const insertRow = {
      asset_id: nextAssetId,
      location_id: nextLocationId,
      case_id: nextCaseId,
      created_by: currentUserId,
      payload,
    };

    const { error } = await supabase
      .from('observations')
      .insert([insertRow]);

    if (error) {
      const isAssetFkViolation = error.code === '23503'
        || error.message?.includes('observations_asset_id_fkey');

      if (isAssetFkViolation) {
        const retryPayload = withClientAssetRef(payload, nextAssetId);
        const retry = await supabase
          .from('observations')
          .insert([{
            ...insertRow,
            asset_id: null,
            payload: retryPayload,
          }]);

        if (retry.error) {
          console.error('insert observation retry error:', retry.error.message);
          saveBtn.textContent = 'Insert failed';
          saveBtn.classList.add('error');
          saveBtn.disabled = false;
          setTimeout(() => {
            saveBtn.textContent = 'Add observation';
            saveBtn.classList.remove('error');
          }, 1800);
          return;
        }

        assetHintEl.textContent = `Asset "${nextAssetId}" not found in assets. Saved with asset_id = null and client ref in payload.`;
      } else {
        console.error('insert observation error:', error.message);
        saveBtn.textContent = 'Insert failed';
        saveBtn.classList.add('error');
        saveBtn.disabled = false;
        setTimeout(() => {
          saveBtn.textContent = 'Add observation';
          saveBtn.classList.remove('error');
        }, 1800);
        return;
      }
    }

    const refreshed = await loadObservations(getLookupScope());
    if (refreshed.error) {
      list.innerHTML = `<div class="obs-item"><div class="obs-time">Load failed</div><div class="obs-payload">${refreshed.error.message}</div></div>`;
    } else {
      renderObservations(list, refreshed.rows);
    }
    saveBtn.textContent = 'Added';
    saveBtn.disabled = false;
    setTimeout(() => {
      saveBtn.textContent = 'Add observation';
    }, 1400);
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
