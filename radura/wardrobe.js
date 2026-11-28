'use strict';
const Wardrobe=(()=>{
  const coats=[['classic','Runa'],['honey','Custode del miele'],['moon','Falena lunare'],['copper','Aviatrice di Rame'],['silver','Cavaliere di brina'],['umber','Cercaghiande'],['dawn','Rosa selvatica'],['aurora','Cartografa Aurora']];
  const hats=[['none','Orecchie libere'],['beret','Basco di mora'],['wool','Berretto di neve'],['leaf','Foglia del bosco'],['crown','Corona di stelle'],['flower','Fiore di prato']];
  const necks=[['none','Collo libero'],['lagoon','Foulard laguna'],['rose','Sciarpa corallo'],['knit','Sciarpa di lana'],['star','Spilla stellare'],['clover','Spilla trifoglio']];
  const cache=new Map();
  function valid(list,key){return list.some(([id])=>id===key)}
  function restore(data){return {look:valid(coats,data.look)?data.look:'classic',hat:valid(hats,data.hat)?data.hat:'none',neck:valid(necks,data.neck)?data.neck:'none'}}
  const uri=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const texture=r=>'data:image/webp;base64,'+r.texture;
  function image(r,x,y,w,h){return '<image x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" preserveAspectRatio="none" xlink:href="'+texture(r)+'"/>'}
  const inter=(a,b,t)=>a+(b-a)*t;
  // The collar's attachment lies at the top of the bodice. Keep its pivot under
  // the jaw as relative widths change between the frontal and rear views.
  function anchor(outfit,angle){
    const row=TAILOR[outfit.look],lo=Math.floor(angle),hi=Math.ceil(angle),t=angle-lo;
    // Midpoints of the plush head in each direction, measured on the opaque silhouette.
    const centers={"classic":[0.573,0.569,0.566,0.569,0.507],"moon":[0.565,0.579,0.565,0.565,0.505],"honey":[0.528,0.583,0.531,0.563,0.506],"copper":[0.579,0.595,0.552,0.572,0.509],"silver":[0.55,0.553,0.567,0.563,0.517],"umber":[0.571,0.574,0.574,0.569,0.502],"dawn":[0.545,0.537,0.559,0.568,0.527],"aurora":[0.572,0.583,0.566,0.571,0.5]}[outfit.look];
    const seams={classic:.55,moon:.55,copper:.56,aurora:.55,honey:.55,silver:.55,umber:.55,dawn:.55};
    const fraction=inter(centers[lo],centers[hi],t);
    const natural=inter(row[lo].w/row[lo].h,row[hi].w/row[hi].h,t);
    const h=Math.min(87,90/(natural*Math.max(fraction,1-fraction)*2));
    const w=h*natural,y=95-h;
    return {x:51-fraction*w,y,w,h,neckX:51,neckY:y+h*seams[outfit.look]};
  }
  function frame(outfit,angle,gait){
    const token=[outfit.look,outfit.hat,outfit.neck,angle,gait].join('-');if(cache.has(token))return cache.get(token);
    const views=TAILOR[outfit.look],r=views[Math.round(angle)],a=anchor(outfit,angle),tilt=[0,-.8,.1,.9][gait];
    const itemView=angle<.75?0:angle<1.75?1:angle<2.75?2:3;
    let adorn='';
    if(outfit.neck!=='none'){
      const brooch=['star','clover'].includes(outfit.neck),piece=TAILOR[outfit.neck][itemView];
      // A brooch is pinned to the chest and disappears naturally round the side.
      if(!brooch||angle<2.75){
        const width=brooch?(angle>1.5?5:9):(angle>=3?32:30);
        const height=brooch?10:outfit.neck==='knit'?10:angle>=3?8:17;
        const cx=a.neckX+(brooch?Math.sin(angle*Math.PI/4)*8:0);
        const top=a.neckY+(brooch?5:-4.4);
        adorn+=image(piece,cx-width/2,top,width,height);
        // Re-lay the fur at the bottom of the muzzle in front of the neck ring.
        if(!brooch)adorn+='<use xlink:href="#body" clip-path="url(#chin)"/>';
      }
    }
    if(outfit.hat!=='none'){
      const clip=['flower','leaf'].includes(outfit.hat),piece=TAILOR[outfit.hat][clip&&itemView===3?2:itemView];
      const width=clip?(itemView>=2?6.9:12):outfit.hat==='wool'?27:30;
      const height=clip?11:outfit.hat==='wool'?24:17;
      const cx=a.neckX+(clip?[-10,-9,-5,-1,8][Math.round(angle)]:-1.1);
      const base=a.y+a.h*(clip?.19:outfit.hat==='crown'?.12:.15);
      adorn+=image(piece,cx-width/2,base-height,width,height);
    }
    const y=a.neckY,x=a.neckX;
    const turn=Number.isInteger(angle)?0:(angle<2?2:-2);
    const body='<g transform="translate('+a.neckX+' 0) skewY('+turn+') translate('+(-a.neckX)+' 0)">'+image(r,a.x,a.y,a.w,a.h)+'</g>';
    // A four-phase foot cycle uses the actual illustrated boots instead of
    // translating the entire portrait. Face and garments share a body pivot.
    const leg=[0,1.3,0,-1.3][gait],lift=[0,-.5,0,-.65][gait];
    const defs='<defs><g id="body">'+body+'</g><clipPath id="chin"><path d="M0 0H100V'+(y-2.7)+'H'+(x+15)+'Q'+x+' '+(y+1.5)+' '+(x-15)+' '+(y-2.7)+'H0Z"/></clipPath><clipPath id="upper"><rect width="100" height="80.8"/></clipPath><clipPath id="left"><rect x="0" y="79" width="'+x+'" height="21"/></clipPath><clipPath id="right"><rect x="'+x+'" y="79" width="'+(100-x)+'" height="21"/></clipPath></defs>';
    const legs='<g transform="translate('+(-leg*.65)+' '+Math.min(0,-leg)+')"><use xlink:href="#body" clip-path="url(#left)"/></g><g transform="translate('+(leg*.65)+' '+Math.min(0,leg)+')"><use xlink:href="#body" clip-path="url(#right)"/></g>';
    const upper='<g transform="translate(0 '+lift+') rotate('+tilt+' 51 80)"><use xlink:href="#body" clip-path="url(#upper)"/>'+adorn+'</g>';
    const dressed=leg===0?'<use xlink:href="#body"/>'+adorn:legs+upper;
    const src=uri('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="640" height="640" viewBox="0 0 100 100">'+defs+dressed+'</svg>');
    if(cache.size>=80)cache.delete(cache.keys().next().value);cache.set(token,src);return src;
  }
  const groups=[['look','Costumi',coats],['hat','Copricapi',hats],['neck','Sciarpe e spille',necks]];
  function show(root,title,outfit,change){
    title.textContent='La sartoria di Runa';root.replaceChildren();
    const home=root.closest('#home');home.querySelector('h1').textContent='La sartoria di Runa';
    if(!home.querySelector('.workshop-props')){
      const decor=document.createElement('div');decor.className='workshop-props';decor.setAttribute('aria-hidden','true');
      for(const id of ['shelf','lamp','fabric','pins']){const im=new Image();im.alt='';im.className='prop-'+id;im.src=texture(TAILOR.scenery[id]);decor.append(im)}home.prepend(decor);
    }
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
        const art=new Image();art.alt='';art.src=active==='look'?frame({look:id,hat:'none',neck:'none'},1,0):id==='none'?frame({look:outfit.look,hat:'none',neck:'none'},1,0):texture(TAILOR[id][1]);
        const caption=document.createElement('span');caption.textContent=name;b.append(art,caption);
        b.onclick=()=>{outfit={...outfit,[active]:id};change(outfit);refresh();items.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true})};items.append(b);
      }
    }
    for(const [key,label] of groups){const b=document.createElement('button');b.type='button';b.dataset.group=key;b.textContent=label;b.onclick=()=>{active=key;refresh()};tabs.append(b)}
    refresh();
  }
  return {restore,frame,show};
})();
