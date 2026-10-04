'use strict';
const frame=document.getElementById('demoFrame');
const buttons=[...document.querySelectorAll('[data-demo-view]')];
function send(view){
  if(!frame?.contentWindow)return;
  frame.contentWindow.postMessage({source:'rs-storebuilder-showcase',view},'*');
  buttons.forEach(b=>b.classList.toggle('active',b.dataset.demoView===view));
}
buttons.forEach(button=>button.addEventListener('click',()=>send(button.dataset.demoView)));
frame.addEventListener('load',()=>setTimeout(()=>send('editor'),180));
