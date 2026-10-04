/* Optional, isolated build steps. Existing IDs, handlers and persistence stay owned by the host. */
(() => {
  'use strict';
  const resource=typeof GetParentResourceName==='function'?GetParentResourceName():document.body.dataset.builderHost;
  const trap=resource==='rs-trap_boyz', robbery=resource!=='rs-worldbuilder';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let open=false, project=null, serial=0, revision=0, scenarios=[], selected=null, section='signs', loading=false, savedHost='', savedScenarios='[]';
  const defaults={store_chain:{label:'Register → computer → safe',stages:[{kind:'hold',label:'Empty register',seconds:30},{kind:'question',label:'Computer code',seconds:10},{kind:'drill',label:'Open safe',seconds:45}]},armed_hold:{label:'Armed hold-up',stages:[{kind:'armed',label:'Hold the location',seconds:40}]},atm_pull:{label:'ATM rope → tow → drill',stages:[{kind:'rope',label:'Attach rope',seconds:10},{kind:'tow',label:'Tow away',seconds:15},{kind:'drill',label:'Drill cash container',seconds:35}]}};
  const button=document.createElement('button');button.id='builderStepsButton';button.type='button';button.textContent=robbery?'SIGNS · MAP CHECK · ROBBERIES':'SIGNS · MAP CHECK';button.className=trap?'hard-btn ghost':'';
  (document.querySelector('.top-actions')||document.querySelector('header')).appendChild(button);
  const panel=document.createElement('section');panel.id='builderStepsPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Build signs and scenarios');
  panel.innerHTML=`<div class="bs-card"><header><div><small>BUILD STEPS</small><h2 id="bsTitle">SIGNS & SCENARIOS</h2></div><button id="bsClose" type="button" aria-label="Close build steps">×</button></header><nav><button data-bs-tab="signs">SIGNS</button><button data-bs-tab="maps">MAP CHECK</button>${robbery?'<button data-bs-tab="robbery">ROBBERIES</button>':''}</nav><div id="bsContent" class="bs-content"></div><footer><span id="bsMessage" role="status"></span><button id="bsSave" type="button">SAVE SCENARIOS</button></footer></div>`;
  document.body.appendChild(panel);
  const $=id=>document.getElementById(id);
  async function request(action,data={}) {
    if(typeof GetParentResourceName!=='function')return {ok:false,error:'Use this step inside FiveM with rs-buildersteps started.'};
    const response=await fetch(`https://${resource}/builderSteps`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
    return response.json();
  }
  function status(text,error=false){$('bsMessage').textContent=text;$('bsMessage').classList.toggle('bs-error',error);}
  function close(){open=false;serial++;panel.hidden=true;loading=false;$('bsSave').disabled=false;$('bsContent').inert=false;}
  function selectedRow(){return scenarios.find(r=>r.id===selected);}
  function readForm(){
    const r=selectedRow();if(!r||section!=='robbery'||!$('bsName'))return;
    r.name=$('bsName').value;r.enabled=$('bsEnabled').checked;r.police=Number($('bsPolice').value);r.cooldown=Number($('bsCooldown').value);r.radius=Number($('bsRadius').value);
    r.reward={kind:$('bsRewardKind').value,amount:Number($('bsRewardAmount').value),item:$('bsRewardItem').value};
    r.stages.forEach((s,i)=>{s.seconds=Number($(`bsDuration${i}`).value);if(s.kind==='question'){s.question=$(`bsQuestion${i}`).value;s.answer=$(`bsAnswer${i}`).value;}});
  }
  function render(){
    $('bsSave').hidden=section!=='robbery';panel.querySelectorAll('[data-bs-tab]').forEach(b=>b.classList.toggle('bs-active',b.dataset.bsTab===section));
    const content=$('bsContent');
    content.inert=loading;
    if(section==='signs'){
      content.innerHTML=`<h3>BUILD A REAL 3D SIGN</h3><p>Use the complete sd-signs builder: up to three rows, individual letter colours, matte or neon, size, depth, spacing, gradient/cycle/wave/chase/pulse animation, spin, visibility distance and live preview.</p><div class="bs-options"><span>191 GLYPHS</span><span>10 COLOURS</span><span>3 ROWS</span><span>MATTE / NEON</span><span>PER-LETTER COLOUR</span><span>ANIMATION & SPIN</span></div><p>Your signs persist through sd-signs. The sign tool owns their placement and editing; publishing or deleting this project does not delete its signs.</p><div class="bs-actions"><button data-bs-tool="signs">BUILD SIGN →</button><button data-bs-tool="placedSigns">EDIT PLACED SIGNS →</button></div><p class="bs-note">Opening a tool closes this editor cleanly. Save your host changes first, then reopen your builder and load this project when finished.</p>`;
    }else if(section==='maps'){
      content.innerHTML=`<h3>CHECK THE MAP BEFORE OPENING</h3><p>Scan started resources for duplicate streamed models, textures, YMAP placements, archetypes, collision and occluder conflicts. Review the scan and its streaming weight before publishing.</p><p>This tool scans resource map files. It does not certify gameplay, placed-script entities or database data.</p><button data-bs-tool="maps">OPEN ADMIN MAP REVIEW →</button><p class="bs-note">The builder never auto-resolves or edits map files. Resolve in the conflict tool is a separate admin action with its own backups and permissions.</p>`;
    }else{
      const r=selectedRow();
      content.innerHTML=`<div class="bs-intro"><h3>BUILD A ROBBERY SCENARIO</h3><p>Pick a sample, place each objective and tune the rules. Saved scenarios only run when enabled and this host location is published. Rewards are separate scenario payouts; store stock, trap funds and map ATMs remain intact.</p></div><div class="bs-actions"><label>SAMPLE<select id="bsPreset">${Object.entries(defaults).map(([key,v])=>`<option value="${key}">${esc(v.label)}</option>`).join('')}</select></label><button id="bsAdd">ADD SCENARIO</button></div><div class="bs-scenario-layout"><aside class="bs-list">${scenarios.map(s=>`<button data-bs-select="${esc(s.id)}" class="${selected===s.id?'bs-active':''}">${esc(s.name)}<small>${s.enabled?'ENABLED':'DISABLED'}</small></button>`).join('')||'<p>No scenarios yet. Pick a sample above.</p>'}</aside><div class="bs-form">${r?`<div class="bs-fields"><label>NAME<input id="bsName" maxlength="72" value="${esc(r.name)}"></label><label class="bs-check"><input id="bsEnabled" type="checkbox" ${r.enabled?'checked':''}> ENABLE GAMEPLAY</label><label>POLICE ON DUTY<input id="bsPolice" type="number" min="0" max="64" value="${r.police}"></label><label>COOLDOWN (SECONDS)<input id="bsCooldown" type="number" min="60" max="86400" value="${r.cooldown}"></label><label>STAY WITHIN (METRES)<input id="bsRadius" type="number" min="2" max="30" value="${r.radius}"></label><label>FINAL REWARD<select id="bsRewardKind"><option value="cash" ${r.reward.kind==='cash'?'selected':''}>Cash</option><option value="item" ${r.reward.kind==='item'?'selected':''}>Inventory item</option></select></label><label>AMOUNT<input id="bsRewardAmount" type="number" min="0" max="10000" value="${r.reward.amount}"></label><label>ITEM ID (IF ITEM)<input id="bsRewardItem" maxlength="64" value="${esc(r.reward.item)}" placeholder="markedbills"></label></div><div class="bs-stages">${r.stages.map((s,i)=>`<article><h4>${i+1}. ${esc(s.label)}</h4><label>DURATION (SECONDS)<input id="bsDuration${i}" type="number" min="5" max="600" value="${s.seconds}"></label>${s.kind==='question'?`<label>COMPUTER QUESTION<input id="bsQuestion${i}" maxlength="160" value="${esc(s.question||'')}" placeholder="What is the manager's code?"></label><label>EXPECTED ANSWER<input id="bsAnswer${i}" maxlength="80" value="${esc(s.answer||'')}"></label>`:''}<p>${s.point?`PLACED · ${s.point.x.toFixed(2)}, ${s.point.y.toFixed(2)}, ${s.point.z.toFixed(2)}`:'POINT REQUIRED'}</p><button data-bs-point="${i}">PLACE OBJECTIVE IN WORLD →</button></article>`).join('')}</div><p class="bs-note">ATM: requires rope and drill items; a networked vehicle must be within 8m. Enter its driver seat before the tow objective. Pull it at least 5m while staying inside the configured radius. The rope is visual; existing map ATMs are not deleted.</p><button id="bsRemove" class="bs-danger">REMOVE SCENARIO</button>`:'<p>Select or add a scenario to start building.</p>'}</div></div>`;
      $('bsAdd').onclick=()=>{readForm();if(scenarios.length>=12)return status('Maximum 12 scenarios per project.',true);const preset=$('bsPreset').value;const def=defaults[preset];const id=`scenario_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;scenarios.push({id,name:def.label,preset,enabled:false,police:0,cooldown:1800,radius:preset==='atm_pull'?25:10,reward:{kind:'cash',amount:500,item:''},stages:structuredClone(def.stages)});selected=id;render();};
      content.querySelectorAll('[data-bs-select]').forEach(b=>b.onclick=()=>{readForm();selected=b.dataset.bsSelect;render();});
      if(r){$('bsRemove').onclick=()=>{scenarios=scenarios.filter(s=>s.id!==selected);selected=scenarios[0]?.id;render();};
        content.querySelectorAll('[data-bs-point]').forEach(b=>b.onclick=async()=>{readForm();const ticket=serial;panel.hidden=true;status('Place the point, then press Enter.');try{const result=await request('capture');if(!open||ticket!==serial)return;if(result.point){r.stages[Number(b.dataset.bsPoint)].point=result.point;render();}else status(result.error||'Point placement cancelled.',true);}catch(e){if(open&&ticket===serial)status('Point placement failed.',true);}finally{if(open&&ticket===serial)panel.hidden=false;}});
      }
    }
    content.querySelectorAll('[data-bs-tool]').forEach(b=>b.onclick=async()=>{
      if(JSON.stringify(scenarios)!==savedScenarios)return status('Save your scenario changes before opening another tool.',true);
      if(window.RSStorefrontUI?.hasUnsavedChanges())return status('Save your store design before opening another tool.',true);
      if(trap&&typeof syncTrapFromUi==='function'){syncTrapFromUi();if(JSON.stringify(state.trap)!==savedHost)return status('Save the current trap changes before opening another tool.',true);}
      const ticket=serial;b.disabled=true;status('Checking tool access…');
      try{const result=await request(b.dataset.bsTool);if(!open||ticket!==serial)return;if(!result.ok)status(result.error||'Tool unavailable.',true);else close();}catch(e){if(open&&ticket===serial)status('Tool could not be opened.',true);}finally{b.disabled=false;}
    });
  }
  async function show(tab='signs'){
    if(!project){return;}
    section=tab;open=true;panel.hidden=false;const ticket=++serial;loading=true;render();status('Loading saved build steps…');
    try{const result=await request('get');if(!open||ticket!==serial)return;if(!result.ok){status(result.error||'Build steps unavailable.',true);return;}revision=result.revision;scenarios=result.scenarios||[];savedScenarios=JSON.stringify(scenarios);selected=scenarios[0]?.id;render();status(`${project.name||'PROJECT'} · ${result.signLinks?.length||0} linked signs · ${scenarios.length} saved scenarios`);}catch(e){if(open&&ticket===serial)status('Start rs-buildersteps to use these optional steps.',true);}finally{if(open&&ticket===serial){loading=false;$('bsContent').inert=false;}}
  }
  button.onclick=()=>show();$('bsClose').onclick=close;
  panel.querySelectorAll('[data-bs-tab]').forEach(b=>b.onclick=()=>{readForm();section=b.dataset.bsTab;render();});
  $('bsSave').onclick=async()=>{if(loading)return;readForm();const ticket=serial;loading=true;$('bsSave').disabled=true;$('bsContent').inert=true;status('Saving scenarios…');try{const result=await request('save',{scenarios,revision});if(!open||ticket!==serial)return;if(result.ok){revision=result.revision;scenarios=result.scenarios;savedScenarios=JSON.stringify(scenarios);render();status(result.message||'Saved.');}else status(result.error||'Save rejected.',true);}catch(e){if(open&&ticket===serial)status('Save response unavailable. Reload to verify before retrying.',true);}finally{if(open&&ticket===serial){loading=false;$('bsSave').disabled=false;$('bsContent').inert=false;}}};
  window.RSBuilderSteps={open:show};
  document.querySelectorAll('[data-builder-step]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.onclick=()=>show(el.dataset.builderStep);el.onkeydown=e=>{if(e.key==='Enter')show(el.dataset.builderStep);};});
  button.disabled=true;
  window.addEventListener('message',({data:m})=>{
    if(!m)return;
    if(['close','closeBuilder'].includes(m.action)){close();project=null;button.disabled=true;}
    if(m.action==='projectLoaded'&&m.project){close();project=m.project;button.disabled=m.readOnly===true;}
    if(['trapData','saved','published'].includes(m.action)&&m.trap){if(project?.id!==m.trap.id)close();project=m.trap;button.disabled=false;if(trap)savedHost=JSON.stringify(state.trap);}
    if(m.action==='bootstrap'){const t=m.trap||m.currentTrap;if(t){project=t;button.disabled=false;}}
    if(m.action==='editorState'&&m.readOnly===true){close();button.disabled=true;}
  });
})();