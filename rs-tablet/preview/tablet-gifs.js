/* Packaged GIF reactions only. No player-entered URLs and no external GIF service. */
(() => {
  'use strict';
  const screen=document.getElementById('screen');
  function safeLocal(value){
    const s=String(value||'').trim();
    return /^img\/gifs\/[a-z0-9_.-]+\.(gif|webp)$/i.test(s)?s:'';
  }
  function library(){
    const configured=Array.isArray(window.RSTabletCore?.getState?.().config?.customGIFs)?window.RSTabletCore.getState().config.customGIFs:[];
    const seen=new Set();
    return configured.slice(0,24).map(x=>({label:String(x?.label||'GIF').slice(0,64),url:safeLocal(x?.url)})).filter(x=>x.url&&!seen.has(x.url)&&seen.add(x.url));
  }
  function tile(item,click){
    const b=document.createElement('button');b.type='button';b.className='tablet-gif-card';
    const img=document.createElement('img');img.loading='lazy';img.src=item.url;img.alt=item.label;img.dataset.gifSource=item.url;
    img.onerror=()=>{img.removeAttribute('src');img.alt='GIF unavailable';b.disabled=true;};
    const text=document.createElement('span');text.textContent=item.label;b.append(img,text);b.onclick=click;return b;
  }
  function picker(){
    const items=library(); if(!items.length)return;
    const panel=screen.querySelector('.rs-emoji-panel'),tabs=panel?.querySelector('.rs-emoji-tabs');if(!tabs||tabs.querySelector('[data-gif-tab]'))return;
    const b=document.createElement('button');b.type='button';b.className='rs-emoji-tab';b.dataset.gifTab='1';b.textContent='GIFs';tabs.append(b);
    b.onclick=()=>{const grid=panel.querySelector('.rs-emoji-grid');grid.classList.add('gif-mode');grid.replaceChildren();tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));for(const item of items)grid.append(tile(item,()=>{const absolute=new URL(item.url,location.href).href;const accepted=!screen.dispatchEvent(new CustomEvent('rs-tablet:gifSelected',{detail:{...item,url:absolute},bubbles:true,cancelable:true}));if(!accepted&&!window.RSTabletPolish?.insertGIF?.(absolute))window.RSTabletCore?.toast?.('GIFs','This field cannot fit the GIF.','inform');else window.RSTabletPolish?.closeEmoji?.(true);}));};
    tabs.addEventListener('click',e=>{if(e.target.closest('[data-emoji-group]'))panel.querySelector('.rs-emoji-grid').classList.remove('gif-mode');});
  }
  requestAnimationFrame(picker);
  window.RSTabletGIFs={safeURL:safeLocal,list:library};
})();
