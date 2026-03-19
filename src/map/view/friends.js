import maplibregl from 'maplibre-gl';
import { supabase } from '../supabase.js';
import { dom, resetSidebar, openSidebar, renderBanner, setActiveContext, setActiveBanner } from './sidebar.js';

const friendMarkers = new Map();

export async function loadFriends(map) {
  const { data, error } = await supabase.from('Friends').select('*');
  if (error) { console.error('loadFriends error:', error.message); return; }
  for (const friend of data) addFriendMarker(map, friend);

  supabase.channel('friends')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Friends' }, payload => {
      const f = payload.new;
      friendMarkers.get(f.id)?.setLngLat([f.longitude, f.latitude]);
    })
    .subscribe();
}

function addFriendMarker(map, friend) {
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
