/* Isolated browser simulation for the City RS Radio. No FiveM/server calls. */
(() => {
  'use strict';
  if (!isBrowser) return;
  const storageKey = 'rs-radio-city-preview-profile-v1';
  const defaultProfile = structuredClone(state.profile);
  const sampleRoster = structuredClone(state.roster);
  const operators = {
    police: { team: 'lspd', role: 'command', callsign: '2-LINCOLN-14', channel: 101 },
    ems: { team: 'ems', role: 'medic', callsign: 'MEDIC-07', channel: 110 },
    public: { team: null, role: 'member', callsign: 'CIVILIAN-12', channel: 200 },
    services: { team: 'services', role: 'mechanic', callsign: 'SERVICE-04', channel: 201 }
  };
  const channels = [[101,'LSPD DISPATCH','police'],[102,'BCSO DISPATCH','sheriff'],[110,'EMS DISPATCH','ems'],[111,'FIRE DISPATCH','fire'],[120,'EMERGENCY INTEROP','emergency'],[200,'CITYWIDE PUBLIC','public'],[201,'SERVICES NET','services'],[911,'EMERGENCY NETWORK','public']];
  let operator = 'police', view = 'handset', manualPosition = false, distressTimer = null;
  const notify = message => parent.postMessage({ type: 'rs-radio-preview', message }, location.origin);
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state.profile)); } catch (_) {} };
  const publish = () => parent.postMessage({ type: 'rs-radio-preview', state: {
    channel: state.channel, battery: state.battery, powered: state.powered, talking: state.localTalking,
    jammed: state.jammed, distressActive: state.distressActive, overlayVisible: !!state.profile.overlayVisible,
    tab: state.tab, operator, view
  } }, location.origin);
  const sourceRender = render;
  render = function () { sourceRender(); publish(); };
  const sourceLayout = applyLayout;
  applyLayout = function () {
    sourceLayout();
    if (view === 'screen' || !manualPosition) {
      const bounds = shell.getBoundingClientRect();
      shell.style.left = Math.max(8, (innerWidth - bounds.width) / 2) + 'px';
      if (view === 'screen') shell.style.top = Math.max(8, (innerHeight - bounds.height) / 2 - 8) + 'px';
    }
  };
  const visible = value => { app.classList.toggle('visible', value); app.setAttribute('aria-hidden', value ? 'false' : 'true'); };
  const access = kind => kind === 'public' || kind === operator || (kind === 'emergency' && ['police','ems'].includes(operator));
  const updateChannels = () => {
    state.channels = channels.map(([id,label,kind]) => ({ id,label,locked:!access(kind),
      telemetry:id < 200,roster:true,recommended:id===operators[operator].channel,
      favorite:(state.profile.favorites || []).includes(id) }));
  };
  const updateRoster = () => {
    if (!state.powered) { state.roster = []; return; }
    const telemetry = state.channels.find(channel => channel.id === state.channel)?.telemetry;
    state.roster = sampleRoster.map((entry,index) => {
      const row = structuredClone(entry);
      row.talking = false;
      if (index === 0) Object.assign(row, state.assignment, { name: state.profile.displayName || 'Alex Mercer' });
      if (!telemetry) { delete row.coords; delete row.vitals; row.street = ''; row.zone = ''; }
      return row;
    });
  };
  const updateJam = () => {
    const jammer = state.nearbyJammer;
    state.jammed = !!(state.powered && jammer?.enabled && !jammer.allowedChannels.includes(state.channel));
    if (state.jammed) state.localTalking = false;
  };
  const join = channel => {
    const target = state.channels.find(entry => entry.id === Number(channel));
    if (!target || target.locked) { play('denied'); notify('That frequency is restricted for this sample operator.'); return false; }
    if (state.battery <= 0) { notify('Recharge the sample battery before tuning.'); return false; }
    Object.assign(state,{ channel:target.id, channelLabel:target.label, powered:true, localTalking:false });
    state.profile.recent = [target.id,...(state.profile.recent || []).filter(id=>id!==target.id)].slice(0,8);
    updateRoster(); updateJam(); render();
    notify('Connected to ' + target.id + ' / ' + target.label + '.');
    return true;
  };
  const selectOperator = key => {
    if (!Object.hasOwn(operators,key)) return;
    operator = key;
    state.assignment = { ...operators[key] };
    state.defaultChannel = operators[key].channel;
    state.nearbyJammer = null;
    state.nearbyJammerDistance = null;
    state.jammed = false;
    state.distressActive = false;
    clearTimeout(distressTimer);
    state.distressBoard = [];
    updateChannels(); join(state.defaultChannel);
  };
  const setTalking = active => {
    state.localTalking = active === true && state.powered && !state.jammed && state.battery > 0;
    const self = state.roster.find(entry => entry.id === state.playerId);
    if (self) self.talking = state.localTalking;
    render();
    if (active) notify(state.localTalking ? 'Sample PTT is transmitting. Release to stop.' : 'Power on and clear RF interference before transmitting.');
  };
  const incoming = () => {
    if (!state.powered) { notify('Power on the radio to receive a sample call.'); return; }
    state.distressBoard = [{ id:3,channel:state.channel,channelLabel:state.channelLabel,callsign:'ADAM-23',
      condition:'INJURED',street:'Elgin Avenue',zone:'Pillbox Hill',expires:Math.floor(Date.now()/1000)+60,
      coords:{x:220.2,y:-810.6} }];
    state.traffic = { title:'PRIORITY / ASSISTANCE REQUEST',body:'ADAM-23 requesting assistance at Elgin Avenue. Open SOS to mark the sample location.',priority:'emergency' };
    state.tab = 'distress'; play('distress'); visible(true); render();
    notify('Sample incoming SOS received. Open SET GPS to try its waypoint action.');
  };
  nui = async function (action,payload = {}) {
    switch (action) {
      case 'join': return { ok:join(payload.channel) };
      case 'leave': Object.assign(state,{powered:false,channel:0,channelLabel:'OFFLINE',roster:[],localTalking:false,jammed:false});notify('Radio powered off.');break;
      case 'close': setTalking(false);visible(false);notify('Radio closed. Use Reopen radio to return.');break;
      case 'profile':
        if ('radioX' in payload || 'radioY' in payload) manualPosition = true;
        Object.assign(state.profile,payload);
        state.volume = Number(state.profile.volume ?? state.volume);
        updateRoster();save();notify('Preview settings saved in this browser.');break;
      case 'favorite': {
        const favorites = new Set(state.profile.favorites || []);
        if (payload.favorite) favorites.add(Number(payload.channel));else favorites.delete(Number(payload.channel));
        state.profile.favorites = [...favorites];updateChannels();save();notify(payload.favorite ? 'Frequency saved to favorites.' : 'Frequency removed from favorites.');break;
      }
      case 'volume': state.volume=Number(payload.volume);state.profile.volume=state.volume;save();break;
      case 'getMutedPlayers': return { ok:true,muted:state.mutedPlayers };
      case 'toggleMutePlayer': state.mutedPlayers[payload.id]=!state.mutedPlayers[payload.id];notify(state.mutedPlayers[payload.id]?'Sample unit muted.':'Sample unit unmuted.');render();return {ok:true,muted:state.mutedPlayers};
      case 'distress':
        if (!state.powered) { notify('Power on before sending SOS.');return {ok:false}; }
        state.distressActive=!state.distressActive;
        clearTimeout(distressTimer);
        if (state.distressActive) distressTimer=setTimeout(()=>{state.distressActive=false;render();notify('Sample SOS expired.');},60000);
        notify(state.distressActive?'Sample SOS sent to this frequency.':'Sample SOS cancelled.');break;
      case 'waypoint': notify('Sample GPS waypoint marked at Elgin Avenue / Pillbox Hill.');break;
      case 'resetProfile':
        state.profile=structuredClone(defaultProfile);manualPosition=false;
        try{localStorage.removeItem(storageKey);}catch(_){}
        updateChannels();updateRoster();notify('Preview settings reset.');break;
      case 'placeJammer':
        if (operator!=='police') {notify('Jammer configuration is restricted to the sample police command operator.');return {ok:false};}
        if (state.nearbyJammer) {notify('Recover the current sample jammer before deploying another.');return {ok:false};}
        state.nearbyJammer={id:'DEMO-RF-01',enabled:true,canRemove:true,range:Number(payload.range)||30,allowedChannels:[]};
        state.nearbyJammerDistance=1.5;updateJam();notify('Sample jammer deployed. Pass this channel or turn it off to clear interference.');break;
      case 'requestJammerStatus':notify(state.nearbyJammer?'Sample jammer status refreshed.':'No sample jammer deployed.');break;
      case 'jammerAction': {
        if (operator!=='police' || !state.nearbyJammer)return {ok:false};
        const jammer=state.nearbyJammer;
        if(payload.action==='range')jammer.range=Math.max(10,Math.min(100,Number(payload.value)||30));
        if(payload.action==='toggle')jammer.enabled=!jammer.enabled;
        if(payload.action==='allow')jammer.allowedChannels=jammer.allowedChannels.includes(state.channel)?jammer.allowedChannels.filter(id=>id!==state.channel):[...jammer.allowedChannels,state.channel];
        if(payload.action==='remove'){state.nearbyJammer=null;state.nearbyJammerDistance=null;}
        updateJam();notify(payload.action==='remove'?'Sample jammer recovered.':'Sample RF configuration updated.');break;
      }
      default:return {ok:false};
    }
    render();return {ok:true,muted:state.mutedPlayers};
  };
  const command = (action,value) => {
    if (action==='operator')selectOperator(value);
    if (action==='page' && ['home','channels','units','distress','settings'].includes(value)){visible(true);showTab(value);}
    if (action==='view' && ['handset','screen'].includes(value)){view=value;document.body.classList.toggle('screen-view',view==='screen');render();}
    if (action==='power')togglePower();
    if (action==='reopen'){visible(true);render();notify('Radio reopened.');}
    if (action==='sos')sendDistress();
    if (action==='incoming')incoming();
    if (action==='battery'){state.battery=100;render();notify('Sample battery recharged to 100%.');}
    if (action==='overlay')updateProfile({overlayVisible:!state.profile.overlayVisible});
    if (action==='talking')setTalking(value===true);
    if (action==='sync')publish();
  };
  window.addEventListener('message',event=>{
    if(event.source!==parent || event.origin!==location.origin || event.data?.type!=='rs-radio-preview-command')return;
    command(event.data.action,event.data.value);
  });
  window.addEventListener('blur',()=>{if(state.localTalking)setTalking(false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && state.localTalking)setTalking(false);});
  document.getElementById('gameplay-hint').textContent='INTERACTIVE BROWSER PREVIEW';
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved && typeof saved==='object' && !Array.isArray(saved)){
      for(const key of ['deafened','micClicks','allowMovement','overlayVisible'])if(typeof saved[key]==='boolean')state.profile[key]=saved[key];
      if(typeof saved.displayName==='string')state.profile.displayName=saved.displayName.slice(0,32);
      if(Array.isArray(saved.favorites))state.profile.favorites=saved.favorites.filter(id=>channels.some(row=>row[0]===id));
      if(Number.isFinite(saved.volume))state.profile.volume=Math.max(0,Math.min(100,saved.volume));
    }
  }catch(_){}
  state.voice={provider:'pma-voice',capabilities:{volume:true,perPlayerMute:true,deaf:true}};
  state.ui={...state.ui,allowCustomDisplayName:true};
  state.tab='home';selectOperator('police');visible(true);render();
  window.RSRadioPreview={getState:()=>state,command};
})();
