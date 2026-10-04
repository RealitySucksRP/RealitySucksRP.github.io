'use strict';
(() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  const emit = data => window.dispatchEvent(new MessageEvent('message', { data }));
  const wait = (fn, ms = 60) => setTimeout(fn, ms);
  const jsonResponse = data => Promise.resolve(new Response(JSON.stringify(data), {status:200,headers:{'Content-Type':'application/json'}}));
  const icon = category => `assets/storefront/${category}.png`;

  const products = [
    ['water','Sparkling Water','drinks',5],['cola','Cola','drinks',6],['coffee','Coffee','drinks',7],['burger','Burger','food',9],
    ['sandwich','Fresh Sandwich','food',8],['snacks','Snack Pack','food',4],['mask','Street Mask','masks',35],['cards','Playing Cards','cards',12],
    ['cigarettes','Cigarettes','cigarettes',18],['cigars','Cigars','cigars',25],['energy','Energy Drink','drinks',7],['meal','Hot Meal','food',11]
  ].map(([item,label,category,price],i)=>({item,label,description:i===0?'Cold bottled water for the neighborhood.':'Fresh stock ready for sale.',category,price,image:icon(['drinks','food','masks','cards','cigarettes','cigars'].includes(category)?category:'store')}));

  const store = {
    label:'RealitySucks Market', category:'general', status:'draft',
    storefront:{theme:'rail',logo:'assets/storefront/rs-logo.png',banner:'',welcome:'Welcome',tagline:'Everything you need, right here.',itemsPerPage:12,search:true,showStock:true,posMode:'cart',
      categories:[{id:'general',label:'General',icon:'store',enabled:true},{id:'food',label:'Food',icon:'food',enabled:true},{id:'drinks',label:'Drinks',icon:'drinks',enabled:true}],
      pages:[{id:'home',label:'Home',category:'all',enabled:true},{id:'shop',label:'Shop',category:'all',enabled:true}]},
    supplier:{enabled:true,autoRestock:true,deliveryFlatFee:0,deliveryPercent:0,managerPurchaseLimit:7500,ownerPurchaseLimit:250000},
    products, vendors:[{pedId:'ped_vendor_01'}], ownership:{mode:'public',job:'',minGrade:0,identifier:'',requireDuty:false},
    payments:{cash:true,bank:true,default:'cash'},
    points:{checkout:{x:24.4,y:-1346.7,z:29.5},stock:{x:28.1,y:-1339.2,z:29.5},management:{x:29.2,y:-1340.8,z:29.5},employee:{x:30.1,y:-1342.0,z:29.5}}
  };

  const entity = (id,model,kind,x,y,z,builderKind=kind)=>({id,model,kind,layer:'default',transform:{position:{x,y,z},rotation:{x:0,y:0,z:0},scale:{xy:1,z:1}},properties:{collision:true},metadata:{builder:{kind:builderKind}}});
  let project = {
    id:'demo_market_001', name:'RealitySucks Market', type:'world', revision:12,
    entities:[
      entity('counter_01','prop_till_01','object',24.48,-1346.55,29.49,'furniture'),
      entity('shelf_01','prop_rub_cabinet02','object',27.15,-1344.10,29.49,'furniture'),
      entity('display_01','prop_food_bs_tray_03','object',25.90,-1345.05,29.90,'furniture'),
      entity('ped_vendor_01','s_m_m_linecook','ped',24.85,-1346.10,29.49,'ped')
    ], store:clone(store), shell:{}
  };
  let selectedId = null;
  let editor = {mode:'walk',positionSnap:.05,rotationSnap:5,transformSpace:'world',gizmoTool:'translate',saveState:'idle',playerFrozen:false,readOnly:false};
  let stock = Object.fromEntries(products.map((p,i)=>[p.item,65+i*5]));
  let business = {storeId:'demo_market_001',label:'RealitySucks Market',balance:2450,stock:clone(stock),products:clone(products),ledger:[
    {entry_type:'sale',note:'Customer purchase',amount:25},{entry_type:'supplier',note:'Supplier restock',amount:-90},{entry_type:'deposit',note:'Owner deposit',amount:500},{entry_type:'sale',note:'Customer purchase',amount:18}
  ],finance:{available:2450,tradeOwed:120,tradeLimit:5000,rentOwed:0,unitCosts:Object.fromEntries(products.map(p=>[p.item,Math.max(1,Math.round(p.price*.55))])),autoRestock:true}};

  const catalogRows = [
    ['prop_till_01','furniture',['checkout']],['prop_till_02','furniture',['checkout']],['prop_cash_till','furniture',['checkout']],
    ['prop_rub_cabinet02','furniture',['displays','stock']],['prop_shop_shelf_01','furniture',['displays']],['prop_shop_shelf_02','furniture',['displays']],
    ['prop_food_bs_tray_03','furniture',['cuisine','displays']],['prop_food_cb_tray_02','furniture',['cuisine']],['prop_bar_fridge_01','furniture',['cuisine']],
    ['prop_table_03','furniture',['decor']],['prop_chair_04a','furniture',['decor']],['prop_plant_int_04a','furniture',['decor']],
    ['prop_wall_light_01a','lighting',['decor','electronics']],['prop_ld_farm_chair01','furniture',['decor']],['prop_door_01','opening',['structure']],
    ['prop_fnclink_03gate5','opening',['structure']],['prop_const_fence02a','structure',['structure']],['prop_toolchest_05','furniture',['mechanic']],
    ['prop_tool_bench02','furniture',['mechanic']],['prop_tv_flat_01','furniture',['electronics']],['prop_laptop_01a','furniture',['electronics']]
  ].map(([model,category,collections])=>({model,category,collections}));
  const collections = [
    ['structure','Structure','Walls, doors, barriers and store shell pieces.'],['checkout','Checkout','Counters, registers and POS pieces.'],['displays','Displays','Shelves, cases and product displays.'],
    ['cuisine','Cuisine','Food-service counters and equipment.'],['boutique','Boutique','Retail fixtures and fashion-store pieces.'],['electronics','Electronics','Screens, devices and technology displays.'],
    ['mechanic','Mechanic','Workshop benches, tools and service fixtures.'],['decor','Decor','Furniture, plants and finishing details.'],['stock','Stock','Back-room shelves, cabinets and storage.']
  ].map(([id,label,hint])=>({id,label,hint,count:catalogRows.filter(r=>r.collections.includes(id)).length}));
  const pedCollections = [{id:'workers',label:'STORE WORKERS',models:['s_m_m_linecook','s_f_y_shop_mid','s_m_m_autoshop_01','a_m_y_business_02']},{id:'security',label:'SECURITY',models:['s_m_m_security_01','s_m_y_blackops_01']}];
  const animCollections = [{label:'Store Work',hint:'Common counter and service poses.',poses:[{dict:'amb@prop_human_atm@male@idle_a',clip:'idle_a'},{dict:'amb@world_human_clipboard@male@idle_a',clip:'idle_c'},{dict:'amb@world_human_stand_mobile@male@text@base',clip:'base'}]}];
  const inventoryItems = products.map(p=>({name:p.item,label:p.label,image:p.image,imageProvider:'demo',count:99}));
  const projects = ()=>[{id:project.id,name:project.name,type:project.type,revision:project.revision,ownership:'mine'}];

  function currentSelected(){ return project.entities.find(e=>e.id===selectedId)||null; }
  function openBase(){
    emit({action:'open',version:'0.7.4 DEMO',projects:projects(),previewImages:{}});
    emit({action:'catalogReset',collections,pedCollections,animCollections,pedThumbnailUrl:false,poseFlag:1});
    emit({action:'catalogChunk',rows:catalogRows,complete:true});
    emit({action:'worldProbe',hit:true,aim:{x:24.8,y:-1345.9,z:29.5},player:{x:23.7,y:-1347.4,z:29.5,heading:178.2}});
  }
  function loadProject(){
    emit({action:'projectLoaded',project:clone(project),readOnly:false});
    emit({action:'editorState',...editor,selected:currentSelected(),readOnly:false,shell:project.shell||{}});
  }
  function showEditor(){
    window.RSStorefrontUI?.closeViews?.();
    document.getElementById('shopDialog')?.classList.add('is-hidden');
    document.getElementById('storeDialog')?.classList.add('is-hidden');
    openBase(); wait(loadProject,30);
  }
  function showSetup(){
    showEditor(); wait(()=>{ window.RSStorefrontUI?.renderBuilder(project.store); document.getElementById('storeDialog')?.classList.remove('is-hidden'); },90);
  }
  function showShop(){
    document.getElementById('storeDialog')?.classList.add('is-hidden');
    openBase(); wait(()=>window.RSStorefrontUI?.openCustomer(project.id,clone(project.store),clone(stock)),40);
  }
  function showBoss(){
    document.getElementById('storeDialog')?.classList.add('is-hidden');
    openBase(); wait(()=>window.RSStorefrontUI?.handleMessage({action:'bossOpen',business:clone(business)}),40);
  }
  function reset(){
    project.store=clone(store); stock=Object.fromEntries(products.map((p,i)=>[p.item,65+i*5])); business.balance=2450; business.stock=clone(stock); selectedId=null; editor={mode:'walk',positionSnap:.05,rotationSnap:5,transformSpace:'world',gizmoTool:'translate',saveState:'idle',playerFrozen:false,readOnly:false}; showEditor();
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init={}) => {
    const url = String(input);
    if (!url.startsWith('https://rs-storebuilder/')) return nativeFetch(input,init);
    const eventName = url.slice('https://rs-storebuilder/'.length).split(/[?#]/)[0];
    let data={}; try{ data=JSON.parse(init.body||'{}'); }catch{}
    const ok={ok:true,pending:true};
    switch(eventName){
      case 'loadProject': wait(loadProject); return jsonResponse(ok);
      case 'createProject': project={...project,id:'demo_'+Date.now(),name:data.name||'New Demo Store',type:data.type||'world',revision:1,entities:[],store:clone(store)}; wait(()=>{emit({action:'projectList',projects:projects()});loadProject();}); return jsonResponse(ok);
      case 'save': editor.saveState='saving'; wait(()=>{project.revision++;editor.saveState='saved';emit({action:'saved',revision:project.revision,saveState:'saved'});},100); return jsonResponse(ok);
      case 'undo': case 'redo': wait(()=>emit({action:'toast',message:`${eventName.toUpperCase()} simulated in browser demo.`,tone:'info'})); return jsonResponse(ok);
      case 'setMode': editor.mode=data.mode||editor.mode; editor.gizmoTool=data.tool||editor.gizmoTool; wait(()=>emit({action:'editorState',...editor,selected:currentSelected(),readOnly:false})); return jsonResponse(ok);
      case 'configureTransform': editor.transformSpace=data.space||editor.transformSpace; editor.positionSnap=Number(data.positionSnap??editor.positionSnap); editor.rotationSnap=Number(data.rotationSnap??editor.rotationSnap); editor.gizmoTool=data.tool||editor.gizmoTool; wait(()=>emit({action:'editorState',...editor,selected:currentSelected(),readOnly:false})); return jsonResponse(ok);
      case 'freezePlayer': editor.playerFrozen=!editor.playerFrozen; wait(()=>emit({action:'editorState',...editor,selected:currentSelected(),readOnly:false})); return jsonResponse(ok);
      case 'focusWorld': wait(()=>emit({action:'toast',message:'In FiveM this hands control back to the game world. Browser demo keeps the UI active.',tone:'info'})); return jsonResponse(ok);
      case 'previewModel': case 'previewPose': wait(()=>emit({action:'placementHelp',phase:'preview',text:'Browser demo: live world preview is simulated. In FiveM the selected model follows your world aim.'})); return jsonResponse(ok);
      case 'clearPreview': emit({action:'placementHelp',phase:'closed',text:''}); return jsonResponse(ok);
      case 'addModel': { const id='demo_obj_'+(project.entities.length+1); const e=entity(id,data.model||'prop_till_01','object',25+project.entities.length*.2,-1345.5,29.5,data.builderKind||'object'); project.entities.push(e);project.revision++;selectedId=id;wait(()=>{emit({action:'entityUpsert',entity:clone(e)});emit({action:'revision',revision:project.revision});emit({action:'editorState',...editor,selected:clone(e),readOnly:false});}); return jsonResponse(ok); }
      case 'addPed': { const id='demo_ped_'+(project.entities.length+1); const e=entity(id,data.model||'s_f_y_shop_mid','ped',25.4,-1345.3,29.5,'ped'); project.entities.push(e);project.revision++;selectedId=id;wait(()=>{emit({action:'entityUpsert',entity:clone(e)});emit({action:'editorState',...editor,selected:clone(e),readOnly:false});}); return jsonResponse(ok); }
      case 'selectObject': selectedId=data.objectId; wait(()=>emit({action:'editorState',...editor,selected:clone(currentSelected()),readOnly:false})); return jsonResponse(ok);
      case 'applyTransform': { const e=currentSelected(); if(e){e.transform.position={x:Number(data.x)||0,y:Number(data.y)||0,z:Number(data.z)||0};e.transform.rotation={x:Number(data.rx)||0,y:Number(data.ry)||0,z:Number(data.rz)||0};e.transform.scale={xy:Number(data.sxy)||1,z:Number(data.sz)||1};project.revision++;wait(()=>{emit({action:'entityUpsert',entity:clone(e)});emit({action:'revision',revision:project.revision});});} return jsonResponse(ok); }
      case 'setObjectCollision': {const e=currentSelected();if(e)e.properties.collision=data.collision!==false;wait(()=>emit({action:'editorState',...editor,selected:clone(e),readOnly:false}));return jsonResponse(ok);}
      case 'transformAction': wait(()=>emit({action:'toast',message:`${String(data.action||'Transform')} is a real in-world action in FiveM; this browser demo leaves the sample entity in place.`,tone:'info'})); return jsonResponse(ok);
      case 'requestInventoryCatalog': wait(()=>emit({action:'inventoryCatalog',items:clone(inventoryItems)})); return jsonResponse(ok);
      case 'storeConfig': project.store={...project.store,...clone(data.store),points:project.store.points||clone(store.points)};project.revision++;wait(()=>emit({action:'projectLoaded',project:clone(project),readOnly:false}),120); return jsonResponse(ok);
      case 'storePoint': project.store.points=project.store.points||{};project.store.points[data.pointType]={x:24.7,y:-1346.3,z:29.5};wait(()=>emit({action:'projectLoaded',project:clone(project),readOnly:false})); return jsonResponse(ok);
      case 'storeReadiness': wait(()=>emit({action:'storeReadiness',readiness:{ready:true,framework:'qbox',inventory:'ox_inventory',items:[{label:'Store name',ok:true},{label:'Pages',ok:true},{label:'Categories',ok:true},{label:'Products',ok:true},{label:'Sales endpoint',ok:true,detail:'Vendor + checkout configured'},{label:'Payment method',ok:true}]}}),90); return jsonResponse(ok);
      case 'publishStore': project.store.status='published';wait(()=>{emit({action:'projectLoaded',project:clone(project),readOnly:false});emit({action:'toast',message:'Demo store published locally. The real resource performs the server publish gate.',tone:'success'});}); return jsonResponse(ok);
      case 'unpublishStore': project.store.status='draft';wait(()=>emit({action:'toast',message:'Demo store closed locally.',tone:'info'})); return jsonResponse(ok);
      case 'purchaseStore': { let total=0; for(const line of data.lines||[]){const p=products.find(x=>x.item===line.item);const q=Math.max(0,Number(line.quantity)||0);if(p){stock[p.item]=Math.max(0,(stock[p.item]||0)-q);total+=p.price*q;}} business.balance+=total;business.stock=clone(stock);business.ledger.unshift({entry_type:'sale',note:'Browser demo checkout',amount:total});wait(()=>{emit({action:'purchaseResult',result:{storeId:project.id,ok:true,total}});emit({action:'storeStock',storeId:project.id,stock:clone(stock)});},180);return jsonResponse(ok); }
      case 'businessDeposit': business.balance+=Math.max(0,Number(data.amount)||0);business.finance.available=business.balance;wait(()=>emit({action:'bossOpen',business:clone(business)}),120); return jsonResponse(ok);
      case 'businessWithdraw': business.balance=Math.max(0,business.balance-Math.max(0,Number(data.amount)||0));business.finance.available=business.balance;wait(()=>emit({action:'bossOpen',business:clone(business)}),120); return jsonResponse(ok);
      case 'stockIntake': case 'supplierOrder': {const q=Math.max(1,Number(data.quantity)||1);stock[data.item]=(stock[data.item]||0)+q;business.stock=clone(stock);wait(()=>emit({action:'bossOpen',business:clone(business)}),120);return jsonResponse(ok);}
      case 'supplierPayment': business.finance.tradeOwed=Math.max(0,business.finance.tradeOwed-Math.max(0,Number(data.amount)||business.finance.tradeOwed));wait(()=>emit({action:'bossOpen',business:clone(business)}),120);return jsonResponse(ok);
      case 'requestBlueprints': wait(()=>emit({action:'blueprintList',blueprints:[{id:'bp_corner_market',name:'Corner Market Shell',projectType:'shell',revision:3},{id:'bp_retail_unit',name:'Small Retail Unit',projectType:'world',revision:2}]})); return jsonResponse(ok);
      case 'instantiateBlueprint': wait(()=>emit({action:'toast',message:'Blueprint placement is simulated here; the real resource instantiates it at the player position.',tone:'success'})); return jsonResponse(ok);
      case 'diagnostics': wait(()=>emit({action:'diagnostics',diagnostics:{mode:'browser-demo',projectId:project.id,revision:project.revision,entities:project.entities.length,storeStatus:project.store.status||'draft',framework:'simulated qbox',inventory:'simulated ox_inventory'},requested:true})); return jsonResponse(ok);
      case 'setPreviewImage': wait(()=>emit({action:'toast',message:'Preview image changes are not persisted in the public demo.',tone:'info'})); return jsonResponse(ok);
      case 'shellAction': case 'saveShellBlueprint': wait(()=>emit({action:'toast',message:'Shell/world-coordinate actions require FiveM. This public demo shows the UI only.',tone:'info'})); return jsonResponse(ok);
      case 'close': case 'closeShop': return jsonResponse(ok);
      default: return jsonResponse(ok);
    }
  };

  const badge=document.createElement('div'); badge.className='demo-badge'; badge.innerHTML='<b>LIVE BROWSER DEMO</b><span>local sample data</span>'; document.body.appendChild(badge);
  let noteTimer; function nativeNote(text){let n=document.querySelector('.demo-native-note');if(!n){n=document.createElement('div');n.className='demo-native-note';document.body.appendChild(n);}n.innerHTML=`<strong>FiveM-only:</strong> ${text}`;clearTimeout(noteTimer);noteTimer=setTimeout(()=>n.remove(),4800);}

  window.addEventListener('message',event=>{
    const d=event.data||{};
    if(d.source==='rs-storebuilder-showcase'){
      if(d.view==='editor')showEditor(); else if(d.view==='setup')showSetup(); else if(d.view==='shop')showShop(); else if(d.view==='boss')showBoss(); else if(d.view==='reset')reset();
    }
  });
  document.addEventListener('click',event=>{
    const id=event.target?.id||'';
    if(['coordAimBtn','focusWorldBtn'].includes(id))nativeNote('world camera aiming and raycasts run inside the game client.');
  },true);

  const launch=()=>{ openBase(); wait(loadProject,60); };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>wait(launch,60)); else wait(launch,60);
})();