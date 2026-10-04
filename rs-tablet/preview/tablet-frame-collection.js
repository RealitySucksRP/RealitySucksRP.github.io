/* RS Tablet 1.0.3 — unified premium shell renderer. Every frame uses one immutable display aperture. */
(() => {
  'use strict';

  const styles = [
    ['sleek','Sleek Modern','Ultra-thin anodized rail'],
    ['ifruit','iFruit Pro','Polished flagship aluminum'],
    ['gang','Gang','Low-profile black street shell'],
    ['recon','Recon','Slim tactical segmented shell'],
    ['professional','Professional Sleek','Satin executive alloy'],
    ['burner','Burner','Discrete utility polymer'],
    ['atelier','Atelier','Oxblood leather and fine stitch'],
    ['pearl','Pearl','Pearlescent metal and satin trim'],
    ['blossom','Roseline','Brushed rose metal, understated trim'],
    ['riviera','Riviera','Woven side grip and travel shell'],
    ['velvet','Velvet','Deep burgundy soft-touch shell'],
    ['executive','Executive','Boardroom black alloy with precision trim'],
    ['syndicate','Syndicate','Mafia-inspired leather with champagne pinline'],
    ['cipher','Cipher','Underground hacker shell with etched circuit detail'],
    ['streetluxe','Street Luxe','Carbon street shell with jewelry-grade edge'],
    ['halo','Halo','Soft chrome curves with tiny star hardware'],
    ['charm','Charm','Modern rounded shell with subtle heart-and-star accents'],
    ['starlight','Starlight','Pearl-lavender finish with micro sparkle'],
    ['kittyluxe','Kitty Pop Luxe','Crystal hearts, ribbons and dangling kitten charm'],
    ['bunnybloom','Bunny Bloom','Blossoms, bows and dangling bunny charm'],
    ['teddystarlight','Teddy Starlight','Pearls, star gems and dangling teddy charm'],
    ['pandasugar','Panda Sugar Luxe','Pearl shells, ribbons and dangling panda charm'],
    ['foxyrosette','Foxy Rosette','Rose-gold florals and dangling fox charm']
  ].map(([id,label,desc])=>({id,label,desc}));

  const colors = [
    ['graphite','Graphite'],['titanium','Titanium'],['midnight','Midnight'],['vice','Vice Blue'],
    ['coral','Sunset Coral'],['mint','Mint Pulse'],['gold','Champagne Gold'],['lime','Neon Lime'],
    ['rose','Rose Quartz'],['lavender','Lavender Mist'],['pearl','Pearl White'],['burgundy','Burgundy Silk'],
    ['obsidian','Obsidian'],['emerald','Emerald'],['blush','Blush Chrome'],['platinum','Platinum Ice'],
    ['ocean','Ocean Teal'],['copper','Burnished Copper'],['ice','Glacier Blue'],['amethyst','Amethyst']
  ].map(([id,label])=>({id,label}));

  const palettes = {
    graphite:{accent:'#9ca8ba',accent2:'#5e718d',metal:'#545d68',dark:'#171c24'},
    titanium:{accent:'#d1d7e1',accent2:'#8994a6',metal:'#959ca8',dark:'#2c323a'},
    midnight:{accent:'#668cff',accent2:'#222b48',metal:'#303746',dark:'#050811'},
    vice:{accent:'#70e8ff',accent2:'#4d5fff',metal:'#516982',dark:'#101925'},
    coral:{accent:'#ff8b9f',accent2:'#ff596e',metal:'#745865',dark:'#27131c'},
    mint:{accent:'#76ffda',accent2:'#18bc90',metal:'#55736d',dark:'#10211e'},
    gold:{accent:'#f1d27a',accent2:'#b78635',metal:'#897953',dark:'#251f16'},
    lime:{accent:'#d2ff67',accent2:'#4ca627',metal:'#66774f',dark:'#15210f'},
    rose:{accent:'#e8a6b7',accent2:'#9b5268',metal:'#9b747f',dark:'#2d1c23'},
    lavender:{accent:'#c8b8e7',accent2:'#806aa8',metal:'#827a92',dark:'#272331'},
    pearl:{accent:'#f3eee5',accent2:'#a99e8f',metal:'#c1bbb2',dark:'#4a4642'},
    burgundy:{accent:'#c27688',accent2:'#7a3048',metal:'#673744',dark:'#210e16'},
    obsidian:{accent:'#8b94a3',accent2:'#3d4652',metal:'#242a31',dark:'#05070a'},
    emerald:{accent:'#74c69d',accent2:'#2d6a4f',metal:'#315c4b',dark:'#0b1812'},
    blush:{accent:'#f6c2cf',accent2:'#c97992',metal:'#b58c98',dark:'#342128'},
    platinum:{accent:'#e8f1fa',accent2:'#9fb0c1',metal:'#b7c1cb',dark:'#3a4652'},
    ocean:{accent:'#8be3df',accent2:'#287d85',metal:'#487779',dark:'#122d33'},
    copper:{accent:'#ecc0a1',accent2:'#a2623e',metal:'#9a7055',dark:'#322019'},
    ice:{accent:'#c3e5fc',accent2:'#77a6c8',metal:'#8baabe',dark:'#263e51'},
    amethyst:{accent:'#d6b6ef',accent2:'#9161ba',metal:'#7c6297',dark:'#281b39'}
  };

  const cssPalette={accent:'var(--tablet-frame-accent)',accent2:'var(--tablet-frame-accent2)',metal:'var(--tablet-frame-metal)',dark:'var(--tablet-frame-dark)'};
  const APERTURE={x:79,y:85,w:1357,h:858,r:20};


  // High-detail transparent PNG/WebP shells. The source opening is measured once,
  // then transformed so every art frame lands on the exact same live screen aperture.
  // Art may extend outside the base tablet box (bows/keychains) but never over the UI.
  const rasterFrames={
    kittyluxe:{src:'img/frames/kitty.webp',source:{w:1448,h:1086,x:192,y:235,sw:1119,sh:706}},
    bunnybloom:{src:'img/frames/bunny.webp',source:{w:1448,h:1086,x:211,y:236,sw:1112,sh:690}},
    teddystarlight:{src:'img/frames/teddy.webp',source:{w:1448,h:1086,x:209,y:241,sw:1115,sh:693}},
    pandasugar:{src:'img/frames/panda.webp',source:{w:1448,h:1086,x:192,y:254,sw:1136,sh:693}},
    foxyrosette:{src:'img/frames/foxy.webp',source:{w:1448,h:1086,x:233,y:239,sw:1074,sh:692}}
  };

  const rasterFilters={
    graphite:'grayscale(.78) saturate(.35) brightness(.78) contrast(1.08)',
    titanium:'grayscale(.66) saturate(.34) brightness(1.12) contrast(.98)',
    midnight:'hue-rotate(175deg) saturate(1.12) brightness(.58) contrast(1.14)',
    vice:'hue-rotate(150deg) saturate(1.35) brightness(.92)',
    coral:'hue-rotate(-8deg) saturate(1.18) brightness(1.02)',
    mint:'hue-rotate(88deg) saturate(1.05) brightness(1.02)',
    gold:'sepia(.48) saturate(1.55) hue-rotate(348deg) brightness(1.02)',
    lime:'hue-rotate(68deg) saturate(1.45) brightness(1.04)',
    rose:'saturate(.96) brightness(1.03)',
    lavender:'hue-rotate(34deg) saturate(.92) brightness(1.03)',
    pearl:'grayscale(.36) saturate(.28) brightness(1.18) contrast(.93)',
    burgundy:'hue-rotate(-14deg) saturate(1.25) brightness(.67) contrast(1.12)',
    obsidian:'grayscale(.94) saturate(.16) brightness(.39) contrast(1.28)',
    emerald:'hue-rotate(104deg) saturate(.92) brightness(.70) contrast(1.06)',
    blush:'hue-rotate(-3deg) saturate(.70) brightness(1.10)',
    platinum:'grayscale(.67) saturate(.24) brightness(1.10) contrast(1.00)',
    ocean:'hue-rotate(132deg) saturate(.82) brightness(.85)',
    copper:'sepia(.52) saturate(1.05) hue-rotate(330deg) brightness(.86)',
    ice:'hue-rotate(160deg) saturate(.48) brightness(1.12)',
    amethyst:'hue-rotate(30deg) saturate(1.08) brightness(.84)'
  };

  function rasterPlacement(id){
    const f=rasterFrames[id], s=f.source;
    const sx=APERTURE.w/s.sw, sy=APERTURE.h/s.sh;
    return {left:APERTURE.x-s.x*sx,top:APERTURE.y-s.y*sy,width:s.w*sx,height:s.h*sy};
  }

  function rasterMarkup(id,color='rose'){
    const f=rasterFrames[id], g=rasterPlacement(id);
    const p=palettes[color]||palettes.rose;
    const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
    const dark=rgb(p.dark),metal=rgb(p.metal),finish=rgb(p.accent2);
    const stops=[dark,metal.map(v=>v*.55),finish,finish.map(v=>v*.72+.28),[1,1,1]];
    const tintId=`frame-tint-${id}`;
    const maskId=`frame-cutout-${id}`;
    return `<svg class="tablet-raster-svg" viewBox="0 0 1515 1038" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-aperture="79 85 1357 858 20">
      <defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="-500" y="-500" width="2515" height="2038"><rect x="-500" y="-500" width="2515" height="2038" fill="white"/><rect x="79" y="85" width="1357" height="858" rx="20" fill="black"/></mask>
      <filter id="${tintId}" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0"/><feComponentTransfer>${['R','G','B'].map((c,i)=>`<feFunc${c} type="table" tableValues="${stops.map(s=>s[i].toFixed(4)).join(' ')}"/>`).join('')}</feComponentTransfer></filter></defs>
      <image class="tablet-raster-frame" href="${f.src}" x="${g.left}" y="${g.top}" width="${g.width}" height="${g.height}" preserveAspectRatio="none" mask="url(#${maskId})" filter="url(#${tintId})"/>
    </svg>`;
  }
  const screws=(pts,p)=>pts.map(([x,y])=>`<g transform="translate(${x} ${y})"><circle r="7" fill="#090c10"/><circle r="4.2" fill="${p.metal}"/><path d="M-2.2 0H2.2" stroke="#0a0b0d" stroke-width="1.4"/></g>`).join('');

  // Outer profiles stay outside the same screen aperture. Even rugged shells are deliberately slim.
  const profiles={
    sleek:{x:53,y:59,r:38}, ifruit:{x:43,y:48,r:46}, professional:{x:40,y:44,r:39},
    gang:{x:28,y:31,r:44}, recon:{x:24,y:27,r:42}, burner:{x:30,y:33,r:45},
    atelier:{x:28,y:31,r:48}, pearl:{x:38,y:42,r:56}, blossom:{x:35,y:39,r:47},
    riviera:{x:27,y:30,r:50}, velvet:{x:31,y:35,r:50}, executive:{x:42,y:46,r:40},
    syndicate:{x:30,y:33,r:48}, cipher:{x:29,y:32,r:43}, streetluxe:{x:29,y:32,r:46},
    halo:{x:39,y:43,r:58}, charm:{x:36,y:40,r:55}, starlight:{x:38,y:42,r:60}
  };

  function rectPath(x,y,w,h,r){
    return `M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;
  }

  function sparkle(x,y,s,p){
    return `<g transform="translate(${x} ${y})" fill="${p.accent}"><path d="M0 ${-s}L${s*.24} ${-s*.24}L${s} 0L${s*.24} ${s*.24}L0 ${s}L${-s*.24} ${s*.24}L${-s} 0L${-s*.24} ${-s*.24}Z"/><circle cx="${s*1.7}" cy="${-s*.55}" r="${Math.max(1.5,s*.15)}" opacity=".65"/></g>`;
  }

  function heart(x,y,s,p){
    return `<path d="M${x} ${y+s*.45}C${x-s*1.35} ${y-s*.25} ${x-s*.72} ${y-s*1.45} ${x} ${y-s*.72}C${x+s*.72} ${y-s*1.45} ${x+s*1.35} ${y-s*.25} ${x} ${y+s*.45}Z" fill="${p.accent}" opacity=".72"/>`;
  }

  function art(id,p=cssPalette){
    const q=profiles[id]||profiles.sleek;
    const w=1515-2*q.x,h=1038-2*q.y;
    const outer=rectPath(q.x,q.y,w,h,q.r);
    const inner=rectPath(APERTURE.x,APERTURE.y,APERTURE.w,APERTURE.h,APERTURE.r);
    const polymer=['gang','recon','burner','velvet','cipher'].includes(id);
    const leather=['atelier','syndicate'].includes(id);
    const weave=['riviera','streetluxe'].includes(id);
    const pearl=['pearl','halo','charm','starlight'].includes(id);
    const finish=leather?'url(#leather)':weave?'url(#carbon)':polymer?'url(#soft)':pearl?'url(#pearlBody)':'url(#alloy)';
    const border=(inset,width,stroke,extra='')=>`<rect x="${q.x+inset}" y="${q.y+inset}" width="${w-2*inset}" height="${h-2*inset}" rx="${Math.max(8,q.r-inset)}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
    let hardware='';

    if(id==='sleek') hardware=border(3,2,'url(#edge)')+`<path d="M260 65h250M1005 973h250" stroke="#fff" opacity=".15" stroke-width="2"/>`;
    if(id==='ifruit') hardware=border(3,5,'url(#edge)')+border(10,1,'#ffffff42')+`<g stroke="${p.dark}" stroke-width="2.5" opacity=".46"><path d="M220 49v12M1295 49v12M220 977v12M1295 977v12"/></g>`;
    if(id==='professional') hardware=border(4,3,'url(#edge)')+border(11,1,p.accent2)+`<path d="M330 958h855" stroke="${p.accent}" opacity=".12" stroke-width="2"/>`;
    if(id==='executive') hardware=border(3,3,'url(#edge)')+border(10,1,'#ffffff30')+`<path d="M230 ${q.y+12}h1055M230 ${1038-q.y-12}h1055" stroke="${p.accent2}" stroke-width="2" opacity=".55"/><g fill="${p.accent}" opacity=".55"><rect x="${q.x+9}" y="245" width="4" height="116" rx="2"/><rect x="${1515-q.x-13}" y="677" width="4" height="116" rx="2"/></g>`;

    if(id==='gang') hardware=border(5,5,'#0d1117')+border(15,2,p.metal)+screws([[45,48],[1470,48],[45,990],[1470,990]],p)+`<path d="M280 ${q.y+9}h140M1095 ${1038-q.y-9}h140" stroke="${p.accent2}" stroke-width="5" stroke-linecap="round"/>`;
    if(id==='recon') hardware=border(5,6,'#0c1116')+border(15,2,p.metal)+`<g fill="url(#armor)" stroke="#0a0d11" stroke-width="2"><path d="M${q.x+7} 180V${q.y+56}Q${q.x+7} ${q.y+7} ${q.x+56} ${q.y+7}H190v26H74Q54 33 54 54v126Z"/><path d="M${1515-q.x-7} 858V${1038-q.y-56}Q${1515-q.x-7} ${1038-q.y-7} ${1515-q.x-56} ${1038-q.y-7}H1325v-26h116q20 0 20-21V858Z"/></g><g stroke="${p.accent}" stroke-width="2.2" opacity=".52">${[330,354,378,402].map(y=>`<path d="M${q.x+10} ${y}h22M${1483-q.x} ${y}h22"/>`).join('')}</g>`+screws([[48,51],[1467,987]],p);
    if(id==='burner') hardware=border(6,5,p.dark)+border(16,2,p.accent2)+`<g fill="${p.dark}" opacity=".48"><rect x="${q.x+9}" y="410" width="10" height="205" rx="5"/><rect x="${1496-q.x}" y="410" width="10" height="205" rx="5"/></g>`;

    if(id==='atelier') hardware=border(7,3,p.dark)+border(17,2,p.accent,'stroke-dasharray="3 8" opacity=".52"')+`<path d="M${q.x+13} 180v675M${1490-q.x} 180v675" stroke="${p.dark}" stroke-width="8" opacity=".45"/>`;
    if(id==='syndicate') hardware=border(6,3,'#090b0d')+border(15,2,'url(#goldEdge)')+`<path d="M260 ${q.y+13}h995M260 ${1038-q.y-13}h995" stroke="${p.accent}" stroke-width="2" opacity=".35"/><g fill="${p.accent}"><circle cx="${q.x+17}" cy="519" r="3"/><circle cx="${1498-q.x}" cy="519" r="3"/></g>`;
    if(id==='pearl') hardware=border(4,4,'url(#pearlEdge)')+border(12,1,'#ffffff66')+`<path d="M240 58h430M890 980h390" stroke="#fff" opacity=".3" stroke-width="3" stroke-linecap="round"/>`;
    if(id==='blossom') hardware=border(4,4,'url(#edge)')+border(12,1.5,p.accent2)+`<path d="M370 54h775M370 984h775" stroke="${p.accent}" opacity=".22" stroke-width="2"/>`;
    if(id==='riviera') hardware=border(5,4,p.dark)+border(15,1.5,p.accent,'stroke-dasharray="2 7" opacity=".52"')+`<g fill="${p.dark}" opacity=".72"><rect x="${q.x+9}" y="355" width="14" height="315" rx="7"/><rect x="${1492-q.x}" y="355" width="14" height="315" rx="7"/></g>`;
    if(id==='velvet') hardware=border(5,4,p.dark)+border(14,1.5,p.accent2)+`<path d="M235 50h1045M235 988h1045" stroke="${p.accent}" opacity=".16" stroke-width="2"/>`;

    if(id==='cipher') hardware=border(5,4,'#080c10')+border(13,1.5,p.accent2)+`<g fill="none" stroke="${p.accent}" stroke-width="2" opacity=".46"><path d="M${q.x+12} 240h20v45h19v36h24"/><path d="M${1515-q.x-12} 780h-20v-45h-19v-36h-24"/><circle cx="${q.x+12}" cy="240" r="3" fill="${p.accent}"/><circle cx="${1515-q.x-12}" cy="780" r="3" fill="${p.accent}"/></g><text x="${q.x+16}" y="${1038-q.y-12}" fill="${p.accent}" font-size="13" font-family="monospace" opacity=".42">0xRS // SECURE</text>`;
    if(id==='streetluxe') hardware=border(5,4,'#0a0d11')+border(14,2,'url(#goldEdge)')+`<path d="M290 ${q.y+10}h210M1015 ${q.y+10}h210" stroke="${p.accent}" stroke-width="4" stroke-linecap="round" opacity=".78"/>`+screws([[49,52],[1466,52]],p);

    if(id==='halo') hardware=border(3,4,'url(#pearlEdge)')+border(11,1,'#ffffff70')+sparkle(195,q.y+22,11,p)+sparkle(1325,1038-q.y-22,8,p)+`<circle cx="${1515-q.x-14}" cy="${q.y+16}" r="5" fill="${p.accent}" opacity=".8"/>`;
    if(id==='charm') hardware=border(4,4,'url(#pearlEdge)')+border(13,1.5,p.accent2)+heart(191,q.y+22,10,p)+sparkle(1327,1038-q.y-23,9,p)+`<path d="M${1515-q.x-16} ${q.y+8}v24" stroke="${p.accent}" stroke-width="2" opacity=".62"/><circle cx="${1515-q.x-16}" cy="${q.y+38}" r="5" fill="${p.accent}" opacity=".75"/>`;
    if(id==='starlight') hardware=border(3,4,'url(#pearlEdge)')+border(12,1,'#ffffff6a')+[ [180,q.y+21,7],[260,1038-q.y-20,5],[1260,q.y+20,6],[1360,1038-q.y-22,8] ].map(v=>sparkle(v[0],v[1],v[2],p)).join('')+`<path d="M345 ${q.y+12}h825" stroke="#fff" stroke-width="2" opacity=".18"/>`;

    const cameraY=(q.y+APERTURE.y)/2;
    return `<svg viewBox="0 0 1515 1038" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-aperture="79 85 1357 858 20">
      <defs>
        <linearGradient id="alloy" x1="0" y1="0" x2="0.12" y2="1"><stop stop-color="${p.metal}"/><stop offset=".5" stop-color="${p.metal}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="soft" x2=".3" y2="1"><stop stop-color="${p.metal}"/><stop offset=".35" stop-color="${p.dark}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="edge" x2=".1" y2="1"><stop stop-color="#ffffffbb"/><stop offset=".15" stop-color="${p.accent}"/><stop offset=".44" stop-color="${p.dark}"/><stop offset=".85" stop-color="${p.metal}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient>
        <linearGradient id="pearlEdge" x2=".2" y2="1"><stop stop-color="${p.accent}"/><stop offset=".25" stop-color="#fff" stop-opacity=".84"/><stop offset=".6" stop-color="${p.metal}"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient>
        <linearGradient id="pearlBody" x2=".25" y2="1"><stop stop-color="#fff" stop-opacity=".30"/><stop offset=".3" stop-color="${p.metal}"/><stop offset=".78" stop-color="${p.accent2}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="goldEdge" x2="1"><stop stop-color="${p.accent2}"/><stop offset=".35" stop-color="#f0d997"/><stop offset=".65" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient>
        <linearGradient id="armor" x2="0.2" y2="1"><stop stop-color="${p.metal}"/><stop offset=".3" stop-color="#2e3339"/><stop offset="1" stop-color="#12161b"/></linearGradient>
        <pattern id="leather" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${p.dark}"/><path d="M1 2l3 1M6 7l3-1" stroke="${p.metal}" stroke-width="1" opacity=".32"/></pattern>
        <pattern id="carbon" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${p.dark}"/><path d="M0 2h10M2 0v10M0 7h10M7 0v10" stroke="${p.metal}" stroke-width="1.2" opacity=".30"/><path d="M0 0l10 10M10 0L0 10" stroke="${p.accent}" stroke-width=".6" opacity=".10"/></pattern>
      </defs>
      <path d="${outer} ${inner}" fill="${finish}" fill-rule="evenodd" stroke="#101419" stroke-width="3"/>
      ${hardware}
      <rect x="75" y="81" width="1365" height="866" rx="24" fill="none" stroke="#070a0e" stroke-width="7"/>
      <rect x="78" y="84" width="1359" height="860" rx="21" fill="none" stroke="#ffffff28" stroke-width="1"/>
      <g fill="${p.metal}" stroke="#10151c" stroke-width="2"><rect x="${q.x+w-5}" y="300" width="6" height="82" rx="3"/><rect x="480" y="${q.y-2}" width="77" height="5" rx="2.5"/><rect x="563" y="${q.y-2}" width="77" height="5" rx="2.5"/></g>
      <circle cx="757.5" cy="${cameraY}" r="6" fill="#070b10" stroke="#ffffff27" stroke-width="2"/><circle cx="758.5" cy="${cameraY-1}" r="2" fill="#375970"/>
      ${id==='burner'?`<g fill="#161b23">${[0,1,2,3,4,5].map(i=>`<circle cx="${717+i*8}" cy="${1038-(q.y+95)/2}" r="2"/>`).join('')}</g>`:''}
    </svg>`;
  }


  function frameMarkup(id,p=cssPalette,color='rose'){
    return rasterFrames[id]?rasterMarkup(id,color):art(id,p);
  }

  function scopedMarkup(svg,prefix){
    return svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`)
      .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`);
  }

  // A common thumbnail canvas includes ribbons and dangling hardware on all shells.
  // The nested tablet/display rectangle is identical for every preview.
  function previewMarkup(id,color='vice',prefix='catalog'){
    const p=palettes[color]||palettes.vice;
    return `<div class="tablet-preview-stage"><img class="tablet-frame-preview-screen" src="img/frame-preview-screen.webp?v=105" alt="RS Tablet Home" draggable="false"><div class="tablet-frame-preview-art" data-preview-style="${id}">${scopedMarkup(frameMarkup(id,p,color),prefix+'-'+id)}</div></div>`;
  }

  let lastStyle='';
  let lastColor='';
  function sync(){
    const tablet=document.getElementById('tablet'); if(!tablet)return;
    let layer=document.getElementById('tablet-collection-art');
    if(!layer){layer=document.createElement('div');layer.id='tablet-collection-art';layer.setAttribute('aria-hidden','true');tablet.append(layer);}
    const id=styles.some(s=>s.id===tablet.dataset.frameStyle)?tablet.dataset.frameStyle:'sleek';
    const color=palettes[tablet.dataset.frameColor]?tablet.dataset.frameColor:'vice';
    tablet.classList.add('collection-shell');
    // Re-render on style or finish changes so the live frame always matches the selected preview.
    if(id!==lastStyle || color!==lastColor){layer.innerHTML=frameMarkup(id,palettes[color],color);lastStyle=id;lastColor=color;}
    const p=palettes[color];
    document.querySelectorAll('.tablet-frame-preview-art').forEach(layer=>{
      const sid=layer.dataset.previewStyle||'sleek';
      const key=sid+':'+color;
      if(layer.dataset.finish===key)return;
      layer.dataset.finish=key;
      // Inline SVG resolves local WebP artwork; img/data-SVG cannot resolve it.
      // Each preview gets its own paint-server IDs so it cannot affect the live shell.
      layer.innerHTML=scopedMarkup(frameMarkup(sid,p,color),'preview-'+sid);
    });
  }

  window.RSTabletFrames={styles,colors,palettes,sync,art,frameMarkup,previewMarkup,scopedMarkup,rasterFrames,rasterFilters,aperture:{...APERTURE}};
})();
