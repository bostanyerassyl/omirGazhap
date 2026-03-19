import { supabase } from '../supabase.js';

// ── SHARED SIDEBAR STATE ──────────────────────────────────────────────────────
const state = {
    activeContext: null,
    activeBanner: null,
    activeTags: [],
};

export function setActiveContext(ctx) {
    state.activeContext = ctx;
    activeContext = ctx;
}
export function setActiveBanner(url) {
    state.activeBanner = url;
    activeBanner = url;
}
export function setActiveTags(tags) {
    state.activeTags = tags;
    activeTags = tags;
}

// Getters so other modules always read the current value, not a snapshot
export function getActiveContext() { return state.activeContext; }
export function getActiveBanner() { return state.activeBanner; }
export function getActiveTags() { return state.activeTags; }

// Keep named exports for direct use in sidebar.js itself
export let activeContext = null; // keep this for local use only
let activeBanner = null;
let activeTags = [];

// DOM refs used across modules
export const dom = {
    bannerImg: document.getElementById('banner-img'),
    bannerUpload: document.getElementById('banner-upload'),
    bannerRemove: document.getElementById('banner-remove'),
    buildingName: document.getElementById('building-name'),
    titleInput: document.getElementById('building-title-input'),
    buildingMeta: document.getElementById('building-meta'),
    descTextarea: document.getElementById('desc-textarea'),
    tagInput: document.getElementById('tag-input'),
    tagsContainer: document.getElementById('tags-container'),
    btnSave: document.getElementById('btn-save'),
    inputLevels: document.getElementById('prop-levels'),
    inputType: document.getElementById('prop-type'),
    inputRoof: document.getElementById('prop-roof'),
    inputMinHeight: document.getElementById('prop-minheight'),
    featureSection: document.getElementById('feature-section'),
    // Building-only sections
    buildingSections: [
        document.querySelector('.section:has(#desc-textarea)'),
        document.querySelector('.section:has(#tag-input)'),
        document.querySelector('.section:has(#prop-levels)'),
    ],
};

// ── RESET ─────────────────────────────────────────────────────────────────────
// Call this at the top of EVERY open*Sidebar function.
// Clears all stale content so switching between buildings/features/friends
// never shows leftover data from the previous selection.
export function resetSidebar() {
    state.activeContext = null;
    state.activeBanner = null;
    state.activeTags = [];
    activeContext = null; // keep in sync
    activeBanner = null;
    activeTags = [];

    dom.buildingName.textContent = '…';
    dom.buildingMeta.textContent = '—';
    dom.buildingName.style.display = 'block';
    dom.titleInput.style.display = 'none';

    dom.btnSave.style.display = '';
    dom.btnSave.textContent = 'Save changes';
    dom.btnSave.classList.remove('saved');
    dom.btnSave.disabled = false;
    dom.btnSave.onclick = null;

    // Reset banner display
    dom.bannerImg.classList.remove('loaded');
    dom.bannerRemove.classList.remove('visible');
    dom.bannerImg.src = '';

    // Show all sections by default — individual openers hide what they don't need
    dom.featureSection.style.display = 'none';
    dom.buildingSections.forEach(s => { if (s) s.style.display = ''; });

    // Clear icon picker selection
    document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
}

export function openSidebar() {
    document.body.classList.add('sidebar-open');
}

export function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    resetSidebar();
}

// ── BANNER ────────────────────────────────────────────────────────────────────
export function renderBanner() {
    if (activeBanner) {
        dom.bannerImg.src = activeBanner;
        dom.bannerImg.classList.add('loaded');
        dom.bannerRemove.classList.add('visible');
    } else {
        dom.bannerImg.classList.remove('loaded');
        dom.bannerRemove.classList.remove('visible');
    }
}

dom.bannerRemove.addEventListener('click', e => {
    e.stopPropagation();
    activeBanner = null;
    renderBanner();
});

// Image upload — works for both buildings and features
dom.bannerUpload.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file || !activeContext) return;

    // Immediate local preview
    activeBanner = URL.createObjectURL(file);
    renderBanner();
    dom.bannerImg.style.opacity = '0.5';

    const fileKey = activeContext.type === 'building'
        ? activeContext.key.replace(',', '_')
        : `feature_${activeContext.id}`;
    const filename = `${fileKey}.${file.name.split('.').pop()}`;

    const { error } = await supabase.storage
        .from('building_images')
        .upload(filename, file, { upsert: true, contentType: file.type });

    dom.bannerImg.style.opacity = '1';

    if (error) {
        console.error('Upload failed:', error.message);
        activeBanner = null;
        renderBanner();
        e.target.value = '';
        return;
    }

    const { data } = supabase.storage.from('building_images').getPublicUrl(filename);
    activeBanner = data.publicUrl;
    renderBanner();

    // Auto-save image immediately so re-fetching doesn't revert it
    if (activeContext.type === 'building') {
        await supabase.from('Building Data').upsert({ key: activeContext.key, image: activeBanner });
    } else if (activeContext.type === 'feature') {
        await supabase.from('Map Features').update({ image: activeBanner }).eq('id', activeContext.id);
    }

    e.target.value = '';
});

document.getElementById('sidebar-banner').addEventListener('click', e => {
    if (e.target !== dom.bannerRemove) dom.bannerUpload.click();
});

// ── TAGS ──────────────────────────────────────────────────────────────────────
export function renderTags() {
    dom.tagsContainer.innerHTML = '';
    activeTags.forEach((tag, i) => {
        const el = document.createElement('span');
        el.className = 'tag';
        el.innerHTML = `${tag} <button class="tag-remove" data-i="${i}">×</button>`;
        dom.tagsContainer.appendChild(el);
    });
}

dom.tagsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('tag-remove')) {
        activeTags.splice(+e.target.dataset.i, 1);
        renderTags();
    }
});

dom.tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && dom.tagInput.value.trim()) {
        activeTags.push(dom.tagInput.value.trim());
        dom.tagInput.value = '';
        renderTags();
    }
});

// ── TITLE INLINE EDIT ────────────────────────────────────────────────────────
dom.buildingName.addEventListener('click', () => {
    dom.titleInput.value = dom.buildingName.textContent === 'Building' ? '' : dom.buildingName.textContent;
    dom.buildingName.style.display = 'none';
    dom.titleInput.style.display = 'block';
    dom.titleInput.focus();
});

function commitTitle() {
    dom.buildingName.textContent = dom.titleInput.value.trim() || 'Building';
    dom.buildingName.style.display = 'block';
    dom.titleInput.style.display = 'none';
}

dom.titleInput.addEventListener('blur', commitTitle);
dom.titleInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') dom.titleInput.blur();
    if (e.key === 'Escape') { dom.titleInput.value = dom.buildingName.textContent; dom.titleInput.blur(); }
});

document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
