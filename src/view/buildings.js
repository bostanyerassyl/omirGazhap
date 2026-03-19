import { supabase } from '../supabase.js';
import {
    getActiveContext,
    getActiveBanner, getActiveTags,
    dom, resetSidebar, openSidebar, renderBanner, renderTags,
    setActiveContext, setActiveBanner, setActiveTags
} from './sidebar.js';

// ── STORE ─────────────────────────────────────────────────────────────────────
async function getBuilding(key) {
    const { data, error } = await supabase
        .from('Building Data').select('*').eq('key', key).maybeSingle();
    if (error) console.error('getBuilding error:', error.message);
    return data ?? { title: null, description: null, image: null, tags: [], levels: null, type: null, roof: null, min_height: null };
}

async function saveBuilding(key, data) {
    const { error } = await supabase.from('Building Data').upsert({
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

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
export async function openBuildingSidebar(key, tileProps) {
    resetSidebar();
    setActiveContext({ type: 'building', key });
    dom.buildingMeta.textContent = `key: ${key}`;
    openSidebar();

    const data = await getBuilding(key);

    // ── Guard: if the user clicked something else while we were fetching, bail ──
    if (getActiveContext()?.type !== 'building' || getActiveContext()?.key !== key) return;

    dom.buildingName.textContent = data.title || tileProps?.name || 'Building';
    dom.inputLevels.value = data.levels ?? tileProps?.render_height ?? tileProps?.building_levels ?? '';
    dom.inputType.value = data.type ?? tileProps?.building ?? tileProps?.class ?? '';
    dom.inputRoof.value = data.roof ?? tileProps?.roof_shape ?? '';
    dom.inputMinHeight.value = data.min_height ?? tileProps?.render_min_height ?? '';
    dom.descTextarea.value = data.description ?? '';

    setActiveTags(Array.isArray(data.tags) ? [...data.tags] : []);
    setActiveBanner(data.image ?? null);
    renderTags();
    renderBanner();

    dom.btnSave.onclick = async () => {
        dom.btnSave.textContent = 'Saving…';
        dom.btnSave.disabled = true;
        await saveBuilding(key, {
            title: dom.buildingName.textContent === 'Building' ? null : dom.buildingName.textContent,
            description: dom.descTextarea.value || null,
            image: getActiveBanner() ?? null,
            tags: [...getActiveTags()],
            levels: dom.inputLevels.value || null,
            type: dom.inputType.value || null,
            roof: dom.inputRoof.value || null,
            minHeight: dom.inputMinHeight.value || null,
        });
        dom.btnSave.textContent = 'Saved ✓';
        dom.btnSave.classList.add('saved');
        dom.btnSave.disabled = false;
        setTimeout(() => { dom.btnSave.textContent = 'Save changes'; dom.btnSave.classList.remove('saved'); }, 1800);
    };
}
