import maplibregl from 'maplibre-gl';
import {
  dom,
  openSidebar,
  renderBanner,
  resetSidebar,
  setActiveBanner,
  setActiveContext,
} from './sidebar.js';
import { poiService } from '@/services/domain/poiService'

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
  const candidate = String(value ?? '').trim().toLowerCase();
  const aliasMap = {
    ramp: 'ramps',
    ramps: 'ramps',
    scooter: 'scooters',
    scooters: 'scooters',
    event: 'events',
    events: 'events',
    bus: 'buses',
    buses: 'buses',
    bus_stop: 'buses',
    busstop: 'buses',
  };
  const normalized = aliasMap[candidate] ?? candidate;
  return CATEGORY_META[normalized] ? normalized : null;
}

function isFiniteCoord(value) {
  return Number.isFinite(Number(value));
}

function isValidLatLng(latitude, longitude) {
  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
  );
}

function normalizePoiItem(raw) {
  const category = normalizeCategory(raw?.category);
  const name = String(raw?.name ?? '').trim();
  const latitude = Number(raw?.latitude);
  const longitude = Number(raw?.longitude);

  if (!category || !name || !isValidLatLng(latitude, longitude)) return null;

  return {
    id: String(raw?.id ?? '').trim() || crypto.randomUUID(),
    category,
    name,
    description: String(raw?.description ?? '').trim() || null,
    latitude,
    longitude,
    image: raw?.image ?? null,
    created_at: raw?.created_at ?? new Date().toISOString(),
  };
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

  // attempt to load from DB first
  let remoteItems = []
  try {
    const result = await poiService.list()
    if (result.data && !result.error) {
      remoteItems = result.data
    }
  } catch (e) {
    // ignore; fallback to localStorage
  }

  // merge with localStorage cache (avoid duplicates)
  const localItems = safeReadStorage().map(normalizePoiItem).filter(Boolean)

  const byId = new Map()
  for (const item of [...remoteItems, ...localItems]) {
    byId.set(item.id, item)
  }

  poiItems = Array.from(byId.values())
  safeWriteStorage()
  renderAll(map)
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
  if (!isValidLatLng(latitude, longitude)) {
    return { ok: false, error: 'Coordinates are out of range' };
  }

  const duplicate = poiItems.find((existing) => {
    const sameCategory = existing.category === category;
    const sameName = existing.name.toLowerCase() === name.toLowerCase();
    const closeEnough =
      Math.abs(Number(existing.latitude) - latitude) < 0.00001
      && Math.abs(Number(existing.longitude) - longitude) < 0.00001;
    return sameCategory && sameName && closeEnough;
  });

  if (duplicate) {
    const updated = {
      ...duplicate,
      description: String(input?.description ?? '').trim() || null,
      created_at: new Date().toISOString(),
    };
    poiItems = poiItems.map((existing) => (existing.id === duplicate.id ? updated : existing));
    safeWriteStorage();
    if (activeMap) upsertPoiMarker(activeMap, updated);
    return { ok: true };
  }

  const localItem = {
    id: crypto.randomUUID(),
    category,
    name,
    description: String(input?.description ?? '').trim() || null,
    latitude,
    longitude,
    image: null,
    created_at: new Date().toISOString(),
  };

  // Persist to backend (best-effort); keep local copy regardless.
  try {
    const createResult = await poiService.create({
      category,
      name,
      description: localItem.description,
      latitude,
      longitude,
      createdBy: null,
    });

    if (createResult.data && !createResult.error) {
      // prefer DB id; preserve existing marker style
      const dbItem = {
        ...localItem,
        id: createResult.data.id,
        created_at: createResult.data.createdAt,
      };
      poiItems = [dbItem, ...poiItems];
      if (activeMap) upsertPoiMarker(activeMap, dbItem);
    } else {
      poiItems = [localItem, ...poiItems];
      if (activeMap) upsertPoiMarker(activeMap, localItem);
      if (createResult.error) {
        console.warn('poi.create failed, falling back to localStorage', createResult.error);
      }
    }
  } catch (err) {
    poiItems = [localItem, ...poiItems];
    if (activeMap) upsertPoiMarker(activeMap, localItem);
    console.warn('poi.create threw, falling back to localStorage', err);
  }

  safeWriteStorage();
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
