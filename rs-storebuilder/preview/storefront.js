'use strict';
(() => {
    const ICONS = {
        store: 'assets/storefront/store.png',
        general: 'assets/storefront/store.png',
        basket: 'assets/storefront/basket.png',
        cash: 'assets/storefront/cash.png',
        cards: 'assets/storefront/cards.png',
        food: 'assets/storefront/food.png',
        drinks: 'assets/storefront/drinks.png',
        cigarettes: 'assets/storefront/cigarettes.png',
        tobacco: 'assets/storefront/cigarettes.png',
        cigars: 'assets/storefront/cigars.png',
        masks: 'assets/storefront/masks.png'
    };

    const THEMES = ['rail', 'header', 'dock', 'desktop', 'kiosk'];
    const STEPS = ['brand', 'pages', 'categories', 'products', 'checkout', 'test', 'publish'];
    const PAGE_SIZE_CHOICES = [6, 8, 12, 16, 24, 36, 48];

    let draft;
    let currentStep = 0;
    let inventoryCatalog = [];
    let runtime;
    let boss;
    let readiness = null;
    let draftDirty = false;
    let pendingSave = false;
    let pendingTestAfterSave = false;
    let imageEditorIndex = -1;
    let inventoryPickerRequested = false;

    const clone = value => JSON.parse(JSON.stringify(value ?? null));
    const slug = (value, fallback) => String(value || fallback || '')
        .trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '').slice(0, 32) || fallback || 'general';
    const money = value => {
        const n = Number(value) || 0;
        return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString()}`;
    };
    const categoryById = (store, id) => (store.storefront?.categories || []).find(x => x.id === id);
    const categoryIcon = (store, id) => ICONS[categoryById(store, id)?.icon] || ICONS[id] || ICONS.store;
    const clamp = (value, min, max, fallback) => {
        const number = Number(value);
        return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
    };
    const catalogItem = item => inventoryCatalog.find(row => row.item === item);
    function normalizeProductImage(product) {
        if (!product) return { mode: 'inventory', source: '', fit: 'contain', zoom: 1, x: 50, y: 50 };
        const legacy = typeof product.image === 'string' ? product.image.trim() : '';
        const source = String(product.imageSource ?? legacy ?? '').trim();
        const bridgedLegacy = /^(?:nui:\/\/(?:ox_inventory|qb-inventory|ps-inventory|lj-inventory)\/|https:\/\/cfx-nui-(?:ox_inventory|qb-inventory|ps-inventory|lj-inventory)\/)/i.test(source);
        const mode = ['inventory', 'custom'].includes(product.imageMode) ? product.imageMode : ((!source || bridgedLegacy) ? 'inventory' : 'custom');
        product.imageMode = mode;
        product.imageSource = source;
        product.image = source; // legacy readers keep working; imageMode decides whether it is actually used.
        product.imageFit = product.imageFit === 'cover' ? 'cover' : 'contain';
        product.imageZoom = clamp(product.imageZoom, .5, 2, 1);
        product.imageX = clamp(product.imageX, 0, 100, 50);
        product.imageY = clamp(product.imageY, 0, 100, 50);
        return { mode: product.imageMode, source: product.imageSource, fit: product.imageFit, zoom: product.imageZoom, x: product.imageX, y: product.imageY };
    }
    function productImage(store, product) {
        if (!product) return ICONS.store;
        const settings = normalizeProductImage(product);
        const inventory = catalogItem(product.item);
        if (settings.mode === 'custom' && settings.source) return settings.source;
        if (settings.mode === 'inventory') return product.resolvedImage || inventory?.image || settings.source || categoryIcon(store, product.category);
        return product.resolvedImage || settings.source || inventory?.image || categoryIcon(store, product.category);
    }
    function productImageStyle(product) {
        const settings = normalizeProductImage(product || {});
        return `object-fit:${settings.fit};object-position:${settings.x}% ${settings.y}%;transform:scale(${settings.zoom});transform-origin:${settings.x}% ${settings.y}%;`;
    }
    function applyProductImageElement(element, store, product) {
        if (!element) return;
        element.src = productImage(store, product);
        element.style.objectFit = normalizeProductImage(product).fit;
        element.style.objectPosition = `${product.imageX}% ${product.imageY}%`;
        element.style.transform = `scale(${product.imageZoom})`;
        element.style.transformOrigin = `${product.imageX}% ${product.imageY}%`;
    }
    function syncInventoryProductImages() {
        if (!draft) return;
        for (const product of draft.products || []) {
            normalizeProductImage(product);
            const item = catalogItem(product.item);
            if (product.imageMode === 'inventory') {
                product.resolvedImage = item?.image || product.resolvedImage || '';
                product.imageProvider = item?.imageProvider || product.imageProvider || 'inventory';
            }
        }
    }

    function defaults(store = {}) {
        const sf = store.storefront || {};
        return {
            ...clone(store),
            storefront: {
                theme: THEMES.includes(sf.theme) ? sf.theme : 'rail',
                logo: sf.logo || 'assets/storefront/rs-logo.png',
                banner: sf.banner || '',
                welcome: sf.welcome || 'Welcome',
                tagline: sf.tagline || 'Everything you need, right here.',
                itemsPerPage: Number(sf.itemsPerPage) || 12,
                search: sf.search !== false,
                showStock: sf.showStock !== false,
                posMode: ['instant', 'cart', 'counter'].includes(sf.posMode) ? sf.posMode : 'cart',
                categories: clone(sf.categories?.length ? sf.categories : [
                    { id: 'general', label: 'General', icon: 'store', enabled: true },
                    { id: 'food', label: 'Food', icon: 'food', enabled: true },
                    { id: 'drinks', label: 'Drinks', icon: 'drinks', enabled: true }
                ]),
                pages: clone(sf.pages?.length ? sf.pages : [
                    { id: 'home', label: 'Home', category: 'all', enabled: true },
                    { id: 'shop', label: 'Shop', category: 'all', enabled: true }
                ])
            },
            supplier: {
                enabled: true,
                autoRestock: true,
                deliveryFlatFee: 0,
                deliveryPercent: 0,
                managerPurchaseLimit: 7500,
                ownerPurchaseLimit: 250000,
                ...(store.supplier || {})
            },
            products: clone(store.products || []).map(product => { normalizeProductImage(product); return product; }),
            vendors: clone(store.vendors || []),
            ownership: clone(store.ownership || {}),
            payments: clone(store.payments || {}),
            points: clone(store.points || {})
        };
    }

    function enabledRows(rows) {
        return Array.isArray(rows) ? rows.filter(row => row && row.enabled !== false) : [];
    }

    function productConfigValid() {
        if (!draft || !draft.products.length) return false;
        const seen = new Set();
        return draft.products.every(product => {
            const item = String(product?.item || '').trim().toLowerCase();
            const price = Number(product?.price);
            if (!item || seen.has(item) || !Number.isFinite(price) || price < 0) return false;
            seen.add(item);
            return true;
        });
    }

    function listConfigValid(rows) {
        const active = enabledRows(rows);
        if (!active.length) return false;
        const ids = active.map(row => slug(row?.id || row?.label, '')).filter(Boolean);
        return ids.length === active.length && new Set(ids).size === ids.length;
    }

    function placedPeds() {
        return (state.project?.entities || []).filter(entity => entity && (entity.kind === 'ped' || entity.metadata?.builder?.kind === 'ped'));
    }

    function validVendorCount() {
        const peds = new Set(placedPeds().map(entity => String(entity.id)));
        return (draft?.vendors || []).filter(vendor => peds.has(String(vendor?.pedId || ''))).length;
    }

    function renderVendorPeds() {
        const target = byId('siteVendorPeds');
        if (!target || !draft) return;
        const peds = placedPeds();
        const pedIds = new Set(peds.map(entity => String(entity.id)));
        draft.vendors = (draft.vendors || []).filter(vendor => pedIds.has(String(vendor?.pedId || '')));
        const assigned = new Map((draft.vendors || []).map(vendor => [String(vendor.pedId), vendor]));
        if (!peds.length) {
            target.innerHTML = '<div class="site-vendor-empty"><b>NO PEDS PLACED YET</b><br><small>Close Store Setup, choose PEDS, place a cashier, then return here.</small></div>';
            return;
        }
        target.innerHTML = peds.map(entity => {
            const vendor = assigned.get(String(entity.id));
            const role = vendor?.role || 'cashier';
            return `<label class="site-vendor-row ${vendor ? 'assigned' : ''}"><input type="checkbox" data-vendor-ped="${escapeHtml(entity.id)}" ${vendor ? 'checked' : ''}><span><b>${escapeHtml(vendor?.label || entity.model || 'Store ped')}</b><small>${escapeHtml(entity.id)} · ${escapeHtml(entity.model || 'ped')}</small></span><select data-vendor-role="${escapeHtml(entity.id)}"><option value="cashier" ${role === 'cashier' ? 'selected' : ''}>CASHIER</option><option value="vendor" ${role === 'vendor' ? 'selected' : ''}>VENDOR</option></select></label>`;
        }).join('');
        all('[data-vendor-ped]').forEach(box => box.addEventListener('change', () => {
            const pedId = box.dataset.vendorPed;
            draft.vendors = (draft.vendors || []).filter(vendor => String(vendor.pedId) !== pedId);
            if (box.checked) {
                const entity = peds.find(row => String(row.id) === pedId);
                const roleNode = document.querySelector(`[data-vendor-role="${CSS.escape(pedId)}"]`);
                const role = roleNode?.value || 'cashier';
                draft.vendors.push({ pedId, role, label: role === 'vendor' ? 'Vendor' : 'Cashier', model: entity?.model || '' });
            }
            markDirty(); renderVendorPeds(); checklist(); setStep(currentStep);
        }));
        all('[data-vendor-role]').forEach(select => select.addEventListener('change', () => {
            const vendor = (draft.vendors || []).find(row => String(row.pedId) === select.dataset.vendorRole);
            if (!vendor) return;
            vendor.role = select.value === 'vendor' ? 'vendor' : 'cashier';
            vendor.label = vendor.role === 'vendor' ? 'Vendor' : 'Cashier';
            markDirty(); renderVendorPeds(); checklist(); setStep(currentStep);
        }));
    }

    function localStepProblem(step) {
        if (!draft) return 'Open a store project first.';
        switch (step) {
            case 'brand':
                return (draft.label || '').trim().length >= 2 ? '' : 'Give the store a name with at least 2 characters.';
            case 'pages':
                return listConfigValid(draft.storefront.pages) ? '' : 'Keep at least one enabled page with a unique page ID.';
            case 'categories':
                return listConfigValid(draft.storefront.categories) ? '' : 'Keep at least one enabled category with a unique category ID.';
            case 'products':
                if (!draft.products.length) return 'Add at least one product before continuing.';
                return productConfigValid() ? '' : 'Every product needs a unique inventory item name and a valid price.';
            case 'checkout':
                if (!draft.points?.checkout && validVendorCount() < 1) return 'Set a self-checkout point or assign at least one placed ped as a CASHIER/VENDOR.';
                if (!draft.payments?.cash && !draft.payments?.bank) return 'Enable at least one payment method.';
                return '';
            case 'test':
                if (draftDirty) return 'Run SAVE & CHECK again after your latest changes.';
                if (!readiness) return 'Run SAVE & CHECK to verify the real server requirements.';
                return readiness.ready ? '' : 'The readiness check found items that still need attention.';
            default:
                return '';
        }
    }

    function stepComplete(step) {
        return localStepProblem(step) === '';
    }

    function firstIncompleteBefore(targetIndex) {
        for (let i = 0; i < targetIndex; i += 1) {
            if (!stepComplete(STEPS[i])) return i;
        }
        return -1;
    }

    function stepInstruction(step) {
        const problem = localStepProblem(step);
        if (problem) return problem;
        const labels = {
            brand: 'Store identity is ready. Continue to pages.',
            pages: 'Pages are ready. Continue to categories.',
            categories: 'Categories are ready. Continue to products.',
            products: 'Products are ready. Continue to checkout.',
            checkout: 'Seller/checkout setup is ready. Continue to the server readiness test.',
            test: 'Server readiness passed. Continue to publish.',
            publish: readiness?.ready ? 'Everything required to publish is ready.' : 'Review the checklist before publishing.'
        };
        return labels[step] || '';
    }

    function setStep(value, options = {}) {
        collect();
        const requested = typeof value === 'number' ? value : STEPS.indexOf(value);
        const next = Math.max(0, Math.min(STEPS.length - 1, requested));
        if (!options.force && next > currentStep) {
            const blockedAt = firstIncompleteBefore(next);
            if (blockedAt >= 0) {
                currentStep = blockedAt;
                const message = localStepProblem(STEPS[blockedAt]);
                toast(message, 'warning');
            } else {
                currentStep = next;
            }
        } else {
            currentStep = next;
        }
        all('[data-site-step]').forEach(button => {
            const index = STEPS.indexOf(button.dataset.siteStep);
            button.classList.toggle('active', index === currentStep);
            button.classList.toggle('complete', stepComplete(button.dataset.siteStep));
            button.classList.toggle('locked', index > currentStep && firstIncompleteBefore(index) >= 0);
            button.setAttribute('aria-disabled', button.classList.contains('locked') ? 'true' : 'false');
        });
        all('[data-site-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.sitePanel === STEPS[currentStep]));
        byId('sitePrevStep').disabled = currentStep === 0;
        byId('siteNextStep').textContent = currentStep === STEPS.length - 1 ? 'DONE' : 'CONTINUE →';
        const message = byId('siteStepMessage');
        if (message) message.textContent = `STEP ${currentStep + 1} OF ${STEPS.length} · ${stepInstruction(STEPS[currentStep])}`;
        if (STEPS[currentStep] === 'test') renderTestChecklist();
        if (STEPS[currentStep] === 'publish') checklist();
    }

    function markDirty() {
        if (!draft) return;
        draftDirty = true;
        readiness = null;
        renderTestChecklist();
        checklist();
    }

    function preview() {
        if (!draft) return;
        const sf = draft.storefront;
        const canvas = byId('sitePreviewCanvas');
        const products = (draft.products.length ? draft.products.slice(0, 4) : [
            { label: 'Item', category: 'general' },
            { label: 'Item', category: 'food' },
            { label: 'Item', category: 'drinks' },
            { label: 'Item', category: 'general' }
        ]);
        const pages = sf.pages.filter(x => x.enabled !== false).slice(0, 5);
        const categories = sf.categories.filter(x => x.enabled !== false).slice(0, 5);

        canvas.className = `site-preview-canvas theme-${sf.theme}`;
        byId('sitePreviewTheme').textContent = sf.theme.toUpperCase();
        canvas.innerHTML = `
            <div class="preview-frame">
                <header class="p-head"><img src="${escapeHtml(sf.logo)}"><span><small>${escapeHtml(sf.welcome || 'WELCOME')}</small><b>${escapeHtml(draft.label || 'YOUR STORE')}</b></span></header>
                <nav class="p-pages">${pages.map((page, i) => `<i class="${i === 0 ? 'active' : ''}">${escapeHtml(page.label.slice(0, 8))}</i>`).join('')}</nav>
                <div class="p-categories">${categories.map(category => `<i><img src="${escapeHtml(ICONS[category.icon] || ICONS.store)}"><span>${escapeHtml(category.label.slice(0, 8))}</span></i>`).join('')}</div>
                <section class="p-products">${products.map(product => `<i><img src="${escapeHtml(productImage(draft, product))}" style="${productImageStyle(product)}"><span></span><b></b></i>`).join('')}</section>
                <aside class="p-cart"><strong></strong><i></i><i></i><i></i><button></button></aside>
            </div>`;
    }

    function wireListReorder(container, rows, rerender) {
        let from = -1;
        container.querySelectorAll('.drag').forEach(handle => {
            handle.draggable = true;
            handle.addEventListener('dragstart', event => {
                from = Number(handle.closest('[data-i]').dataset.i);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(from));
                handle.closest('[data-i]').classList.add('is-dragging');
            });
            handle.addEventListener('dragend', () => {
                container.querySelectorAll('.is-dragging,.drop-before,.drop-after').forEach(x => x.classList.remove('is-dragging', 'drop-before', 'drop-after'));
                from = -1;
            });
        });
        container.querySelectorAll('[data-i]').forEach(row => {
            row.addEventListener('dragover', event => {
                if (from < 0) return;
                event.preventDefault();
                const box = row.getBoundingClientRect();
                row.classList.toggle('drop-before', event.clientY < box.top + box.height / 2);
                row.classList.toggle('drop-after', event.clientY >= box.top + box.height / 2);
            });
            row.addEventListener('dragleave', () => row.classList.remove('drop-before', 'drop-after'));
            row.addEventListener('drop', event => {
                event.preventDefault();
                if (from < 0) return;
                let to = Number(row.dataset.i);
                const box = row.getBoundingClientRect();
                if (event.clientY >= box.top + box.height / 2) to += 1;
                const [moved] = rows.splice(from, 1);
                if (from < to) to -= 1;
                rows.splice(Math.max(0, Math.min(rows.length, to)), 0, moved);
                markDirty();
                rerender();
                preview();
            });
        });
    }

    function sortRows(kind) {
        const rows = kind === 'pages' ? draft.storefront.pages : draft.storefront.categories;
        const container = byId(kind === 'pages' ? 'sitePages' : 'siteCategories');
        const categoryOptions = `<option value="all">ALL PRODUCTS</option>${draft.storefront.categories.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.label)}</option>`).join('')}`;
        const iconOptions = Object.keys(ICONS).map(key => `<option value="${key}">${key.toUpperCase()}</option>`).join('');

        container.innerHTML = rows.map((row, index) => kind === 'pages'
            ? `<div class="site-sort-row" data-i="${index}"><span class="drag" title="Drag to reorder">⠿</span><input data-f="label" value="${escapeHtml(row.label)}"><input data-f="id" value="${escapeHtml(row.id)}"><select data-f="category">${categoryOptions}</select><button data-del="pages" aria-label="Delete page">×</button></div>`
            : `<div class="site-sort-row" data-i="${index}"><span class="drag" title="Drag to reorder">⠿</span><input data-f="label" value="${escapeHtml(row.label)}"><input data-f="id" value="${escapeHtml(row.id)}"><select data-f="icon">${iconOptions}</select><button data-del="categories" aria-label="Delete category">×</button></div>`
        ).join('');

        if (kind === 'pages') all('#sitePages [data-f="category"]').forEach((select, index) => { select.value = rows[index].category || 'all'; });
        if (kind === 'categories') all('#siteCategories [data-f="icon"]').forEach((select, index) => { select.value = rows[index].icon || 'store'; });

        container.querySelectorAll('[data-f]').forEach(input => input.addEventListener('input', () => {
            markDirty();
            const item = input.closest('[data-i]');
            const index = Number(item.dataset.i);
            const field = input.dataset.f;
            if (kind === 'categories' && field === 'id') {
                const previous = rows[index].id;
                const nextId = slug(input.value, `${kind}_${index + 1}`);
                rows[index][field] = nextId;
                if (previous !== nextId) {
                    draft.products.forEach(product => { if (product.category === previous) product.category = nextId; });
                    draft.storefront.pages.forEach(page => { if (page.category === previous) page.category = nextId; });
                }
            } else {
                rows[index][field] = field === 'id' ? slug(input.value, `${kind}_${index + 1}`) : input.value;
            }
            if (kind === 'categories') { productRows(); sortRows('pages'); }
            preview();
            setStep(currentStep);
        }));

        wireListReorder(container, rows, () => sortRows(kind));
    }

    function wireProductReorder(container) {
        let from = -1;
        container.querySelectorAll('.product-drag').forEach(handle => {
            handle.draggable = true;
            handle.addEventListener('dragstart', event => {
                from = Number(handle.closest('[data-p]').dataset.p);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(from));
                handle.closest('[data-p]').classList.add('is-dragging');
            });
            handle.addEventListener('dragend', () => {
                container.querySelectorAll('.is-dragging,.drop-before,.drop-after').forEach(x => x.classList.remove('is-dragging', 'drop-before', 'drop-after'));
                from = -1;
            });
        });
        container.querySelectorAll('[data-p]').forEach(row => {
            row.addEventListener('dragover', event => {
                if (from < 0) return;
                event.preventDefault();
                const box = row.getBoundingClientRect();
                row.classList.toggle('drop-before', event.clientY < box.top + box.height / 2);
                row.classList.toggle('drop-after', event.clientY >= box.top + box.height / 2);
            });
            row.addEventListener('dragleave', () => row.classList.remove('drop-before', 'drop-after'));
            row.addEventListener('drop', event => {
                event.preventDefault();
                if (from < 0) return;
                let to = Number(row.dataset.p);
                const box = row.getBoundingClientRect();
                if (event.clientY >= box.top + box.height / 2) to += 1;
                const [moved] = draft.products.splice(from, 1);
                if (from < to) to -= 1;
                draft.products.splice(Math.max(0, Math.min(draft.products.length, to)), 0, moved);
                markDirty();
                productRows();
                preview();
            });
        });
    }

    function imageEditorProduct() {
        return draft && imageEditorIndex >= 0 ? draft.products[imageEditorIndex] : null;
    }

    function closeProductImageEditor() {
        imageEditorIndex = -1;
        byId('productImageDialog').classList.add('is-hidden');
    }

    function refreshProductImageEditor() {
        const product = imageEditorProduct();
        if (!product) return closeProductImageEditor();
        const settings = normalizeProductImage(product);
        const item = catalogItem(product.item);
        byId('productImageEditorLabel').textContent = String(product.label || product.item || 'PRODUCT').toUpperCase();
        byId('productImageEditorItem').textContent = product.item || 'No inventory item';
        byId('productImageMode').value = settings.mode;
        byId('productImageSource').value = settings.source;
        byId('productImageFit').value = settings.fit;
        byId('productImageZoom').value = Math.round(settings.zoom * 100);
        byId('productImageX').value = Math.round(settings.x);
        byId('productImageY').value = Math.round(settings.y);
        byId('productImageZoomOut').textContent = `${Math.round(settings.zoom * 100)}%`;
        byId('productImageXOut').textContent = `${Math.round(settings.x)}%`;
        byId('productImageYOut').textContent = `${Math.round(settings.y)}%`;
        byId('productImageEditorProvider').textContent = settings.mode === 'custom'
            ? 'CUSTOM IMAGE'
            : String(item?.imageProvider || product.imageProvider || 'INVENTORY').toUpperCase();
        const previewImage = byId('productImageEditorPreview');
        const empty = byId('productImageEditorEmpty');
        const source = productImage(draft, product);
        empty.style.display = source ? 'none' : 'grid';
        previewImage.style.display = source ? 'block' : 'none';
        if (source) {
            applyProductImageElement(previewImage, draft, product);
            previewImage.onerror = () => {
                const fallback = categoryIcon(draft, product.category);
                if (previewImage.getAttribute('src') !== fallback) previewImage.src = fallback;
                else { previewImage.style.display = 'none'; empty.style.display = 'grid'; }
            };
        }
        all('#productImageDialog input,#productImageDialog select,#productImageDialog button').forEach(control => {
            if (control.id !== 'productImageEditorClose') control.disabled = state.readOnly;
        });
    }

    function updateProductImageFromEditor() {
        const product = imageEditorProduct();
        if (!product) return;
        product.imageMode = byId('productImageMode').value === 'custom' ? 'custom' : 'inventory';
        product.imageSource = byId('productImageSource').value.trim();
        product.image = product.imageSource;
        product.imageFit = byId('productImageFit').value === 'cover' ? 'cover' : 'contain';
        product.imageZoom = clamp(Number(byId('productImageZoom').value) / 100, .5, 2, 1);
        product.imageX = clamp(byId('productImageX').value, 0, 100, 50);
        product.imageY = clamp(byId('productImageY').value, 0, 100, 50);
        const item = catalogItem(product.item);
        if (product.imageMode === 'inventory') {
            product.resolvedImage = item?.image || product.resolvedImage || '';
            product.imageProvider = item?.imageProvider || product.imageProvider || 'inventory';
        }
        markDirty();
        refreshProductImageEditor();
        const thumb = document.querySelector(`[data-product-image-index="${imageEditorIndex}"] img`);
        if (thumb) applyProductImageElement(thumb, draft, product);
        preview();
    }

    function openProductImageEditor(index) {
        imageEditorIndex = Number(index);
        const product = imageEditorProduct();
        if (!product) return;
        normalizeProductImage(product);
        const item = catalogItem(product.item);
        if (product.imageMode === 'inventory' && item?.image) {
            product.resolvedImage = item.image;
            product.imageProvider = item.imageProvider || product.imageProvider;
        }
        byId('productImageDialog').classList.remove('is-hidden');
        refreshProductImageEditor();
    }

    function productRows() {
        const query = (byId('siteProductSearch').value || '').toLowerCase();
        const options = draft.storefront.categories.map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join('');
        const rows = draft.products.map((product, index) => ({ product, index }))
            .filter(x => !query || `${x.product.item} ${x.product.label}`.toLowerCase().includes(query));

        byId('siteProducts').innerHTML = rows.map(({ product, index }) => {
            const image = normalizeProductImage(product);
            return `
            <div class="site-product-row" data-p="${index}">
                <span class="product-drag" title="Drag to reorder">⠿</span>
                <span class="site-product-thumb-frame" data-product-image-index="${index}" title="Adjust image"><img src="${escapeHtml(productImage(draft, product))}" style="${productImageStyle(product)}" alt=""></span>
                <label class="product-field product-field-label"><span>DISPLAY NAME</span><input data-pf="label" value="${escapeHtml(product.label || product.item || '')}" title="Customer label"></label>
                <label class="product-field product-field-item"><span>ITEM NAME</span><input data-pf="item" value="${escapeHtml(product.item || '')}" title="Inventory item"></label>
                <label class="product-field product-field-price"><span>PRICE</span><input data-pf="price" type="number" value="${Number(product.price) || 0}" title="Sale price"></label>
                <label class="product-field product-field-category"><span>CATEGORY</span><select data-pf="category" title="Category">${options}</select></label>
                <label class="product-field product-field-stock"><span>START STOCK</span><input data-pf="initialStock" type="number" value="${Number(product.initialStock) || 0}" title="Starting stock"></label>
                <label class="product-field product-field-cost"><span>SUPPLIER COST</span><input data-pf="wholesaleCost" type="number" value="${Number(product.wholesaleCost) || 0}" title="Supplier cost (0 = automatic, a share of the price set by the server)"></label>
                <button data-pdel aria-label="Delete product">×</button>
                <div class="product-more"><div class="product-image-field"><span>IMAGE</span><button type="button" data-pimage>ADJUST IMAGE</button><small>${escapeHtml(image.mode)} · ${Math.round(image.zoom * 100)}%</small></div><label><span>DESCRIPTION</span><input data-pf="description" value="${escapeHtml(product.description || '')}" placeholder="Customer-facing description"></label><label class="product-featured"><input data-pf="featured" type="checkbox"${product.featured ? ' checked' : ''}> FEATURED</label></div>
            </div>`;
        }).join('') || '<div class="empty-state"><b>NO PRODUCTS YET</b><span>Import from your server inventory or add one blank item.</span></div>';

        all('[data-p]').forEach(node => {
            const index = Number(node.dataset.p);
            const product = draft.products[index];
            const category = node.querySelector('[data-pf="category"]');
            if (category) category.value = product.category || draft.storefront.categories[0]?.id || 'general';
            node.querySelectorAll('[data-pf]').forEach(input => input.addEventListener('input', () => {
                const field = input.dataset.pf;
                markDirty();
                product[field] = input.type === 'checkbox'
                    ? input.checked
                    : ['price', 'initialStock', 'wholesaleCost'].includes(field)
                        ? Math.max(0, Math.floor(Number(input.value) || 0))
                        : input.value;
                if (field === 'item' && product.imageMode === 'inventory') {
                    const item = catalogItem(product.item);
                    product.resolvedImage = item?.image || '';
                    product.imageProvider = item?.imageProvider || 'inventory';
                    const thumb = node.querySelector('.site-product-thumb-frame img');
                    if (thumb) applyProductImageElement(thumb, draft, product);
                }
                preview();
                checklist();
                setStep(currentStep);
            }));
            node.querySelector('[data-pimage]').addEventListener('click', event => { event.stopPropagation(); openProductImageEditor(index); });
            node.querySelector('.site-product-thumb-frame').addEventListener('click', event => { event.stopPropagation(); openProductImageEditor(index); });
            node.querySelector('[data-pdel]').addEventListener('click', () => {
                if (imageEditorIndex === index) closeProductImageEditor();
                draft.products.splice(index, 1);
                markDirty();
                productRows();
                preview();
                checklist();
                setStep(currentStep);
            });
        });
        wireProductReorder(byId('siteProducts'));
    }

    function inventoryRows() {
        const query = byId('siteInventorySearch').value.toLowerCase();
        const existing = new Set(draft.products.map(product => product.item));
        const rows = inventoryCatalog
            .filter(item => !query || `${item.item} ${item.label}`.toLowerCase().includes(query))
            .slice(0, 120);

        byId('siteInventoryRows').innerHTML = rows.map(item => `
            <button class="inventory-row" data-import="${escapeHtml(item.item)}"${existing.has(item.item) ? ' disabled' : ''}>
                <img src="${escapeHtml(item.image || ICONS.store)}">
                <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.item)}</small></span>
                <b>${existing.has(item.item) ? 'ADDED' : 'ADD'}</b>
            </button>`).join('') || '<div class="empty-state"><b>NO MATCHES</b><span>Try another inventory item name.</span></div>';

        all('[data-import]').forEach(button => button.addEventListener('click', () => {
            const item = inventoryCatalog.find(row => row.item === button.dataset.import);
            if (!item) return;
            draft.products.push({
                item: item.item,
                label: item.label,
                price: 0,
                category: draft.storefront.categories[0]?.id || 'general',
                imageMode: 'inventory',
                imageSource: '',
                image: '',
                resolvedImage: item.image || '',
                imageProvider: item.imageProvider || 'inventory',
                imageFit: 'contain',
                imageZoom: 1,
                imageX: 50,
                imageY: 50,
                description: item.description || '',
                featured: false,
                initialStock: 25,
                wholesaleCost: 0
            });
            markDirty();
            productRows();
            inventoryRows();
            preview();
            checklist();
            setStep(currentStep);
        }));
    }

    function readinessItems() {
        if (readiness?.items?.length) return readiness.items;
        const shellRequired = ['shell', 'hybrid'].includes(String(state.project?.type || ''));
        const shell = state.project?.shell || {};
        return [
            { label: 'Store name', ok: (draft?.label || '').trim().length >= 2 },
            { label: 'Pages', ok: listConfigValid(draft?.storefront?.pages) },
            { label: 'Categories', ok: listConfigValid(draft?.storefront?.categories) },
            { label: 'Products', ok: productConfigValid() },
            { label: 'Sales endpoint', ok: !!draft?.points?.checkout || validVendorCount() > 0, detail: validVendorCount() > 0 ? `${validVendorCount()} vendor ped${validVendorCount() === 1 ? '' : 's'} assigned` : (draft?.points?.checkout ? 'Self-checkout point' : 'Assign a vendor ped or set checkout') },
            { label: 'Payment method', ok: !!(draft?.payments?.cash || draft?.payments?.bank) },
            ...(shellRequired ? [
                { label: 'Interior entry', ok: !!shell.entry },
                { label: 'Interior exit', ok: !!shell.exit },
                { label: 'Safe spawn', ok: !!shell.safeSpawn }
            ] : []),
            { label: 'Framework + inventory bridge', ok: readiness ? !!readiness.commerceReady : false, pending: !readiness },
            { label: 'Publish permission', ok: readiness ? !!readiness.publishPermission : false, pending: !readiness }
        ];
    }

    function checklistHtml(items) {
        return items.map(item => `<div class="publish-check ${item.ok ? 'ok' : ''} ${item.pending ? 'pending' : ''}"><b>${item.ok ? '✓' : item.pending ? '…' : '!'}</b><span>${escapeHtml(item.label)}${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ''}</span></div>`).join('');
    }

    function checklist() {
        if (!draft) return;
        byId('sitePublishChecklist').innerHTML = checklistHtml(readinessItems());
        const publishButton = byId('storePublish');
        if (publishButton) publishButton.disabled = state.readOnly || draftDirty || !readiness?.ready;
    }

    function renderTestChecklist() {
        const target = byId('siteTestChecklist');
        if (!target || !draft) return;
        target.innerHTML = checklistHtml(readinessItems());
        const bridge = byId('siteBridgeStatus');
        if (bridge) {
            bridge.textContent = readiness
                ? `FRAMEWORK ${String(readiness.framework || 'unknown').toUpperCase()} · INVENTORY ${String(readiness.inventory || 'unknown').toUpperCase()} · ${readiness.ready ? 'READY' : 'NEEDS ATTENTION'}`
                : 'Not checked yet. SAVE & CHECK verifies the real server bridge and publish requirements.';
            bridge.classList.toggle('ok', readiness?.ready === true);
        }
        const run = byId('siteRunReadiness');
        if (run) {
            run.disabled = state.readOnly || pendingSave;
            run.textContent = pendingSave ? 'SAVING…' : 'SAVE & CHECK';
        }
    }

    function populate() {
        const sf = draft.storefront;
        const ownership = draft.ownership || {};
        const payments = draft.payments || {};
        const supplier = draft.supplier || {};
        const points = draft.points || {};

        byId('storeLabel').value = draft.label || state.project?.name || '';
        byId('storeCategory').value = draft.category || 'general';
        byId('siteWelcome').value = sf.welcome;
        byId('siteTagline').value = sf.tagline;
        byId('siteLogo').value = sf.logo;
        byId('siteBanner').value = sf.banner;
        byId('sitePosMode').value = sf.posMode;
        byId('siteItemsPerPage').value = sf.itemsPerPage;
        byId('siteEnableSearch').checked = sf.search;
        byId('siteShowStock').checked = sf.showStock;
        byId('storeOwnerMode').value = ownership.mode || 'public';
        byId('storeJob').value = ownership.job || '';
        byId('storeGrade').value = ownership.minGrade || 0;
        byId('storeOwnerId').value = ownership.identifier || '';
        byId('storeDuty').checked = ownership.requireDuty === true;
        byId('storeCash').checked = payments.cash !== false;
        byId('storeBank').checked = payments.bank !== false;
        byId('storeDefaultPayment').value = payments.default || 'cash';
        byId('siteSupplierEnabled').checked = supplier.enabled !== false;
        byId('siteSupplierAuto').checked = supplier.autoRestock !== false;
        byId('siteSupplierFlat').value = supplier.deliveryFlatFee || 0;
        byId('siteSupplierPercent').value = supplier.deliveryPercent || 0;
        byId('siteManagerLimit').value = supplier.managerPurchaseLimit || 7500;
        byId('siteOwnerLimit').value = supplier.ownerPurchaseLimit || 250000;
        byId('storeCheckoutStatus').textContent = points.checkout ? 'CHECKOUT ✓' : 'CHECKOUT —';
        byId('storeStockStatus').textContent = points.stock ? 'STOCK ✓' : 'STOCK —';
        byId('storeManagementStatus').textContent = points.management ? 'BOSS MENU ✓' : 'BOSS MENU —';
        byId('storeEmployeeStatus').textContent = points.employee ? 'EMPLOYEE ✓' : 'EMPLOYEE —';
        all('[data-store-theme]').forEach(button => button.classList.toggle('active', button.dataset.storeTheme === sf.theme));
        renderVendorPeds();
    }

    function collect() {
        const sf = draft.storefront;
        draft.label = byId('storeLabel').value.trim();
        draft.category = slug(byId('storeCategory').value, 'general');
        sf.welcome = byId('siteWelcome').value;
        sf.tagline = byId('siteTagline').value;
        sf.logo = byId('siteLogo').value;
        sf.banner = byId('siteBanner').value;
        sf.posMode = byId('sitePosMode').value;
        sf.itemsPerPage = Math.max(1, Math.min(48, Number(byId('siteItemsPerPage').value) || 12));
        sf.search = byId('siteEnableSearch').checked;
        sf.showStock = byId('siteShowStock').checked;
        draft.payments = {
            cash: byId('storeCash').checked,
            bank: byId('storeBank').checked,
            default: byId('storeDefaultPayment').value
        };
        draft.ownership = {
            mode: byId('storeOwnerMode').value,
            job: byId('storeJob').value,
            minGrade: Number(byId('storeGrade').value) || 0,
            identifier: byId('storeOwnerId').value,
            requireDuty: byId('storeDuty').checked
        };
        draft.supplier = {
            enabled: byId('siteSupplierEnabled').checked,
            autoRestock: byId('siteSupplierAuto').checked,
            deliveryFlatFee: Number(byId('siteSupplierFlat').value) || 0,
            deliveryPercent: Number(byId('siteSupplierPercent').value) || 0,
            managerPurchaseLimit: Number(byId('siteManagerLimit').value) || 7500,
            ownerPurchaseLimit: Number(byId('siteOwnerLimit').value) || 250000
        };
        return {
            label: draft.label,
            category: draft.category,
            storefront: sf,
            payments: draft.payments,
            ownership: draft.ownership,
            supplier: draft.supplier,
            vendors: clone(draft.vendors || []),
            products: draft.products
        };
    }

    function renderBuilder(store) {
        draft = defaults(store || state.project?.store || {});
        readiness = null;
        draftDirty = false;
        pendingSave = false;
        pendingTestAfterSave = false;
        populate();
        sortRows('pages');
        sortRows('categories');
        productRows();
        preview();
        checklist();
        renderTestChecklist();
        setStep(0, { force: true });
        all('#storeDialog input,#storeDialog select,#storeDialog button').forEach(control => {
            if (control.id !== 'storeClose') control.disabled = state.readOnly;
        });
        inventoryPickerRequested = false;
        if (!state.readOnly) post('requestInventoryCatalog'); // silent preload so bridged images appear immediately after reopening the editor
    }

    async function saveBuilder(options = {}) {
        const data = collect();
        if (data.label.length < 2) { toast('Give the store a name.', 'warning'); return false; }
        if (!data.payments.cash && !data.payments.bank) { toast('Enable a payment method.', 'warning'); return false; }
        const response = await post('storeConfig', { store: data });
        if (!response?.ok) {
            pendingSave = false;
            pendingTestAfterSave = false;
            renderTestChecklist();
            return false;
        }
        pendingSave = true;
        pendingTestAfterSave = options.runReadiness === true;
        renderTestChecklist();
        toast(options.runReadiness ? 'Saving the design before the readiness check…' : 'Saving store design…', 'info');
        return true;
    }

    async function requestReadinessNow() {
        const data = collect();
        const response = await post('storeReadiness', { store: data });
        if (!response?.ok) toast('Could not start the readiness check.', 'error');
    }

    async function runReadiness() {
        collect();
        for (const step of ['brand', 'pages', 'categories', 'products', 'checkout']) {
            const problem = localStepProblem(step);
            if (problem) {
                setStep(step, { force: true });
                toast(problem, 'warning');
                return;
            }
        }
        readiness = null;
        renderTestChecklist();
        await saveBuilder({ runReadiness: true });
    }

    function syncProject(project) {
        if (!draft || !project) return;
        const serverStore = project.store || {};
        draft.points = clone(serverStore.points || {});
        draft.vendors = clone(serverStore.vendors || draft.vendors || []);
        draft.status = serverStore.status || draft.status;
        populate();
        if (pendingSave) {
            pendingSave = false;
            draftDirty = false;
            toast('Store design saved.', 'success');
            if (pendingTestAfterSave) {
                pendingTestAfterSave = false;
                requestReadinessNow();
            }
        } else {
            readiness = null;
        }
        checklist();
        renderTestChecklist();
        setStep(currentStep, { force: true });
    }

    function publishBuilder() {
        collect();
        if (draftDirty || !readiness?.ready) {
            setStep('test', { force: true });
            toast('Run SAVE & CHECK before publishing so the server verifies this exact setup.', 'warning');
            return;
        }
        post('publishStore');
    }

    function pageRows(store) {
        const pages = (store.storefront?.pages || []).filter(page => page.enabled !== false);
        if (pages.length) return pages.map(page => ({
            id: page.id,
            category: page.category || 'all',
            label: page.label,
            icon: page.category || 'store'
        }));
        return [{ id: 'home', category: 'all', label: 'Shop', icon: 'store' }];
    }

    function categoryRows(store) {
        return [
            { id: 'all', label: 'All Items', icon: 'store' },
            ...(store.storefront?.categories || []).filter(category => category.enabled !== false)
        ];
    }

    function setHeroBackground(sf) {
        const hero = byId('shopHero');
        if (!sf.banner) {
            hero.style.removeProperty('--store-banner');
            hero.classList.remove('has-banner');
            return;
        }
        const safe = String(sf.banner).replace(/["\\\n\r]/g, '');
        hero.style.setProperty('--store-banner', `url("${safe}")`);
        hero.classList.add('has-banner');
    }

    function openCustomer(id, store, stock, salesContext = {}) {
        const normalized = defaults(store);
        const firstPage = pageRows(normalized)[0];
        runtime = {
            storeId: String(id),
            store: normalized,
            stock: stock || {},
            category: firstPage?.category || 'all',
            activePage: firstPage?.id || 'home',
            page: 1,
            pageSize: normalized.storefront.itemsPerPage || 12,
            search: '',
            cart: {},
            salesContext: salesContext || {}
        };
        boss = null;
        const sf = runtime.store.storefront;
        const frame = byId('storefrontRuntime');
        frame.className = `dialog-card storefront-runtime theme-${sf.theme} pos-${sf.posMode}`;
        byId('storefrontCustomer').classList.remove('is-hidden');
        byId('storefrontBoss').classList.add('is-hidden');
        byId('shopLogo').src = sf.logo;
        byId('shopWelcome').textContent = sf.welcome;
        byId('shopTitle').textContent = runtime.store.label;
        byId('shopTagline').textContent = sf.tagline;
        byId('shopStoreId').textContent = runtime.salesContext?.kind === 'vendor' ? `${runtime.salesContext.vendorLabel || 'CASHIER'} · STORE ${runtime.storeId}` : `STORE ${runtime.storeId}`;
        byId('shopSearch').value = '';
        byId('shopSearch').style.display = sf.search ? '' : 'none';

        const payments = runtime.store.payments || {};
        byId('shopPayment').innerHTML = `${payments.cash !== false ? '<option value="cash">CASH</option>' : ''}${payments.bank !== false ? '<option value="bank">CARD</option>' : ''}`;
        if ([...byId('shopPayment').options].some(option => option.value === payments.default)) byId('shopPayment').value = payments.default;

        const sizes = [...new Set([...PAGE_SIZE_CHOICES, sf.itemsPerPage])].filter(value => value >= 1 && value <= 48).sort((a, b) => a - b);
        byId('shopPageSize').innerHTML = sizes.map(size => `<option value="${size}"${size === runtime.pageSize ? ' selected' : ''}>${size} / PAGE</option>`).join('');

        const cartTitle = sf.posMode === 'counter' ? 'ORDER / COUNTER' : sf.posMode === 'instant' ? 'QUICK BUY' : 'YOUR CART / POS';
        const cartTitleNode = byId('shopCart').querySelector('header b');
        if (cartTitleNode) cartTitleNode.textContent = cartTitle;
        setHeroBackground(sf);
        renderNav();
        renderCategoryBar();
        renderProducts();
        renderCart();
        byId('shopDialog').classList.remove('is-hidden');
    }

    function renderNav() {
        const rows = pageRows(runtime.store);
        byId('shopNav').innerHTML = rows.map(page => `
            <button data-page-nav="${escapeHtml(page.id)}" data-cat="${escapeHtml(page.category)}" class="${runtime.activePage === page.id ? 'active' : ''}">
                <img src="${escapeHtml(categoryIcon(runtime.store, page.category))}">
                <span><b>${escapeHtml(page.label)}</b><small>${page.category === 'all' ? 'Store page' : escapeHtml(categoryById(runtime.store, page.category)?.label || 'Collection')}</small></span>
            </button>`).join('');

        all('[data-page-nav]').forEach(button => button.addEventListener('click', () => {
            runtime.activePage = button.dataset.pageNav;
            runtime.category = button.dataset.cat || 'all';
            runtime.page = 1;
            renderNav();
            renderCategoryBar();
            renderProducts();
        }));
    }

    function renderCategoryBar() {
        const rows = categoryRows(runtime.store);
        byId('shopCategoryBar').innerHTML = rows.map(category => `
            <button data-category-filter="${escapeHtml(category.id)}" class="${runtime.category === category.id ? 'active' : ''}">
                <img src="${escapeHtml(ICONS[category.icon] || ICONS.store)}"><span>${escapeHtml(category.label)}</span>
            </button>`).join('');
        all('[data-category-filter]').forEach(button => button.addEventListener('click', () => {
            runtime.category = button.dataset.categoryFilter;
            runtime.activePage = '';
            runtime.page = 1;
            renderNav();
            renderCategoryBar();
            renderProducts();
        }));
    }

    function renderProducts() {
        const sf = runtime.store.storefront;
        const mainPanel = document.querySelector('.storefront-main');
        if (mainPanel) mainPanel.setAttribute('data-active-category', runtime.category || 'all');
        const query = runtime.search.toLowerCase();
        const matching = runtime.store.products.filter(product =>
            (runtime.category === 'all' || product.category === runtime.category) &&
            (!query || `${product.item} ${product.label} ${product.description || ''}`.toLowerCase().includes(query))
        );
        const perPage = runtime.pageSize || sf.itemsPerPage || 12;
        const pages = Math.max(1, Math.ceil(matching.length / perPage));
        runtime.page = Math.min(runtime.page, pages);
        const rows = matching.slice((runtime.page - 1) * perPage, runtime.page * perPage);
        const category = runtime.category === 'all' ? null : categoryById(runtime.store, runtime.category);
        const sectionLabel = category?.label || pageRows(runtime.store).find(page => page.id === runtime.activePage)?.label || 'All Items';

        byId('shopSectionTitle').textContent = sectionLabel.toUpperCase();
        byId('shopCount').textContent = `${matching.length} item${matching.length === 1 ? '' : 's'}`;
        byId('shopHero').innerHTML = `
            <div class="hero-copy"><small>${escapeHtml(sf.welcome || 'WELCOME')}</small><b>${escapeHtml(runtime.store.label)}</b><span>${escapeHtml(sf.tagline)}</span></div>
            <div class="hero-stamp"><strong>OPEN</strong><span>${matching.length} ITEMS</span></div>`;

        byId('shopRows').innerHTML = rows.map(product => {
            const stock = Number(runtime.stock[product.item] || 0);
            const categoryLabel = categoryById(runtime.store, product.category)?.label || 'Store';
            const buttonLabel = sf.posMode === 'instant' ? 'BUY NOW' : sf.posMode === 'counter' ? 'ADD TO ORDER' : 'ADD TO CART';
            return `
                <article class="store-product-card ${stock <= 0 ? 'out' : ''}" data-product-category="${escapeHtml(product.category || 'general')}">
                    <div class="product-media"><img src="${escapeHtml(productImage(runtime.store, product))}" style="${productImageStyle(product)}"><span class="stock-pill">${sf.showStock ? `${stock} IN STOCK` : stock > 0 ? 'AVAILABLE' : 'SOLD OUT'}</span></div>
                    <div class="product-copy"><small>${escapeHtml(categoryLabel)}</small><h3>${escapeHtml(product.label || product.item)}</h3><p>${escapeHtml(product.description || '')}</p></div>
                    <footer class="product-action"><div class="product-price">${money(product.price)}<small> each</small></div><button data-add="${escapeHtml(product.item)}"${stock <= 0 ? ' disabled' : ''}>${buttonLabel}</button></footer>
                </article>`;
        }).join('') || '<div class="storefront-empty"><b>NOTHING HERE YET</b><span>Try another category or search.</span></div>';

        all('[data-add]').forEach(button => button.addEventListener('click', () => {
            const item = button.dataset.add;
            if (sf.posMode === 'instant') {