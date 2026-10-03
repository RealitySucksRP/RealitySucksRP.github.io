/* Theme and operations layer for the shipped radio NUI. No external assets or fonts. */
(() => {
    'use strict';
    const kind = resource === 'rs-radioems' ? 'ems' : resource === 'rs-radiopolice' ? 'police' : resource === 'rs-radiogangs' ? 'gang' : 'zombie';
    const definitions = {
        ems: { brand: 'MEDLINK', network: 'EMS RESPONSE', home: 'RESPONSE', units: 'MEDICS', sos: 'MAYDAY', ops: 'TRIAGE DISPATCH', code: 'MED',
            themes: [['one','Clinical Night','#36d6db','#07191f','scan'],['two','Trauma Red','#ff6c79','#26121a','pulse'],['three','Rescue Amber','#efc275','#231e13','clean']],
            channels: [[110,'EMS DISPATCH'],[112,'TRAUMA RESPONSE'],[113,'PATIENT TRANSFER'],[114,'MEDICAL COMMAND']], callsign:'MEDIC-12' },
        police: { brand: 'BLUELINE', network: 'LAW ENFORCEMENT', home: 'PATROL', units: 'UNITS', sos: 'PANIC', ops: 'CAD DISPATCH', code: 'CAD',
            themes: [['one','Night Patrol','#6fafff','#081526','scan'],['two','Tactical Olive','#c3d58a','#181e12','clean'],['three','Command Red','#ff8292','#24131d','pulse']],
            channels: [[101,'LSPD DISPATCH'],[102,'BCSO DISPATCH'],[103,'STATE DISPATCH'],[104,'LAW MUTUAL AID'],[105,'TACTICAL OPS'],[107,'PURSUIT NET'],[108,'AIR SUPPORT']], callsign:'2-LINCOLN-14' },
        gang: { brand: 'BLACKWIRE', network: 'UNDERGROUND', home: 'CREW', units: 'CONTACTS', sos: 'BACKUP', ops: 'SIGNAL BREACH', code: 'RF',
            themes: [['one','Purple Reign','#c595ff','#1b1028','pulse'],['two','Street Gold','#f5cf63','#231c0c','scan'],['three','Ghost Circuit','#58e3cb','#0b211f','clean']],
            channels: [[401,'CREW NET'],[402,'STREET OPS'],[403,'SUPPLY LINE'],[404,'RUNNER NET'],[405,'CONTRACT NET'],[406,'FENCE LINE'],[407,'DEAD DROP'],[408,'BURNER NET'],[499,'BLACK MARKET']], callsign:'GHOST-04' },
        zombie: { brand: 'DEAD AIR', network: 'SURVIVOR RELAY', home: 'SQUAD', units: 'SURVIVORS', sos: 'BEACON', ops: 'WASTELAND DISPATCH', code: 'SURV',
            themes: [['one','Fallout Field','#d5ba72','#1b2012','scan'],['two','Quarantine','#b9f36d','#142010','pulse'],['three','Ash & Rust','#ed9e72','#261b18','clean']],
            channels: [[101,'ALPHA SQUAD'],[102,'BRAVO SQUAD'],[103,'CHARLIE SQUAD'],[110,'FIELD MEDICAL'],[120,'COMMAND NET'],[200,'SURVIVOR NETWORK'],[911,'EMERGENCY BROADCAST']], callsign:'RAVEN-07' }
    };
    const def = definitions[kind], ops = { dispatch: [], scanner: { status:'idle' }, tuning:50, busy:false, error:'', holdAt:0 };
    let simulationSequence = 0;
    document.body.dataset.radioKind = kind;
    const tabs = document.querySelector('.screen-tabs');
    const hint=document.getElementById('gameplay-hint');if(hint)hint.textContent='F11 CLOSE | WALK / RUN / PTT ENABLED';
    tabs.querySelectorAll('[data-tab]').forEach(tab => {
        const label = ({ home:def.home, roster:def.home, units:def.units, distress:def.sos, medical:'VITALS', channels:'BANDS', settings:'STYLE' })[tab.dataset.tab];
        if (label) tab.innerHTML = `<span>${label}</span>`;
    });
    const addTab = (id,label) => {
        const button = document.createElement('button'); button.className='tab'; button.dataset.tab=id; button.innerHTML=`<span>${label}</span>`;
        button.onclick=()=>{ state.tab=id; render(); if (id==='dispatch') nui('dispatchRequest'); if (id==='jammer') nui('requestJammerStatus'); };
        tabs.insertBefore(button,tabs.querySelector('[data-tab="settings"]'));
    };
    if (kind==='gang') { addTab('scanner','SCAN'); addTab('jammer','RF'); } else addTab('dispatch','CALLS');
    const theme = () => def.themes.find(t=>t[0]===state.profile.suiteTheme) || def.themes[0];
    const applyTheme = id => {
        const t=def.themes.find(t=>t[0]===id)||def.themes[0];
        updateProfile({ suiteTheme:t[0], accent:t[2], suiteBackground:t[3], suiteCustom:false, animation:t[4] });
    };
    const baseSettings=renderSettings;
    renderSettings=()=>`<section class="visual-panel suite-settings">
        <div class="settings-heading"><strong>${esc(def.brand)} THEMES</strong></div>
        <div class="suite-theme-grid">${def.themes.map(t=>`<button data-suite-theme="${t[0]}" class="${theme()[0]===t[0]?'selected':''}" style="--swatch:${t[2]}"><i></i><span>${t[1]}</span></button>`).join('')}</div>
        <label class="setting"><span>DISPLAY FONT</span><select data-setting="suiteFont">${[['sans','Response Sans'],['mono','Signal Mono'],['condensed','Command Condensed'],['square','Circuit Square'],['serif','Archive Serif']].map(([v,l])=>`<option value="${v}" ${state.profile.suiteFont===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label class="setting"><span>LABELS</span><select data-setting="labelStyle">${[['full','Full labels'],['compact','Compact labels'],['sentence','Sentence case']].map(([v,l])=>`<option value="${v}" ${state.profile.labelStyle===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label class="setting toggle"><span>CUSTOM BACKGROUND</span><input data-setting="suiteCustom" type="checkbox" ${checked(state.profile.suiteCustom)} /></label>
        <label class="setting"><span>BACKGROUND COLOR</span><input data-setting="suiteBackground" type="color" value="${/^#[0-9a-f]{6}$/i.test(state.profile.suiteBackground)?state.profile.suiteBackground:theme()[3]}" /></label>
    </section>${baseSettings()}`;
    const baseUpdateProfile=updateProfile;
    updateProfile=patch=>{
        if(patch.font && !patch.suiteFont)patch.suiteFont=({clinical:'sans',tactical:'mono',signal:'square',dispatch:'condensed',modern:'sans'})[patch.font]||'sans';
        if(patch.background){
            const palettes=kind==='ems'?EMS_PALETTES:kind==='police'?POLICE_PALETTES:kind==='gang'?GANG_PALETTES:ZOMBIE_PALETTES;
            const palette=palettes.find(p=>p.id===patch.background);
            if(palette){patch.suiteBackground=palette.color;patch.suiteCustom=true;}
        }
        if(patch.backgroundColor){patch.suiteBackground=patch.backgroundColor;patch.suiteCustom=true;}
        baseUpdateProfile(patch);
    };
    const oldVisual=applyVisualSettings;
    applyVisualSettings=()=>{
        oldVisual();
        const t=theme();
        screen.dataset.suiteFont=state.profile.suiteFont||'sans';
        screen.dataset.labelStyle=state.profile.labelStyle||'full';
        screen.dataset.suiteTheme=t[0];
        let bg=state.profile.suiteCustom && /^#[0-9a-f]{6}$/i.test(state.profile.suiteBackground)?state.profile.suiteBackground:t[3];
        const rgb=bg.slice(1).match(/../g).map(h=>parseInt(h,16));
        if((rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)>110)bg=`color-mix(in srgb, ${bg} 30%, #07111b)`;
        screen.style.background=`linear-gradient(145deg, color-mix(in srgb, ${bg} 89%, #fff), ${bg})`;
        screen.style.setProperty('--suite-accent',state.profile.accent||t[2]);
    };
    // Scale the handset around available screen space, including user position extremes.
    applyLayout=()=>{
        const aspect = FRAME_GEOMETRY.width/FRAME_GEOMETRY.height;
        const zoom=Math.max(.75,Math.min(1.2,Number(state.profile.radioScale||100)/100));
        const height=Math.min(innerHeight-8,innerHeight*.94*zoom,(innerWidth-16)/aspect);
        shell.style.setProperty('--sh',`${height}px`);
        shell.style.height=`${height}px`; shell.style.width=`${height*aspect}px`; shell.style.transform='none';
        shell.style.left=`${Math.max(8,Math.min(innerWidth-height*aspect-8,innerWidth*Number(state.profile.radioX??66)/100))}px`;
        shell.style.top=`${Math.max(4,Math.min(innerHeight-height-4,innerHeight*Number(state.profile.radioY??2)/100))}px`;
    };
    const dispatchHTML=()=>`<div class="suite-page"><div class="suite-heading"><strong>${def.ops}</strong><button data-dispatch-refresh>SYNC</button></div>
        <form id="dispatch-form" class="suite-form"><label>FIELD CALL<input name="title" required minlength="3" maxlength="64" placeholder="${kind==='ems'?'Trauma / transport request':kind==='police'?'Incident / assistance request':'Supply / rescue / infected sighting'}" /></label>
        <label>DETAILS<textarea name="body" maxlength="180" rows="2" placeholder="Situation and assistance needed"></textarea></label>
        <div class="suite-actions"><select name="priority" aria-label="Call priority"><option value="priority">PRIORITY</option><option value="routine">ROUTINE</option><option value="urgent">URGENT</option><option value="emergency">EMERGENCY</option></select><button type="submit">SEND CALL</button></div>
        <small>Your current position is attached by the server.</small></form>
        <div class="section-label">${ops.dispatch.length} ACTIVE / RECENT CALLS</div>
        ${ops.dispatch.map(row=>`<article class="suite-call priority-${esc(row.priority)}"><div class="suite-heading"><b>${esc(row.code||def.code)} · ${esc(row.priority)}</b><span>${esc(row.status||'open')}</span></div><strong>${esc(row.title)}</strong><p>${esc(row.body||'')}</p><small>${esc(row.unit||'Awaiting response')}</small><div class="suite-actions">${row.location?`<button data-call-gps="${esc(row.id)}">GPS</button>`:''}${row.status==='open'?`<button data-call-status="responding" data-call-id="${esc(row.id)}">RESPOND</button>`:row.own&&row.status==='responding'?`<button data-call-status="resolved" data-call-id="${esc(row.id)}">RESOLVE</button>`:''}</div></article>`).join('')||'<div class="empty">NO CALLS · JOIN A CHANNEL AND SYNC</div>'}</div>`;
    const scannerHTML=()=>{
        const s=ops.scanner, seconds=s.expires?Math.max(0,s.expires-Math.floor(Date.now()/1000)):0;
        return `<div class="suite-page"><div class="suite-heading"><strong>SIGNAL BREACH</strong><span>${esc(s.status.toUpperCase())}</span></div><section class="suite-call"><div class="scanner-wave" aria-hidden="true">${Array.from({length:28},(_,i)=>`<i style="--bar:${20+Math.sin(i*.9+ops.tuning/10)*14+(i%5)*6}%"></i>`).join('')}</div><strong>${s.status==='listening'?`POLICE ${s.frequency} · RX ONLY`:'PHANTOM RECEIVER'}</strong><p>${esc(s.message||'Find an active police carrier nearby. Match carrier, phase and gain to open a short receive-only intercept.')}</p>
        ${s.status==='challenge'?`<div class="scanner-target">STAGE ${Number(s.step)} / 3 · ${esc(s.axis||'carrier')}<br/>TARGET ${Number(s.target)} ± ${Number(s.tolerance||3)}</div><label class="setting"><span>TUNING <b id="tuning-readout">${ops.tuning}</b></span><input id="scanner-tuning" type="range" min="0" max="100" value="${ops.tuning}" /></label><div class="scanner-progress"><i id="scanner-hold"></i></div><small>Keep within tolerance for ${(s.holdMs||2500)/1000}s before locking.</small><button data-scanner-lock>LOCK ${esc(s.axis||'SIGNAL')}</button>`:''}
        ${s.expires?`<small data-scanner-clock>${seconds}s remaining</small>`:''}
        <div class="suite-actions">${s.status==='idle'?'<button data-scanner-start>SWEEP POLICE BAND</button>':'<button data-scanner-stop>DISCONNECT</button>'}</div></section><div class="suite-note">Intercept grants audio reception only. No police roster, dispatch data or police PTT. Movement, jamming and expiry break the link.</div></div>`;
    };
    const jammerHTML=()=>{
        const j=state.nearbyJammer;
        return `<div class="suite-page"><div class="suite-heading"><strong>BLACKWIRE RF CONTROL</strong><span>${j?(j.enabled?'ACTIVE':'OFF'):'NO DEVICE'}</span></div><section class="suite-call"><strong>DEAD ZONE</strong><p>Deploy an underground jammer to interrupt nearby suite radios and police scanner reception.</p><label class="setting"><span>RANGE ${state.jammerRange||30}m</span><input id="suite-jammer-range" type="range" min="10" max="100" step="5" value="${state.jammerRange||30}" /></label><small>${j?`DEVICE ${esc(j.id)} · ${j.range}m`: 'Requires an RF jammer and crew clearance'}</small><div class="suite-actions jammer-grid"><button data-suite-jammer="place">DEPLOY</button><button data-suite-jammer="refresh">REFRESH</button><button data-suite-jammer="range" ${j?'':'disabled'}>APPLY RANGE</button><button data-suite-jammer="toggle" ${j?'':'disabled'}>${j?.enabled?'TURN OFF':'TURN ON'}</button><button data-suite-jammer="allow" ${j&&state.channel>0?'':'disabled'}>PASS / BLOCK CREW</button><button data-suite-jammer="remove" ${j?.canRemove?'':'disabled'}>RECOVER</button></div></section><div class="suite-note">Nearby radios lose their signal inside the dead zone. Allow your crew frequency through when needed.</div></div>`;
    };
    const baseOverlay=renderOverlay;
    renderOverlay=()=>{
        baseOverlay();
        if(!overlay.classList.contains('visible'))return;
        const zoom=Math.max(.6,Math.min(1.6,Number(state.profile.overlayScale||100)/100));
        overlay.style.width=`${Math.min(260,(innerWidth-16)/zoom)}px`;
        overlay.style.maxHeight=`${(innerHeight-16)/zoom}px`;
        overlay.style.overflowY='auto';
        overlay.style.transform=`scale(${zoom})`;
        const r=overlay.getBoundingClientRect();
        overlay.style.left=`${Math.max(8,Math.min(innerWidth-r.width-8,innerWidth*Number(state.profile.overlayX||0)/100))}px`;
        overlay.style.top=`${Math.max(8,Math.min(innerHeight-r.height-8,innerHeight*Number(state.profile.overlayY||0)/100))}px`;
    };
    const baseScreen=renderScreen;
    renderScreen=()=>{
        baseScreen();
        const distress=document.getElementById("distress-button");if(distress)distress.textContent=state.distressActive?`CANCEL ${def.sos}`:def.sos;
        document.querySelector('.screen-brand strong').textContent=def.brand;
        const team=document.getElementById('screen-team'); if(team && !state.assignment?.team) team.textContent=def.network;
        if(['dispatch','scanner','jammer'].includes(state.tab)) {
            content.innerHTML=state.tab==='dispatch'?dispatchHTML():state.tab==='scanner'?scannerHTML():jammerHTML();
            bindContentActions();
        }
        tabs.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===state.tab||(state.tab==='unitDetail'&&tab.dataset.tab==='units')));
        content.querySelectorAll('[data-suite-theme]').forEach(b=>b.onclick=()=>applyTheme(b.dataset.suiteTheme));
        const refresh=content.querySelector('[data-dispatch-refresh]'); if(refresh) refresh.onclick=()=>nui('dispatchRequest');
        const form=document.getElementById('dispatch-form');
        if(form) form.onsubmit=async event=>{event.preventDefault();if(ops.busy)return;ops.busy=true;const data=Object.fromEntries(new FormData(form));await nui('dispatchSend',data);ops.busy=false;};
        content.querySelectorAll('[data-call-status]').forEach(b=>b.onclick=()=>nui('dispatchRespond',{id:b.dataset.callId,status:b.dataset.callStatus}));
        content.querySelectorAll('[data-call-gps]').forEach(b=>b.onclick=()=>{const row=ops.dispatch.find(r=>r.id===b.dataset.callGps);if(row?.location)nui('waypoint',{coords:row.location});});
        const start=content.querySelector('[data-scanner-start]'); if(start)start.onclick=()=>nui('scannerStart');
        const stop=content.querySelector('[data-scanner-stop]'); if(stop)stop.onclick=()=>nui('scannerStop');
        const tuning=document.getElementById('scanner-tuning');
        if(tuning)tuning.oninput=()=>{ops.tuning=Number(tuning.value);ops.holdAt=0;document.getElementById('tuning-readout').textContent=ops.tuning;};
        const lock=content.querySelector('[data-scanner-lock]');
        if(lock)lock.onclick=()=>{
            if(!ops.holdAt||performance.now()-ops.holdAt<(ops.scanner.holdMs||2500))return;
            nui('scannerStep',{nonce:ops.scanner.nonce,step:ops.scanner.step,value:ops.tuning});ops.holdAt=0;
        };
        const range=document.getElementById('suite-jammer-range'); if(range)range.oninput=()=>{state.jammerRange=Number(range.value);range.closest('label').querySelector('span').textContent=`RANGE ${range.value}m`;};
        content.querySelectorAll('[data-suite-jammer]').forEach(b=>b.onclick=()=>{
            const action=b.dataset.suiteJammer;
            if(action==='place')nui('placeJammer',{range:state.jammerRange});
            else if(action==='refresh')nui('requestJammerStatus');
            else nui('jammerAction',{action,value:action==='range'?state.jammerRange:action==='allow'?state.channel:undefined});
        });
    };
    window.addEventListener('message',event=>{
        const data=event.data;if(!data||typeof data!=='object')return;
        if(data.action==='suite') {
            if(Array.isArray(data.dispatch))ops.dispatch=data.dispatch;
            if(data.scanner){const previous=ops.scanner.step;ops.scanner={...ops.scanner,...data.scanner};if(data.scanner.status!=='challenge')ops.scanner={...data.scanner};if(previous!==ops.scanner.step){ops.holdAt=0;ops.tuning=50;}}
            render();
        }
        if(data.action==='suiteReleased'){ops.scanner={status:'idle'};ops.dispatch=[];}
        if(data.action==='state'&&state.tab==='dispatch')nui('dispatchRequest');
    });
    setInterval(()=>{
        const s=ops.scanner, now=performance.now();
        if(s.status==='challenge') {
            if(Math.abs(ops.tuning-s.target)<=(s.tolerance||3)) { if(!ops.holdAt)ops.holdAt=now; } else ops.holdAt=0;
            const bar=document.getElementById('scanner-hold'); if(bar)bar.style.width=`${ops.holdAt?Math.min(100,(now-ops.holdAt)/(s.holdMs||2500)*100):0}%`;
            const lock=content.querySelector('[data-scanner-lock]');if(lock)lock.disabled=!ops.holdAt||now-ops.holdAt<(s.holdMs||2500);
        }
        const clock=content.querySelector('[data-scanner-clock]');if(clock)clock.textContent=`${Math.max(0,(s.expires||0)-Math.floor(Date.now()/1000))}s remaining`;
        if(isBrowser && s.expires && Math.floor(Date.now()/1000)>=s.expires) {ops.scanner={status:'idle',message:'Intercept expired'};render();}
    },100);

    if(isBrowser) {
        document.documentElement.style.colorScheme='dark';
        document.body.style.background='radial-gradient(ellipse at center, #22323c66, transparent 65%), #0b1016';
        // Explicit, complete browser simulator: never invokes game or server endpoints.
        const restore=localStorage.getItem(`rs-suite-${kind}`);if(restore){try{Object.assign(state.profile,JSON.parse(restore));}catch(_){}}
        Object.assign(state,{powered:true,channel:def.channels[0][0],defaultChannel:def.channels[0][0],channelLabel:def.channels[0][1],jammerConfig:{enabled:kind==='gang',rangeMin:10,rangeMax:100,rangeStep:5,defaultRange:30},assignment:{team:def.network,role:kind==='ems'?'medic':kind==='police'?'officer':kind==='gang'?'member':'survivor',callsign:def.callsign},channels:def.channels.map(([id,label],i)=>({id,label,locked:false,telemetry:kind!=='gang',roster:true,favorite:i===0,recommended:i===0}))});
        state.roster=(state.roster||[]).map((r,i)=>({...r,callsign:i===0?def.callsign:`${kind==='ems'?'MEDIC':kind==='police'?'PATROL':kind==='gang'?'CREW':'RAVEN'}-${i+2}`,role:state.assignment.role}));
        state.distressBoard=(state.distressBoard||[]).map(r=>({...r,callsign:kind==='gang'?'CREW-9':kind==='ems'?'MEDIC-9':kind==='police'?'PATROL-9':'RAVEN-9',channel:state.channel,channelLabel:state.channelLabel}));
        ops.dispatch=[{id:'demo-call',code:def.code,title:kind==='ems'?'Multiple casualties · scene triage':kind==='police'?'Priority assistance · active pursuit':'Infected breach · shelter evacuation',body:'Units requested at the marked location. Confirm response and coordinate on the active band.',priority:'urgent',location:{x:220.2,y:-810.6,z:30.7},status:'open',createdAt:Math.floor(Date.now()/1000)}];
        const notify=message=>window.parent.postMessage({type:'radio-preview-status',message},'*');
        nui=async(action,payload={})=>{
            if(action==='join'){const c=state.channels.find(c=>c.id===Number(payload.channel));if(!c||c.locked){play('denied');notify('Frequency denied');return {ok:false};}Object.assign(state,{channel:c.id,channelLabel:c.label,powered:true});render();}
            if(action==='leave'){Object.assign(state,{powered:false,channel:0});render();}
            if(action==='close'){app.classList.remove('visible');notify('Radio closed — select Reopen radio in the showcase.');}
            if(action==='profile'){Object.assign(state.profile,payload);localStorage.setItem(`rs-suite-${kind}`,JSON.stringify(state.profile));}
            if(action==='favorite'){const c=state.channels.find(c=>c.id===payload.channel);if(c)c.favorite=payload.favorite;}
            if(action==='toggleMutePlayer'){state.mutedPlayers[payload.id]=!state.mutedPlayers[payload.id];}
            if(action==='resetProfile'){localStorage.removeItem(`rs-suite-${kind}`);location.reload();}
            if(action==='distress'){state.distressActive=!state.distressActive;notify(state.distressActive?`${def.sos} sent to your network`:'Beacon cancelled');render();}
            if(action==='waypoint')notify('Waypoint marked for the selected call / unit');
            if(action==='dispatchSend') {if(!state.powered)return {ok:false};ops.dispatch.unshift({...payload,id:`demo-${++simulationSequence}`,code:def.code,status:'open',location:{x:220.2,y:-810.6,z:30.7}});notify('Dispatch sent');render();}
            if(action==='dispatchRespond'){const row=ops.dispatch.find(r=>r.id===payload.id);if(row){row.status=payload.status;row.unit=def.callsign;row.own=true;}render();}
            if(action==='scannerStart') {if(!state.powered){notify('Power the crew radio first');return {ok:false};}ops.scanner={status:'challenge',step:1,axis:'carrier',target:23+Math.floor(Math.random()*55),nonce:'demo',frequency:101,holdMs:2500,tolerance:3,expires:Math.floor(Date.now()/1000)+45};ops.holdAt=0;ops.tuning=50;render();}
            if(action==='scannerStep'){const s=ops.scanner;if(Math.abs(payload.value-s.target)>3){ops.scanner={status:'idle',message:'Phase lock failed'};}else if(s.step<3){s.step++;s.axis=['carrier','phase','gain'][s.step-1];s.target=23+Math.floor(Math.random()*55);ops.holdAt=0;ops.tuning=50;}else ops.scanner={status:'listening',frequency:101,expires:Math.floor(Date.now()/1000)+90,message:'Demo intercept locked · receive only'};render();}
            if(action==='scannerStop'){ops.scanner={status:'idle',message:'Intercept stopped'};render();}
            if(action==='placeJammer'){state.nearbyJammer={id:'DEMO-RF-01',range:payload.range||30,enabled:true,canRemove:true,allowedChannels:[]};notify('Demo jammer deployed');render();}
            if(action==='jammerAction' && state.nearbyJammer){const j=state.nearbyJammer;if(payload.action==='range')j.range=payload.value;if(payload.action==='toggle')j.enabled=!j.enabled;if(payload.action==='remove')state.nearbyJammer=null;if(payload.action==='allow')j.allowedChannels=j.allowedChannels.includes(state.channel)?[]:[state.channel];render();}
            return {ok:true,muted:state.mutedPlayers||{}};
        };
        if(!state.profile.suiteTheme)Object.assign(state.profile,{suiteTheme:'one',accent:def.themes[0][2],suiteFont:({ems:'sans',police:'mono',gang:'square',zombie:'mono'})[kind],suiteCustom:false});
        app.classList.add('visible');
        window.addEventListener('message',event=>{if(event.data?.type==='radio-preview-reopen'){app.classList.add('visible');render();}});
    }
    window.RadioSuitePreview={kind,definitions:def,frames:kind==='ems'?EMS_FRAMES:kind==='police'?POLICE_FRAMES:kind==='gang'?GANG_FRAMES:ZOMBIE_FRAMES,ops,getState:()=>state,setTab:id=>{state.tab=id;render();},setProfile:patch=>{Object.assign(state.profile,patch);render();},center:()=>{state.profile.radioX=0;state.profile.radioY=2;state.profile.radioScale=100;render();state.profile.radioX=(innerWidth-shell.getBoundingClientRect().width)/innerWidth*50;render();},applyTheme,render};
    render();
})();
