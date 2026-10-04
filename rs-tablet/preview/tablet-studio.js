/* RS Tablet Studio. Original interface; existing providers retain authority. */
(() => {
'use strict';
const core=window.RSTabletCore, $=s=>document.querySelector(s), screen=$('#screen');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utilityApps=[{id:'clock',label:'Clock',icon:'clock',category:'utility'},{id:'calendar',label:'Calendar',icon:'calendar',category:'utility'},{id:'compass',label:'Compass',icon:'compass',category:'utility'},{id:'files',label:'Files',icon:'files',category:'utility'}];
const glyphs={clock:'◷',calendar:'▦',compass:'➤',files:'▱'};
let prefs={mode:'light',mood:'neutral',focus:false,widgets:true,brightness:100,volume:65,order:[],hidden:[]},events=[],files=[],alarms=[],editing=false,dragId=null,longPress=null,flashlight=false;
let stopwatch={running:false,started:0,elapsed:0,laps:[]},timer={deadline:0,paused:0},clockTab='timer',selectedDate=dateKey(new Date()),month=new Date(new Date().getFullYear(),new Date().getMonth(),1),activeFile=null;
const renderers={};
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function uid(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);}
function dataLimit(key){return {studioPreferences:8192,studioCalendar:24576,studioFiles:49152,studioAlarms:4096}[key]||256;}
const saveQueue=new Map();
async function save(key,value){
 const json=JSON.stringify(value);if(new TextEncoder().encode(json).length>dataLimit(key)){core.toast('Storage','This collection is full. Remove an item before adding more.','inform');return false;}
 const previous=saveQueue.get(key)||Promise.resolve();const job=previous.catch(()=>{}).then(()=>core.nui('saveSetting',{key,value:json}));saveQueue.set(key,job);
 const r=await job;if(saveQueue.get(key)===job)saveQueue.delete(key);if(!r?.ok){core.toast('Storage','Could not save changes.','error');return false;}return true;
}
function apply(){
 screen.dataset.displayMode=prefs.mode==='dark'?'dark':'light';screen.dataset.displayMood=prefs.mood;screen.dataset.homeWidgets=String(prefs.widgets);screen.dataset.focus=String(prefs.focus);
 screen.style.setProperty('--studio-brightness',String(Math.max(35,Math.min(100,Number(prefs.brightness)||100))/100));
 $('#brightness').value=String(prefs.brightness);$('#studio-volume').value=String(prefs.volume);
 for(const id of ['mode','focus','widgets']){const b=$('#studio-'+id);b.classList.toggle('selected',id==='mode'?prefs.mode==='dark':!!prefs[id]);b.setAttribute('aria-pressed',String(id==='mode'?prefs.mode==='dark':!!prefs[id]));}
}
function persistPrefs(){apply();syncDisplaySettings();void save('studioPreferences',prefs);}
function isHidden(id){return Array.isArray(prefs.hidden)&&prefs.hidden.includes(id);}
function homeOrder(){return prefs.order.length?prefs.order:null;}
function setEditing(value){editing=value;screen.classList.toggle('editing-home',editing);$('#studio-edit').textContent=editing?'Done':'Arrange';if(!editing)void save('studioPreferences',prefs);}
function bindTile(tile,app,dock){
 if(dock)return;
 tile.draggable=true;
 tile.addEventListener('pointerdown',e=>{if(e.button!==0)return;clearTimeout(longPress);longPress=setTimeout(()=>setEditing(true),650);});
 for(const type of ['pointerup','pointercancel','pointerleave'])tile.addEventListener(type,()=>clearTimeout(longPress));
 tile.addEventListener('dragstart',e=>{clearTimeout(longPress);setEditing(true);dragId=app.id;e.dataTransfer?.setData('text/plain',app.id);tile.classList.add('dragging');});
 tile.addEventListener('dragover',e=>{if(dragId){e.preventDefault();tile.classList.add('drop-target');}});
 tile.addEventListener('dragleave',()=>tile.classList.remove('drop-target'));
 tile.addEventListener('drop',e=>{e.preventDefault();tile.classList.remove('drop-target');if(!dragId||dragId===app.id)return;const ids=currentOrder();const from=ids.indexOf(dragId),to=ids.indexOf(app.id);if(from<0||to<0)return;ids.splice(from,1);ids.splice(to,0,dragId);prefs.order=ids;core.renderDesktop();persistPrefs();});
 tile.addEventListener('dragend',()=>{dragId=null;tile.classList.remove('dragging');});
}
function currentOrder(){const ids=core.allApps().map(a=>a.id);const shown=[...document.querySelectorAll('#app-grid [data-app]')].map(a=>a.dataset.app);return [...new Set([...prefs.order,...shown,...ids])].filter(id=>ids.includes(id));}
function syncNotifications(){
 const rows=core.getState().notifications||[];
 for(const selector of ['#notification-list','#studio-lock-notices']){
  const host=$(selector);if(!host)continue;const subset=selector.includes('lock')?rows.slice(0,3):rows;
  host.innerHTML=subset.length?subset.map((n,i)=>`<button class="studio-notice ${n.kind==='emergency'?'emergency':''}" data-notice="${i}"><header><strong>${esc(n.title)}</strong><time>${new Date(n.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></header><p>${esc(n.body)}</p></button>`).join(''):(selector.includes('lock')?'':'<p class="empty-state">You’re all caught up.</p>');
  host.querySelectorAll('[data-notice]').forEach(b=>b.onclick=()=>{const n=rows[Number(b.dataset.notice)],id=n?.meta?.app;if(id&&core.allApps().some(a=>a.id===id)){if(core.getState().locked){core.unlock();setTimeout(()=>{if(core.getState().open&&!core.getState().locked)core.openApp(id);},600);}else core.openApp(id);core.closeSheet('notifications');}});
 }
}
function actionButton(id,label,fn){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;b.onclick=fn;return b;}
async function toggleFlashlight(){const next=!flashlight,r=await core.nui('studioFlashlight',{enabled:next});if(!r?.ok)return core.toast('Flashlight','The light is unavailable.','error');flashlight=next;for(const b of document.querySelectorAll('[data-studio-flashlight]')){b.classList.toggle('selected',flashlight);b.setAttribute('aria-pressed',String(flashlight));}}
const launcher=$('.launcher-bar');launcher.firstElementChild.textContent='';launcher.append(actionButton('studio-edit','Arrange',()=>setEditing(!editing)));
const lockActions=document.createElement('div');lockActions.className='studio-lock-actions';const torch=actionButton('studio-lock-flashlight','☀',toggleFlashlight);torch.dataset.studioFlashlight='';torch.setAttribute('aria-label','Flashlight');const camera=actionButton('studio-lock-camera','◫',()=>{core.unlock();setTimeout(()=>{if(core.getState().open&&!core.getState().locked)core.openApp('camera');},600);});camera.setAttribute('aria-label','Camera');lockActions.append(torch,camera);$('#lockscreen').append(lockActions);
const lockNotices=document.createElement('div');lockNotices.id='studio-lock-notices';$('#lockscreen').append(lockNotices);
const clear=actionButton('studio-clear-notices','Clear all',()=>{core.getState().notifications=[];core.updateStatus();syncNotifications();});$('#notifications .sheet-title').append(clear);
const quick=document.createElement('div');quick.className='studio-quick-controls';quick.innerHTML=`<button id="studio-mode" aria-pressed="false">◐<b>Dark mode</b></button><button id="studio-focus" aria-pressed="false">☾<b>Focus</b></button><button id="studio-widgets" aria-pressed="false">▦<b>Widgets</b></button><button id="studio-quick-light" data-studio-flashlight aria-pressed="false">☀<b>Flashlight</b></button><button id="studio-lock">⌾<b>Lock</b></button><button id="studio-motion">↝<b>Reduce motion</b></button>`;
$('#control-center .control-grid').before(quick);
for(const id of ['mode','focus','widgets'])$('#studio-'+id).onclick=()=>{if(id==='mode')prefs.mode=prefs.mode==='dark'?'light':'dark';else prefs[id]=!prefs[id];persistPrefs();};
$('#studio-quick-light').onclick=toggleFlashlight;
$('#studio-lock').onclick=()=>{core.closeSheet('control-center');core.lock();};
$('#studio-motion').onclick=()=>{const s=core.getState();s.reducedMotion=!s.reducedMotion;core.applyAppearance();$('#studio-motion').setAttribute('aria-pressed',String(s.reducedMotion));$('#studio-motion').classList.toggle('selected',s.reducedMotion);void core.nui('saveSetting',{key:'reducedMotion',value:s.reducedMotion?'1':''});};
const volume=document.createElement('label');volume.className='slider-row';volume.innerHTML='<span>Alert volume</span><input id="studio-volume" aria-label="Alert volume" type="range" min="0" max="100" value="65">';$('#control-center .sensor-strip').before(volume);
$('#studio-volume').oninput=e=>{prefs.volume=Number(e.target.value);};$('#studio-volume').onchange=persistPrefs;
$('#brightness').min='35';$('#brightness').max='100';$('#brightness').oninput=e=>{prefs.brightness=Number(e.target.value);apply();syncDisplaySettings();};$('#brightness').onchange=persistPrefs;
// Gesture handling is limited to glass edges, leaving forms, maps and games alone.
let swipe=null;
screen.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=screen.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;const edge=y<.065?(x>.72?'control-center':x<.28?'notifications':null):y>.975?'home':null;if(edge)swipe={id:e.pointerId,x:e.clientX,y:e.clientY,edge};});
screen.addEventListener('pointerup',e=>{if(!swipe||e.pointerId!==swipe.id)return;const g=swipe;swipe=null;const dy=e.clientY-g.y;if(g.edge==='home'&&dy<-30&&!core.getState().locked){setEditing(false);core.home();}else if(g.edge!=='home'&&dy>30)core.openSheet(g.edge);});screen.addEventListener('pointercancel',()=>swipe=null);
$('#desktop .home-indicator').addEventListener('click',()=>{setEditing(false);core.lock();});$('#app-shell .home-indicator').addEventListener('click',()=>core.home());
let pageSwipe=null;$('#app-grid').addEventListener('pointerdown',e=>{if(!editing&&e.button===0)pageSwipe={x:e.clientX,y:e.clientY};});$('#app-grid').addEventListener('pointerup',e=>{if(!pageSwipe)return;const dx=e.clientX-pageSwipe.x,dy=e.clientY-pageSwipe.y;pageSwipe=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*2){const dots=[...document.querySelectorAll('.home-page-dot')],i=dots.findIndex(b=>b.classList.contains('active'));dots[Math.max(0,Math.min(dots.length-1,i+(dx<0?1:-1)))]?.click();}});
function refresh(id,el){if(core.getState().activeApp===id&&core.getState().open&&el.isConnected)renderers[id](el);}
function title(text,sub,actions=''){return `<div class="studio-title"><div><h2>${esc(text)}</h2><p>${esc(sub)}</p></div>${actions}</div>`;}
function catalog(){return core.allApps();}
renderers.store=el=>{
 const list=catalog(),order=currentOrder();el.innerHTML=title('App Library','Choose what appears on Home. Your apps and data stay available.')+`<input id="studio-app-search" class="text-input" placeholder="Search apps" aria-label="Search apps"><div class="studio-app-list">${list.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).map(a=>`<div class="studio-app-row" data-row="${esc(a.id)}"><div class="grow"><strong>${esc(a.label)}</strong><small>${esc(a.category||'app')}</small></div><button class="secondary-btn studio-launch" data-id="${esc(a.id)}">Open</button><button class="secondary-btn studio-up" data-id="${esc(a.id)}" aria-label="Move ${esc(a.label)} earlier">↑</button><button class="secondary-btn studio-down" data-id="${esc(a.id)}" aria-label="Move ${esc(a.label)} later">↓</button><label class="studio-switch">On Home<input class="studio-visible" type="checkbox" data-id="${esc(a.id)}" ${isHidden(a.id)?'':'checked'}></label></div>`).join('')}</div>`;
 el.querySelectorAll('.studio-launch').forEach(b=>b.onclick=()=>core.openApp(b.dataset.id));
 el.querySelectorAll('.studio-visible').forEach(b=>b.onchange=()=>{prefs.hidden=prefs.hidden.filter(id=>id!==b.dataset.id);if(!b.checked)prefs.hidden.push(b.dataset.id);core.renderDesktop();persistPrefs();});
 for(const [cls,delta] of [['.studio-up',-1],['.studio-down',1]])el.querySelectorAll(cls).forEach(b=>b.onclick=()=>{const ids=currentOrder(),i=ids.indexOf(b.dataset.id),j=i+delta;if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];prefs.order=ids;persistPrefs();core.renderDesktop();renderers.store(el);});
 $('#studio-app-search').oninput=e=>el.querySelectorAll('[data-row]').forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(e.target.value.toLowerCase());});
};
function timeString(ms){const s=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function elapsed(){return stopwatch.elapsed+(stopwatch.running?performance.now()-stopwatch.started:0);}
renderers.clock=el=>{
 el.innerHTML=title('Clock','Keep time, set a countdown or schedule an alarm.')+`<div class="segmented">${['timer','stopwatch','alarms'].map(t=>`<button data-clock-tab="${t}" class="${clockTab===t?'active':''}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div><div id="studio-clock-body"></div>`;
 el.querySelectorAll('[data-clock-tab]').forEach(b=>b.onclick=()=>{clockTab=b.dataset.clockTab;renderers.clock(el);});const body=$('#studio-clock-body');
 if(clockTab==='timer'){
  body.innerHTML='<div id="studio-time-readout" class="studio-time-readout">00:00:00</div><div class="studio-clock-form"><label>Minutes<input id="studio-minutes" class="text-input" type="number" min="0" max="1440" value="5"></label><label>Seconds<input id="studio-seconds" class="text-input" type="number" min="0" max="59" value="0"></label></div><div class="button-row"><button id="studio-timer-start" class="primary-btn">Start / Resume</button><button id="studio-timer-pause" class="secondary-btn">Pause</button><button id="studio-timer-reset" class="secondary-btn">Reset</button></div><p class="studio-footnote">Countdowns continue while this UI session is running. Restarting the resource clears them.</p>';
  $('#studio-timer-start').onclick=()=>{if(timer.deadline)return;const min=Number($('#studio-minutes').value),sec=Number($('#studio-seconds').value);if(!Number.isFinite(min)||!Number.isFinite(sec)||min<0||min>1440||sec<0||sec>59)return core.toast('Timer','Choose 0–1440 minutes and 0–59 seconds.','error');const duration=timer.paused||Math.round((min*60+sec)*1000);if(duration<=0)return;timer.deadline=Date.now()+duration;timer.paused=0;tick();};
  $('#studio-timer-pause').onclick=()=>{if(timer.deadline){timer.paused=Math.max(0,timer.deadline-Date.now());timer.deadline=0;}tick();};$('#studio-timer-reset').onclick=()=>{timer={deadline:0,paused:0};tick();};
 }else if(clockTab==='stopwatch'){
  body.innerHTML='<div id="studio-time-readout" class="studio-time-readout">00:00:00</div><div class="button-row"><button id="studio-watch-toggle" class="primary-btn">'+(stopwatch.running?'Pause':'Start')+'</button><button id="studio-watch-lap" class="secondary-btn">Lap</button><button id="studio-watch-reset" class="secondary-btn">Reset</button></div><div id="studio-laps" class="data-list"></div>';
  $('#studio-watch-toggle').onclick=()=>{if(stopwatch.running){stopwatch.elapsed=elapsed();stopwatch.running=false;}else{stopwatch.started=performance.now();stopwatch.running=true;}$('#studio-watch-toggle').textContent=stopwatch.running?'Pause':'Start';};
  $('#studio-watch-lap').onclick=()=>{if(stopwatch.laps.length<100)stopwatch.laps.unshift(elapsed());drawLaps();};$('#studio-watch-reset').onclick=()=>{stopwatch={running:false,started:0,elapsed:0,laps:[]};renderers.clock(el);};drawLaps();
 }else{
  body.innerHTML=`<div class="studio-clock-form"><label>Time<input id="studio-alarm-time" type="time" class="text-input" value="09:00"></label><label>Label<input id="studio-alarm-label" class="text-input" maxlength="80" placeholder="Appointment"></label><button id="studio-alarm-add" class="primary-btn">Add daily alarm</button></div><div class="data-list">${alarms.map(a=>`<div class="studio-app-row"><strong>${esc(a.time)}</strong><span class="grow">${esc(a.label)}</span><input type="checkbox" class="studio-alarm-enabled" data-id="${esc(a.id)}" ${a.enabled?'checked':''} aria-label="Enable ${esc(a.label)}"><button class="secondary-btn studio-alarm-delete" data-id="${esc(a.id)}">Remove</button></div>`).join('')||'<p class="empty-state">No alarms yet.</p>'}</div><p class="studio-footnote">Uses your computer’s local clock; alarms sound while this resource is running.</p>`;
  $('#studio-alarm-add').onclick=async()=>{const time=$('#studio-alarm-time').value;if(!/^\d{2}:\d{2}$/.test(time)||alarms.length>=20)return;const next=[...alarms,{id:uid(),time,label:$('#studio-alarm-label').value.trim().slice(0,80)||'Alarm',enabled:true,lastDay:''}];if(await save('studioAlarms',next)){alarms=next;refresh('clock',el);}};
  el.querySelectorAll('.studio-alarm-enabled').forEach(b=>b.onchange=()=>{const a=alarms.find(a=>a.id===b.dataset.id);if(a){a.enabled=b.checked;void save('studioAlarms',alarms);}});
  el.querySelectorAll('.studio-alarm-delete').forEach(b=>b.onclick=async()=>{const next=alarms.filter(a=>a.id!==b.dataset.id);if(await save('studioAlarms',next)){alarms=next;refresh('clock',el);}});
 }tick();
};
function drawLaps(){const host=$('#studio-laps');if(host)host.innerHTML=stopwatch.laps.map((ms,i)=>`<div class="studio-app-row"><span>Lap ${stopwatch.laps.length-i}</span><b>${timeString(ms)}</b></div>`).join('');}
let audio=null;
function chime(){if(prefs.focus||!prefs.volume)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();void audio.resume();const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.value=660;gain.gain.setValueAtTime(prefs.volume/100*.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.8);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.8);}catch(_){}}
function alertUser(title,body){core.receiveNotification({title,body,meta:{app:'clock'}});chime();}
function tick(){
 if(timer.deadline&&Date.now()>=timer.deadline){timer={deadline:0,paused:0};alertUser('Timer finished','Your countdown is complete.');}
 const now=new Date(),today=dateKey(now),hhmm=now.toTimeString().slice(0,5);let fired=false;
 for(const a of alarms)if(a.enabled&&a.time===hhmm&&a.lastDay!==today){a.lastDay=today;fired=true;alertUser('Alarm',a.label||'Daily alarm');}if(fired)void save('studioAlarms',alarms);
 if(core.getState().activeApp==='clock'){const readout=$('#studio-time-readout');if(readout)readout.textContent=timeString(clockTab==='stopwatch'?elapsed():timer.deadline?timer.deadline-Date.now():timer.paused);}
 if(core.getState().activeApp==='compass')drawCompass();
}
renderers.calendar=el=>{
 const year=month.getFullYear(),m=month.getMonth(),start=new Date(year,m,1).getDay(),days=new Date(year,m+1,0).getDate();
 el.innerHTML=title('Calendar',month.toLocaleDateString(undefined,{month:'long',year:'numeric'}),'<div class="button-row"><button id="studio-month-prev" class="secondary-btn" aria-label="Previous month">‹</button><button id="studio-month-today" class="secondary-btn">Today</button><button id="studio-month-next" class="secondary-btn" aria-label="Next month">›</button></div>')+`<div class="studio-calendar-layout"><div class="studio-calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<b>${d}</b>`).join('')}${Array(start).fill('<span></span>').join('')}${Array.from({length:days},(_,i)=>{const date=dateKey(new Date(year,m,i+1)),count=events.filter(x=>x.date===date).length;return `<button data-day="${date}" class="${date===selectedDate?'selected':''} ${date===dateKey(new Date())?'today':''}">${i+1}${count?'<i></i>':''}</button>`;}).join('')}</div><section class="studio-agenda"><h3>${esc(selectedDate)}</h3><div class="form-grid"><input id="studio-event-title" class="text-input" maxlength="100" placeholder="Event title"><input id="studio-event-time" type="time" class="text-input" value="12:00"><button id="studio-event-add" class="primary-btn">Add event</button></div><div class="data-list">${events.filter(x=>x.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time)).map(x=>`<div class="studio-app-row"><div class="grow"><strong>${esc(x.title)}</strong><small>${esc(x.time)}</small></div><button class="secondary-btn studio-event-remove" data-id="${esc(x.id)}">Remove</button></div>`).join('')||'<p class="empty-state">Nothing scheduled.</p>'}</div><p class="studio-footnote">Personal planner stored on this client. It is separate from your server’s job records.</p></section></div>`;
 $('#studio-month-prev').onclick=()=>{month=new Date(year,m-1,1);renderers.calendar(el);};$('#studio-month-next').onclick=()=>{month=new Date(year,m+1,1);renderers.calendar(el);};$('#studio-month-today').onclick=()=>{month=new Date();selectedDate=dateKey(month);renderers.calendar(el);};el.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.day;renderers.calendar(el);});
 $('#studio-event-add').onclick=async()=>{const title=$('#studio-event-title').value.trim(),time=$('#studio-event-time').value;if(!title||!/^\d{2}:\d{2}$/.test(time)||events.length>=100)return;const next=[...events,{id:uid(),date:selectedDate,time,title:title.slice(0,100)}];if(await save('studioCalendar',next)){events=next;refresh('calendar',el);}};
 el.querySelectorAll('.studio-event-remove').forEach(b=>b.onclick=async()=>{const next=events.filter(x=>x.id!==b.dataset.id);if(await save('studioCalendar',next)){events=next;refresh('calendar',el);}});
};
renderers.compass=el=>{el.innerHTML=title('Compass','Your live heading and position.')+'<div class="studio-compass"><div class="studio-compass-ring"><span>N</span><i id="studio-compass-needle"></i></div><strong id="studio-compass-heading"></strong><p id="studio-compass-position"></p></div>';drawCompass();};
function drawCompass(){const n=core.getState().native||{},h=((Number(n.heading)||0)%360+360)%360;const needle=$('#studio-compass-needle');if(needle)needle.style.transform=`rotate(${-h}deg)`;const text=$('#studio-compass-heading');if(text)text.textContent=`${Math.round(h)}° · ${['N','NW','W','SW','S','SE','E','NE'][Math.round(h/45)%8]}`;const pos=$('#studio-compass-position');if(pos)pos.textContent=[n.street,n.zone,n.coords?`${Number(n.coords.x).toFixed(1)}, ${Number(n.coords.y).toFixed(1)}`:''].filter(Boolean).join(' · ');}
renderers.files=el=>{
 const f=files.find(x=>x.id===activeFile);el.innerHTML=title('Files','Your personal text documents.', '<button id="studio-file-new" class="primary-btn">New document</button>')+`<div class="studio-files-layout"><aside class="studio-file-list">${files.map(x=>`<button data-file="${esc(x.id)}" class="${f?.id===x.id?'selected':''}"><strong>${esc(x.title)}</strong><small>${new Date(x.updated).toLocaleDateString()}</small></button>`).join('')||'<p class="empty-state">No documents yet.</p>'}</aside><section>${f?`<input id="studio-file-title" class="text-input" maxlength="80" value="${esc(f.title)}" aria-label="Document title"><textarea id="studio-file-body" class="textarea" maxlength="8000" aria-label="Document content">${esc(f.body)}</textarea><div class="button-row"><button id="studio-file-save" class="primary-btn">Save document</button><button id="studio-file-remove" class="danger-btn">Remove</button></div>`:'<p class="empty-state">Choose a document or create one.</p>'}<p class="studio-footnote">Stored on this client. These documents are personal notes, not signed or shared server records.</p></section></div>`;
 $('#studio-file-new').onclick=async()=>{if(files.length>=20)return core.toast('Files','Maximum 20 documents.','inform');const next=[...files,{id:uid(),title:'Untitled',body:'',updated:Date.now()}];if(await save('studioFiles',next)){files=next;activeFile=next.at(-1).id;refresh('files',el);}};
 el.querySelectorAll('[data-file]').forEach(b=>b.onclick=()=>{activeFile=b.dataset.file;renderers.files(el);});
 if(f){$('#studio-file-save').onclick=async()=>{const next=files.map(x=>x.id===f.id?{...x,title:$('#studio-file-title').value.trim().slice(0,80)||'Untitled',body:$('#studio-file-body').value.slice(0,8000),updated:Date.now()}:x);if(await save('studioFiles',next)){files=next;core.toast('Files','Document saved.');refresh('files',el);}};$('#studio-file-remove').onclick=async()=>{if(!confirm('Remove this personal document?'))return;const next=files.filter(x=>x.id!==f.id);if(await save('studioFiles',next)){files=next;activeFile=null;refresh('files',el);}};}
};
const moods=[['neutral','Neutral','Quiet and balanced'],['ocean','Ocean','Cool blue calm'],['sunset','Sunset','Warm rose light'],['forest','Forest','Soft green focus'],['noir','Noir','Muted monochrome']];
function syncDisplaySettings(){
 const range=$('#tablet-display-brightness');if(range)range.value=String(prefs.brightness);
 const output=$('#tablet-display-brightness-value');if(output)output.textContent=prefs.brightness+'%';
 document.querySelectorAll('[data-display-choice]').forEach(b=>{const active=b.dataset.displayChoice===prefs.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 document.querySelectorAll('[data-mood-choice]').forEach(b=>{const active=b.dataset.moodChoice===prefs.mood;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
function updateTypePreview(){
 const sample=$('#tablet-type-sample');if(!sample)return;
 sample.style.setProperty('--sample-font',getComputedStyle(screen).fontFamily);
 const s=core.getState(),selected=document.querySelector('.font-style-card.active>span');
 $('#tablet-type-caption').textContent=(selected?.textContent||s.fontStyle)+' · '+s.fontSize+'%';
 document.querySelectorAll('.font-style-card').forEach(b=>{
   // The descriptive labels remain neutral; the large sample shows the real font.
   const ruleFont=getComputedStyle(b).fontFamily;b.querySelector('b').style.setProperty('font-family',ruleFont,'important');
 });
}
function mountSettings(el){
 const appearance=el.querySelector('#settings-appearance');
 if(appearance&&!appearance.querySelector('.tablet-display-settings')){
  const host=document.createElement('div');host.className='tablet-display-settings';
  host.innerHTML=`<div class="display-mode-picker" aria-label="Display appearance"><button data-display-choice="light"><span class="display-mode-sample light"></span><b>Light</b><small>Clear, bright surfaces</small></button><button data-display-choice="dark"><span class="display-mode-sample dark"></span><b>Dark</b><small>Comfort after hours</small></button></div><label class="display-brightness-row" for="tablet-display-brightness"><div><b>Tablet brightness</b><output id="tablet-display-brightness-value">${prefs.brightness}%</output></div><input id="tablet-display-brightness" type="range" min="35" max="100" step="1" value="${prefs.brightness}"><small>Dim the display while keeping the shell’s finish natural.</small></label><div class="display-mood-heading"><b>Display mood</b><span>A palette for your workspace</span></div><div class="display-mood-picker">${moods.map(([id,label,desc])=>`<button data-mood-choice="${id}" title="${desc}"><i></i><b>${label}</b></button>`).join('')}</div>`;
  appearance.querySelector('header').after(host);
  host.querySelectorAll('[data-display-choice]').forEach(b=>b.onclick=()=>{prefs.mode=b.dataset.displayChoice;persistPrefs();});
  host.querySelectorAll('[data-mood-choice]').forEach(b=>b.onclick=()=>{prefs.mood=b.dataset.moodChoice;persistPrefs();});
  const brightness=host.querySelector('input');brightness.oninput=()=>{prefs.brightness=Number(brightness.value);apply();syncDisplaySettings();};brightness.onchange=persistPrefs;
 }
 const typography=el.querySelector('#settings-typography');
 if(typography&&!typography.querySelector('.tablet-type-preview')){
  const host=document.createElement('div');host.className='tablet-type-preview';
  host.innerHTML='<div class="type-preview-heading"><b>Live text preview</b><span id="tablet-type-caption"></span></div><div id="tablet-type-sample"><strong>Make yourself at home.</strong><p id="tablet-type-body">Your next idea belongs here. Messages, plans and everyday moments should feel easy to read.</p><span>0123456789 · Aa Bb Cc · Welcome 👋</span></div><label for="tablet-type-input">Try your own words<input id="tablet-type-input" class="text-input" maxlength="180" placeholder="Type a message to preview your font"></label>';
  typography.querySelector('header').after(host);
  host.querySelector('input').oninput=e=>{$('#tablet-type-body').textContent=e.target.value||'Your next idea belongs here. Messages, plans and everyday moments should feel easy to read.';};
  // Keep size and preview together; font choices remain immediately below.
  const size=typography.querySelector('.font-size-control');
  const family=typography.querySelector('.setting-row.stack');
  const workspace=document.createElement('div');workspace.className='tablet-type-workspace';
  const preview=document.createElement('div');preview.className='tablet-type-preview-column';
  host.before(workspace);preview.append(host);if(size)preview.append(size);workspace.append(preview);if(family)workspace.append(family);
 }
 syncDisplaySettings();updateTypePreview();
}
// Settings uses one selected pane rather than a long wall of controls.
const appContent=$('#app-content');
function selectSettings(id='settings-appearance'){
 if(core.getState().activeApp!=='settings')return;
 appContent.querySelectorAll('.settings-section').forEach(section=>{section.hidden=section.id!==id;});
 appContent.querySelectorAll('.settings-nav-btn').forEach(button=>{const active=button.dataset.target===id;button.classList.toggle('active',active);button.setAttribute('aria-current',String(active));});
 appContent.scrollTop=0;
}
appContent.addEventListener('click',e=>{const button=e.target.closest('.settings-nav-btn');if(button)selectSettings(button.dataset.target);},true);
new MutationObserver(()=>{if(core.getState().activeApp==='settings'&&appContent.querySelector('.settings-section')&&!appContent.querySelector('.settings-section[hidden]'))selectSettings();}).observe(appContent,{childList:true});
window.RSTabletStudio={mountSettings,updateTypePreview,utilityApps,renderers,isHidden,homeOrder,bindTile,onOpen:()=>setEditing(false),isEditing:()=>editing,isFocused:()=>prefs.focus,syncNotifications};
apply();syncNotifications();
// One long-lived ticker; app switches never create another timer.
setInterval(tick,250);
async function init(){
 const keys=['studioPreferences','studioCalendar','studioFiles','studioAlarms'];const results=await Promise.all(keys.map(key=>core.nui('loadSetting',{key})));
 const parsed=results.map(r=>{try{return JSON.parse(r?.value||'null');}catch(_){return null;}});
 if(parsed[0]&&typeof parsed[0]==='object'&&!Array.isArray(parsed[0]))prefs={...prefs,...parsed[0]};
 prefs.mode=prefs.mode==='dark'?'dark':'light';prefs.mood=moods.some(m=>m[0]===prefs.mood)?prefs.mood:'neutral';prefs.brightness=Math.max(35,Math.min(100,Number(prefs.brightness)||100));prefs.volume=Math.max(0,Math.min(100,Number(prefs.volume)||0));
 prefs.order=Array.isArray(prefs.order)?prefs.order.filter(x=>typeof x==='string').slice(0,100):[];prefs.hidden=Array.isArray(prefs.hidden)?prefs.hidden.filter(x=>typeof x==='string').slice(0,100):[];
 events=Array.isArray(parsed[1])?parsed[1].filter(x=>x&&typeof x.id==='string'&&typeof x.date==='string'&&typeof x.time==='string'&&typeof x.title==='string').slice(0,100):[];
 files=Array.isArray(parsed[2])?parsed[2].filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&typeof x.body==='string').slice(0,20):[];
 alarms=Array.isArray(parsed[3])?parsed[3].filter(x=>x&&typeof x.id==='string'&&typeof x.time==='string').slice(0,20):[];
 apply();core.renderDesktop();
}
void init();
})();
