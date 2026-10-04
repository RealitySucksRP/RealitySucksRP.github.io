(() => {
'use strict';

const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
// Preview mode must be selected by the page origin, never by the absence of a
// FiveM global. A missing/late GetParentResourceName previously made the
// production NUI run its demo bootstrap and open itself over the game.
const previewHosts = new Set(['localhost', '127.0.0.1', '::1']);
const demo = true;
const resource = typeof window.GetParentResourceName === 'function'
  ? window.GetParentResourceName()
  : 'rs-tablet';

const ICONS = {
  phone:'☎', videocall:'◉', messages:'✉', email:'@', chat:'◌', contacts:'♙',
  camera:'◫', map:'⌖', maps:'⌖', scan:'◎', car:'◇', radio:'◉', gallery:'▧',
  community:'✦', news:'N', bank:'$', bills:'$', garage:'◇', racing:'↟', races:'◆',
  market:'¤', work:'⌘', yellowpage:'Y', taxi:'T', houses:'⌂', darkmarket:'◈',
  drone:'⌁', notes:'≡', calc:'±', calculator:'±', weather:'☼', media:'▶',
  reminders:'✓', sos:'!', dispatch:'D', cctv:'◉', game:'◆', store:'⬡', settings:'⚙', buildertools:'⌘', app:'iF'
};
const DOCK = ['recon','camera','maps','garage','cctv','settings'];
const TABLET_ICON_THEMES = [
  {id:'airglass',label:'AirGlass',family:'rs',accent:'#82d6ff'},
  {id:'business',label:'Executive Alloy',family:'rs',accent:'#b7c1d3'},
  {id:'gang',label:'Gang Luxe',family:'rs',accent:'#f3b562'},
  {id:'pleasure',label:'Pleasure Neon',family:'rs',accent:'#ff63d8'},
  {id:'bloodglass',label:'Bloodglass',family:'zombie',accent:'#ff617d'},
  {id:'siege',label:'Night Siege',family:'zombie',accent:'#9ee0ff'},
  {id:'toxic',label:'Toxic Survivor',family:'zombie',accent:'#75f0a8'},
  {id:'mafia',label:'Gang Mafia',family:'custom',accent:'#d8b15a'},
  {id:'superhero',label:'Superhero',family:'custom',accent:'#4ea7ff'},
  {id:'viceheat',label:'Vice Heat',family:'custom',accent:'#ff7cc8'}
];
const TABLET_FONT_STYLES = [
  {id:'modern',label:'Modern',sample:'Aa',desc:'Variable UI'},
  {id:'normal',label:'Normal',sample:'Aa',desc:'Classic sans'},
  {id:'clean',label:'Clean',sample:'Aa',desc:'Minimal'},
  {id:'rounded',label:'Rounded',sample:'Aa',desc:'Soft geometry'},
  {id:'compact',label:'Compact',sample:'Aa',desc:'Dense utility'},
  {id:'tech',label:'Tech',sample:'01',desc:'Precision'},
  {id:'condensed',label:'Condensed',sample:'RS',desc:'Narrow display'},
  {id:'executive',label:'Executive',sample:'RS',desc:'Boardroom'},
  {id:'editorial',label:'Editorial',sample:'Ag',desc:'News serif'},
  {id:'luxe',label:'Luxe',sample:'Ag',desc:'Elegant serif'},
  {id:'terminal',label:'Terminal',sample:'>_',desc:'Console'},
  {id:'typewriter',label:'Typewriter',sample:'Aa',desc:'Mechanical'},
  {id:'arcade',label:'Arcade',sample:'88',desc:'Retro terminal'},
  {id:'street',label:'Street',sample:'RS',desc:'Impact'},
  {id:'poster',label:'Poster',sample:'GO',desc:'Heavy display'},
  {id:'handwritten',label:'Handwritten',sample:'Hi',desc:'Personal'},
  {id:'marker',label:'Marker',sample:'RS',desc:'Graffiti note'},
  {id:'retro',label:'Retro',sample:'84',desc:'Old computer'},
  {id:'blueprint',label:'Blueprint',sample:'A1',desc:'Architect'},
  {id:'cinema',label:'Cinema',sample:'RS',desc:'Title card'},
  {id:'humanist',label:'Humanist',sample:'Aa',desc:'Readable'},
  {id:'classic',label:'Classic',sample:'Ag',desc:'Book serif'},
  {id:'hacker',label:'Hacker',sample:'0x',desc:'Code lab'},
  {id:'comic',label:'Comic',sample:'BAM',desc:'Playful'}
];
const TABLET_MOTION_STYLES = [
  {id:'fluid',label:'Fluid',desc:'Balanced iFruit motion'},
  {id:'snappy',label:'Snappy',desc:'Fast response'},
  {id:'cinematic',label:'Cinematic',desc:'Longer depth transitions'},
  {id:'spring',label:'Spring',desc:'Playful overshoot'}
];
const TABLET_FRAME_STYLES = window.RSTabletFrames.styles;
const TABLET_FRAME_COLORS = window.RSTabletFrames.colors;
const TABLET_OPEN_MOTIONS = [
  {id:'lift',label:'Lift',desc:'Rise from the lower edge'},
  {id:'glide',label:'Glide',desc:'Slide in from the side'},
  {id:'pop',label:'Pop',desc:'Quick depth expansion'},
  {id:'pivot',label:'Pivot',desc:'Premium hinged arrival'}
];
const THEME_ICON_ALIASES = {community:'chirp'};
const TABLET_VECTOR_ICONS = new Set(['dispatch','cctv','recon','scanner','vehiclelab','buildertools','games','store','clock','calendar','compass','files']);
const TABLET_HIDDEN_COMMUNICATION_APPS = new Set();
const WALLPAPER_CHOICES = [
  {id:'air-blue',label:'Air Blue'}, {id:'air-black',label:'Air Black'},
  {id:'air-silver',label:'Air Silver'}, {id:'air-gold',label:'Air Gold'},
  {id:'aurora',label:'Aurora'}, {id:'ocean',label:'Ocean'},
  {id:'mint',label:'Mint'}, {id:'orchid',label:'Orchid'},
  {id:'rose',label:'Rose'}, {id:'survivor',label:'Survivor'}
];
// The home screen uses one flat app order split into pages, with a dock and
// page dots. No category headers and no shrinking every icon onto one view.
const HOME_PAGE_SIZE = 24; // 5 columns x 4 rows: large tablet icons, two pages for the full RS suite.
const HOME_ORDER = [
  'phone','messages','email','contacts','survivorchat','videocall',
  'camera','gallery','videocall',
  'drone','recon','cctv','dispatch','scanner','maps','radio',
  'garage','vehiclelab','community','news','bank','work',
  'mediahub','bills','racing','races',
  'market','yellowpage','taxi','houses','darkmarket','notes',
  'calculator','weather','reminders','sos','buildertools','games','store','settings'
];

const DEMO_APPS = [
  ['phone','Tablet Calls','phone','communication','phone'],['messages','Messages','messages','communication','phone'],['email','Email','email','communication','phone'],['contacts','Contacts','contacts','communication','phone'],['survivorchat','Survivor Chat','survivorchat','communication','phone'],['videocall','Video Call','videocall','communication','phone'],
  ['camera','Camera','camera','media'],['gallery','Photos','gallery','media'],['recon','Recon Center','drone','security'],['dispatch','Dispatch','radio','communication'],['cctv','CCTV','camera','security'],['community','Community','community','social','phone'],
  ['news','News','news','social','phone'],['mediahub','Media','media','media','phone'],['bank','Bank','bank','finance','phone'],
  ['bills','Bills','bills','finance','phone'],['garage','Garage','garage','vehicle','phone'],['racing','Stats','racing','vehicle','phone'],
  ['races','Races','races','vehicle','phone'],['market','Market','market','commerce','phone'],['work','Work','work','services','phone'],
  ['yellowpage','Directory','yellowpage','services','phone'],['taxi','Taxi','taxi','services','phone'],['houses','Houses','houses','property','phone'],
  ['darkmarket','DarkMarket','darkmarket','commerce','phone'],['maps','Maps','maps','utility'],['radio','Radio','radio','communication'],
  ['drone','Drone','drone','gadget'],['scanner','Scanner','scan','gadget'],['vehiclelab','Vehicle Lab','garage','gadget'],
  ['notes','Notes','notes','utility'],['calculator','Calculator','calculator','utility'],['weather','Weather','weather','utility'],
  ['reminders','Reminders','reminders','utility','phone'],['sos','SOS','sos','safety'],
  ['buildertools','Builder Tools','buildertools','system'],['games','Arcade','races','fun'],
  ['store','App Store','market','system'],['settings','Settings','settings','system']
].map(([id,label,icon,category,provider])=>({id,label,icon,category,provider,features:id==='buildertools'?{devtool:true,worldbuilder:true}:undefined}));

const state = {
  open:false, locked:true, activeApp:null,
  config:{apps:[],games:[],device:{}}, externalApps:{}, integrationApps:[], profile:null,
  battery:100, currentChannel:0, currentChannelLabel:'Off Air', native:null,
  notifications:[], installed:new Set(), calculator:'0', lastApp:null, providers:{},
  snake:null, memory:null, signal:null,
  phoneBootstrap:null, phoneBootstrapAt:0, mediaCache:new Map(), mediaPending:new Set(),
  mapBase:null, mapData:null, mapZoom:1, mapPan:{x:0,y:0}, mapDragging:null,
  garageData:null, bankData:null, communityData:null, activeConversation:null,
  callState:null, cameraState:{active:false,mode:'photo',recording:false}, dispatchEvents:[],
  homePageIndex:0, lastScan:null, reconCameras:[], iconTheme:'airglass', reducedMotion:false,
  fontStyle:'modern', fontSize:100, motionStyle:'fluid', frameStyle:'sleek', frameColor:'vice', openMotion:'lift', unlockMethod:'swipe', customWallpaper:'', gridShift:null, minefield:null,
  pulse:null, codeSprint:null, laneRunner:null, pendingLatestMediaId:null, weather:null
};

const demoProfile = {
  name:'Alex Mercer', citizenid:'DEMO-2026', job:'police', grade:3, framework:'qbox', serverId:12,
  channels:[
    {id:101,label:'LSPD Dispatch',accessible:true},{id:102,label:'BCSO Dispatch',accessible:true},
    {id:110,label:'EMS Dispatch',accessible:false},{id:111,label:'Fire Dispatch',accessible:false},
    {id:120,label:'Emergency Interop',accessible:true},{id:200,label:'Citywide',accessible:true,public:true},{id:201,label:'Services',accessible:true,public:true}
  ]
};
const demoNative = {weather:'Clear',weatherState:{name:'CLEAR',label:'Clear',temp:72,wind:6,humidity:48,hour:21,isNight:true,location:'Mission Row',rain:0,snow:0},coords:{x:221.44,y:-805.2,z:30.6},heading:184,street:'Power Street / Vespucci Boulevard',zone:'Mission Row',speed:0,altitude:31,clock:{h:21,m:47,s:12}};

// Device RPC. One envelope, one doorway, matching client/rpc.lua.
//
// Every call resolves: an aborted request returns rpc_timeout rather than
// hanging a UI panel forever, and a reply whose requestId does not match the
// one we sent is rejected instead of being shown against the wrong request.
let rpcSequence = 0;
async function rpc(action,payload={}) { return window.RSTabletPreview.rpc(action,payload); }

async function nui(name,data={}) { return window.RSTabletPreview.nui(name,data); }
function demoNui(name,data){
  if(name==='nativeSnapshot') return Promise.resolve({ok:true,data:{...demoNative,heading:(demoNative.heading+Math.floor(Math.random()*4))%360}});
  if(name==='scanWorld') return Promise.resolve({ok:true,data:{hit:true,street:'Elgin Avenue',zone:'Mission Row',point:{x:235.1,y:-790.4,z:30.6},entity:{type:'vehicle',displayName:'Buffalo STX',plate:'RS 2026',distance:8.4,speed:0,engineHealth:976,bodyHealth:941,fuel:73,lockStatus:1,model:1742279711,netId:341}}});
  if(name==='scanVehicle') return Promise.resolve({ok:true,data:{type:'vehicle',displayName:'Buffalo STX',plate:'RS 2026',distance:4.7,speed:0,engineHealth:976,bodyHealth:941,tankHealth:995,fuel:73,lockStatus:1,model:1742279711,netId:341}});
  if(name==='loadNote') return Promise.resolve({ok:true,text:localStorage.getItem('rs_tablet_demo_note')||''});
  if(name==='saveNote'){localStorage.setItem('rs_tablet_demo_note',data.text||'');return Promise.resolve({ok:true});}
  if(name==='loadSetting') return Promise.resolve({ok:true,value:localStorage.getItem(`rs_tablet_${data.key}`)});
  if(name==='saveSetting'){localStorage.setItem(`rs_tablet_${data.key}`,String(data.value??''));return Promise.resolve({ok:true});}
  if(name==='commsTune'){state.currentChannel=Number(data.channel)||0;state.currentChannelLabel=(demoProfile.channels.find(c=>c.id===state.currentChannel)||{}).label||'Off Air';updateStatus();renderCommsWidget();return Promise.resolve({ok:true});}
  if(name==='commsLeave'){state.currentChannel=0;state.currentChannelLabel='Off Air';updateStatus();renderCommsWidget();return Promise.resolve({ok:true});}
  if(name==='sendSOS'){receiveNotification({title:'Emergency Beacon',body:'SOS transmitted to emergency services.',kind:'emergency'});return Promise.resolve({ok:true});}
  if(name==='cameraMode'){toast('Camera','In FiveM this launches the native GTA camera view.','inform');return Promise.resolve({ok:true});}
  if(name==='setWaypoint'){toast('Maps','Waypoint set in GTA.','inform');return Promise.resolve({ok:true});}
  return Promise.resolve({ok:true});
}

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function iconFor(app){ return ICONS[app.icon] || ICONS.app; }
function resolveThemeIconName(appId){ return THEME_ICON_ALIASES[appId] || appId; }
const ICON_THEME_REV='103-material';
function validIconTheme(id){return TABLET_ICON_THEMES.some(t=>t.id===String(id||''))?String(id):'airglass';}
function themeIconUrl(appId){ return `img/icon-themes/${validIconTheme(state.iconTheme)}/${resolveThemeIconName(appId)}.${TABLET_VECTOR_ICONS.has(appId)?'svg':'png'}?v=${ICON_THEME_REV}`; }
function themeIconMarkup(appId,label=''){ if(String(appId).startsWith('bridge_'))return `<span class="theme-app-glyph" style="display:grid" aria-hidden="true">${escapeHtml(ICONS[allApps().find(a=>a.id===appId)?.icon]||ICONS.app)}</span>`; const glyph=escapeHtml(ICONS[appId]||ICONS.app); return `<img class="theme-app-art" src="${themeIconUrl(appId)}" alt="" draggable="false" onerror="this.style.display='none';this.parentNode?.classList.add('glyph-fallback');const g=this.nextElementSibling;if(g)g.style.display='grid'"><span class="theme-app-glyph" aria-hidden="true">${glyph}</span>`; }
function validFontStyle(id){return TABLET_FONT_STYLES.some(f=>f.id===String(id||''))?String(id):'modern';}
function validMotionStyle(id){return TABLET_MOTION_STYLES.some(m=>m.id===String(id||''))?String(id):'fluid';}
function validFrameStyle(id){return TABLET_FRAME_STYLES.some(x=>x.id===String(id||''))?String(id):'sleek';}
function validFrameColor(id){return TABLET_FRAME_COLORS.some(x=>x.id===String(id||''))?String(id):'vice';}
function validOpenMotion(id){return TABLET_OPEN_MOTIONS.some(x=>x.id===String(id||''))?String(id):'lift';}
function validUnlockMethod(id){return String(id||'')==='pulse'?'pulse':'swipe';}
function applyAppearance(){
  const screen=$('#screen'); if(!screen) return;
  state.iconTheme=validIconTheme(state.iconTheme);state.fontStyle=validFontStyle(state.fontStyle);state.motionStyle=validMotionStyle(state.motionStyle);state.frameStyle=validFrameStyle(state.frameStyle);state.frameColor=validFrameColor(state.frameColor);state.openMotion=validOpenMotion(state.openMotion);state.unlockMethod=validUnlockMethod(state.unlockMethod);
  screen.dataset.iconTheme=state.iconTheme;screen.dataset.fontStyle=state.fontStyle;screen.dataset.motionStyle=state.motionStyle;
  const tablet=$('#tablet');if(tablet){tablet.dataset.frameStyle=state.frameStyle;tablet.dataset.frameColor=state.frameColor;}
  window.RSTabletFrames.sync();
  const stage=$('#stage');if(stage)stage.dataset.openMotion=state.openMotion;
  state.fontSize=Math.max(92,Math.min(108,Math.round((Number(state.fontSize)||100)/2)*2));
  screen.style.setProperty('--rs-font-scale',(state.fontSize/100).toFixed(2));screen.dataset.fontSize=String(state.fontSize);window.RSTabletStudio?.updateTypePreview?.();
  screen.dataset.wallpaper=screen.dataset.wallpaper||'air-blue';screen.classList.toggle('reduced-motion',!!state.reducedMotion);window.RSTabletOS?.sync?.();
  const theme=(TABLET_ICON_THEMES.find(t=>t.id===state.iconTheme)||TABLET_ICON_THEMES[0]);screen.style.setProperty('--accent',theme.accent||'#82d6ff');
  const layer=$('.wallpaper-layer');
  if(layer){
    const custom=String(state.customWallpaper||'');
    const usable=screen.dataset.wallpaper==='custom'&&(/^https:\/\//i.test(custom));
    if(usable){layer.style.backgroundImage=`linear-gradient(150deg,rgba(4,9,16,.28),rgba(4,9,16,.58)),url(${JSON.stringify(custom)})`;layer.style.backgroundSize='cover';layer.style.backgroundPosition='center';}
    else{layer.style.removeProperty('background-image');layer.style.removeProperty('background-size');layer.style.removeProperty('background-position');}
  }
}
function pad(n){return String(n).padStart(2,'0');}
function clockText(){const c=state.native?.clock; if(c) return `${pad(c.h)}:${pad(c.m)}`; const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`;}
function headingCardinal(h=0){const dirs=['N','NE','E','SE','S','SW','W','NW'];return dirs[Math.round((((h%360)+360)%360)/45)%8];}

const WEATHER_ICONS={clear:'☀',clouds:'☁',rain:'☔',storm:'⚡',snow:'❄',fog:'🌫'};
function weatherVisualType(weather){
  const name=String(weather?.name||weather?.label||'clear').toLowerCase();
  if(name.includes('thunder')||name.includes('storm'))return 'storm';
  if(name.includes('blizzard'))return 'blizzard';
  if(name.includes('snow'))return 'snow';
  if(name.includes('rain'))return 'rain';
  if(name.includes('fog')||name.includes('smog')||name.includes('mist'))return 'fog';
  if(name.includes('overcast'))return 'overcast';
  if(name.includes('cloud'))return 'clouds';
  if(name.includes('clearing'))return 'clearing';
  if(name.includes('extra')||name.includes('sunny'))return 'sunny';
  return 'clear';
}
function weatherIconFor(label){
  const type=weatherVisualType({label});
  return WEATHER_ICONS[type]||WEATHER_ICONS.clear;
}
function weatherSceneMarkup(extraClass=''){
  return `<div class="live-weather-scene weather-app-scene ${extraClass}" data-weather="clear" aria-hidden="true"><i class="weather-depth weather-sun"></i><i class="weather-depth weather-moon"></i><i class="weather-depth weather-cloud weather-cloud-back"></i><i class="weather-depth weather-cloud weather-cloud-front"></i><i class="weather-depth weather-fog"></i><i class="weather-depth weather-rain"></i><i class="weather-depth weather-snow"></i><i class="weather-depth weather-lightning"></i></div>`;
}
function syncWeatherScenes(){
  const weather=state.weather||state.native?.weatherState||{};
  const type=weatherVisualType(weather),night=weather.isNight===true||Number(weather.hour)<6||Number(weather.hour)>=20;
  $$('.live-weather-scene').forEach(scene=>{
    scene.dataset.weather=type;scene.dataset.night=night?'true':'false';
    scene.style.setProperty('--weather-blend',String(Math.max(0,Math.min(1,Number(weather.transition)||0))));
    scene.style.setProperty('--weather-rain',String(Math.max(.18,Math.min(1,Number(weather.rain)||0))));
    scene.style.setProperty('--weather-snow',String(Math.max(.18,Math.min(1,Number(weather.snow)||0))));
  });
  const label=String(weather.label||state.native?.weather||'World');
  const temp=Number(weather.temp),feels=Number(weather.feels),wind=Number(weather.wind),humidity=Number(weather.humidity);
  const set=(id,value)=>{const node=$(id);if(node)node.textContent=value;};
  set('#weather-live-location',weather.location||state.native?.zone||'Los Santos');
  set('#weather-live-icon',weatherIconFor(label));
  set('#weather-live-temp',Number.isFinite(temp)?`${Math.round(temp)}°`:'--°');
  set('#weather-live-condition',label);
  set('#weather-live-feels',Number.isFinite(feels)?`${Math.round(feels)}°`:'--°');
  set('#weather-live-wind',Number.isFinite(wind)?`${Math.round(wind)} MPH`:'--');
  set('#weather-live-humidity',Number.isFinite(humidity)?`${Math.round(humidity)}%`:'--');
  set('#weather-live-rain',`${Math.round(Math.max(0,Math.min(1,Number(weather.rain)||0))*100)}%`);
  set('#weather-live-snow',`${Math.round(Math.max(0,Math.min(1,Number(weather.snow)||0))*100)}%`);
  const previous=String(weather.previousName||weather.name||'').replaceAll('_',' '),next=String(weather.nextName||weather.name||'').replaceAll('_',' '),blend=Math.round(Math.max(0,Math.min(1,Number(weather.transition)||0))*100);
  set('#weather-live-transition',previous&&next&&previous!==next?`${previous} → ${next} · ${blend}%`:`${label} · stable`);
}

let nuiOpenId='';
function showStage(v){
  const el=$('#stage');
  // Never trust the stylesheet alone for NUI transparency. FiveM/CEF can keep
  // a cached CSS asset across resource restarts, so force the compositor roots
  // transparent from JavaScript as well.
  document.documentElement.style.setProperty('background','rgba(0,0,0,0)','important');
  document.body.style.setProperty('background','rgba(0,0,0,0)','important');
  el.style.setProperty('background','rgba(0,0,0,0)','important');
  el.style.setProperty('background-image','none','important');
  // Three mechanisms on purpose. The class needs style.css; the native hidden
  // attribute and the inline style do not. The stage must be invisible from the
  // very first paint even if the stylesheet is missing, late or 404s -- when it
  // was hidden by CSS alone, a stylesheet that failed to load left #stage
  // painting its dark background full-screen the moment the player spawned.
  el.classList.toggle('hidden',!v);
  el.hidden = !v;
  el.style.display = v ? '' : 'none';
  el.setAttribute('aria-hidden',String(!v));
  state.open=v;
  window.RSTabletOS?.resize?.();
  if(v){$('#tablet').classList.remove('device-entering');void $('#tablet').offsetWidth;$('#tablet').classList.add('device-entering');setTimeout(()=>$('#tablet').classList.remove('device-entering'),600);}
  else{clearTimeout($('#app-shell')._homeTimer);clearTimeout($('#lockscreen')._unlockTimer);window.RSTabletOS?.clearHistory?.();window.RSTabletOS?.closeLibrary?.();}
  if(!v)nuiOpenId='';
}
function switchView(id){ const next=$(id); if(!next) return; $$('.view').forEach(v=>{v.classList.remove('active','entering');}); next.classList.add('active','entering'); window.RSTabletOS?.sync?.(); requestAnimationFrame(()=>next.classList.remove('entering')); }
function completeUnlock(){
  if(!state.locked)return;
  state.locked=false;state.activeApp=null;switchView('#desktop');renderDesktop();applyAppearance();
  const lock=$('#lockscreen');lock.classList.add('active','unlocking');$('#desktop').classList.add('unlock-reveal');
  clearTimeout(lock._unlockTimer);lock._unlockTimer=setTimeout(()=>{lock.classList.remove('unlocking');lock.style.removeProperty('--swipe-y');lock.style.removeProperty('--swipe-opacity');if(!state.locked)lock.classList.remove('active');$('#desktop').classList.remove('unlock-reveal');},state.reducedMotion?0:520);
  nui('navState',{activeApp:false});window.RSTabletOS?.sync?.();
}
let pulseUnlockTimer=null;
function runPulseId(){
  const panel=$('#pulse-id-panel'),status=$('#pulse-id-status');if(!panel){completeUnlock();return;}if(pulseUnlockTimer)return;
  panel.hidden=false;panel.setAttribute('aria-hidden','false');if(status)status.textContent='Building facial contour mesh…';
  const step1=setTimeout(()=>{if(status)status.textContent='Measuring biometric resonance…';},360);
  const step2=setTimeout(()=>{if(status)status.textContent='Identity verified';},820);
  pulseUnlockTimer=setTimeout(()=>{clearTimeout(step1);clearTimeout(step2);pulseUnlockTimer=null;panel.hidden=true;panel.setAttribute('aria-hidden','true');completeUnlock();},state.reducedMotion?160:1250);
}
function unlock(){
  if(!state.locked)return;
  if(state.unlockMethod==='pulse'){runPulseId();return;}
  completeUnlock();
}
function lock(){clearTimeout($('#app-shell')._homeTimer);cleanupTransientUI();const pulse=$('#pulse-id-panel');if(pulse){pulse.hidden=true;pulse.setAttribute('aria-hidden','true');}clearTimeout(pulseUnlockTimer);pulseUnlockTimer=null;state.activeApp=null;state.locked=true;const lock=$('#lockscreen');clearTimeout(lock._unlockTimer);lock.classList.remove('unlocking');lock.style.removeProperty('--swipe-y');lock.style.removeProperty('--swipe-opacity');window.RSTabletOS?.clearHistory?.();switchView('#lockscreen');window.RSTabletOS?.closeLibrary?.();nui('navState',{activeApp:false});}
function cleanupTransientUI(){window.RSTabletOS?.closeLibrary?.();stopArcadeRuntime();if(mapRefreshTimer){clearInterval(mapRefreshTimer);mapRefreshTimer=null;}$$('.sheet.open').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-hidden','true');});window.RSTabletPolish?.closeEmoji?.();window.RSTabletPolish?.closePalette?.();}
function home(){
  clearTimeout(appOpeningTimer);$('#app-shell')?.classList.remove('app-opening');cleanupTransientUI();const shell=$('#app-shell');clearTimeout(shell?._homeTimer);const finish=()=>{state.activeApp=null;if(shell)delete shell.dataset.app;switchView('#desktop');renderDesktop();applyAppearance();nui('navState',{activeApp:false});$('#desktop')?.classList.add('home-return');setTimeout(()=>$('#desktop')?.classList.remove('home-return'),420);};
  if(shell?.classList.contains('active')&&!state.reducedMotion){shell.classList.add('app-closing');shell._homeTimer=setTimeout(()=>{shell.classList.remove('app-closing');finish();},170);}else finish();
}
function closeTablet(){clearTimeout(appOpeningTimer);$('#app-shell')?.classList.remove('app-opening');clearTimeout($('#app-shell')._homeTimer);cleanupTransientUI();const shell=$('#app-shell');if(shell)delete shell.dataset.app;nui('close');showStage(false);}

function updateClocks(){const t=clockText(); $('#status-time').textContent=t;$('#lock-time').textContent=t;$('#hero-time').textContent=t;const d=new Date();$('#lock-date').textContent=d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});}
function updateStatus(){
  const battery=`${Math.max(0,Math.round(state.battery))}%`;
  $('#battery-text').textContent=battery;$('#lock-battery').textContent=battery;$('#hero-power').textContent=`POWER ${battery}`;
  $('#radio-chip').textContent=state.currentChannel?String(state.currentChannel):'OFF';
  $('#status-job').textContent=(state.profile?.job||'CIV').toUpperCase().slice(0,8);
  $('#cc-comms-state').textContent=state.currentChannel?`${state.currentChannel}`:'Off';
  const server=String(state.profile?.serverLabel||state.config.device?.Name||'RS NETWORK');$('#hero-server').textContent=server;
  const alerts=(state.notifications||[]).length;$('#hero-alerts').textContent=`${alerts} ALERT${alerts===1?'':'S'}`;
}
function updateNative(native){state.native=native||state.native||demoNative;if(!state.native)return;const n=state.native;if(n.weatherState&&typeof n.weatherState==='object')state.weather={...(state.weather||{}),...n.weatherState};const location=`${n.street||'Unknown'}${n.zone?` • ${n.zone}`:''}`;$('#hero-location').textContent=location;$('#lock-location').textContent=n.zone||n.street||'Los Santos';$('#hero-speed').textContent=`${Math.round(n.speed||0)} MPH`;$('#hero-heading').textContent=`${pad(Math.round(n.heading||0))}° ${headingCardinal(n.heading)}`;$('#hero-alt').textContent=`${Math.round(n.altitude||0)} FT`;const weather=String(state.weather?.label||n.weather||'World');$('#hero-weather').textContent=Number.isFinite(Number(state.weather?.temp))?`${Math.round(Number(state.weather.temp))}° · ${weather}`:weather;$('#lock-weather').textContent=Number.isFinite(Number(state.weather?.temp))?`${weather} ${Math.round(Number(state.weather.temp))}°`:weather;const connected=n.connected!==false;$('#hero-network').textContent=`NETWORK ${connected?'ONLINE':'OFFLINE'}`;$('#lock-network').textContent=connected?'ONLINE':'OFFLINE';$('#cc-street').textContent=n.street||'Unknown';$('#cc-coords').textContent=n.coords?`${n.coords.x.toFixed(1)}, ${n.coords.y.toFixed(1)}`:'0, 0';updateClocks();updateStatus();syncWeatherScenes();}

function allApps(){
  const seen=new Set(),out=[];
  [...(state.config.apps||[]), ...(window.RSTabletStudio?.utilityApps||[]), ...Object.values(state.externalApps||{}), ...(state.integrationApps||[])].forEach(app=>{
    if(!app||!app.id||seen.has(app.id))return;seen.add(app.id);out.push(app);
  });
  return out;
}
function renderAppTile(app,dock=false){
  const b=document.createElement('button');b.className='app-tile';b.dataset.app=app.id;
  if(dock) b.classList.add('dock-tile');
  b.setAttribute('aria-label',app.label||app.id);
  b.innerHTML=`<span class="app-icon">${themeIconMarkup(app.id, app.label)}</span><span class="app-label">${escapeHtml(app.label)}</span>`;
  b.addEventListener('click',()=>{if(!window.RSTabletStudio?.isEditing())openApp(app.id);});window.RSTabletStudio?.bindTile(b,app,dock);return b;
}
function orderedHomeApps(){
  const apps=allApps().filter(a=>!TABLET_HIDDEN_COMMUNICATION_APPS.has(String(a?.id||''))&&!window.RSTabletStudio?.isHidden(a.id));
  const byId=new Map(apps.map(a=>[a.id,a])),out=[],seen=new Set();
  (window.RSTabletStudio?.homeOrder?.()||HOME_ORDER).forEach(id=>{const a=byId.get(id);if(a&&!seen.has(id)){out.push(a);seen.add(id);}});
  apps.forEach(a=>{if(!seen.has(a.id)){out.push(a);seen.add(a.id);}});
  return out;
}
function renderHomePageDots(pageCount){
  const host=$('#home-page-dots');if(!host)return;host.innerHTML='';
  state.homePageIndex=Math.max(0,Math.min(pageCount-1,Number(state.homePageIndex)||0));
  for(let i=0;i<pageCount;i++){
    const b=document.createElement('button');b.className='home-page-dot';b.dataset.page=String(i);
    b.setAttribute('aria-label',`Home page ${i+1} of ${pageCount}`);
    b.onclick=()=>setHomePage(i);host.appendChild(b);
  }
}
function setHomePage(index){
  const grid=$('#app-grid');if(!grid)return;
  const pages=$$('.app-page',grid);if(!pages.length){state.homePageIndex=0;return;}
  state.homePageIndex=Math.max(0,Math.min(pages.length-1,Number(index)||0));
  pages.forEach((p,i)=>{p.classList.toggle('active',i===state.homePageIndex);p.setAttribute('aria-hidden',i===state.homePageIndex?'false':'true');});
  $$('.home-page-dot').forEach((d,i)=>{d.classList.toggle('active',i===state.homePageIndex);d.setAttribute('aria-current',i===state.homePageIndex?'page':'false');});
}
function changeHomePage(delta){setHomePage((Number(state.homePageIndex)||0)+(Number(delta)||0));}
function renderDesktop(){
  const grid=$('#app-grid'),dock=$('#dock');grid.innerHTML='';dock.innerHTML='';
  const apps=orderedHomeApps();
  const pageCount=Math.max(1,Math.ceil(apps.length/HOME_PAGE_SIZE));
  for(let pageIndex=0;pageIndex<pageCount;pageIndex++){
    const page=document.createElement('section');page.className='app-page';page.dataset.page=String(pageIndex);
    page.setAttribute('aria-label',`Applications page ${pageIndex+1}`);
    apps.slice(pageIndex*HOME_PAGE_SIZE,(pageIndex+1)*HOME_PAGE_SIZE).forEach(a=>page.appendChild(renderAppTile(a)));
    grid.appendChild(page);
  }
  renderHomePageDots(pageCount);setHomePage(state.homePageIndex);
  window.RSTabletOS?.dockControls?.(dock);
  DOCK.map(id=>apps.find(a=>a.id===id)).filter(Boolean).forEach(a=>dock.appendChild(renderAppTile(a,true)));
  renderCommsWidget();renderScannerWidget();window.RSTabletOS?.sync?.();
}
function renderCommsWidget(){const ch=state.currentChannel;$('#widget-channel').textContent=ch?String(ch):'OFF AIR';$('#widget-channel-label').textContent=ch?state.currentChannelLabel:'Tap to open communications';}
function renderScannerWidget(){
  const el=$('#scanner-readout'),label=$('#scanner-widget .widget-label');if(!el||!label)return;
  const d=state.lastScan,e=d&&d.entity;
  if(!d){el.textContent='READY';label.textContent='Tap to enter scan mode';return;}
  el.textContent=e?String(e.type||'LOCK').toUpperCase():(d.hit?'SURFACE':'CLEAR');
  label.textContent=e?`${e.displayName||e.plate||e.type||'Entity'} • ${e.distance??'?'}m`:(d.street||'No target lock');
}

const appRenderers = {};
function renderAppFailure(content,app,error){
  const reason=String(error?.message||error||'app_render_failed').slice(0,220);
  console.error(`[rs-tablet] app renderer failed: ${app?.id||'unknown'}`,error);
  if(!content||state.activeApp!==app?.id)return;
  content.innerHTML=appHero(app?.label||'App','This app could not finish loading.')+`<div class="provider-unavailable"><b>App load failed</b><p>${escapeHtml(reason)}</p><button id="app-retry" class="primary-btn">Retry</button></div>`;
  const retry=$('#app-retry');if(retry)retry.onclick=()=>openApp(app.id);
}
let appOpeningTimer=null;
function openApp(id,payload,options={}){clearTimeout(appOpeningTimer);clearTimeout($('#app-shell')._homeTimer);$('#app-shell').classList.remove('app-closing');
  window.RSTabletStudio?.onOpen();window.RSTabletOS?.visit?.(id,state.activeApp,options);
  window.RSTabletOS?.closeLibrary?.();
  stopArcadeRuntime();
  const app=allApps().find(a=>a.id===id)||{id,label:id,icon:'app',category:'external'};
  const shell=$('#app-shell');const tile=$(`.app-tile[data-app="${CSS.escape(String(id))}"]`);if(shell&&tile){const a=tile.getBoundingClientRect(),s=shell.getBoundingClientRect();const x=Math.max(10,Math.min(90,100*(a.x+a.width/2-s.x)/Math.max(1,s.width)));const y=Math.max(10,Math.min(90,100*(a.y+a.height/2-s.y)/Math.max(1,s.height)));shell.style.setProperty('--app-origin',`${x}% ${y}%`);}if(shell)shell.dataset.app=id;shell?.classList.remove('app-closing');shell?.classList.add('app-opening');appOpeningTimer=setTimeout(()=>shell?.classList.remove('app-opening'),800);
  state.activeApp=id;state.lastApp=id;switchView('#app-shell');nui('navState',{activeApp:true,app:id});$('#app-title').textContent=app.label;$('#app-subtitle').textContent=app.category==='external'?'External app':(state.config.device?.OS||state.config.device?.os||'iFruitOS 26');$('#app-icon').innerHTML=themeIconMarkup(app.id, app.label);
  const content=$('#app-content');content.classList.remove('video-call-live');content.innerHTML='<div class="app-loading" role="status" aria-label="Loading app"><i></i><i></i><i></i></div>';
  try{
    if(window.RSTabletStudio?.renderers?.[id]){window.RSTabletStudio.renderers[id](content,payload);
    }else if(appRenderers[id]){
      const result=appRenderers[id](content,payload);
      if(result&&typeof result.then==='function')result.catch(error=>renderAppFailure(content,app,error));
    }else renderExternalApp(content,app,payload);
  }catch(error){renderAppFailure(content,app,error);}
}
function appHero(title,subtitle,action=''){return `<div class="app-hero"><div><div class="eyebrow">iFruitOS 26</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div>${action}</div>`;}
function card(title,body){return `<div class="card"><h3>${escapeHtml(title)}</h3>${body}</div>`;}
function renderExternalApp(el,app,payload){
  if(app.integrationId){
    el.innerHTML=appHero(app.label,app.description||'Open your connected service.')+`<div class="card"><button class="primary-btn" id="launch-ext">Open ${escapeHtml(app.label)}</button></div>`;
    $('#launch-ext').onclick=async()=>{const b=$('#launch-ext');b.disabled=true;const r=await rpc('integration.open',{id:app.integrationId});if(!r?.ok){b.disabled=false;toast(app.label,'This service is unavailable or you no longer have access.','error');void refreshIntegrations();}};
    return;
  }
  el.innerHTML=appHero(app.label,'Connected external RS Tablet application.')+`<div class="card"><h3>${escapeHtml(app.resource||'External resource')}</h3><p>This app is registered by another resource. Launch events are sent through the RS Tablet SDK.</p><button class="primary-btn" id="launch-ext">Launch</button></div>`;$('#launch-ext').onclick=()=>nui('launchExternalApp',{id:app.id,payload});
}


appRenderers.camera = el => {if(state.activeApp!=='camera')return;
 el.innerHTML=appHero('Camera','Use GTA V native camera controls for roleplay photography.',`<button class="primary-btn" id="open-camera">Open Native Camera</button>`)+`<div class="cards">${card('Front / rear workflow','<p>The app hands control to the game camera, then restores tablet focus on exit.</p>')}${card('Gallery-ready architecture','<p>Image storage is intentionally provider-neutral. A screenshot/storage provider can be added without changing the OS.</p>')}</div>`;
 $('#open-camera').onclick=async()=>{await nui('cameraMode');};
};

appRenderers.maps = el => {if(state.activeApp!=='maps')return;
 const n=state.native||demoNative;
 el.innerHTML=appHero('Maps','Native GPS routing and coordinate tools.')+`<div class="cards">${card('Current location',`<div class="metric cyan">${escapeHtml(n.zone||'Unknown')}</div><p>${escapeHtml(n.street||'Unknown street')}</p><div class="mono">${n.coords?.x?.toFixed?.(2)||0}, ${n.coords?.y?.toFixed?.(2)||0}, ${n.coords?.z?.toFixed?.(2)||0}</div>`)}${card('Navigation',`<p>Enter world X / Y coordinates and send them directly to the GTA waypoint system.</p><div class="form-row"><input id="map-x" class="text-input" placeholder="X"/><input id="map-y" class="text-input" placeholder="Y"/><button id="map-go" class="primary-btn">Route</button></div>`)}</div>`;
 $('#map-go').onclick=async()=>{const x=Number($('#map-x').value),y=Number($('#map-y').value);if(!Number.isFinite(x)||!Number.isFinite(y))return toast('Maps','Enter valid X and Y coordinates.','error');await nui('setWaypoint',{x,y});toast('Maps','Waypoint sent to GTA GPS.','inform');};
};

appRenderers.scanner = el => {if(state.activeApp!=='scanner')return;
  const d=state.lastScan;
  el.innerHTML=appHero('World Scanner','Enter scan mode, aim freely in the world, then capture a vehicle, ped, object or surface.',`<div class="button-row"><button id="scan-mode" class="primary-btn">Start World Scan</button><button id="scanner-camera" class="secondary-btn">Camera</button></div>`)+
    `<div class="scanner-instructions"><b>WORLD MODE</b><span>The tablet hides so it cannot cover your target.</span><span><kbd>E</kbd> Capture target &nbsp; <kbd>ESC</kbd> Cancel / return</span></div>`+
    `<div id="scan-details" class="cards" style="margin-top:12px"></div>`;
  $('#scanner-camera').onclick=()=>openApp('camera');
  $('#scan-mode').onclick=async()=>{const r=await rpc('scanner.mode');if(!r?.ok)toast('Scanner',r?.error||'Scanner could not start.','error');};
  renderScanDetails(d);
};
function renderScanDetails(d){
  const target=$('#scan-details');if(!target)return;
  if(!d){target.innerHTML=card('Ready','<p>No scan captured yet. Start World Scan, aim at something in Los Santos, and press E.</p>')+card('Why world mode?','<p>Scanning from behind an open tablet makes the target impossible to see. The tablet now gets out of the way while the gameplay camera performs the raycast.</p>');return;}
  const e=d.entity||{};
  target.innerHTML=card(e.displayName||e.plate||'Target',`<div class="metric cyan">${escapeHtml(String(e.type||'surface').toUpperCase())}</div><div class="kv"><span>Model</span><b class="mono">${escapeHtml(e.model??'—')}</b><span>Network ID</span><b>${escapeHtml(e.netId??'—')}</b><span>Distance</span><b>${escapeHtml(e.distance??'—')} m</b>${e.plate?`<span>Plate</span><b>${escapeHtml(e.plate)}</b>`:''}${e.speed!=null?`<span>Speed</span><b>${escapeHtml(e.speed)} MPH</b>`:''}</div>`)+card('World',`<div class="kv"><span>Street</span><b>${escapeHtml(d.street||'Unknown')}</b><span>Zone</span><b>${escapeHtml(d.zone||'Unknown')}</b><span>Coords</span><b class="mono">${d.point?`${Number(d.point.x||0).toFixed(1)}, ${Number(d.point.y||0).toFixed(1)}, ${Number(d.point.z||0).toFixed(1)}`:'—'}</b></div>`);
}

appRenderers.vehiclelab = el => {if(state.activeApp!=='vehiclelab')return;
 el.innerHTML=appHero('Vehicle Lab','Live vehicle telemetry and native diagnostics. Garage ownership/actions remain in Garage.',`<div class="button-row"><button id="vehicle-scan" class="primary-btn">Scan Vehicle</button><button id="vehicle-garage" class="secondary-btn">Garage</button></div>`)+`<div id="vehicle-details" class="vehicle-lab-shell"><div class="vehicle-lab-empty"><b>TELEMETRY READY</b><span>Stand near a vehicle or sit inside one, then scan.</span></div></div>`;
 $('#vehicle-garage').onclick=()=>openApp('garage');
 $('#vehicle-scan').onclick=async()=>{const r=await nui('scanVehicle');if(!r.ok||!r.data)return toast('Vehicle Lab','No vehicle found nearby.','error');const v=r.data;const model=String(v.modelName||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');const image=model?`assets/vehicles/${model}.webp`:'';$('#vehicle-details').innerHTML=`<article class="vehicle-lab-visual"><div class="vehicle-lab-photo">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(v.displayName||'Vehicle')}" onerror="this.parentNode?.classList.add('fallback');this.remove()">`:''}<span>${escapeHtml(model||'MODEL IMAGE')}</span></div><div class="vehicle-lab-identity"><span class="eyebrow">LIVE VEHICLE</span><h3>${escapeHtml(v.displayName||'Vehicle')}</h3><strong>${escapeHtml(v.plate||'NO PLATE')}</strong><small>${escapeHtml(model||'unknown model')} • class ${escapeHtml(v.class??'—')}</small></div></article><div class="vehicle-lab-metrics"><div><span>ENGINE</span><b>${escapeHtml(v.engineHealth??'—')}</b></div><div><span>BODY</span><b>${escapeHtml(v.bodyHealth??'—')}</b></div><div><span>FUEL</span><b>${escapeHtml(v.fuel??'—')}%</b></div><div><span>TANK</span><b>${escapeHtml(v.tankHealth??'—')}</b></div><div><span>SPEED</span><b>${escapeHtml(v.speed??0)} MPH</b></div><div><span>DISTANCE</span><b>${escapeHtml(v.distance??'—')} m</b></div></div><div class="vehicle-lab-footer"><span>Model hash <b class="mono">${escapeHtml(v.model??'—')}</b></span><span>Network ID <b>${escapeHtml(v.netId??0)}</b></span><span>Lock state <b>${escapeHtml(v.lockStatus??'—')}</b></span><span>State <b>${v.networked?'NETWORKED':'LOCAL'}</b></span></div>`;};
};

appRenderers.comms = el => {if(!['comms','radio'].includes(state.activeApp))return;
 const channels=state.profile?.channels||demoProfile.channels;
 el.innerHTML=appHero('Comms','Role-aware radio channels with server-side access validation.',`<div class="button-row"><button id="comms-dispatch" class="secondary-btn">Dispatch</button><button id="comms-off" class="secondary-btn">Leave Radio</button></div>`)+`<div class="channel-list">${channels.map(c=>`<div class="list-row"><span class="badge ${c.accessible?'':'locked'}">${c.id}</span><div class="grow"><strong>${escapeHtml(c.label)}</strong><small>${c.public?'Public network':c.accessible?'Authorized':'Access restricted'}</small></div><button class="${c.accessible?'primary-btn':'secondary-btn'} tune-btn" data-ch="${c.id}" ${c.accessible?'':'disabled'}>${state.currentChannel===c.id?'Connected':'Tune'}</button></div>`).join('')}</div>`;
 $$('.tune-btn').forEach(b=>b.onclick=async()=>{await nui('commsTune',{channel:Number(b.dataset.ch)});if(!demo)toast('Comms','Tune request sent.','inform');});
 $('#comms-dispatch').onclick=()=>openApp('dispatch');
 $('#comms-off').onclick=async()=>{await nui('commsLeave');if(demo){state.currentChannel=0;state.currentChannelLabel='Off Air';updateStatus();renderCommsWidget();openApp('comms');}};
};

appRenderers.gallery = el => {if(state.activeApp!=='gallery')return;el.innerHTML=appHero('Gallery','Local media hub for camera and evidence integrations.')+`<div class="cards">${card('Camera Roll','<div class="metric">0</div><p>No captures stored yet.</p>')}${card('Provider hook','<p>Connect your preferred screenshot/storage provider without exposing arbitrary external media playback.</p>')}</div>`;};

appRenderers.notes = async el => {if(state.activeApp!=='notes')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='notes'&&el._rsRenderTicket===renderTicket&&el.isConnected;

 el.innerHTML=appHero('Notes','Fast local notes that survive resource restarts.',`<button id="note-save" class="primary-btn">Save</button>`)+`<textarea id="notes-box" class="textarea" maxlength="12000" placeholder="Write something…"></textarea>`;
 const r=await nui('loadNote');if(!isCurrentRender())return;$('#notes-box').value=r.text||'';$('#note-save').onclick=async()=>{await nui('saveNote',{text:$('#notes-box').value});toast('Notes','Saved.','inform');};
};

appRenderers.calculator = el => {if(state.activeApp!=='calculator')return;
 const keys=['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='];
 el.innerHTML=appHero('Calculator','Clean utility mode.')+`<div class="calc"><div id="calc-display" class="calc-display mono">${escapeHtml(state.calculator)}</div><div class="calc-grid">${keys.map(k=>`<button class="calc-key ${['÷','×','−','+'].includes(k)?'op':''} ${k==='='?'eq':''}" data-key="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join('')}</div></div>`;
 $$('.calc-key').forEach(b=>b.onclick=()=>calcPress(b.dataset.key));
};
function calcPress(k){let s=state.calculator;if(k==='C')s='0';else if(k==='⌫')s=s.length>1?s.slice(0,-1):'0';else if(k==='±')s=String((Number(s)||0)*-1);else if(k==='%')s=String((Number(s)||0)/100);else if(k==='='){try{const expr=s.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/[^0-9+\-*/.()]/g,'');s=String(Function(`"use strict";return (${expr||0})`)());}catch{s='Error';}}else{s=(s==='0'||s==='Error')?k:s+k;}state.calculator=s.slice(0,22);const d=$('#calc-display');if(d)d.textContent=state.calculator;}

appRenderers.weather = el => {if(state.activeApp!=='weather')return;
 const n=state.native||demoNative,w=state.weather||n.weatherState||{};
 el.innerHTML=appHero('Weather','Live GTA world weather. The tablet follows the same native weather transition model as RS Tablet.')+
 `<section class="tablet-weather-live">${weatherSceneMarkup()}<div class="tablet-weather-copy"><span id="weather-live-location">${escapeHtml(w.location||n.zone||'Los Santos')}</span><div class="tablet-weather-reading"><i id="weather-live-icon">${weatherIconFor(w.label||n.weather)}</i><strong id="weather-live-temp">${Number.isFinite(Number(w.temp))?Math.round(Number(w.temp)):'--'}°</strong></div><h3 id="weather-live-condition">${escapeHtml(w.label||n.weather||'World')}</h3><p id="weather-live-transition">Live world state</p></div></section>`+
 `<div class="weather-live-metrics"><div><span>FEELS</span><b id="weather-live-feels">--°</b></div><div><span>WIND</span><b id="weather-live-wind">--</b></div><div><span>HUMIDITY</span><b id="weather-live-humidity">--</b></div><div><span>RAIN</span><b id="weather-live-rain">0%</b></div><div><span>SNOW</span><b id="weather-live-snow">0%</b></div></div>`+
 `<div class="cards weather-world-cards">${card('Local time',`<div class="metric cyan">${clockText()}</div><p>${escapeHtml(n.zone||'Los Santos')}</p>`)}${card('Heading',`<div class="metric">${Math.round(n.heading||0)}° ${headingCardinal(n.heading)}</div><p>${escapeHtml(n.street||'Unknown street')}</p>`)}${card('Altitude',`<div class="metric">${Math.round(n.altitude||0)} FT</div><p>Native world Z</p>`)}${card('Movement',`<div class="metric green">${Math.round(n.speed||0)} MPH</div><p>Current entity speed</p>`)}</div>`;
 syncWeatherScenes();
};

appRenderers.games = el => {if(state.activeApp!=='games')return;
 el.innerHTML=appHero('RS Arcade','Twelve built-in games tuned for keyboard, mouse and tablet controls. No external web content.',`<span class="badge">12 GAMES</span>`)+`<div class="game-grid flagship-arcade">
 <button class="game-card" data-game="snake"><div class="game-glyph">▦</div><h3>Neon Snake</h3><p>Classic grid survival.</p><small>ARROWS / TOUCH</small></button>
 <button class="game-card" data-game="signal"><div class="game-glyph">⌁</div><h3>Signal Breaker</h3><p>Crack a hidden node code.</p><small>LOGIC</small></button>
 <button class="game-card" data-game="memory"><div class="game-glyph">◈</div><h3>Memory Matrix</h3><p>Repeat the light sequence.</p><small>MEMORY / TOUCH</small></button>
 <button class="game-card" data-game="gridshift"><div class="game-glyph">2048</div><h3>Grid Shift</h3><p>Merge matching data blocks.</p><small>ARROWS / TOUCH</small></button>
 <button class="game-card" data-game="minefield"><div class="game-glyph">✣</div><h3>Minefield</h3><p>Clear a tactical 8×8 field.</p><small>LOGIC / TOUCH</small></button>
 <button class="game-card" data-game="pulse"><div class="game-glyph">●</div><h3>Pulse Tap</h3><p>Reaction-time challenge.</p><small>REFLEX / TOUCH</small></button>
 <button class="game-card" data-game="codesprint"><div class="game-glyph">&gt;_</div><h3>Code Sprint</h3><p>Type challenge codes fast.</p><small>KEYBOARD</small></button>
 <button class="game-card" data-game="lanerunner"><div class="game-glyph">▥</div><h3>Lane Runner</h3><p>Dodge traffic at increasing speed.</p><small>ARROWS / TOUCH</small></button>
 <button class="game-card" data-game="breakout"><div class="game-glyph">▤</div><h3>Brick Breaker</h3><p>Clear the wall before the ball drops.</p><small>A/D / TOUCH</small></button>
 <button class="game-card" data-game="pong"><div class="game-glyph">◐</div><h3>Vector Pong</h3><p>Hold the line against the computer.</p><small>W/S / TOUCH</small></button>
 <button class="game-card" data-game="asteroid"><div class="game-glyph">△</div><h3>Asteroid Dodge</h3><p>Thread a scout craft through debris.</p><small>ARROWS / TOUCH</small></button>
 <button class="game-card" data-game="reaction"><div class="game-glyph">⊹</div><h3>Reaction Grid</h3><p>Hit live nodes before they expire.</p><small>POINTER / KEYS</small></button>
 </div>`;
 $$('.game-card').forEach(b=>b.onclick=()=>launchGame(b.dataset.game));
};
const arcadeRuntime={intervals:new Set(),timeouts:new Set(),rafs:new Set()};
function arcadeInterval(fn,ms){const id=setInterval(fn,ms);arcadeRuntime.intervals.add(id);return id;}
function arcadeTimeout(fn,ms){let id=null;id=setTimeout(()=>{arcadeRuntime.timeouts.delete(id);if(state.activeApp==='games')fn();},ms);arcadeRuntime.timeouts.add(id);return id;}
function arcadeSleep(ms){return new Promise(resolve=>arcadeTimeout(resolve,ms));}
function arcadeFrame(fn){const id=requestAnimationFrame(t=>{arcadeRuntime.rafs.delete(id);fn(t)});arcadeRuntime.rafs.add(id);return id;}
function arcadeBest(key,value,lowerIsBetter=false){state.arcadeBest=state.arcadeBest||{};const old=state.arcadeBest[key];if(old==null||(lowerIsBetter?value<old:value>old))state.arcadeBest[key]=value;return state.arcadeBest[key];}
function stopArcadeRuntime(){
  arcadeRuntime.intervals.forEach(clearInterval);arcadeRuntime.intervals.clear();
  arcadeRuntime.timeouts.forEach(clearTimeout);arcadeRuntime.timeouts.clear();
  arcadeRuntime.rafs.forEach(cancelAnimationFrame);arcadeRuntime.rafs.clear();
  if(state.snake?.timer)clearInterval(state.snake.timer);if(state.laneRunner?.timer)clearInterval(state.laneRunner.timer);if(state.pulse?.timer)clearTimeout(state.pulse.timer);
  window.onkeydown=null;window.onkeyup=null;
}
function launchGame(name){stopArcadeRuntime();const routes={snake:renderSnake,signal:renderSignal,memory:renderMemory,gridshift:renderGridShift,minefield:renderMinefield,pulse:renderPulseTap,codesprint:renderCodeSprint,lanerunner:renderLaneRunner,breakout:renderBreakout,pong:renderPong,asteroid:renderAsteroidDodge,reaction:renderReactionGrid};(routes[name]||renderSignal)();}
function arcadeBack(){stopArcadeRuntime();openApp('games');}
function renderSnake(){const el=$('#app-content');el.innerHTML=appHero('Neon Snake','Use arrow keys. Eat pixels. Avoid yourself.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<canvas id="snake-canvas" width="420" height="300"></canvas><div class="arcade-controls"><button data-dir="ArrowLeft">←</button><button data-dir="ArrowUp">↑</button><button data-dir="ArrowDown">↓</button><button data-dir="ArrowRight">→</button></div><div class="button-row arcade-status"><button id="snake-start" class="primary-btn">Start / Restart</button><span id="snake-score" class="badge">SCORE 0</span></div>`;$('#game-back').onclick=arcadeBack;$('#snake-start').onclick=startSnake;$$('[data-dir]').forEach(b=>b.onclick=()=>window.onkeydown?.({key:b.dataset.dir,preventDefault(){}}));startSnake();}
function startSnake(){if(state.snake?.timer)clearInterval(state.snake.timer);const canvas=$('#snake-canvas'),ctx=canvas.getContext('2d');const cell=15,cols=canvas.width/cell,rows=canvas.height/cell;const s={body:[{x:8,y:10},{x:7,y:10},{x:6,y:10}],dir:{x:1,y:0},next:{x:1,y:0},food:{x:18,y:10},score:0};state.snake=s;const key=e=>{const m={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}[e.key];if(m&&!(m.x===-s.dir.x&&m.y===-s.dir.y)){s.next=m;e.preventDefault?.();}};window.onkeydown=key;s.timer=arcadeInterval(()=>{s.dir=s.next;const h={x:s.body[0].x+s.dir.x,y:s.body[0].y+s.dir.y};if(h.x<0||h.y<0||h.x>=cols||h.y>=rows||s.body.some(p=>p.x===h.x&&p.y===h.y)){clearInterval(s.timer);toast('Neon Snake',`Game over • ${s.score}`,'inform');return;}s.body.unshift(h);if(h.x===s.food.x&&h.y===s.food.y){s.score++;do{s.food={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)}}while(s.body.some(p=>p.x===s.food.x&&p.y===s.food.y));$('#snake-score').textContent=`SCORE ${s.score}`;}else s.body.pop();ctx.fillStyle='#020709';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#58c9ff';s.body.forEach(p=>ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4));ctx.fillStyle='#57e4a6';ctx.fillRect(s.food.x*cell+2,s.food.y*cell+2,cell-4,cell-4);},95);}
function renderSignal(){const el=$('#app-content');state.signal={code:Array.from({length:4},()=>Math.floor(Math.random()*4)+1),attempts:0};el.innerHTML=appHero('Signal Breaker','Match the hidden four-node signal in six attempts.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div class="signal-line">${[0,1,2,3].map(i=>`<select class="text-input signal-pick" data-i="${i}"><option>1</option><option>2</option><option>3</option><option>4</option></select>`).join('')}</div><div class="button-row arcade-status"><button id="signal-check" class="primary-btn">Transmit</button><span id="signal-hint" class="badge">6 ATTEMPTS</span></div><div id="signal-history" class="sos-list arcade-history"></div>`;$('#game-back').onclick=arcadeBack;$('#signal-check').onclick=()=>{const picks=$$('.signal-pick').map(s=>Number(s.value));state.signal.attempts++;let exact=0,near=0;const c=state.signal.code.slice(),p=picks.slice();for(let i=0;i<4;i++)if(p[i]===c[i]){exact++;p[i]=0;c[i]=-1;}for(let i=0;i<4;i++){if(!p[i])continue;const j=c.indexOf(p[i]);if(j>=0){near++;c[j]=-1;}}const row=document.createElement('div');row.className='list-row';row.innerHTML=`<span class="badge">${picks.join(' ')}</span><div class="grow"><strong>${exact} exact • ${near} near</strong><small>Attempt ${state.signal.attempts}</small></div>`;$('#signal-history').prepend(row);if(exact===4){toast('Signal Breaker','Signal cracked.','inform');$('#signal-check').disabled=true;}else if(state.signal.attempts>=6){toast('Signal Breaker',`Locked out • code was ${state.signal.code.join(' ')}`,'error');$('#signal-check').disabled=true;}$('#signal-hint').textContent=`${Math.max(0,6-state.signal.attempts)} ATTEMPTS`;};}
function renderMemory(){const el=$('#app-content');state.memory={seq:[],input:[],level:0,busy:false};el.innerHTML=appHero('Memory Matrix','Watch the lights, then repeat the sequence.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div class="memory-board">${Array.from({length:8},(_,i)=>`<button class="memory-cell" data-i="${i}" aria-label="Memory cell ${i+1}"></button>`).join('')}</div><div class="button-row arcade-status"><button id="memory-start" class="primary-btn">Start</button><span id="memory-level" class="badge">LEVEL 0</span></div>`;$('#game-back').onclick=arcadeBack;$('#memory-start').onclick=memoryNext;$$('.memory-cell').forEach(b=>b.onclick=()=>memoryPress(Number(b.dataset.i)));}
async function memoryNext(){const m=state.memory;m.level++;m.seq.push(Math.floor(Math.random()*8));m.input=[];m.busy=true;$('#memory-level').textContent=`LEVEL ${m.level}`;for(const i of m.seq){const c=$(`.memory-cell[data-i="${i}"]`);c.classList.add('active');await arcadeSleep(Math.max(170,360-m.level*8));c.classList.remove('active');await arcadeSleep(100);}m.busy=false;}
function memoryPress(i){const m=state.memory;if(!m||m.busy||!m.level)return;const idx=m.input.length;m.input.push(i);const c=$(`.memory-cell[data-i="${i}"]`);c.classList.add('active');arcadeTimeout(()=>c.classList.remove('active'),160);if(m.seq[idx]!==i){toast('Memory Matrix',`Missed at level ${m.level}.`,'error');m.level=0;m.seq=[];$('#memory-level').textContent='LEVEL 0';return;}if(m.input.length===m.seq.length)arcadeTimeout(memoryNext,500);}

function newGridShift(){const b=Array(16).fill(0);const add=()=>{const empty=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!empty.length)return;const i=empty[Math.floor(Math.random()*empty.length)];b[i]=Math.random()<.9?2:4;};add();add();return {board:b,score:0};}
function renderGridShift(){state.gridShift=newGridShift();const el=$('#app-content');el.innerHTML=appHero('Grid Shift','Merge matching blocks. Reach 2048 — or keep going.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div id="grid-shift-board" class="grid-shift-board"></div><div class="arcade-controls grid-controls"><button data-gmove="left">←</button><button data-gmove="up">↑</button><button data-gmove="down">↓</button><button data-gmove="right">→</button></div><div class="button-row arcade-status"><button id="grid-reset" class="primary-btn">New Grid</button><span id="grid-score" class="badge">SCORE 0</span></div>`;$('#game-back').onclick=arcadeBack;$('#grid-reset').onclick=renderGridShift;$$('[data-gmove]').forEach(b=>b.onclick=()=>gridShiftMove(b.dataset.gmove));window.onkeydown=e=>{const d={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(d){e.preventDefault();gridShiftMove(d);}};drawGridShift();}
function collapse2048(line){const vals=line.filter(Boolean),out=[];let gain=0;for(let i=0;i<vals.length;i++){if(vals[i]===vals[i+1]){out.push(vals[i]*2);gain+=vals[i]*2;i++;}else out.push(vals[i]);}while(out.length<4)out.push(0);return [out,gain];}
function gridShiftMove(dir){const g=state.gridShift;if(!g)return;const old=g.board.join(','),b=g.board.slice();let gain=0;for(let n=0;n<4;n++){let idx;if(dir==='left'||dir==='right')idx=[0,1,2,3].map(i=>n*4+i);else idx=[0,1,2,3].map(i=>i*4+n);let line=idx.map(i=>b[i]);if(dir==='right'||dir==='down')line.reverse();let r,lineGain;[r,lineGain]=collapse2048(line);gain+=lineGain;if(dir==='right'||dir==='down')r.reverse();idx.forEach((i,j)=>b[i]=r[j]);}g.board=b;g.score+=gain;if(g.board.join(',')!==old){const empty=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(empty.length){const i=empty[Math.floor(Math.random()*empty.length)];b[i]=Math.random()<.9?2:4;}}drawGridShift();if(b.includes(2048))toast('Grid Shift','2048 reached. Keep going.','inform');if(!b.includes(0)&&!gridShiftHasMoves(b))toast('Grid Shift',`No moves • ${g.score}`,'error');}
function gridShiftHasMoves(b){for(let i=0;i<16;i++){if(i%4<3&&b[i]===b[i+1])return true;if(i<12&&b[i]===b[i+4])return true;}return false;}
function drawGridShift(){const g=state.gridShift,host=$('#grid-shift-board');if(!g||!host)return;host.innerHTML=g.board.map(v=>`<div class="grid-shift-cell v${v||0}">${v||''}</div>`).join('');$('#grid-score').textContent=`SCORE ${g.score}`;}

function renderMinefield(){const count=10,mines=new Set();while(mines.size<count)mines.add(Math.floor(Math.random()*64));state.minefield={mines,revealed:new Set(),flags:new Set(),flagMode:false,over:false};const el=$('#app-content');el.innerHTML=appHero('Minefield','Clear the 8×8 tactical board without touching a mine.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div id="mine-board" class="mine-board"></div><div class="button-row arcade-status"><button id="mine-flag" class="secondary-btn">Flag Mode: OFF</button><button id="mine-reset" class="primary-btn">New Field</button><span id="mine-count" class="badge">10 MINES</span></div>`;$('#game-back').onclick=arcadeBack;$('#mine-reset').onclick=renderMinefield;$('#mine-flag').onclick=()=>{state.minefield.flagMode=!state.minefield.flagMode;$('#mine-flag').textContent=`Flag Mode: ${state.minefield.flagMode?'ON':'OFF'}`;};drawMinefield();}
function mineNeighbors(i){const x=i%8,y=Math.floor(i/8),a=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<8&&ny>=0&&ny<8)a.push(ny*8+nx);}return a;}
function mineReveal(i){const m=state.minefield;if(!m||m.over)return;if(m.flagMode){if(m.flags.has(i))m.flags.delete(i);else m.flags.add(i);drawMinefield();return;}if(m.flags.has(i)||m.revealed.has(i))return;if(m.mines.has(i)){m.over=true;m.mines.forEach(x=>m.revealed.add(x));drawMinefield();toast('Minefield','Mine triggered.','error');return;}const q=[i];while(q.length){const x=q.shift();if(m.revealed.has(x)||m.mines.has(x)||m.flags.has(x))continue;m.revealed.add(x);const n=mineNeighbors(x).filter(v=>m.mines.has(v)).length;if(!n)mineNeighbors(x).forEach(v=>{if(!m.revealed.has(v))q.push(v)});}drawMinefield();if(m.revealed.size===54){m.over=true;toast('Minefield','Field cleared.','inform');}}
function drawMinefield(){const m=state.minefield,h=$('#mine-board');if(!m||!h)return;h.innerHTML=Array.from({length:64},(_,i)=>{const r=m.revealed.has(i),mine=m.mines.has(i),n=mineNeighbors(i).filter(v=>m.mines.has(v)).length;return `<button class="mine-cell ${r?'revealed':''} ${r&&mine?'mine':''}" data-mine="${i}">${m.flags.has(i)?'⚑':r?(mine?'✹':(n||'')):''}</button>`}).join('');$$('[data-mine]').forEach(b=>b.onclick=()=>mineReveal(Number(b.dataset.mine)));$('#mine-count').textContent=`${Math.max(0,10-m.flags.size)} MINES`;}

function renderPulseTap(){state.pulse={ready:false,start:0,best:null,timer:null};const el=$('#app-content');el.innerHTML=appHero('Pulse Tap','Wait for the panel to turn live, then hit it as fast as possible.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<button id="pulse-pad" class="pulse-pad"><b>READY?</b><span>Tap Start</span></button><div class="button-row arcade-status"><button id="pulse-start" class="primary-btn">Start Round</button><span id="pulse-best" class="badge">BEST —</span></div>`;$('#game-back').onclick=arcadeBack;$('#pulse-start').onclick=pulseStart;$('#pulse-pad').onclick=pulseHit;}
function pulseStart(){const p=state.pulse;if(!p)return;clearTimeout(p.timer);p.ready=false;const pad=$('#pulse-pad');pad.className='pulse-pad waiting';pad.innerHTML='<b>WAIT</b><span>Do not tap yet</span>';p.timer=arcadeTimeout(()=>{p.ready=true;p.start=performance.now();pad.className='pulse-pad live';pad.innerHTML='<b>TAP</b><span>NOW</span>';},800+Math.random()*1900);}
function pulseHit(){const p=state.pulse;if(!p)return;if(!p.ready){clearTimeout(p.timer);$('#pulse-pad').className='pulse-pad early';$('#pulse-pad').innerHTML='<b>EARLY</b><span>Start another round</span>';return;}const ms=Math.round(performance.now()-p.start);p.ready=false;p.best=p.best==null?ms:Math.min(p.best,ms);$('#pulse-pad').className='pulse-pad result';$('#pulse-pad').innerHTML=`<b>${ms} ms</b><span>${ms<220?'Elite reaction':ms<300?'Fast':'Keep training'}</span>`;$('#pulse-best').textContent=`BEST ${p.best} ms`;}

function renderCodeSprint(){state.codeSprint={round:0,errors:0,start:0,target:''};const el=$('#app-content');el.innerHTML=appHero('Code Sprint','Type ten generated access codes as quickly and accurately as possible.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div class="code-sprint"><div id="code-target" class="code-target">PRESS START</div><input id="code-input" class="text-input code-input" maxlength="8" autocomplete="off" spellcheck="false" placeholder="Type code"><div class="button-row arcade-status"><button id="code-start" class="primary-btn">Start Sprint</button><span id="code-progress" class="badge">0 / 10</span><span id="code-errors" class="badge">0 ERRORS</span></div></div>`;$('#game-back').onclick=arcadeBack;$('#code-start').onclick=codeSprintStart;$('#code-input').oninput=codeSprintCheck;}
function codeSprintNext(){const c=state.codeSprint,chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';c.target=Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('');$('#code-target').textContent=c.target;$('#code-input').value='';$('#code-input').focus();}
function codeSprintStart(){const c=state.codeSprint;c.round=0;c.errors=0;c.start=performance.now();$('#code-errors').textContent='0 ERRORS';$('#code-progress').textContent='0 / 10';codeSprintNext();}
function codeSprintCheck(){const c=state.codeSprint,v=$('#code-input').value.toUpperCase();if(v.length<c.target.length)return;if(v===c.target){c.round++;$('#code-progress').textContent=`${c.round} / 10`;if(c.round>=10){const sec=((performance.now()-c.start)/1000).toFixed(2);$('#code-target').textContent=`${sec}s`;toast('Code Sprint',`${sec}s • ${c.errors} errors`,'inform');$('#code-input').blur();return;}codeSprintNext();}else{c.errors++;$('#code-errors').textContent=`${c.errors} ERRORS`;$('#code-input').value='';}}

function renderLaneRunner(){const el=$('#app-content');el.innerHTML=appHero('Lane Runner','Dodge incoming traffic. Speed increases the longer you survive.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<canvas id="lane-canvas" width="420" height="300"></canvas><div class="arcade-controls"><button id="lane-left">←</button><button id="lane-right">→</button></div><div class="button-row arcade-status"><button id="lane-start" class="primary-btn">Start / Restart</button><span id="lane-score" class="badge">DISTANCE 0</span></div>`;$('#game-back').onclick=arcadeBack;$('#lane-start').onclick=startLaneRunner;$('#lane-left').onclick=()=>laneMove(-1);$('#lane-right').onclick=()=>laneMove(1);window.onkeydown=e=>{if(e.key==='ArrowLeft'){e.preventDefault();laneMove(-1)}if(e.key==='ArrowRight'){e.preventDefault();laneMove(1)}};startLaneRunner();}
function laneMove(d){const g=state.laneRunner;if(g)g.lane=Math.max(0,Math.min(4,g.lane+d));}
function startLaneRunner(){if(state.laneRunner?.timer)clearInterval(state.laneRunner.timer);const canvas=$('#lane-canvas'),ctx=canvas.getContext('2d'),g={lane:2,obs:[],ticks:0,score:0,speed:3};state.laneRunner=g;g.timer=arcadeInterval(()=>{g.ticks++;g.speed=Math.min(8,3+g.ticks/500);if(g.ticks%Math.max(16,Math.floor(42-g.speed*3))===0)g.obs.push({lane:Math.floor(Math.random()*5),y:-34});g.obs.forEach(o=>o.y+=g.speed);g.obs=g.obs.filter(o=>o.y<340);g.score=Math.floor(g.ticks/5);const px=40+g.lane*76;const hit=g.obs.some(o=>o.lane===g.lane&&o.y>230&&o.y<286);ctx.fillStyle='#050a10';ctx.fillRect(0,0,420,300);ctx.strokeStyle='rgba(255,255,255,.10)';ctx.setLineDash([18,16]);for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(20+i*76,0);ctx.lineTo(20+i*76,300);ctx.stroke();}ctx.setLineDash([]);ctx.fillStyle='#58c9ff';ctx.fillRect(px,250,38,28);ctx.fillStyle='#ff6875';g.obs.forEach(o=>ctx.fillRect(40+o.lane*76,o.y,38,28));$('#lane-score').textContent=`DISTANCE ${g.score}`;if(hit){clearInterval(g.timer);toast('Lane Runner',`Crash • distance ${g.score}`,'error');}},40);}



function renderBreakout(){
 const el=$('#app-content');el.innerHTML=appHero('Brick Breaker','Move with A/D, Left/Right, pointer or touch. Clear every brick.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<canvas id="breakout-canvas" width="560" height="320"></canvas><div class="arcade-controls"><button id="break-left">←</button><button id="break-right">→</button></div><div class="button-row arcade-status"><button id="break-start" class="primary-btn">Start / Restart</button><span id="break-score" class="badge">SCORE 0</span><span id="break-best" class="badge">BEST ${arcadeBest('breakout',0)}</span></div>`;
 $('#game-back').onclick=arcadeBack;$('#break-start').onclick=startBreakout;$('#break-left').onpointerdown=()=>state.breakout&&(state.breakout.move=-1);$('#break-right').onpointerdown=()=>state.breakout&&(state.breakout.move=1);['#break-left','#break-right'].forEach(q=>$(q).onpointerup=()=>state.breakout&&(state.breakout.move=0));window.onkeydown=e=>{if(['a','A','ArrowLeft'].includes(e.key)){e.preventDefault();if(state.breakout)state.breakout.move=-1}if(['d','D','ArrowRight'].includes(e.key)){e.preventDefault();if(state.breakout)state.breakout.move=1}};window.onkeyup=e=>{if(['a','A','d','D','ArrowLeft','ArrowRight'].includes(e.key)&&state.breakout)state.breakout.move=0};startBreakout();
}
function startBreakout(){stopArcadeRuntime();const canvas=$('#breakout-canvas'),ctx=canvas.getContext('2d'),g={paddle:230,move:0,ball:{x:280,y:240,vx:3.3,vy:-3.6},bricks:[],score:0};state.breakout=g;for(let r=0;r<4;r++)for(let c=0;c<9;c++)g.bricks.push({x:24+c*57,y:28+r*28,w:49,h:18,alive:true});const pointer=e=>{const box=canvas.getBoundingClientRect();g.paddle=Math.max(0,Math.min(460,(e.clientX-box.left)*canvas.width/box.width-50));};canvas.onpointermove=pointer;const tick=()=>{if(state.activeApp!=='games'||state.breakout!==g)return;g.paddle=Math.max(0,Math.min(460,g.paddle+g.move*7));const b=g.ball;b.x+=b.vx;b.y+=b.vy;if(b.x<7||b.x>553)b.vx*=-1;if(b.y<7)b.vy=Math.abs(b.vy);if(b.y>286&&b.y<304&&b.x>g.paddle&&b.x<g.paddle+100)b.vy=-Math.abs(b.vy);for(const brick of g.bricks){if(brick.alive&&b.x>brick.x&&b.x<brick.x+brick.w&&b.y>brick.y&&b.y<brick.y+brick.h){brick.alive=false;b.vy*=-1;g.score+=10;break;}}ctx.fillStyle='#050a10';ctx.fillRect(0,0,560,320);ctx.fillStyle='#63d7ff';ctx.fillRect(g.paddle,296,100,10);ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();g.bricks.forEach((x,i)=>{if(!x.alive)return;ctx.fillStyle=`hsl(${190+i*2} 72% ${50+(i%3)*5}%)`;ctx.fillRect(x.x,x.y,x.w,x.h)});$('#break-score').textContent=`SCORE ${g.score}`;if(!g.bricks.some(x=>x.alive)){const best=arcadeBest('breakout',g.score);$('#break-best').textContent=`BEST ${best}`;toast('Brick Breaker','Wall cleared.','inform');return;}if(b.y>330){const best=arcadeBest('breakout',g.score);$('#break-best').textContent=`BEST ${best}`;toast('Brick Breaker',`Ball lost • ${g.score}`,'error');return;}arcadeFrame(tick)};arcadeFrame(tick);}
function renderPong(){
 const el=$('#app-content');el.innerHTML=appHero('Vector Pong','Use W/S, Up/Down or drag over the court. First to seven wins.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<canvas id="pong-canvas" width="560" height="320"></canvas><div class="arcade-controls"><button id="pong-up">↑</button><button id="pong-down">↓</button></div><div class="button-row arcade-status"><button id="pong-start" class="primary-btn">Start / Restart</button><span id="pong-score" class="badge">0 : 0</span><span id="pong-best" class="badge">BEST ${arcadeBest('pong',0)}</span></div>`;
 $('#game-back').onclick=arcadeBack;$('#pong-start').onclick=startPong;$('#pong-up').onpointerdown=()=>state.pong&&(state.pong.move=-1);$('#pong-down').onpointerdown=()=>state.pong&&(state.pong.move=1);['#pong-up','#pong-down'].forEach(q=>$(q).onpointerup=()=>state.pong&&(state.pong.move=0));window.onkeydown=e=>{if(['w','W','ArrowUp'].includes(e.key)){e.preventDefault();if(state.pong)state.pong.move=-1}if(['s','S','ArrowDown'].includes(e.key)){e.preventDefault();if(state.pong)state.pong.move=1}};window.onkeyup=()=>state.pong&&(state.pong.move=0);startPong();
}
function startPong(){stopArcadeRuntime();const c=$('#pong-canvas'),x=c.getContext('2d'),g={py:125,ai:125,move:0,p:0,a:0,b:{x:280,y:160,vx:4,vy:2.8}};state.pong=g;c.onpointermove=e=>{const r=c.getBoundingClientRect();g.py=Math.max(0,Math.min(250,(e.clientY-r.top)*c.height/r.height-35))};const serve=d=>{g.b={x:280,y:160,vx:4*d,vy:(Math.random()*4)-2}};const tick=()=>{if(state.activeApp!=='games'||state.pong!==g)return;g.py=Math.max(0,Math.min(250,g.py+g.move*6));g.ai+=Math.sign(g.b.y-(g.ai+35))*Math.min(3.6,Math.abs(g.b.y-(g.ai+35)));const b=g.b;b.x+=b.vx;b.y+=b.vy;if(b.y<6||b.y>314)b.vy*=-1;if(b.x<31&&b.x>20&&b.y>g.py&&b.y<g.py+70)b.vx=Math.abs(b.vx)*1.03;if(b.x>529&&b.x<540&&b.y>g.ai&&b.y<g.ai+70)b.vx=-Math.abs(b.vx)*1.03;if(b.x<0){g.a++;serve(1)}if(b.x>560){g.p++;serve(-1)}x.fillStyle='#050a10';x.fillRect(0,0,560,320);x.strokeStyle='rgba(255,255,255,.16)';x.setLineDash([8,10]);x.beginPath();x.moveTo(280,0);x.lineTo(280,320);x.stroke();x.setLineDash([]);x.fillStyle='#63d7ff';x.fillRect(22,g.py,9,70);x.fillStyle='#ffb66d';x.fillRect(529,g.ai,9,70);x.beginPath();x.arc(b.x,b.y,6,0,Math.PI*2);x.fillStyle='#fff';x.fill();$('#pong-score').textContent=`${g.p} : ${g.a}`;if(g.p>=7||g.a>=7){if(g.p>g.a)arcadeBest('pong',g.p);$('#pong-best').textContent=`BEST ${arcadeBest('pong',0)}`;toast('Vector Pong',g.p>g.a?'Match won.':'Match lost.','inform');return;}arcadeFrame(tick)};arcadeFrame(tick);}
function renderAsteroidDodge(){
 const el=$('#app-content');el.innerHTML=appHero('Asteroid Dodge','Use arrows/WASD or touch controls. Survive as long as possible.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<canvas id="asteroid-canvas" width="560" height="320"></canvas><div class="arcade-controls"><button data-ast="left">←</button><button data-ast="up">↑</button><button data-ast="down">↓</button><button data-ast="right">→</button></div><div class="button-row arcade-status"><button id="ast-start" class="primary-btn">Start / Restart</button><span id="ast-score" class="badge">TIME 0.0</span><span id="ast-best" class="badge">BEST ${arcadeBest('asteroid',0).toFixed?.(1)||'0.0'}</span></div>`;
 $('#game-back').onclick=arcadeBack;$('#ast-start').onclick=startAsteroid;$$('[data-ast]').forEach(b=>b.onpointerdown=()=>{const g=state.asteroid;if(g)g.keys[b.dataset.ast]=true});$$('[data-ast]').forEach(b=>b.onpointerup=()=>{const g=state.asteroid;if(g)g.keys[b.dataset.ast]=false});window.onkeydown=e=>{const k={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[e.key];if(k&&state.asteroid){e.preventDefault();state.asteroid.keys[k]=true}};window.onkeyup=e=>{const k={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'}[e.key];if(k&&state.asteroid)state.asteroid.keys[k]=false};startAsteroid();
}
function startAsteroid(){stopArcadeRuntime();const c=$('#asteroid-canvas'),x=c.getContext('2d'),g={ship:{x:90,y:160},rocks:[],keys:{},start:performance.now(),lastSpawn:0,over:false};state.asteroid=g;const tick=t=>{if(state.activeApp!=='games'||state.asteroid!==g||g.over)return;const dt=(t-g.start)/1000;if(g.keys.left)g.ship.x-=4;if(g.keys.right)g.ship.x+=4;if(g.keys.up)g.ship.y-=4;if(g.keys.down)g.ship.y+=4;g.ship.x=Math.max(14,Math.min(546,g.ship.x));g.ship.y=Math.max(14,Math.min(306,g.ship.y));if(t-g.lastSpawn>Math.max(260,760-dt*12)){g.lastSpawn=t;g.rocks.push({x:580,y:20+Math.random()*280,r:8+Math.random()*15,v:2.4+Math.min(4,dt/12)+Math.random()*1.4})}g.rocks.forEach(r=>r.x-=r.v);g.rocks=g.rocks.filter(r=>r.x>-35);const hit=g.rocks.some(r=>Math.hypot(r.x-g.ship.x,r.y-g.ship.y)<r.r+9);x.fillStyle='#030812';x.fillRect(0,0,560,320);x.fillStyle='#7de3ff';x.beginPath();x.moveTo(g.ship.x+13,g.ship.y);x.lineTo(g.ship.x-9,g.ship.y-8);x.lineTo(g.ship.x-6,g.ship.y+8);x.closePath();x.fill();g.rocks.forEach(r=>{x.beginPath();x.arc(r.x,r.y,r.r,0,Math.PI*2);x.fillStyle='#9b8d81';x.fill()});$('#ast-score').textContent=`TIME ${dt.toFixed(1)}`;if(hit){g.over=true;const best=arcadeBest('asteroid',dt);$('#ast-best').textContent=`BEST ${best.toFixed(1)}`;toast('Asteroid Dodge',`Survived ${dt.toFixed(1)}s`,'inform');return;}arcadeFrame(tick)};arcadeFrame(tick);}
function renderReactionGrid(){
 const el=$('#app-content');el.innerHTML=appHero('Reaction Grid','Hit the highlighted node with pointer/touch or keys 1–9. Thirty seconds.',`<button id="game-back" class="secondary-btn">Arcade</button>`)+`<div id="reaction-grid" class="reaction-grid">${Array.from({length:9},(_,i)=>`<button data-react="${i}" aria-label="Node ${i+1}">${i+1}</button>`).join('')}</div><div class="button-row arcade-status"><button id="react-start" class="primary-btn">Start / Restart</button><span id="react-score" class="badge">SCORE 0</span><span id="react-best" class="badge">BEST ${arcadeBest('reaction',0)}</span></div>`;
 $('#game-back').onclick=arcadeBack;$('#react-start').onclick=startReaction;$$('[data-react]').forEach(b=>b.onclick=()=>reactionHit(Number(b.dataset.react)));window.onkeydown=e=>{const i=Number(e.key)-1;if(i>=0&&i<9){e.preventDefault();reactionHit(i)}};startReaction();
}
function startReaction(){stopArcadeRuntime();const g={score:0,active:-1,end:Date.now()+30000};state.reaction=g;const next=()=>{if(state.reaction!==g||Date.now()>=g.end){$$('[data-react]').forEach(b=>b.classList.remove('active'));const best=arcadeBest('reaction',g.score);$('#react-best').textContent=`BEST ${best}`;toast('Reaction Grid',`Final score ${g.score}`,'inform');return;}g.active=Math.floor(Math.random()*9);$$('[data-react]').forEach((b,i)=>b.classList.toggle('active',i===g.active));arcadeTimeout(next,540)};next();}
function reactionHit(i){const g=state.reaction;if(!g||Date.now()>=g.end)return;if(i===g.active){g.score++;g.active=-1;$('#react-score').textContent=`SCORE ${g.score}`;$$('[data-react]').forEach(b=>b.classList.remove('active'));}else g.score=Math.max(0,g.score-1);}

// ---------------------------------------------------------------------------
// rs-phone companion apps
// ---------------------------------------------------------------------------
// The tablet is a presentation surface only. rs-phone keeps ownership of its
// contacts/messages/banking/etc. The tablet asks the same server-authoritative
// request endpoint through the Device RPC and renders the returned live data.
let integrationRefresh=0;
async function refreshIntegrations(){
  const revision=++integrationRefresh;
  const result=await rpc('integration.list');
  if(revision!==integrationRefresh)return;
  state.integrationApps=result?.ok&&Array.isArray(result.data)?result.data:[];
  if(state.open)renderDesktop();
}
window.RSTabletBridge={list:()=>rpc('integration.list'),request:(id,action,payload={})=>rpc('integration.request',{id,action,payload}),open:id=>rpc('integration.open',{id})};
async function refreshProviders(){
  const result=await rpc('providers.snapshot');
  if(result?.ok&&result.data)state.providers=result.data;
  return state.providers;
}
async function phoneRequest(action,payload={}){
  return rpc('phone.request',{action,payload});
}
function providerBanner(online){
  return `<div class="phone-sync-banner"><div><strong>${online?'Synced with RS Tablet':'RS Tablet unavailable'}</strong><small>${online?'Your tablet services stay up to date':'This service is temporarily unavailable.'}</small></div><span class="sync-dot ${online?'':'off'}"></span></div>`;
}
function mediaProviderBanner(nativeOk,phoneOk,provider=''){
  if(nativeOk)return `<div class="phone-sync-banner"><div><strong>Hosted media ready</strong><small>${escapeHtml(provider||'Server media provider')} • URLs persisted by RS Tablet</small></div><span class="sync-dot"></span></div>`;
  return providerBanner(phoneOk);
}
const PHONE_APP_SOURCES={
  phone:{action:'getAppData',keys:['calls']},
  videocall:{action:'getAppData',keys:['calls']},
  messages:{action:'getAppData',keys:['conversations']},
  survivorchat:{action:'getAppData',keys:['conversations']},
  contacts:{action:'getAppData',keys:['contacts']},
  email:{action:'getEmails',keys:['emails','messages']},
  community:{action:'getTweets',keys:['tweets']},
  news:{action:'getNews',keys:['news','articles']},
  mediahub:{action:'getAppData',keys:['notes']},
  bank:{action:'getBank',keys:['transactions']},
  bills:{action:'getPlatform',keys:['invoices','bills']},
  garage:{action:'getGarage',keys:['vehicles','garage']},
  racing:{action:'getRacing',keys:['results','stats']},
  races:{action:'getRaceStandings',keys:['providers','standings']},
  market:{action:'getAds',keys:['ads','listings']},
  work:{action:'getPlatform',keys:['requests','services','opportunities']},
  yellowpage:{action:'getYellowPages',keys:['businesses','listings']},
  taxi:{action:'getNearbyPlaces',keys:['places']},
  houses:{action:'getHouses',keys:['houses','properties']},
  darkmarket:{action:'getDarkListings',keys:['listings']},
  reminders:{action:'getReminders',keys:['reminders']}
};
function firstArray(data,keys=[]){
  if(Array.isArray(data))return data;
  if(!data||typeof data!=='object')return [];
  for(const key of keys){if(Array.isArray(data[key]))return data[key];}
  for(const value of Object.values(data)){if(Array.isArray(value))return value;}
  return [];
}
function firstText(obj,keys,fallback=''){
  for(const key of keys){const v=obj?.[key];if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v);}
  return fallback;
}
function phoneRowCard(row,index){
  if(row===null||row===undefined)return '';
  if(typeof row!=='object')return `<div class="data-card"><b>${escapeHtml(String(row))}</b></div>`;
  const title=firstText(row,['display_name','name','title','label','subject','vehicle','model','property_label','business_name','other_number','contact_number','phone_number','tweet_id','id'],`Item ${index+1}`);
  const subtitle=firstText(row,['number','other_number','contact_number','plate','category','status','kind','type','email','handle','street','created_at','updated_at'],'');
  const body=firstText(row,['body','message','description','last_message','snippet','address','reason','notes'],'');
  return `<div class="data-card"><header><div><b>${escapeHtml(title)}</b>${subtitle?`<small>${escapeHtml(subtitle)}</small>`:''}</div></header>${body?`<p>${escapeHtml(body).slice(0,360)}</p>`:''}</div>`;
}
function renderPhoneRows(host,data,spec){
  const rows=firstArray(data,spec.keys);
  if(!rows.length){host.innerHTML='<div class="empty-state">No records to show.</div>';return;}
  host.innerHTML=rows.slice(0,40).map(phoneRowCard).join('');
}
async function renderPhoneOwnedApp(el,id){
 const renderApp=id;if(!renderApp||state.activeApp!==renderApp)return;const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;const isCurrentRender=()=>state.activeApp===renderApp&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const app=allApps().find(a=>a.id===id)||{label:id};
  const spec=PHONE_APP_SOURCES[id];
  await refreshProviders();if(!isCurrentRender())return;
  const online=state.providers?.phone?.available===true;
  let action='';
  if(id==='messages'||id==='survivorchat') action=`<div class="form-row"><input id="phone-recipient" class="text-input" placeholder="Contact number"><input id="phone-message" class="text-input" placeholder="Message"><button id="phone-send" class="primary-btn">Send</button></div>`;
  else if(id==='contacts') action=`<div class="form-row"><input id="contact-name" class="text-input" placeholder="Name"><input id="contact-number" class="text-input" placeholder="Contact number"><button id="contact-add" class="primary-btn">Add</button></div>`;
  el.innerHTML=appHero(app.label, online?'Live data from your RS Tablet account.':'This app uses the optional RS Tablet provider.')+providerBanner(online)+action+`<div id="phone-data" class="data-list"><div class="empty-state">${online?'Loading…':'Provider unavailable'}</div></div>`;
  if(!online||!spec)return;
  const result=await phoneRequest(spec.action,{});if(!isCurrentRender())return;
  if(!result?.ok){$('#phone-data').innerHTML=`<div class="provider-unavailable"><b>Could not load ${escapeHtml(app.label)}</b><p>${escapeHtml(result?.error||'The phone provider rejected the request.')}</p></div>`;return;}
  if(id==='bank'){
    const d=result.data||{};
    const cash=Number(d.cash??d.balances?.cash??0),bank=Number(d.bank??d.balances?.bank??0);
    $('#phone-data').innerHTML=`<div class="data-kv"><div><span>Bank</span><strong>$${bank.toLocaleString()}</strong></div><div><span>Cash</span><strong>$${cash.toLocaleString()}</strong></div></div><div id="phone-bank-rows" class="data-list" style="margin-top:10px"></div>`;
    renderPhoneRows($('#phone-bank-rows'),d,spec);
  }else renderPhoneRows($('#phone-data'),result.data||{},spec);
  if($('#phone-send'))$('#phone-send').onclick=async()=>{
    const recipient=$('#phone-recipient').value.trim(),body=$('#phone-message').value.trim();
    if(!recipient||!body)return toast('Messages','Enter a number and message.','error');
    const sent=await phoneRequest('sendMessage',{recipientNumber:recipient,body});
    if(sent?.ok){toast('Messages','Message sent.','inform');$('#phone-message').value='';const fresh=await phoneRequest('getAppData',{});if(fresh?.ok)renderPhoneRows($('#phone-data'),fresh.data||{},spec);}
    else toast('Messages',sent?.error||'Message failed.','error');
  };
  if($('#contact-add'))$('#contact-add').onclick=async()=>{
    const name=$('#contact-name').value.trim(),number=$('#contact-number').value.trim();
    if(!number)return toast('Contacts','Enter a contact number.','error');
    const added=await phoneRequest('addContact',{name,number});
    if(added?.ok){toast('Contacts','Contact saved.','inform');renderPhoneRows($('#phone-data'),added.data||{},spec);}
    else toast('Contacts',added?.error||'Contact could not be saved.','error');
  };
}

Object.keys(PHONE_APP_SOURCES).forEach(id=>{appRenderers[id]=(el)=>renderPhoneOwnedApp(el,id);});

// ---------------------------------------------------------------------------
// Shared provider-backed tablet surfaces
// ---------------------------------------------------------------------------
// These renderers intentionally use rs-phone's existing server actions rather
// than duplicating money, ownership, messages, media or social data in tablet.
const PHONE_CACHE_MS = 12000;
let gallerySelectedId = null;
let gallerySelectMode = false;
const gallerySelection = new Set();
let mapCategory = 'all';
let lastCctvId = '';
const MAP_CATEGORIES=['all','shops','food','fuel','medical','police','garages','jobs'];
const MAP_CATEGORY_LABELS={all:'All places',shops:'Shops',food:'Food',fuel:'Fuel',medical:'Medical',police:'Police',garages:'Garages',jobs:'Jobs'};
const TABLET_MAP_BOUNDS={minX:-4000,maxX:4500,minY:-4400,maxY:8000};
function mapXY(x,y,bounds=TABLET_MAP_BOUNDS){
  const b=bounds||TABLET_MAP_BOUNDS;
  return {left:(Number(x)-b.minX)/(b.maxX-b.minX)*100,top:(1-(Number(y)-b.minY)/(b.maxY-b.minY))*100};
}
function mapPlaces(){
  const aliases={shop:'shops',store:'shops',restaurant:'food',gas:'fuel',hospital:'medical',garage:'garages',job:'jobs'};
  return (Array.isArray(state.mapData?.places)?state.mapData.places:[]).filter(p=>mapCategory==='all'||(aliases[p.category]||p.category)===mapCategory);
}
async function loadTabletMap(base=false){
  const [baseReply,live,nearby]=await Promise.all([
    base?phoneRequest('getMapBase',{}):Promise.resolve(null),
    phoneRequest('getMapData',{}),phoneRequest('getNearbyPlaces',{})
  ]);
  if(baseReply?.ok){
    const data=baseReply.data||{}, b=data.bounds||TABLET_MAP_BOUNDS;
    const valid=['minX','maxX','minY','maxY'].every(k=>Number.isFinite(Number(b[k])))&&Number(b.maxX)>Number(b.minX)&&Number(b.maxY)>Number(b.minY);
    state.mapBase={postals:Array.isArray(data.postals)?data.postals:[],bounds:valid?Object.fromEntries(Object.keys(TABLET_MAP_BOUNDS).map(k=>[k,Number(b[k])])):{...TABLET_MAP_BOUNDS}};
  }
  if(live?.ok)state.mapData={...(state.mapData||{}),...(live.data||{})};
  if(nearby?.ok)state.mapData={...(state.mapData||{}),places:Array.isArray(nearby.data?.places)?nearby.data.places:[]};
  return !!state.mapBase&&live?.ok===true;
}
let emailFolder = 'inbox';
let currentEmail = null;
let mapRefreshTimer = null;
// rs-phone keeps its legacy database/API parent key internally; the tablet UI is branded only as Community.
const PHONE_COMMUNITY_PARENT = 'chirp';
const TABLET_BANK_CARD_THEMES = {
  fleeca:{label:'FLEECA DEBIT',badge:'PREMIER'},
  midnight:{label:'FLEECA DEBIT',badge:'MIDNIGHT'},
  rose:{label:'FLEECA DEBIT',badge:'SIGNATURE'},
  emerald:{label:'FLEECA DEBIT',badge:'RESERVE'}
};
const phoneAppRefreshTimers = new Map();

function fmtMoney(value){return `$${Math.max(0,Number(value)||0).toLocaleString()}`;}
function fmtDate(value){
  if(!value)return '';
  const d=typeof value==='number'?new Date(value>1e12?value:value*1000):new Date(String(value).replace(' ','T'));
  return Number.isNaN(d.getTime())?String(value):d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
function appError(host,title,result){
  host.innerHTML=`<div class="provider-unavailable"><b>${escapeHtml(title)}</b><p>${escapeHtml(result?.error||'RS Tablet did not return data.')}</p></div>`;
}
async function getPhoneBootstrap(force=false){
  if(!force&&state.phoneBootstrap&&(Date.now()-state.phoneBootstrapAt)<PHONE_CACHE_MS)return {ok:true,data:state.phoneBootstrap};
  const r=await rpc('phone.bootstrap');
  if(r?.ok&&r.data){state.phoneBootstrap=r.data;state.phoneBootstrapAt=Date.now();}
  return r;
}
function tabletPhoneSettingIds(key){return new Set((Array.isArray(state.phoneBootstrap?.settings?.[key])?state.phoneBootstrap.settings[key]:[]).map(v=>String(v||'')).filter(Boolean));}
async function patchSharedPhoneSettings(patch){
  const boot=await getPhoneBootstrap();
  if(!boot?.ok)return boot;
  const r=await rpc('phone.settings.patch',{patch});
  if(r?.ok){state.phoneBootstrap=state.phoneBootstrap||{};state.phoneBootstrap.settings=r.data?.settings||{...(state.phoneBootstrap.settings||{}),...patch};state.phoneBootstrapAt=Date.now();}
  return r;
}
async function removeSharedPhoneItem(key,id){
  id=String(id||'').trim();if(!id)return {ok:false,error:'invalid_id'};
  await getPhoneBootstrap();
  const values=tabletPhoneSettingIds(key);values.add(id);
  return patchSharedPhoneSettings({[key]:[...values]});
}
async function restoreSharedPhoneItems(key){return patchSharedPhoneSettings({[key]:[]});}
function tabletBankTheme(){const raw=String(state.phoneBootstrap?.settings?.bankCardTheme||'fleeca').toLowerCase();return TABLET_BANK_CARD_THEMES[raw]?raw:'fleeca';}
function phoneMedia(){return Array.isArray(state.phoneBootstrap?.media)?state.phoneBootstrap.media:[];}
function mediaId(item){return String(item?.media_id||item?.mediaId||item?.id||'');}
function mediaType(item){return String(item?.media_type||item?.type||'photo').toLowerCase();}
function shareableMediaOptions(selected=''){
  return phoneMedia().filter(m=>{
    const u=String(m?.url||'');return u.startsWith('img/')||u.startsWith('https://')||u.startsWith('resource-media://')||u.startsWith('db://')||u.startsWith('dbv://');
  }).map(m=>`<option value="${escapeHtml(String(m.url||''))}" ${String(m.url||'')===selected?'selected':''}>${mediaType(m)==='video'?'Video':'Photo'} • ${escapeHtml(fmtDate(m.created_at)||mediaId(m))}</option>`).join('');
}
function directMediaSrc(item){
  const id=mediaId(item);
  if(id&&state.mediaCache.has(id))return state.mediaCache.get(id);
  const thumb=String(item?.thumbnail_url||'');
  const url=String(item?.url||'');
  if(/^https:\/\//i.test(thumb)||/^data:/i.test(thumb))return thumb;
  if(url.startsWith('img/'))return url;
  if(/^https:\/\//i.test(url)||/^data:/i.test(url))return url;
  return '';
}
async function requestMediaBlob(item){
  const id=mediaId(item); if(!id||directMediaSrc(item)||state.mediaPending.has(id))return;
  state.mediaPending.add(id); const r=await rpc('phone.media.fetch',{mediaId:id});
  if(!r?.ok)state.mediaPending.delete(id);
}
function mediaVisual(item,cls='phone-media'){
  const id=mediaId(item),src=directMediaSrc(item),type=mediaType(item);
  if(!src){if(id)requestMediaBlob(item);return `<div class="${cls} media-loading" data-media-id="${escapeHtml(id)}"><span>${type==='video'?'VIDEO':'PHOTO'}</span><small>Loading media…</small></div>`;}
  if(type==='video')return `<video class="${cls}" data-media-id="${escapeHtml(id)}" src="${escapeHtml(src)}" preload="metadata" controls playsinline></video>`;
  return `<img class="${cls}" data-media-id="${escapeHtml(id)}" src="${escapeHtml(src)}" alt="Gallery media" draggable="false">`;
}
function refreshMediaNodes(id,src){
  $$(`[data-media-id="${CSS.escape(String(id))}"]`).forEach(node=>{
    const item=phoneMedia().find(m=>mediaId(m)===String(id));if(!item)return;
    const wrap=document.createElement('div');wrap.innerHTML=mediaVisual(item,node.classList.contains('gallery-media')?'gallery-media':'phone-media');
    const next=wrap.firstElementChild;if(next)node.replaceWith(next);
  });
}

// Camera -- same rs-phone persistence, tablet-appropriate larger controls.
appRenderers.camera = async el => {if(state.activeApp!=='camera')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='camera'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [boot,nativeCaps,nativeList]=await Promise.all([getPhoneBootstrap(),rpc('tablet.media.capabilities'),rpc('tablet.media.list')]);if(!isCurrentRender())return;
  const mediaLibrary=nativeCaps?.data?.library||((nativeCaps?.data?.provider==='phone')?'phone':'tablet');
  const usePhoneLibrary=mediaLibrary==='phone'&&boot?.ok===true;
  const useNative=!usePhoneLibrary&&nativeCaps?.ok&&nativeCaps.data?.storage===true;
  const media=usePhoneLibrary?phoneMedia():(useNative?(Array.isArray(nativeList?.data)?nativeList.data:[]):[]);
  const photos=media.filter(m=>mediaType(m)!=='video').length, videos=media.filter(m=>mediaType(m)==='video').length;
  const cap=useNative?{videoEnabled:nativeCaps.data.video,photoEnabled:nativeCaps.data.photo,transport:nativeCaps.data.transport,warning:nativeCaps.data.warning}:state.phoneBootstrap?.camera||{};
  el.innerHTML=appHero('Camera','Rear, selfie, photo and video capture with persistent hosted storage.',`<div class="button-row"><button id="camera-gallery-top" class="secondary-btn">Gallery</button><button id="camera-scanner-top" class="secondary-btn">Scanner</button></div>`)+
    mediaProviderBanner(useNative,boot?.ok===true,nativeCaps?.data?.provider)+`<div class="camera-mode-grid">
      <button class="camera-mode" data-mode="photo"><b>PHOTO</b><small>Rear camera</small></button>
      <button class="camera-mode" data-mode="selfie"><b>SELFIE</b><small>Front camera</small></button>
      <button class="camera-mode" data-mode="video"><b>VIDEO</b><small>Rear video</small></button>
      <button class="camera-mode" data-mode="video_selfie"><b>VIDEO SELFIE</b><small>Front video</small></button>
    </div><div class="cards camera-dashboard" style="margin-top:12px">${card('Latest Capture',media.length?`<div class="camera-latest">${mediaVisual(media[0],'camera-latest-media')}<div><b>${mediaType(media[0])==='video'?'VIDEO':'PHOTO'}</b><small>${escapeHtml(fmtDate(media[0].created_at)||'Newest capture')}</small><span>${media.length} items • ${photos} photos • ${videos} videos</span></div></div><div class="button-row"><button class="primary-btn" id="camera-latest-open">Open Latest</button><button class="secondary-btn" id="camera-gallery">Full Gallery</button></div>`:`<div class="camera-empty-roll"><b>NO CAPTURES</b><span>Your newest photo or video will appear here immediately after capture.</span></div><button class="secondary-btn" id="camera-gallery">Open Gallery</button>`)}${card('Capture Provider',`<div class="kv"><span>Photo</span><b>${cap.photoEnabled===false?'Unavailable':'Ready'}</b><span>Video</span><b>${cap.videoEnabled===false?'Unavailable':'Ready'}</b><span>Storage</span><b>${escapeHtml(String(useNative?(nativeCaps.data.provider||'Hosted Media'):(state.phoneBootstrap?.device?.storage_provider||'RS Tablet')))}</b>${useNative?`<span>Transport</span><b>${escapeHtml(String(cap.transport||'unknown').toUpperCase())}</b>`:''}</div>${cap.warning?`<p class="danger-text">${escapeHtml(String(cap.warning))}</p>`:''}<p>Enter/E captures • LEFT/RIGHT changes mode • UP flips front/rear • wheel zoom • ESC exits.</p>`)}</div>`;
  $$('.camera-mode').forEach(b=>b.onclick=async()=>{const r=await rpc('phone.camera.start',{mode:b.dataset.mode});if(!r?.ok)toast('Camera',r?.error||'Camera could not start.','error');});
  $('#camera-gallery').onclick=()=>{gallerySelectedId=null;state.pendingLatestMediaId=null;openApp('gallery');};
  if($('#camera-latest-open'))$('#camera-latest-open').onclick=()=>{state.pendingLatestMediaId=mediaId(media[0]);gallerySelectedId=state.pendingLatestMediaId;state.pendingLatestMediaId=null;openApp('gallery');};
  $('#camera-gallery-top').onclick=()=>{gallerySelectedId=null;state.pendingLatestMediaId=null;openApp('gallery');};
  $('#camera-scanner-top').onclick=()=>openApp('scanner');
};

appRenderers.gallery = async el => {if(state.activeApp!=='gallery')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='gallery'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [boot,nativeCaps,nativeList]=await Promise.all([getPhoneBootstrap(true),rpc('tablet.media.capabilities'),rpc('tablet.media.list')]);if(!isCurrentRender())return;
  const mediaLibrary=nativeCaps?.data?.library||((nativeCaps?.data?.provider==='phone')?'phone':'tablet');
  const usePhoneLibrary=mediaLibrary==='phone'&&boot?.ok===true;
  const nativeOk=!usePhoneLibrary&&nativeCaps?.ok===true&&nativeCaps.data?.storage===true&&nativeList?.ok===true;
  if(!nativeOk&&!usePhoneLibrary){el.innerHTML=appHero('Photos','Hosted tablet camera roll and persistent media.')+providerBanner(false);return;}
  const media=usePhoneLibrary?phoneMedia():(Array.isArray(nativeList.data)?nativeList.data:[]);
  const liveIds=new Set(media.map(mediaId));
  [...gallerySelection].forEach(id=>{if(!liveIds.has(id))gallerySelection.delete(id);});
  if(!gallerySelectedId&&state.pendingLatestMediaId){const latest=media.find(m=>mediaId(m)===String(state.pendingLatestMediaId));if(latest)gallerySelectedId=mediaId(latest);state.pendingLatestMediaId=null;}
  const selected=gallerySelectedId&&media.find(m=>mediaId(m)===gallerySelectedId);
  const selectedIndex=selected?media.findIndex(m=>mediaId(m)===mediaId(selected)):-1;
  const selectedIds=[...gallerySelection];
  const toolbar=gallerySelectMode
    ? `<div><button id="gallery-select-all" class="secondary-btn">${selectedIds.length===media.length&&media.length?'Deselect All':'Select All'}</button><span class="badge">${selectedIds.length} SELECTED</span></div><div><button id="gallery-cancel-select" class="secondary-btn">Done</button><button id="gallery-delete-selected" class="danger-btn" ${selectedIds.length?'':'disabled'}>Delete ${selectedIds.length||''}</button></div>`
    : `<div><span>${media.length} items</span></div><div><button id="gallery-select" class="secondary-btn">Select</button><button id="gallery-refresh" class="secondary-btn">Refresh</button></div>`;
  const durablePhoto=selected&&mediaType(selected)!=='video'&&/^(resource-media:\/\/|db:\/\/|dbv:\/\/|media\/)/.test(String(selected.url||''));
  const candidateTabletWallpaper=selected&&mediaType(selected)!=='video'?directMediaSrc(selected):'';
  const tabletWallpaperSrc=/^https:\/\//i.test(candidateTabletWallpaper)?candidateTabletWallpaper:'';
  el.innerHTML=appHero('Photos',nativeOk?'Tablet-hosted photo and video library.':'The same persistent photo and video library available on your tablet.',`<button id="gallery-camera" class="primary-btn">Camera</button>`)+mediaProviderBanner(nativeOk,boot?.ok===true,nativeOk?'RS Tablet hosted storage':'RS Tablet')+
    (selected&&!gallerySelectMode?`<div class="media-viewer"><div class="media-viewer-head"><div><b>${mediaType(selected)==='video'?'Video':'Photo'}</b><small>${escapeHtml(fmtDate(selected.created_at))}</small></div><div class="button-row">${tabletWallpaperSrc?'<button id="media-tablet-wallpaper" class="secondary-btn">Set Tablet Wallpaper</button>':''}${durablePhoto?'<button id="media-wallpaper" class="secondary-btn">Set Linked Wallpaper</button>':''}<button id="media-prev" class="secondary-btn" ${selectedIndex>0?'':'disabled'}>Previous</button><button id="media-next" class="secondary-btn" ${selectedIndex>=0&&selectedIndex<media.length-1?'':'disabled'}>Next</button><button id="media-close" class="secondary-btn">Back</button><button id="media-delete" class="danger-btn">Delete</button></div></div>${mediaVisual(selected,'gallery-view-media')}</div>`:'')+
    `<div class="gallery-toolbar">${toolbar}</div><div class="gallery-grid">${media.length?media.map(m=>{const id=mediaId(m),chosen=gallerySelection.has(id);return `<button class="gallery-card ${gallerySelectMode?'selecting':''} ${chosen?'selected':''}" data-mid="${escapeHtml(id)}">${mediaVisual(m,'gallery-media')}<span>${mediaType(m)==='video'?'VIDEO':'PHOTO'}</span>${gallerySelectMode?`<i class="gallery-check">${chosen?'✓':''}</i>`:''}</button>`;}).join(''):'<div class="empty-state wide">No captures yet. Use the tablet camera.</div>'}</div>`;
  $('#gallery-camera').onclick=()=>openApp('camera');
  if($('#gallery-refresh'))$('#gallery-refresh').onclick=()=>{gallerySelectedId=null;state.phoneBootstrap=null;appRenderers.gallery(el);};
  if($('#gallery-select'))$('#gallery-select').onclick=()=>{gallerySelectMode=true;gallerySelectedId=null;gallerySelection.clear();appRenderers.gallery(el);};
  if($('#gallery-cancel-select'))$('#gallery-cancel-select').onclick=()=>{gallerySelectMode=false;gallerySelection.clear();appRenderers.gallery(el);};
  if($('#gallery-select-all'))$('#gallery-select-all').onclick=()=>{if(gallerySelection.size===media.length)gallerySelection.clear();else media.forEach(m=>gallerySelection.add(mediaId(m)));appRenderers.gallery(el);};
  if($('#gallery-delete-selected'))$('#gallery-delete-selected').onclick=async()=>{
    const ids=[...gallerySelection].filter(Boolean);if(!ids.length)return;
    if(!confirm(`Delete ${ids.length} selected item${ids.length===1?'':'s'}?`))return;
    let removed=0;
    if(nativeOk){for(const id of ids){const r=await rpc('tablet.media.delete',{id:Number(id)});if(!r?.ok)return toast('Photos',r?.error||'Delete failed.','error');removed+=Number(r.data?.deleted||0);}}
    else{for(let i=0;i<ids.length;i+=100){const r=await phoneRequest('deleteMediaBatch',{mediaIds:ids.slice(i,i+100)});if(!r?.ok)return toast('Photos',r?.error||'Batch delete failed.','error');removed+=Number(r.data?.count||r.data?.deleted?.length||0);}}
    gallerySelectMode=false;gallerySelection.clear();gallerySelectedId=null;state.phoneBootstrap=null;toast('Photos',`${removed} item${removed===1?'':'s'} deleted.`,'inform');appRenderers.gallery(el);
  };
  $$('.gallery-card').forEach(b=>b.onclick=()=>{const id=b.dataset.mid;if(gallerySelectMode){if(gallerySelection.has(id))gallerySelection.delete(id);else gallerySelection.add(id);appRenderers.gallery(el);return;}gallerySelectedId=id;appRenderers.gallery(el);});
  if($('#media-prev'))$('#media-prev').onclick=()=>{if(selectedIndex>0){gallerySelectedId=mediaId(media[selectedIndex-1]);appRenderers.gallery(el);}};
  if($('#media-next'))$('#media-next').onclick=()=>{if(selectedIndex>=0&&selectedIndex<media.length-1){gallerySelectedId=mediaId(media[selectedIndex+1]);appRenderers.gallery(el);}};
  if($('#media-close'))$('#media-close').onclick=()=>{gallerySelectedId=null;appRenderers.gallery(el);};
  if($('#media-delete'))$('#media-delete').onclick=async()=>{if(!confirm('Delete this media?'))return;const r=nativeOk?await rpc('tablet.media.delete',{id:Number(mediaId(selected))}):await phoneRequest('deleteMedia',{mediaId:mediaId(selected)});if(!r?.ok)return toast('Photos',r?.error||'Delete failed.','error');gallerySelectedId=null;state.phoneBootstrap=null;toast('Photos','Deleted.','inform');appRenderers.gallery(el);};
  if($('#media-wallpaper'))$('#media-wallpaper').onclick=async()=>{const r=await rpc('phone.settings.patch',{patch:{wallpaper:'custom',customWallpaper:String(selected.url||'')}});if(r?.ok){toast('Photos','Linked wallpaper updated.','inform');state.phoneBootstrap.settings=r.data?.settings||state.phoneBootstrap.settings;}else toast('Photos',r?.error||'Wallpaper update failed.','error');};
  if($('#media-tablet-wallpaper'))$('#media-tablet-wallpaper').onclick=async()=>{state.customWallpaper=tabletWallpaperSrc;$('#screen').dataset.wallpaper='custom';await nui('saveSetting',{key:'customWallpaper',value:state.customWallpaper});await nui('saveSetting',{key:'wallpaper',value:'custom'});applyAppearance();toast('Photos','Tablet wallpaper updated.','inform');};
};

function tabletCallInitials(value=''){
  const parts=String(value||'?').trim().split(/\s+/).filter(Boolean);return (parts.slice(0,2).map(x=>x[0]||'').join('')||'?').toUpperCase();
}
function clearTabletVideoFrames(){
  const remote=$('#tablet-video-remote'),self=$('#tablet-video-self'),remoteImg=$('#tablet-video-remote-frame'),selfImg=$('#tablet-video-self-frame');
  remote?.classList.remove('has-frame');self?.classList.remove('has-frame');if(remoteImg)remoteImg.removeAttribute('src');if(selfImg)selfImg.removeAttribute('src');
  const status=$('#tablet-video-status');if(status)status.textContent='Connecting video…';
}
function applyTabletVideoFrame(kind,data){
  if(state.activeApp!=='videocall'||state.callState?.phase!=='connected'||typeof data!=='string'||!data.startsWith('data:image/'))return;
  const remote=kind==='remote';const wrap=$(remote?'#tablet-video-remote':'#tablet-video-self'),img=$(remote?'#tablet-video-remote-frame':'#tablet-video-self-frame');if(!wrap||!img)return;
  img.src=data;wrap.classList.add('has-frame');if(remote){const status=$('#tablet-video-status');if(status)status.textContent='Live';}
}
function callPanel(video){
  const cs=state.callState;if(!cs||cs.phase==='ended')return '';
  const c=cs.call||{},incoming=cs.phase==='incoming';
  if(video&&c.video===true&&cs.phase==='connected'){
    const who=c.otherName||c.otherNumber||'Unknown';
    return `<div class="tablet-video-call-stage"><div id="tablet-video-remote" class="tablet-video-remote"><img id="tablet-video-remote-frame" alt=""><div class="tablet-video-fallback"><b>${escapeHtml(tabletCallInitials(who))}</b><span id="tablet-video-status">Connecting video…</span></div></div><div id="tablet-video-self" class="tablet-video-self"><img id="tablet-video-self-frame" alt=""><span>You</span></div><div class="tablet-video-call-overlay"><div class="tablet-video-call-person"><strong>${escapeHtml(who)}</strong><small>${escapeHtml(c.otherNumber||'')} • Connected</small></div><div class="tablet-video-controls"><button class="secondary-btn" id="video-call-flip">Flip Camera</button>${c.recorded?'<button class="secondary-btn" id="call-record">Stop Recording</button>':'<button class="secondary-btn" id="call-record">Record</button>'}<button class="danger-btn" id="call-end">End Call</button></div></div></div>`;
  }
  return `<div class="call-card ${incoming?'incoming':''}"><div><span>${escapeHtml(cs.phase.toUpperCase())}${c.video?' • VIDEO':''}</span><strong>${escapeHtml(c.otherName||c.otherNumber||'Unknown')}</strong><small>${escapeHtml(c.otherNumber||'')}</small></div><div class="button-row">${incoming?`<button class="primary-btn" id="call-answer">Answer</button><button class="danger-btn" id="call-decline">Decline</button>`:`<button class="danger-btn" id="call-end">End Call</button>`}${cs.phase==='connected'?`<button class="secondary-btn" id="call-record">${c.recorded?'Stop Recording':'Record'}</button>`:''}</div></div>`;
}
async function renderCallApp(el,video=false){
 const renderApp=video?'videocall':'phone';if(!renderApp||state.activeApp!==renderApp)return;const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;const isCurrentRender=()=>state.activeApp===renderApp&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const data=await phoneRequest('getAppData',{});if(!isCurrentRender())return;const calls=data?.ok?(data.data?.calls||[]):[];
  const liveVideo=video&&state.callState?.call?.video===true&&state.callState?.phase==='connected';
  el.classList.toggle('video-call-live',liveVideo);
  if(liveVideo){
    el.innerHTML=callPanel(true);
  }else{
    el.innerHTML=appHero(video?'Video Call':'Tablet Calls',video?'Large remote video with a private self preview. Live frames are temporary and never enter Gallery.':'Dial players through the same pma-voice call backend as RS Tablet.')+providerBanner(data?.ok===true)+callPanel(video)+
    `<div class="dial-pad"><input id="dial-number" class="text-input" placeholder="Contact number" inputmode="numeric"><button id="dial-call" class="primary-btn">${video?'Video Call':'Call'}</button></div><div class="section-label">RECENTS</div><div class="data-list">${calls.length?calls.map(c=>`<div class="list-row"><span class="badge">${escapeHtml(String(c.call_type||'voice').toUpperCase())}</span><div class="grow"><strong>${escapeHtml(c.display_name||c.other_name||c.other_number||c.receiver_number||c.caller_number||'Call')}</strong><small>${escapeHtml(String(c.status||''))} • ${escapeHtml(fmtDate(c.started_at))}</small></div><button class="secondary-btn redial" data-num="${escapeHtml(c.other_number||c.receiver_number||c.caller_number||'')}">Call</button></div>`).join(''):'<div class="empty-state">No call history.</div>'}</div>`;
  }
  if($('#dial-call'))$('#dial-call').onclick=async()=>{const number=$('#dial-number').value.trim();if(!number)return;const r=await phoneRequest('startCall',{number,video});if(!r?.ok)toast('Tablet',r?.error||'Call failed.','error');};
  $$('.redial').forEach(b=>b.onclick=async()=>{const r=await phoneRequest('startCall',{number:b.dataset.num,video});if(!r?.ok)toast('Tablet',r?.error||'Call failed.','error');});
  if($('#call-answer'))$('#call-answer').onclick=()=>phoneRequest('answerCall',{callId:state.callState?.call?.callId});
  if($('#call-decline'))$('#call-decline').onclick=()=>phoneRequest('declineCall',{callId:state.callState?.call?.callId});
  if($('#call-end'))$('#call-end').onclick=()=>phoneRequest('endCall',{callId:state.callState?.call?.callId});
  if($('#call-record'))$('#call-record').onclick=async()=>{const c=state.callState?.call||{};const r=await phoneRequest('recordCall',{callId:c.callId,recording:!c.recorded});if(!r?.ok)toast('Tablet',r?.error||'Recording toggle failed.','error');};
  if($('#video-call-flip'))$('#video-call-flip').onclick=async()=>{const r=await nui('tabletVideoCallFlip',{});toast('Video Call',r?.ok?(r.front===false?'Rear camera':'Front camera'):(r?.error||'Camera unavailable'),r?.ok?'inform':'error');};
}
appRenderers.phone=el=>renderCallApp(el,false);appRenderers.videocall=el=>renderCallApp(el,true);

async function renderMessagesApp(el,skin='messages'){
 const renderApp=skin==='survivorchat'?'survivorchat':'messages';if(!renderApp||state.activeApp!==renderApp)return;const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;const isCurrentRender=()=>state.activeApp===renderApp&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const list=await phoneRequest('getAppData',{});if(!isCurrentRender())return;if(!list?.ok){el.innerHTML=appHero(skin==='survivorchat'?'Chat':'Messages','RS Tablet conversations.')+providerBanner(false);return;}
  const convs=list.data?.conversations||[]; const active=state.activeConversation;
  el.innerHTML=appHero(skin==='survivorchat'?'Chat':'Messages','Live RS Tablet conversations, attachments and shared locations.')+providerBanner(true)+
  `<div class="message-layout"><aside class="conversation-list"><div class="message-new"><input id="new-msg-number" class="text-input" placeholder="New number"><button id="new-msg-start" class="primary-btn">New</button></div>${convs.map(c=>`<button class="conversation-row ${active?.conversation_id===c.conversation_id?'active':''}" data-cid="${escapeHtml(c.conversation_id)}"><strong>${escapeHtml(c.display_name||c.title||c.peer_number||'Conversation')}</strong><span>${escapeHtml(c.last_message||'')}</span><small>${c.unread?`${c.unread} unread • `:''}${escapeHtml(fmtDate(c.last_time))}</small></button>`).join('')}</aside><section id="conversation-pane" class="conversation-pane">${active?renderConversationMarkup(active):'<div class="empty-state">Choose a conversation or start a new message.</div>'}</section></div>`;
  $$('.conversation-row').forEach(b=>b.onclick=async()=>{const r=await phoneRequest('getConversation',{conversationId:b.dataset.cid});if(r?.ok){state.activeConversation=r.data;renderMessagesApp(el,skin);}else toast('Messages',r?.error||'Conversation unavailable.','error');});
  $('#new-msg-start').onclick=()=>{state.activeConversation={newRecipient:$('#new-msg-number').value.trim(),title:'New Message',messages:[]};renderMessagesApp(el,skin);};
  bindConversationActions(el,skin);
}
function renderConversationMarkup(c){
  const msgs=Array.isArray(c.messages)?c.messages:[];
  return `<div class="conversation-head"><div><strong>${escapeHtml(c.title||c.peer_number||c.newRecipient||'New Message')}</strong><small>${escapeHtml(c.peer_number||c.newRecipient||'')}</small></div></div><div class="message-thread">${msgs.length?msgs.map(m=>`<div class="message-bubble"><small>${escapeHtml(m.sender_number||'')}</small><p>${escapeHtml(m.body||'')}</p>${m.media_url?`<span class="attachment-chip">MEDIA</span>`:''}${m.message_type==='location'?'<span class="attachment-chip">LOCATION</span>':''}<time>${escapeHtml(fmtDate(m.sent_at))}</time></div>`).join(''):'<div class="empty-state">No messages yet.</div>'}</div><div class="message-compose"><textarea id="conversation-message" class="text-input" placeholder="Message"></textarea><select id="conversation-media" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="share-location" class="secondary-btn">Share Location</button><button id="send-conversation" class="primary-btn">Send</button></div>`;
}
function bindConversationActions(el,skin){
  const c=state.activeConversation;if(!c||!$('#send-conversation'))return;
  $('#send-conversation').onclick=async()=>{const body=$('#conversation-message').value.trim(),mediaUrl=$('#conversation-media').value;const payload={body,mediaUrl};if(c.conversation_id)payload.conversationId=c.conversation_id;else payload.recipientNumber=c.newRecipient;if(!body&&!mediaUrl)return;const r=await phoneRequest('sendMessage',payload);if(!r?.ok)return toast('Messages',r?.error||'Send failed.','error');const cid=r.data?.conversation?.conversation_id||r.data?.conversationId||c.conversation_id;if(cid){const fresh=await phoneRequest('getConversation',{conversationId:cid});if(fresh?.ok)state.activeConversation=fresh.data;}renderMessagesApp(el,skin);};
  $('#share-location').onclick=async()=>{const payload=c.conversation_id?{conversationId:c.conversation_id}:{recipientNumber:c.newRecipient};const r=await phoneRequest('shareLocation',payload);if(!r?.ok)return toast('Messages',r?.error||'Could not share location.','error');toast('Messages','Location shared.','inform');};
}
appRenderers.messages=el=>renderMessagesApp(el,'messages');appRenderers.survivorchat=el=>renderMessagesApp(el,'survivorchat');

appRenderers.contacts=async el=>{if(state.activeApp!=='contacts')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='contacts'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getAppData',{});if(!isCurrentRender())return;const rows=r?.data?.contacts||[];
  el.innerHTML=appHero('Contacts','Synced RS Tablet address book.')+providerBanner(r?.ok===true)+`<div class="form-row"><input id="contact-name2" class="text-input" placeholder="Name"><input id="contact-num2" class="text-input" placeholder="Number"><button id="contact-add2" class="primary-btn">Add</button></div><div class="data-list" style="margin-top:12px">${rows.map(c=>`<div class="list-row"><div class="avatar-dot">${escapeHtml(String(c.display_name||'?').slice(0,1).toUpperCase())}</div><div class="grow"><strong>${escapeHtml(c.display_name||c.contact_number)}</strong><small>${escapeHtml(c.contact_number||'')}</small></div><button class="secondary-btn contact-call" data-num="${escapeHtml(c.contact_number||'')}">Call</button><button class="danger-btn contact-del" data-num="${escapeHtml(c.contact_number||'')}">Delete</button></div>`).join('')||'<div class="empty-state">No contacts.</div>'}</div>`;
  $('#contact-add2').onclick=async()=>{const x=await phoneRequest('addContact',{name:$('#contact-name2').value.trim(),number:$('#contact-num2').value.trim()});if(x?.ok)appRenderers.contacts(el);else toast('Contacts',x?.error||'Could not save.','error');};
  $$('.contact-call').forEach(b=>b.onclick=()=>phoneRequest('startCall',{number:b.dataset.num,video:false}));
  $$('.contact-del').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this contact?'))return;const x=await phoneRequest('deleteContact',{number:b.dataset.num,contactNumber:b.dataset.num});if(x?.ok)appRenderers.contacts(el);else toast('Contacts',x?.error||'Delete failed.','error');});
};

appRenderers.email=async el=>{if(state.activeApp!=='email')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='email'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getEmails',{folder:emailFolder});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Email','RS Tablet mail.')+providerBanner(false);return;}
  const emails=r.data?.emails||[];
  el.innerHTML=appHero('Email',`${r.data?.address||''} • ${r.data?.unread||0} unread`, `<button id="email-compose-toggle" class="primary-btn">Compose</button>`)+providerBanner(true)+
  (currentEmail?`<div class="email-reader"><div class="email-reader-head"><button id="email-reader-back" class="secondary-btn">Back</button><button id="email-reader-delete" class="danger-btn">Delete</button></div><h2>${escapeHtml(currentEmail.subject||'No subject')}</h2><small>${escapeHtml(currentEmail.sender_name||currentEmail.sender_address||'')} → ${escapeHtml(currentEmail.recipient_address||'')}</small><p>${escapeHtml(currentEmail.body||'').replace(/\n/g,'<br>')}</p></div>`:'')+
  `<div id="email-compose" class="compose-panel hidden"><div class="form-grid"><input id="email-to" class="text-input" placeholder="Number or email"><input id="email-subject" class="text-input" placeholder="Subject"><textarea id="email-body" class="textarea compact" placeholder="Message"></textarea><select id="email-media" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="email-send" class="primary-btn">Send Email</button></div></div><div class="segmented"><button data-folder="inbox" class="${emailFolder==='inbox'?'active':''}">Inbox</button><button data-folder="sent" class="${emailFolder==='sent'?'active':''}">Sent</button></div><div class="data-list">${emails.map(m=>`<button class="email-row" data-eid="${escapeHtml(m.email_id)}"><div><strong>${escapeHtml(emailFolder==='inbox'?(m.sender_name||m.sender_address):(m.recipient_address||''))}</strong><span>${escapeHtml(m.subject||'No subject')}</span><small>${escapeHtml(m.preview||m.body||'').slice(0,120)}</small></div><time>${escapeHtml(fmtDate(m.sent_at))}</time></button>`).join('')||'<div class="empty-state">Mailbox is empty.</div>'}</div>`;
  $('#email-compose-toggle').onclick=()=>$('#email-compose').classList.toggle('hidden');$$('[data-folder]').forEach(b=>b.onclick=()=>{emailFolder=b.dataset.folder;currentEmail=null;appRenderers.email(el);});
  $$('.email-row').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('getEmail',{emailId:b.dataset.eid});if(x?.ok){currentEmail=x.data?.email;appRenderers.email(el);}});
  if($('#email-reader-back'))$('#email-reader-back').onclick=()=>{currentEmail=null;appRenderers.email(el);};
  if($('#email-reader-delete'))$('#email-reader-delete').onclick=async()=>{const x=await phoneRequest('deleteEmail',{emailId:currentEmail.email_id,folder:currentEmail.folder||emailFolder});if(x?.ok){currentEmail=null;appRenderers.email(el);}};
  $('#email-send').onclick=async()=>{const x=await phoneRequest('sendEmail',{to:$('#email-to').value.trim(),subject:$('#email-subject').value.trim(),body:$('#email-body').value.trim(),mediaUrl:$('#email-media').value});if(x?.ok){toast('Email','Sent.','inform');emailFolder='sent';appRenderers.email(el);}else toast('Email',x?.error||'Could not send.','error');};
};

appRenderers.community=async el=>{if(state.activeApp!=='community')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='community'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [r]=await Promise.all([phoneRequest('getTweets',{}),getPhoneBootstrap()]);if(!isCurrentRender())return;
  if(!r?.ok){el.innerHTML=appHero('Community','Citywide social feed.')+providerBanner(false);return;}state.communityData=r.data;
  const hidden=tabletPhoneSettingIds('hiddenCommunityPosts');
  const tweets=(r.data?.tweets||[]).filter(t=>!hidden.has(String(t.tweet_id||'')));
  const restore=hidden.size?`<button id="community-restore-hidden" class="secondary-btn">Restore ${hidden.size} Removed</button>`:'';
  el.innerHTML=appHero('Community','Post, attach media, like and reply using the same feed as RS Tablet.',restore)+providerBanner(true)+`<div class="community-compose"><textarea id="community-body2" class="text-input" maxlength="280" placeholder="What is happening in Los Santos?"></textarea><select id="community-media2" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="community-post2" class="primary-btn">Post</button></div><div class="community-feed">${tweets.map(t=>`<article class="feed-card"><header><div><strong>${escapeHtml(t.author_name||'Citizen')}</strong><small>${escapeHtml(t.handle||'')} • ${escapeHtml(fmtDate(t.created_at))}</small></div>${t.is_mine?`<button class="danger-btn community-delete" data-id="${escapeHtml(t.tweet_id)}">Delete for Everyone</button>`:''}</header><p>${escapeHtml(t.body||'')}</p>${t.media_url?`<div class="feed-media-chip">Attached media</div>`:''}<footer><button class="secondary-btn community-like" data-id="${escapeHtml(t.tweet_id)}">${t.liked_by_me?'♥':'♡'} ${Number(t.like_count)||0}</button><button class="secondary-btn community-reply" data-id="${escapeHtml(t.tweet_id)}">Reply</button><button class="secondary-btn community-thread" data-id="${escapeHtml(t.tweet_id)}">Thread</button><button class="secondary-btn community-remove" data-id="${escapeHtml(t.tweet_id)}">Remove from My Tablet</button></footer><div class="thread-host" id="thread-${escapeHtml(t.tweet_id)}"></div></article>`).join('')||'<div class="empty-state">No community posts yet.</div>'}</div>`;
  $('#community-post2').onclick=async()=>{const x=await phoneRequest('postTweet',{body:$('#community-body2').value.trim(),mediaUrl:$('#community-media2').value});if(x?.ok){state.communityData=x.data;appRenderers.community(el);}else toast('Community',x?.error||'Post failed.','error');};
  $$('.community-like').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('likeTweet',{tweetId:b.dataset.id});if(x?.ok)appRenderers.community(el);});
  $$('.community-remove').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this post only from your tablet feed? Other players will still see it.'))return;const x=await removeSharedPhoneItem('hiddenCommunityPosts',b.dataset.id);if(x?.ok){toast('Community','Removed only from your devices.','inform');appRenderers.community(el);}else toast('Community',x?.error||'Could not remove post.','error');});
  $$('.community-delete').forEach(b=>b.onclick=async()=>{if(!confirm('Delete your post for EVERYONE? Use Remove from My Tablet if you only want it gone from your devices.'))return;const x=await phoneRequest('deleteTweet',{tweetId:b.dataset.id});if(x?.ok)appRenderers.community(el);else toast('Community',x?.error||'Delete failed.','error');});
  if($('#community-restore-hidden'))$('#community-restore-hidden').onclick=async()=>{const x=await restoreSharedPhoneItems('hiddenCommunityPosts');if(x?.ok)appRenderers.community(el);};
  $$('.community-reply').forEach(b=>b.onclick=async()=>{const body=prompt('Reply');if(!body)return;const x=await phoneRequest('postContentReply',{parentType:PHONE_COMMUNITY_PARENT,parentId:b.dataset.id,body});if(!x?.ok)toast('Community',x?.error||'Reply failed.','error');else toast('Community','Reply posted.','inform');});
  $$('.community-thread').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('getContentReplies',{parentType:PHONE_COMMUNITY_PARENT,parentId:b.dataset.id});const h=$(`#thread-${CSS.escape(b.dataset.id)}`);if(!x?.ok)return;h.innerHTML=(x.data?.replies||[]).map(q=>`<div class="thread-reply"><b>${escapeHtml(q.author_name||'Citizen')}</b><span>${escapeHtml(q.body||'')}</span></div>`).join('')||'<div class="empty-state">No replies.</div>';});
};

appRenderers.bank=async el=>{if(state.activeApp!=='bank')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='bank'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [r,boot]=await Promise.all([phoneRequest('getBank',{}),getPhoneBootstrap()]);if(!isCurrentRender())return;
  if(!r?.ok){el.innerHTML=appHero('Bank','Live account data.')+providerBanner(false);return;}state.bankData=r.data;renderBankData(el,boot?.ok===true);
};
function renderBankData(el,phoneOnline=true){
  const d=state.bankData||{},tx=d.transactions||[],theme=tabletBankTheme(),cardMeta=TABLET_BANK_CARD_THEMES[theme]||TABLET_BANK_CARD_THEMES.fleeca;
  const number=String(state.phoneBootstrap?.sim?.phone_number||'0000');
  const holder=String(state.phoneBootstrap?.owner?.name||state.profile?.name||'Card Holder');
  const total=(Number(d.bank)||0)+(Number(d.cash)||0);
  el.innerHTML=appHero('Bank','Your cards, balances and recent activity.')+providerBanner(phoneOnline)+
    `<section class="tablet-bank-card bank-card-${theme}" id="tablet-bank-card"><i class="tablet-bank-sheen"></i><header><strong id="tablet-bank-brand">${escapeHtml(cardMeta.label)}</strong><span>${escapeHtml(cardMeta.badge)}</span></header><div class="tablet-bank-card-mid"><i class="tablet-bank-chip"></i><b>◔</b></div><div class="tablet-bank-number">•••• •••• •••• ${escapeHtml(number.slice(-4).padStart(4,'0'))}</div><footer><div><small>CARD HOLDER</small><strong>${escapeHtml(holder)}</strong></div><div><small>AVAILABLE</small><strong>${fmtMoney(d.bank)}</strong></div></footer></section>`+
    `<div class="tablet-bank-theme-row">${Object.keys(TABLET_BANK_CARD_THEMES).map(id=>`<button class="secondary-btn tablet-bank-theme ${id===theme?'active':''}" data-theme="${id}">${escapeHtml(id[0].toUpperCase()+id.slice(1))}</button>`).join('')}</div>`+
    `<div class="bank-balance-grid tablet-bank-balances"><div class="bank-primary-balance"><span>BANK</span><strong>${fmtMoney(d.bank)}</strong></div><div><span>CASH</span><strong>${fmtMoney(d.cash)}</strong></div><div><span>TOTAL</span><strong>${fmtMoney(total)}</strong></div></div>`+
    `<div class="bank-actions"><div class="card"><h3>Move money</h3><div class="form-row"><input id="bank-amount2" class="text-input" type="number" min="1" placeholder="Amount"><button id="bank-deposit2" class="primary-btn">Deposit</button><button id="bank-withdraw2" class="secondary-btn">Withdraw</button></div></div><div class="card"><h3>Transfer</h3><div class="form-grid two"><input id="bank-number2" class="text-input" placeholder="Contact number"><input id="bank-transfer-amount2" class="text-input" type="number" min="1" placeholder="Amount"><input id="bank-note2" class="text-input span2" placeholder="Note"><button id="bank-transfer2" class="primary-btn span2">Send Transfer</button></div></div></div><div class="section-label">TRANSACTIONS</div><div class="transaction-list">${tx.map(t=>`<div class="transaction-row"><div><strong>${escapeHtml(t.label||t.kind||'Transaction')}</strong><small>${escapeHtml(t.counterparty||'')} ${escapeHtml(fmtDate(t.created_at))}</small></div><b class="${String(t.kind||'').includes('in')||t.kind==='deposit'?'positive':''}">${String(t.kind||'').includes('out')||['payment','withdraw'].includes(t.kind)?'-':'+'}${fmtMoney(t.amount)}</b></div>`).join('')||'<div class="empty-state">No transactions.</div>'}</div>`;
  const move=async action=>{const amount=Number($('#bank-amount2').value);const x=await phoneRequest(action,{amount});if(x?.ok){state.bankData={...d,...x.data};renderBankData(el,phoneOnline);}else toast('Bank',x?.error||'Transaction failed.','error');};
  $('#bank-deposit2').onclick=()=>move('bankDeposit');$('#bank-withdraw2').onclick=()=>move('bankWithdraw');
  $('#bank-transfer2').onclick=async()=>{const x=await phoneRequest('bankTransfer',{number:$('#bank-number2').value.trim(),amount:Number($('#bank-transfer-amount2').value),note:$('#bank-note2').value.trim()});if(x?.ok){state.bankData={...d,...x.data};renderBankData(el,phoneOnline);}else toast('Bank',x?.error||'Transfer failed.','error');};
  $$('.tablet-bank-theme').forEach(b=>b.onclick=async()=>{const x=await patchSharedPhoneSettings({bankCardTheme:b.dataset.theme});if(x?.ok){renderBankData(el,phoneOnline);toast('Bank','Debit card design saved across your linked devices.','inform');}else toast('Bank',x?.error||'Could not save card design.','error');});
}

function vehicleLabel(v){return v.label||v.fullname||v.vehicle||v.model||v.plate||'Vehicle';}
function extractCoords(r){const d=r?.data||r||{};const c=d.coords||d.location||d;return Number.isFinite(Number(c?.x))&&Number.isFinite(Number(c?.y))?{x:Number(c.x),y:Number(c.y),z:Number(c.z)||0}:null;}
function tabletVehicleImageModels(v){
  const seen=new Set();
  [v?.imageModel,v?.spawnName,v?.spawncode,v?.vehicle,v?.model,v?.displayModel].forEach(raw=>{const model=String(raw||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');if(model)seen.add(model);});
  return [...seen];
}
function tabletVehicleImageCandidates(v){return ['assets/vehicles/sultan.webp'];}
function vehiclePhotoMarkup(v,index){
  const candidates=tabletVehicleImageCandidates(v);const first=candidates.shift()||'';
  if(!first)return `<div class="tablet-vehicle-photo fallback"><span>NO VEHICLE IMAGE</span></div>`;
  return `<div class="tablet-vehicle-photo"><img data-vehicle-photo="${index}" data-fallbacks="${escapeHtml(JSON.stringify(candidates))}" src="${escapeHtml(first)}" alt="${escapeHtml(vehicleLabel(v))}"><span>VEHICLE IMAGE</span></div>`;
}
function wireVehiclePhotos(root){
  $$('img[data-vehicle-photo]',root).forEach(img=>img.addEventListener('error',()=>{let rest=[];try{rest=JSON.parse(img.dataset.fallbacks||'[]')}catch(_){rest=[]}const next=rest.shift();if(next){img.dataset.fallbacks=JSON.stringify(rest);img.src=next;return;}const host=img.closest('.tablet-vehicle-photo');if(host)host.classList.add('fallback');img.remove();}));
}
appRenderers.garage=async el=>{if(state.activeApp!=='garage')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='garage'&&el._rsRenderTicket===renderTicket&&el.isConnected;
const r=await phoneRequest('getGarage',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Garage','Owned vehicles and connected garage actions.')+providerBanner(false);return;}state.garageData=r.data;renderGarageData(el);};
function renderGarageData(el){
  const d=state.garageData||{},vehicles=d.vehicles||[],actions=d.actions||{};
  el.innerHTML=appHero('Garage',d.linked?`Connected to ${d.provider||'garage provider'}.`:'Read-only framework vehicle list.',`<button id="garage-refresh2" class="secondary-btn">Refresh</button>`)+providerBanner(true)+
    `<div class="garage-grid">${vehicles.map((v,i)=>`<article class="vehicle-card">${vehiclePhotoMarkup(v,i)}<header><div><strong>${escapeHtml(vehicleLabel(v))}</strong><small>${escapeHtml(v.plate||'NO PLATE')} • ${escapeHtml(v.garage||v.location||v.state||'Unknown')}</small></div>${v.favorite?'<span class="badge">FAVORITE</span>':''}</header><div class="vehicle-stats"><span>Fuel <b>${Math.round(Number(v.fuel)||0)}%</b></span><span>Engine <b>${Math.round(Number(v.engineHealth||v.engine)||0)}</b></span><span>Body <b>${Math.round(Number(v.bodyHealth||v.body)||0)}</b></span></div><div class="vehicle-actions">${['retrieve','park','deliver','track','recover','favorite','rename','key','alert','transfer','sell'].filter(a=>actions[a]===true).map(a=>`<button class="${a==='sell'?'danger-btn':'secondary-btn'} garage-action" data-i="${i}" data-action="${a}">${escapeHtml(a.toUpperCase())}</button>`).join('')}</div></article>`).join('')||'<div class="empty-state wide">No owned vehicles.</div>'}</div>`;
  wireVehiclePhotos(el);
  $('#garage-refresh2').onclick=()=>appRenderers.garage(el);
  $$('.garage-action').forEach(b=>b.onclick=async()=>{const v=vehicles[Number(b.dataset.i)],action=b.dataset.action,data={...v,plate:v.plate};if(action==='rename'){const alias=prompt('Vehicle name',v.alias||'');if(alias===null)return;data.alias=alias;}if(action==='transfer'){const targetId=Number(prompt('Target server ID'));if(!targetId)return;const price=Number(prompt('Sale price (0 = gift)','0'))||0;data.targetId=targetId;data.price=price;data.mode='garage';}if(action==='sell'&&!confirm(`Sell ${vehicleLabel(v)}?`))return;const x=await phoneRequest('garageAction',{action,data});if(!x?.ok)return toast('Garage',x?.error||`${action} failed.`,'error');const coords=extractCoords(x);if(action==='track'&&coords){await nui('setWaypoint',coords);toast('Garage','Vehicle waypoint set.','inform');}else toast('Garage',`${action} complete.`,'inform');appRenderers.garage(el);});
}
appRenderers.maps=async el=>{if(state.activeApp!=='maps')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='maps'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const recon=await rpc('recon.list',{});if(!isCurrentRender())return;state.reconCameras=recon?.ok&&Array.isArray(recon.data)?recon.data:[];
  const ok=await loadTabletMap(!state.mapBase);if(!isCurrentRender())return;
  if(!ok){el.innerHTML=appHero('Maps','RS Tablet live map and GTA GPS.')+providerBanner(false);return;}
  renderTabletMap(el);
  if(mapRefreshTimer)clearInterval(mapRefreshTimer);
  mapRefreshTimer=setInterval(async()=>{
    if(state.activeApp!=='maps'){clearInterval(mapRefreshTimer);mapRefreshTimer=null;return;}
    await loadTabletMap(false);renderMapPins();renderMapNearby();
  },8000);
};
function mapPinMarkup(p,kind,label){if(!p)return '';const xy=mapXY(p.x,p.y,state.mapBase?.bounds);if(!Number.isFinite(xy.left)||!Number.isFinite(xy.top))return '';if(xy.left<0||xy.left>100||xy.top<0||xy.top>100)return '';return `<button class="map-pin ${kind}" style="left:${xy.left}%;top:${xy.top}%" data-x="${Number(p.x)||0}" data-y="${Number(p.y)||0}" title="${escapeHtml(label)}"><span></span><b>${escapeHtml(label)}</b></button>`;}
function renderMapPins(){
  const host=$('#map-pins');if(!host)return;const d=state.mapData||{};let html=mapPinMarkup(d.own,'own','YOU');
  (d.friends||[]).forEach(f=>html+=mapPinMarkup(f,'friend',f.name||f.number||'Friend'));
  (d.signals||[]).forEach(s=>{const c=s.coords||s;html+=mapPinMarkup(c,'signal',s.name||s.sender_name||s.sender_number||'SOS');});
  (state.reconCameras||[]).forEach(c=>{if(c.coords)html+=mapPinMarkup(c.coords,'recon',`RECON: ${c.label||c.cameraId}`);});
  mapPlaces().slice(0,100).forEach(p=>html+=mapPinMarkup(p,'place',p.label||p.name||p.category||'Place'));
  host.innerHTML=html;
  $$('.map-pin').forEach(p=>p.onclick=async e=>{e.stopPropagation();await nui('setWaypoint',{x:Number(p.dataset.x),y:Number(p.dataset.y)});toast('Maps',`${p.title} routed to GPS.`,'inform');});
}
function renderMapNearby(){
  const host=$('#map-nearby2');if(!host)return;const rows=mapPlaces().slice(0,14);
  host.innerHTML=rows.map((p,i)=>`<div class="map-nearby-row"><span class="badge">${escapeHtml(String(p.category||'place').toUpperCase())}</span><div><strong>${escapeHtml(p.label||p.name||`Place ${i+1}`)}</strong><small>${p.distance!=null?`${Math.round(Number(p.distance)||0)}m • `:''}${escapeHtml(p.postal?`Postal ${p.postal}`:'')}</small></div><button class="secondary-btn map-nearby-gps" data-x="${Number(p.x)||0}" data-y="${Number(p.y)||0}">GPS</button></div>`).join('')||'<div class="empty-state">No nearby places in this category.</div>';
  $$('.map-nearby-gps').forEach(b=>b.onclick=()=>nui('setWaypoint',{x:Number(b.dataset.x),y:Number(b.dataset.y)}));
}
function renderTabletMap(el){
  const d=state.mapData||{},postal=d.postal;
  el.innerHTML=appHero('Maps',`Los Santos${postal?.code?` · Postal ${postal.code}`:''}`,`<button id="maps-work2" class="secondary-btn">Work / Jobs</button>`)+providerBanner(true)+
    `<div class="map-tools"><input id="postal-search" class="text-input" placeholder="Postal code"><button id="postal-go" class="primary-btn">Route Postal</button><input id="map-x2" class="text-input" placeholder="X"><input id="map-y2" class="text-input" placeholder="Y"><button id="coords-go2" class="secondary-btn">Route Coords</button></div>`+
    `<div class="map-category-row">${MAP_CATEGORIES.map(c=>`<button class="secondary-btn map-cat ${mapCategory===c?'active':''}" data-cat="${c}">${MAP_CATEGORY_LABELS[c]}</button>`).join('')}</div>`+
    `<div id="tablet-map-viewport" class="tablet-map-viewport"><div id="tablet-map-world" class="tablet-map-world"><img src="img/map.webp" draggable="false" alt="Los Santos map"><div id="map-pins" class="map-pins"></div></div><div class="map-hud"><span>Wheel to zoom • drag to pan</span><button id="map-reset" class="secondary-btn">Reset</button></div></div>`+
    `<div class="form-row" style="margin-top:9px"><input id="map-share-number" class="text-input" placeholder="Share my live location with contact number"><button id="map-share2" class="secondary-btn">Share Location</button></div>`+
    `<div class="section-label">NEARBY PLACES</div><div id="map-nearby2" class="map-nearby-list"></div>`;
  renderMapPins();renderMapNearby();
  $('#maps-work2').onclick=()=>openApp('work');
  const world=$('#tablet-map-world'),view=$('#tablet-map-viewport');
  const apply=()=>{world.style.transform=`translate(${state.mapPan.x}px,${state.mapPan.y}px) scale(${state.mapZoom})`;};apply();
  view.addEventListener('wheel',e=>{e.preventDefault();state.mapZoom=Math.max(1,Math.min(3.5,state.mapZoom+(e.deltaY<0?.2:-.2)));apply();},{passive:false});
  view.onpointerdown=e=>{if(e.target.closest('.map-pin'))return;state.mapDragging={x:e.clientX,y:e.clientY,px:state.mapPan.x,py:state.mapPan.y};view.setPointerCapture(e.pointerId);};
  view.onpointermove=e=>{if(!state.mapDragging)return;state.mapPan.x=state.mapDragging.px+(e.clientX-state.mapDragging.x);state.mapPan.y=state.mapDragging.py+(e.clientY-state.mapDragging.y);apply();};
  view.onpointerup=()=>state.mapDragging=null;view.onpointercancel=()=>state.mapDragging=null;
  $('#map-reset').onclick=()=>{state.mapZoom=1;state.mapPan={x:0,y:0};apply();};
  $('#coords-go2').onclick=()=>{const x=Number($('#map-x2').value),y=Number($('#map-y2').value);if(!Number.isFinite(x)||!Number.isFinite(y))return toast('Maps','Enter valid X and Y coordinates.','error');nui('setWaypoint',{x,y});};
  $('#postal-go').onclick=()=>{const q=$('#postal-search').value.trim().toLowerCase();const p=(state.mapBase?.postals||[]).find(x=>String(x.code||x.postal||x.id||'').toLowerCase()===q);if(!p)return toast('Maps','Postal not found.','error');nui('setWaypoint',{x:Number(p.x),y:Number(p.y)});toast('Maps',`Routing to postal ${q}.`,'inform');};
  $$('.map-cat').forEach(b=>b.onclick=()=>{mapCategory=b.dataset.cat||'all';$$('.map-cat').forEach(x=>x.classList.toggle('active',x===b));renderMapPins();renderMapNearby();});
  $('#map-share2').onclick=async()=>{const number=$('#map-share-number').value.trim();if(!number)return toast('Maps','Enter a contact number.','error');const r=await phoneRequest('shareLocation',{recipientNumber:number});if(r?.ok){toast('Maps','Current location shared in Messages.','inform');$('#map-share-number').value='';}else toast('Maps',r?.error||'Could not share location.','error');};
}

appRenderers.reminders=async el=>{if(state.activeApp!=='reminders')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='reminders'&&el._rsRenderTicket===renderTicket&&el.isConnected;
const r=await phoneRequest('getReminders',{});if(!isCurrentRender())return;const rows=r?.data?.reminders||[];el.innerHTML=appHero('Reminders','Synced task list from RS Tablet.')+providerBanner(r?.ok===true)+`<div class="form-row"><input id="reminder-text2" class="text-input" placeholder="Reminder"><input id="reminder-folder2" class="text-input" placeholder="Folder" value="General"><button id="reminder-add2" class="primary-btn">Add</button></div><div class="reminder-list">${rows.map(x=>`<div class="list-row ${Number(x.is_done)===1?'done':''}"><button class="reminder-check secondary-btn" data-id="${escapeHtml(x.reminder_id)}">${Number(x.is_done)===1?'✓':'○'}</button><div class="grow"><strong>${escapeHtml(x.text||'')}</strong><small>${escapeHtml(x.folder||'General')} • ${escapeHtml(fmtDate(x.created_at))}</small></div><button class="danger-btn reminder-del" data-id="${escapeHtml(x.reminder_id)}">Delete</button></div>`).join('')||'<div class="empty-state">No reminders.</div>'}</div>`;$('#reminder-add2').onclick=async()=>{const x=await phoneRequest('saveReminder',{text:$('#reminder-text2').value.trim(),folder:$('#reminder-folder2').value.trim()});if(x?.ok)appRenderers.reminders(el);else toast('Reminders',x?.error||'Could not save.','error');};$$('.reminder-check').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('toggleReminder',{reminderId:b.dataset.id});if(x?.ok)appRenderers.reminders(el);});$$('.reminder-del').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('deleteReminder',{reminderId:b.dataset.id});if(x?.ok)appRenderers.reminders(el);});};

appRenderers.taxi=async el=>{if(state.activeApp!=='taxi')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='taxi'&&el._rsRenderTicket===renderTicket&&el.isConnected;
const places=await phoneRequest('getNearbyPlaces',{});if(!isCurrentRender())return;el.innerHTML=appHero('Taxi','Request a player or NPC taxi to your GTA waypoint.')+providerBanner(places?.ok===true)+`<div class="cards">${card('Destination','<p>Set a waypoint in GTA or the tablet Maps app, then request a ride.</p><button id="taxi-request2" class="primary-btn">Request Taxi</button>')}${card('Nearby',`<div class="data-list">${(places?.data?.places||[]).slice(0,8).map(phoneRowCard).join('')||'<div class="empty-state">No nearby directory data.</div>'}</div>`)}</div>`;$('#taxi-request2').onclick=async()=>{const wp=await rpc('maps.currentWaypoint');if(!wp?.ok)return toast('Taxi','Set a GPS waypoint first.','error');const r=await phoneRequest('requestTaxi',{destination:wp.data});if(r?.ok)toast('Taxi','Ride request sent.','inform');else toast('Taxi',r?.error||'Taxi request failed.','error');};};

appRenderers.houses=async el=>{if(state.activeApp!=='houses')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='houses'&&el._rsRenderTicket===renderTicket&&el.isConnected;
const r=await phoneRequest('getHouses',{});if(!isCurrentRender())return;const d=r?.data||{},rows=d.listings||[];el.innerHTML=appHero('Houses','Live property listings and owned homes.')+providerBanner(r?.ok===true)+`<div class="property-grid">${rows.map((h,i)=>`<article class="property-card"><header><div><strong>${escapeHtml(h.title||h.label||`Property ${i+1}`)}</strong><small>${escapeHtml(h.location||'')} ${h.distance?`• ${h.distance}m`:''}</small></div><b>${h.price?fmtMoney(h.price):h.owned?'OWNED':'LISTING'}</b></header><div class="button-row">${h.x&&h.y?`<button class="secondary-btn house-route" data-i="${i}">Route</button>`:''}${Object.keys(d.actions||{}).filter(a=>d.actions[a]===true).map(a=>`<button class="secondary-btn house-action" data-i="${i}" data-action="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('')}</div></article>`).join('')||'<div class="empty-state wide">No properties available.</div>'}</div>`;$$('.house-route').forEach(b=>b.onclick=()=>{const h=rows[Number(b.dataset.i)];nui('setWaypoint',{x:Number(h.x),y:Number(h.y)});});$$('.house-action').forEach(b=>b.onclick=async()=>{const h=rows[Number(b.dataset.i)];const x=await phoneRequest('houseAction',{action:b.dataset.action,data:h});if(x?.ok)toast('Houses',`${b.dataset.action} complete.`,'inform');else toast('Houses',x?.error||'Action failed.','error');});};


// Notes are shared with rs-phone so a note written on one device appears on the
// other.  If the companion provider is unavailable the old local scratchpad remains
// reachable through the provider error rather than silently forking data.
appRenderers.notes=async el=>{if(state.activeApp!=='notes')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='notes'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getAppData',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Notes','Synced notes from RS Tablet.')+providerBanner(false)+`<div class="card"><h3>Provider unavailable</h3><p>${escapeHtml(r?.error||'RS Tablet is not available.')}</p></div>`;return;}
  const notes=r.data?.notes||[];let current=notes.find(n=>String(n.note_id)===String(state.activeNoteId||''))||null;
  el.innerHTML=appHero('Notes','One note library across your linked devices.',`<button id="note-new2" class="primary-btn">New Note</button>`)+providerBanner(true)+`<div class="notes-layout"><aside class="notes-list">${notes.map(n=>`<button class="note-row ${current?.note_id===n.note_id?'active':''}" data-id="${escapeHtml(n.note_id)}"><strong>${escapeHtml(n.title||'Untitled Note')}</strong><span>${escapeHtml((n.body||'').slice(0,100))}</span><small>${Number(n.is_pinned)===1?'PINNED • ':''}${escapeHtml(fmtDate(n.updated_at))}</small></button>`).join('')||'<div class="empty-state">No notes.</div>'}</aside><section class="note-editor">${current?`<input id="note-title2" class="text-input" value="${escapeHtml(current.title||'')}"><textarea id="note-body2" class="textarea" placeholder="Write something…">${escapeHtml(current.body||'')}</textarea><select id="note-media2" class="text-input"><option value="">No attachment</option>${shareableMediaOptions(current.media_url||'')}</select><div class="button-row"><button id="note-save2" class="primary-btn">Save</button><button id="note-pin2" class="secondary-btn">${Number(current.is_pinned)===1?'Unpin':'Pin'}</button><button id="note-delete2" class="danger-btn">Delete</button></div>`:'<div class="empty-state">Choose a note or create a new one.</div>'}</section></div>`;
  $$('.note-row').forEach(b=>b.onclick=()=>{state.activeNoteId=b.dataset.id;appRenderers.notes(el);});
  $('#note-new2').onclick=()=>{state.activeNoteId='__new__';current={note_id:'__new__',title:'New Note',body:'',is_pinned:0};el.innerHTML=appHero('Notes','Create a synced note.')+providerBanner(true)+`<div class="note-editor standalone"><input id="note-title2" class="text-input" value="New Note"><textarea id="note-body2" class="textarea" placeholder="Write something…"></textarea><select id="note-media2" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><div class="button-row"><button id="note-save2" class="primary-btn">Save</button><button id="note-cancel2" class="secondary-btn">Cancel</button></div></div>`;$('#note-save2').onclick=async()=>{const x=await phoneRequest('saveNote',{title:$('#note-title2').value,body:$('#note-body2').value,mediaUrl:$('#note-media2').value,pinned:false});if(x?.ok){state.activeNoteId=x.data?.notes?.[0]?.note_id||null;appRenderers.notes(el);}else toast('Notes',x?.error||'Save failed.','error');};$('#note-cancel2').onclick=()=>{state.activeNoteId=null;appRenderers.notes(el);};};
  if(current&&current.note_id!=='__new__'){
    $('#note-save2').onclick=async()=>{const x=await phoneRequest('saveNote',{noteId:current.note_id,title:$('#note-title2').value,body:$('#note-body2').value,mediaUrl:$('#note-media2').value,pinned:Number(current.is_pinned)===1});if(x?.ok){toast('Notes','Saved.','inform');appRenderers.notes(el);}else toast('Notes',x?.error||'Save failed.','error');};
    $('#note-pin2').onclick=async()=>{const x=await phoneRequest('saveNote',{noteId:current.note_id,title:current.title,body:current.body,mediaUrl:current.media_url,pinned:Number(current.is_pinned)!==1});if(x?.ok)appRenderers.notes(el);};
    $('#note-delete2').onclick=async()=>{if(!confirm('Delete this note?'))return;const x=await phoneRequest('deleteNote',{noteId:current.note_id});if(x?.ok){state.activeNoteId=null;appRenderers.notes(el);}else toast('Notes',x?.error||'Delete failed.','error');};
  }
};

appRenderers.mediahub=async el=>{if(state.activeApp!=='mediahub')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='mediahub'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const boot=await getPhoneBootstrap();if(!isCurrentRender())return;const media=boot?.ok?phoneMedia():[];
  el.innerHTML=appHero('Media','Tablet media center built on the RS Tablet camera roll.')+providerBanner(boot?.ok===true)+`<div class="mediahub-grid">${media.map(m=>`<button class="mediahub-card" data-mid="${escapeHtml(mediaId(m))}">${mediaVisual(m,'gallery-media')}<span><b>${mediaType(m)==='video'?'Video':'Photo'}</b><small>${escapeHtml(fmtDate(m.created_at))}</small></span></button>`).join('')||'<div class="empty-state wide">No media in your library.</div>'}</div>`;
  $$('.mediahub-card').forEach(b=>b.onclick=()=>{gallerySelectedId=b.dataset.mid;openApp('gallery');});
};

appRenderers.news=async el=>{if(state.activeApp!=='news')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='news'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getNews',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('News','Player-run Los Santos newswire.')+providerBanner(false);return;}
  const rows=r.data?.news||[],viewer=r.data?.viewer;
  el.innerHTML=appHero('News','Publish stories, attach camera media and discuss live reports.',`<button id="news-compose2" class="primary-btn">Publish</button>`)+providerBanner(true)+`<div id="news-form2" class="compose-panel hidden"><div class="form-grid two"><select id="news-cat2" class="text-input"><option>general</option><option>breaking</option><option>crime</option><option>business</option><option>sports</option><option>weather</option><option>politics</option><option>event</option></select><input id="news-head2" class="text-input" placeholder="Headline"><textarea id="news-body2" class="textarea compact span2" placeholder="Story"></textarea><select id="news-media2" class="text-input span2"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="news-post2" class="primary-btn span2">Publish Story</button></div></div><div class="community-feed">${rows.map(n=>`<article class="feed-card"><header><div><strong>${escapeHtml(n.headline||'News')}</strong><small>${escapeHtml(String(n.category||'general').toUpperCase())} • ${escapeHtml(n.author_name||'Citizen')} ${Number(n.verified)===1?'• VERIFIED':''}</small></div>${String(n.author_number||'')===String(viewer||'')?`<button class="danger-btn news-del2" data-id="${escapeHtml(n.news_id)}">Delete</button>`:''}</header><p>${escapeHtml(n.body||'')}</p>${n.media_url?'<div class="feed-media-chip">Attached media</div>':''}<footer><button class="secondary-btn news-reply2" data-id="${escapeHtml(n.news_id)}">Reply</button><button class="secondary-btn news-thread2" data-id="${escapeHtml(n.news_id)}">Thread</button></footer><div id="news-thread-${escapeHtml(n.news_id)}" class="thread-host"></div></article>`).join('')||'<div class="empty-state">No stories.</div>'}</div>`;
  $('#news-compose2').onclick=()=>$('#news-form2').classList.toggle('hidden');$('#news-post2').onclick=async()=>{const x=await phoneRequest('postNews',{category:$('#news-cat2').value,headline:$('#news-head2').value.trim(),body:$('#news-body2').value.trim(),mediaUrl:$('#news-media2').value});if(x?.ok)appRenderers.news(el);else toast('News',x?.error||'Publish failed.','error');};
  $$('.news-del2').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this story?'))return;const x=await phoneRequest('deleteNews',{newsId:b.dataset.id});if(x?.ok)appRenderers.news(el);});
  $$('.news-reply2').forEach(b=>b.onclick=async()=>{const body=prompt('Reply');if(!body)return;const x=await phoneRequest('postContentReply',{parentType:'news',parentId:b.dataset.id,body});if(!x?.ok)toast('News',x?.error||'Reply failed.','error');});
  $$('.news-thread2').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('getContentReplies',{parentType:'news',parentId:b.dataset.id});const h=$(`#news-thread-${CSS.escape(b.dataset.id)}`);if(x?.ok)h.innerHTML=(x.data?.replies||[]).map(q=>`<div class="thread-reply"><b>${escapeHtml(q.author_name||'Citizen')}</b><span>${escapeHtml(q.body||'')}</span></div>`).join('')||'<div class="empty-state">No replies.</div>';});
};

appRenderers.market=async el=>{if(state.activeApp!=='market')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='market'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [r]=await Promise.all([phoneRequest('getAds',{}),getPhoneBootstrap()]);if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Market','Player marketplace.')+providerBanner(false);return;}
  const hidden=tabletPhoneSettingIds('hiddenMarketAds'),rows=(r.data?.ads||[]).filter(a=>!hidden.has(String(a.ad_id||'')));
  const actions=`<button id="market-compose2" class="primary-btn">New Listing</button>${hidden.size?`<button id="market-restore-hidden" class="secondary-btn">Restore ${hidden.size} Removed</button>`:''}`;
  el.innerHTML=appHero('Market','Buy, sell and contact players through the same RS Tablet marketplace.',actions)+providerBanner(true)+`<div id="market-form2" class="compose-panel hidden"><div class="form-grid two"><select id="market-cat2" class="text-input"><option>general</option><option>supplies</option><option>vehicle</option><option>property</option><option>service</option><option>wanted</option><option>rental</option></select><input id="market-title2" class="text-input" placeholder="Title"><input id="market-price2" class="text-input" type="number" min="0" placeholder="Price"><input id="market-contact2" class="text-input" placeholder="Contact number (optional)"><textarea id="market-body2" class="textarea compact span2" placeholder="Description"></textarea><select id="market-media2" class="text-input span2"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="market-post2" class="primary-btn span2">Publish Listing</button></div></div><div class="community-feed">${rows.map(a=>`<article class="feed-card"><header><div><strong>${escapeHtml(a.title||'Listing')}</strong><small>${escapeHtml(String(a.category||'general').toUpperCase())} • ${escapeHtml(a.poster_name||'Citizen')}</small></div><b>${a.price!==null&&a.price!==undefined?fmtMoney(a.price):'TRADE'}</b></header><p>${escapeHtml(a.body||'')}</p>${a.media_url?'<div class="feed-media-chip">Attached media</div>':''}<footer><button class="secondary-btn market-call2" data-num="${escapeHtml(a.contact_number||a.poster_number||'')}">Call</button><button class="secondary-btn market-msg2" data-num="${escapeHtml(a.contact_number||a.poster_number||'')}">Message</button><button class="secondary-btn market-reply2" data-id="${escapeHtml(a.ad_id)}">Replies</button><button class="secondary-btn market-remove2" data-id="${escapeHtml(a.ad_id)}">Remove from My Tablet</button>${Number(a.is_mine)===1?`<button class="danger-btn market-del2" data-id="${escapeHtml(a.ad_id)}">Delete for Everyone</button>`:''}</footer></article>`).join('')||'<div class="empty-state">No listings.</div>'}</div>`;
  $('#market-compose2').onclick=()=>$('#market-form2').classList.toggle('hidden');
  $('#market-post2').onclick=async()=>{const x=await phoneRequest('postAd',{category:$('#market-cat2').value,title:$('#market-title2').value.trim(),body:$('#market-body2').value.trim(),price:$('#market-price2').value,contact:$('#market-contact2').value.trim(),mediaUrl:$('#market-media2').value});if(x?.ok)appRenderers.market(el);else toast('Market',x?.error||'Listing failed.','error');};
  $$('.market-call2').forEach(b=>b.onclick=()=>phoneRequest('startCall',{number:b.dataset.num,video:false}));$$('.market-msg2').forEach(b=>b.onclick=()=>{state.activeConversation={newRecipient:b.dataset.num,title:'New Message',messages:[]};openApp('messages');});
  $$('.market-remove2').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this listing only from your tablet? Other players will still see it.'))return;const x=await removeSharedPhoneItem('hiddenMarketAds',b.dataset.id);if(x?.ok){toast('Market','Removed only from your devices.','inform');appRenderers.market(el);}else toast('Market',x?.error||'Could not remove listing.','error');});
  $$('.market-del2').forEach(b=>b.onclick=async()=>{if(!confirm('Delete your listing for EVERYONE? Use Remove from My Tablet if you only want it hidden on your devices.'))return;const x=await phoneRequest('deleteAd',{adId:b.dataset.id});if(x?.ok)appRenderers.market(el);else toast('Market',x?.error||'Delete failed.','error');});
  if($('#market-restore-hidden'))$('#market-restore-hidden').onclick=async()=>{const x=await restoreSharedPhoneItems('hiddenMarketAds');if(x?.ok)appRenderers.market(el);};
  $$('.market-reply2').forEach(b=>b.onclick=async()=>{const body=prompt('Reply to listing');if(!body)return;const x=await phoneRequest('postContentReply',{parentType:'market',parentId:b.dataset.id,body});if(x?.ok)toast('Market','Reply posted.','inform');else toast('Market',x?.error||'Reply failed.','error');});
};

appRenderers.darkmarket=async el=>{if(state.activeApp!=='darkmarket')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='darkmarket'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getDarkListings',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('DarkMarket','Anonymous listings.')+providerBanner(false)+`<div class="provider-unavailable"><p>${escapeHtml(r?.error||'DarkMarket is unavailable.')}</p></div>`;return;}const rows=r.data?.listings||[];
  el.innerHTML=appHero('DarkMarket','Anonymous RS Tablet listings with the same server-side rules.',`<button id="dark-compose2" class="primary-btn">Post</button>`)+providerBanner(true)+`<div id="dark-form2" class="compose-panel hidden"><div class="form-grid two"><input id="dark-title2" class="text-input" placeholder="Title"><input id="dark-price2" class="text-input" type="number" min="0" placeholder="Price"><input id="dark-cat2" class="text-input" placeholder="Category" value="general"><select id="dark-media2" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><textarea id="dark-body2" class="textarea compact span2" placeholder="Description"></textarea><button id="dark-post2" class="primary-btn span2">Post Anonymously</button></div></div><div class="community-feed dark-feed">${rows.map(x=>`<article class="feed-card"><header><div><strong>${escapeHtml(x.title||'Listing')}</strong><small>${escapeHtml(x.alias||'Anonymous')} • ${escapeHtml(String(x.category||'general').toUpperCase())}</small></div><b>${x.price?fmtMoney(x.price):'TRADE'}</b></header><p>${escapeHtml(x.body||'')}</p>${x.media_url?'<div class="feed-media-chip">Attached media</div>':''}<footer><button class="secondary-btn dark-reply2" data-id="${escapeHtml(x.listing_id)}">Reply</button>${Number(x.is_mine)===1?`<button class="danger-btn dark-del2" data-id="${escapeHtml(x.listing_id)}">Delete</button>`:''}</footer></article>`).join('')||'<div class="empty-state">No dark listings.</div>'}</div>`;
  $('#dark-compose2').onclick=()=>$('#dark-form2').classList.toggle('hidden');$('#dark-post2').onclick=async()=>{const x=await phoneRequest('postDarkListing',{title:$('#dark-title2').value.trim(),price:$('#dark-price2').value,category:$('#dark-cat2').value.trim(),body:$('#dark-body2').value.trim(),mediaUrl:$('#dark-media2').value});if(x?.ok)appRenderers.darkmarket(el);else toast('DarkMarket',x?.error||'Post failed.','error');};$$('.dark-del2').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this listing?'))return;const x=await phoneRequest('deleteDarkListing',{listingId:b.dataset.id});if(x?.ok)appRenderers.darkmarket(el);});$$('.dark-reply2').forEach(b=>b.onclick=async()=>{const body=prompt('Anonymous reply');if(!body)return;const x=await phoneRequest('postContentReply',{parentType:'darkmarket',parentId:b.dataset.id,body});if(x?.ok)toast('DarkMarket','Reply posted.','inform');else toast('DarkMarket',x?.error||'Reply failed.','error');});
};

appRenderers.racing=async el=>{if(state.activeApp!=='racing')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='racing'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getStats',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Stats','Combat and survival stats.')+providerBanner(false);return;}const s=r.data?.stats||{};
  const kills=Number(s.kills||0),deaths=Number(s.deaths||0),kd=s.kd??(deaths?kills/deaths:kills),hs=s.headshotRate??0;
  el.innerHTML=appHero('Stats',r.data?.providerAuthoritative?`Live stats from ${r.data.provider||'scoreboard provider'}.`:'RS Tablet combat statistics.',`<button id="stats-reset2" class="danger-btn">Reset Local Stats</button>`)+providerBanner(true)+`<section class="stats-command"><div class="stats-primary"><span>TOTAL KILLS</span><strong>${escapeHtml(kills)}</strong><small>${escapeHtml(s.currentStreak??0)} current streak • ${escapeHtml(s.bestStreak??0)} best</small></div><div class="stats-mini"><div><span>DEATHS</span><b>${escapeHtml(deaths)}</b></div><div><span>K / D</span><b>${escapeHtml(typeof kd==='number'?kd.toFixed(2):kd)}</b></div><div><span>HEADSHOTS</span><b>${escapeHtml(s.headshots??0)}</b></div><div><span>HEADSHOT %</span><b>${escapeHtml(hs)}%</b></div></div></section><div class="stats-grid tablet-stats-grid">${[['Player Kills',s.playerKills],['Infected',s.infectedKills],['NPC Kills',s.npcKills],['Best Streak',s.bestStreak],['Current Streak',s.currentStreak],['Races Won',s.racesWon],['Race Network',s.raceNetwork],['Results',s.resultsCount]].map(([k,v])=>`<div><span>${escapeHtml(k)}</span><strong>${escapeHtml(v??'—')}</strong></div>`).join('')}</div>`;$('#stats-reset2').onclick=async()=>{if(!confirm('Reset your RS Tablet local combat stats?'))return;const x=await phoneRequest('resetCombatStats',{});if(x?.ok)appRenderers.racing(el);else toast('Stats',x?.error||'Reset failed.','error');};
};

appRenderers.races=async el=>{if(state.activeApp!=='races')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='races'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const [racing,standing]=await Promise.all([phoneRequest('getRacing',{}),phoneRequest('getRaceStandings',{})]);if(!isCurrentRender())return;const d=racing?.data?.racing||{},races=d.races||[],results=d.results||[],providers=standing?.data?.providers||[];
  el.innerHTML=appHero('Races',d.connected?`Connected to ${d.provider||'racing provider'}.`:'No racing provider currently broadcasting.')+providerBanner(racing?.ok===true)+`<div class="race-grid">${races.map(r=>`<article class="feed-card"><header><div><strong>${escapeHtml(r.label||'Race')}</strong><small>${escapeHtml(String(r.status||'open').toUpperCase())} • ${Number(r.participants)||0} racers</small></div>${r.buyIn?`<b>${fmtMoney(r.buyIn)}</b>`:''}</header><footer><button class="primary-btn race-join2" data-id="${escapeHtml(r.id)}">Join</button><button class="secondary-btn race-open2" data-id="${escapeHtml(r.id)}">View</button></footer></article>`).join('')||'<div class="empty-state">No open races.</div>'}</div><div class="section-label">STANDINGS PROVIDERS</div><div class="data-list">${providers.map(p=>`<div class="list-row"><span class="badge">LIVE</span><div class="grow"><strong>${escapeHtml(p.label||p.resource||p.provider||'Racing')}</strong><small>${Object.keys(p).filter(k=>Array.isArray(p[k])).map(k=>`${k}: ${p[k].length}`).join(' • ')}</small></div></div>`).join('')||'<div class="empty-state">No standings provider.</div>'}</div><div class="section-label">YOUR RESULTS</div><div class="data-list">${results.map(x=>`<div class="list-row"><div class="grow"><strong>${escapeHtml(x.race_label||'Race')}</strong><small>${escapeHtml(x.vehicle||'Vehicle')} • ${escapeHtml(fmtDate(x.created_at))}</small></div><b>#${escapeHtml(x.position??'-')}</b></div>`).join('')||'<div class="empty-state">No saved race results.</div>'}</div>`;$$('.race-join2').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('racingAction',{action:'join',raceId:b.dataset.id});if(!x?.ok)toast('Races',x?.error||'Join failed.','error');});$$('.race-open2').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('racingAction',{action:'open',raceId:b.dataset.id});if(!x?.ok)toast('Races',x?.error||'Could not open.','error');});
};

appRenderers.bills=async el=>{if(state.activeApp!=='bills')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='bills'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getPlatform',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Bills','Invoices and payments.')+providerBanner(false);return;}const rows=r.data?.invoices||[];
  el.innerHTML=appHero('Bills','Send and pay RS Tablet invoices through your configured bank.',`<button id="bill-new2" class="primary-btn">Send Bill</button>`)+providerBanner(true)+`<div id="bill-form2" class="compose-panel hidden"><div class="form-grid two"><input id="bill-num2" class="text-input" placeholder="Recipient contact"><input id="bill-amt2" class="text-input" type="number" min="1" placeholder="Amount"><input id="bill-label2" class="text-input span2" placeholder="Reason"><button id="bill-send2" class="primary-btn span2">Send Invoice</button></div></div><div class="data-list">${rows.map(i=>`<div class="list-row"><div class="grow"><strong>${escapeHtml(i.label||'Invoice')}</strong><small>${escapeHtml(i.direction||'')} • ${escapeHtml(String(i.status||'unpaid').toUpperCase())} • ${escapeHtml(fmtDate(i.created_at))}</small></div><b>${fmtMoney(i.amount)}</b>${i.direction==='incoming'&&i.status==='unpaid'?`<button class="primary-btn bill-pay2" data-id="${escapeHtml(i.invoice_id)}">Pay</button>`:''}</div>`).join('')||'<div class="empty-state">No invoices.</div>'}</div>`;$('#bill-new2').onclick=()=>$('#bill-form2').classList.toggle('hidden');$('#bill-send2').onclick=async()=>{const x=await phoneRequest('sendInvoice',{number:$('#bill-num2').value.trim(),amount:Number($('#bill-amt2').value),label:$('#bill-label2').value.trim()});if(x?.ok)appRenderers.bills(el);else toast('Bills',x?.error||'Could not send bill.','error');};$$('.bill-pay2').forEach(b=>b.onclick=async()=>{if(!confirm('Pay this invoice from your bank account?'))return;const x=await phoneRequest('payInvoice',{invoiceId:b.dataset.id});if(x?.ok){toast('Bills','Invoice paid.','inform');appRenderers.bills(el);}else toast('Bills',x?.error||'Payment failed.','error');});
};

function workEntryCard(entry,kind){return `<article class="service-card"><header><strong>${escapeHtml(entry.label||entry.name||entry.id||kind)}</strong><span class="badge">${escapeHtml(kind.toUpperCase())}</span></header><p>${escapeHtml(entry.description||entry.body||'')}</p><button class="primary-btn work-request2" data-id="${escapeHtml(entry.id||entry.name||'')}" data-kind="${escapeHtml(kind)}">Request</button></article>`;}
appRenderers.work=async el=>{if(state.activeApp!=='work')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='work'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getPlatform',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Work','Jobs and city services.')+providerBanner(false);return;}const d=r.data||{},job=d.currentJob||{};
  const rows=[];(d.jobs||[]).forEach(x=>rows.push({entry:x,kind:'framework_job'}));(d.opportunities||[]).forEach(x=>rows.push({entry:x,kind:'work'}));(d.services||[]).forEach(x=>rows.push({entry:x,kind:'service'}));(d.delivery||[]).forEach(x=>rows.push({entry:x,kind:'delivery'}));(d.rentals||[]).forEach(x=>rows.push({entry:x,kind:'rental'}));
  el.innerHTML=appHero('Work',`Current job: ${job.label||job.name||'Unemployed'}${job.gradeLabel?` • ${job.gradeLabel}`:''}`,`<div class="button-row"><button id="work-maps2" class="secondary-btn">Maps / Routes</button>${d.boss?.isBoss?'<button id="work-boss2" class="secondary-btn">Boss Menu</button>':''}</div>`)+providerBanner(true)+`<div class="service-grid">${rows.map(x=>workEntryCard(x.entry,x.kind)).join('')||'<div class="empty-state wide">No opportunities configured.</div>'}</div><div class="section-label">YOUR REQUESTS</div><div class="data-list">${(d.requests||[]).map(x=>`<div class="list-row"><div class="grow"><strong>${escapeHtml(x.label||x.request_type||'Request')}</strong><small>${escapeHtml(String(x.status||'pending').toUpperCase())} • ${escapeHtml(fmtDate(x.created_at))}</small></div></div>`).join('')||'<div class="empty-state">No requests.</div>'}</div>`;
  $('#work-maps2').onclick=()=>openApp('maps');
  if($('#work-boss2'))$('#work-boss2').onclick=async()=>{const x=await phoneRequest('openBoss',{});if(!x?.ok)toast('Work',x?.error||'Boss menu unavailable.','error');};
  $$('.work-request2').forEach(b=>b.onclick=async()=>{const kind=b.dataset.kind,id=b.dataset.id;let action='requestOpportunity',payload={id,kind,message:''};if(kind==='service'){action='requestService';payload={id,message:''};}else if(kind==='delivery')action='requestDelivery';else if(kind==='rental')action='requestRental';const x=await phoneRequest(action,payload);if(x?.ok){toast('Work','Request sent.','inform');appRenderers.work(el);}else toast('Work',x?.error||'Request failed.','error');});
};

appRenderers.yellowpage=async el=>{if(state.activeApp!=='yellowpage')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='yellowpage'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getYellowPages',{});if(!isCurrentRender())return;if(!r?.ok){el.innerHTML=appHero('Directory','Businesses and nearby places.')+providerBanner(false);return;}const d=r.data||{},biz=d.businesses||[],places=d.places||[];
  el.innerHTML=appHero('Directory','Live business directory and nearby Los Santos places.',d.canList?'<button id="yp-new2" class="primary-btn">List Business</button>':'')+providerBanner(true)+`<div id="yp-form2" class="compose-panel hidden"><div class="form-grid two"><input id="yp-name2" class="text-input" placeholder="Business name"><select id="yp-cat2" class="text-input">${(d.categories||['general']).map(c=>`<option>${escapeHtml(typeof c==='string'?c:c.id||c.value||'general')}</option>`).join('')}</select><textarea id="yp-desc2" class="textarea compact span2" placeholder="Description"></textarea><button id="yp-submit2" class="primary-btn span2">Publish${d.listingCost?` • ${fmtMoney(d.listingCost)}`:''}</button></div></div><div class="directory-grid">${biz.map(b=>`<article class="property-card"><header><div><strong>${escapeHtml(b.name||'Business')}</strong><small>${escapeHtml(b.category||'general')} ${b.distance?`• ${b.distance}m`:''}</small></div>${b.verified?'<span class="badge">VERIFIED</span>':''}</header><p>${escapeHtml(b.description||'')}</p><div class="button-row">${b.phone?`<button class="secondary-btn yp-call2" data-num="${escapeHtml(b.phone)}">Call</button>`:''}${b.x&&b.y?`<button class="secondary-btn yp-gps2" data-x="${Number(b.x)}" data-y="${Number(b.y)}">GPS</button>`:''}${b.ownerNumber&&state.phoneBootstrap?.sim?.phone_number===b.ownerNumber?`<button class="danger-btn yp-del2" data-id="${escapeHtml(b.id||b.business_id)}">Remove</button>`:''}</div></article>`).join('')||'<div class="empty-state">No businesses.</div>'}</div><div class="section-label">NEARBY PLACES</div><div class="data-list">${places.slice(0,30).map((p,i)=>`<div class="list-row"><div class="grow"><strong>${escapeHtml(p.label||p.name||`Place ${i+1}`)}</strong><small>${escapeHtml(p.category||'')} ${p.distance?`• ${p.distance}m`:''}</small></div>${p.x&&p.y?`<button class="secondary-btn place-gps2" data-x="${Number(p.x)}" data-y="${Number(p.y)}">GPS</button>`:''}</div>`).join('')||'<div class="empty-state">No nearby places.</div>'}</div>`;
  if($('#yp-new2'))$('#yp-new2').onclick=()=>$('#yp-form2').classList.toggle('hidden');if($('#yp-submit2'))$('#yp-submit2').onclick=async()=>{const x=await phoneRequest('listBusiness',{name:$('#yp-name2').value.trim(),category:$('#yp-cat2').value,description:$('#yp-desc2').value.trim()});if(x?.ok)appRenderers.yellowpage(el);else toast('Directory',x?.error||'Listing failed.','error');};$$('.yp-call2').forEach(b=>b.onclick=()=>phoneRequest('startCall',{number:b.dataset.num,video:false}));$$('.yp-gps2,.place-gps2').forEach(b=>b.onclick=()=>nui('setWaypoint',{x:Number(b.dataset.x),y:Number(b.dataset.y)}));$$('.yp-del2').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('removeBusiness',{id:b.dataset.id});if(x?.ok)appRenderers.yellowpage(el);else toast('Directory',x?.error||'Remove failed.','error');});
};

// Generic phone data apps remain available for the rest of the rs-phone suite,
// while these high-use surfaces above get tablet-native workflows rather than
// a read-only dump.


appRenderers.dispatch = el => {if(state.activeApp!=='dispatch')return;
  const rows=state.dispatchEvents||[];
  el.innerHTML=appHero('Dispatch','Server-authorized incident inbox from the RS communications bus.',`<button id="dispatch-clear" class="secondary-btn">Clear Readout</button>`)+
    `<div class="dispatch-list">${rows.length?rows.map(ev=>`<div class="feed-card dispatch-card ${escapeHtml(ev.priority||'routine')}"><header><div><strong>${escapeHtml(ev.title||'Dispatch')}</strong><small>${escapeHtml(String(ev.priority||'routine').toUpperCase())}${ev.code?` • ${escapeHtml(ev.code)}`:''}${ev.street?` • ${escapeHtml(ev.street)}`:''}</small></div><span class="badge">${escapeHtml(ev.department||ev.callsign||'RS')}</span></header><p>${escapeHtml(ev.body||'')}</p><footer>${(ev.actions||[]).map(a=>`<button class="${a.id==='ack'?'primary-btn':'secondary-btn'} dispatch-action" data-event="${escapeHtml(ev.id)}" data-action="${escapeHtml(a.id)}">${escapeHtml(a.label||a.id)}</button>`).join('')}</footer></div>`).join(''):'<div class="empty-state">No dispatches have been delivered to this tablet.</div>'}</div>`;
  $('#dispatch-clear').onclick=()=>{state.dispatchEvents=[];appRenderers.dispatch(el);};
  $$('.dispatch-action').forEach(b=>b.onclick=async()=>{const r=await rpc('comms.event.action',{id:b.dataset.event,action:b.dataset.action});if(!r?.ok)return toast('Dispatch',r?.error||'Action failed.','error');if(b.dataset.action==='ack'){b.disabled=true;b.textContent='Acknowledged';}else toast('Dispatch','Waypoint set.','inform');});
};

appRenderers.recon = async el => {if(state.activeApp!=='recon')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='recon'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await rpc('recon.list',{});if(!isCurrentRender())return;const cams=r?.ok&&Array.isArray(r.data)?r.data:[];state.reconCameras=cams;
  const battery=c=>c.batterySeconds==null?'UNLIMITED':c.batterySeconds<=0?'EMPTY':`${Math.max(1,Math.ceil(c.batterySeconds/60))} MIN`;
  const online=cams.filter(c=>c.online).length, shared=cams.filter(c=>String(c.shareMode||'private')!=='private').length;
  const avgSignal=cams.length?Math.round(cams.reduce((a,c)=>a+(Number(c.signal)||0),0)/cams.length):0;
  const degraded=cams.filter(c=>Number(c.signal||0)>0&&Number(c.signal||0)<35).length, lost=cams.filter(c=>!c.online||Number(c.signal||0)<=0).length;
  const dots=cams.slice(0,12).map((c,i)=>{const angle=(i/Math.max(1,Math.min(12,cams.length)))*Math.PI*2,rad=24+(i%3)*17,x=50+Math.cos(angle)*rad,y=50+Math.sin(angle)*rad;return `<i class="recon-scope-dot ${c.online?'online':'lost'}" style="left:${x}%;top:${y}%" title="${escapeHtml(c.label||c.cameraId)}"></i>`;}).join('');
  el.innerHTML=appHero('Recon Center','Persistent micro-surveillance command center with live signal, sharing and recovery controls.',`<div class="button-row"><button id="recon-place" class="primary-btn">Deploy Camera</button><button id="recon-refresh" class="secondary-btn">Refresh</button><button id="recon-map" class="secondary-btn">Map</button></div>`)+
    `<section class="recon-command"><div class="recon-scope"><div class="recon-ring r1"></div><div class="recon-ring r2"></div><div class="recon-ring r3"></div><div class="recon-cross h"></div><div class="recon-cross v"></div>${dots}<div class="recon-sweep"></div><strong>${avgSignal}%</strong><span>LIVE SIGNAL</span></div><div class="recon-command-metrics"><div><span>CAMERAS</span><b>${cams.length}</b></div><div><span>CONNECTED FEEDS</span><b>${online}</b></div><div><span>SHARED</span><b>${shared}</b></div><div><span>DEGRADED</span><b>${degraded}</b></div><div><span>LOST LINK</span><b>${lost}</b></div><div><span>DEVICE ITEM</span><b>${escapeHtml(r?.item||'micro_recon_camera')}</b></div></div></section>`+
    `<div class="section-label">CONNECTED / NEARBY DEVICES</div><div class="recon-grid">${cams.map(c=>`<article class="recon-card ${c.online?'online':'offline'}"><header><div><strong>${escapeHtml(c.label||c.cameraId)}</strong><small>${escapeHtml((c.mountType||'world').toUpperCase())} • ${c.distance??'?'}m • ${escapeHtml((c.shareMode||'private').toUpperCase())}</small></div><span class="signal-pill ${c.signal<35?'weak':''}">${c.online?(c.signal??0)+'%':'LOST'}</span></header><div class="recon-meter"><i style="width:${Math.max(0,Math.min(100,Number(c.signal)||0))}%"></i></div><div class="kv"><span>Camera ID</span><b class="mono">${escapeHtml(c.cameraId)}</b><span>Battery</span><b>${battery(c)}</b>${c.vehiclePlate?`<span>Vehicle</span><b>${escapeHtml(c.vehiclePlate)}</b>`:''}<span>Status</span><b>${c.online?(Number(c.signal||0)<35?'SIGNAL DEGRADED':'ONLINE'):'STATIC / LOST LINK'}</b></div><footer><button class="primary-btn recon-view" data-id="${escapeHtml(c.cameraId)}" ${c.online?'':'disabled'}>Live View</button><button class="secondary-btn recon-gps" data-x="${Number(c.coords?.x)||0}" data-y="${Number(c.coords?.y)||0}">GPS</button>${c.isOwner?`<button class="secondary-btn recon-rename" data-id="${escapeHtml(c.cameraId)}" data-label="${escapeHtml(c.label||'')}">Rename</button><button class="secondary-btn recon-share" data-id="${escapeHtml(c.cameraId)}" data-mode="${escapeHtml(c.shareMode||'private')}">${c.shareMode==='job'?'Make Private':'Share Job'}</button><button class="secondary-btn recon-recover" data-id="${escapeHtml(c.cameraId)}">Recover</button><button class="danger-btn recon-delete" data-id="${escapeHtml(c.cameraId)}">ERASE</button>`:''}</footer></article>`).join('')||'<div class="empty-state wide">No recon cameras are visible. Use a Micro Recon Camera item or tap Deploy Camera.</div>'}</div>`;
  $('#recon-place').onclick=async()=>{const x=await rpc('recon.place',{});if(!x?.ok)toast('Recon',x?.error||'Placement could not start.','error');};
  $('#recon-refresh').onclick=()=>appRenderers.recon(el);$('#recon-map').onclick=()=>openApp('maps');
  $$('.recon-view').forEach(b=>b.onclick=async()=>{const x=await rpc('recon.view',{cameraId:b.dataset.id});if(!x?.ok)toast('Recon',x?.error||'Feed unavailable.','error');});
  $$('.recon-gps').forEach(b=>b.onclick=()=>rpc('recon.route',{x:Number(b.dataset.x),y:Number(b.dataset.y)}));
  $$('.recon-rename').forEach(b=>b.onclick=async()=>{const label=prompt('Camera name',b.dataset.label||'');if(!label)return;const x=await rpc('recon.rename',{cameraId:b.dataset.id,label});if(x?.ok)appRenderers.recon(el);else toast('Recon',x?.error||'Rename failed.','error');});
  $$('.recon-share').forEach(b=>b.onclick=async()=>{const mode=b.dataset.mode==='job'?'private':'job';const x=await rpc('recon.share',{cameraId:b.dataset.id,mode});if(x?.ok)appRenderers.recon(el);else toast('Recon',x?.error||'Share mode failed.','error');});
  $$('.recon-recover').forEach(b=>b.onclick=async()=>{const x=await rpc('recon.recover',{cameraId:b.dataset.id});if(!x?.ok)toast('Recon',x?.error||'Move closer to recover this camera.','error');});
  $$('.recon-delete').forEach(b=>b.onclick=async()=>{if(!confirm('ERASE this camera permanently? The deployed item will NOT be returned to inventory. Recover it physically if you want the item back.'))return;const x=await rpc('recon.delete',{cameraId:b.dataset.id});if(x?.ok)appRenderers.recon(el);else toast('Recon',x?.error||'Destroy failed.','error');});
};

appRenderers.cctv = async el => {if(state.activeApp!=='cctv')return;
  const ticket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=ticket;
  const current=()=>state.activeApp==='cctv'&&el.isConnected&&el._rsRenderTicket===ticket;
  el.innerHTML=appHero('CCTV','Open a feed in full view. ESC returns here; Q / E changes cameras while watching.',`<div class="button-row"><button id="cctv-resume" class="primary-btn" hidden>Resume last camera</button><button id="cctv-drone" class="secondary-btn">Drone / Recon</button><button id="cctv-dispatch" class="secondary-btn">Dispatch</button><button id="cctv-refresh" class="secondary-btn">Refresh</button></div>`)+`<div id="cctv-list" class="cctv-wall"><div class="empty-state wide">Loading authorized camera feeds…</div></div>`;
  $('#cctv-drone').onclick=()=>openApp('drone');$('#cctv-dispatch').onclick=()=>openApp('dispatch');
  const watch=async id=>{const x=await rpc('cctv.view',{id});if(x?.ok)lastCctvId=id;else toast('CCTV',x?.error||'Unable to open camera.','error');};
  const load=async()=>{const r=await rpc('cctv.list');if(!current())return;const host=$('#cctv-list');if(!host)return;if(!r?.ok){host.innerHTML=`<div class="cctv-state denied"><b>FEED ACCESS UNAVAILABLE</b><span>${escapeHtml(r?.error||'CCTV unavailable')}</span></div>`;return;}const cams=Array.isArray(r.data)?r.data:[];const resume=$('#cctv-resume');resume.hidden=!cams.some(c=>String(c.id)===lastCctvId);resume.onclick=()=>watch(lastCctvId);host.innerHTML=cams.length?cams.map((c,i)=>`<article class="cctv-feed-card"><div class="cctv-preview"><span class="cctv-scanline"></span><i>CAM ${String(i+1).padStart(2,'0')}</i><b>${escapeHtml(c.group||'CCTV')}</b></div><div class="cctv-feed-meta"><div><strong>${escapeHtml(c.label||c.id)}</strong><small>${c.rotatable===false?'FIXED VIEW':'PAN / TILT / ZOOM'} • CONFIGURED</small></div><button class="primary-btn cctv-view" data-id="${escapeHtml(c.id)}">Open Live View</button></div></article>`).join(''):'<div class="cctv-state empty"><b>NO AUTHORIZED FEEDS</b><span>No cameras are configured for this tablet account.</span></div>';$$('.cctv-view').forEach(b=>b.onclick=()=>watch(b.dataset.id));};
  $('#cctv-refresh').onclick=load;await load();
};

appRenderers.radio = el => appRenderers.comms(el);
appRenderers.sos = async el => {if(state.activeApp!=='sos')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='sos'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  const r=await phoneRequest('getSOSList',{});if(!isCurrentRender())return;const signals=r?.data?.signals||[];
  const types=[['general','General Distress'],['medical','Medical Emergency'],['trapped','Trapped'],['horde','Danger Nearby'],['vehicle','Vehicle Disabled'],['extraction','Need Pickup'],['missing','Missing Person']];
  el.innerHTML=appHero('SOS','The same server-authoritative distress network available on your tablet.',`<button id="sos-refresh2" class="secondary-btn">Refresh</button>`)+providerBanner(r?.ok===true)+
    `<div class="compose-panel"><div class="form-grid two"><select id="sos-type2" class="text-input">${types.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select><input id="sos-message2" class="text-input" maxlength="180" placeholder="Emergency message (optional)"><button id="sos-send2" class="danger-btn span2">Transmit SOS</button></div></div>`+
    `<div class="section-label">ACTIVE DISTRESS SIGNALS</div><div class="data-list sos-operational-list">${signals.map(s=>{const c=s.coords||{},when=fmtDate(s.created_at||s.updated_at||s.time);return `<div class="feed-card sos-operational-card"><header><div><strong>${escapeHtml(s.sender_name||s.sender_number||'Unknown')}</strong><small>${escapeHtml(String(s.sos_type||'general').toUpperCase())} • ${escapeHtml(String(s.status||'active').toUpperCase())}${s.distance!=null?` • ${Math.round(Number(s.distance)||0)}m`:''}${when?` • ${escapeHtml(when)}`:''}</small></div>${s.is_owner?'<span class="badge">YOURS</span>':'<span class="badge">ACTIVE</span>'}</header><p>${escapeHtml(s.message||'No additional message.')}</p><div class="sos-location-line"><span>COORDINATES</span><b class="mono">${Number(c.x||0).toFixed(1)}, ${Number(c.y||0).toFixed(1)}, ${Number(c.z||0).toFixed(1)}</b></div><footer><div><button class="primary-btn sos-gps2" data-x="${Number(c.x)||0}" data-y="${Number(c.y)||0}">Set GPS</button><button class="secondary-btn sos-dismiss2" data-id="${escapeHtml(s.sos_id)}">Dismiss</button></div>${s.is_owner?`<button class="danger-btn sos-cancel2 owner-cancel" data-id="${escapeHtml(s.sos_id)}">Cancel My SOS</button>`:''}</footer></div>`;}).join('')||'<div class="empty-state">No active distress signals.</div>'}</div>`;
  $('#sos-refresh2').onclick=()=>appRenderers.sos(el);
  $('#sos-send2').onclick=async()=>{if(!confirm('Transmit this SOS with your server-verified current location?'))return;const x=await phoneRequest('sendSOS',{type:$('#sos-type2').value,message:$('#sos-message2').value.trim()});if(x?.ok){toast('Emergency','SOS transmitted.','emergency');appRenderers.sos(el);}else toast('Emergency',x?.error||'SOS failed.','error');};
  $$('.sos-gps2').forEach(b=>b.onclick=()=>nui('setWaypoint',{x:Number(b.dataset.x),y:Number(b.dataset.y)}));
  $$('.sos-dismiss2').forEach(b=>b.onclick=async()=>{const x=await phoneRequest('dismissSOS',{sosId:b.dataset.id});if(x?.ok)appRenderers.sos(el);else toast('SOS',x?.error||'Dismiss failed.','error');});
  $$('.sos-cancel2').forEach(b=>b.onclick=async()=>{if(!confirm('Cancel your SOS for everyone?'))return;const x=await phoneRequest('cancelSOS',{sosId:b.dataset.id});if(x?.ok)appRenderers.sos(el);else toast('SOS',x?.error||'Cancel failed.','error');});
};
appRenderers.drone = async el => {if(state.activeApp!=='drone')return;
  const ticket=el._rsRenderTicket;
  const current=()=>state.activeApp==='drone'&&el.isConnected&&el._rsRenderTicket===ticket;
  el.innerHTML=appHero('Drone','RS Tablet scout drone plus connected RS drone fleets.',`<button id="drone-refresh" class="secondary-btn">Refresh</button>`)+`<div id="phone-drone-card" class="drone-hero"><div class="empty-state">Checking scout drone…</div></div><div class="section-label">CONNECTED FLEETS</div><div id="drone-fleets" class="data-list"><div class="empty-state">Scanning providers…</div></div>`;
  const load=async()=>{
    const [phone,normal,zombie]=await Promise.all([rpc('phone.drone.status'),rpc('drones.fleet'),rpc('drones.zombiecore.fleet')]);
    if(!current())return;
    const pd=phone?.data||{};const phoneHost=$('#phone-drone-card');
    if(pd.available){phoneHost.innerHTML=`<div><span class="eyebrow">TABLET SCOUT</span><h3>${pd.active?'DRONE IN FLIGHT':'SCOUT READY'}</h3><p>${pd.active?'The scout drone session is active. Recall it or end flight from here.':'Launch the same camera drone available on your tablet. Tablet closes while you fly.'}</p></div><div class="button-row">${pd.active?'<button id="phone-drone-recall" class="primary-btn">Recall</button><button id="phone-drone-stop" class="danger-btn">End Flight</button>':'<button id="phone-drone-launch" class="primary-btn">Launch Scout</button>'}</div>`;
      if($('#phone-drone-launch'))$('#phone-drone-launch').onclick=async()=>{const r=await rpc('phone.drone.launch');if(!r?.ok)toast('Drone',r?.error||'Launch denied.','error');};
      if($('#phone-drone-recall'))$('#phone-drone-recall').onclick=async()=>{const r=await rpc('phone.drone.recall');if(!r?.ok)toast('Drone',r?.error||'Recall failed.','error');else load();};
      if($('#phone-drone-stop'))$('#phone-drone-stop').onclick=async()=>{const r=await rpc('phone.drone.stop');if(!r?.ok)toast('Drone',r?.error||'Could not stop drone.','error');else load();};
    }else phoneHost.innerHTML='<div><span class="eyebrow">TABLET SCOUT</span><h3>PROVIDER OFFLINE</h3><p>Start an RS Tablet companion to use its scout drone.</p></div>';
    const rows=[];
    const pushFleet=(data,kind)=>{const fleet=data?.drones||data?.fleet||[];fleet.forEach((d,i)=>rows.push({kind,id:d.id??d.netId??i,index:i,label:d.label||d.name||`${kind} Drone ${i+1}`,status:d.status||'ready'}));};
    if(normal?.ok)pushFleet(normal.data,'Player');if(zombie?.ok)pushFleet(zombie.data,'Scenario');
    const host=$('#drone-fleets');
    if(!rows.length){host.innerHTML='<div class="empty-state">No external RS drone fleets are active.</div>';return;}
    host.innerHTML=rows.map((d,i)=>`<div class="list-row"><span class="badge">${escapeHtml(d.kind)}</span><div class="grow"><strong>${escapeHtml(d.label)}</strong><small>${escapeHtml(d.status)}</small></div><button class="primary-btn drone-take" data-i="${i}">Control</button></div>`).join('');
    $$('.drone-take').forEach(b=>b.onclick=async()=>{const d=rows[Number(b.dataset.i)];const r=d.kind==='Scenario'?await rpc('drones.zombiecore.control',{id:d.id,index:d.index}):await rpc('drones.control',{id:d.id});if(!r?.ok)toast('Drone',r?.error||'Unable to take control.','error');});
  };
  $('#drone-refresh').onclick=()=>appRenderers.drone(el);await load();
};


appRenderers.buildertools = el => {if(state.activeApp!=='buildertools')return;
  const app = allApps().find(a=>a.id==='buildertools') || {};
  const f = app.features || {};
  const cards = [];
  if (f.devtool) cards.push(`<div class="tool-launch-card"><div><span class="eyebrow">RS DEVTOOL</span><h3>Developer Lab</h3><p>Props, peds, particles, animations, native lab, freecam, placement tools and reusable scoped workspaces.</p></div><button id="launch-devtool" class="primary-btn">Open DevTool</button></div>`);
  if (f.worldbuilder) cards.push(`<div class="tool-launch-card"><div><span class="eyebrow">RS WORLDBUILDER</span><h3>WorldBuilder</h3><p>Projects, shells, walls, doors, windows, furnishing, gizmo precision, cameras, blueprints and persistent world authoring.</p></div><button id="launch-worldbuilder" class="primary-btn">Open WorldBuilder</button></div>`);
  el.innerHTML = appHero('Builder Tools','DevTool and WorldBuilder are installed inside RS Tablet as one secured Builder Tools suite.') +
    `<div class="privileged-note"><b>EMBEDDED + SERVER-AUTHORIZED</b><span>Both tools ship inside rs-tablet. The tablet closes before the full-screen editor opens, and the embedded module re-checks ACE permission.</span></div>` +
    `<div class="tool-launch-grid">${cards.join('') || '<div class="empty-state">No builder tools are enabled for this account.</div>'}</div>`;
  if ($('#launch-devtool')) $('#launch-devtool').onclick = async()=>{const r=await nui('launchPrivilegedTool',{feature:'devtool'});if(!r?.ok)toast('Builder Tools',r?.error||'DevTool launch failed.','error');};
  if ($('#launch-worldbuilder')) $('#launch-worldbuilder').onclick = async()=>{const r=await nui('launchPrivilegedTool',{feature:'worldbuilder'});if(!r?.ok)toast('Builder Tools',r?.error||'WorldBuilder launch failed.','error');};
};


appRenderers.store = el => {if(state.activeApp!=='store')return;
 const apps=allApps();el.innerHTML=appHero('App Store','First-party and server-installed applications.')+`<div class="store-list">${apps.map(a=>`<div class="list-row"><span class="app-icon" style="width:42px;height:42px;border-radius:13px;font-size:18px">${escapeHtml(iconFor(a))}</span><div class="grow"><strong>${escapeHtml(a.label)}</strong><small>${escapeHtml(a.category||'app')} • ${a.resource?'server extension':'built in'}</small></div><span class="badge">INSTALLED</span></div>`).join('')}<div class="list-row"><span class="app-icon" style="width:42px;height:42px;border-radius:13px">+</span><div class="grow"><strong>Developer SDK</strong><small>Other resources can register apps and push notifications.</small></div><span class="badge">READY</span></div></div>`;
};

function bindHorizontalRail(selector){
  const rail=$(selector);if(!rail)return;
  rail.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?rail.clientWidth:1);const limit=rail.scrollWidth-rail.clientWidth;if(limit<=1||(delta<0&&rail.scrollLeft<=1)||(delta>0&&rail.scrollLeft>=limit-1))return;e.preventDefault();rail.scrollBy({left:delta*.75,behavior:'auto'});},{passive:false});
  let drag=null;
  rail.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType==='touch')return;drag={x:e.clientX,left:rail.scrollLeft,moved:false,pointerId:e.pointerId};});
  rail.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5&&!drag.moved){drag.moved=true;try{rail.setPointerCapture?.(drag.pointerId)}catch(_){}}if(drag.moved){e.preventDefault();rail.scrollLeft=drag.left-dx;}},{passive:false});
  const done=()=>{if(drag?.moved){rail.dataset.dragged='1';setTimeout(()=>delete rail.dataset.dragged,0);try{rail.releasePointerCapture?.(drag.pointerId)}catch(_){}}drag=null;};
  rail.addEventListener('pointerup',done);rail.addEventListener('pointercancel',done);rail.addEventListener('lostpointercapture',()=>{drag=null;});
  const active=rail.querySelector('.active');if(active)rail.scrollTo({left:Math.max(0,active.offsetLeft-rail.offsetLeft-(rail.clientWidth-active.clientWidth)/2),behavior:state.reducedMotion?'auto':'smooth'});
}
function bindSettingsNavigation(el){
  $$('.settings-nav-btn',el).forEach(b=>b.onclick=()=>{$$('.settings-nav-btn',el).forEach(x=>x.classList.toggle('active',x===b));const target=$(`#${CSS.escape(b.dataset.target)}`,el);if(target){const scale=el.getBoundingClientRect().width/el.offsetWidth;const top=el.scrollTop+(target.getBoundingClientRect().top-el.getBoundingClientRect().top)/Math.max(.01,scale)-12;el.scrollTo({top,behavior:state.reducedMotion?'auto':'smooth'});}});
}

appRenderers.settings = async el => {if(state.activeApp!=='settings')return;
  if(state.activeApp!=='settings')return;
  const boot=state.phoneBootstrap?{ok:true,data:state.phoneBootstrap}:{ok:false,error:'phone_loading'};
  const ps=boot.ok?(state.phoneBootstrap?.settings||{}):{};
  if(!state.phoneBootstrap){void getPhoneBootstrap().then(()=>{if(state.phoneBootstrap&&state.activeApp==='settings'&&el?.isConnected)appRenderers.settings(el);});}
  const currentWall=$('#screen').dataset.wallpaper||'air-blue';
  const wallpaperCards=WALLPAPER_CHOICES.map(w=>`<button class="wall-card ${currentWall===w.id?'active':''}" data-wall="${w.id}"><span class="wall-preview wall-${w.id}"></span><b>${escapeHtml(w.label)}</b></button>`).join('');
  const themeCards=TABLET_ICON_THEMES.map(t=>{const sub=t.family==='zombie'?'Survival set':(t.family==='custom'?'Signature set':'RS set');const preview=['camera','maps','bank','recon'].map(id=>`<img src="img/icon-themes/${t.id}/${id}.${TABLET_VECTOR_ICONS.has(id)?'svg':'png'}?v=${ICON_THEME_REV}" alt="" draggable="false">`).join('');return `<button class="theme-card ${state.iconTheme===t.id?'active':''}" data-theme="${t.id}"><span class="theme-card-preview">${preview}</span><span class="theme-card-copy"><b>${escapeHtml(t.label)}</b><small>${sub}</small></span></button>`;}).join('');
  const fontCards=TABLET_FONT_STYLES.map(f=>`<button class="font-style-card ${state.fontStyle===f.id?'active':''}" data-font-style="${f.id}"><b>${escapeHtml(f.sample)}</b><span>${escapeHtml(f.label)}</span><small>${escapeHtml(f.desc)}</small></button>`).join('');
  const motionCards=TABLET_MOTION_STYLES.map(m=>`<button class="motion-style-card ${state.motionStyle===m.id?'active':''}" data-motion-style="${m.id}"><span class="motion-demo"><i></i></span><div><b>${escapeHtml(m.label)}</b><small>${escapeHtml(m.desc)}</small></div></button>`).join('');
  const frameCards=TABLET_FRAME_STYLES.map(f=>`<button class="tablet-frame-style-card ${state.frameStyle===f.id?'active':''}" data-frame-style="${f.id}"><div class="tablet-frame-preview">${window.RSTabletFrames.previewMarkup(f.id,state.frameColor,'settings')}</div><b>${escapeHtml(f.label)}</b><span>${escapeHtml(f.desc)}</span></button>`).join('');
  const frameColors=TABLET_FRAME_COLORS.map(c=>`<button class="tablet-frame-color-chip ${state.frameColor===c.id?'active':''}" data-frame-color="${c.id}" title="${escapeHtml(c.label)}" aria-label="${escapeHtml(c.label)}"><span>${escapeHtml(c.label)}</span></button>`).join('');
  const openMotionCards=TABLET_OPEN_MOTIONS.map(m=>`<button class="tablet-open-motion-card ${state.openMotion===m.id?'active':''}" data-open-motion="${m.id}"><b>${escapeHtml(m.label)}</b><small>${escapeHtml(m.desc)}</small></button>`).join('');
  const nav=[['appearance','◫','Appearance'],['frame','▰','Frame'],['typography','Aa','Typography'],['wallpaper','▧','Wallpaper'],['motion','↝','Motion'],['icons','◇','Icons'],['launcher','⌘','Launcher'],['security','⌾','Security'],['media','▶','Media'],['drone','⌁','Drone'],['recon','◎','Recon'],['accessibility','A','Accessibility'],['time-region','◷','Time & Region']];
  el.innerHTML=appHero('Settings','Make it yours. Personalize your shell, your screen and your workspace.')+
    `<div class="settings-workspace"><nav class="settings-nav" aria-label="Settings sections">${nav.map(([id,g,l],i)=>`<button class="settings-nav-btn ${i===0?'active':''}" data-target="settings-${id}"><i>${g}</i><span>${l}</span></button>`).join('')}</nav><div class="settings-sections">`+
    `<section class="setting-group settings-section" id="settings-appearance"><header><span class="settings-section-icon">◫</span><div><h3>Appearance</h3><p>One continuous wallpaper surface across Lock and Home.</p></div></header><div class="appearance-summary"><div><span>Wallpaper</span><b>${escapeHtml(currentWall==='custom'?'Custom Photo':(WALLPAPER_CHOICES.find(w=>w.id===currentWall)?.label||currentWall))}</b></div><div><span>Icon Pack</span><b>${escapeHtml(TABLET_ICON_THEMES.find(t=>t.id===state.iconTheme)?.label||state.iconTheme)}</b></div><div><span>Type</span><b>${escapeHtml(TABLET_FONT_STYLES.find(f=>f.id===state.fontStyle)?.label||state.fontStyle)} • ${state.fontSize}%</b></div><div><span>Motion</span><b>${escapeHtml(TABLET_MOTION_STYLES.find(m=>m.id===state.motionStyle)?.label||state.motionStyle)}</b></div><div><span>Frame</span><b>${escapeHtml(TABLET_FRAME_STYLES.find(f=>f.id===state.frameStyle)?.label||state.frameStyle)} • ${escapeHtml(TABLET_FRAME_COLORS.find(c=>c.id===state.frameColor)?.label||state.frameColor)}</b></div></div></section>`+
    `<section class="setting-group settings-section" id="settings-frame"><header><span class="settings-section-icon">▰</span><div><h3>Tablet Frame</h3><p>${TABLET_FRAME_STYLES.length} shells, ${TABLET_FRAME_COLORS.length} finishes. Every design uses the same display size and position.</p></div></header><div class="tablet-frame-finishbar"><label for="tablet-frame-finish">Shell finish</label><select id="tablet-frame-finish" class="text-input">${TABLET_FRAME_COLORS.map(c=>`<option value="${c.id}" ${state.frameColor===c.id?'selected':''}>${escapeHtml(c.label)}</option>`).join('')}</select></div><details class="tablet-finish-palette"><summary>Browse ${TABLET_FRAME_COLORS.length} finishes</summary><div class="tablet-frame-color-row">${frameColors}</div></details><div class="tablet-frame-style-grid">${frameCards}</div><div class="setting-row"><span>Orientation</span><b>Landscape native</b></div><p>Your apps stay in the same place with every shell.</p></section>`+
    `<section class="setting-group settings-section" id="settings-typography"><header><span class="settings-section-icon">Aa</span><div><h3>Typography</h3><p>Choose a style and size that feels comfortable to read.</p></div></header><div class="setting-row stack"><span>Font family</span><div class="font-style-picker settings-rail">${fontCards}</div></div><div class="font-size-control"><div><span>Text size</span><b id="tablet-font-size-value">${state.fontSize}%</b></div><input id="tablet-font-size" type="range" min="92" max="108" step="2" value="${state.fontSize}"><div class="font-size-ticks"><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span></div><p>Preview your preferred text size. Essential controls stay easy to read.</p></div></section>`+
    `<section class="setting-group settings-section" id="settings-wallpaper"><header><span class="settings-section-icon">▧</span><div><h3>Wallpaper</h3><p>Pick a scene, choose a mood or use your own photo.</p></div></header><div class="wall-grid settings-rail">${wallpaperCards}</div>${state.customWallpaper?`<div class="custom-wallpaper-row"><span class="badge">CUSTOM PHOTO READY</span><button id="tablet-custom-wallpaper" class="secondary-btn">Use Custom Photo</button><button id="tablet-clear-custom-wallpaper" class="secondary-btn">Clear Custom</button></div>`:''}</section>`+
    `<section class="setting-group settings-section" id="settings-motion"><header><span class="settings-section-icon">↝</span><div><h3>Motion</h3><p>Choose how your tablet and apps move. Reduced Motion keeps things quiet.</p></div></header><div class="motion-style-grid">${motionCards}</div><div class="section-label">DEVICE OPENING</div><div class="tablet-open-motion-grid">${openMotionCards}</div></section>`+
    `<section class="setting-group settings-section" id="settings-icons"><header><span class="settings-section-icon">◇</span><div><h3>Icons</h3><p>Ten distinct icon collections to match your screen.</p></div></header><div class="theme-grid">${themeCards}</div></section>`+
    `<section class="setting-group settings-section" id="settings-launcher"><header><span class="settings-section-icon">⌘</span><div><h3>Launcher</h3><p>Flat paged launcher with keyboard command palette.</p></div></header><div class="setting-row"><span>Command Palette</span><div class="button-row"><button id="settings-command-palette" class="secondary-btn">Open Palette</button><span class="badge">CTRL + K</span></div></div><div class="setting-row"><span>Launcher model</span><b>Flat pages • no folders</b></div></section>`+
    `<section class="setting-group settings-section" id="settings-security"><header><span class="settings-section-icon">⌾</span><div><h3>Security</h3><p>Choose how you unlock your tablet. Workspaces appear when you have access.</p></div></header><div class="setting-row"><span>Unlock Method</span><select id="tablet-unlock-method" class="text-input"><option value="swipe" ${state.unlockMethod==='swipe'?'selected':''}>Swipe</option><option value="pulse" ${state.unlockMethod==='pulse'?'selected':''}>RS Pulse ID</option></select></div><div class="setting-row"><span>Builder Tools</span><b>${allApps().some(a=>a.id==='buildertools')?'Installed':'Unavailable'}</b></div></section>`+
    `<section class="setting-group settings-section" id="settings-media"><header><span class="settings-section-icon">▶</span><div><h3>Media</h3><p>Persistent hosted capture architecture and Gallery controls.</p></div></header>${providerBanner(boot?.ok===true)}<div class="button-row"><button id="settings-open-camera" class="secondary-btn">Camera</button><button id="settings-open-gallery" class="secondary-btn">Gallery</button></div></section>`+
    `<section class="setting-group settings-section" id="settings-drone"><header><span class="settings-section-icon">⌁</span><div><h3>Drone</h3><p>Shared provider controls with tablet-sized launch surfaces.</p></div></header><div class="setting-row"><span>Drone sensitivity</span><input id="phone-drone-sens2" type="range" min="50" max="150" value="${Number(ps.droneSensitivity)||100}"></div><div class="setting-row"><span>Invert drone Y</span><input id="phone-drone-invert2" type="checkbox" ${ps.droneInvertY===true?'checked':''}></div><button id="settings-open-drone" class="secondary-btn">Open Drone</button></section>`+
    `<section class="setting-group settings-section" id="settings-recon"><header><span class="settings-section-icon">◎</span><div><h3>Recon</h3><p>Micro-camera command center, CCTV wall and Garage context.</p></div></header><div class="button-row"><button id="settings-open-recon" class="secondary-btn">Recon Center</button><button id="settings-open-cctv" class="secondary-btn">CCTV</button><button id="settings-open-garage" class="secondary-btn">Garage</button></div></section>`+
    `<section class="setting-group settings-section" id="settings-accessibility"><header><span class="settings-section-icon">A</span><div><h3>Accessibility</h3><p>Readable operational typography and motion controls.</p></div></header><div class="setting-row"><span>Reduced motion</span><input id="tablet-reduced-motion" type="checkbox" ${state.reducedMotion?'checked':''}></div><div class="setting-row"><span>Device vibration</span><input id="phone-vibration2" type="checkbox" ${ps.vibration!==false?'checked':''}></div><div class="setting-row"><span>Linked device brightness</span><input id="phone-brightness2" type="range" min="20" max="100" value="${Number(ps.brightness)||76}"></div><div class="setting-row"><span>Linked alert volume</span><input id="phone-volume2" type="range" min="0" max="100" value="${Number(ps.volume)||70}"></div></section>`+
    `<section class="setting-group settings-section" id="settings-time-region"><header><span class="settings-section-icon">◷</span><div><h3>Time & Region</h3><p>Clock preference shared with linked devices when available.</p></div></header><div class="setting-row"><span>24-hour clock</span><input id="phone-24h2" type="checkbox" ${String(ps.timeFormat)==='24'?'checked':''}></div><div class="button-row"><button id="phone-settings-save2" class="primary-btn" ${boot?.ok?'':'disabled'}>Save Shared Preferences</button></div></section>`+
    `<section class="setting-group settings-section settings-device"><header><span class="settings-section-icon">iF</span><div><h3>Device</h3><p>Current runtime and companion status.</p></div></header><div class="setting-row"><span>Model</span><b>${escapeHtml(state.config.device?.Model||state.config.device?.model||'iFruit Pad Pro')}</b></div><div class="setting-row"><span>OS</span><b>${escapeHtml(state.config.device?.OS||state.config.device?.os||'iFruitOS 26')}</b></div><div class="setting-row"><span>Battery</span><b>${Math.round(state.battery)}%</b></div><div class="setting-row"><span>Framework</span><b>${escapeHtml(state.profile?.framework||'standalone')}</b></div><div class="setting-row"><span>Tablet companion</span><b>${boot?.ok?'Connected':'Not detected'}</b></div><div class="setting-row"><span>Emergency network</span><button id="settings-sos" class="danger-btn">Open SOS</button></div></section>`+
    `</div></div>`;

  bindSettingsNavigation(el);bindHorizontalRail('.wall-grid');window.RSTabletFrames?.sync?.();window.RSTabletStudio?.mountSettings?.(el);
  const saveLocal=(key,value)=>{void nui('saveSetting',{key,value}).then(r=>{if(r?.ok!==true)toast('Settings',`Could not persist ${key}.`,'error');});};
  $$('.wall-card',el).forEach(b=>b.onclick=()=>{if(b.closest('.settings-rail')?.dataset.dragged)return;const w=b.dataset.wall;$('#screen').dataset.wallpaper=w;$$('.wall-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();saveLocal('wallpaper',w);});
  $$('.theme-card',el).forEach(b=>b.onclick=()=>{state.iconTheme=validIconTheme(b.dataset.theme||'airglass');$$('.theme-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();renderDesktop();saveLocal('iconTheme',state.iconTheme);});
  $$('.font-style-card',el).forEach(b=>b.onclick=()=>{if(b.closest('.settings-rail')?.dataset.dragged)return;state.fontStyle=validFontStyle(b.dataset.fontStyle);$$('.font-style-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();saveLocal('fontStyle',state.fontStyle);});
  $$('.motion-style-card',el).forEach(b=>b.onclick=()=>{state.motionStyle=validMotionStyle(b.dataset.motionStyle);$$('.motion-style-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();saveLocal('motionStyle',state.motionStyle);});
  $$('.tablet-frame-style-card',el).forEach(b=>b.onclick=()=>{state.frameStyle=validFrameStyle(b.dataset.frameStyle);$$('.tablet-frame-style-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();saveLocal('frameStyle',state.frameStyle);});
  const finish=$('#tablet-frame-finish');
  const chooseFinish=id=>{state.frameColor=validFrameColor(id);finish.value=state.frameColor;$$('.tablet-frame-color-chip',el).forEach(x=>x.classList.toggle('active',x.dataset.frameColor===state.frameColor));applyAppearance();saveLocal('frameColor',state.frameColor);};
  finish.onchange=()=>chooseFinish(finish.value);
  $$('.tablet-frame-color-chip',el).forEach(b=>b.onclick=()=>chooseFinish(b.dataset.frameColor));
  $$('.tablet-open-motion-card',el).forEach(b=>b.onclick=()=>{state.openMotion=validOpenMotion(b.dataset.openMotion);$$('.tablet-open-motion-card',el).forEach(x=>x.classList.toggle('active',x===b));applyAppearance();saveLocal('openMotion',state.openMotion);});
  const unlockMethod=$('#tablet-unlock-method');if(unlockMethod)unlockMethod.onchange=()=>{state.unlockMethod=validUnlockMethod(unlockMethod.value);saveLocal('unlockMethod',state.unlockMethod);toast('Settings',state.unlockMethod==='pulse'?'RS Pulse ID enabled.':'Swipe unlock enabled.','inform');};
  const fontSize=$('#tablet-font-size');if(fontSize){fontSize.oninput=()=>{state.fontSize=Math.max(92,Math.min(108,Number(fontSize.value)||100));$('#tablet-font-size-value').textContent=`${state.fontSize}%`;applyAppearance();};fontSize.onchange=()=>{const value=Math.max(92,Math.min(108,Math.round((Number(fontSize.value)||100)/2)*2));state.fontSize=value;fontSize.value=String(value);applyAppearance();saveLocal('fontSize',String(value));void rpc('tablet.settings.patch',{patch:{fontSize:value}}).then(saved=>{if(saved?.ok!==true&&saved?.error!=='phone_unavailable')toast('Settings','Font size saved locally; shared device storage is unavailable.','inform');});};}
  const reduced=$('#tablet-reduced-motion');if(reduced)reduced.onchange=()=>{state.reducedMotion=reduced.checked;applyAppearance();saveLocal('reducedMotion',state.reducedMotion?'1':'');};
  if($('#tablet-custom-wallpaper'))$('#tablet-custom-wallpaper').onclick=()=>{$('#screen').dataset.wallpaper='custom';applyAppearance();saveLocal('wallpaper','custom');};
  if($('#tablet-clear-custom-wallpaper'))$('#tablet-clear-custom-wallpaper').onclick=()=>{state.customWallpaper='';if($('#screen').dataset.wallpaper==='custom')$('#screen').dataset.wallpaper='air-blue';applyAppearance();saveLocal('customWallpaper','');saveLocal('wallpaper',$('#screen').dataset.wallpaper);};
  $('#settings-command-palette').onclick=()=>window.RSTabletPolish?.openPalette?.();
  $('#settings-open-camera').onclick=()=>openApp('camera');$('#settings-open-gallery').onclick=()=>openApp('gallery');$('#settings-open-drone').onclick=()=>openApp('drone');$('#settings-open-recon').onclick=()=>openApp('recon');$('#settings-open-cctv').onclick=()=>openApp('cctv');$('#settings-open-garage').onclick=()=>openApp('garage');$('#settings-sos').onclick=()=>openApp('sos');
  if($('#phone-settings-save2'))$('#phone-settings-save2').onclick=async()=>{const patch={brightness:Number($('#phone-brightness2').value),volume:Number($('#phone-volume2').value),vibration:$('#phone-vibration2').checked,timeFormat:$('#phone-24h2').checked?'24':'12',droneSensitivity:Number($('#phone-drone-sens2').value),droneInvertY:$('#phone-drone-invert2').checked};const r=await rpc('phone.settings.patch',{patch});if(r?.ok){state.phoneBootstrap.settings=r.data?.settings||state.phoneBootstrap.settings;toast('Settings','Shared RS Tablet preferences saved.','inform');}else toast('Settings',r?.error||'Could not save tablet settings.','error');};
};

async function sendSOS(){if(!confirm('Transmit emergency beacon with your current GTA location?'))return;const r=await nui('sendSOS');if(r.ok)toast('Emergency','SOS transmitted.','emergency');}

function openSheet(id){const el=$(`#${id}`);el.classList.add('open');el.setAttribute('aria-hidden','false');}
function closeSheet(id){const el=$(`#${id}`);el.classList.remove('open');el.setAttribute('aria-hidden','true');}
function toast(title,body,kind='inform'){if(window.RSTabletStudio?.isFocused()&&kind!=='emergency')return;const t=document.createElement('div');t.className=`toast ${kind==='emergency'?'emergency':''}`;t.innerHTML=`<strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p>`;$('#toast-stack').prepend(t);setTimeout(()=>t.remove(),3400);}
function receiveNotification(n){n={title:n.title||'iFruit Tablet',body:n.body||'',kind:n.kind||'inform',time:n.time||Date.now(),meta:n.meta};state.notifications.unshift(n);state.notifications=state.notifications.slice(0,30);window.RSTabletStudio?.syncNotifications();renderNotifications();updateStatus();toast(n.title,n.body,n.kind);}
function renderNotifications(){if(window.RSTabletStudio)return window.RSTabletStudio.syncNotifications();const el=$('#notification-list');if(!state.notifications.length){el.innerHTML='<div class="empty-state">No notifications</div>';return;}el.innerHTML=state.notifications.map(n=>`<div class="notification ${n.kind==='emergency'?'emergency':''}"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.body)}</p></div>`).join('');}


// ---------------------------------------------------------------------------
// Optional RS Tablet/provider shared-surface compatibility
// ---------------------------------------------------------------------------
// The tablet keeps its own presentation, but it must not expose an older subset
// of the authoritative rs-phone feature surface when that provider is running.
// These overrides deliberately call the existing rs-phone request API instead
// of duplicating its server logic.

function tabletConversationMembers(c){
  return Array.isArray(c?.members)?c.members:[];
}

renderConversationMarkup = function(c){
  const msgs=Array.isArray(c.messages)?c.messages:[];
  const group=c.conversation_type==='group';
  const members=tabletConversationMembers(c);
  const peer=c.peer_number||c.newRecipient||'';
  const groupTools=group?`<div class="group-tools"><div class="member-chips">${members.map(m=>`<span class="badge">${escapeHtml(m.display_name||m.phone_number||'Member')}${m.role?` • ${escapeHtml(m.role)}`:''}</span>`).join('')}</div><div class="form-row"><input id="group-add-number2" class="text-input" placeholder="Add active contact number"><button id="group-add2" class="secondary-btn">Add Member</button><button id="group-leave2" class="danger-btn">Leave Group</button></div></div>`:'';
  const blockTools=!group&&peer?`<div class="button-row"><button id="conversation-call2" class="secondary-btn">Call</button><button id="conversation-block2" class="danger-btn">Block Number</button></div>`:'';
  return `<div class="conversation-head"><div><strong>${escapeHtml(c.title||peer||'New Message')}</strong><small>${group?`${members.length} members`:escapeHtml(peer)}</small></div>${blockTools}</div>${groupTools}<div class="message-thread">${msgs.length?msgs.map(m=>`<div class="message-bubble"><small>${escapeHtml(m.sender_number||'')}</small><p>${escapeHtml(m.body||'')}</p>${m.media_url?`<span class="attachment-chip">MEDIA</span>`:''}${m.message_type==='location'?'<span class="attachment-chip">LOCATION</span>':''}<time>${escapeHtml(fmtDate(m.sent_at))}</time></div>`).join(''):'<div class="empty-state">No messages yet.</div>'}</div><div class="message-compose"><textarea id="conversation-message" class="text-input" placeholder="Message"></textarea><select id="conversation-media" class="text-input"><option value="">No attachment</option>${shareableMediaOptions()}</select><button id="share-location" class="secondary-btn">Share Location</button><button id="send-conversation" class="primary-btn">Send</button></div>`;
};

bindConversationActions = function(el,skin){
  const c=state.activeConversation;if(!c||!$('#send-conversation'))return;
  $('#send-conversation').onclick=async()=>{const body=$('#conversation-message').value.trim(),mediaUrl=$('#conversation-media').value;const payload={body,mediaUrl};if(c.conversation_id)payload.conversationId=c.conversation_id;else payload.recipientNumber=c.newRecipient;if(!body&&!mediaUrl)return;const r=await phoneRequest('sendMessage',payload);if(!r?.ok)return toast('Messages',r?.error||'Send failed.','error');const cid=r.data?.conversation?.conversation_id||r.data?.conversationId||c.conversation_id;if(cid){const fresh=await phoneRequest('getConversation',{conversationId:cid});if(fresh?.ok)state.activeConversation=fresh.data;}renderMessagesApp(el,skin);};
  $('#share-location').onclick=async()=>{const payload=c.conversation_id?{conversationId:c.conversation_id}:{recipientNumber:c.newRecipient};const r=await phoneRequest('shareLocation',payload);if(!r?.ok)return toast('Messages',r?.error||'Could not share location.','error');toast('Messages','Location shared.','inform');};
  if($('#conversation-call2'))$('#conversation-call2').onclick=()=>phoneRequest('startCall',{number:c.peer_number||c.newRecipient,video:false});
  if($('#conversation-block2'))$('#conversation-block2').onclick=async()=>{if(!confirm(`Block ${c.peer_number||c.newRecipient}? Calls and direct messages from this number will be rejected.`))return;const r=await phoneRequest('blockNumber',{number:c.peer_number||c.newRecipient});if(r?.ok)toast('Messages','Number blocked.','inform');else toast('Messages',r?.error||'Could not block number.','error');};
  if($('#group-add2'))$('#group-add2').onclick=async()=>{const number=$('#group-add-number2').value.trim();if(!number)return;const r=await phoneRequest('addGroupMember',{conversationId:c.conversation_id,number});if(!r?.ok)return toast('Messages',r?.error||'Could not add member.','error');state.activeConversation=r.data?.conversation||state.activeConversation;toast('Messages','Member added.','inform');renderMessagesApp(el,skin);};
  if($('#group-leave2'))$('#group-leave2').onclick=async()=>{if(!confirm('Leave this group conversation?'))return;const r=await phoneRequest('leaveGroup',{conversationId:c.conversation_id});if(!r?.ok)return toast('Messages',r?.error||'Could not leave group.','error');state.activeConversation=null;toast('Messages','You left the group.','inform');renderMessagesApp(el,skin);};
};

renderMessagesApp = async function(el,skin='messages'){
  const [list,blocked]=await Promise.all([phoneRequest('getAppData',{}),phoneRequest('getBlockedNumbers',{})]);
  if(!list?.ok){el.innerHTML=appHero(skin==='survivorchat'?'Chat':'Messages','RS Tablet conversations.')+providerBanner(false);return;}
  const convs=list.data?.conversations||[];const active=state.activeConversation;const blockedRows=blocked?.data?.blocked||[];
  el.innerHTML=appHero(skin==='survivorchat'?'Chat':'Messages','Direct messages, group conversations, attachments, shared locations and blocking — synced with RS Tablet.')+providerBanner(true)+
  `<div class="message-layout"><aside class="conversation-list"><div class="message-new"><input id="new-msg-number" class="text-input" placeholder="Contact number"><button id="new-msg-start" class="primary-btn">Direct</button><button id="new-group-start2" class="secondary-btn">Group</button></div><button id="blocked-toggle2" class="secondary-btn" style="width:100%;margin-bottom:10px">Blocked Numbers (${blockedRows.length})</button><div id="blocked-list2" class="data-list hidden">${blockedRows.map(x=>`<div class="list-row"><div class="grow"><strong>${escapeHtml(x.blocked_number||'')}</strong><small>${escapeHtml(fmtDate(x.created_at))}</small></div><button class="secondary-btn unblock2" data-num="${escapeHtml(x.blocked_number||'')}">Unblock</button></div>`).join('')||'<div class="empty-state">No blocked numbers.</div>'}</div>${convs.map(c=>`<button class="conversation-row ${active?.conversation_id===c.conversation_id?'active':''}" data-cid="${escapeHtml(c.conversation_id)}"><strong>${escapeHtml(c.display_name||c.title||c.peer_number||'Conversation')}</strong><span>${escapeHtml(c.last_message||'')}</span><small>${c.conversation_type==='group'?'GROUP • ':''}${c.unread?`${c.unread} unread • `:''}${escapeHtml(fmtDate(c.last_time))}</small></button>`).join('')}</aside><section id="conversation-pane" class="conversation-pane">${active?renderConversationMarkup(active):'<div class="empty-state">Choose a conversation, start a direct message, or create a group.</div>'}</section></div>`;
  $$('.conversation-row').forEach(b=>b.onclick=async()=>{const r=await phoneRequest('getConversation',{conversationId:b.dataset.cid});if(r?.ok){state.activeConversation=r.data;renderMessagesApp(el,skin);}else toast('Messages',r?.error||'Conversation unavailable.','error');});
  $('#new-msg-start').onclick=()=>{const number=$('#new-msg-number').value.trim();if(!number)return;state.activeConversation={newRecipient:number,title:'New Message',conversation_type:'direct',messages:[]};renderMessagesApp(el,skin);};
  $('#new-group-start2').onclick=async()=>{const raw=prompt('Active contact numbers, separated by commas');if(!raw)return;const title=prompt('Group title','Group Chat')||'Group Chat';const members=raw.split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean);const r=await phoneRequest('createGroup',{title,members});if(!r?.ok)return toast('Messages',r?.error||'Group creation failed.','error');state.activeConversation=r.data?.conversation||null;toast('Messages','Group created.','inform');renderMessagesApp(el,skin);};
  $('#blocked-toggle2').onclick=()=>$('#blocked-list2').classList.toggle('hidden');
  $$('.unblock2').forEach(b=>b.onclick=async()=>{const r=await phoneRequest('unblockNumber',{number:b.dataset.num});if(!r?.ok)return toast('Messages',r?.error||'Could not unblock.','error');toast('Messages','Number unblocked.','inform');renderMessagesApp(el,skin);});
  bindConversationActions(el,skin);
};

// Opening Tablet Email should clear the same email-notification unread state as
// opening Email on the phone. The actual mailbox read state still belongs to
// rs-phone and getEmail.
const tabletEmailRendererV056=appRenderers.email;
appRenderers.email=async el=>{if(state.activeApp!=='email')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='email'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  await phoneRequest('markEmailNotificationsRead',{});if(!isCurrentRender())return;
  return tabletEmailRendererV056(el);
};

// Delete one's own threaded replies, matching the current phone content API.
async function tabletRenderReplyThread(host,parentType,parentId){
  const r=await phoneRequest('getContentReplies',{parentType,parentId});
  if(!r?.ok){host.innerHTML=`<div class="empty-state">${escapeHtml(r?.error||'Replies unavailable.')}</div>`;return;}
  const rows=r.data?.replies||[];
  host.innerHTML=rows.map(q=>`<div class="thread-reply"><b>${escapeHtml(q.author_name||'Citizen')}</b><span>${escapeHtml(q.body||'')}</span>${q.is_mine?`<button class="danger-btn thread-delete2" data-id="${escapeHtml(q.reply_id)}">Delete</button>`:''}</div>`).join('')||'<div class="empty-state">No replies.</div>';
  $$('.thread-delete2',host).forEach(b=>b.onclick=async()=>{if(!confirm('Delete this reply?'))return;const x=await phoneRequest('deleteContentReply',{parentType,parentId,replyId:b.dataset.id});if(!x?.ok)return toast('Replies',x?.error||'Delete failed.','error');tabletRenderReplyThread(host,parentType,parentId);});
}

const tabletCommunityRendererV056=appRenderers.community;
appRenderers.community=async el=>{if(state.activeApp!=='community')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='community'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  await tabletCommunityRendererV056(el);if(!isCurrentRender())return;
  $$('.community-thread',el).forEach(b=>b.onclick=()=>tabletRenderReplyThread($(`#thread-${CSS.escape(b.dataset.id)}`),PHONE_COMMUNITY_PARENT,b.dataset.id));
};

const tabletNewsRendererV056=appRenderers.news;
appRenderers.news=async el=>{if(state.activeApp!=='news')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='news'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  await tabletNewsRendererV056(el);if(!isCurrentRender())return;
  $$('.news-thread2',el).forEach(b=>b.onclick=()=>tabletRenderReplyThread($(`#news-thread-${CSS.escape(b.dataset.id)}`),'news',b.dataset.id));
};

// rs-phone 4.9.x owns the full live Recon brain. The tablet mirrors scout/fleet
// controls and provides a clean handoff into that same authoritative Drone &
// Recon surface instead of shipping an older parallel recon state machine.
const tabletDroneRendererV056=appRenderers.drone;
appRenderers.drone=async el=>{if(state.activeApp!=='drone')return;
  const renderTicket=(el._rsRenderTicket||0)+1;el._rsRenderTicket=renderTicket;
  const isCurrentRender=()=>state.activeApp==='drone'&&el._rsRenderTicket===renderTicket&&el.isConnected;

  await tabletDroneRendererV056(el);if(!isCurrentRender())return;
  const status=await rpc('phone.drone.status');if(!isCurrentRender())return;
  const pd=status?.data||{};
  const host=$('#phone-drone-card');
  if(host){const combo=document.createElement('div');combo.className='button-row';combo.style.marginTop='10px';combo.innerHTML='<button id="drone-cctv-open2" class="secondary-btn">Open CCTV</button><button id="drone-dispatch-open2" class="secondary-btn">Dispatch</button>';host.appendChild(combo);$('#drone-cctv-open2').onclick=()=>openApp('cctv');$('#drone-dispatch-open2').onclick=()=>openApp('dispatch');}
  if(pd.reconAvailable&&host){
    const row=document.createElement('div');row.className='button-row';row.style.marginTop='10px';
    row.innerHTML=`<button id="phone-recon-open2" class="secondary-btn">${pd.reconActive?'Return to Active Recon':'Open Advanced Drone & Recon'}</button>`;
    host.appendChild(row);
    $('#phone-recon-open2').onclick=async()=>{const r=await rpc('phone.recon.open');if(!r?.ok)toast('Recon',r?.error||'Recon handoff failed.','error');};
  }
};

function bindUI(){
 $('#unlock-btn').onclick=unlock;$('#hardware-power').onclick=closeTablet;$('#app-close').onclick=closeTablet;$('#app-home').onclick=home;$('#app-back').onclick=()=>window.RSTabletOS?.back?.()||home();
 $('#status-left').onclick=()=>openSheet('notifications');$('#status-right').onclick=()=>openSheet('control-center');$$('[data-close-sheet]').forEach(b=>b.onclick=()=>closeSheet(b.dataset.closeSheet));
 $('#comms-widget').onclick=()=>openApp('comms');$('#scanner-widget').onclick=()=>openApp('scanner');$('#app-grid').addEventListener('wheel',e=>{if(!$('#desktop').classList.contains('active'))return;if(Math.abs(e.deltaY)<8&&Math.abs(e.deltaX)<8)return;e.preventDefault();changeHomePage((e.deltaY||e.deltaX)>0?1:-1);},{passive:false});$('#cc-comms').onclick=()=>{closeSheet('control-center');openApp('comms')};$('#cc-scanner').onclick=()=>{closeSheet('control-center');openApp('scanner')};$('#cc-camera').onclick=()=>{closeSheet('control-center');openApp('camera')};$('#cc-drone').onclick=()=>{closeSheet('control-center');openApp('drone')};$('#cc-cctv').onclick=()=>{closeSheet('control-center');openApp('cctv')};$('#cc-dispatch').onclick=()=>{closeSheet('control-center');openApp('dispatch')};$('#cc-sos').onclick=sendSOS;
 $('#brightness').oninput=e=>{document.documentElement.style.setProperty('--brightness',Number(e.target.value)/100)};$('#ui-scale').oninput=e=>{document.documentElement.style.setProperty('--tablet-scale',Number(e.target.value)/100)};$('#app-search').onclick=()=>window.RSTabletPolish?.openPalette?.();const statusCenter=$('#status-center')||$('.status-center');if(statusCenter)statusCenter.onclick=()=>window.RSTabletPolish?.openPalette?.();
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();window.RSTabletPolish?.openPalette?.();return;}if($('#desktop').classList.contains('active')&&(e.key==='ArrowRight'||e.key==='PageDown')){changeHomePage(1);return;}if($('#desktop').classList.contains('active')&&(e.key==='ArrowLeft'||e.key==='PageUp')){changeHomePage(-1);return;}if(e.key==='Escape'){if($('.sheet.open')){$$('.sheet.open').forEach(s=>s.classList.remove('open'));return;}if(state.activeApp){if(!window.RSTabletOS?.back?.())home();return;}closeTablet();}});
}

async function bootstrapSettings(){
  const [w,t,rm,f,ms,cw,fs,fc,om,um,deviceSettings]=await Promise.all([
    nui('loadSetting',{key:'wallpaper'}),nui('loadSetting',{key:'iconTheme'}),nui('loadSetting',{key:'reducedMotion'}),
    nui('loadSetting',{key:'fontStyle'}),nui('loadSetting',{key:'motionStyle'}),nui('loadSetting',{key:'customWallpaper'}),
    nui('loadSetting',{key:'frameStyle'}),nui('loadSetting',{key:'frameColor'}),nui('loadSetting',{key:'openMotion'}),nui('loadSetting',{key:'unlockMethod'}),rpc('tablet.settings.get')
  ]);
  if(w?.value)$('#screen').dataset.wallpaper=w.value;if(t?.value)state.iconTheme=validIconTheme(t.value);state.reducedMotion=String(rm?.value||'')==='1';if(f?.value)state.fontStyle=validFontStyle(f.value);if(ms?.value)state.motionStyle=validMotionStyle(ms.value);if(cw?.value)state.customWallpaper=String(cw.value).slice(0,2048);if(fs?.value)state.frameStyle=validFrameStyle(fs.value);if(fc?.value)state.frameColor=validFrameColor(fc.value);if(om?.value)state.openMotion=validOpenMotion(om.value);if(um?.value)state.unlockMethod=validUnlockMethod(um.value);
  const serverSize=Number(deviceSettings?.data?.settings?.fontSize);if(Number.isFinite(serverSize)&&serverSize>=92&&serverSize<=108)state.fontSize=Math.round(serverSize/2)*2;else{const localSize=await nui('loadSetting',{key:'fontSize'});const n=Number(localSize?.value);if(Number.isFinite(n)&&n>=92&&n<=108)state.fontSize=Math.round(n/2)*2;}
  applyAppearance();
}

const INTERNAL_TOOL_IDS={devtool:'internal-devtool'};
function setInternalTool(moduleName, visible){
  const host=$('#internal-tool-host'); if(!host)return;
  const id=INTERNAL_TOOL_IDS[moduleName];
  Object.values(INTERNAL_TOOL_IDS).forEach(fid=>{const frame=$('#'+fid);if(frame)frame.classList.toggle('active',visible&&fid===id);});
  host.classList.toggle('active',visible===true);host.setAttribute('aria-hidden',visible?'false':'true');
}
function routeInternalToolMessage(m){
  if(!m||m.action!=='internalModuleMessage')return false;
  const moduleName=String(m.module||'');const payload=m.payload||{};const frame=$('#'+(INTERNAL_TOOL_IDS[moduleName]||''));
  if(!frame)return true;
  const opening=payload.action==='open';
  const closing=payload.action==='close';
  if(opening){showStage(false);setInternalTool(moduleName,true);}
  try{frame.contentWindow?.postMessage(payload,'*');}catch(_e){}
  if(closing)setTimeout(()=>setInternalTool(moduleName,false),0);
  return true;
}

function applyOpen(data){
  const nextOpenId=String(data.openId||'');
  // Lua may resend the same envelope while waiting for the paint ACK. Never
  // replay the entrance animation or rebuild the whole desktop for the same
  // open. Replaying it can keep opacity/transform at the animation start and
  // prevent the ACK forever.
  if(state.open&&nuiOpenId&&nextOpenId===nuiOpenId){acknowledgePaint(nextOpenId);return;}
  nuiOpenId=nextOpenId;setInternalTool('',false);state.config=data.config||state.config;state.battery=Number(data.battery??state.battery);state.currentChannel=Number(data.currentChannel??0);state.native=data.native||state.native||demoNative;state.externalApps=data.externalApps||{};$('#os-label').textContent=(state.config.device?.OS||state.config.device?.os||'iFruitOS 26');showStage(true);lock();renderDesktop();updateNative(state.native);updateStatus();void bootstrapSettings();void refreshProviders();void refreshIntegrations();applyAppearance();acknowledgePaint(nuiOpenId);
}

function tabletIsVisible(){
  if(!state.open||$('#stage').hidden)return false;
  return ['#stage','#tablet','#screen'].every(selector=>{
    const el=$(selector);if(!el)return false;
    const style=getComputedStyle(el),r=el.getBoundingClientRect();
    // Opacity is intentionally ignored here. Entrance animations begin at
    // opacity:0, but the NUI is still valid and should be allowed to acquire
    // focus. Display/visibility and a real on-screen box are the render proof.
    return style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;
  });
}
let paintAckToken=0;
function acknowledgePaint(openId){
  const token=++paintAckToken;
  const attempt=(remaining)=>{
    if(token!==paintAckToken||openId!==nuiOpenId||!state.open)return;
    requestAnimationFrame(()=>{
      if(token!==paintAckToken||openId!==nuiOpenId||!state.open)return;
      if(tabletIsVisible())return void nui('nuiOpened',{visible:true,openId});
      if(remaining>0)return setTimeout(()=>attempt(remaining-1),90);
      void nui('nuiBootError',{message:'Tablet open produced no visible device after layout retries.'});
    });
  };
  attempt(5);
}

window.addEventListener('message',e=>{
 const m=e.data||{};if(routeInternalToolMessage(m))return;const d=m.data;
 if(m.action==='open'){try{applyOpen(d||{});}catch(error){void nui('nuiBootError',{message:String(error?.stack||error).slice(0,600)});showStage(false);}}
 else if(m.action==='nuiProbe')void nui('nuiProbeResult',{openId:nuiOpenId,probeId:d?.probeId,visible:tabletIsVisible()});
 else if(m.action==='close')showStage(false);
 else if(m.action==='profile'){state.profile=d;/* server-filtered app list wins over the shared catalogue */if(Array.isArray(d&&d.apps))state.config.apps=d.apps;updateStatus();renderDesktop();if(state.activeApp==='comms')openApp('comms');}
 else if(m.action==='battery'){state.battery=Number(d?.value??state.battery);updateStatus();}
 else if(m.action==='native'){updateNative(d);}
 else if(m.action==='notification')receiveNotification(d||{});
 else if(m.action==='scannerResult'){state.lastScan=d||null;renderScannerWidget();if(state.activeApp==='scanner')appRenderers.scanner($('#app-content'));}
 else if(m.action==='commEvent'){
   const ev={...(d||{})};state.dispatchEvents=[ev,...(state.dispatchEvents||[]).filter(x=>x.id!==ev.id)].slice(0,50);
   if(state.activeApp==='dispatch')openApp('dispatch');
 }
 else if(m.action==='sos')receiveNotification({title:'Emergency Alert',body:`${d?.name||'Unknown'} • ${d?.street||'Location unavailable'}`,kind:'emergency',meta:d});
 else if(m.action==='commsState'){state.currentChannel=Number(d?.channel||0);state.currentChannelLabel=d?.label||'Off Air';updateStatus();renderCommsWidget();if(state.activeApp==='comms')openApp('comms');}
 else if(m.action==='integrationsChanged'){if(state.open)void refreshIntegrations();}
 else if(m.action==='externalApps'){state.externalApps=d||{};renderDesktop();}
 else if(m.action==='openApp')openApp(d?.id,d?.payload);
 else if(m.action==='phoneBootstrap'){state.phoneBootstrap=d||null;state.phoneBootstrapAt=Date.now();}
 else if(m.action==='phoneBootstrapInvalidated'){state.phoneBootstrap=null;state.phoneBootstrapAt=0;}
 else if(m.action==='phoneMediaBlob'){
   const id=String(d?.mediaId||'');if(id&&d?.dataUrl){state.mediaCache.set(id,d.dataUrl);state.mediaPending.delete(id);refreshMediaNodes(id,d.dataUrl);}
 }
 else if(m.action==='phoneMediaUnavailable'){const id=String(d?.mediaId||'');state.mediaPending.delete(id);$$(`[data-media-id="${CSS.escape(id)}"]`).forEach(n=>{n.innerHTML='<span>MEDIA UNAVAILABLE</span>';});}
 else if(m.action==='phoneMediaResult'){
   state.phoneBootstrap=null;state.phoneBootstrapAt=0;
   if((d?.ok||d?.success)&&d?.media){state.pendingLatestMediaId=mediaId(d.media)||null;toast('Camera',d?.message||'Saved to Photos.','inform');}
   if(state.activeApp==='gallery')setTimeout(()=>{gallerySelectedId=state.pendingLatestMediaId||gallerySelectedId;state.pendingLatestMediaId=null;openApp('gallery');},220);
   else if(state.activeApp==='camera')setTimeout(()=>openApp('camera'),220);
 }
 else if(m.action==='phoneMediaCapabilities'){if(state.phoneBootstrap)state.phoneBootstrap.camera={...(state.phoneBootstrap.camera||{}),...(d||{})};}
 else if(m.action==='phoneAppChanged'){
   const app=String(d?.app||'');
   const aliases={chirp:'community',community:'community',garage:'garage',bank:'bank',messages:'messages',survivorchat:'survivorchat',email:'email',reminders:'reminders',houses:'houses',maps:'maps',sos:'sos',racing:'racing',market:'market'};
   const target=aliases[app];
   if(state.activeApp&&target===state.activeApp){
     clearTimeout(phoneAppRefreshTimers.get(target));
     phoneAppRefreshTimers.set(target,setTimeout(()=>{phoneAppRefreshTimers.delete(target);if(state.activeApp===target)openApp(target);},350));
   }
 }
 else if(m.action==='phoneCallState'){
   state.callState=d||null;
   if(d?.phase==='incoming')toast(d?.call?.video?'Incoming Video Call':'Incoming Call',d?.call?.otherName||d?.call?.otherNumber||'Unknown','inform');
   if(state.activeApp==='phone'||state.activeApp==='videocall')openApp(state.activeApp);
 }
 else if(m.action==='phoneCallRecording'){
   if(state.callState?.call&&String(state.callState.call.callId||'')===String(d?.callId||''))state.callState.call.recorded=d?.recording===true;
   if(state.activeApp==='phone'||state.activeApp==='videocall')openApp(state.activeApp);
 }
 else if(m.action==='tabletVideoCallStarted'){clearTabletVideoFrames();}
 else if(m.action==='tabletVideoCallFrame'){applyTabletVideoFrame(String(d?.kind||''),String(d?.data||''));}
 else if(m.action==='tabletVideoCallStopped'){clearTabletVideoFrames();}
 else if(m.action==='tabletCameraState'){state.cameraState={...state.cameraState,...(d||{})};}
});

// The resource is closed until Lua explicitly sends { action: 'open' }.
// This also protects against a stale DOM restored by Chromium.
$('#app-shell').addEventListener('animationend',e=>{if(e.target.id==='app-shell'&&e.animationName==='rsTabletAppOpen'){clearTimeout(appOpeningTimer);e.target.classList.remove('app-opening');}});
window.RSTabletCore={openApp,home,lock,unlock,closeTablet,allApps,toast,getState:()=>state,renderDesktop,renderAppTile,applyAppearance,nui,rpc,receiveNotification,updateStatus,openSheet,closeSheet};
showStage(false);

let nuiReadyAnnounced=false;
async function announceNuiReady(){
  const result=await nui('nuiReady');
  if(result?.ok)nuiReadyAnnounced=true;
}
// Announce readiness before binding optional controls. If a future cosmetic
// binding throws, Lua still knows whether the core page is alive and can release
// focus instead of trapping the player behind an invisible NUI.
void announceNuiReady();
try{bindUI();}catch(error){
  console.error('[rs-tablet] NUI bind failed',error);
  void nui('nuiBootError',{message:String(error?.stack||error||'bind_failed').slice(0,600)});
}
void Promise.all([nui('loadSetting',{key:'openMotion'}),nui('loadSetting',{key:'frameStyle'}),nui('loadSetting',{key:'frameColor'}),nui('loadSetting',{key:'unlockMethod'})]).then(([om,fs,fc,um])=>{if(om?.value)state.openMotion=validOpenMotion(om.value);if(fs?.value)state.frameStyle=validFrameStyle(fs.value);if(fc?.value)state.frameColor=validFrameColor(fc.value);if(um?.value)state.unlockMethod=validUnlockMethod(um.value);applyAppearance();});
setInterval(()=>{if(!nuiReadyAnnounced)void announceNuiReady();else void nui('nuiHeartbeat',{openId:nuiOpenId,visible:tabletIsVisible()});},2000);
setInterval(updateClocks,1000);
if(demo){
 state.profile=demoProfile;
 state.providers={phone:{available:true},radio:{available:true},pager:{available:true}};
 setTimeout(()=>applyOpen({config:{device:{Name:'iFruit Tablet',OS:'iFruitOS 26',Model:'iFruit Pad Pro'},apps:DEMO_APPS,games:['Neon Snake','Signal Breaker','Memory Matrix','Grid Shift','Minefield','Pulse Tap','Code Sprint','Lane Runner','Brick Breaker','Vector Pong','Asteroid Dodge','Reaction Grid']},battery:86,currentChannel:101,native:window.RSTabletPreview.native}),60);
 state.currentChannelLabel='LSPD Dispatch';
}
})();
