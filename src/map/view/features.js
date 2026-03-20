import MapboxDraw from '@mapbox/mapbox-gl-draw';
import maplibregl from 'maplibre-gl';
import { supabase } from '../supabase.js';
import { getTrafficLightState, initTrafficLights, setTrafficLightState } from './traffic-lights.js';
import {
  dom, resetSidebar, openSidebar, renderBanner,
  getActiveBanner, getActiveContext, setActiveContext, setActiveBanner
} from './sidebar.js';

// ── STATE ─────────────────────────────────────────────────────────────────────
export let activeFeature = null;
export let activeDraw    = null;
const DEFAULT_FEATURE_COLOR = '#e74c3c';
const drawIdToDbId = new Map();
const knownAssetIds = new Set();
const missingAssetIds = new Set();
let assetsAccessBlocked = false;
let observationsAccessBlocked = false;
const DRAW_STYLES = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': ['coalesce', ['get', 'user_color'], ['get', 'color'], DEFAULT_FEATURE_COLOR],
      'fill-opacity': 0.25,
    },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'line-color': ['coalesce', ['get', 'user_color'], ['get', 'color'], DEFAULT_FEATURE_COLOR],
      'line-width': 2,
    },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    paint: {
      'line-color': ['coalesce', ['get', 'user_color'], ['get', 'color'], DEFAULT_FEATURE_COLOR],
      'line-width': 3,
    },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 6,
      'circle-color': ['coalesce', ['get', 'user_color'], ['get', 'color'], DEFAULT_FEATURE_COLOR],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
    },
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#f59e0b',
    },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#ffffff',
    },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#1d4ed8',
    },
  },
];

const CAN_WRITE_OBSERVATIONS = new Set([
  'utilities',
  'developer',
  'industrialist',
  'admin',
  'akimat',
  'government_official',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE_ALIASES = {
  resident: 'user',
  'government-official': 'government_official',
  governmentOfficial: 'government_official',
};

function isUuid(value) {
  return UUID_RE.test(String(value ?? '').trim());
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj ?? {}, key);
}

function getCoordKey(geometry) {
  if (geometry?.type !== 'Point' || !Array.isArray(geometry.coordinates)) return null;
  const [lng, lat] = geometry.coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`;
}

function resolveFeatureDbId(feature) {
  const propId = feature?.properties?.id;
  if (typeof propId === 'string' && propId.trim()) return propId;
  const mapped = drawIdToDbId.get(feature?.id);
  if (mapped) return mapped;
  if (typeof feature?.id === 'string' && isUuid(feature.id)) return feature.id;
  return null;
}

function safeSetFeatureProperty(draw, featureId, key, value) {
  if (!draw || !featureId) return;
  try {
    const exists = draw.get(featureId);
    if (!exists) return;
    draw.setFeatureProperty(featureId, key, value);
  } catch {
    // Draw internals can race during rapid mode changes; skip noisy runtime crash.
  }
}

function toErrorText(error) {
  if (!error) return 'Unknown error';
  const parts = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.filter(Boolean).join(' | ');
}

async function ensureAssetRecordExists(assetId) {
  if (!assetId || !isUuid(assetId)) return false;
  if (knownAssetIds.has(assetId)) return true;
  if (missingAssetIds.has(assetId)) return false;
  if (assetsAccessBlocked) return false;

  const existing = await supabase
    .from('assets')
    .select('id')
    .eq('id', assetId)
    .maybeSingle();

  if (existing.error) {
    if (existing.error.code === '42501' || /permission|forbidden|not allowed/i.test(existing.error.message ?? '')) {
      assetsAccessBlocked = true;
      console.warn('Assets table access is blocked by RLS. Disabling further asset existence checks to prevent UI stutter.');
      return false;
    }
    console.error('assets lookup error:', toErrorText(existing.error));
    return false;
  }
  if (existing.data?.id) {
    knownAssetIds.add(assetId);
    return true;
  }

  // Try a small sequence of payloads to match varying assets schemas.
  const candidates = [
    { id: assetId },
    { id: assetId, type: 'generic' },
    { id: assetId, type: 'generic', status: 'active' },
  ];

  for (const payload of candidates) {
    const res = await supabase.from('assets').insert([payload]);
    if (!res.error) {
      knownAssetIds.add(assetId);
      return true;
    }
    // If another request created it first, treat as success.
    if (res.error.code === '23505') {
      knownAssetIds.add(assetId);
      return true;
    }
    if (res.error.code === '42501' || /permission|forbidden|not allowed/i.test(res.error.message ?? '')) {
      assetsAccessBlocked = true;
      console.warn('Assets table insert is blocked by RLS. Disabling further asset provisioning attempts.');
      return false;
    }
    console.error('assets insert candidate failed:', toErrorText(res.error), 'payload=', payload);
  }

  const fallback = await supabase
    .from('assets')
    .select('id')
    .eq('id', assetId)
    .maybeSingle();
  if (fallback.data?.id) {
    knownAssetIds.add(assetId);
    return true;
  }
  if (fallback.error) {
    if (fallback.error.code === '42501' || /permission|forbidden|not allowed/i.test(fallback.error.message ?? '')) {
      assetsAccessBlocked = true;
      console.warn('Assets table access is blocked by RLS. Disabling further asset checks.');
      return false;
    }
    console.error('assets final lookup error:', toErrorText(fallback.error));
  }
  missingAssetIds.add(assetId);
  return false;
}

async function ensurePointAssetId(feature, dbId = null) {
  if (feature?.geometry?.type !== 'Point') return feature?.properties?.asset_id ?? null;
  const coordKey = getCoordKey(feature.geometry);
  if (!coordKey) return feature?.properties?.asset_id ?? null;

  if (dbId) {
    const byId = await supabase
      .from('Map Features')
      .select('id, asset_id')
      .eq('id', dbId)
      .maybeSingle();
    if (byId.error) {
      console.error('ensurePointAssetId by-id lookup error:', byId.error.message);
    } else if (byId.data?.asset_id && isUuid(byId.data.asset_id)) {
      feature.properties = { ...(feature.properties ?? {}), asset_id: byId.data.asset_id };
      return byId.data.asset_id;
    }
  }

  const current = feature?.properties?.asset_id;
  if (current && isUuid(current)) return current;

  let query = supabase
    .from('Map Features')
    .select('id, asset_id')
    .eq('coord_key', coordKey)
    .not('asset_id', 'is', null)
    .limit(1);

  if (dbId) query = query.neq('id', dbId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('ensurePointAssetId lookup error:', error.message);
  }

  const nextAssetId = data?.asset_id || crypto.randomUUID();
  feature.properties = { ...(feature.properties ?? {}), asset_id: nextAssetId };

  // Best-effort assets provisioning only; does not null-out sticky feature asset_id.
  if (!assetsAccessBlocked) {
    void ensureAssetRecordExists(nextAssetId);
  }
  return nextAssetId;
}

function getCurrentRole() {
  const fromDataset = document.getElementById('map')?.dataset?.role;
  if (fromDataset) return ROLE_ALIASES[fromDataset] ?? fromDataset;
  try {
    const raw = window.localStorage.getItem('auth.snapshot');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const rawRole = parsed?.role ?? null;
    return rawRole ? (ROLE_ALIASES[rawRole] ?? rawRole) : null;
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  try {
    const raw = window.localStorage.getItem('auth.snapshot');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const candidate = parsed?.user?.id ?? parsed?.userId ?? parsed?.id ?? null;
    return isUuid(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

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
        color:       row.color ?? DEFAULT_FEATURE_COLOR,
        image:       row.image,
        icon:        row.icon ?? null,
        icon_url:    row.icon_url ?? null,
        asset_id:    row.asset_id,
      }
    }))
  };
}

export async function saveFeature(feature) {
  let id = resolveFeatureDbId(feature);
  if (!id) { console.error('saveFeature: no id'); return; }
  const coordKey = getCoordKey(feature.geometry);

  // If a point already exists at this coord_key, update that row instead of creating duplicate.
  if (feature.geometry?.type === 'Point' && coordKey) {
    const existingAtCoord = await supabase
      .from('Map Features')
      .select('id, asset_id')
      .eq('coord_key', coordKey)
      .limit(1)
      .maybeSingle();
    if (existingAtCoord.error) {
      console.error('saveFeature coord lookup error:', existingAtCoord.error.message);
    } else if (existingAtCoord.data?.id && existingAtCoord.data.id !== id) {
      id = existingAtCoord.data.id;
      if (existingAtCoord.data.asset_id && !feature.properties?.asset_id) {
        feature.properties = { ...(feature.properties ?? {}), asset_id: existingAtCoord.data.asset_id };
      }
    }
  }

  feature.properties = { ...(feature.properties ?? {}), id };
  drawIdToDbId.set(feature.id, id);
  const ensuredAssetId = await ensurePointAssetId(feature, id);

  const baseRow = {
    id,
    type:        feature.geometry.type,
    geometry:    feature.geometry,
    title:       feature.properties.title       ?? null,
    description: feature.properties.description ?? null,
    color:       feature.properties.color       ?? DEFAULT_FEATURE_COLOR,
    image:       feature.properties.image       ?? null,
    coord_key:   coordKey,
  };

  if (feature.geometry?.type === 'Point') {
    baseRow.asset_id = ensuredAssetId ?? feature.properties.asset_id ?? null;
  }

  let payload = {
    ...baseRow,
    icon:      feature.properties.icon     ?? null,
    icon_url:  feature.properties.icon_url ?? null,
  };

  let error = null;
  for (let i = 0; i < 6; i += 1) {
    const res = await supabase.from('Map Features').upsert(payload);
    error = res.error;
    if (!error) break;
    const miss = error.message?.match(/Could not find the '([^']+)' column/);
    if (!miss) break;
    const missingCol = miss[1];
    if (!hasOwn(payload, missingCol)) break;
    delete payload[missingCol];
    console.warn(`Map Features table has no ${missingCol} column yet. Retrying without it.`);
  }

  if (error?.message?.includes("Could not find the 'asset_id' column")) {
    console.warn('Map Features table has no asset_id column yet. Run the migration to enable asset linking.');
  }
  if (error?.message?.includes("Could not find the 'coord_key' column")) {
    console.warn('Map Features table has no coord_key column yet. Run the migration to enforce unique coordinate mapping.');
  }
  if (error?.message?.includes("Could not find the 'icon' column")) {
    console.warn('Map Features table has no icon/icon_url columns yet. Run the migration to persist icons.');
  }

  if (error) {
    console.error('saveFeature error:', error.message);
    return error;
  }

  if (feature.geometry?.type === 'Point' && feature.properties?.asset_id) {
    const coordKey = getCoordKey(feature.geometry);
    const existing = await supabase
      .from('Map Features')
      .select('id, asset_id, coord_key')
      .eq('asset_id', feature.properties.asset_id)
      .neq('id', id)
      .limit(1)
      .maybeSingle();
    if (existing.error) {
      console.error('saveFeature duplicate check error:', existing.error.message);
    } else if (existing.data && existing.data.coord_key && coordKey && existing.data.coord_key !== coordKey) {
      console.warn(`Asset ${feature.properties.asset_id} is already linked to another coordinate (${existing.data.coord_key}).`);
    }
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

function syncPointIconMarkers(draw, map) {
  if (!draw || !map) return;
  const all = draw.getAll?.();
  const features = Array.isArray(all?.features) ? all.features : [];
  const activeIds = new Set();

  for (const feat of features) {
    if (feat?.geometry?.type !== 'Point') continue;
    const icon = feat?.properties?.icon;
    if (!icon || icon === 'none') continue;
    const featureId = feat.id;
    const coords = feat.geometry?.coordinates;
    if (!featureId || !Array.isArray(coords)) continue;
    activeIds.add(featureId);
    updateIconMarker(map, featureId, coords, icon, feat?.properties?.icon_url ?? null);
  }

  for (const [featureId, marker] of iconMarkers.entries()) {
    if (activeIds.has(featureId)) continue;
    marker.remove();
    iconMarkers.delete(featureId);
  }
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
export async function openFeatureSidebar(feature, draw, map) {
  resetSidebar();

  const drawId = feature.id;
  let dbId = resolveFeatureDbId(feature);
  if (!dbId) {
    dbId = crypto.randomUUID();
    safeSetFeatureProperty(draw, drawId, 'id', dbId);
    feature.properties = { ...(feature.properties ?? {}), id: dbId };
  }
  drawIdToDbId.set(drawId, dbId);

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
    .select('*')
    .eq('id', dbId)
    .maybeSingle();

  // Guard: bail if a building was clicked while this fetch was running
  const currentContext = getActiveContext();
  if (currentContext?.type !== 'feature' || currentContext?.id !== dbId) return;

  dom.buildingName.textContent = data?.title || feature.geometry.type;
  document.getElementById('feature-title').value = data?.title ?? '';
  document.getElementById('feature-desc').value  = data?.description ?? '';
  document.getElementById('feature-color').value = data?.color ?? DEFAULT_FEATURE_COLOR;

  setActiveBanner(data?.image ?? null);
  renderBanner();
  
  if (data?.asset_id) {
    activeFeature.properties.asset_id = data.asset_id;
  }

  const icon    = data?.icon ?? activeFeature.properties?.icon ?? null;
  const iconUrl = data?.icon_url ?? activeFeature.properties?.icon_url ?? null;
  activeFeature.properties.icon     = icon;
  activeFeature.properties.icon_url = iconUrl;
  setActiveIcon(icon);

  setupTrafficLightUI({ dbId, draw, map, feature });
  setupCameraUI({ feature, role: getCurrentRole() });

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
        color:       color || DEFAULT_FEATURE_COLOR,
        image:       getActiveBanner()                ?? null,
        icon:        activeFeature.properties.icon     ?? null,
        icon_url:    activeFeature.properties.icon_url ?? null,
      }
    };

    // setFeatureProperty uses Draw's internal string ID, not the DB UUID
    safeSetFeatureProperty(activeDraw, drawId, 'color', color);
    safeSetFeatureProperty(activeDraw, drawId, 'title', updated.properties.title);
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

function setupTrafficLightUI({ dbId, draw, map, feature }) {
  const section = document.getElementById('traffic-light-section');
  const hint = document.getElementById('traffic-light-hint');
  const buttons = Array.from(document.querySelectorAll('.traffic-state-btn'));
  if (!section || !hint || !buttons.length) return;

  if (feature.geometry.type !== 'Point') {
    section.style.display = 'none';
    return;
  }
  const currentState = getTrafficLightState(dbId);
  const icon = feature?.properties?.icon ?? null;
  const isTrafficLightFeature = icon === '🚦';
  if (!isTrafficLightFeature) {
    section.style.display = 'none';
    hint.textContent = 'Set icon to 🚦 to enable traffic light controls.';
    return;
  }

  section.style.display = '';
  for (const btn of buttons) {
    btn.classList.toggle('active', btn.dataset.state === currentState);
    btn.onclick = async () => {
      const state = btn.dataset.state;
      if (!state) return;
      hint.textContent = 'Saving state...';
      const result = await setTrafficLightState(dbId, state);
      if (!result.ok) {
        hint.textContent = `Failed: ${result.error}`;
        return;
      }
      for (const b of buttons) b.classList.toggle('active', b.dataset.state === state);
      const color = state === 'red' ? '#ef4444' : state === 'yellow' ? '#f59e0b' : '#22c55e';
      document.getElementById('feature-color').value = color;
      safeSetFeatureProperty(draw, feature.id, 'color', color);
      map.triggerRepaint();
      hint.textContent = 'Synced across devices.';
    };
  }
}

function setupCameraUI({ feature, role }) {
  let container = document.getElementById('camera-feed-section');
  if (!container) {
    container = document.createElement('div');
    container.id = 'camera-feed-section';
    container.style.marginTop = '20px';
    const targetDiv = dom.featureSection; // Append to the bottom of the section
    if (targetDiv) {
      targetDiv.appendChild(container);
    }
  }

  const isCamera = feature.properties?.icon === '📹' || 
                   (feature.properties?.title && feature.properties.title.toLowerCase().includes('камер'));

  if (role === 'admin' && isCamera) {
    container.style.display = 'block';
    container.innerHTML = `
      <div class="sidebar-section" style="padding: 15px; background: #1e293b; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #fff; font-size: 14px; margin-bottom: 12px;">🔴 Live Traffic Camera (Admin)</h3>
        <div style="position: relative; width: 100%; padding-bottom: 75%; height: 0; overflow: hidden; border-radius: 6px; background: #000;">
          <iframe width="640" height="480" src="https://rtsp.me/embed/KPbwo57M/" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
        </div>
      </div>
    `;
  } else {
    container.style.display = 'none';
    container.innerHTML = '';
  }
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

  const grouped = rows.reduce((acc, row) => {
    const key = row.asset_id || 'unlinked';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  listEl.innerHTML = Object.entries(grouped).map(([assetId, group]) => {
    const items = group.map((row) => `
      <div class="obs-item">
        <div class="obs-time">${new Date(row.timestamp).toLocaleString()}</div>
        <div class="obs-payload">${JSON.stringify(row.payload, null, 2)}</div>
      </div>
    `).join('');
    return `
      <div class="obs-group">
        <div class="obs-group-title">Asset: ${assetId}</div>
        ${items}
      </div>
    `;
  }).join('');
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
  const fields = document.getElementById('observation-fields');
  if (!section || !list || !form || !roleHint || !assetInput || !saveBtn || !refreshBtn || !assetHintEl || !fields) return;

  section.style.display = '';
  if (feature.geometry.type !== 'Point') {
    form.style.display = 'none';
    roleHint.textContent = 'Observations are enabled for point features only (asset -> coordinate mapping).';
    list.innerHTML = '';
    return;
  }
  const initialAssetId = feature.properties?.asset_id || '';
  const initialLocationId = feature.properties?.location_id || '';
  const initialCaseId = feature.properties?.case_id || '';
  const currentUserId = getCurrentUserId();
  assetInput.value = initialAssetId;
  assetHintEl.textContent = assetsAccessBlocked
    ? 'Assets table access blocked by RLS. Asset ID is optional for now.'
    : 'Required UUID format: 123e4567-e89b-12d3-a456-426614174000';

  const getLookupScope = (resolvedAssetId = null) => {
    const lookupAssetId = resolvedAssetId ?? assetInput.value.trim();
    const assetId = isUuid(lookupAssetId) ? lookupAssetId : null;
    const locationId = isUuid(initialLocationId) ? initialLocationId : null;
    const caseId = isUuid(initialCaseId) ? initialCaseId : null;
    return { assetId, locationId, caseId };
  };

  const getDbLinkedAssetId = async () => {
    const { data, error } = await supabase
      .from('Map Features')
      .select('asset_id')
      .eq('id', dbId)
      .maybeSingle();
    if (error) {
      console.error('asset lookup error:', error.message);
      return null;
    }
    return data?.asset_id ?? null;
  };

  const loadAndRender = async (resolvedAssetId = null) => {
    const result = await loadObservations(getLookupScope(resolvedAssetId));
    if (result.error) {
      list.innerHTML = `<div class="obs-item"><div class="obs-time">Load failed</div><div class="obs-payload">${result.error.message}</div></div>`;
      return;
    }
    renderObservations(list, result.rows);
  };

  const linkedOnLoad = await getDbLinkedAssetId();
  if (linkedOnLoad && !assetInput.value.trim()) {
    assetInput.value = linkedOnLoad;
    feature.properties.asset_id = linkedOnLoad;
  }

  if (assetInput.value.trim()) {
    await loadAndRender(assetInput.value.trim());
  } else {
    list.innerHTML = '<div class="obs-item"><div class="obs-time">No asset linked</div><div class="obs-payload">Set asset ID for this point to view and add observations.</div></div>';
  }
  refreshBtn.onclick = () => {
    const linked = assetInput.value.trim();
    if (!linked) {
      list.innerHTML = '<div class="obs-item"><div class="obs-time">No asset linked</div><div class="obs-payload">Set asset ID for this point to view and add observations.</div></div>';
      return;
    }
    void loadAndRender(linked);
  };
  assetInput.onchange = () => {
    const linked = assetInput.value.trim();
    if (!linked) {
      list.innerHTML = '<div class="obs-item"><div class="obs-time">No asset linked</div><div class="obs-payload">Set asset ID for this point to view and add observations.</div></div>';
      return;
    }
    void loadAndRender(linked);
  };

  const isLinkedToAsset = Boolean(linkedOnLoad || initialAssetId);
  const assetHint = isLinkedToAsset
    ? ''
    : 'This point is not linked to an asset yet.';

  form.style.display = '';
  fields.style.display = '';
  saveBtn.style.display = '';
  const canWrite = CAN_WRITE_OBSERVATIONS.has(role ?? '');
  roleHint.textContent = canWrite
    ? (role === 'akimat'
      ? `${assetHint} Government official mode enabled: you can submit official utility observations.`.trim()
      : `${assetHint} Role "${role}" data entry mode enabled.`.trim())
    : `${assetHint} Role "${role ?? 'unknown'}" is not marked as writer in UI, but you can still try saving (database policy decides).`.trim();
  renderObservationFields(role);

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    saveBtn.classList.remove('error');
    if (observationsAccessBlocked) {
      roleHint.textContent = 'Observations insert is blocked by RLS for your account. Ask admin to grant akimat insert policy.';
      saveBtn.textContent = 'RLS blocked';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 2000);
      return;
    }

    const rawAssetId = assetInput.value.trim();
    if (rawAssetId && !isUuid(rawAssetId)) {
      saveBtn.textContent = 'Invalid Asset ID';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      assetHintEl.textContent = 'Asset ID must be UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).';
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 2200);
      return;
    }

    const dbLinkedAssetId = await getDbLinkedAssetId();

    let nextAssetId = rawAssetId || null;
    if (!nextAssetId && dbLinkedAssetId && isUuid(dbLinkedAssetId)) {
      nextAssetId = dbLinkedAssetId;
    }
    if (!nextAssetId) nextAssetId = crypto.randomUUID();

    assetInput.value = nextAssetId;

    if (nextAssetId && !assetsAccessBlocked) {
      const assetProvisioned = await ensureAssetRecordExists(nextAssetId);
      if (!assetProvisioned) {
        assetHintEl.textContent = 'Could not auto-provision assets row; will still keep and use this feature asset_id.';
      }
    }

    if (dbLinkedAssetId && nextAssetId && dbLinkedAssetId !== nextAssetId) {
      saveBtn.textContent = 'Already linked';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      assetHintEl.textContent = `This feature is already linked to asset "${dbLinkedAssetId}".`;
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 2400);
      return;
    }

    const featureCoords = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : null;
    const featureCoordKey = getCoordKey(feature.geometry);
    if (!featureCoordKey) {
      saveBtn.textContent = 'Point required';
      saveBtn.classList.add('error');
      saveBtn.disabled = false;
      assetHintEl.textContent = 'Asset mapping requires a valid point coordinate.';
      setTimeout(() => {
        saveBtn.textContent = 'Add observation';
        saveBtn.classList.remove('error');
      }, 2200);
      return;
    }
    if (nextAssetId) {
      const existing = await supabase
        .from('Map Features')
        .select('id, geometry, asset_id, coord_key')
        .eq('asset_id', nextAssetId)
        .neq('id', dbId)
        .limit(1)
        .maybeSingle();
      if (existing.error) {
        console.error('asset duplicate check error:', existing.error.message);
      } else if (existing.data) {
        const existingCoords = existing.data.geometry?.coordinates;
        const existingCoordKey = existing.data.coord_key
          || (Array.isArray(existingCoords) ? `${Number(existingCoords[0]).toFixed(6)},${Number(existingCoords[1]).toFixed(6)}` : null);
        const samePoint = Array.isArray(existingCoords)
          && Array.isArray(featureCoords)
          && existingCoords[0] === featureCoords[0]
          && existingCoords[1] === featureCoords[1];
        if (!samePoint && existingCoordKey !== featureCoordKey) {
          saveBtn.textContent = 'Asset already mapped';
          saveBtn.classList.add('error');
          saveBtn.disabled = false;
          assetHintEl.textContent = `Asset "${nextAssetId}" is already linked to another coordinate.`;
          setTimeout(() => {
            saveBtn.textContent = 'Add observation';
            saveBtn.classList.remove('error');
          }, 2600);
          return;
        }
      }
    }

    if (!dbLinkedAssetId && nextAssetId) {
      const linkUpdate = await supabase
        .from('Map Features')
        .update({ asset_id: nextAssetId, coord_key: featureCoordKey })
        .eq('id', dbId);
      if (linkUpdate.error) {
        const linkFkError = linkUpdate.error.code === '23503'
          || linkUpdate.error.message?.includes('asset_id_fkey');
        if (linkFkError && assetsAccessBlocked) {
          assetHintEl.textContent = 'Feature link to assets is blocked by RLS; current feature asset_id remains local.';
        } else {
          console.error('feature asset link update error:', linkUpdate.error.message);
          saveBtn.textContent = 'Link failed';
          saveBtn.classList.add('error');
          saveBtn.disabled = false;
          assetHintEl.textContent = `Could not link feature to asset: ${linkUpdate.error.message}`;
          setTimeout(() => {
            saveBtn.textContent = 'Add observation';
            saveBtn.classList.remove('error');
          }, 2600);
          return;
        }
      }
      if (nextAssetId) feature.properties.asset_id = nextAssetId;
    }

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
      const isRlsError = error.code === '42501'
        || /row-level security|permission|forbidden|not allowed/i.test(error.message ?? '');
      if (isRlsError) {
        observationsAccessBlocked = true;
      }
      const isAssetFkViolation = error.code === '23503'
        || error.message?.includes('observations_asset_id_fkey');
      if (isAssetFkViolation && nextAssetId) {
        const retry = await supabase
          .from('observations')
          .insert([{
            ...insertRow,
            asset_id: null,
          }]);
        if (!retry.error) {
          assetHintEl.textContent = 'Observation saved without asset_id due FK/RLS restrictions.';
        } else {
          console.error('insert observation retry error:', retry.error.message);
          roleHint.textContent = `Insert failed: ${retry.error.message}`;
          saveBtn.textContent = 'Insert failed';
          saveBtn.classList.add('error');
          saveBtn.disabled = false;
          setTimeout(() => {
            saveBtn.textContent = 'Add observation';
            saveBtn.classList.remove('error');
          }, 1800);
          return;
        }
      } else {
        console.error('insert observation error:', error.message);
        roleHint.textContent = `Insert failed: ${error.message}`;
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

    const refreshed = await loadObservations(getLookupScope(nextAssetId));
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
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    userProperties: true,
    styles: DRAW_STYLES,
  });

  map.addControl(draw);
  setActiveDraw(draw);

  // Live color preview
  document.getElementById('feature-color').addEventListener('input', e => {
    if (!activeFeature) return;
    safeSetFeatureProperty(draw, activeFeature.id, 'color', e.target.value);
    map.triggerRepaint();
  });

  setupIconPicker(map, draw);

  const saved = await loadFeatures();
  if (saved) {
    draw.add(saved);
    for (const feat of saved.features) {
      drawIdToDbId.set(feat.id, feat.properties?.id ?? feat.id);
      safeSetFeatureProperty(draw, feat.id, 'color', feat.properties?.color ?? DEFAULT_FEATURE_COLOR);
      if (feat.geometry.type === 'Point' && feat.properties.icon) {
        updateIconMarker(map, feat.id, feat.geometry.coordinates,
          feat.properties.icon, feat.properties.icon_url);
      }
    }
  }

  await initTrafficLights({ draw, map });

  // Subscribe to Map Features updates from the simulator
  supabase.channel('map-features-sync')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: '"Map Features"' }, (payload) => {
      const dbId = payload.new?.id;
      if (!dbId) return;
      
      // Find the local draw feature ID
      const drawId = [...drawIdToDbId.entries()].find(([k, v]) => v === dbId)?.[0];
      if (!drawId) {
        console.warn(`Feature ${dbId} not found in drawIdToDbId map!`);
        return;
      }
      
      // Sync color
      const newColor = payload.new.color ?? DEFAULT_FEATURE_COLOR;
      safeSetFeatureProperty(draw, drawId, 'color', newColor);
      
      // Sync icon immediately
      if (payload.new.type === 'Point' && payload.new.icon) {
         updateIconMarker(map, drawId, payload.new.geometry?.coordinates, payload.new.icon, payload.new.icon_url);
      }
      
      // Force Mapbox Draw to re-eval styles and MapLibre to repaint
      const currentFeat = draw.get(drawId);
      if (currentFeat) draw.add(currentFeat);
      map.triggerRepaint();
    })
    .subscribe();

  // Toolbar mode buttons
  document.querySelectorAll('.draw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      draw.changeMode(btn.dataset.mode);
      document.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const deleteButton = document.getElementById('draw-delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      const selected = draw.getSelected();
      for (const feature of selected.features) {
        const id = feature.properties.id ?? feature.id;
        await deleteFeature(id);
        draw.delete(feature.id);
        iconMarkers.get(feature.id)?.remove();
        iconMarkers.delete(feature.id);
      }
    });
  }

  map.on('draw.create', async e => {
    const feature = e.features[0];
    const dbId = crypto.randomUUID();
    feature.properties.id = dbId;
    if (!feature.properties.color) feature.properties.color = DEFAULT_FEATURE_COLOR;
    safeSetFeatureProperty(draw, feature.id, 'id', dbId);
    safeSetFeatureProperty(draw, feature.id, 'color', feature.properties.color);
    drawIdToDbId.set(feature.id, dbId);
    await ensurePointAssetId(feature, dbId);
    if (feature.properties.asset_id) {
      safeSetFeatureProperty(draw, feature.id, 'asset_id', feature.properties.asset_id);
    }
    await saveFeature(feature);
    syncPointIconMarkers(draw, map);
    openFeatureSidebar(feature, draw, map);
  });

  map.on('draw.update', async e => {
    for (const feature of e.features) {
      const dbId = resolveFeatureDbId(feature);
      if (dbId && feature.properties?.id !== dbId) {
        safeSetFeatureProperty(draw, feature.id, 'id', dbId);
      }
      await ensurePointAssetId(feature, dbId);
      if (feature.properties?.asset_id) {
        safeSetFeatureProperty(draw, feature.id, 'asset_id', feature.properties.asset_id);
      }
      safeSetFeatureProperty(draw, feature.id, 'color', feature.properties?.color ?? DEFAULT_FEATURE_COLOR);
      await saveFeature(feature);
      if (feature.geometry.type === 'Point') {
        updateIconMarker(map, feature.id, feature.geometry.coordinates,
          feature.properties.icon, feature.properties.icon_url);
      }
    }
    syncPointIconMarkers(draw, map);
  });

  map.on('draw.delete', () => {
    syncPointIconMarkers(draw, map);
  });

  map.on('idle', () => {
    syncPointIconMarkers(draw, map);
  });

  syncPointIconMarkers(draw, map);
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
      const dbId = resolveFeatureDbId(activeFeature);
      if (dbId) setupTrafficLightUI({ dbId, draw, map, feature: activeFeature });
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
    const dbId = resolveFeatureDbId(activeFeature);
    if (dbId) setupTrafficLightUI({ dbId, draw, map, feature: activeFeature });
  });
}
