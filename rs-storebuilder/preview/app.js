'use strict';

const resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'rs-storebuilder';
const byId = (id) => document.getElementById(id);
const all = (selector) => Array.from(document.querySelectorAll(selector));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

const state = {
    open: false, projects: [], project: null, readOnly: true,
    catalog: [], catalogComplete: false, category: 'all', search: '', selectedId: null, blueprints: [],
    previewImages: {}, catalogSelectedModel: null,
    collections: [], advanced: false, guideHidden: false, guide: { category: false, moved: false, saved: false },
    library: 'props', livePreview: true, pedCollections: [], animCollections: [], pedThumbnailUrl: false, poseFlag: 1, pedCategory: 'all', pedSelected: null,
    shop: null,
    editor: { mode: 'walk', positionSnap: 0.05, rotationSnap: 5, transformSpace: 'world', gizmoTool: 'translate', saveState: 'idle' }
};

// Per-viewer UI preferences. Storage can be unavailable in NUI, so every access is guarded.
const prefs = {
    get(key) { try { return window.localStorage.getItem(`rsstore.${key}`); } catch (error) { return null; } },
    set(key, value) { try { window.localStorage.setItem(`rsstore.${key}`, value); } catch (error) { /* not persisted */ } }
};

// Built-in type filters, derived from the model name in shared/catalog.lua.
const TYPE_TABS = [
    { key: 'all', label: 'ALL', hint: 'Every prop in the game. Pick a category above to narrow it down.' },
    { key: 'structure', label: 'STRUCTURE', hint: 'Walls, fences, rails, stairs and building pieces.' },
    { key: 'furniture', label: 'FURNITURE', hint: 'Chairs, tables, sofas, beds and shelves.' },
    { key: 'opening', label: 'OPENINGS', hint: 'Doors, gates, windows and shutters.' },
    { key: 'lighting', label: 'LIGHTS', hint: 'Lamps and light fittings.' }

];
const STORE_CATEGORY_IMAGES = {
    manufactured: 'assets/store_menu/manufactured.jpg', structure: 'assets/store_menu/structure.jpg',
    checkout: 'assets/store_menu/checkout.jpg', displays: 'assets/store_menu/displays.jpg',
    cuisine: 'assets/store_menu/cuisine.jpg', boutique: 'assets/store_menu/boutique.jpg',
    electronics: 'assets/store_menu/electronics.jpg', mechanic: 'assets/store_menu/mechanic.jpg',
    decor: 'assets/store_menu/decor.jpg', stock: 'assets/store_menu/stock.jpg'
};
const TYPE_HERO_IMAGES = {
    all: 'assets/store_menu/manufactured.jpg',
    structure: 'assets/store_menu/structure.jpg',
    furniture: 'assets/store_menu/decor.jpg',
    opening: 'assets/store_menu/checkout.jpg',
    lighting: 'assets/store_menu/electronics.jpg',
    peds: 'assets/store_menu/StockCake-Digital_Shadow_Operative-1492980-medium.jpg'
};
function setCategoryHero(title, hint, image) {
    const hero = byId('categoryHero');
    if (!hero) return;
    byId('categoryHeroTitle').textContent = String(title || 'BUILD LIBRARY').toUpperCase();
    byId('categoryHeroHint').textContent = String(hint || 'Choose an item, preview it in the world, then place it.');
    hero.style.setProperty('--hero-image', `url("${String(image || TYPE_HERO_IMAGES.all).replace(/"/g, '\"')}")`);
}
const MODE_NAMES = { walk: 'WALKING', camera: 'FLY CAMERA', gizmo: 'MOVE TOOL' };

// "amb@world_human_leaning@male@wall@back@foot_up@idle_b" + "idle_d" -> "idle d · world human leaning / male / wall / back / foot up / idle b"
function prettyPose(dict, clip) {
    const place = String(dict).replace(/^(anim|amb|mini|random|special_ped|timetable|switch)@/, '').replace(/@+$/, '').replace(/@/g, ' / ').replace(/_/g, ' ');
    return `${String(clip).replace(/_/g, ' ')} · ${place}`;
}
function selectedPose() {
    const value = byId('poseSelect').value;
    if (!value) return null;
    const [group, index] = value.split(':').map(Number);
    return state.animCollections[group]?.poses?.[index] || null;
}
function renderPosePicker() {
    const select = byId('poseSelect'); const keep = select.value;
    select.innerHTML = '<option value="">STANDING STILL (NO ANIMATION)</option>' + state.animCollections.map((group, g) =>
        `<optgroup label="${escapeHtml(group.label)} · ${(group.poses || []).length}">${(group.poses || []).map((pose, p) =>
            `<option value="${g}:${p}">${escapeHtml(prettyPose(pose.dict, pose.clip))}</option>`).join('')}</optgroup>`).join('');
    if ([...select.options].some((option) => option.value === keep)) select.value = keep;
    renderPoseHint();
}
function renderPoseHint() {
    const pose = selectedPose();
    if (!pose) { byId('poseHint').textContent = 'The ped stands still.'; return; }
    const group = state.animCollections[Number(byId('poseSelect').value.split(':')[0])];
    byId('poseHint').innerHTML = `${escapeHtml(group?.hint || '')}<br><code>${escapeHtml(pose.dict)}</code> › <code>${escapeHtml(pose.clip)}</code>`;
}
// Live preview: what a row click shows in the world before anything is placed.
function previewPed(model) {
    if (!state.livePreview || !state.project) return;
    const pose = selectedPose();
    post('previewModel', { model, kind: 'ped', animDict: pose ? pose.dict : '', animName: pose ? pose.clip : '', animFlag: state.poseFlag });
}
function previewProp(model) {
    if (!state.livePreview || !state.project) return;
    post('previewModel', { model, kind: 'object' });
}
function placePed(model) {
    const pose = selectedPose();
    post('addPed', { model, animDict: pose ? pose.dict : '', animName: pose ? pose.clip : '', animFlag: state.poseFlag });
}
function applyLibrary() {
    const peds = state.library === 'peds';
    document.querySelector('.catalog').dataset.library = state.library;
    all('#librarySwitch button').forEach((button) => button.classList.toggle('active', button.dataset.library === state.library));
    byId('catalogTitle').textContent = peds ? 'PEDS' : 'PROPS';
    byId('catalogSubtitle').textContent = peds ? 'PICK A PED AND A POSE, THEN PLACE' : 'PICK A CATEGORY, THEN PLACE';
    byId('catalogSearch').placeholder = peds ? 'Search peds… e.g. cop, zombie, tramp' : 'Search store parts… e.g. counter, shelf, register';
    if (peds) setCategoryHero('People & Workers', 'Pick a ped, choose a pose, preview it in the world, then place it.', TYPE_HERO_IMAGES.peds);
}

async function post(eventName, data = {}) {
    try {
        const response = await fetch(`https://${resourceName}/${eventName}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        toast(`NUI request failed: ${error.message}`, 'error'); return { ok: false };
    }
}

function toast(message, tone = 'info') {
    const node = document.createElement('div'); node.className = `toast ${tone}`; node.textContent = String(message || '');
    byId('toasts').appendChild(node); setTimeout(() => node.remove(), 4200);
}

function builderKind(entity) { return entity?.metadata?.builder?.kind || 'object'; }
function selectedEntity() { return state.project?.entities?.find((entity) => entity.id === state.selectedId) || null; }
function number(value, places = 4) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed.toFixed(places) : '0.0000'; }

function renderProjects() {
    const rows = state.projects.map((project) => `<article class="project-row">
        <div><strong>${escapeHtml(project.name)}</strong><span>${escapeHtml(project.id)} · ${escapeHtml(String(project.type).toUpperCase())} · REV ${Number(project.revision || 1)}</span></div>
        <button class="load-project" data-project-id="${escapeHtml(project.id)}">${project.ownership === 'mine' ? 'OPEN' : 'VIEW / EDIT'}</button>
    </article>`).join('') || '<div class="empty-state"><b>NO PROJECTS YET</b><span>Type a name on the right and press CREATE HERE.</span></div>';
    byId('projectRows').innerHTML = rows;
    all('.load-project').forEach((button) => button.addEventListener('click', () => post('loadProject', { projectId: button.dataset.projectId })));
}

// Tab keys: 'col:<id>' for a curated collection, otherwise a TYPE_TABS key.
function inCategory(row) {
    if (state.category === 'all') return true;
    if (state.category.startsWith('col:')) return Array.isArray(row.collections) && row.collections.includes(state.category.slice(4));
    return row.category === state.category;
}

function pedThumb(model) { return state.pedThumbnailUrl ? String(state.pedThumbnailUrl).replace('%s', encodeURIComponent(model)) : ''; }

function renderPedTabs() {
    if (state.pedCategory !== 'all' && !state.pedCollections.some((entry) => entry.id === state.pedCategory)) state.pedCategory = 'all';
    const total = state.pedCollections.reduce((sum, entry) => sum + (entry.models || []).length, 0);
    const tab = (key, label, count) => `<button role="tab" data-ped-category="${escapeHtml(key)}" class="collection ${state.pedCategory === key ? 'active' : ''}" aria-selected="${state.pedCategory === key}">${escapeHtml(label)}<span>${Number(count)}</span></button>`;
    byId('categoryTabs').innerHTML = `<div class="category-group">PED TYPES</div>${tab('all', 'ALL', total)}${state.pedCollections.map((entry) => tab(entry.id, entry.label, (entry.models || []).length)).join('')}`;
    all('#categoryTabs button').forEach((button) => button.addEventListener('click', () => {
        state.pedCategory = button.dataset.pedCategory; state.guide.category = true;
        renderPedTabs(); renderPedList(); renderGuide();
    }));
    const collection = state.pedCollections.find((entry) => entry.id === state.pedCategory);
    byId('categoryHint').innerHTML = collection
        ? `<b>${escapeHtml(collection.label)}</b> · ${(collection.models || []).length} peds. ${escapeHtml(collection.hint)}`
        : `Every ped, ${total} in all. Pick a type above to narrow it down.`;
    setCategoryHero(collection?.label || 'People & Workers', collection?.hint || 'Browse workers, customers and scene characters. Preview the pose before placing.', TYPE_HERO_IMAGES.peds);
}

function renderPedList() {
    const query = state.search.trim().toLowerCase(); const rows = []; let matches = 0; let total = 0;
    for (const collection of state.pedCollections) {
        total += (collection.models || []).length;
        if (state.pedCategory !== 'all' && collection.id !== state.pedCategory) continue;
        for (const model of collection.models || []) {
            if (query && !model.includes(query)) continue;
            matches++; if (rows.length < 250) rows.push({ model, label: collection.label });
        }
    }
    byId('catalogCount').textContent = total.toLocaleString();
    byId('catalogLoaded').textContent = matches > rows.length ? `${rows.length} OF ${matches.toLocaleString()} · SEARCH TO NARROW` : `${matches.toLocaleString()} SHOWN`;
    byId('catalogRows').innerHTML = rows.map((row) => `<article class="asset-row ${row.model === state.pedSelected ? 'active' : ''}" data-model="${escapeHtml(row.model)}">
        ${pedThumb(row.model) ? `<img class="ped-thumb" src="${escapeHtml(pedThumb(row.model))}" alt="" loading="lazy" onerror="this.remove()">` : ''}<div><strong>${escapeHtml(row.model)}</strong><small>${escapeHtml(row.label)}</small></div><button class="add-asset" title="Place this ped, doing the chosen pose, in front of you">PLACE</button>
    </article>`).join('') || `<div class="empty-state"><b>${state.pedCollections.length ? 'NO MATCHES' : 'NO PED LIST'}</b><span>${state.pedCollections.length ? 'Try a shorter search, or pick ALL.' : 'shared/ped_collections.lua did not load.'}</span></div>`;
    all('.asset-row').forEach((row) => {
        const add = () => placePed(row.dataset.model);
        row.addEventListener('click', () => { state.pedSelected = row.dataset.model; all('.asset-row').forEach((entry) => entry.classList.toggle('active', entry === row)); previewPed(row.dataset.model); });
        row.querySelector('.add-asset')?.addEventListener('click', (event) => { event.stopPropagation(); add(); }); row.addEventListener('dblclick', add);
    });
}

function renderCategoryTabs() {
    if (state.library === 'peds') return renderPedTabs();
    if (state.category.startsWith('col:') && !state.collections.some((entry) => `col:${entry.id}` === state.category)) state.category = 'all';
    const tab = (key, label, count, extraClass, image = '') => `<button role="tab" data-category="${escapeHtml(key)}" class="${extraClass} ${image ? 'store-category-card' : ''} ${state.category === key ? 'active' : ''}" aria-selected="${state.category === key}" ${image ? `style="--category-image:url('${image}')"` : ''}><b>${escapeHtml(label)}</b>${count ? `<span>${Number(count)}</span>` : ''}</button>`;
    const collections = state.collections.map((entry) => tab(`col:${entry.id}`, entry.label, entry.count, 'collection', STORE_CATEGORY_IMAGES[entry.id] || '')).join('');
    byId('categoryTabs').innerHTML = (collections ? `<div class="category-group">BUILD YOUR STORE</div>${collections}` : '')
        + `<div class="category-group">BY TYPE</div>${TYPE_TABS.map((entry) => tab(entry.key, entry.label, 0, '')).join('')}`;
    all('#categoryTabs button').forEach((button) => button.addEventListener('click', () => {
        state.category = button.dataset.category; state.guide.category = true;
        renderCategoryTabs(); renderCatalog(); renderGuide();
    }));
    const collection = state.collections.find((entry) => `col:${entry.id}` === state.category);
    const type = TYPE_TABS.find((entry) => entry.key === state.category);
    byId('categoryHint').innerHTML = collection
        ? `<b>${escapeHtml(collection.label)}</b> · ${Number(collection.count)} props. ${escapeHtml(collection.hint)}`
        : escapeHtml(type ? type.hint : '');
    setCategoryHero(
        collection?.label || type?.label || 'Build Library',
        collection?.hint || type?.hint || 'Choose a store part, preview it in the world, then place it.',
        collection ? (STORE_CATEGORY_IMAGES[collection.id] || TYPE_HERO_IMAGES.all) : (TYPE_HERO_IMAGES[state.category] || TYPE_HERO_IMAGES.all)
    );
}

function renderCatalog() {
    if (state.library === 'peds') return renderPedList();
    const query = state.search.trim().toLowerCase(); const rows = []; let matches = 0;
    for (const row of state.catalog) {
        if (!inCategory(row)) continue;
        if (query && !row.model.includes(query)) continue;
        matches++; if (rows.length < 250) rows.push(row);
    }
    byId('catalogCount').textContent = state.catalog.length.toLocaleString();
    byId('catalogLoaded').textContent = !state.catalogComplete ? 'LOADING…'
        : matches > rows.length ? `${rows.length} OF ${matches.toLocaleString()} · SEARCH TO NARROW` : `${matches.toLocaleString()} SHOWN`;
    byId('catalogRows').innerHTML = rows.map((row) => `<article class="asset-row ${row.model === state.catalogSelectedModel ? 'active' : ''}" data-model="${escapeHtml(row.model)}">
        ${state.previewImages[row.model] ? `<img src="${escapeHtml(state.previewImages[row.model])}" alt="" onerror="this.remove()">` : ''}<div><strong>${escapeHtml(row.manufactured?.label || row.model)}</strong><small>${escapeHtml(row.model)} · ${escapeHtml(row.manufactured ? 'MANUFACTURED · ' + row.manufactured.portability.replaceAll('_', ' ').toUpperCase() : row.category)}</small></div><button class="add-asset" title="Place this prop in front of you">PLACE</button>
    </article>`).join('') || `<div class="empty-state"><b>${state.catalogComplete ? 'NO MATCHES' : 'LOADING PROPS…'}</b><span>${state.catalogComplete ? 'Try a shorter search, or pick ALL under BY TYPE.' : 'The prop list is still loading.'}</span></div>`;
    all('.asset-row').forEach((row) => {
        const add = () => post('addModel', { model: row.dataset.model, builderKind: byId('placementKind').value });
        row.addEventListener('click', () => { state.catalogSelectedModel = row.dataset.model; renderCatalogPreview(); all('.asset-row').forEach((entry) => entry.classList.toggle('active', entry === row)); previewProp(row.dataset.model); });
        row.querySelector('.add-asset')?.addEventListener('click', (event) => { event.stopPropagation(); add(); }); row.addEventListener('dblclick', add);
    });
    renderCatalogPreview();
}

function renderCatalogPreview() {
    const model = state.catalogSelectedModel;
    const editor = byId('catalogPreviewEditor');
    editor.classList.toggle('is-hidden', !model);
    if (!model) return;
    const src = state.previewImages[model] || '';
    byId('catalogPreviewModel').textContent = model;
    byId('catalogPreviewInput').value = src;
    const image = byId('catalogPreviewImage');
    image.src = src;
    image.style.visibility = src ? 'visible' : 'hidden';
    image.onload = () => { image.style.visibility = 'visible'; };
    image.onerror = () => { image.style.visibility = 'hidden'; };
}

function renderHierarchy() {
    const entities = state.project?.entities || [];
    byId('hierarchyRows').innerHTML = entities.map((entity) => `<article class="hierarchy-row ${entity.id === state.selectedId ? 'active' : ''}" data-object-id="${escapeHtml(entity.id)}">
        <div><strong>${escapeHtml(entity.model)}</strong><small><span class="adv-only">${escapeHtml(entity.id)} · </span>${escapeHtml(builderKind(entity).toUpperCase())}<span class="adv-only"> · ${escapeHtml(entity.layer || 'default')}</span></small></div>
    </article>`).join('') || '<div class="empty-state"><b>EMPTY PROJECT</b><span>Add a model from the catalog.</span></div>';
    all('.hierarchy-row').forEach((row) => row.addEventListener('click', () => post('selectObject', { objectId: row.dataset.objectId })));
}

function renderShellTools() {
    const shellTools = byId('shellTools'); const project = state.project;
    const enabled = project && (project.type === 'shell' || project.type === 'hybrid');
    shellTools.classList.toggle('is-hidden', !enabled); if (!enabled) return;
    const shell = project.shell || state.editor.shell || {};
    byId('shellStatus').textContent = shell.finalized ? `FINALIZED · REV ${shell.validatedRevision || '?'}` : 'DRAFT / DIRTY';
    byId('shellEntryStatus').textContent = shell.entry ? 'ENTRY ✓' : 'ENTRY —';
    byId('shellExitStatus').textContent = shell.exit ? 'EXIT ✓' : 'EXIT —';
    byId('shellSafeStatus').textContent = shell.safeSpawn ? 'SAFE ✓' : 'SAFE —';
    all('#shellTools button, #shellTools input').forEach((control) => { control.disabled = state.readOnly; });
    byId('blueprintsBtn').disabled = false;
}

function fillInspector(entity) {
    const empty = byId('emptyInspector'); const body = byId('inspectorBody');
    renderShellTools();
    if (!entity) { empty.classList.remove('is-hidden'); body.classList.add('is-hidden'); return; }
    empty.classList.add('is-hidden'); body.classList.remove('is-hidden');
    byId('selectedId').textContent = entity.id; byId('selectedModel').textContent = entity.model;
    byId('selectedKind').textContent = builderKind(entity).toUpperCase();
    const position = entity.transform?.position || {}; const rotation = entity.transform?.rotation || {};
    byId('posX').value = number(position.x); byId('posY').value = number(position.y); byId('posZ').value = number(position.z);
    byId('rotX').value = number(rotation.x, 3); byId('rotY').value = number(rotation.y, 3); byId('rotZ').value = number(rotation.z, 3);
    const scale = entity.transform?.scale || {};
    byId('scaleXY').value = number(scale.xy ?? 1, 3); byId('scaleZ').value = number(scale.z ?? 1, 3);
    all('#inspectorBody input, #inspectorBody select, #inspectorBody button').forEach((control) => { control.disabled = state.readOnly; });
    byId('space').disabled = false; byId('positionSnap').disabled = false; byId('rotationSnap').disabled = false;
    const kind = builderKind(entity);
    document.querySelector('[data-transform-action="structSnap"]').disabled = state.readOnly || kind !== 'wall';
    document.querySelector('[data-transform-action="doorToggle"]').disabled = state.readOnly || kind !== 'door';
    // Peds never scale (the server strips it too).
    const isPed = entity.kind === 'ped' || kind === 'ped';
    const decorative = entity.kind === 'object' && entity.properties?.collision === false;
    const hasLegacyScale = Math.abs(Number(scale.xy ?? 1) - 1) >= 0.0005 || Math.abs(Number(scale.z ?? 1) - 1) >= 0.0005;
    byId('decorativeProp').checked = decorative;
    byId('decorativeProp').disabled = state.readOnly || isPed;
    byId('collisionHint').textContent = isPed ? 'Peds do not use prop collision or size controls.' : decorative
        ? (hasLegacyScale ? 'Decorative props can be resized, but players and vehicles pass through them. Set it to real size before turning collision back on.' : 'Decorative props can be resized, but players and vehicles pass through them.')
        : (hasLegacyScale ? 'This older prop is oversized while solid. Use RESET SCALE to repair it before duplicating or publishing.' : 'Solid props stay at real model size so their collision matches what you see.');
    ['scaleXY', 'scaleZ'].forEach((id) => { byId(id).disabled = state.readOnly || isPed || !decorative; });
    document.querySelector('[data-gizmo-tool="scale"]').disabled = state.readOnly || isPed || !decorative;
    document.querySelector('[data-transform-action="resetScale"]').disabled = state.readOnly || isPed || (!decorative && !hasLegacyScale);
}

function renderChrome() {
    byId('editor').classList.toggle('is-positioning', state.editor.placing === true || state.editor.gizmo === true);
    document.body.classList.toggle('positioning', state.editor.placing === true || state.editor.gizmo === true);
    byId('projectName').textContent = state.project?.name || 'NO PROJECT';
    byId('revision').textContent = state.project ? `REV ${Number(state.project.revision)}` : 'REV —';
    const saveState = state.editor.saveState || 'idle'; byId('saveState').textContent = saveState.toUpperCase(); byId('saveState').className = `status-dot is-${saveState}`;
    byId('readOnlyBadge').textContent = !state.project ? '' : state.readOnly ? 'VIEW ONLY' : 'EDITING';
    byId('modeReadout').textContent = MODE_NAMES[state.editor.mode] || String(state.editor.mode || 'walk').toUpperCase();
    byId('snapReadout').textContent = `SNAP ${Number(state.editor.positionSnap || 0)}m / ${Number(state.editor.rotationSnap || 0)}°`;
    all('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === state.editor.mode));
    byId('saveBtn').disabled = !state.project || state.readOnly; byId('undoBtn').disabled = !state.project || state.readOnly; byId('redoBtn').disabled = !state.project || state.readOnly;
    byId('space').value = state.editor.transformSpace || 'world'; byId('positionSnap').value = String(state.editor.positionSnap ?? 0.05);
    byId('rotationSnap').value = String(state.editor.rotationSnap ?? 5); byId('gizmoTool').value = state.editor.gizmoTool || 'translate';
    const gizmoOn = state.editor.mode === 'gizmo';
    all('[data-gizmo-tool]').forEach((button) => button.classList.toggle('active', gizmoOn && button.dataset.gizmoTool === (state.editor.gizmoTool || 'translate')));
    byId('gizmoSpaceBtn').innerHTML = `AXES: ${state.editor.transformSpace === 'local_space' ? 'PROP' : 'WORLD'} <kbd>L</kbd>`;
    byId('freezeMeBtn').textContent = state.editor.playerFrozen ? 'FROZEN' : 'FREEZE ME';
    byId('freezeMeBtn').classList.toggle('active', state.editor.playerFrozen === true);
    renderShellTools(); renderGuide();
}

// Five-step starter guide. A step is done when its evidence exists; the first
// unfinished step is highlighted and spelled out in plain words.
const GUIDE_NEXT = {
    project: 'Next: press MY PROJECTS, then open one or start a new one.',
    category: 'Next: pick a store category on the left, like MANUFACTURED STORES, CHECKOUT or BOUTIQUE.',
    place: 'Next: click a prop to see it live, then PLACE. Fly the camera to aim it, press ENTER for precision, adjust it, then ENTER again to save.',
    move: 'Next: click your prop, then MOVE or ROTATE. The same precision editor used during placement opens around that item.',
    store: 'Next: press STORE SETUP. Name the business and set at least a CHECKOUT point.',
    save: 'Next: press SAVE.',
    done: 'All set. Keep building. GOT IT hides this guide, HELP brings it back.'
};
function renderGuide() {
    const done = {
        project: !!state.project,
        category: state.guide.category,
        place: (state.project?.entities?.length || 0) > 0,
        move: state.guide.moved,
        store: !!state.project?.store?.points?.checkout,
        save: state.guide.saved
    };
    const current = ['project', 'category', 'place', 'move', 'store', 'save'].find((step) => !done[step]) || 'done';
    all('#guideStrip li').forEach((item) => {
        item.classList.toggle('done', done[item.dataset.step] === true);
        item.classList.toggle('current', item.dataset.step === current);
    });
    byId('guideNext').textContent = GUIDE_NEXT[current];
    byId('editor').classList.toggle('has-guide', !state.guideHidden);
    byId('helpBtn').classList.toggle('active', !state.guideHidden);
}

function applyAdvanced() {
    document.body.classList.toggle('simple', !state.advanced);
    byId('advancedBtn').classList.toggle('active', state.advanced);
    byId('advancedBtn').textContent = state.advanced ? 'ADVANCED ON' : 'ADVANCED';
}

function renderBlueprints() {
    byId('blueprintRows').innerHTML = state.blueprints.map((blueprint) => `<article class="project-row blueprint-row">
        <div><strong>${escapeHtml(blueprint.name)}</strong><span>${escapeHtml(blueprint.id)} · ${escapeHtml(String(blueprint.category || 'shell').toUpperCase())}</span></div>
        <button class="load-blueprint" data-blueprint-id="${escapeHtml(blueprint.id)}">LOAD AT PLAYER</button>
    </article>`).join('') || '<div class="empty-state"><b>NO SHELL BLUEPRINTS</b><span>Finalize a shell and save it here.</span></div>';
    all('.load-blueprint').forEach((button) => button.addEventListener('click', () => {
        if (!state.project || state.readOnly) return toast('Load an editable project first.', 'warning');
        post('instantiateBlueprint', { blueprintId: button.dataset.blueprintId }); byId('blueprintDialog').classList.add('is-hidden'); byId('storeDialog').classList.add('is-hidden');
    }));
}

function renderShop(storeId, store, stock = {}, salesContext = {}) { if (window.RSStorefrontUI) return window.RSStorefrontUI.openCustomer(storeId, store, stock, salesContext); }


function productsToText(products) {
    return (products || []).map((row) => `${row.item} | ${row.label || row.item} | ${Number(row.price || 0)}`).join('\n');
}
function parseProducts(text) {
    const rows = [];
    for (const raw of String(text || '').split(/\r?\n/)) {
        if (!raw.trim()) continue;
        const parts = raw.split('|').map((part) => part.trim());
        if (!parts[0] || parts.length < 3 || !Number.isFinite(Number(parts[2]))) throw new Error(`Invalid product line: ${raw}`);
        rows.push({ item: parts[0], label: parts[1] || parts[0], price: Math.max(0, Math.floor(Number(parts[2]))) });
    }
    return rows;
}
function renderStoreSetup() { if (window.RSStorefrontUI) return window.RSStorefrontUI.renderBuilder(state.project?.store || {}); }

function renderAll() { renderChrome(); renderProjects(); renderCatalog(); renderHierarchy(); fillInspector(selectedEntity()); renderStoreSetup(); }
function upsertEntity(entity) { if (!state.project) return; const index = state.project.entities.findIndex((row) => row.id === entity.id); if (index >= 0) state.project.entities[index] = entity; else state.project.entities.push(entity); state.selectedId = entity.id; }
function configureOptions() {
    const position = [0, 1, .5, .25, .1, .05, .01, .001]; const rotation = [0, 90, 45, 15, 5, 1, .1];
    byId('positionSnap').innerHTML = position.map((value) => `<option value="${value}">${value === 0 ? 'FREE' : value.toFixed(value < .1 ? 3 : value < 1 ? 2 : 3)}</option>`).join('');
    byId('rotationSnap').innerHTML = rotation.map((value) => `<option value="${value}">${value === 0 ? 'FREE' : value + '°'}</option>`).join('');
}

function closeEditorUi() {
    state.open = false; state.project = null; state.selectedId = null; state.shop = null;
    byId('editor').classList.remove('is-minimized');
    byId('minimizeBtn').textContent = 'HIDE PANELS';
    byId('editor').classList.add('is-hidden');
    byId('editor').classList.remove('is-positioning');
    document.body.classList.remove('positioning');
    byId('placementHelp')?.classList.add('is-hidden');
    all('.dialog').forEach(dialog => dialog.classList.add('is-hidden'));
    byId('toasts').replaceChildren();
    window.RSStorefrontUI?.closeViews?.();
}
function closeShopUi() {
    state.shop = null;
    byId('shopDialog').classList.add('is-hidden');
    window.RSStorefrontUI?.closeShop?.();
}
window.addEventListener('message', ({ data }) => {
    if (!data || !data.action) return;
    if (data.action === 'placementHelp') {
        const help = byId('placementHelp');
        if (help) { help.textContent = data.text || ''; help.classList.toggle('is-hidden', data.phase === 'closed' || !state.open); }
        return;
    }
    if (data.action === 'open') {
        state.open = true; state.projects = data.projects || []; state.previewImages = data.previewImages || {}; byId('version').textContent = data.version || 'ALPHA';
        byId('editor').classList.remove('is-minimized'); byId('minimizeBtn').textContent = 'HIDE PANELS'; byId('editor').classList.remove('is-hidden'); byId('projectDialog').classList.remove('is-hidden'); renderAll();
    } else if (data.action === 'close') {
        closeEditorUi();
    } else if (data.action === 'catalogReset') {
        state.catalog = []; state.catalogComplete = false; state.collections = Array.isArray(data.collections) ? data.collections : [];
        state.pedCollections = Array.isArray(data.pedCollections) ? data.pedCollections : [];
        state.animCollections = Array.isArray(data.animCollections) ? data.animCollections : [];
        state.pedThumbnailUrl = typeof data.pedThumbnailUrl === 'string' ? data.pedThumbnailUrl : false;
        state.poseFlag = Number(data.poseFlag) || 1;
        renderPosePicker(); renderCategoryTabs(); renderCatalog();
    } else if (data.action === 'catalogChunk') { state.catalog.push(...(data.rows || [])); state.catalogComplete = data.complete === true; renderCatalog();
    } else if (data.action === 'projectList') { state.projects = data.projects || []; renderProjects();
    } else if (data.action === 'projectLoaded') { state.project = data.project; state.readOnly = data.readOnly === true; state.selectedId = null; byId('projectDialog').classList.add('is-hidden'); renderAll(); if (window.RSStorefrontUI && !byId('storeDialog').classList.contains('is-hidden')) window.RSStorefrontUI.syncProject(state.project);
    } else if (data.action === 'editorState') {
        state.editor = Object.assign({}, state.editor, data); state.readOnly = data.readOnly === true; state.selectedId = data.selected?.id || null;
        if (state.project && data.shell) state.project.shell = data.shell; renderChrome(); renderHierarchy(); fillInspector(data.selected || selectedEntity());
    } else if (data.action === 'entityUpsert') { upsertEntity(data.entity); renderHierarchy(); fillInspector(data.entity); if (window.RSStorefrontUI?.refreshEntities) window.RSStorefrontUI.refreshEntities();
    } else if (data.action === 'entityDelete') { if (state.project) { state.project.entities = state.project.entities.filter((entity) => entity.id !== data.objectId); if (state.project.store?.vendors) state.project.store.vendors = state.project.store.vendors.filter((vendor) => String(vendor.pedId) !== String(data.objectId)); } if (state.selectedId === data.objectId) state.selectedId = null; renderHierarchy(); fillInspector(selectedEntity()); if (window.RSStorefrontUI?.refreshEntities) window.RSStorefrontUI.refreshEntities();
    } else if (data.action === 'revision' || data.action === 'saved') { if (state.project && data.revision) state.project.revision = data.revision; if (data.saveState) state.editor.saveState = data.saveState; if (data.action === 'saved' && (state.project?.entities?.length || 0) > 0) state.guide.saved = true; renderChrome();
    } else if (data.action === 'gizmoPreview') { state.guide.moved = true; const entity = selectedEntity(); if (entity && entity.id === data.objectId) fillInspector(Object.assign({}, entity, { transform: data.transform })); renderGuide();
    } else if (data.action === 'blueprintList') { if (!state.open) return; state.blueprints = data.blueprints || []; renderBlueprints(); byId('blueprintDialog').classList.remove('is-hidden');
    } else if (data.action === 'previewImages') { state.previewImages = data.images || {}; renderCatalog();
    } else if (data.action === 'toast') { toast(data.message, data.tone);
    } else if (data.action === 'shopOpen') { renderShop(data.storeId, data.store || {}, data.stock || {}, data.salesContext || {});
    } else if (data.action === 'shopClose') { closeShopUi();
    } else if (data.action === 'purchaseResult') { if (window.RSStorefrontUI) window.RSStorefrontUI.handleMessage(data); toast(data.result?.ok === true ? 'Purchase complete.' : 'Purchase could not complete. Check the server notification.', data.result?.ok === true ? 'success' : 'error');
    } else if (data.action === 'bossOpen' || data.action === 'inventoryCatalog' || data.action === 'storeStock' || data.action === 'storeReadiness') { if (window.RSStorefrontUI) window.RSStorefrontUI.handleMessage(data);
    } else if (data.action === 'worldProbe') {
        const aim = data.aim || {}; const player = data.player || {};
        byId('aimX').textContent = Number.isFinite(Number(aim.x)) ? Number(aim.x).toFixed(3) : '—';
        byId('aimY').textContent = Number.isFinite(Number(aim.y)) ? Number(aim.y).toFixed(3) : '—';
        byId('aimZ').textContent = Number.isFinite(Number(aim.z)) ? Number(aim.z).toFixed(3) : '—';
        byId('playerCoords').textContent = [player.x, player.y, player.z].every((value) => Number.isFinite(Number(value))) ? `${Number(player.x).toFixed(1)}, ${Number(player.y).toFixed(1)}, ${Number(player.z).toFixed(1)}` : '—';
        byId('playerHeading').textContent = Number.isFinite(Number(player.heading)) ? `${Number(player.heading).toFixed(1)}°` : '—';
        byId('coordStatus').textContent = data.hit ? 'SURFACE LOCK' : 'CAMERA POINT';
        byId('coordinateDock').classList.toggle('is-hit', data.hit === true);
        byId('coordinateDock').classList.toggle('is-fallback', data.hit !== true);
    } else if (data.action === 'diagnostics') { if (!state.open && data.requested !== true) return; byId('diagnosticsText').textContent = JSON.stringify(data.diagnostics, null, 2); byId('diagnosticsDialog').classList.remove('is-hidden'); }
});

byId('catalogSearch').addEventListener('input', (event) => { state.search = event.target.value; if (state.search.trim()) state.guide.category = true; renderCatalog(); renderGuide(); });
byId('catalogPreviewSave').addEventListener('click', () => { if (state.catalogSelectedModel) post('setPreviewImage', { model: state.catalogSelectedModel, image: byId('catalogPreviewInput').value.trim() }); });
byId('catalogPreviewRemove').addEventListener('click', () => { if (state.catalogSelectedModel) post('setPreviewImage', { model: state.catalogSelectedModel, image: '' }); });
all('[data-mode]').forEach((button) => button.addEventListener('click', () => post('setMode', { mode: button.dataset.mode, tool: byId('gizmoTool').value })));
byId('closeBtn').addEventListener('click', () => { closeEditorUi(); post('close'); }); byId('dialogClose').addEventListener('click', () => { if (state.project) byId('projectDialog').classList.add('is-hidden'); else { closeEditorUi(); post('close'); } });
byId('saveBtn').addEventListener('click', () => post('save')); byId('undoBtn').addEventListener('click', () => post('undo')); byId('redoBtn').addEventListener('click', () => post('redo'));
byId('projectsBtn').addEventListener('click', () => byId('projectDialog').classList.remove('is-hidden')); byId('focusWorldBtn').addEventListener('click', () => post('focusWorld'));
byId('coordAimBtn').addEventListener('click', () => { post('focusWorld'); toast('Aim at the exact location in the world. Press F7 to return to the builder.', 'info'); });
byId('storeSetupBtn').addEventListener('click', () => { if (!state.project) return toast('Open or start a store project first.', 'warning'); renderStoreSetup(); byId('storeDialog').classList.remove('is-hidden'); });
byId('storeClose').addEventListener('click', () => { window.RSStorefrontUI?.closeImageEditor?.(); byId('storeDialog').classList.add('is-hidden'); });
byId('storePublish').addEventListener('click', () => { if (window.RSStorefrontUI) window.RSStorefrontUI.publishBuilder(); }); byId('storeUnpublish').addEventListener('click', () => post('unpublishStore'));
byId('shopClose').addEventListener('click', () => { closeShopUi(); post('closeShop'); });
byId('storeSaveConfig').addEventListener('click', () => { if (window.RSStorefrontUI) window.RSStorefrontUI.saveBuilder(); });
all('[data-store-point]').forEach((button) => button.addEventListener('click', () => post('storePoint', { pointType: button.dataset.storePoint })));
byId('minimizeBtn').addEventListener('click', () => { const minimized = byId('editor').classList.toggle('is-minimized'); byId('minimizeBtn').textContent = minimized ? 'SHOW PANELS' : 'HIDE PANELS'; if (minimized) post('focusWorld'); });
all('#librarySwitch button').forEach((button) => button.addEventListener('click', () => {
    state.library = button.dataset.library; applyLibrary(); renderCategoryTabs(); renderCatalog(); post('clearPreview');
}));
byId('poseSelect').addEventListener('change', () => {
    renderPoseHint();
    if (!state.livePreview || state.library !== 'peds' || !state.pedSelected) return;
    const pose = selectedPose();
    post('previewPose', { animDict: pose ? pose.dict : '', animName: pose ? pose.clip : '', animFlag: state.poseFlag });
});
byId('liveToggle').addEventListener('change', (event) => {
    state.livePreview = event.target.checked; prefs.set('livePreview', state.livePreview ? '1' : '0');
    if (!state.livePreview) post('clearPreview');
});
byId('freezeMeBtn').addEventListener('click', () => post('freezePlayer'));
byId('helpBtn').addEventListener('click', () => { state.guideHidden = !state.guideHidden; prefs.set('guideHidden', state.guideHidden ? '1' : '0'); renderGuide(); });
byId('guideHide').addEventListener('click', () => { state.guideHidden = true; prefs.set('guideHidden', '1'); renderGuide(); });
byId('advancedBtn').addEventListener('click', () => { state.advanced = !state.advanced; prefs.set('advanced', state.advanced ? '1' : '0'); applyAdvanced(); });
// The native gizmo is driven in the world, so these buttons hand the mouse to the game;
// T / R / L switch tool and axes from there, F7 brings the cursor back.
all('[data-gizmo-tool]').forEach((button) => button.addEventListener('click', () => {
    if (!state.project) return toast('Open or start a project first (MY PROJECTS).', 'warning');
    if (state.readOnly) return toast('This project is view-only for you.', 'warning');
    if (!state.selectedId) return toast('Click a prop first, then pick MOVE or ROTATE.', 'warning');
    const tool = button.dataset.gizmoTool; byId('gizmoTool').value = tool;
    post('setMode', { mode: 'gizmo', tool });
}));
byId('gizmoSpaceBtn').addEventListener('click', () => {
    const space = state.editor.transformSpace === 'local_space' ? 'world' : 'local_space'; byId('space').value = space;
    post('configureTransform', { space, positionSnap: Number(byId('positionSnap').value), rotationSnap: Number(byId('rotationSnap').value), tool: byId('gizmoTool').value });
});
byId('diagBtn').addEventListener('click', () => post('diagnostics')); byId('diagnosticsClose').addEventListener('click', () => byId('diagnosticsDialog').classList.add('is-hidden'));
byId('createProjectBtn').addEventListener('click', () => { const name = byId('newProjectName').value.trim(); if (name.length < 2) return toast('Enter a project name.', 'warning'); post('createProject', { name, type: byId('newProjectType').value }); });
byId('applyTransformBtn').addEventListener('click', () => {
    state.guide.moved = true; renderGuide();
    post('applyTransform', { x: byId('posX').value, y: byId('posY').value, z: byId('posZ').value, rx: byId('rotX').value, ry: byId('rotY').value, rz: byId('rotZ').value, sxy: byId('scaleXY').value, sz: byId('scaleZ').value });
});
byId('decorativeProp').addEventListener('change', (event) => {
    const entity = selectedEntity();
    if (!entity || entity.kind !== 'object') return;
    event.target.disabled = true;
    post('setObjectCollision', { collision: !event.target.checked });
});
all('[data-transform-action]').forEach((button) => button.addEventListener('click', () => post('transformAction', { action: button.dataset.transformAction })));
all('[data-shell-action]').forEach((button) => button.addEventListener('click', () => post('shellAction', { action: button.dataset.shellAction })));
byId('saveBlueprintBtn').addEventListener('click', () => { const name = byId('blueprintName').value.trim() || state.project?.name || 'Shell Blueprint'; post('saveShellBlueprint', { name }); });
byId('blueprintsBtn').addEventListener('click', () => post('requestBlueprints'));
byId('blueprintClose').addEventListener('click', () => byId('blueprintDialog').classList.add('is-hidden'));
[byId('space'), byId('positionSnap'), byId('rotationSnap'), byId('gizmoTool')].forEach((control) => control.addEventListener('change', () => post('configureTransform', { space: byId('space').value, positionSnap: Number(byId('positionSnap').value), rotationSnap: Number(byId('rotationSnap').value), tool: byId('gizmoTool').value })));

window.addEventListener('keydown', (event) => {
    if (event.key === 'F7' && state.open) { event.preventDefault(); if (!event.repeat) post('focusWorld', { hotkey: true }); return; }
    if (event.key !== 'Escape') return;
    if (!byId('shopDialog').classList.contains('is-hidden')) { event.preventDefault(); closeShopUi(); return post('closeShop'); }
    if (!byId('productImageDialog').classList.contains('is-hidden')) { event.preventDefault(); window.RSStorefrontUI?.closeImageEditor?.(); return; }
    if (!state.open) return; event.preventDefault();
    if (!byId('storeDialog').classList.contains('is-hidden')) return byId('storeDialog').classList.add('is-hidden');
    if (!byId('blueprintDialog').classList.contains('is-hidden')) return byId('blueprintDialog').classList.add('is-hidden');
    if (!byId('diagnosticsDialog').classList.contains('is-hidden')) return byId('diagnosticsDialog').classList.add('is-hidden');
    if (!byId('projectDialog').classList.contains('is-hidden') && state.project) return byId('projectDialog').classList.add('is-hidden'); closeEditorUi(); post('close');
});

configureOptions();
state.advanced = prefs.get('advanced') === '1';
state.guideHidden = prefs.get('guideHidden') === '1';
state.livePreview = prefs.get('livePreview') !== '0';
byId('liveToggle').checked = state.livePreview;
applyAdvanced(); applyLibrary(); renderCategoryTabs(); renderGuide();