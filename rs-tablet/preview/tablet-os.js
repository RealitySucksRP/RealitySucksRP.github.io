/* Tablet navigation and gesture layer. Core owns app/provider and NUI contracts. */
(() => {
  'use strict';
  const screen=document.getElementById('screen'),tablet=document.getElementById('tablet'),library=document.getElementById('app-library');
  const core=()=>window.RSTabletCore,state=()=>core()?.getState(),history=[],recent=[];

  const apps=()=> (core()?.allApps()||[]);
  let suppressedUntil=0,gesture=null;
  function resize(){
    const density=Math.max(1,Math.min(2,innerWidth/1920,innerHeight/1080));
    document.documentElement.style.setProperty('--tablet-device-scale',String(density));
    if(tablet.clientWidth){const scale=tablet.clientWidth*.895709/1100;const value=scale.toFixed(5);if(screen.style.getPropertyValue('--tablet-ui-scale')!==value)screen.style.setProperty('--tablet-ui-scale',value);}
  }
  function resetRoot(){for(const el of [screen,tablet,document.getElementById('stage'),document.getElementById('desktop'),document.getElementById('app-shell')]){if(el.scrollTop)el.scrollTop=0;if(el.scrollLeft)el.scrollLeft=0;}}
  function closeLibrary(){if(!library.hidden)library.hidden=true;if(library.contains(document.activeElement))document.activeElement.blur();}
  function sync(){
    const s=state();if(!s)return;const value=String(s.locked);if(screen.dataset.locked!==value)screen.dataset.locked=value;
    tablet.classList.toggle('reduced-motion',!!s.reducedMotion);
    if(s.locked||!s.open)closeLibrary();if(!s.activeApp)history.length=0;
    document.querySelectorAll('#dock [data-app]').forEach(b=>b.classList.toggle('running',b.dataset.app===s.activeApp));resetRoot();
  }
  function visit(id,previous,options={}){if(previous&&previous!==id&&options.history!==false)history.push(previous);if(history.length>12)history.shift();if(apps().some(a=>a.id===id)){const old=recent.indexOf(id);if(old>=0)recent.splice(old,1);recent.unshift(id);recent.splice(6);} }
  function back(){while(history.length){const id=history.pop();if(apps().some(a=>a.id===id)){core().openApp(id,undefined,{history:false});return true;}}return false;}
  function makeTile(app){return core().renderAppTile(app);}
  function renderLibrary(){
    const q=document.getElementById('library-search').value.trim().toLowerCase(),catalog=apps();
    const list=document.getElementById('library-apps');list.replaceChildren();
    catalog.filter(a=>!q||String(a.label||a.id).toLowerCase().includes(q)).forEach(a=>list.append(makeTile(a)));
    if(!list.childElementCount){const empty=document.createElement('p');empty.className='empty-state';empty.textContent='No matching apps';list.append(empty);}
    const r=document.getElementById('library-recents');r.replaceChildren();
    if(!q&&recent.length){const label=document.createElement('h3');label.textContent='Recently opened';r.append(label);const row=document.createElement('div');row.className='library-recent-row';recent.map(id=>catalog.find(a=>a.id===id)).filter(Boolean).forEach(a=>row.append(makeTile(a)));r.append(row);}
  }
  function openLibrary(){if(!state()?.open||state()?.locked)return;renderLibrary();library.hidden=false;document.getElementById('library-search').focus({preventScroll:true});resetRoot();}
  function dockControls(dock){for(const [label,glyph,action] of [['Home','⌂',()=>core().home()],['App Library','▦',openLibrary]]){const b=document.createElement('button');b.type='button';b.className='dock-system';b.setAttribute('aria-label',label);b.title=label;b.innerHTML='<span aria-hidden="true">'+glyph+'</span>';b.onclick=action;dock.append(b);}}
  document.getElementById('launcher-library').onclick=openLibrary;
  document.getElementById('library-close').onclick=closeLibrary;
  document.getElementById('library-search').addEventListener('input',renderLibrary);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!library.hidden){e.preventDefault();e.stopImmediatePropagation();closeLibrary();}},true);
  screen.addEventListener('scroll',e=>{if([screen,tablet,document.getElementById('desktop'),document.getElementById('app-shell')].includes(e.target))resetRoot();},true);
  const lock=document.getElementById('lockscreen'),home=document.getElementById('desktop'),unlock=document.getElementById('unlock-btn');
  function clearPreview(){home.classList.remove('unlock-preview');if(state()?.locked)home.classList.remove('active');lock.style.removeProperty('--swipe-y');lock.style.removeProperty('--swipe-opacity');lock.classList.remove('swiping');}
  unlock.addEventListener('click',e=>{if(performance.now()<suppressedUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  unlock.addEventListener('pointerdown',e=>{if(!state()?.locked||e.button!==0)return;gesture={id:e.pointerId,y:e.clientY,distance:0};unlock.setPointerCapture(e.pointerId);lock.classList.add('swiping');});
  unlock.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const scale=screen.getBoundingClientRect().height/screen.offsetHeight;gesture.distance=Math.max(0,(gesture.y-e.clientY)/scale);if(gesture.distance>6){home.classList.add('active','unlock-preview');lock.style.setProperty('--swipe-y',-gesture.distance+'px');lock.style.setProperty('--swipe-opacity',String(Math.max(.25,1-gesture.distance/420)));}});
  function endGesture(e,cancel=false){if(!gesture||gesture.id!==e.pointerId)return;const d=gesture.distance;gesture=null;if(d>6)suppressedUntil=performance.now()+650;if(!cancel&&d>=44){home.classList.remove('unlock-preview');lock.classList.remove('swiping');core().unlock();}else clearPreview();}
  unlock.addEventListener('pointerup',e=>endGesture(e));unlock.addEventListener('pointercancel',e=>endGesture(e,true));
  // Do not observe #tablet while resize() writes sizing CSS back into it.
  // That creates a ResizeObserver feedback loop in FiveM CEF and can make the
  // NUI continuously reflow/flicker. Viewport resize is the authoritative
  // input; coalesce it to one animation frame.
  let resizeFrame=0;
  function scheduleResize(){
    if(resizeFrame)return;
    resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize();});
  }
  window.addEventListener('resize',scheduleResize,{passive:true});
  window.RSTabletOS={resize:scheduleResize,sync,visit,back,dockControls,openLibrary,closeLibrary,clearHistory:()=>{history.length=0;gesture=null;clearPreview();}};
  scheduleResize();sync();
})();
