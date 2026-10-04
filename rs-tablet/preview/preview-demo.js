/* RS Tablet browser demo. All records and actions stay in this visitor's browser. */
(() => {
'use strict';
const now=()=>new Date().toISOString(),id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const native={weather:'Clear',weatherState:{name:'CLEAR',label:'Clear',temp:72,wind:6,humidity:48,hour:18,isNight:false,location:'Mission Row',rain:0,snow:0},coords:{x:221.44,y:-805.2,z:30.6},heading:184,street:'Power Street / Vespucci Boulevard',zone:'Mission Row',speed:0,altitude:31,clock:{h:18,m:42,s:0}};
const store={settings:{bankCardTheme:'fleeca',timeFormat:'24',brightness:80,volume:70,vibration:true,fontSize:100,droneSensitivity:100},cash:1250,bank:28450,
contacts:[{display_name:'Jordan Ellis',contact_number:'555-0142'},{display_name:'City Services',contact_number:'555-0100'}],
conversations:[{conversation_id:'welcome',title:'Jordan Ellis',display_name:'Jordan Ellis',peer_number:'555-0142',last_message:'The new tablet looks great. Try the display moods!',updated_at:now()}],
messages:[{message_id:'m1',sender_number:'555-0142',sender_name:'Jordan Ellis',body:'The new tablet looks great. Try the display moods!',created_at:now(),is_mine:false}],
emails:[{email_id:'e1',subject:'Welcome to your RS Tablet',sender_name:'Reality Sucks',sender_address:'hello@realitysucks.local',body:'Explore your apps, pick a shell and make the display your own. All data here is a browser demo.',created_at:now(),is_read:0}],
notes:[{note_id:'n1',title:'Weekend plans',body:'Explore the coast, meet the crew and capture a sunset.',is_pinned:1,updated_at:now()}],
reminders:[{reminder_id:'r1',text:'Meet at Legion Square',folder:'Personal',is_done:0,created_at:now()}],
tweets:[{tweet_id:'t1',author_name:'Jordan Ellis',handle:'@jordan',body:'Clear skies over Los Santos. Who is heading to the coast tonight?',created_at:now(),like_count:12,is_mine:false}],
news:[{news_id:'news1',headline:'A fresh view of Los Santos',category:'city',author_name:'City Desk',body:'New routes, new plans and a workspace that travels with you.',created_at:now()}],
ads:[{ad_id:'a1',title:'Weekend car meet',category:'event',poster_name:'City Crew',body:'Bring your favorite ride. Meet the crew by the pier at sunset.',price:0,contact_number:'555-0142',created_at:now()}],
transactions:[{kind:'deposit',label:'City contract',amount:850,counterparty:'City Services',created_at:now()}],
media:[{media_id:1,id:1,url:'img/wallpaper-ocean.webp',type:'photo',media_type:'photo',created_at:now()}],
recon:[{cameraId:'RTC-DEMO-1',label:'Garage mini camera',mountType:'world',distance:18,shareMode:'private',signal:94,batterySeconds:6900,online:true,isOwner:true,coords:{x:221,y:-805,z:31}}],
droneActive:false,blocked:[],replies:[],dark:[],businesses:[],invoices:[{invoice_id:'invoice1',label:'Parking permit',direction:'incoming',status:'unpaid',amount:75,created_at:now()}],requests:[]};
const places=[{label:'Legion Square',category:'jobs',x:215,y:-920,distance:115,postal:'200'},{label:'Mission Row',category:'police',x:425,y:-980,distance:310,postal:'201'},{label:'Pillbox Medical',category:'medical',x:307,y:-595,distance:240,postal:'202'},{label:'Downtown Garage',category:'garages',x:215,y:-810,distance:25,postal:'203'}];
const cameras=[{id:'mission-row',label:'Mission Row · Front entrance',group:'CITY GRID',coords:{x:425,y:-980,z:35},rotation:{x:-20,y:0,z:90}},{id:'legion-square',label:'Legion Square · Plaza',group:'CITY GRID',coords:{x:215,y:-920,z:40},rotation:{x:-20,y:0,z:180}},{id:'coastal-road',label:'Coastal Road · Junction',group:'TRANSPORT',coords:{x:-1200,y:-800,z:45},rotation:{x:-20,y:0,z:45}}];
const ok=data=>({ok:true,data}),boot=()=>({owner:{name:'Alex Mercer'},sim:{phone_number:'555-0199'},settings:{...store.settings},media:store.media,camera:{photoEnabled:true,videoEnabled:false},device:{storage_provider:'Browser demo'},drone:{available:true}});
function mutateList(key,field,payload){const found=store[key].find(x=>String(x[field])===String(payload[field]||payload[field.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]));return found;}
async function phone(action,p={}){
 switch(action){
 case 'getAppData':return ok({contacts:store.contacts,conversations:store.conversations,notes:store.notes,calls:[]});
 case 'getConversation':return ok({...store.conversations.find(c=>c.conversation_id===p.conversationId),messages:store.messages,peer_number:'555-0142'});
 case 'sendMessage':store.messages.push({message_id:id(),body:p.body,media_url:p.mediaUrl,is_mine:true,sender_number:'555-0199',created_at:now()});return ok({conversationId:p.conversationId||'welcome'});
 case 'saveContact':case 'addContact':store.contacts.push({display_name:p.name||p.displayName||'New contact',contact_number:p.number||p.contactNumber});return ok({contacts:store.contacts});
 case 'deleteContact':store.contacts=store.contacts.filter(c=>c.contact_number!==(p.number||p.contactNumber));return ok({contacts:store.contacts});
 case 'getBlockedNumbers':return ok({blocked:store.blocked});
 case 'blockNumber':store.blocked.push({phone_number:p.number});return ok({});
 case 'unblockNumber':store.blocked=store.blocked.filter(b=>b.phone_number!==p.number);return ok({});
 case 'getBank':return ok({cash:store.cash,bank:store.bank,transactions:store.transactions});
 case 'bankDeposit':case 'bankWithdraw':case 'bankTransfer':{
  const amount=Number(p.amount);if(!Number.isFinite(amount)||amount<=0)return {ok:false,error:'Choose a positive amount.'};
  if(action==='bankDeposit'&&amount>store.cash||action!=='bankDeposit'&&amount>store.bank)return {ok:false,error:'The demo balance is too low.'};
  if(action==='bankDeposit'){store.cash-=amount;store.bank+=amount;}else{store.bank-=amount;if(action==='bankWithdraw')store.cash+=amount;}
  store.transactions.unshift({kind:action==='bankDeposit'?'deposit':'withdraw',label:action==='bankTransfer'?'Demo transfer':'Demo '+action.replace('bank',''),amount,created_at:now()});return ok({bank:store.bank,cash:store.cash,transactions:store.transactions});}
 case 'getBills':return ok({bills:[{bill_id:'b1',label:'Parking permit',amount:75,issuer_name:'City Services',status:'unpaid'}]});
 case 'getEmails':case 'getEmail':return ok({emails:store.emails,email:store.emails.find(e=>e.email_id===p.emailId)||store.emails[0]});
 case 'getTweets':return ok({tweets:store.tweets});
 case 'postTweet':store.tweets.unshift({tweet_id:id(),author_name:'Alex Mercer',handle:'@alex',body:p.body,is_mine:true,created_at:now(),like_count:0});return ok({tweets:store.tweets});
 case 'likeTweet':{const t=store.tweets.find(t=>t.tweet_id===p.tweetId);if(t){t.liked_by_me=!t.liked_by_me;t.like_count+=t.liked_by_me?1:-1;}return ok({tweets:store.tweets});}
 case 'getNews':return ok({news:store.news,viewer:'555-0199'});
 case 'postNews':store.news.unshift({...p,news_id:id(),author_name:'Alex Mercer',author_number:'555-0199',created_at:now()});return ok({news:store.news});
 case 'getAds':return ok({ads:store.ads});
 case 'postAd':store.ads.unshift({...p,ad_id:id(),poster_name:'Alex Mercer',is_mine:1,created_at:now()});return ok({ads:store.ads});
 case 'getContentReplies':return ok({replies:store.replies});
 case 'postContentReply':store.replies.push({reply_id:id(),body:p.body,author_name:'Alex Mercer',is_mine:true,created_at:now()});return ok({replies:store.replies});
 case 'getReminders':return ok({reminders:store.reminders});
 case 'saveReminder':store.reminders.push({...p,reminder_id:id(),is_done:0,created_at:now()});return ok({reminders:store.reminders});
 case 'toggleReminder':{const r=store.reminders.find(r=>r.reminder_id===p.reminderId);if(r)r.is_done=r.is_done?0:1;return ok({reminders:store.reminders});}
 case 'saveNote':{let n=store.notes.find(n=>n.note_id===p.noteId);if(!n){n={note_id:id()};store.notes.push(n);}Object.assign(n,{title:p.title,body:p.body,is_pinned:p.pinned?1:0,updated_at:now()});return ok({notes:store.notes});}
 case 'getMapBase':return ok({bounds:{minX:-4000,maxX:4500,minY:-4400,maxY:8000},postals:places.map((p,i)=>({code:String(200+i),x:p.x,y:p.y}))});
 case 'getMapData':return ok({own:{...native.coords},friends:[],signals:[],postal:{code:'203'}});
 case 'getNearbyPlaces':return ok({places});
 case 'getGarage':return ok({vehicles:[{label:'Sultan RS',vehicle:'sultan',plate:'RS 2026',garage:'Downtown Garage',fuel:86,engineHealth:985,bodyHealth:970}],actions:{track:true,favorite:true,rename:true}});
 case 'getRacingStats':case 'getRaces':return ok({connected:true,races:[{name:'Coastal Circuit',label:'Coastal Circuit',distance:5200}],results:[]});
 case 'getHouses':return ok({listings:[{title:'Vespucci apartment',location:'Vespucci',price:120000,x:-1100,y:-1500}],actions:{}});
 case 'getPlatform':case 'getWork':return ok({currentJob:{label:'City Services'},jobs:[{label:'Courier',name:'courier',description:'Deliver parcels around the city.'}],opportunities:[],services:[{id:'repair',label:'Roadside help',description:'Arrange a sample roadside service.'}],delivery:[],rentals:[],requests:store.requests,invoices:store.invoices});
 case 'requestOpportunity':case 'requestService':case 'requestDelivery':case 'requestRental':store.requests.push({label:p.id||'City service',status:'pending',created_at:now()});return ok({});
 case 'sendInvoice':store.invoices.push({invoice_id:id(),label:p.label,amount:p.amount,direction:'outgoing',status:'unpaid',created_at:now()});return ok({});
 case 'payInvoice':{const invoice=store.invoices.find(i=>i.invoice_id===p.invoiceId);if(invoice&&invoice.status==='unpaid'){if(store.bank<invoice.amount)return {ok:false,error:'The demo balance is too low.'};store.bank-=invoice.amount;invoice.status='paid';}return ok({});}
 case 'getRacing':case 'getRaceStandings':return ok({races:[{id:'coastal',label:'Coastal Circuit',status:'open',distance:5200}],results:[],providers:[]});
 case 'getStats':return ok({stats:{kills:3,deaths:1,distance:1200},kills:3,deaths:1});
 case 'getDirectory':case 'getYellowPages':return ok({canList:true,categories:['general','services','food'],places,businesses:[{name:'City Services',label:'City Services',phone:'555-0100',x:215,y:-920,description:'Transport, permits and city services.'},...store.businesses]});
 case 'getDarkMarket':case 'getDarkListings':return ok({listings:store.dark});
 case 'postDarkListing':store.dark.unshift({...p,listing_id:id(),alias:'Anonymous',is_mine:1});return ok({});
 case 'deleteDarkListing':store.dark=store.dark.filter(x=>x.listing_id!==p.listingId);return ok({});
 case 'listBusiness':store.businesses.push({...p,id:id(),phone:'555-0199',ownerNumber:'555-0199'});return ok({});
 case 'removeBusiness':store.businesses=store.businesses.filter(x=>x.id!==p.id);return ok({});
 case 'sendEmail':store.emails.unshift({...p,email_id:id(),sender_name:'Alex Mercer',sender_address:'alex@demo.local',created_at:now(),is_read:1});return ok({});
 case 'deleteEmail':store.emails=store.emails.filter(x=>x.email_id!==p.emailId);return ok({});
 case 'deleteMedia':store.media=store.media.filter(x=>String(x.media_id)!==String(p.mediaId));return ok({});
 case 'deleteMediaBatch':store.media=store.media.filter(x=>!(p.mediaIds||[]).map(String).includes(String(x.media_id)));return ok({});
 case 'shareLocation':store.messages.push({message_id:id(),body:'Legion Square · Sample shared location',message_type:'location',is_mine:true,created_at:now()});return ok({});
 case 'createGroup':{const group={conversation_id:id(),title:p.title,is_group:true,members:p.members,messages:[]};store.conversations.push(group);return ok({conversation:group});}
 case 'addGroupMember':{const group=store.conversations.find(x=>x.conversation_id===p.conversationId);if(group)(group.members||=[]).push(p.number);return ok({conversation:group});}
 case 'leaveGroup':store.conversations=store.conversations.filter(x=>x.conversation_id!==p.conversationId);return ok({});
 case 'deleteContentReply':store.replies=store.replies.filter(x=>x.reply_id!==p.replyId);return ok({});
 case 'getSOSList':return ok({signals:[]});
 case 'deleteNote':store.notes=store.notes.filter(x=>x.note_id!==p.noteId);return ok({});
 case 'deleteReminder':store.reminders=store.reminders.filter(x=>x.reminder_id!==p.reminderId);return ok({});
 case 'deleteTweet':store.tweets=store.tweets.filter(x=>x.tweet_id!==p.tweetId);return ok({});
 case 'deleteNews':store.news=store.news.filter(x=>x.news_id!==p.newsId);return ok({});
 case 'deleteAd':store.ads=store.ads.filter(x=>x.ad_id!==p.adId);return ok({});
 case 'startCall':window.RSTabletCore?.toast('Tablet Calls','Demo call to '+p.number+'. Voice connects inside FiveM.');return ok({});
 default:window.RSTabletCore?.toast('Browser demo','Sample action complete.');return ok({});
 }
}
let feedIndex=0,feedPan=0,feedZoom=1;
function showFeed(kind,selected){
 let modal=document.getElementById('preview-feed');if(!modal){modal=document.createElement('section');modal.id='preview-feed';modal.setAttribute('role','dialog');modal.setAttribute('aria-label','Demo live camera');modal.innerHTML='<div class="preview-feed-scene"><div class="preview-feed-crosshair"></div></div><header><div><small>BROWSER DEMO · SAMPLE CAMERA</small><h2 id="preview-feed-title"></h2></div><button id="preview-feed-close">Return to Tablet · ESC</button></header><footer><span>Q / E cameras · arrows pan · wheel zoom</span><button id="preview-feed-prev">Previous camera</button><button id="preview-feed-next">Next camera</button></footer>';document.body.append(modal);}
 feedIndex=Math.max(0,cameras.findIndex(c=>c.id===selected));modal.dataset.kind=kind;modal.hidden=false;document.body.classList.add('preview-feed-active');
 const draw=()=>{document.getElementById('preview-feed-title').textContent=(kind==='drone'?'Scout Drone · ':kind==='recon'?'Micro Recon · ':'CCTV · ')+cameras[feedIndex].label;modal.style.setProperty('--feed-pan',feedPan+'px');modal.style.setProperty('--feed-zoom',feedZoom);};
 const close=()=>{modal.hidden=true;document.body.classList.remove('preview-feed-active');window.RSTabletCore?.openApp(kind==='drone'?'drone':kind==='recon'?'recon':'cctv');};
 document.getElementById('preview-feed-close').onclick=close;document.getElementById('preview-feed-prev').onclick=()=>{feedIndex=(feedIndex+cameras.length-1)%cameras.length;draw();};document.getElementById('preview-feed-next').onclick=()=>{feedIndex=(feedIndex+1)%cameras.length;draw();};
 modal.onwheel=e=>{e.preventDefault();feedZoom=Math.max(1,Math.min(3,feedZoom+(e.deltaY<0?.1:-.1)));draw();};
 modal._key=e=>{if(modal.hidden)return;if(e.key==='Escape')close();if(e.key.toLowerCase()==='q')document.getElementById('preview-feed-prev').click();if(e.key.toLowerCase()==='e')document.getElementById('preview-feed-next').click();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){feedPan+=e.key==='ArrowLeft'?-12:12;draw();}e.stopImmediatePropagation();e.preventDefault();};
 if(!modal.dataset.bound){document.addEventListener('keydown',e=>{if(!modal.hidden)modal._key(e);},true);modal.dataset.bound='true';}draw();
}
async function rpc(action,p={}){
 switch(action){
 case 'phone.request':return phone(p.action,p.payload||{});
 case 'phone.bootstrap':return ok(boot());
 case 'phone.settings.patch':case 'tablet.settings.patch':Object.assign(store.settings,p.patch||{});return ok({settings:{...store.settings}});
 case 'tablet.settings.get':return ok({settings:{...store.settings}});
 case 'providers.snapshot':return ok({phone:{available:true},radio:{available:true},pager:{available:true}});
 case 'integration.list':return ok([]);
 case 'cctv.list':return ok(cameras);
 case 'cctv.view':showFeed('cctv',p.id);return ok({});
 case 'cctv.stop':document.getElementById('preview-feed-close')?.click();return ok({});
 case 'phone.drone.status':return ok({available:true,active:store.droneActive,reconAvailable:true,reconActive:false});
 case 'phone.drone.launch':store.droneActive=true;showFeed('drone','mission-row');return ok({});
 case 'phone.drone.recall':case 'phone.drone.stop':store.droneActive=false;return ok({});
 case 'phone.recon.open':window.RSTabletCore?.openApp('recon');return ok({});
 case 'drones.fleet':case 'drones.zombiecore.fleet':return ok({drones:[]});
 case 'recon.list':return {...ok(store.recon),item:'micro_recon_camera'};
 case 'recon.place':store.recon.push({...store.recon[0],cameraId:id(),label:'New mini camera',distance:2});window.RSTabletCore?.openApp('recon');return ok({});
 case 'recon.view':showFeed('recon','mission-row');return ok({});
 case 'recon.rename':{const c=store.recon.find(c=>c.cameraId===p.cameraId);if(c)c.label=p.label;return ok({});}
 case 'recon.share':{const c=store.recon.find(c=>c.cameraId===p.cameraId);if(c)c.shareMode=p.mode;return ok({});}
 case 'recon.delete':case 'recon.recover':store.recon=store.recon.filter(c=>c.cameraId!==p.cameraId);return ok({});
 case 'maps.currentWaypoint':return ok({x:215,y:-920,z:30});
 case 'tablet.media.capabilities':return ok({storage:true,photo:true,video:false,provider:'Browser demo',library:'tablet'});
 case 'tablet.media.list':return ok(store.media);
 case 'tablet.media.delete':store.media=store.media.filter(m=>m.id!==p.id);return ok({});
 case 'phone.media.fetch':return {ok:false,error:'Use the sample photo in this demo.'};
 case 'phone.camera.start':store.media.unshift({id:Date.now(),media_id:Date.now(),url:'img/wallpaper-ocean.webp',type:'photo',media_type:'photo',created_at:now()});window.RSTabletCore?.toast('Camera','Sample photo added to Photos. Native capture runs inside FiveM.');return ok({});
 case 'scanner.vehicle':return ok({label:'Sultan RS',plate:'RS 2026',fuel:86,engineHealth:985,bodyHealth:970});
 case 'vehiclelab.read':return ok({});
 default:return ok({});
 }
}
async function nui(name,p={}){
 switch(name){
 case 'loadSetting':return {ok:true,value:localStorage.getItem('rs_tablet_preview_'+p.key)};
 case 'saveSetting':localStorage.setItem('rs_tablet_preview_'+p.key,String(p.value??''));return {ok:true};
 case 'nativeSnapshot':return ok(native);
 case 'setWaypoint':window.RSTabletCore?.toast('Maps','Demo route selected. GTA GPS is available in-game.');return ok({});
 case 'scanWorld':return ok({hit:true,street:'Power Street',zone:'Mission Row',point:native.coords,entity:{type:'vehicle',displayName:'Sultan RS',plate:'RS 2026',distance:8.4,speed:0,engineHealth:985,bodyHealth:970,fuel:86,model:'sultan'}});
 case 'scanVehicle':return ok({type:'vehicle',displayName:'Sultan RS',plate:'RS 2026',distance:4.7,speed:0,engineHealth:985,bodyHealth:970,tankHealth:995,fuel:86,lockStatus:1,model:'sultan',netId:341});
 case 'launchPrivilegedTool':window.RSTabletCore?.toast('Builder Tools','Explore the tools inside FiveM. This demo has no server or admin access.');return {ok:false,error:'Available inside FiveM.'};
 case 'close':document.getElementById('preview-reopen').hidden=false;return {ok:true};
 case 'sendSOS':window.RSTabletCore?.receiveNotification({title:'Demo emergency beacon',body:'A sample alert. No message was sent.',meta:{app:'sos'}});return {ok:true};
 default:return {ok:true};
 }
}
window.RSTabletPreview={rpc,nui,native};
document.addEventListener('DOMContentLoaded',()=>{
 const toolbar=document.createElement('div');toolbar.className='preview-toolbar';toolbar.innerHTML='<span>RS TABLET · INTERACTIVE DEMO</span><div><button id="preview-home">Home</button><button id="preview-reopen" hidden>Reopen Tablet</button><button id="preview-lock">Lock</button><button id="preview-notify">Test notification</button></div>';
 document.body.append(toolbar);document.getElementById('preview-home').onclick=()=>window.RSTabletCore?.home();document.getElementById('preview-lock').onclick=()=>window.RSTabletCore?.lock();document.getElementById('preview-notify').onclick=()=>window.RSTabletCore?.receiveNotification({title:'Jordan Ellis',body:'Your next adventure starts here. 👋',meta:{app:'messages'}});
 document.getElementById('preview-reopen').onclick=()=>{location.reload();};
});
})();
