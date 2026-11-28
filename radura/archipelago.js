'use strict';
const Archipelago=(()=>{
  const ns='http://www.w3.org/2000/svg',levels=Radura.levels;
  const regions=[];
  levels.forEach((level,i)=>{if(!i||levels[i-1].region!==level.region)regions.push({name:level.region,first:i,last:i,biome:level.biome});regions[regions.length-1].last=i});
  const at=i=>regions.findIndex(r=>i>=r.first&&i<=r.last);
  const skies=[['#b9dac8','#f9d8a2'],['#aec9e3','#e6e7ef'],['#5e5989','#cbb2d7'],['#9bbba0','#f7ce91'],['#a8c9df','#e6e4ed'],['#454576','#aa91bc']];
  function el(parent,tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))if(v!=null)n.setAttribute(k,v);parent.append(n);return n}
  function path(g,d,fill,attrs={}){return el(g,'path',{d,fill,...attrs})}
  const spacing=178,margin=150;
  let redraw=null,scheduled=0;
  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(()=>{scheduled=0;redraw?.()})}
  let lastLayout=null;
  function map(){
    const host=document.getElementById('trail'),scroll=host.parentElement,w=host.clientWidth,h=scroll.clientHeight;
    const stops=[...host.querySelectorAll('.stop')];if(!w||!h||stops.length!==levels.length)return;
    if(lastLayout?.first===stops[0]&&lastLayout.w===w&&lastLayout.h===h){schedule();return}
    lastLayout={first:stops[0],w,h};
    const length=spacing*(levels.length-1)+margin*2;
    host.style.height=length+'px';
    const point=i=>({x:w*.5+Math.sin(i*1.18-.65)*Math.min(w*.225,126),y:margin+(levels.length-1-i)*spacing});
    stops.forEach((btn,i)=>{const p=point(i);btn.style.left=p.x+'px';btn.style.top=p.y+'px'});
    host.querySelectorAll('.map-band').forEach(n=>n.remove());
    // Everything that can be tapped or walked upon lives in the same native scroll surface.
    for(let high=levels.length-1;high>=0;high-=5){
      const low=Math.max(0,high-4),top=point(high).y-spacing-18,height=point(low).y-top+90;
      const svg=el(host,'svg',{class:'map-band',width:w,height,viewBox:'0 0 '+w+' '+height,style:'top:'+top+'px','aria-hidden':true});
      const defs=el(svg,'defs',{}),stone='stone-'+high,door='gate-'+high;
      const surface=el(defs,'linearGradient',{id:stone,x2:'60%',y2:'100%'});
      for(const [offset,color] of [[0,'#fff3ce'],[.55,'#e9d3ac'],[1,'#c6ae92']])el(surface,'stop',{offset,'stop-color':color});
      const glow=el(defs,'radialGradient',{id:door});
      for(const [offset,color] of [[0,'#ffffd5'],[.54,'#ffe0a1'],[1,'#b17fae']])el(glow,'stop',{offset,'stop-color':color});
      for(let i=high;i>=low;i--){
        const p=point(i),g=el(svg,'g',{transform:'translate('+p.x+' '+(p.y-top)+')','data-island':i}),region=at(i);
        if(i<levels.length-1){const next=point(i+1);for(let j=9;j>=1;j--){
          const t=j/10,x=(next.x-p.x)*t*t*(3-2*t),y=-spacing*t;
          const tread=el(g,'g',{transform:'translate('+x+' '+y+') rotate('+Math.sin(i*4+j)*3+')'});
          path(tread,'M-14-3Q-8-7 9-6L15-3 14 2Q3 6-10 5L-16 2Z','#978572');
          path(tread,'M-16-3Q-10-7 8-7L15-4Q12 0-9 1L-15 0Z','url(#'+stone+')');
        }}
        const iw=Math.min(w*(.54+.035*(i%3)),253),ih=iw*.66;
        el(g,'image',{href:'islands/isle-'+region+'.webp',x:-iw/2,y:-ih*.59,width:iw,height:ih,transform:i%2?'scale(-1 1)':null});
        if(i===regions[region].last){
          const arch=el(g,'g',{transform:'translate(0 -9)'});
          path(arch,'M-17 3V-17A17 21 0 0 1 17-17V3Z','url(#'+door+')');
          path(arch,'M-20 4V-17A20 23 0 0 1 20-17V4','none',{stroke:'#d5c7a6','stroke-width':6,'stroke-dasharray':'9 1.3'});
        }
      }
    }
    const home=document.getElementById('home'),sky=[...document.querySelectorAll('.atlas-sky')];
    let oldRegion=-1;
    redraw=()=>{
      const raw=(length-margin-scroll.scrollTop-h*.55)/spacing,pos=Math.max(0,Math.min(levels.length-1,raw));
      const a=Math.floor(pos),b=Math.ceil(pos),mix=pos-a,one=levels[a].biome,two=levels[b].biome;
      sky.forEach((layer,i)=>{const opacity=(one===i?1-mix:0)+(two===i?mix:0);const v=String(Math.round(opacity*32)/32);if(layer.style.opacity!==v)layer.style.opacity=v});
      const region=at(Math.round(pos));if(region===oldRegion)return;
      oldRegion=region;home.dataset.region=region;const r=regions[region];
      document.getElementById('chapter').textContent=r.name+' · '+(r.first+1)+'–'+(r.last+1);
    };
    scroll.onscroll=schedule;redraw();
  }

  function guide(){
    dialog('Atlante del viaggio');
    regions.forEach((r,i)=>{const b=document.createElement('button');b.className='atlas-row';b.innerHTML='<img src="islands/isle-'+i+'.webp" alt=""><span><strong>'+r.name+'</strong><small>Livelli '+(r.first+1)+'–'+(r.last+1)+'</small></span>';b.onclick=()=>{closePanel();const sc=document.getElementById('scrollMap'),pin=document.querySelectorAll('.stop')[r.first];sc.scrollTo({top:pin.offsetTop-sc.clientHeight*.58,behavior:'instant'});schedule()};document.getElementById('panelBody').append(b)});
    action('Chiudi',closePanel);
  }

  function advance(from,to,frameFor){
    const fox=to.querySelector('img');if(!fox||from===to||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const scale=Number(to.style.getPropertyValue('--depth'))||1;
    const dx=(from.offsetLeft-to.offsetLeft)/scale,dy=(from.offsetTop-to.offsetTop)/scale;
    const frames=Array.from({length:13},(_,i)=>{const t=i/12,curve=t*t*(3-2*t);return {transform:'translate('+dx*(1-curve)+'px,'+(dy*(1-t)-(i%2?4:0))+'px) rotate('+(i%2?-2:0)+'deg)'}});
    const portrait=fox.src,heading=Math.abs(dx)>Math.abs(dy)*.36?3:4;
    const track=fox.animate(frames,{duration:820,easing:'ease-in-out'});
    function stride(){
      if(!fox.isConnected||track.playState==='finished'||track.playState==='idle'){fox.src=portrait;fox.style.scale='';return}
      const gait=Math.floor((track.currentTime||0)/78)%4;
      const src=frameFor(heading,gait);if(fox.src!==src)fox.src=src;
      fox.style.scale=dx>0?'-1 1':'1';requestAnimationFrame(stride);
    }
    stride();
  }
  return {map,advance,guide,regions,at};
})();


