(() => {
    'use strict';

    // RS StoreBuilder background artwork rotation.
    // The five customer menu styles each receive their own subset so they keep a
    // distinct identity, while the complete supplied background set is exercised.
    const ROTATION_MS = 18000;
    const ASSET_ROOT = 'assets/store_menu/';

    const THEME_POOLS = Object.freeze({
        rail: Object.freeze([
            'manufactured.jpg',
            'displays.jpg',
            'f9c29aa0-0fb2-4efd-8ad0-16d2c6a7182c.png',
            'StockCake-Haunted_Golden_Gaze-1485328-medium.jpg',
            'mian tabe.png',
        ]),
        header: Object.freeze([
            'structure.jpg',
            'checkout.jpg',
            '79afba90-8fbc-4616-a500-c92bb589d062.png',
            "StockCake-Broken_Man's_Gaze-4806388-medium.jpg",
            'StockCake-Fractured_Inner_Light-5031786-medium - Copy - Copy.jpg',
        ]),
        dock: Object.freeze([
            'boutique.jpg',
            'cuisine.jpg',
            'StockCake-Explosive_Pop_Art-4387988-medium.png',
            'StockCake-Moonlit_Gothic_Truck-1894366-medium.jpg',
            'StockCake-Unleashed_Power_Moment-5038704-medium.jpg',
        ]),
        desktop: Object.freeze([
            'electronics.jpg',
            'StockCake-Futuristic_Data_Interface-2287703-medium - Copy.jpg',
            'StockCake-Digital_Shadow_Operative-1492980-medium.jpg',
            'StockCake-Cybernetic_Mind_Surrender-5107828-medium.jpg',
        ]),
        kiosk: Object.freeze([
            'decor.jpg',
            'stock.jpg',
            'mechanic.jpg',
            'StockCake-Gothic_Thunder_Truck-2052301-medium.jpg',
        ]),
    });

    const ALL_BACKGROUNDS = Object.freeze(Object.values(THEME_POOLS).flat());
    const SURFACES = Object.freeze([
        ['#editor', 0],
        ['#projectDialog .dialog-card', 3],
        ['#storeDialog .site-builder-dialog', 7],
        ['#blueprintDialog .dialog-card', 11],
        ['#diagnosticsDialog .dialog-card', 15],
    ]);

    let frame = 0;
    let timer = null;

    function cssImage(filename) {
        const safe = String(filename).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `url("${ASSET_ROOT}${safe}")`;
    }

    function assign(element, filename) {
        if (!element || !filename) return;
        element.style.setProperty('--rs-menu-image', cssImage(filename));
        element.dataset.rsMenuBackground = filename;
    }

    function poolForTheme(theme) {
        return THEME_POOLS[theme] || THEME_POOLS.rail;
    }

    function themeFromClassList(element) {
        if (!element) return 'rail';
        for (const theme of Object.keys(THEME_POOLS)) {
            if (element.classList.contains(`theme-${theme}`)) return theme;
        }
        return 'rail';
    }

    function assignThemeElement(element, theme, offset = 0) {
        const pool = poolForTheme(theme);
        assign(element, pool[(frame + offset) % pool.length]);
    }

    function apply() {
        SURFACES.forEach(([selector, offset]) => {
            const element = document.querySelector(selector);
            assign(element, ALL_BACKGROUNDS[(frame + offset) % ALL_BACKGROUNDS.length]);
        });

        document.querySelectorAll('.theme-picker button[data-store-theme]').forEach((button, index) => {
            assignThemeElement(button, button.dataset.storeTheme, index);
        });

        document.querySelectorAll('.site-step-panel').forEach((panel, index) => {
            assign(panel, ALL_BACKGROUNDS[(frame + (index * 4) + 2) % ALL_BACKGROUNDS.length]);
        });

        const runtime = document.getElementById('storefrontRuntime');
        assignThemeElement(runtime, themeFromClassList(runtime), 1);

        const preview = document.getElementById('sitePreviewCanvas');
        assignThemeElement(preview, themeFromClassList(preview), 2);

        const boss = document.getElementById('storefrontBoss');
        assign(boss, ALL_BACKGROUNDS[(frame + 19) % ALL_BACKGROUNDS.length]);
        document.querySelectorAll('.boss-grid > section').forEach((section, index) => {
            assign(section, ALL_BACKGROUNDS[(frame + 20 + index) % ALL_BACKGROUNDS.length]);
        });
    }

    function watchThemeClass(element, offset) {
        if (!element || typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => assignThemeElement(element, themeFromClassList(element), offset));
        observer.observe(element, { attributes: true, attributeFilter: ['class'] });
    }

    function next() {
        frame = (frame + 1) % ALL_BACKGROUNDS.length;
        apply();
    }

    function start() {
        if (timer) return;
        timer = window.setInterval(() => {
            if (!document.hidden) next();
        }, ROTATION_MS);
    }

    function stop() {
        if (!timer) return;
        window.clearInterval(timer);
        timer = null;
    }

    // Preload local NUI artwork so a rotation does not flash an empty surface.
    ALL_BACKGROUNDS.forEach((filename) => {
        const image = new Image();
        image.src = `${ASSET_ROOT}${filename}`;
    });

    apply();
    watchThemeClass(document.getElementById('storefrontRuntime'), 1);
    watchThemeClass(document.getElementById('sitePreviewCanvas'), 2);
    start();

    // Small debug/config surface for QA from DevTools without adding player UI.
    window.RSMenuBackgrounds = Object.freeze({
        assets: ALL_BACKGROUNDS.slice(),
        themes: THEME_POOLS,
        rotationMs: ROTATION_MS,
        next,
        apply,
        start,
        stop,
    });
})();