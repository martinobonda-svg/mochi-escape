'use strict';
const Wardrobe=(()=>{
  const coats=[
    ['classic','Runa','walk'],['honey','Miele','honey'],['moon','Lunare','moon'],
    ['copper','Rame','walk','0.86 0.22 0 0 .015  .06 .79 .05 0 .012  .08 .08 .75 0 .018'],
    ['silver','Argento','walk','.34 .48 .23 0 .01  .26 .54 .27 0 .012  .24 .45 .4 0 .025'],
    ['umber','Castagna','walk','.72 .12 .04 0 0  .1 .72 .05 0 0  .10 .14 .65 0 .005'],
    ['dawn','Albicocca','honey','.85 .18 0 0 .01  .09 .79 .08 0 .01  .13 .13 .72 0 .03'],
    ['aurora','Aurora','moon','.74 .21 .08 0 0  .10 .88 .06 0 .025  .08 .24 .70 0 .01']
  ];
  const hats=[['none','Orecchie libere'],['beret','Basco di mora'],['wool','Berretto di neve'],['leaf','Foglia del bosco'],['crown','Corona di stelle'],['flower','Fiore di prato']];
  const necks=[['none','Sciarpa di Runa'],['lagoon','Foulard laguna'],['rose','Sciarpa corallo'],['knit','Sciarpa di lana'],['star','Spilla stellare'],['clover','Spilla trifoglio']];
  const neckColors={lagoon:['#447981','#89c3bd'],rose:['#ab576a','#eca594'],knit:['#665383','#c8afd8']};
  const cache=new Map();
  function valid(list,key){return list.some(([id])=>id===key)}
  function restore(data){return {look:valid(coats,data.look)?data.look:'classic',hat:valid(hats,data.hat)?data.hat:'none',neck:valid(necks,data.neck)?data.neck:'none'}}
  function hatArt(id){
    const brim='<path d="M-21 3Q-2-2 22 4L19 11Q-1 7-20 10Z" fill="#b78b93" stroke="#795868"/>';
    switch(id){
      case 'beret':return '<path d="M-26 4Q-34-7-20-18Q-10-26 5-22Q20-22 25-12Q30-3 17 5Z" fill="url(#berry)" stroke="#80576d"/>'+brim+'<path d="M-1-21Q-3-26 2-28" fill="none" stroke="#694d5b" stroke-width="3"/>';
      case 'wool':return '<path d="M-21 7Q-22-13-9-24Q2-34 14-20Q24-9 21 6Z" fill="url(#knit)" stroke="#6b8896"/><path d="M-9-19Q-16-6-15 3M2-23Q-5-12-4 2M10-17Q9-9 11 3" stroke="#d7e7e5" fill="none"/><path d="M-23 3Q0-2 24 4L21 13Q2 8-22 12Z" fill="#a5c9ce" stroke="#73939b"/><circle cx="1" cy="-26" r="6" fill="#edf2e6"/>';
      case 'leaf':return '<path d="M-20 8Q-27-7-21-21Q-4-23 6-8Q4 6-13 8Z" fill="url(#forest)" stroke="#547b51"/><path d="M-20-18Q-16-5-4 5" stroke="#c4d78f" fill="none"/><circle cx="3" cy="5" r="4" fill="#dea07a"/>';
      case 'crown':return '<path d="M-20 5L-23-12-12-6-3-19 5-7 17-16 20 5Q0 13-20 5Z" fill="url(#gold)" stroke="#ab813e"/><path d="M-18 3Q0 7 17 2" fill="none" stroke="#fff1b4"/><path d="M-4-3L0-8 4-3 0 2Z" fill="#af8ac1"/>';
      case 'flower':return '<path d="M-9 5Q-18 7-24-1Q-14-8-6-2ZM2 3Q12-11 18-7Q19 4 5 7Z" fill="url(#forest)"/>'+[0,72,144,216,288].map(a=>'<ellipse cx="0" cy="-7" rx="5" ry="8" fill="#efb4b0" stroke="#ca8e8a" transform="rotate('+a+')"/>').join('')+'<circle r="5" fill="#f3cf74"/>';
      default:return '';
    }
  }
  function neckArt(id,back){
    if(id==='star')return '<path d="M0-10L3-4 10-3 5 2 6 9 0 6-6 9-5 2-10-3-3-4Z" fill="url(#gold)" stroke="#9b7748"/><circle r="2" fill="#fff4c8"/>';
    if(id==='clover')return '<path d="M1 3Q9 8 6 11" stroke="#587852" fill="none"/><path d="M0 3C-17 6-13-9-4-5C-7-17 7-16 6-6C17-12 19 4 7 4Q4 7 0 3Z" fill="url(#forest)" stroke="#5b805c"/>';
    if(!neckColors[id])return '';
    const [dark,light]=neckColors[id];
    const textile='<defs><linearGradient id="cloth"><stop stop-color="'+dark+'"/><stop offset=".3" stop-color="'+light+'"/><stop offset=".78" stop-color="'+dark+'"/><stop offset="1" stop-color="'+light+'"/></linearGradient></defs>';
    return textile+(back?'':'<path d="M-5 3Q-7 13-11 24L-2 26 5 7Z" fill="url(#cloth)" stroke="'+dark+'"/><path d="M-8 20L0 22M-9 23L-1 25" stroke="'+light+'"/>')+
      '<path d="M-21-6Q0 0 21-6Q24-1 20 4Q9 11-8 9Q-23 7-22 1Z" fill="url(#cloth)" stroke="'+dark+'"/><path d="M-20-5Q0 1 21-6Q24-2 18 1Q-1 7-20 2Z" fill="url(#cloth)"/><path d="M-18 2Q-4 7 18 0M-10 6Q2 9 12 5" fill="none" stroke="'+light+'" stroke-width=".7" opacity=".8"/>';
  }
  const defs='<defs><linearGradient id="berry" x2="80%" y2="100%"><stop stop-color="#e6b2bd"/><stop offset="1" stop-color="#986782"/></linearGradient><linearGradient id="knit" x2="70%" y2="100%"><stop stop-color="#e3f2ed"/><stop offset="1" stop-color="#91bbc7"/></linearGradient><linearGradient id="forest" x2="70%" y2="100%"><stop stop-color="#c9dc9b"/><stop offset="1" stop-color="#739c6e"/></linearGradient><linearGradient id="gold" x2="70%" y2="100%"><stop stop-color="#fff0ad"/><stop offset=".48" stop-color="#eeca75"/><stop offset="1" stop-color="#c6954c"/></linearGradient></defs>';
  function uri(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
  // Calibrated to the neck seam and crown of the five transparent, 320px turntable views.
  const anchors=[[50,15,50,54],[51,14,53,53],[48,14,53,53],[50,14,54,52],[50,14,50,52]];
  function frame(outfit,angle,gait){
    const [id,,base,matrix]=coats.find(c=>c[0]===outfit.look)||coats[0];
    const heading=angle;
    const turn=heading%1!==0||(base!=='walk'&&heading===3);
    const baseHeading=base==='walk'?heading:Math.min(3,heading);
    const key=turn?base+'Turn'+(heading*2):base+baseHeading+gait;
    const plain=new URL('assets/'+base+Math.round(baseHeading)+gait+'.webp',document.baseURI).href;
    if(!turn&&!matrix&&outfit.hat==='none'&&outfit.neck==='none')return plain;
    const token=[id,outfit.hat,outfit.neck,key].join('-');if(cache.has(token))return cache.get(token);
    const bytes=WARDROBE_FRAMES[key];if(!bytes)return plain;
    if(!matrix&&outfit.hat==='none'&&outfit.neck==='none')return 'data:image/webp;base64,'+bytes;
    const A=anchors[Math.floor(heading)],B=anchors[Math.ceil(heading)],t=heading%1;
    const [hx,hy,nx,ny]=A.map((x,i)=>x*(1-t)+B[i]*t);
    const bob=turn?0:[0,-.8,-.2,.5][gait];
    const filter=matrix?'<filter id="fur" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+matrix+' 0 0 0 1 0"/></filter>':'';
    const hatSingle=['flower','leaf'].includes(outfit.hat);
    const pin=['star','clover'].includes(outfit.neck);
    const hatScale=hatSingle?.46:outfit.hat==='wool'?.49:.58;
    const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">'+defs+filter+
      '<image xlink:href="data:image/webp;base64,'+bytes+'" width="100" height="100" '+(matrix?'filter="url(#fur)"':'')+'/>'+
      '<g transform="translate('+(nx+(pin?(heading<3?2:0):0))+' '+(ny+bob)+') scale('+(pin?.34:.65)+' '+(pin?.34:.65)+')">'+neckArt(outfit.neck,heading>=3)+'</g>'+
      '<g transform="translate('+(hx+(hatSingle?-7:0))+' '+(hy+bob+(hatSingle?4:outfit.hat==='wool'?4:1))+') rotate('+(heading===1?-6:heading===2?-10:0)+') scale('+hatScale+')">'+hatArt(outfit.hat)+'</g></svg>';
    const src=uri(svg);if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(token,src);return src;
  }
  const groups=[['look','Mantelli',coats],['hat','Copricapi',hats],['neck','Sciarpe e spille',necks]];
  function show(root,title,outfit,change){
    title.textContent='La sartoria di Runa';root.replaceChildren();
    let active='look',heading=2,timer=0;
    const sheet=document.createElement('div');sheet.className='atelier';
    sheet.innerHTML='<div class="fitting"><span class="atelier-arc" aria-hidden="true"></span><img class="fitting-fox" alt="Runa con il completo scelto"><span class="ensemble" aria-live="polite"></span><button class="turntable" type="button" aria-label="Ruota Runa di un quarto di giro">↻ Gira</button></div><div class="rack-tabs" role="group" aria-label="Tipo di decorazione"></div><div class="swatches" role="group" aria-label="Capi disponibili"></div>';
    root.append(sheet);const [fox,description,tabs,items]=['.fitting-fox','.ensemble','.rack-tabs','.swatches'].map(s=>sheet.querySelector(s));
    function turnFrame(){
      fox.src=frame(outfit,Math.min(heading,16-heading)/2,0);
      fox.style.transform=heading>8?'scaleX(-1)':'';
    }
    const turnControl=sheet.querySelector('.turntable');
    turnControl.onclick=()=>{
      if(timer)return;
      let remaining=4;
      function step(){
        if(!sheet.isConnected){timer=0;return}
        heading=(heading+1)%16;turnFrame();
        timer=--remaining?setTimeout(step,72):0;
      }
      if(matchMedia('(prefers-reduced-motion:reduce)').matches){heading=(heading+4)%16;turnFrame()}else step();
    };
    function refresh(){
      const [,label,options]=groups.find(g=>g[0]===active);
      turnFrame();description.textContent=groups.map(([key,,values])=>values.find(v=>v[0]===outfit[key])[1]).filter((_,i)=>i===0||outfit[groups[i][0]]!=='none').join(' · ');
      tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===active)));
      items.setAttribute('aria-label',label);items.replaceChildren();
      for(const [id,name] of options){
        const b=document.createElement('button');b.type='button';b.className='swatch';b.setAttribute('aria-pressed',String(outfit[active]===id));
        const art=new Image();art.alt='';art.src=active==='look'?frame({look:id,hat:'none',neck:'none'},1,0):id==='none'?frame({look:outfit.look,hat:'none',neck:'none'},1,0):uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -37 64 72">'+defs+'<g transform="translate(0 5)">'+(active==='hat'?hatArt(id):neckArt(id,false))+'</g></svg>');
        const caption=document.createElement('span');caption.textContent=name;b.append(art,caption);
        b.onclick=()=>{outfit={...outfit,[active]:id};change(outfit);refresh();items.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true})};items.append(b);
      }
    }
    for(const [key,label] of groups){const b=document.createElement('button');b.type='button';b.dataset.group=key;b.textContent=label;b.onclick=()=>{active=key;refresh()};tabs.append(b)}
    refresh();
  }
  return {restore,frame,show};
})();
