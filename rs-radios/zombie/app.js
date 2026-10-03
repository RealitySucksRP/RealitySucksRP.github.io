const resource = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'rs-zombieradio';
const isBrowser = typeof GetParentResourceName !== 'function';
const app = document.getElementById('app');
const shell = document.getElementById('radio-shell');
const screen = document.getElementById('radio-screen');
const content = document.getElementById('screen-content');
const overlay = document.getElementById('roster-overlay');
const radioArt = document.getElementById('radio-art');

const FRAME_GEOMETRY = Object.freeze({
    width: 1080,
    height: 1618,
    // Every frame asset is normalized to the same glass opening. The UI is
    // inset slightly so it never overlaps the physical frame edge.
    screen: Object.freeze([340, 666, 415, 447])
});

const ZOMBIE_FRAMES = [
    { id: 'battered', label: 'BATTERED', note: 'Wrapped field unit', src: 'img/ems-frames/frame-01.png', color: '#e47b4d' },
    { id: 'scavenger', label: 'SCAVENGER', note: 'Yellow / teal salvage', src: 'img/ems-frames/frame-02.png', color: '#d5a745' },
    { id: 'biohazard', label: 'BIOHAZARD', note: 'Containment rig', src: 'img/ems-frames/frame-03.png', color: '#d5b149' },
    { id: 'fortified', label: 'FORTIFIED', note: 'Heavy response shell', src: 'img/ems-frames/frame-04.png', color: '#3ea2a5' },
    { id: 'survivor', label: 'SURVIVOR', note: 'Rugged compact unit', src: 'img/ems-frames/frame-05.png', color: '#bf914e' }
];
const ZOMBIE_PALETTES = [
    { id: 'field', label: 'FIELD', color: '#172018' },
    { id: 'midnight', label: 'MIDNIGHT', color: '#10151a' },
    { id: 'ash', label: 'ASH', color: '#24211f' },
    { id: 'hazard', label: 'HAZARD', color: '#2a2112' }
];

const state = {
    channel: 0,
    channelLabel: 'OFFLINE',
    powered: false,
    battery: 100,
    volume: 55,
    assignment: { team: null, role: 'member', callsign: 'UNKNOWN' },
    channels: [],
    roster: [],
    distressBoard: [],
    profile: {
        volume: 55,
        favorites: [],
        recent: [],
        displayName: '',
        deafened: false,
        micClicks: true,
        allowMovement: true,
        overlayVisible: false,
        overlayMode: 'default',
        overlayScale: 100,
        overlayX: 78,
        overlayY: 8,
        radioPosition: 'right',
        radioX: 62,
        radioY: 15,
        radioScale: 100,
        frame: 'battered',
        font: 'clinical',
        fontSize: 100,
        accent: '#e47b4d',
        background: 'field',
        animation: 'scan'
    },
    ui: { showWindowLabels: false, scaleMin: 75, scaleMax: 120 },
    batteryConfig: { LowThreshold: 15 },
    defaultChannel: 200,
    playerId: null,
    tab: 'roster',
    selected: null,
    entry: '',
    localTalking: false,
    distressActive: false,
    jammed: false,
    waypointEnabled: true,
    mutedPlayers: {},
    jammers: [],
    nearbyJammer: null,
    nearbyJammerDistance: null,
    jammerRange: 30,
    jammerConfig: { enabled: true, rangeMin: 10, rangeMax: 100, rangeStep: 5, defaultRange: 30 },
    voice: { provider: 'unknown', capabilities: { volume: true, deaf: true, perPlayerMute: true, serverOwnedChannels: false, serverOwnedPTT: false } }
};

const sound = {};
for (const name of ['click', 'on', 'off', 'denied', 'static', 'distress']) {
    sound[name] = new Audio(`sounds/radio_${name}.ogg`);
    sound[name].volume = name === 'static' ? .18 : name === 'distress' ? .4 : .35;
}
function play(name) {
    try {
        sound[name].currentTime = 0;
        sound[name].play();
    } catch (_) {}
}
async function nui(event, data = {}) {
    if (isBrowser) return { ok: true, muted: {} };
    return fetch(`https://${resource}/${event}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(response => response.json()).catch(() => ({ ok: false }));
}

let closeRequestInFlight = false;
function requestClose() {
    if (closeRequestInFlight) return;
    closeRequestInFlight = true;
    app.classList.remove('visible');
    app.setAttribute('aria-hidden', 'true');
    Promise.resolve(nui('close')).finally(() => { closeRequestInFlight = false; });
}

const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));
const checked = value => value ? 'checked' : '';

function profileValue(key, fallback) {
    return state.profile?.[key] ?? fallback;
}
function teamLabel() {
    const team = state.assignment?.team;
    return team ? String(team).toUpperCase() : 'NO TEAM ASSIGNED';
}
function conditionClass(value) {
    const safe = String(value || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return safe || 'UNKNOWN';
}
function formatAge(seconds) {
    const value = Math.max(0, Math.round(seconds || 0));
    return value >= 60 ? `${Math.floor(value / 60)}m` : `${value}s`;
}
function distanceTo(member) {
    const selfMember = state.roster.find(entry => Number(entry.id) === Number(state.playerId));
    const selfCoords = selfMember?.coords;
    if (!member.coords || !selfCoords) return member.age > 999 ? '--' : `${member.age || 0}s`;
    const dx = member.coords.x - selfCoords.x;
    const dy = member.coords.y - selfCoords.y;
    const meters = Math.sqrt((dx * dx) + (dy * dy));
    return meters > 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}
function isMuted(id) {
    const muted = state.mutedPlayers || {};
    return muted[id] === true || muted[String(id)] === true || (Array.isArray(muted) && muted.map(Number).includes(Number(id)));
}
function isFavorite(channel) {
    const entry = state.channels.find(item => Number(item.id) === Number(channel));
    return entry?.favorite === true || (state.profile?.favorites || []).map(Number).includes(Number(channel));
}

function renderRoster() {
    if (!state.roster.length) {
        const current = state.channels.find(entry => Number(entry.id) === Number(state.channel));
        if (current && !current.roster) return '<div class="empty">VOICE-ONLY FREQUENCY<br>NO PLAYER LIST SHARED</div>';
        return '<div class="empty">NO OTHER SURVIVORS<br>ON THIS FREQUENCY</div>';
    }

    return state.roster.map(member => `
        <article class="member ${member.talking ? 'talking' : ''} ${member.distress ? 'distress' : ''} ${member.offline ? 'offline' : ''} ${member.jammed ? 'jammed' : ''} ${state.selected === member.id ? 'selected' : ''}" data-member="${Number(member.id)}">
            <div class="member-main">
                <strong>${esc(member.callsign || member.name)}</strong>
                <small>${esc(member.role || 'member')} · ${esc(member.name)}</small>
            </div>
            <div class="member-side">
                <div class="condition ${conditionClass(member.condition)}">${esc(member.jammed ? 'SIGNAL JAMMED' : member.condition)}${member.stale && !member.offline ? ' ?' : ''}</div>
                <small>${member.offline ? `LOST ${formatAge(member.age)}` : `${distanceTo(member)} · SIG ${member.signal || 0}%`}</small>
            </div>
            <div class="location">
                <span>${member.offline ? 'LAST SEEN: ' : ''}${esc(member.street || 'NO GPS')} · ${esc(member.zone || 'UNKNOWN')}</span>
            </div>
            ${Number(member.id) !== Number(state.playerId) && !member.offline && state.voice?.capabilities?.perPlayerMute !== false ? `<button class="mini-button mute-button" data-mute="${Number(member.id)}">${isMuted(member.id) ? 'UNMUTE' : 'MUTE'}</button>` : ''}
        </article>
    `).join('');
}

function channelBadge(channel) {
    if (channel.favorite) return 'FAVORITE';
    if (channel.recommended) return 'RECOMMENDED';
    if (channel.recent) return 'RECENT';
    return channel.telemetry ? 'SQUAD TELEMETRY' : channel.roster ? 'PLAYER LIST' : 'VOICE ONLY';
}
function renderChannels() {
    if (!state.channels.length) return '<div class="empty">NO CONFIGURED FREQUENCIES</div>';
    return state.channels.map(channel => `
        <article class="channel-row ${channel.locked ? 'locked' : ''} ${Number(state.channel) === Number(channel.id) ? 'live' : ''}" data-channel="${Number(channel.id)}">
            <span class="freq">${String(channel.id).padStart(3, '0')}</span>
            <div>
                <strong>${esc(channel.label)}</strong>
                <small>${channelBadge(channel)}${channel.locked ? ' · LOCKED' : ''}</small>
            </div>
            <div class="channel-actions">
                <button class="star-button ${channel.favorite ? 'active' : ''}" data-favorite="${Number(channel.id)}" title="Favorite">${channel.favorite ? '★' : '☆'}</button>
                <button class="join-button">${Number(state.channel) === Number(channel.id) ? 'LIVE' : 'JOIN'}</button>
            </div>
        </article>
    `).join('');
}

function renderDistress() {
    if (!state.distressBoard.length) return '<div class="empty">NO ACTIVE DISTRESS SIGNALS<br>RECEIVED BY THIS RADIO</div>';
    return state.distressBoard.map(entry => `
        <article class="distress-card">
            <div class="distress-title">
                <strong>${esc(entry.callsign || entry.name || 'UNKNOWN')}</strong>
                <span data-expires="${Number(entry.expires || 0)}">${Math.max(0, Math.ceil(Number(entry.expires || 0) - (Date.now() / 1000)) || Number(entry.seconds) || 0)}s</span>
            </div>
            <small>${esc(entry.channelLabel || `FREQUENCY ${entry.channel}`)} · ${esc(entry.condition || 'UNKNOWN')}</small>
            <div class="distress-location">${esc(entry.street || 'UNKNOWN POSITION')} · ${esc(entry.zone || '')}</div>
            ${state.waypointEnabled && entry.coords ? `<button class="gps-button" data-waypoint='${esc(JSON.stringify(entry.coords))}'>SET GPS</button>` : ''}
        </article>
    `).join('');
}

function renderMedical() {
    const member = state.roster.find(entry => Number(entry.id) === Number(state.selected)) || state.roster[0];
    if (!member) return '<div class="empty">SELECT A TEAM MEMBER<br>TO READ MEDICAL STATUS</div>';
    const vitals = member.vitals || {};
    return `
        <article class="medical-card">
            <div class="member-main">
                <strong>${esc(member.callsign || member.name)}</strong>
                <small>${esc(member.street || 'NO GPS')} · ${esc(member.zone || 'UNKNOWN')}</small>
            </div>
            <div class="condition ${conditionClass(member.condition)}">${esc(member.condition)}${member.stale ? ' · LAST KNOWN' : ''}</div>
            <div class="vitals">
                <div class="vital"><b>${member.health ?? '--'}%</b><small>HEALTH</small></div>
                <div class="vital"><b>${member.armor ?? '--'}%</b><small>ARMOR</small></div>
                <div class="vital"><b>${member.bleeding ? 'YES' : 'NO'}</b><small>BLEEDING</small></div>
                <div class="vital"><b>${vitals.hr ?? '--'}</b><small>HEART RATE</small></div>
                <div class="vital"><b>${vitals.spo2 ?? '--'}</b><small>SPO₂</small></div>
                <div class="vital"><b>${vitals.sys && vitals.dia ? `${vitals.sys}/${vitals.dia}` : '--'}</b><small>BLOOD PRESSURE</small></div>
            </div>
        </article>
    `;
}

function renderSettings() {
    const p = state.profile || {};
    const ui = state.ui || {};
    const voiceCaps = state.voice?.capabilities || {};
    const frame = profileValue('frame', 'battered');
    const background = profileValue('background', 'field');
    const font = profileValue('font', 'clinical');
    const fontSize = Number(profileValue('fontSize', 100));
    const accent = profileValue('accent', '#e47b4d');
    const volumeSetting = voiceCaps.volume === false
        ? `<div class="setting wide"><span>RADIO OUTPUT</span><small>CFX NATIVE · radio-only volume override is not exposed by the current Enhanced voice API.</small></div>`
        : `<label class="setting"><span>VOLUME ${Number(p.volume ?? state.volume)}%</span><input data-setting="volume" type="range" min="0" max="100" step="5" value="${Number(p.volume ?? state.volume)}" /></label>`;
    const jc = state.jammerConfig || {};
    const nearby = state.nearbyJammer;
    const allowed = (nearby?.allowedChannels || []).map(Number);
    const currentAllowed = state.channel > 0 && allowed.includes(Number(state.channel));
    const displayNameSetting = ui.allowCustomDisplayName === false ? '' : `<label class="setting wide"><span>DISPLAY NAME</span><input id="setting-name" maxlength="32" value="${esc(p.displayName || '')}" placeholder="Use character name" /></label>`;
    const movementSetting = ui.allowMovementToggle === false ? '' : `<label class="setting toggle"><span>MOVE WHILE OPEN</span><input data-setting="allowMovement" type="checkbox" ${checked(p.allowMovement)} /></label>`;
    const radioScaleSetting = ui.allowScaleSettings === false ? '' : `<label class="setting"><span>RADIO SCALE ${Number(p.radioScale || 100)}%</span><input data-setting="radioScale" type="range" min="${ui.scaleMin || 75}" max="${ui.scaleMax || 120}" step="5" value="${Number(p.radioScale || 100)}" /></label>`;
    const overlayScaleSetting = ui.allowScaleSettings === false ? '' : `<label class="setting"><span>OVERLAY SCALE ${Number(p.overlayScale || 100)}%</span><input data-setting="overlayScale" type="range" min="60" max="160" step="5" value="${Number(p.overlayScale || 100)}" /></label>`;
    const positionSettings = ui.allowPositionSettings === false ? '' : `
        <label class="setting"><span>RADIO X ${Number(p.radioX || 0)}%</span><input data-setting="radioX" type="range" min="0" max="92" step="1" value="${Number(p.radioX || 0)}" /></label>
        <label class="setting"><span>RADIO Y ${Number(p.radioY || 0)}%</span><input data-setting="radioY" type="range" min="0" max="90" step="1" value="${Number(p.radioY || 0)}" /></label>
        <label class="setting"><span>OVERLAY X ${Number(p.overlayX || 0)}%</span><input data-setting="overlayX" type="range" min="0" max="95" step="1" value="${Number(p.overlayX || 0)}" /></label>
        <label class="setting"><span>OVERLAY Y ${Number(p.overlayY || 0)}%</span><input data-setting="overlayY" type="range" min="0" max="95" step="1" value="${Number(p.overlayY || 0)}" /></label>
        <div class="setting-buttons wide">
            <button data-preset="left">RADIO LEFT</button>
            <button data-preset="right">RADIO RIGHT</button>
            <button data-preset="reset">RESET LAYOUT</button>
        </div>`;
    return `
        <div class="settings-grid">
            <section class="visual-panel wide">
                <div class="settings-heading"><strong>RADIO FRAME</strong><span>${esc(frame.toUpperCase())}</span></div>
                <div class="frame-grid">
                    ${ZOMBIE_FRAMES.map(item => `<button class="frame-choice ${item.id === frame ? 'active' : ''}" data-frame-choice="${item.id}" style="--choice-accent:${item.color}"><span class="frame-preview"><img src="${item.src}" alt="" /></span><b>${item.label}</b><small>${item.note}</small></button>`).join('')}
                </div>
            </section>
            <section class="visual-panel wide">
                <div class="settings-heading"><strong>DISPLAY STYLE</strong><span>NO-OVERLAP MODE</span></div>
                <label class="setting wide"><span>TYPEFACE</span><select data-setting="font"><option value="clinical" ${font === 'clinical' ? 'selected' : ''}>CLINICAL SANS</option><option value="tactical" ${font === 'tactical' ? 'selected' : ''}>TACTICAL MONO</option><option value="signal" ${font === 'signal' ? 'selected' : ''}>SIGNAL SQUARE</option><option value="dispatch" ${font === 'dispatch' ? 'selected' : ''}>DISPATCH CONDENSED</option><option value="modern" ${font === 'modern' ? 'selected' : ''}>MODERN CLEAN</option></select></label>
                <label class="setting wide"><span>TEXT SIZE ${fontSize}%</span><input data-setting="fontSize" type="range" min="88" max="116" step="2" value="${fontSize}" /></label>
                <div class="color-row"><label class="color-input"><span>ACCENT COLOR</span><input data-setting="accent" type="color" value="${/^#[0-9a-f]{6}$/i.test(accent) ? accent : '#e47b4d'}" /></label><div class="palette-wrap"><span>BACKGROUND PALETTE</span><div class="palette-grid">${ZOMBIE_PALETTES.map(item => `<button class="palette-choice ${item.id === background ? 'active' : ''}" data-palette="${item.id}" style="--choice-accent:${item.color}" title="${item.label}"><i></i><b>${item.label}</b></button>`).join('')}</div></div></div>
                <label class="setting wide"><span>ANIMATION</span><select data-setting="animation"><option value="clean" ${profileValue('animation', 'scan') === 'clean' ? 'selected' : ''}>CLEAN / STILL</option><option value="scan" ${profileValue('animation', 'scan') === 'scan' ? 'selected' : ''}>SOFT SCAN</option><option value="pulse" ${profileValue('animation', 'scan') === 'pulse' ? 'selected' : ''}>STATUS PULSE</option></select></label>
            </section>
            ${displayNameSetting}
            ${volumeSetting}
            <label class="setting toggle"><span>RADIO DEAFEN</span><input data-setting="deafened" type="checkbox" ${checked(p.deafened)} /></label>
            <label class="setting toggle"><span>MIC CLICKS</span><input data-setting="micClicks" type="checkbox" ${checked(p.micClicks)} /></label>
            ${movementSetting}
            <label class="setting toggle"><span>PLAYER OVERLAY</span><input data-setting="overlayVisible" type="checkbox" ${checked(p.overlayVisible)} /></label>
            <label class="setting"><span>OVERLAY MODE</span><select data-setting="overlayMode">
                <option value="default" ${p.overlayMode === 'default' ? 'selected' : ''}>ON RADIO</option>
                <option value="always" ${p.overlayMode === 'always' ? 'selected' : ''}>ALWAYS</option>
                <option value="never" ${p.overlayMode === 'never' ? 'selected' : ''}>NEVER</option>
            </select></label>
            ${radioScaleSetting}
            ${overlayScaleSetting}
            ${positionSettings}
            ${jc.enabled ? `
                <section class="jammer-panel wide">
                    <div class="jammer-heading"><strong>SIGNAL JAMMER</strong><span>${nearby ? `${nearby.enabled ? 'ACTIVE' : 'DISABLED'} · ${Number(state.nearbyJammerDistance || 0).toFixed(1)}m` : 'NO JAMMER IN REACH'}</span></div>
                    <label class="setting wide"><span>DEPLOY / SET RANGE ${Number(state.jammerRange || jc.defaultRange || 30)}m</span><input id="jammer-range" type="range" min="${Number(jc.rangeMin || 10)}" max="${Number(jc.rangeMax || 100)}" step="${Number(jc.rangeStep || 5)}" value="${Number(state.jammerRange || jc.defaultRange || 30)}" /></label>
                    ${nearby ? `<small class="jammer-copy">ID ${esc(nearby.id)} · RANGE ${Number(nearby.range || 0)}m · PASS ${allowed.length ? allowed.join(', ') : 'NONE'}${state.channel > 0 ? ` · CH ${state.channel} ${currentAllowed ? 'PASSES' : 'BLOCKED'}` : ''}</small>` : '<small class="jammer-copy">Deploy a jammer in front of you, or move close to one to configure it.</small>'}
                    <div class="jammer-actions">
                        <button data-jammer="place">DEPLOY</button>
                        <button data-jammer="refresh">REFRESH</button>
                        <button data-jammer="range" ${nearby ? '' : 'disabled'}>APPLY RANGE</button>
                        <button data-jammer="toggle" ${nearby ? '' : 'disabled'}>${nearby?.enabled ? 'TURN OFF' : 'TURN ON'}</button>
                        <button data-jammer="allow" ${nearby && state.channel > 0 ? '' : 'disabled'}>${currentAllowed ? 'BLOCK CURRENT' : 'PASS CURRENT'}</button>
                        <button data-jammer="remove" ${nearby?.canRemove ? '' : 'disabled'}>RECOVER</button>
                    </div>
                </section>
            ` : ''}
            <div class="setting-buttons wide">
                <button data-profile-reset="true">RESET ALL RADIO SETTINGS</button>
            </div>
        </div>
    `;
}

function bindContentActions() {
    content.querySelectorAll('[data-frame-choice]').forEach(button => {
        button.onclick = () => { previewProfile({ frame: button.dataset.frameChoice }, true); play('click'); render(); };
    });
    content.querySelectorAll('[data-palette]').forEach(button => {
        button.onclick = () => { updateProfile({ background: button.dataset.palette }); play('click'); };
    });
    content.querySelectorAll('[data-member]').forEach(element => {
        element.onclick = event => {
            if (event.target.closest('[data-mute]')) return;
            state.selected = Number(element.dataset.member);
            state.tab = 'medical';
            play('click');
            render();
        };
    });
    content.querySelectorAll('[data-mute]').forEach(button => {
        button.onclick = async event => {
            event.stopPropagation();
            const response = await nui('toggleMutePlayer', { id: Number(button.dataset.mute) });
            if (response?.muted) state.mutedPlayers = response.muted;
            play('click');
            render();
        };
    });
    content.querySelectorAll('[data-channel]').forEach(element => {
        element.onclick = event => {
            if (event.target.closest('[data-favorite]')) return;
            const channel = state.channels.find(entry => Number(entry.id) === Number(element.dataset.channel));
            if (!channel || channel.locked) return play('denied');
            joinChannel(channel.id);
        };
    });
    content.querySelectorAll('[data-favorite]').forEach(button => {
        button.onclick = event => {
            event.stopPropagation();
            const channel = Number(button.dataset.favorite);
            const entry = state.channels.find(item => Number(item.id) === channel);
            if (!entry) return;
            entry.favorite = !entry.favorite;
            nui('favorite', { channel, favorite: entry.favorite });
            play('click');
            render();
        };
    });
    content.querySelectorAll('[data-waypoint]').forEach(button => {
        button.onclick = () => {
            try { nui('waypoint', { coords: JSON.parse(button.dataset.waypoint) }); } catch (_) {}
            play('click');
        };
    });
    content.querySelectorAll('[data-setting]').forEach(input => {
        const readValue = () => input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;

        if (input.type === 'range') {
            input.oninput = () => {
                const key = input.dataset.setting;
                const value = readValue();
                updateSettingLabel(input);
                previewProfile({ [key]: value });
            };
            input.onchange = () => {
                const key = input.dataset.setting;
                const value = readValue();
                updateSettingLabel(input);
                previewProfile({ [key]: value }, true);
            };
        } else {
            input.onchange = () => {
                const key = input.dataset.setting;
                const value = readValue();
                updateProfile({ [key]: value });
            };
        }
    });
    const nameInput = document.getElementById('setting-name');
    if (nameInput) nameInput.onchange = () => updateProfile({ displayName: nameInput.value.trim() });
    content.querySelectorAll('[data-preset]').forEach(button => {
        button.onclick = () => {
            const preset = button.dataset.preset;
            if (preset === 'left') updateProfile({ radioPosition: 'left', radioX: 1, radioY: 15 });
            if (preset === 'right') updateProfile({ radioPosition: 'right', radioX: 62, radioY: 15 });
            if (preset === 'reset') updateProfile({
                radioPosition: 'right', radioX: 62, radioY: 15, radioScale: 100,
                overlayX: 78, overlayY: 8, overlayScale: 100
            });
            play('click');
        };
    });
    const jammerRange = document.getElementById('jammer-range');
    if (jammerRange) jammerRange.oninput = () => {
        state.jammerRange = Number(jammerRange.value);
        const label = jammerRange.closest('.setting')?.querySelector('span');
        if (label) label.textContent = `DEPLOY / SET RANGE ${state.jammerRange}m`;
    };
    content.querySelectorAll('[data-jammer]').forEach(button => {
        button.onclick = () => {
            const action = button.dataset.jammer;
            const range = Number(document.getElementById('jammer-range')?.value || state.jammerRange || state.jammerConfig?.defaultRange || 30);
            state.jammerRange = range;
            if (action === 'place') nui('placeJammer', { range });
            else if (action === 'refresh') nui('requestJammerStatus');
            else if (action === 'range') nui('jammerAction', { action: 'range', value: range });
            else if (action === 'allow') nui('jammerAction', { action: 'allow', value: Number(state.channel) });
            else nui('jammerAction', { action });
            play('click');
        };
    });
    content.querySelectorAll('[data-profile-reset]').forEach(button => {
        button.onclick = () => { nui('resetProfile'); play('click'); };
    });
}

function renderOverlay() {
    const mode = profileValue('overlayMode', 'default');
    const enabled = profileValue('overlayVisible', false);
    const shouldShow = mode !== 'never' && enabled && (mode === 'always' || state.powered);
    overlay.classList.toggle('visible', shouldShow);
    overlay.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    overlay.style.left = `${Number(profileValue('overlayX', 78))}vw`;
    overlay.style.top = `${Number(profileValue('overlayY', 8))}vh`;
    overlay.style.transform = `scale(${Number(profileValue('overlayScale', 100)) / 100})`;
    overlay.innerHTML = `
        <header><strong>${esc(state.channelLabel || 'RADIO OFFLINE')}</strong><span>${state.jammed ? 'JAMMED' : String(state.channel || '---')}</span></header>
        ${(state.roster || []).filter(member => !member.offline).map(member => `
            <div class="overlay-member ${member.talking ? 'talking' : ''} ${member.distress ? 'distress' : ''}">
                <b>${esc(member.callsign || member.name)}</b><span>${member.talking ? 'TX' : member.jammed ? 'JAM' : esc(member.condition || 'ONLINE')}</span>
            </div>
        `).join('') || '<div class="overlay-empty">NO MEMBERS</div>'}
    `;
}

function applyLayout() {
    shell.style.left = `${Number(profileValue('radioX', 62))}vw`;
    shell.style.top = `${Number(profileValue('radioY', 15))}vh`;
    shell.style.transform = `scale(${Number(profileValue('radioScale', 100)) / 100})`;
}
function applyVisualSettings() {
    const frame = ZOMBIE_FRAMES.find(item => item.id === profileValue('frame', 'battered')) || ZOMBIE_FRAMES[0];
    const background = ZOMBIE_PALETTES.some(item => item.id === profileValue('background', 'field')) ? profileValue('background', 'field') : 'field';
    const font = ['clinical', 'tactical', 'signal', 'dispatch', 'modern'].includes(profileValue('font', 'clinical')) ? profileValue('font', 'clinical') : 'clinical';
    const animation = ['clean', 'scan', 'pulse'].includes(profileValue('animation', 'scan')) ? profileValue('animation', 'scan') : 'scan';
    const fontSize = Math.max(88, Math.min(116, Number(profileValue('fontSize', 100)) || 100));
    shell.dataset.frame = frame.id;
    radioArt.src = frame.src;
    radioArt.alt = `${frame.label} survival handheld radio`;
    screen.dataset.background = background;
    screen.dataset.font = font;
    screen.dataset.animation = animation;
    screen.style.setProperty('--font-zoom', String(fontSize / 100));
    screen.style.setProperty('--ui-accent', /^#[0-9a-f]{6}$/i.test(profileValue('accent', '')) ? profileValue('accent', '').toLowerCase() : '#e47b4d');
    // Frame selection must never move or resize the display. All five PNGs
    // share this canonical geometry, so only the surrounding artwork changes.
    shell.style.aspectRatio = `${FRAME_GEOMETRY.width} / ${FRAME_GEOMETRY.height}`;
    Object.assign(radioArt.style, { top: '0', left: '0', width: '100%', height: '100%' });

    const [screenX, screenY, screenW, screenH] = FRAME_GEOMETRY.screen;
    const bezel = document.getElementById('screen-bezel');
    Object.assign(bezel.style, {
        left: `${screenX / FRAME_GEOMETRY.width * 100}%`,
        top: `${screenY / FRAME_GEOMETRY.height * 100}%`,
        width: `${screenW / FRAME_GEOMETRY.width * 100}%`,
        height: `${screenH / FRAME_GEOMETRY.height * 100}%`
    });
}

function renderScreen() {
    screen.classList.toggle('powered-off', !state.powered);
    screen.classList.toggle('signal-jammed', state.jammed);
    document.getElementById('screen-team').textContent = teamLabel();
    document.getElementById('screen-signal').textContent = state.jammed ? 'LINK JAM' : `LINK ${state.powered ? '100' : '000'}%`;
    document.getElementById('screen-battery').textContent = `BAT ${Math.max(0, Math.round(state.battery))}%`;
    document.getElementById('screen-frequency').textContent = state.channel ? String(state.channel).padStart(3, '0') : '---';
    document.getElementById('screen-channel').textContent = state.powered ? state.channelLabel : 'RADIO OFFLINE';
    const shownVolume = Number(state.profile?.volume ?? state.volume ?? 0);
    const voiceStatus = state.profile?.deafened ? 'DEAFENED' : (state.voice?.capabilities?.volume === false ? 'CFX NATIVE' : `VOL ${shownVolume}%`);
    document.getElementById('screen-callsign').textContent = `${state.assignment?.callsign || 'NO CALLSIGN'} · ${voiceStatus}`;

    const talk = document.getElementById('screen-talk');
    talk.textContent = state.jammed ? 'JAMMED' : state.localTalking ? 'TRANSMIT' : (state.powered ? 'STANDBY' : 'POWER OFF');
    talk.classList.toggle('talking', state.localTalking && !state.jammed);

    const batteryEl = document.getElementById('screen-battery');
    batteryEl.classList.toggle('low', state.battery <= (state.batteryConfig?.LowThreshold ?? 15));
    const distressButton = document.getElementById('distress-button');
    distressButton.textContent = state.distressActive ? 'CANCEL SOS' : 'DISTRESS';
    distressButton.classList.toggle('active', state.distressActive);
    document.getElementById('last-sync').textContent = `RS LINK · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('keypad-entry').textContent = state.entry ? `FREQ ${state.entry}` : '';

    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === state.tab));
    content.innerHTML = state.tab === 'channels' ? renderChannels()
        : state.tab === 'distress' ? renderDistress()
        : state.tab === 'medical' ? renderMedical()
        : state.tab === 'settings' ? renderSettings()
        : renderRoster();
    bindContentActions();
}
function render() {
    applyLayout();
    applyVisualSettings();
    renderScreen();
    renderOverlay();
    document.querySelectorAll('.window-label').forEach(element => {
        element.style.display = state.ui?.showWindowLabels ? '' : 'none';
    });
}

function showTab(tab) {
    state.tab = tab;
    play('click');
    render();
}
function joinChannel(channel) {
    const configured = state.channels.find(entry => Number(entry.id) === Number(channel));
    if (configured?.locked) return play('denied');
    nui('join', { channel: Number(channel) });
    play('static');
    state.entry = '';
    render();
}
function togglePower() {
    if (state.powered) {
        nui('leave');
        state.powered = false;
        state.channel = 0;
        play('off');
    } else {
        const target = state.defaultChannel || state.channel || state.channels.find(channel => !channel.locked)?.id || 200;
        joinChannel(target);
        play('on');
    }
    render();
}
function sendDistress() {
    nui('distress');
    play('click');
}
function updateProfile(patch) {
    state.profile = { ...(state.profile || {}), ...patch };
    state.volume = state.profile.volume ?? state.volume;
    nui('profile', patch);
    render();
}

let profilePreviewTimer = 0;
function previewProfile(patch, sendNow = false) {
    state.profile = { ...(state.profile || {}), ...patch };
    state.volume = state.profile.volume ?? state.volume;
    applyLayout();
    applyVisualSettings();
    renderOverlay();
    renderScreenHeaderOnly();

    if (profilePreviewTimer) clearTimeout(profilePreviewTimer);
    const flush = () => {
        profilePreviewTimer = 0;
        nui('profile', patch);
    };
    if (sendNow) flush();
    else profilePreviewTimer = setTimeout(flush, 275);
}

function renderScreenHeaderOnly() {
    const battery = document.getElementById('screen-battery');
    const callsign = document.getElementById('screen-callsign');
    if (battery) battery.textContent = `BAT ${Math.max(0, Math.round(state.battery))}%`;
    if (callsign) {
        const shownVolume = Number(state.profile?.volume ?? state.volume ?? 0);
        const voiceStatus = state.profile?.deafened ? 'DEAFENED' : (state.voice?.capabilities?.volume === false ? 'CFX NATIVE' : `VOL ${shownVolume}%`);
        callsign.textContent = `${state.assignment?.callsign || 'NO CALLSIGN'} · ${voiceStatus}`;
    }
}

function updateSettingLabel(input) {
    const label = input.closest('.setting')?.querySelector('span');
    if (!label) return;
    const key = input.dataset.setting;
    if (input.type === 'range') {
        const names = { volume: 'VOLUME', radioScale: 'RADIO SCALE', overlayScale: 'OVERLAY SCALE', radioX: 'RADIO X', radioY: 'RADIO Y', overlayX: 'OVERLAY X', overlayY: 'OVERLAY Y', fontSize: 'TEXT SIZE' };
        const suffix = key === 'volume' || key === 'radioScale' || key === 'overlayScale' || key === 'radioX' || key === 'radioY' || key === 'overlayX' || key === 'overlayY' || key === 'fontSize' ? '%' : '';
        label.textContent = `${names[key] || key.toUpperCase()} ${Number(input.value)}${suffix}`;
    }
}

const keypad = document.getElementById('keypad');
['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].forEach(value => {
    const button = document.createElement('button');
    button.className = 'key';
    button.textContent = value;
    button.onclick = () => {
        play('click');
        if (value === '*') state.entry = '';
        else if (value === '#') { if (state.entry) joinChannel(Number(state.entry)); }
        else if (state.entry.length < 3) state.entry += value;
        render();
    };
    keypad.appendChild(button);
});

document.querySelectorAll('.hotspot').forEach(button => {
    button.onclick = async () => {
        const action = button.dataset.action;
        if (action === 'power') togglePower();
        if (action === 'volume') {
            if (state.voice?.capabilities?.volume === false) {
                play('denied');
            } else {
                const current = Number(state.profile?.volume ?? state.volume ?? 0);
                const requested = current >= 100 ? 20 : Math.min(100, current + 20);
                const response = await nui('volume', { volume: requested });
                if (response?.ok !== false) {
                    const applied = Number(response?.volume ?? requested);
                    state.volume = applied;
                    state.profile.volume = applied;
                    play('click');
                    render();
                } else play('denied');
            }
        }
        if (action === 'leave') { nui('leave'); play('off'); }
        if (action === 'distress') sendDistress();
        if (action === 'close') requestClose();
    };
});

document.getElementById('distress-button').onclick = sendDistress;
document.querySelectorAll('.tab').forEach(tab => { tab.onclick = () => showTab(tab.dataset.tab); });

document.addEventListener('keydown', event => {
    // ---------------------------------------------------------------------
    // Browser default-action guard
    //
    // While this UI is open the client runs SetNuiFocus(true, true), so CEF --
    // not the game -- sees these keys first. F11 is CEF's FULLSCREEN toggle:
    // pressing a device's own open/close key while its UI was focused drove
    // the embedded browser through a fullscreen transition and took the client
    // down with it. Opening was always safe because focus is not set yet, and
    // Escape was always safe because it already calls preventDefault below.
    // That asymmetry was the entire bug.
    //
    // preventDefault suppresses only the BROWSER's default action. The Lua
    // RegisterKeyMapping command is dispatched by the command system over raw
    // input (SetNuiFocusKeepInput), so the key still closes the device -- it
    // just no longer toggles fullscreen on the way out. F5 (reload), F10 (menu
    // bar) and F12 (devtools) are the same class of browser default and are
    // swallowed here for the same reason, whichever F-key a device is bound to.
    // ---------------------------------------------------------------------
    if (event.key === 'F5' || event.key === 'F10' || event.key === 'F11' || event.key === 'F12') {
        event.preventDefault();
        return;
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        if (!event.repeat) requestClose();
        return;
    }
    const active = document.activeElement;
    const typing = active && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName);
    if (typing) return;
    if (/^[0-9]$/.test(event.key) && state.entry.length < 3 && state.tab !== 'settings') {
        state.entry += event.key;
        render();
    }
    if (event.key === 'Enter' && state.entry) joinChannel(Number(state.entry));
    if (event.key === 'Backspace' && state.tab !== 'settings') {
        state.entry = state.entry.slice(0, -1);
        render();
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const tabs = ['roster', 'channels', 'distress', 'medical', 'settings'];
        const current = tabs.indexOf(state.tab);
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        state.tab = tabs[(current + direction + tabs.length) % tabs.length];
        play('click');
        render();
    }
});

window.addEventListener('message', async event => {
    const data = event.data || {};
    if (data.action === 'requestClose') {
        requestClose();
        return;
    }
    if (data.action === 'visible') {
        app.classList.toggle('visible', data.visible === true);
        app.setAttribute('aria-hidden', data.visible ? 'false' : 'true');
    }
    if (data.action === 'state') {
        Object.assign(state, data);
        state.profile = { ...state.profile, ...(data.profile || {}) };
        if (data.voice) state.voice = { ...state.voice, ...data.voice, capabilities: { ...(state.voice?.capabilities || {}), ...(data.voice.capabilities || {}) } };
        state.volume = state.profile.volume ?? data.volume ?? state.volume;
        const response = await nui('getMutedPlayers');
        if (response?.muted) state.mutedPlayers = response.muted;
    }
    if (data.action === 'joined') {
        Object.assign(state, {
            channel: data.channel,
            channelLabel: data.label,
            powered: true,
            battery: data.battery,
            volume: data.volume ?? state.volume,
            jammed: data.jammed === true
        });
        if (data.channels) state.channels = data.channels;
        if (data.voice) state.voice = { ...state.voice, ...data.voice, capabilities: { ...(state.voice?.capabilities || {}), ...(data.voice.capabilities || {}) } };
        if (data.volume !== undefined) state.profile.volume = data.volume;
    }
    if (data.action === 'left') Object.assign(state, { channel: 0, channelLabel: 'OFFLINE', powered: false, roster: [], jammed: false });
    if (data.action === 'roster') state.roster = data.roster || [];
    if (data.action === 'distressBoard') state.distressBoard = data.distressBoard || [];
    if (data.action === 'battery') state.battery = data.battery;
    if (data.action === 'volume') {
        state.volume = data.volume;
        state.profile.volume = data.volume;
        state.profile.deafened = data.deafened === true;
    }
    if (data.action === 'profile') {
        state.profile = { ...state.profile, ...(data.profile || {}) };
        state.volume = state.profile.volume ?? state.volume;
        if (data.channels) state.channels = data.channels;
    }
    if (data.action === 'jammer') state.jammed = data.jammed === true;
    if (data.action === 'jammers') state.jammers = data.jammers || [];
    if (data.action === 'jammerStatus') {
        state.nearbyJammer = data.jammer || null;
        state.nearbyJammerDistance = data.distance ?? null;
        if (data.jammer?.range) state.jammerRange = Number(data.jammer.range);
    }
    if (data.action === 'localTalking') state.localTalking = data.talking === true;
    if (data.action === 'nativePttClick') play('click');
    if (data.action === 'memberTalking') {
        const member = state.roster.find(entry => Number(entry.id) === Number(data.id));
        if (member) member.talking = data.talking === true;
    }
    if (data.action === 'distressState') {
        state.distressActive = data.active === true;
        if (data.active) play('distress');
    }
    if (data.action === 'distressAlert') {
        play('distress');
        screen.classList.add('distress-alert');
        setTimeout(() => screen.classList.remove('distress-alert'), 1800);
        if (state.tab !== 'settings') state.tab = 'distress';
    }
    if (data.action === 'denied') play('denied');
    render();
});

setInterval(() => {
    const sync = document.getElementById('last-sync');
    if (sync) sync.textContent = `RS LINK · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    document.querySelectorAll('[data-expires]').forEach(element => {
        const seconds = Math.max(0, Math.ceil(Number(element.dataset.expires || 0) - (Date.now() / 1000)));
        element.textContent = `${seconds}s`;
    });
}, 1000);

if (isBrowser) {
    Object.assign(state, {
        powered: true,
        channel: 101,
        channelLabel: 'ALPHA SQUAD',
        battery: 64,
        playerId: 1,
        assignment: { team: 'alpha', role: 'leader', callsign: 'A-1' },
        channels: [
            { id: 101, label: 'ALPHA SQUAD', telemetry: true, roster: true, locked: false, favorite: true, recommended: true },
            { id: 102, label: 'BRAVO SQUAD', telemetry: true, roster: true, locked: true },
            { id: 110, label: 'FIELD MEDICAL', telemetry: true, roster: true, locked: true },
            { id: 120, label: 'COMMAND NET', telemetry: true, roster: true, locked: false, recommended: true },
            { id: 200, label: 'SURVIVOR NETWORK', telemetry: false, roster: true, locked: false },
            { id: 911, label: 'EMERGENCY BROADCAST', telemetry: false, roster: true, locked: false }
        ],
        roster: [
            { id: 1, callsign: 'A-1', name: 'Alex Mercer', role: 'leader', condition: 'STABLE', health: 91, armor: 38, street: 'Joshua Road', zone: 'Grand Senora Desert', signal: 100, talking: true, age: 0, coords: {x: 0, y: 0}, vitals: { hr: 92, spo2: 98, sys: 132, dia: 84 } },
            { id: 2, callsign: 'A-2', name: 'Mara Cole', role: 'medic', condition: 'INJURED', health: 58, armor: 0, bleeding: true, street: 'Smoke Tree Road', zone: 'Sandy Shores', signal: 82, age: 2, coords: {x: 110, y: 42}, vitals: { hr: 118, spo2: 94, sys: 108, dia: 70 } },
            { id: 3, callsign: 'A-3', name: 'Dane Ross', role: 'scout', condition: 'CRITICAL', health: 21, armor: 0, bleeding: true, street: 'Route 68', zone: 'Harmony', signal: 41, distress: true, age: 6, coords: {x: 720, y: 170}, vitals: { hr: 146, spo2: 87, sys: 86, dia: 52 } }
        ],
        distressBoard: [
            { id: 3, channel: 101, channelLabel: 'ALPHA SQUAD', callsign: 'A-3', condition: 'CRITICAL', street: 'Route 68', zone: 'Harmony', seconds: 48, expires: Math.floor(Date.now() / 1000) + 48, coords: {x: 720, y: 170} }
        ],
        jammerConfig: { enabled: true, rangeMin: 10, rangeMax: 100, rangeStep: 5, defaultRange: 30 },
        nearbyJammer: { id: 'RSJ-DEMO', enabled: true, range: 35, allowedChannels: [120], canRemove: true },
        nearbyJammerDistance: 2.4,
        jammerRange: 35
    });
    app.classList.add('visible');
    render();
}
