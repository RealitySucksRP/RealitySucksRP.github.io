/* RS Tablet 0.8.0 — emoji composer + command palette.
   Intentionally standalone so the core tablet remains usable if this optional
   polish layer ever fails to load. */
(() => {
  'use strict';
  const screen = document.getElementById('screen');
  if (!screen) return;

  const groups = {
    Faces:['😀','😃','😄','😁','😂','🤣','😊','🙂','😉','😍','🥰','😘','😎','🤔','😮','😢','😭','😡','🤬','🥳','😴','🤯','🤫','🫡','🥶','🤢','😇','🙃'],
    Gestures:['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','👏','🙌','🙏','🤝','💪','👀','🫶','❤️','💔','💯','🔥','✨','⭐','✅','❌','👊','🖐️','☝️','🫵'],
    City:['🚗','🏎️','🚓','🚑','🚒','🚁','🏍️','🚲','⛽','🏠','🏢','🏥','🏦','🔑','📍','🗺️','🚨','⚠️','🚧','🅿️','🚦','🛣️','🏁','🌆','🌴','🌉','🏖️','✈️'],
    Media:['📱','📞','💬','✉️','📧','📷','📸','🎥','📹','🎬','🎙️','🎧','📻','🎵','🎶','🔊','🔔','📡','💻','🖥️','⌚','🔋','💾','📎','🛰️','🎮','🕹️','📺'],
    RP:['💀','☠️','👻','🧟','🤡','😈','🕵️','👮','👨‍⚕️','👩‍⚕️','🧑‍🔧','🧑‍💼','🧑‍🚒','🔒','🔓','💊','🩹','🧪','📦','📋','📝','❓','❗','💼','🚔','🚑','🛡️','🪪'],
    Survival:['🧟','🧟‍♂️','🧟‍♀️','🩸','☣️','☢️','🧪','🧬','🩹','⛑️','🥫','🥤','💧','🔥','🔦','🗡️','🪓','🏚️','⛺','🧭','📻','🧰','🧱','🚧','🌫️','🌧️','🌙','🆘'],
    Tools:['🔧','🔨','🛠️','🧰','⚙️','🪛','🪚','🔩','⛓️','🧲','🔌','🔋','💡','🧯','📏','📐','🪜','🧹','🧽','🪠','🔬','🧪','🛰️','📡','🖥️','⌨️','🖱️','💾'],
    Life:['💰','💵','💳','🛒','🛍️','🎁','🍕','🍔','🌮','🍟','☕','🥤','🍺','🎉','🎂','⚽','🏀','🎮','🎲','💎','☀️','🌙','🌧️','🌴','🐶','🐱','🎵','🏆'],
    Symbols:['✅','❌','⚠️','🚨','❗','❓','➕','➖','➡️','⬅️','⬆️','⬇️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','♻️','🔁','🔒','🔓','📌','📍','💲','©️']
  };

  /* Emoji composer ------------------------------------------------------- */
  const trigger=document.createElement('button');trigger.type='button';trigger.className='rs-emoji-trigger';trigger.title='Emoji';trigger.setAttribute('aria-label','Open emoji picker');trigger.textContent='☺';
  const panel=document.createElement('div');panel.className='rs-emoji-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Emoji picker');panel.innerHTML='<div class="rs-emoji-head"><strong>Emoji</strong><button class="rs-emoji-close" type="button" aria-label="Close emoji picker">×</button></div><div class="rs-emoji-tabs"></div><div class="rs-emoji-grid"></div>';
  screen.append(trigger,panel);
  const tabs=panel.querySelector('.rs-emoji-tabs'),grid=panel.querySelector('.rs-emoji-grid');let target=null,activeGroup='Faces';
  Object.keys(groups).forEach(name=>{const b=document.createElement('button');b.type='button';b.className='rs-emoji-tab';b.dataset.emojiGroup=name;b.textContent=name;tabs.appendChild(b)});
  function renderEmojiGroup(name){activeGroup=groups[name]?name:'Faces';tabs.querySelectorAll('.rs-emoji-tab').forEach(b=>b.classList.toggle('active',b.dataset.emojiGroup===activeGroup));grid.innerHTML=groups[activeGroup].map(e=>`<button type="button" class="rs-emoji" data-emoji="${e}" aria-label="Insert ${e}">${e}</button>`).join('')}
  renderEmojiGroup(activeGroup);
  function validTarget(el){return el instanceof HTMLTextAreaElement&&!el.disabled&&!el.readOnly&&!!el.closest('.view.active')}
  function positionEmoji(){if(!target||!target.isConnected||!target.closest('.view.active')){if(trigger.classList.contains('visible'))trigger.classList.remove('visible');return}const sr=screen.getBoundingClientRect(),r=target.getBoundingClientRect();if(r.width<30||r.height<24||r.bottom<sr.top||r.top>sr.bottom){if(trigger.classList.contains('visible'))trigger.classList.remove('visible');return}const sx=sr.width/Math.max(1,screen.offsetWidth),sy=sr.height/Math.max(1,screen.offsetHeight);const right=(r.right-sr.left)/Math.max(.01,sx),bottom=(r.bottom-sr.top)/Math.max(.01,sy);trigger.style.left=`${Math.max(8,Math.min(screen.offsetWidth-40,right-37))}px`;trigger.style.top=`${Math.max(42,Math.min(screen.offsetHeight-74,bottom-36))}px`;if(!trigger.classList.contains('visible'))trigger.classList.add('visible')}
  function setTarget(el){if(target&&target!==el)target.classList.remove('rs-emoji-target');target=validTarget(el)?el:null;if(target)target.classList.add('rs-emoji-target');positionEmoji()}
  function closeEmoji(refocus=false){if(panel.classList.contains('open'))panel.classList.remove('open');trigger.setAttribute('aria-expanded','false');if(refocus&&target)target.focus({preventScroll:true})}
  function insertEmoji(emoji){if(!target||!target.isConnected)return;const start=Number.isFinite(target.selectionStart)?target.selectionStart:target.value.length,end=Number.isFinite(target.selectionEnd)?target.selectionEnd:start,max=Number(target.maxLength);let value=emoji;if(max>=0){const capacity=Math.max(0,max-(target.value.length-(end-start)));if(capacity<=0)return;value='';for(const symbol of Array.from(emoji)){if(value.length+symbol.length>capacity)break;value+=symbol;}}if(typeof target.setRangeText==='function')target.setRangeText(value,start,end,'end');else target.value=`${target.value.slice(0,start)}${value}${target.value.slice(end)}`;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));target.focus({preventScroll:true});positionEmoji()}
  screen.addEventListener('focusin',e=>{if(validTarget(e.target))setTarget(e.target)});screen.addEventListener('scroll',positionEmoji,true);window.addEventListener('resize',positionEmoji);
  trigger.addEventListener('pointerdown',e=>e.preventDefault());trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!target)return;const open=!panel.classList.contains('open');panel.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open))});
  panel.querySelector('.rs-emoji-close').onclick=()=>closeEmoji(true);tabs.onclick=e=>{const b=e.target.closest('[data-emoji-group]');if(b)renderEmojiGroup(b.dataset.emojiGroup)};grid.addEventListener('pointerdown',e=>e.preventDefault());grid.onclick=e=>{const b=e.target.closest('[data-emoji]');if(b)insertEmoji(b.dataset.emoji||'')};

  /* Command palette ------------------------------------------------------ */
  const backdrop=document.createElement('div');backdrop.className='rs-command-backdrop';backdrop.innerHTML='<div class="rs-command-palette" role="dialog" aria-label="Command palette"><div class="rs-command-search-wrap"><span>⌕</span><input class="rs-command-search" type="search" autocomplete="off" placeholder="Search apps or actions…"><kbd class="rs-command-key">ESC</kbd></div><div class="rs-command-results"></div></div>';screen.appendChild(backdrop);
  const search=backdrop.querySelector('.rs-command-search'),results=backdrop.querySelector('.rs-command-results');let paletteItems=[],selectedIndex=0;
  const iconFor=(id)=>{const img=`img/icon-themes/${screen.dataset.iconTheme||'airglass'}/${id}.png?v=080`;return `<span class="rs-command-icon"><img src="${img}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${String(id||'?').slice(0,1).toUpperCase()}'"></span>`};
  function buildItems(){const core=window.RSTabletCore;if(!core)return[];const apps=(core.allApps?.()||[]).map(a=>({id:a.id,label:a.label||a.id,sub:`App • ${a.category||'tablet'}`,kind:'app'}));return [{id:'__home',label:'Home Screen',sub:'Quick action',kind:'action',glyph:'⌂'},{id:'__lock',label:'Lock Tablet',sub:'Quick action',kind:'action',glyph:'⌾'},{id:'settings',label:'Settings',sub:'Appearance and device',kind:'app'},{id:'games',label:'RS Arcade',sub:'8 built-in games',kind:'app'},...apps.filter(a=>!['settings','games'].includes(a.id))]}
  function renderPalette(){const q=search.value.trim().toLowerCase(),source=buildItems();paletteItems=source.filter(x=>!q||`${x.label} ${x.sub} ${x.id}`.toLowerCase().includes(q)).slice(0,28);selectedIndex=Math.max(0,Math.min(selectedIndex,paletteItems.length-1));results.innerHTML=paletteItems.length?paletteItems.map((x,i)=>`<button class="rs-command-row ${i===selectedIndex?'active':''}" data-palette-index="${i}">${x.glyph?`<span class="rs-command-icon">${x.glyph}</span>`:iconFor(x.id)}<div><strong>${escapeLocal(x.label)}</strong><small>${escapeLocal(x.sub)}</small></div></button>`).join(''):'<div class="empty-state">No matching apps or actions.</div>'}
  function escapeLocal(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function openPalette(){const core=window.RSTabletCore;if(!core?.getState?.().open)return;closeEmoji();selectedIndex=0;search.value='';renderPalette();backdrop.classList.add('open');setTimeout(()=>search.focus({preventScroll:true}),0)}
  function closePalette(){if(backdrop.classList.contains('open'))backdrop.classList.remove('open');if(document.activeElement===search)search.blur()}
  function runPalette(index=selectedIndex){const item=paletteItems[index],core=window.RSTabletCore;if(!item||!core)return;closePalette();if(item.id==='__home')return core.home?.();if(item.id==='__lock')return core.lock?.();core.openApp?.(item.id)}
  search.addEventListener('input',()=>{selectedIndex=0;renderPalette()});search.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();selectedIndex=Math.min(paletteItems.length-1,selectedIndex+1);renderPalette()}else if(e.key==='ArrowUp'){e.preventDefault();selectedIndex=Math.max(0,selectedIndex-1);renderPalette()}else if(e.key==='Enter'){e.preventDefault();runPalette()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePalette()}});
  results.onclick=e=>{const b=e.target.closest('[data-palette-index]');if(b)runPalette(Number(b.dataset.paletteIndex))};backdrop.addEventListener('pointerdown',e=>{if(e.target===backdrop)closePalette()});

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open')){e.stopPropagation();closeEmoji(true);return}if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();e.stopPropagation();openPalette()}},true);
  const observer=new MutationObserver(()=>{if(target&&!target.closest('.view.active')){target.classList.remove('rs-emoji-target');target=null;closeEmoji();trigger.classList.remove('visible')}else positionEmoji();if(!screen.closest('#stage')||document.getElementById('stage')?.hidden){closePalette();closeEmoji()}});observer.observe(screen,{subtree:true,attributes:true,attributeFilter:['class','hidden']});observer.observe(document.getElementById('stage'),{attributes:true,attributeFilter:['hidden']});
  window.RSTabletPolish={openPalette,closePalette,closeEmoji,insertGIF:value=>{if(!validTarget(target)||!target.isConnected)return false;const start=target.selectionStart??target.value.length,end=target.selectionEnd??start;const text=String(value);if(target.maxLength>=0&&target.value.length-(end-start)+text.length>target.maxLength)return false;insertEmoji(text);return true;}};
})();
