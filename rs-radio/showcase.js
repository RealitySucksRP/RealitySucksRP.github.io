'use strict';
(() => {
  const frame = document.getElementById('radio-preview');
  const byId = id => document.getElementById(id);
  const command = (action, value) => frame.contentWindow?.postMessage({ type: 'rs-radio-preview-command', action, value }, location.origin);
  let transmitting = false;
  const transmit = active => {
    if (transmitting === active) return;
    transmitting = active;
    command('talking', active);
  };
  byId('operator').onchange = event => command('operator', event.target.value);
  byId('page').onchange = event => command('page', event.target.value);
  for (const mode of ['handset', 'screen']) byId(mode + '-view').onclick = () => command('view', mode);
  for (const action of ['power', 'reopen', 'sos', 'incoming', 'battery', 'overlay']) byId(action).onclick = () => command(action);
  const ptt = byId('ptt');
  ptt.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    ptt.setPointerCapture(event.pointerId);
    transmit(true);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) ptt.addEventListener(event, () => transmit(false));
  ptt.addEventListener('keydown', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); transmit(true); }
  });
  ptt.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); transmit(false); }
  });
  window.addEventListener('blur', () => transmit(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) transmit(false); });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'rs-radio-preview') return;
    const data = event.data;
    if (data.message) byId('status').textContent = data.message;
    if (!data.state) return;
    const state = data.state;
    byId('frequency').textContent = state.channel ? String(state.channel).padStart(3, '0') : 'OFF';
    byId('battery-label').textContent = Math.round(state.battery) + '%';
    byId('signal').textContent = state.jammed ? 'JAM' : state.talking ? 'TX' : state.powered ? 'RX' : 'OFF';
    byId('power').textContent = state.powered ? 'Power off' : 'Power on';
    byId('sos').textContent = state.distressActive ? 'Cancel SOS' : 'Send SOS';
    byId('overlay').textContent = state.overlayVisible ? 'Hide overlay' : 'Show overlay';
    byId('page').value = state.tab === 'unitDetail' ? 'units' : state.tab;
    byId('operator').value = state.operator;
    byId('ptt').classList.toggle('transmitting', state.talking);
    for (const mode of ['handset', 'screen']) byId(mode + '-view').setAttribute('aria-pressed', String(state.view === mode));
    byId('view-label').textContent = state.view === 'screen' ? 'SCREEN VIEW' : 'HANDSET VIEW';
  });
  frame.addEventListener('load', () => command('sync'));
})();
