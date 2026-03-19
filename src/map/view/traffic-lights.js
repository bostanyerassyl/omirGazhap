import { supabase } from '../supabase.js';
import { updateIconMarker } from './features.js';

const STATE_TO_COLOR = {
  red: '#ef4444',
  yellow: '#f59e0b',
  green: '#22c55e',
};

let drawRef = null;
let mapRef = null;
let channel = null;
const byFeatureId = new Map();

function safeSetFeatureProperty(draw, featureId, key, value) {
  if (!draw || !featureId) return;
  try {
    const exists = draw.get(featureId);
    if (!exists) return;
    draw.setFeatureProperty(featureId, key, value);
  } catch {
    // noop
  }
}

function resolveDrawFeatureByDbId(featureId) {
  if (!drawRef) return null;
  if (drawRef.get(featureId)) return drawRef.get(featureId);
  const all = drawRef.getAll()?.features ?? [];
  return all.find((f) => f.properties?.id === featureId) ?? null;
}

function applyStateLocal(featureId, state) {
  const color = STATE_TO_COLOR[state];
  if (!color) return;
  byFeatureId.set(featureId, state);

  const feature = resolveDrawFeatureByDbId(featureId);
  if (!feature) return;

  safeSetFeatureProperty(drawRef, feature.id, 'color', color);
  safeSetFeatureProperty(drawRef, feature.id, 'traffic_light_state', state);
  
  // Custom Icon logic for points
  if (feature.geometry?.type === 'Point') {
    const icon = state === 'red' ? '🔴' : state === 'green' ? '🟢' : '🟡';
    safeSetFeatureProperty(drawRef, feature.id, 'icon', icon);
    if (mapRef) {
      updateIconMarker(mapRef, feature.id, feature.geometry.coordinates, icon, null);
    }
  }

  mapRef?.triggerRepaint();
}

export function getTrafficLightState(featureId) {
  return byFeatureId.get(featureId) ?? null;
}

export async function setTrafficLightState(featureId, state) {
  if (!featureId || !STATE_TO_COLOR[state]) {
    return { ok: false, error: 'Invalid feature/state' };
  }

  const { error } = await supabase
    .from('traffic_lights')
    .upsert([{ feature_id: featureId, state }], { onConflict: 'feature_id' });

  if (error) {
    console.error('setTrafficLightState error:', error.message);
    return { ok: false, error: error.message };
  }

  applyStateLocal(featureId, state);

  // Keep Map Features color in sync for persisted rendering.
  const color = STATE_TO_COLOR[state];
  const update = await supabase
    .from('Map Features')
    .update({ color })
    .eq('id', featureId);
  if (update.error) {
    console.warn('traffic light color sync warning:', update.error.message);
  }

  return { ok: true };
}

export async function initTrafficLights({ draw, map }) {
  drawRef = draw;
  mapRef = map;

  const { data, error } = await supabase
    .from('traffic_lights')
    .select('feature_id, state');

  if (error) {
    console.warn('traffic_lights init warning:', error.message);
    return;
  }

  for (const row of data ?? []) {
    applyStateLocal(row.feature_id, row.state);
  }

  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }

  channel = supabase
    .channel('traffic-lights')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'traffic_lights' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.feature_id;
        if (!id) return;
        byFeatureId.delete(id);
        return;
      }
      const row = payload.new;
      if (!row?.feature_id || !row?.state) return;
      applyStateLocal(row.feature_id, row.state);
    })
    .subscribe();
}

export function teardownTrafficLights() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  drawRef = null;
  mapRef = null;
  byFeatureId.clear();
}
