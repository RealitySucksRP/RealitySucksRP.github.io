'use strict';
// Standalone public simulation. No resource scripts, NUI transport, server URLs,
// application secrets, customer records or persistent gameplay state are used.
const sections = [
  ['dashboard','Command','command','LEARN THE SYSTEM. PROVE THE DIAGNOSIS.','Interview, inspect, measure, diagnose, repair and commission.'],
  ['calls','Service Calls','dispatch','THE COMPLAINT IS NOT THE DIAGNOSIS.','Explore sample dispatch work. Measurements lead to the diagnosis.'],
  ['active','Guided Job','guided','ONE TEST. ONE PURPOSE. ONE RECORDED RESULT.','Walk through an abbreviated service call with simulated evidence.'],
  ['academy','Training','academy','TRAIN THE SKILL BEFORE THE CALL.','Try a short reasoning exercise before heading into the field.'],
  ['uniforms','Locker','ppe','DRESS FOR THE TASK.','Preview workwear and task-specific PPE in your sample profile.'],
  ['fleet','Fleet','fleet','THE VAN IS A MOBILE SERVICE SHOP.','Inspect a sample vehicle and explore service and equipment transport roles.'],
  ['inventory','Stock','stock','KNOW WHAT IS ON THE TRUCK.','See how tools, parts and restocking connect to your next call.'],
  ['changeouts','Change-Outs','changeout','ONE UNIT IDENTITY FROM DIAGNOSIS TO INSTALLATION.','Preview a serialized replacement journey from warehouse to commissioning.'],
  ['supply','Supply','supply','BUY WHAT THE DIAGNOSIS PROVED YOU NEED.','Add sample parts to stock and follow their entry in the demo ledger.'],
  ['certification','Certification','certification','A CERTIFICATION IS A TEST, NOT A SETTING.','Try a three-question company competency preview. No real certificate is issued.'],
  ['company','Business','company','A SERVICE COMPANY YOU CAN RUN.','Explore sample cash flow, the operating floor, stock costs and owner capital.'],
  ['guide','Career Guide','academy','YOUR CAREER, LEVEL BY LEVEL.','Explore the resource’s ten career grades and selected promotion milestones.']
];
const grades = ['HVAC Helper','Apprentice Technician','Maintenance Technician','HVAC Technician I','HVAC Technician II','Senior Service Technician','Lead Technician / Installer','Field Supervisor','Service Manager','Operations Manager / Owner'];
const roles = {helper:0,senior:5,owner:9};
const calls = [
  {id:'alta',title:'No cooling · unit humming',site:'Alta Street Apartments',type:'Service',priority:'Emergency',grade:1,unit:'Compact wall unit',complaint:'The unit hums, but the fan and compressor will not start.'},
  {id:'shop',title:'Warm shop · restricted airflow',site:'Vespucci Retail',type:'Maintenance',priority:'Routine',grade:1,unit:'Commercial air handler',complaint:'The shop feels warm and there is less air from the vents.'},
  {id:'roof',title:'Rooftop replacement survey',site:'Downtown Office',type:'Change-out',priority:'Scheduled',grade:7,unit:'Large commercial rooftop unit',complaint:'Preview a serialized equipment replacement with a supervised lift.'}
];
const products = [
  {id:'capacitor',label:'45/5 µF dual-run capacitor',category:'Electrical',price:48,image:'dual_run_capacitor.webp',qty:4},
  {id:'filter',label:'Pleated air filter',category:'Airflow',price:22,image:'filter_pleated_merv8.webp',qty:6},
  {id:'contactor',label:'Two-pole contactor',category:'Electrical',price:64,image:'contactor_2p_40a.webp',qty:3},
  {id:'meter',label:'Digital multimeter',category:'Tool',price:195,image:'digital_multimeter.webp',qty:1}
];
const equipment = [
  {id:'compact',label:'Compact wall unit',category:'Residential',grade:2,sku:'DEMO-WALL-01',image:'aircon_s_03a.webp',transport:'Small equipment carrier',lift:'Compact Wall Hoist'},
  {id:'condenser',label:'Residential condensing unit',category:'Residential',grade:2,sku:'DEMO-CU-02',image:'aircon_s_01a.webp',transport:'Equipment delivery carrier',lift:'Ground / job-specific hoist'},
  {id:'rooftop',label:'Commercial rooftop package',category:'Commercial',grade:4,sku:'DEMO-RTU-03',image:'aircon_l_01.webp',transport:'Heavy equipment carrier',lift:'Supervised crane / Skylift plan'}
];
const fleet = [
  {id:'van',label:'Service van',role:'Routine service & maintenance',grade:1,icon:'fleet',description:'A mobile service shop for diagnostic tools and common repair parts.'},
  {id:'carrier',label:'Equipment delivery carrier',role:'Serialized unit transport',grade:2,icon:'changeout',description:'An equipment transport preview; separate from the routine service fleet.'},
  {id:'forklift',label:'Warehouse forklift',role:'Warehouse material handling',grade:2,icon:'stock',description:'Moves the same serialized replacement through the warehouse handoff.'},
  {id:'skylift',label:'Skylift',role:'Aerial equipment logistics',grade:7,icon:'crane',description:'Aerial work has separate career, rigging, site and supervisor gates in FiveM.'}
];
const training = [
  {id:'evidence',title:'Complaint or evidence?',category:'Diagnostics',question:'A customer reports “no cooling.” What should guide the diagnosis?',answers:['The complaint alone','Recorded measurements and observed evidence','The most expensive replacement'],correct:1,explanation:'A reported symptom starts the investigation. The guided job records evidence before selecting a repair.'},
  {id:'identity',title:'Serialized equipment custody',category:'Logistics',question:'Which unit should appear at the final installation?',answers:['Any unit with a similar cabinet','The unit chosen at random from warehouse stock','The same serialized replacement linked to the work order'],correct:2,explanation:'RS-HVAC links the work order, replacement identity, warehouse custody and installed unit.'},
  {id:'ppe',title:'Role and task preparation',category:'Safety',question:'Does putting on company workwear authorize every field procedure?',answers:['Yes, the uniform unlocks everything','No; PPE, training and server permissions are separate','Only when the company owns a van'],correct:1,explanation:'Workwear, task PPE, earned grade and the server’s procedure gates serve separate purposes.'}
];
let state;
let currentView = 'dashboard';
let quiz = null;
let exam = null;
let activeFilters = {search:'',category:'All'};
let catalogFilter = 'All';
let supplyFilter = 'All';
let guideGrade = 5;
let toastTimers = new Set();
const el = id => document.getElementById(id);
const money = n => '$' + n.toLocaleString('en-US',{maximumFractionDigits:0});
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (action,label,attrs='',style='primary') => `<button class="${style}" data-action="${action}" ${attrs}>${label}</button>`;
const pill = (label,kind='') => `<span class="pill ${kind}">${label}</span>`;
const heading = (title,text,status='') => `<div class="section-heading"><div><h3>${title}</h3><p>${text}</p></div>${status ? pill(status) : ''}</div>`;
const card = (meta,title,text,actions='',extra='') => `<article class="card ${extra}"><span class="meta">${meta}</span><h4>${title}</h4><p>${text}</p>${actions ? `<div class="actions">${actions}</div>` : ''}</article>`;
const notice = (text,kind='') => `<div class="notice ${kind}">${text}</div>`;
const linkButton = (view,label) => `<button class="secondary" data-view="${view}">${label}</button>`;
const numbers = items => `<div class="numbers">${items.map(([v,l])=>`<div class="number"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div>`;
function freshState(role='senior') {
  return {role,grade:roles[role],duty:role!=='helper',uniform:role!=='helper',ppe:new Set(role==='helper'?[]:['glasses','gloves']),vehicle:role==='helper'?null:'van',inspected:role!=='helper',inspection:new Set(),job:null,closed:role==='helper'?0:127,trained:role==='helper'?0:18,training:new Set(),examPassed:false,stock:Object.fromEntries(products.map(p=>[p.id,p.qty])),balance:84500,capital:15000,floor:25000,ledger:[{label:'Completed service invoices',amount:12840,category:'Service revenue'},{label:'Crew payroll settlement',amount:-5940,category:'Payroll'},{label:'Supplier statement',amount:-2450,category:'Parts & materials'},{label:'Branch overhead',amount:-1480,category:'Operating costs'}],quote:null};
}
function toast(message,error=false) {
  const node=document.createElement('div');node.className='toast'+(error?' error':'');node.textContent=message;el('toasts').append(node);
  const timer=setTimeout(()=>{node.remove();toastTimers.delete(timer);},4200);toastTimers.add(timer);
}
function reset(role='senior') {
  state=freshState(role);quiz=null;exam=null;activeFilters={search:'',category:'All'};catalogFilter='All';supplyFilter='All';guideGrade=state.grade;currentView='dashboard';
  toastTimers.forEach(clearTimeout);toastTimers.clear();el('toasts').replaceChildren();el('detail').close();el('persona').value=role;render();
}
function navigate(view) {
  if(!sections.some(s=>s[0]===view)) return;
  currentView=view;render();
  // Keep the page in place while switching tablet sections.
}
function syncProfile() {
  el('grade-title').textContent=grades[state.grade];el('grade').textContent='G'+state.grade;el('closed').textContent=state.closed;el('trained').textContent=state.trained;
  el('badges').innerHTML=state.grade>=5?'<span class="badge">ELECTRICAL DIAGNOSTICS</span><span class="badge">REFRIGERATION</span>':'<span class="badge">FIELD TRAINING</span>';
  el('duty').textContent=state.duty?'Go off duty':'Go on duty';
  const v=fleet.find(v=>v.id===state.vehicle);
  el('fleet-status').textContent=v?`${v.label} · ${state.inspected?'inspected':'inspection due'}`:'No vehicle assigned';
  el('fleet-meter').style.width=state.inspected?'100%':state.vehicle?'45%':'0%';
  el('fleet-caption').textContent=state.inspected?'Tools and stock ready for the next call.':'Visit Fleet to check out and inspect a sample vehicle.';
  const mode=['fleet','guide'].includes(currentView)?'skylift-tech':['uniforms','changeouts','company'].includes(currentView)?'lift-supervisor':'service-tech';
  el('role-art').src=`assets/rs-hvac-${mode}.png`;
  el('role-art').alt=mode==='service-tech'?'RS HVAC field service technician artwork':mode==='skylift-tech'?'RS HVAC Skylift technician artwork':'RS HVAC rooftop lift supervisor artwork';
}
function render() {
  syncProfile();
  const section=sections.find(s=>s[0]===currentView);
  el('hero-eyebrow').textContent=section[1].toUpperCase();el('hero-title').textContent=section[3];el('hero-text').textContent=section[4];
  const hero=['company'].includes(currentView)?'business':['inventory','supply'].includes(currentView)?'stock':['academy','certification'].includes(currentView)?'electrical':currentView==='calls'?'service':'rooftop';
  el('hero-image').src=`assets/tablet-ui/hero-${hero}.jpg`;
  document.querySelectorAll('nav [data-view]').forEach(b=>{const active=b.dataset.view===currentView;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
  const views={dashboard:dashboard,calls:dispatch,active:guided,academy:academy,uniforms:locker,fleet:fleetView,inventory:inventory,changeouts:changeouts,supply:supply,certification:certification,company:company,guide:guide};
  el('view').innerHTML=views[currentView]();
}
function dashboard() {
  return heading('Field operations','Your shift, your next call and your career in one place.',state.duty?'ON DUTY':'OFF DUTY')+
    numbers([[state.closed,'Calls closed'],[state.trained,'Training passes'],[state.grade,'Current grade']])+
    (state.grade===0?notice('Helper preview: complete one fundamentals exercise in Training to unlock the sample apprentice workflow.','amber'):'')+
    `<div class="grid">`+card('DISPATCH',state.job?'Work order in progress':'Ready for the next call',state.job?calls.find(c=>c.id===state.job.id).title:'Pick a reported symptom and follow the evidence.',linkButton(state.job?'active':'calls',state.job?'Continue guided job →':'Open service calls →'))+
    card('CAREER',grades[state.grade],state.grade===9?'Explore owner cash flow and equipment operations.':'Training, service results and exams shape your progression.',linkButton('guide','Explore career guide →'))+
    card('SHIFT READINESS',state.inspected?'Fleet inspection complete':'Prepare your mobile workshop',state.uniform?'Duty workwear selected. Review task PPE in Locker.':'Choose workwear and inspect your sample vehicle.',linkButton('fleet','Open fleet →')+linkButton('uniforms','Open locker'))+
    card('COMPANY',money(state.balance)+' operating cash','Parts orders and completed jobs update this tab’s sample company ledger.',linkButton('company','Explore business →'))+`</div>`;
}
function dispatch() {
  const filtered=calls.filter(c=>(activeFilters.category==='All'||c.type===activeFilters.category)&&`${c.title} ${c.site}`.toLowerCase().includes(activeFilters.search.toLowerCase()));
  const filter=`<div class="filters"><input id="call-search" aria-label="Search service calls" placeholder="Search site or symptom" value="${esc(activeFilters.search)}"><select id="call-category" aria-label="Filter service calls">${['All','Service','Maintenance','Change-out'].map(c=>`<option ${c===activeFilters.category?'selected':''}>${c}</option>`).join('')}</select></div>`;
  return heading('Service calls','Sample sites and abbreviated dispatch scenarios.',`${filtered.length} AVAILABLE`)+(state.job?notice('You already have an active sample work order. Finish or abandon it in Guided Job.','amber'):'')+filter+`<div class="grid">`+filtered.map(c=>{
    const serviceFleet=c.type==='Change-out'||state.vehicle==='van';
    const allowed=state.grade>=c.grade&&state.duty&&state.uniform&&state.inspected&&serviceFleet&&!state.job;
    let reason=state.job?'Work order active':state.grade<c.grade?`Requires G${c.grade}+`:!state.duty?'Go on duty':!state.uniform?'Select duty workwear':!state.inspected?'Inspect fleet first':!serviceFleet?'Check out a service van':'Accept sample call';
    return card(`${pill(c.priority,c.priority==='Emergency'?'amber':'')} ${pill('G'+c.grade+'+')} ${pill(c.type)}`,c.title,`${c.site} · ${c.unit}<br><br>“${c.complaint}”`,button('accept',reason,`data-id="${c.id}" ${allowed?'':'disabled'}`)+button('call-detail','View brief',`data-id="${c.id}"`,'secondary'));
  }).join('')+`</div>`+(!filtered.length?'<p class="empty">No sample calls match. Try another search or category.</p>':'');
}
function jobSteps(job) {
  if(job.id==='roof') return [
    ['Survey','Review the authored roof location and equipment identity.','Sample site and old-unit identity confirmed.'],
    ['Plan','Review access, carrier and supervised lift requirements.','Access and supervised aerial lift plan recorded.'],
    ['Warehouse','Confirm replacement custody in the sample warehouse.','Replacement DEMO-NEW-003 is assigned to this work order.'],
    ['Transport','Preview the same replacement arriving at the jobsite.','DEMO-NEW-003 remains linked to the work order.'],
    ['Old out','Preview removal and recycling of the old equipment.','Old equipment removal and recycling recorded.'],
    ['New in','Preview the replacement placed at the authored transform.','DEMO-NEW-003 installed at the sample site.'],
    ['Commission','Review the simulated completion checklist and invoice.','Commissioning evidence and replacement identity recorded.']
  ];
  return [
    ['Interview','Record the customer’s reported symptom.','Customer symptom recorded; the diagnosis is still unconfirmed.'],
    ['Inspect','Review the simulated inspection notes.','Sample cabinet and system inspection completed.'],
    ['Measure',job.id==='alta'?'Compare the sample evidence: line 240 V, contactor output 240 V, capacitor 8 µF against its 45 µF label.':'Review the sample evidence: airflow restricted, filter heavily loaded, fan operation normal.',job.id==='alta'?'Line 240 V · load 240 V · capacitor 8/45 µF.':'Restricted airflow · loaded filter · normal fan operation.'],
    ['Diagnose','Choose the conclusion supported by the sample evidence.','Evidence-supported diagnosis recorded.'],
    ['Repair','Preview the work order’s repair and exact part consumption.','The required sample part has been consumed once.'],
    ['Commission','Review the simulated post-repair checks.','Cooling and operation restored in the sample report.'],
    ['Invoice','Complete the sample call and record its invoice.','Demo invoice posted to the sample company ledger.']
  ];
}
function guided() {
  if(!state.job) return heading('Guided job','A sample work order connects measurements to a repair.')+notice('Choose a sample service call to start the walkthrough.')+linkButton('calls','Browse service calls →');
  const j=state.job,c=calls.find(c=>c.id===j.id),steps=jobSteps(j),step=steps[j.step];
  const choices=j.step===3&&j.id!=='roof'?`<div class="choice-list">${(j.id==='alta'?['Replace the compressor','Replace the failed capacitor','Replace the contactor']:['Replace the compressor','Replace the loaded filter','Order a rooftop change-out']).map((v,i)=>button('diagnose',v,`data-answer="${i}"`,'secondary')).join('')}</div>`:button('job-next',j.step===6?'Complete sample invoice':'Record sample result →',state.duty?'':'disabled');
  return heading(c.title,c.site+' · '+c.unit,'SAMPLE WORK ORDER')+notice('Browser walkthrough: these results are simulated. Physical tasks, tools, permissions and validation take place in FiveM.')+
    (!state.duty?notice('You are off duty. Go on duty to continue this sample work order.','amber'):'')+
    `<div class="step-list">${steps.map((s,i)=>`<span class="${i<j.step?'done':i===j.step?'current':''}">${i+1} ${s[0]}</span>`).join('')}</div><div class="grid">`+
    card(`STEP ${j.step+1} / ${steps.length}`,step[0],step[1],state.duty?choices:'',j.evidence.length?'':'wide')+
    (j.evidence.length?`<article class="card"><span class="meta">RECORDED EVIDENCE</span><ul class="evidence">${j.evidence.map(e=>`<li>${e}</li>`).join('')}</ul></article>`:'')+`</div><div class="actions">${button('abandon','Abandon sample work order','','secondary')}${linkButton('inventory','Review stock')}</div>`;
}
function quizView(q,index,answered,selected) {
  return `<article class="card wide"><span class="meta">${q.category.toUpperCase()} · SAMPLE QUESTION ${index}</span><h4>${q.question}</h4><div class="choice-list">${q.answers.map((a,i)=>button('quiz-answer',a,`data-answer="${i}" ${answered?'disabled':''}`,answered?(i===q.correct?'secondary correct':i===selected?'secondary wrong':'secondary'):'secondary')).join('')}</div>${answered?notice(q.explanation,selected===q.correct?'green':'amber'):''}</article>`;
}
function academy() {
  if(quiz) {
    const q=training.find(t=>t.id===quiz.id);
    return heading(q.title,'A short company competency exercise.')+quizView(q,1,quiz.answered,quiz.selected)+`<div class="actions">${quiz.answered?button('quiz-done',quiz.selected===q.correct?'Finish training preview':'Review and retry'):''}${button('quiz-cancel','Training library','','secondary')}</div>`;
  }
  return heading('Training academy','Try a short reasoning exercise. Training here changes only this sample profile.')+`<div class="grid">`+training.map(q=>card(q.category.toUpperCase(),q.title,state.training.has(q.id)?'Completed in this demo session.':'One question with an explanation and a repeatable practice attempt.',button('train',state.training.has(q.id)?'Practice again':'Start exercise',`data-id="${q.id}"`))).join('')+`</div>`;
}
function locker() {
  return heading('Uniforms & PPE','Company workwear and task PPE have separate roles.',state.uniform?'DUTY WORKWEAR':'CIVILIAN')+`<div class="grid"><article class="card"><div class="outfit"><img src="assets/rs-hvac-lift-supervisor.png" alt="RS HVAC duty team artwork"></div><h4>${state.uniform?'Company duty workwear':'Civilian clothing'}</h4><p>Artwork previews the resource’s field team; no player appearance is changed here.</p><div class="actions">${button('uniform',state.uniform?'Restore civilian outfit':'Select duty workwear',state.duty?'':'disabled')}</div></article><article class="card"><span class="meta">TASK PREPARATION</span><h4>Personal protective equipment</h4><p>Select sample PPE. Selection is separate from trade competency and live procedure authorization.</p><ul class="checklist">${[['glasses','Safety glasses'],['gloves','Work gloves'],['helmet','Hard hat'],['harness','Fall protection harness']].map(([id,label])=>`<li><label><input type="checkbox" data-ppe="${id}" ${state.ppe.has(id)?'checked':''}>${label}</label></li>`).join('')}</ul></article></div>`;
}
function fleetView() {
  const inspection=state.vehicle&&!state.inspected?`<article class="card wide"><span class="meta">PRE-SHIFT VEHICLE CHECK</span><h4>Sample inspection checklist</h4><ul class="checklist">${['Vehicle condition','Lights and visibility','Tools, parts and load security'].map((s,i)=>`<li><label><input type="checkbox" data-inspect="${i}" ${state.inspection.has(i)?'checked':''}>${s}</label></li>`).join('')}</ul>${button('inspect','Sign sample inspection',state.inspection.size===3?'':'disabled')}</article>`:'';
  return heading('Company fleet','Service vehicles and equipment logistics serve different work.',state.vehicle?'ASSIGNED':'NO VEHICLE')+(!state.duty?notice('Go on duty before checking out a sample fleet vehicle.','amber'):'')+`<div class="grid">`+inspection+fleet.map(v=>{
    const selected=state.vehicle===v.id;const allowed=state.duty&&state.uniform&&state.grade>=v.grade&&!state.job;
    return card(`${pill('G'+v.grade+'+')} ${selected?pill(state.inspected?'INSPECTED':'INSPECTION DUE',state.inspected?'green':'amber'):''}`,v.label,v.role+'<br><br>'+v.description,button('checkout',selected?'Return sample vehicle':state.grade<v.grade?`Requires G${v.grade}+`:'Check out sample vehicle',`data-id="${v.id}" ${allowed?'':'disabled'}`,selected?'secondary':'primary'));
  }).join('')+`</div>`+notice('Vehicle grades in this showcase are simplified examples. The installed resource checks exact fleet roles, certifications, job plans and authority.');
}
function inventory() {
  return heading('Vehicle stock','Sample quantities update with orders and repairs.',state.vehicle?'VEHICLE STOCK':'WAREHOUSE PREVIEW')+`<article class="card">${products.map(p=>`<div class="stock-row"><div><img src="assets/items/${p.image}" alt=""><div><strong>${p.label}</strong><small>${p.category} · ${p.category==='Tool'?'durable tool':'repair stock'}</small></div></div><span class="pill ${state.stock[p.id]===0?'amber':''}">${state.stock[p.id]} ON HAND</span></div>`).join('')}</article><div class="actions">${linkButton('supply','Order sample stock →')}${button('restock','Replenish sample service parts')}</div>`;
}
function changeouts() {
  const list=equipment.filter(e=>catalogFilter==='All'||e.category===catalogFilter);
  return heading('Change-out library','Browse sample equipment and explore the custody workflow.')+notice('Equipment grade is separate from lift, carrier, certification and site authority.')+`<div class="filters"><select id="equipment-category" aria-label="Equipment category">${['All','Residential','Commercial'].map(v=>`<option ${catalogFilter===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="grid">`+list.map(e=>`<article class="card"><div class="product-art"><img src="assets/items/${e.image}" alt="${e.label} cabinet preview"></div><p class="meta">${e.category.toUpperCase()} · EQUIPMENT G${e.grade}+</p><h4>${e.label}</h4><p>${e.transport}<br>${e.lift}</p><div class="actions">${button('equipment','Preview serial journey',`data-id="${e.id}"`)}${button('quote','Build sample quote',`data-id="${e.id}" ${state.grade>=e.grade?'':'disabled'}`,'secondary')}</div></article>`).join('')+`</div>`+(state.quote?notice(`Sample quote: ${state.quote.label} · ${money(state.quote.price)} · 30% held deposit ${money(state.quote.price*.3)}. This preview does not take payment or create a real job.`):'');
}
function supply() {
  const list=products.filter(p=>supplyFilter==='All'||p.category===supplyFilter);
  return heading('Wholesale counter','Sample prices, quantities and orders. Purchases update demo stock and cash.',money(state.balance))+
    `<div class="filters"><select id="supply-category" aria-label="Supply category">${['All','Electrical','Airflow','Tool'].map(v=>`<option ${supplyFilter===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="grid">`+list.map(p=>`<article class="card"><div class="product-art"><img src="assets/items/${p.image}" alt="${p.label}"></div><p class="meta">${p.category.toUpperCase()} · ${state.stock[p.id]} ON HAND</p><h4>${p.label}</h4><p>${money(p.price)} per unit · illustrative wholesale price</p><label class="quantity">Quantity<input id="qty-${p.id}" type="number" min="1" max="20" step="1" value="1" aria-label="${p.label} order quantity"></label>${button('buy','Order sample stock',`data-id="${p.id}"`)}</article>`).join('')+`</div>`;
}
function certification() {
  if(exam) {
    if(exam.done) return heading('Competency preview result','Three sample questions. This is an in-demo practice result.')+numbers([[exam.score+'/3','Correct answers'],[exam.score===3?'PASS':'RETRY','Practice result'],['DEMO','No real certificate']])+notice(exam.score===3?'All sample questions answered correctly. Practice result recorded for this tab.':'Review the explanations in Training, then try the competency preview again.',exam.score===3?'green':'amber')+button('exam-start','Try again')+' '+button('exam-cancel','Return to certification','','secondary');
    const q=training[exam.index];
    return heading('Company competency preview',`Question ${exam.index+1} of 3`)+quizView(q,exam.index+1,exam.answered,exam.selected)+(exam.answered?button('exam-next',exam.index===2?'View practice result':'Next question →'):'');
  }
  return heading('Certification','Explore how written competency checks fit the resource’s career.')+notice('RS-HVAC is a roleplay simulation. This demo issues no real trade license or EPA certification.')+`<div class="grid">`+card('INTERACTIVE PREVIEW','Company competency','Three short questions about evidence, serialized identity and task preparation.',button('exam-start',state.examPassed?'Practice again':'Start three-question preview'))+card('IN-GAME CURRICULUM','Trade certification paths','The installed resource includes company competency and refrigerant certification topics, earned through its server-graded exams.',linkButton('guide','Explore promotion milestones →'))+`</div>`;
}
function ledgerEntry(label,amount,category) {state.balance+=amount;state.ledger.unshift({label,amount,category});}
function company() {
  return heading('Business overview','Illustrative company finances. Orders and finished calls update this ledger.',state.role==='owner'?'OWNER PREVIEW':'READ-ONLY BUSINESS PREVIEW')+
    numbers([[money(state.balance),'Operating cash'],[money(state.capital),'Owner capital'],[money(state.floor),'Operating floor']])+
    `<div class="grid"><article class="card"><span class="meta">SAMPLE CASH FLOW · 6 GAME WEEKS</span><h4>Revenue with operating costs</h4><div class="finance-chart" role="img" aria-label="Illustrative revenue over six game weeks: 12, 15, 14, 19, 17 and 23 thousand dollars">${[12,15,14,19,17,23].map((n,i)=>`<div><i class="bar-${i}"></i><span>W${i+1}</span></div>`).join('')}</div><p>Illustrative history; the ledger below reacts to your demo actions.</p></article><article class="card"><span class="meta">WHERE THE MONEY GOES</span><h4>Operating model</h4><p>Service revenue funds parts, scheduled payroll and branch overhead. Owner capital and held install deposits have separate identities in the resource.</p><p>Sample purchases use cash on delivery here. Supplier credit, durable settlement and money recovery run in FiveM.</p></article><article class="card wide"><span class="meta">DEMO LEDGER</span><h4>Recent activity</h4>${state.ledger.slice(0,8).map(l=>`<div class="ledger-row"><div>${esc(l.label)}<small>${esc(l.category)}</small></div><span class="${l.amount<0?'expense':''}">${l.amount>0?'+':'−'}${money(Math.abs(l.amount))}</span></div>`).join('')}</article>`+
    (state.role==='owner'?`<article class="card wide"><span class="meta">OWNER CAPITAL · LOCAL SIMULATION</span><h4>Explore a capital transfer</h4><p>Capital returns are capped by invested capital and the company’s operating floor.</p><div class="form-row"><label>Amount<input id="capital-amount" type="number" min="100" max="100000" step="100" value="1000"></label><div class="actions">${button('invest','Invest sample capital')}${button('return-capital','Return sample capital','','secondary')}</div></div></article>`:card('OWNER VIEW','Explore capital and cash flow','Choose G9 · Operations owner in Preview role to try local capital transfers.',button('owner-role','Switch to owner preview'),'wide'))+`</div>`;
}
function guide() {
  const milestones={0:'Entry into field training. Complete one fundamentals module for the Apprentice milestone.',1:'Maintenance Technician: 5 closed calls, 60% first-time fix, 3 training modules and EPA Core in the installed resource.',2:'HVAC Technician I: 25 closed calls, 65% first-time fix, 4.0 rating, 6 training modules, 2 exams and Electrical Diagnostics.',3:'HVAC Technician II: 45 closed calls, 70% first-time fix, 4.2 rating, 10 training modules, 3 exams and Type II.',4:'Senior Service Technician: 70 closed calls, 75% first-time fix, 4.3 rating, 15 modules, 4 exams, heat pump and brazing competencies.',5:'Lead Technician / Installer: 100 closed calls, 78% first-time fix, 4.4 rating, 20 modules, 6 exams and installer / A2L competencies.',6:'Field Supervisor: 140 closed calls, 80% first-time fix, 4.5 rating, 26 modules, 7 exams and commissioning competency.',7:'Service Manager: 190 closed calls, 82% first-time fix, 4.6 rating, 32 modules, 8 exams and commercial rooftop competency.',8:'Operations Manager / Owner: 250 closed calls, 85% first-time fix, 4.7 rating, 38 modules, 10 exams and Universal / installer / commissioning / rooftop competencies.',9:'The top career grade. Manage the company, its department and operating finances.'};
  return heading('Career guide','Selected milestones from the resource’s merit catalog. In-game promotion is server-authorized.')+
    `<div class="filters"><label for="guide-grade">Explore a grade</label><select id="guide-grade">${grades.map((g,i)=>`<option value="${i}" ${i===guideGrade?'selected':''}>G${i} · ${g}</option>`).join('')}</select></div>`+
    `<div class="grid">`+card('CAREER G'+guideGrade,grades[guideGrade],guideGrade===0?'Learn the trade with fundamentals and the Helper entry workflow.':guideGrade>=7?'Supervision, complex job planning and company operations build on field experience.':'Training and service evidence build toward more advanced work.',linkButton('academy','Explore training')+linkButton('certification','Try competency preview'))+card(guideGrade===9?'TOP GRADE':'NEXT PROMOTION MILESTONE',guideGrade===9?'Operations management':grades[guideGrade+1],milestones[guideGrade])+`</div>`+notice('The role selector previews sample permissions. It does not grant a grade, certification, or permission in a FiveM server.');
}
function modal(html) {el('detail-content').innerHTML=html;el('detail').showModal();}
function completeStep() {
  const j=state.job;if(!j||!state.duty)return;
  const steps=jobSteps(j);
  if(j.step===4&&j.id!=='roof') {
    const part=j.id==='alta'?'capacitor':'filter';
    if(state.stock[part]<1){toast('The sample repair needs stock. Order the required part in Supply.',true);return;}
    state.stock[part]--;
  }
  j.evidence.push(steps[j.step][2]);
  if(j.step===6) {
    const revenue=j.id==='roof'?12400:j.id==='alta'?420:265;
    ledgerEntry(`Sample invoice · ${calls.find(c=>c.id===j.id).site}`,revenue,'Demo service revenue');state.closed++;state.job=null;currentView='dashboard';toast('Sample job completed. Invoice and call count updated.');
  } else j.step++;
  render();
}
function purchase(id,qty) {
  const p=products.find(p=>p.id===id);if(!p)return;
  if(!Number.isInteger(qty)||qty<1||qty>20){toast('Choose a whole quantity from 1 to 20.',true);return;}
  const cost=p.price*qty;if(state.balance-cost<state.floor){toast('This sample cash order would go below the operating floor.',true);return;}
  state.stock[id]+=qty;ledgerEntry(`${qty} × ${p.label}`,-cost,'Demo supplier · cash on delivery');toast(`${qty} sample ${p.label} added to stock.`);render();
}
function action(name,b) {
  if(name==='accept') {
    const c=calls.find(c=>c.id===b.dataset.id);
    if(!c||state.job||!state.duty||!state.uniform||!state.inspected||state.grade<c.grade||(c.type!=='Change-out'&&state.vehicle!=='van'))return;
    state.job={id:c.id,step:0,evidence:[]};navigate('active');toast('Sample work order accepted.');
  } else if(name==='call-detail') {
    const c=calls.find(c=>c.id===b.dataset.id);if(!c)return;
    modal(`<p class="eyebrow">SAMPLE DISPATCH BRIEF</p><h3>${c.title}</h3><p>${c.site} · ${c.unit}</p>${notice('“'+c.complaint+'”')}<p>Reported symptoms start the investigation. The Guided Job records the evidence before a conclusion is selected.</p>`);
  } else if(name==='job-next') completeStep();
  else if(name==='diagnose') {
    if(!state.job||state.job.step!==3||!state.duty)return;
    if(Number(b.dataset.answer)!==1){toast('That conclusion is not supported by the recorded sample evidence. Try again.',true);return;}completeStep();
  } else if(name==='abandon') {
    if(!state.job)return;
    modal('<h3>Abandon this sample work order?</h3><p>The current walkthrough and its evidence will be cleared. Previously used sample parts stay consumed.</p>'+button('confirm-abandon','Abandon sample work order'));
  } else if(name==='confirm-abandon') {state.job=null;el('detail').close();navigate('calls');toast('Sample work order abandoned.');}
  else if(name==='train') {if(!training.some(q=>q.id===b.dataset.id))return;quiz={id:b.dataset.id,answered:false,selected:null};render();}
  else if(name==='quiz-answer') {
    const selected=Number(b.dataset.answer);if(!Number.isInteger(selected)||selected<0||selected>2)return;
    if(currentView==='academy'&&quiz&&!quiz.answered){quiz.selected=selected;quiz.answered=true;}
    else if(currentView==='certification'&&exam&&!exam.answered&&!exam.done){exam.selected=selected;exam.answered=true;if(selected===training[exam.index].correct)exam.score++;}else return;
    render();
  } else if(name==='quiz-done') {
    if(!quiz||!quiz.answered)return;const q=training.find(t=>t.id===quiz.id);
    if(quiz.selected!==q.correct){quiz.answered=false;quiz.selected=null;render();return;}
    if(!state.training.has(q.id)){state.training.add(q.id);state.trained++;}
    if(state.grade===0){state.grade=1;guideGrade=1;toast('Fundamentals complete. Sample profile advanced to Apprentice.');}else toast('Training practice recorded in the sample profile.');
    quiz=null;render();
  } else if(name==='quiz-cancel') {quiz=null;render();}
  else if(name==='uniform') {if(!state.duty)return;state.uniform=!state.uniform;render();toast(state.uniform?'Sample duty workwear selected.':'Sample civilian outfit restored.');}
  else if(name==='checkout') {
    const v=fleet.find(v=>v.id===b.dataset.id);if(!v||!state.duty||!state.uniform||state.grade<v.grade||state.job)return;
    state.vehicle=state.vehicle===v.id?null:v.id;state.inspected=false;state.inspection.clear();render();toast(state.vehicle?'Sample vehicle assigned. Complete its inspection.':'Sample vehicle returned.');
  } else if(name==='inspect') {if(state.inspection.size!==3||!state.vehicle||!state.duty)return;state.inspected=true;render();toast('Sample fleet inspection signed.');}
  else if(name==='restock') {
    const additions=products.filter(p=>p.category!=='Tool').map(p=>({p,qty:Math.max(0,6-state.stock[p.id])}));const cost=additions.reduce((sum,{p,qty})=>sum+p.price*qty,0);
    if(!cost){toast('Sample service parts are already replenished.');return;}
    if(state.balance-cost<state.floor){toast('Replenishment would go below the demo operating floor.',true);return;}
    additions.forEach(({p,qty})=>state.stock[p.id]+=qty);ledgerEntry('Replenish sample service parts',-cost,'Demo supplier · cash on delivery');render();toast('Sample service parts replenished to six each.');
  } else if(name==='equipment') {
    const e=equipment.find(e=>e.id===b.dataset.id);if(!e)return;
    modal(`<p class="eyebrow">SERIALIZED REPLACEMENT PREVIEW</p><h3>${e.label}</h3>${notice('Sample serial DEMO-NEW-003 stays linked throughout the journey.')}<ol class="evidence"><li>Diagnosis identifies the old unit and replacement requirement.</li><li>Warehouse order assigns ${e.sku} and DEMO-NEW-003.</li><li>${e.transport} carries that same replacement.</li><li>The authored job plan determines access and ${e.lift}.</li><li>Old equipment is removed and the replacement installed.</li><li>Commissioning records the serial at the installed site.</li></ol><p>No 3D placement, vehicle, lift or order is created by this preview.</p>`);
  } else if(name==='quote') {
    const e=equipment.find(e=>e.id===b.dataset.id);if(!e||state.grade<e.grade)return;state.quote={label:e.label,price:e.id==='rooftop'?18000:e.id==='compact'?4800:6500};render();toast('Illustrative quote and held-deposit example created.');
  } else if(name==='buy') purchase(b.dataset.id,Number(el('qty-'+b.dataset.id)?.value));
  else if(name==='exam-start') {exam={index:0,score:0,answered:false,selected:null,done:false};render();}
  else if(name==='exam-next') {
    if(!exam||!exam.answered||exam.done)return;
    if(exam.index===2){exam.done=true;state.examPassed=exam.score===3;}else {exam.index++;exam.answered=false;exam.selected=null;}render();
  } else if(name==='exam-cancel') {exam=null;render();}
  else if(name==='owner-role') {reset('owner');navigate('company');toast('Owner scenario loaded. Previous sample state was reset.');}
  else if(name==='invest'||name==='return-capital') {
    if(state.role!=='owner')return;const amount=Number(el('capital-amount').value);
    if(!Number.isInteger(amount)||amount<100||amount>100000||amount%100!==0){toast('Enter a whole multiple of $100, from $100 to $100,000.',true);return;}
    if(name==='return-capital'&&(amount>state.capital||state.balance-amount<state.floor)){toast('The return exceeds sample invested capital or the operating floor.',true);return;}
    state.capital+=name==='invest'?amount:-amount;ledgerEntry(name==='invest'?'Sample owner capital investment':'Sample owner capital return',name==='invest'?amount:-amount,'Demo owner capital');render();toast('Sample capital and ledger updated.');
  }
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.view){navigate(b.dataset.view);return;}
  if(b.dataset.action)action(b.dataset.action,b);
});
document.addEventListener('change',event=>{
  const t=event.target;
  if(t.id==='persona'){reset(t.value);toast('Sample role loaded. Demo data reset.');}
  else if(t.id==='call-category'){activeFilters.category=t.value;render();}
  else if(t.id==='equipment-category'){catalogFilter=t.value;render();}
  else if(t.id==='supply-category'){supplyFilter=t.value;render();}
  else if(t.id==='guide-grade'){guideGrade=Number(t.value);render();}
  else if(t.dataset.ppe){t.checked?state.ppe.add(t.dataset.ppe):state.ppe.delete(t.dataset.ppe);toast('Sample PPE selection updated.');}
  else if(t.dataset.inspect!==undefined){t.checked?state.inspection.add(Number(t.dataset.inspect)):state.inspection.delete(Number(t.dataset.inspect));el('view').querySelector('[data-action="inspect"]').disabled=state.inspection.size!==3;}
});
document.addEventListener('input',event=>{
  if(event.target.id!=='call-search')return;
  const t=event.target,pos=t.selectionStart;activeFilters.search=t.value;render();const next=el('call-search');next.focus();next.setSelectionRange(pos,pos);
});
el('duty').addEventListener('click',()=>{state.duty=!state.duty;if(!state.duty){state.uniform=false;state.ppe.clear();}render();toast(state.duty?'Sample shift started. Select workwear in Locker if needed.':'Sample shift ended; workwear and PPE cleared.');});
el('reset').addEventListener('click',()=>{reset(el('persona').value);toast('Demo reset to the selected role.');});
el('dialog-close').addEventListener('click',()=>el('detail').close());
el('tabs').innerHTML=sections.map(([id,label,icon])=>`<button data-view="${id}"><img src="assets/tablet-ui/icon-${icon}.png" alt="">${label}</button>`).join('');
el('rail').innerHTML=sections.map(([id,label,icon],i)=>`<button data-view="${id}"><img src="assets/tablet-ui/icon-${icon}.png" alt=""><b>${String(i+1).padStart(2,'0')}</b><span>${label.toUpperCase()}</span></button>`).join('');
const clock=()=>{el('clock').textContent=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});};clock();setInterval(clock,30000);
reset();
