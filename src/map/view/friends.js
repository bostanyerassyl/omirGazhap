import maplibregl from 'maplibre-gl';
import { supabase } from '../supabase.js';
import { dom, resetSidebar, openSidebar, renderBanner, setActiveContext, setActiveBanner } from './sidebar.js';

const friendMarkers = new Map();
let friendsChannel = null;
let activeMap = null;
let friendsVisible = true;
let ownerColumn = null;
let activeUserId = null;

function getCurrentUserId() {
  try {
    const raw = window.localStorage.getItem('auth.snapshot');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const candidate = parsed?.user?.id ?? parsed?.userId ?? parsed?.id ?? null;
    return typeof candidate === 'string' && candidate ? candidate : null;
  } catch {
    return null;
  }
}

async function detectOwnerColumn() {
  if (ownerColumn !== null) return ownerColumn;
  const candidates = ['created_by', 'user_id', 'owner_id'];
  for (const col of candidates) {
    const probe = await supabase.from('Friends').select(`id, ${col}`).limit(1);
    if (!probe.error) {
      ownerColumn = col;
      return ownerColumn;
    }
    if (!/column|schema cache|does not exist/i.test(probe.error.message ?? '')) {
      // Column may exist but another error occurred (e.g. RLS); still use this candidate.
      ownerColumn = col;
      return ownerColumn;
    }
  }
  ownerColumn = '';
  return ownerColumn;
}

function belongsToActiveUser(friendRow) {
  if (!ownerColumn || !activeUserId) return true;
  return friendRow?.[ownerColumn] === activeUserId;
}

export async function loadFriends(map) {
  activeMap = map;
  const userId = getCurrentUserId();
  activeUserId = userId;
  const ownerCol = await detectOwnerColumn();
  let query = supabase.from('Friends').select('*');
  if (ownerCol && userId) query = query.eq(ownerCol, userId);
  const { data, error } = await query;
  if (error) { console.error('loadFriends error:', error.message); return; }
  for (const friend of data) upsertFriendMarker(map, friend);

  if (friendsChannel) {
    supabase.removeChannel(friendsChannel);
    friendsChannel = null;
  }

  friendsChannel = supabase.channel('friends');
  friendsChannel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Friends' }, payload => {
      if (!activeMap) return;
      if (!belongsToActiveUser(payload.new)) return;
      upsertFriendMarker(activeMap, payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Friends' }, payload => {
      if (!activeMap) return;
      if (!belongsToActiveUser(payload.new)) {
        const marker = friendMarkers.get(payload.new?.id);
        if (marker) {
          marker.remove();
          friendMarkers.delete(payload.new.id);
        }
        return;
      }
      upsertFriendMarker(activeMap, payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'Friends' }, payload => {
      if (!belongsToActiveUser(payload.old)) return;
      const old = payload.old;
      const marker = friendMarkers.get(old.id);
      if (marker) {
        marker.remove();
        friendMarkers.delete(old.id);
      }
    })
    .subscribe();
}

function upsertFriendMarker(map, friend) {
  const existing = friendMarkers.get(friend.id);
  if (existing) {
    const el = existing.getElement();
    const avatar = el.querySelector('.friend-avatar');
    const name = el.querySelector('.friend-name');
    if (avatar) {
      avatar.innerHTML = friend.avatar_url
        ? `<img src="${friend.avatar_url}" alt="${friend.name}" />`
        : `<span>${friend.name[0].toUpperCase()}</span>`;
    }
    if (name) name.textContent = friend.name;
    existing.setLngLat([friend.longitude, friend.latitude]);
    existing.getElement().style.display = friendsVisible ? '' : 'none';
    return;
  }

  const el = document.createElement('div');
  el.className = 'friend-marker';
  el.dataset.id = friend.id;
  el.innerHTML = `
    <div class="friend-avatar">
      ${friend.avatar_url
        ? `<img src="${friend.avatar_url}" alt="${friend.name}" />`
        : `<span>${friend.name[0].toUpperCase()}</span>`}
    </div>
    <div class="friend-name">${friend.name}</div>
  `;
  el.addEventListener('click', e => { e.stopPropagation(); openFriendSidebar(friend); });
  const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([friend.longitude, friend.latitude]).addTo(map);
  marker.getElement().style.display = friendsVisible ? '' : 'none';
  friendMarkers.set(friend.id, marker);
}

export async function addFriend(friendInput) {
  const userId = getCurrentUserId();
  const ownerCol = await detectOwnerColumn();
  const payload = {
    name: String(friendInput?.name ?? '').trim(),
    avatar_url: friendInput?.avatar_url || null,
    latitude: Number(friendInput?.latitude),
    longitude: Number(friendInput?.longitude),
  };
  if (ownerCol && userId) {
    payload[ownerCol] = userId;
  }

  if (!payload.name) {
    return { ok: false, error: 'Name is required' };
  }
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    return { ok: false, error: 'Latitude and longitude are required' };
  }

  const { data, error } = await supabase
    .from('Friends')
    .insert([payload])
    .select('*')
    .single();
  if (error) {
    console.error('addFriend error:', error.message);
    return { ok: false, error: error.message };
  }
  if (activeMap && data) upsertFriendMarker(activeMap, data);
  return { ok: true, friend: data };
}

export function teardownFriends() {
  if (friendsChannel) {
    supabase.removeChannel(friendsChannel);
    friendsChannel = null;
  }
  activeMap = null;
  activeUserId = null;
}

export function setFriendsVisibility(nextVisible) {
  friendsVisible = Boolean(nextVisible);
  for (const marker of friendMarkers.values()) {
    marker.getElement().style.display = friendsVisible ? '' : 'none';
  }
}

function openFriendSidebar(friend) {
  resetSidebar();
  setActiveContext({ type: 'friend', id: friend.id });

  dom.buildingName.textContent = friend.name;
  dom.buildingMeta.textContent =
    `📍 ${friend.latitude.toFixed(5)}, ${friend.longitude.toFixed(5)} · ${new Date(friend.last_seen).toLocaleString()}`;

  setActiveBanner(friend.avatar_url ?? null);
  renderBanner();

  // Friends are read-only — hide all editable sections and save button
  dom.buildingSections.forEach(s => { if (s) s.style.display = 'none'; });
  dom.btnSave.style.display = 'none';
  openSidebar();
}
