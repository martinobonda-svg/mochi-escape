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
  function map(){
    const host=document.getElementById('trail'),scroll=host.parentElement,w=host.clientWidth,h=scroll.clientHeight;
    if(!w||!h)return;
    const stops=[...host.querySelectorAll('.stop')];if(stops.length!==levels.length)return;
    const length=spacing*(levels.length-1)+margin*2;host.style.height=length+'px';
    const paint=[];for(let i=regions.length-1;i>=0;i--){const r=regions[i],y=margin+(levels.length-1-r.last)*spacing;paint.push(skies[i][0]+' '+(y-40)+'px',skies[i][1]+' '+(y+(r.last-r.first)*spacing+45)+'px')}
    host.style.background='linear-gradient('+paint.join(',')+')';
    const point=i=>({x:w*.5+Math.sin(i*1.18-.65)*Math.min(w*.225,126),y:margin+(levels.length-1-i)*spacing});
    stops.forEach((btn,i)=>{const p=point(i);btn.style.left=p.x+'px';btn.style.top=p.y+'px'});
    host.querySelector('.geography')?.remove();
    const svg=el(host,'svg',{class:'geography',width:w,height:h,viewBox:'0 0 '+w+' '+h,'aria-hidden':true});host.prepend(svg);
    const far=el(svg,'g',{opacity:'.23'}),near=el(svg,'g',{}),groups=new Map();
    const defs=el(svg,'defs',{}),portal=el(defs,'radialGradient',{id:'doorLight'});
    for(const [offset,color] of [[0,'#fffce3'],[.55,'#fce4b5'],[1,'#a383c9']])el(portal,'stop',{offset,'stop-color':color});
    for(let k=0;k<5;k++){const g=el(far,'g',{transform:'translate('+((k%2?.96:.03)*w)+' '+(k*h*.29)+') scale(.65)'});
      path(g,'M-65 0Q-40-11-25-7L-12-23 4-12 16-19 26-7Q54-12 72-2L51 9 26 12 10 31-7 20-24 25-37 10Z','#657887');path(g,'M-63 0Q-35-12-23-7L-12-23 4-12 16-19 26-7Q52-13 72-2Q39 6 20 3Q-11 10-63 0Z','#e6ebe0')}
    function island(i){
      const p=point(i),g=el(near,'g',{}),region=at(i);
      if(i<levels.length-1){const b=point(i+1);for(let j=9;j>=1;j--){const t=j/10,x=(b.x-p.x)*t*t*(3-2*t),y=-spacing*t;
        path(g,'M-14-2L8-5 16-2 15 3-9 6-16 2Z','#9e9082',{transform:'translate('+x+' '+y+')'});path(g,'M-16-2L-8-6 10-7 16-4 9 0-10 2Z','#f5e9d1',{transform:'translate('+x+' '+y+')'})}}
      const iw=Math.min(w*(.54+.035*(i%3)),253),ih=iw*.66;
      el(g,'image',{href:'islands/isle-'+region+'.webp',x:-iw/2,y:-ih*.59,width:iw,height:ih,preserveAspectRatio:'xMidYMid meet',transform:i%2?'scale(-1 1)':null});
      if(i===regions[region].last){const arch=el(g,'g',{transform:'translate(0 -9)'});path(arch,'M-17 3V-17A17 21 0 0 1 17-17V3Z','url(#doorLight)');path(arch,'M-20 4V-17A20 23 0 0 1 20-17V4','none',{stroke:'#cebc92','stroke-width':5,'stroke-dasharray':'9 1.5'});}
      groups.set(i,g);return g;
    }
    const border=el(svg,'g',{'aria-hidden':true});
    function fringe(biome){
      border.replaceChildren();
      for(const side of [0,1]){
        const twig=el(border,'g',{transform:(side?'translate('+w+' 0) scale(-1 1) ':'')+'scale('+Math.min(1.3,w/475)+')'});
        path(twig,'M-8-8Q39 24 95 8Q116 4 140-5Q91 17 60 16Q29 16 6 7L-8 43Z',biome===2?'#625272':'#72634b');
        for(let j=0;j<8;j++){
          const leaf=el(twig,'g',{transform:'translate('+(j*12)+' '+(9+Math.sin(j*.4)*6)+') rotate('+(30-j*8)+')'});
          if(biome===2){path(leaf,'M0 0V14M-3 18L0 12 3 18 0 24Z','#d9bdf1',{stroke:'#ddc7eb','stroke-width':.8})}
          else if(biome===1){path(leaf,'M-3 0Q0-2 5 0L2 '+(10+j%4*3)+'Z','#e0eff5')}
          else{path(leaf,'M0 0Q15 0 20 13Q5 17 0 0Z',j%2?'#78965f':'#a1b97d');path(leaf,'M1 1L16 10','none',{stroke:'#c0cc92','stroke-width':.9})}
        }
      }
    }
    let oldRegion=-1;
    redraw=()=>{
      const top=scroll.scrollTop;svg.style.transform='translateY('+top+'px)';far.style.transform='translateY('+(-Math.sin(top/600)*26)+'px)';
      const lo=Math.max(0,Math.floor((length-margin-top-h)/spacing)-2),hi=Math.min(levels.length-1,Math.ceil((length-margin-top)/spacing)+1);
      for(const [i,g] of groups)if(i<lo||i>hi){g.remove();groups.delete(i)}
      for(let i=hi;i>=lo;i--){const p=point(i),g=groups.get(i)||island(i);g.setAttribute('transform','translate('+p.x+' '+(p.y-top)+')')}
      const focus=Math.max(0,Math.min(levels.length-1,Math.round((length-margin-top-h*.55)/spacing))),region=at(focus);
      if(region!==oldRegion){oldRegion=region;fringe(regions[region].biome);const r=regions[region],label=document.getElementById('chapter');label.textContent=r.name+' · '+(r.first+1)+'–'+(r.last+1);document.getElementById('home').dataset.region=region}
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

