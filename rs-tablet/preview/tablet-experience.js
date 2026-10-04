(() => {
  'use strict';
  const content=document.getElementById('app-content');let frame=0;
  content.addEventListener('scroll',()=>{
    if(frame||RSTabletCore.getState().activeApp!=='settings')return;
    frame=requestAnimationFrame(()=>{
      frame=0;const top=content.getBoundingClientRect().top;let current='settings-appearance';
      for(const section of content.querySelectorAll('.settings-section'))if(!section.hidden&&section.getBoundingClientRect().top<=top+80)current=section.id;
      if(content.scrollTop+content.clientHeight>=content.scrollHeight-2)current=content.querySelector('.settings-section:not([hidden]):last-of-type')?.id||current;
      content.querySelectorAll('.settings-nav-btn').forEach(b=>{const active=b.dataset.target===current;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
    });
  },{passive:true});
})();
