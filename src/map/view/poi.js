import maplibregl from 'maplibre-gl';
import {
  dom,
  openSidebar,
  renderBanner,
  resetSidebar,
  setActiveBanner,
  setActiveContext,
} from './sidebar.js';

const STORAGE_KEY = 'alatau.map.poi.v1';
const poiMarkers = new Map();
let activeMap = null;
let poiItems = [];
let visibility = {
  ramps: true,
  scooters: true,
  events: true,
  buses: true,
};

const CATEGORY_META = {
  ramps: { icon: '♿', label: 'Ramp' },
  scooters: { icon: '🛴', label: 'Scooter' },
  events: { icon: '📅', label: 'Event' },
  buses: { icon: '🚌', label: 'Bus Stop' },
};

function safeReadStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(poiItems));
  } catch {
    // ignore storage quota/private mode issues
  }
}

function normalizeCategory(value) {
  const candidate = String(value ?? '').trim();
  return CATEGORY_META[candidate] ? candidate : null;
}

function isFiniteCoord(value) {
  return Number.isFinite(Number(value));
}

function shouldShow(item) {
  return visibility[item.category] !== false;
}

function openPoiSidebar(item) {
  resetSidebar();
  setActiveContext({ type: 'poi', id: item.id });
  dom.buildingName.textContent = item.name;
  dom.buildingMeta.textContent = `${CATEGORY_META[item.category]?.label ?? 'Point'} · ${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`;
  setActiveBanner(item.image ?? null);
  renderBanner();
  dom.buildingSections.forEach((section) => {
    if (section) section.style.display = 'none';
  });
  dom.btnSave.style.display = 'none';
  openSidebar();
}

function removePoiMarker(id) {
  const marker = poiMarkers.get(id);
  if (!marker) return;
  marker.remove();
  poiMarkers.delete(id);
}

function upsertPoiMarker(map, item) {
  removePoiMarker(item.id);
  if (!shouldShow(item)) return;

  const icon = CATEGORY_META[item.category]?.icon ?? '📍';
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'poi-marker';
  el.dataset.category = item.category;
  el.innerHTML = `<span class="poi-marker-icon">${icon}</span>`;
  el.addEventListener('click', (event) => {
    event.stopPropagation();
    openPoiSidebar(item);
  });

  const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([Number(item.longitude), Number(item.latitude)])
    .addTo(map);
  poiMarkers.set(item.id, marker);
}

function renderAll(map) {
  for (const item of poiItems) upsertPoiMarker(map, item);
}

export async function loadPoi(map) {
  activeMap = map;
  poiItems = safeReadStorage();
  renderAll(map);
}

export async function addPoi(input) {
  const category = normalizeCategory(input?.category);
  const name = String(input?.name ?? '').trim();
  const latitude = Number(input?.latitude);
  const longitude = Number(input?.longitude);

  if (!category) return { ok: false, error: 'Unsupported category' };
  if (!name) return { ok: false, error: 'Name is required' };
  if (!isFiniteCoord(latitude) || !isFiniteCoord(longitude)) {
    return { ok: false, error: 'Latitude and longitude are required' };
  }

  const item = {
    id: crypto.randomUUID(),
    category,
    name,
    description: String(input?.description ?? '').trim() || null,
    latitude,
    longitude,
    image: null,
    created_at: new Date().toISOString(),
  };

  poiItems = [item, ...poiItems];
  safeWriteStorage();
  if (activeMap) upsertPoiMarker(activeMap, item);
  return { ok: true };
}

export function setPoiVisibility(next) {
  visibility = { ...visibility, ...next };
  if (!activeMap) return;
  for (const item of poiItems) {
    upsertPoiMarker(activeMap, item);
  }
}

export function teardownPoi() {
  for (const marker of poiMarkers.values()) marker.remove();
  poiMarkers.clear();
  activeMap = null;
}
