import maplibregl from 'maplibre-gl';
import { supabase } from '../supabase.js';
import { dom, resetSidebar, openSidebar, renderBanner, setActiveContext, setActiveBanner } from './sidebar.js';

const friendMarkers = new Map();
let friendsChannel = null;
let activeMap = null;

export async function loadFriends(map) {
  activeMap = map;
  const { data, error } = await supabase.from('Friends').select('*');
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
      upsertFriendMarker(activeMap, payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Friends' }, payload => {
      if (!activeMap) return;
      upsertFriendMarker(activeMap, payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'Friends' }, payload => {
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
  friendMarkers.set(friend.id, marker);
}

export async function addFriend(friendInput) {
  const payload = {
    name: String(friendInput?.name ?? '').trim(),
    avatar_url: friendInput?.avatar_url || null,
    latitude: Number(friendInput?.latitude),
    longitude: Number(friendInput?.longitude),
  };

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
