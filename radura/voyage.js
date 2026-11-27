'use strict';
// Map pins and the staircase use the same coordinates in CSS pixels.
const Voyage=(()=>{
 const ns='http://www.w3.org/2000/svg';
 const palettes=[
  ['#f7ce92','#9ad6cd','#79ab98','#659779','#49846b','#315f53','#ffe6a6'],
  ['#e6c9db','#99c7e8','#abc4d9','#8cabc7','#7295ab','#476d86','#faf8ed'],
  ['#363260','#776698','#756995','#625483','#574775','#39324e','#e6cef8']
 ];
 const worldNames=['Bosco dei Mochi','Vette innevate','Cielo stellato'];
 const xAt=(n,w)=>w*.5+Math.sin(n*1.12-.8)*Math.min(w*.27,138);
 const point=(i,w,h)=>({x:xAt(i,w),y:h-96-i*(h-192)/14});
 function node(parent,type,attrs){
   const el=document.createElementNS(ns,type);
   for(const [key,val] of Object.entries(attrs))el.setAttribute(key,val);
   parent.append(el);return el;
 }
 function landscape(host,w,h,world,seed){
   const p=palettes[world],id='sky'+seed;
   const svg=node(host,'svg',{viewBox:'0 0 '+w+' '+h,width:'100%',height:'100%','aria-hidden':true,class:'land'});
   const defs=node(svg,'defs',{}),gradient=node(defs,'linearGradient',{id,x2:0,y2:1,gradientUnits:'objectBoundingBox'});
   node(gradient,'stop',{offset:0,'stop-color':p[0]});node(gradient,'stop',{offset:1,'stop-color':p[1]});
   node(svg,'rect',{width:w,height:h,fill:'url(#'+id+')'});
   node(svg,'circle',{cx:w*.79,cy:h*.15,r:Math.min(w*.07,35),fill:p[6],opacity:.92});
   for(let j=0;j<3;j++){
     const y=h*(.36+j*.17),amp=h*(.085-j*.013);let d='M -10 '+h+' L -10 '+y;
     for(let k=1;k<=12;k++){
       const x=k*w/12,top=y+Math.sin(k*1.57+j+seed)*amp;
       if(world===1)d+=' L '+x+' '+top;
       else d+=' Q '+(x-w/24)+' '+(top-amp)+' '+x+' '+top;
     }
     node(svg,'path',{d:d+' L '+(w+2)+' '+h+' H -10 Z',fill:p[2+j]});
   }
   let random=seed+123;
   function next(){random=(1664525*random+1013904223)>>>0;return random/4294967296}
   for(let k=0;k<34;k++){
     const x=(k%2?1-next()*.23:next()*.23)*w,y=(.25+next()*.73)*h,size=4+next()*12;
     if(world===2){
       node(svg,'path',{d:'M '+x+' '+(y-size)+' l '+size*.55+' '+size+' -'+size*.55+' '+size+' -'+size*.55+' -'+size+' Z',fill:k%2?p[6]:p[2],opacity:.8});
     }else if(k%3===0){
       const g=node(svg,'g',{transform:'translate('+x+' '+y+') scale('+size/15+')'});
       node(g,'ellipse',{cy:3,rx:13,ry:4,fill:p[5],opacity:.35});node(g,'path',{d:'M-2 2V-18H2V2Z',fill:'#735e50'});
       if(world===1){node(g,'path',{d:'M0-37L-11-18H-6L-15-6H15L6-18H11Z',fill:p[5]});node(g,'path',{d:'M0-37L-8-24L-2-26L3-22L6-25Z',fill:p[6]})}
       else{for(const [cx,cy,r] of [[0,-19,12],[-8,-13,9],[8,-13,9],[0,-23,9]])node(g,'circle',{cx,cy,r,fill:cy<-20?'#99b97b':'#528562'})}
     }else node(svg,'ellipse',{cx:x,cy:y,rx:size*.48,ry:size*.18,fill:k%3?p[6]:p[5],opacity:.6});
   }
   return svg;
 }
 function map(){
   const host=document.getElementById('trail'),w=host.clientWidth,h=host.clientHeight;
   if(!w||!h)return;
   host.querySelector('.geography')?.remove();const layer=document.createElement('div');layer.className='geography';host.prepend(layer);
   const stops=Array.from(host.querySelectorAll('.stop'));const coords=stops.map((_,i)=>point(i,w,h));
   const bounds=[h,(coords[4].y+coords[5].y)/2,(coords[9].y+coords[10].y)/2,0];
   for(let j=0;j<3;j++){
     const zone=document.createElement('div');zone.className='zone';zone.style.top=bounds[j+1]+'px';zone.style.height=(bounds[j]-bounds[j+1])+'px';layer.append(zone);
     landscape(zone,w,bounds[j]-bounds[j+1],j,j+2);
     const label=document.createElement('span');label.className='region';label.textContent=worldNames[j];zone.append(label);
   }
   const svg=node(layer,'svg',{class:'road',viewBox:'0 0 '+w+' '+h,'aria-hidden':true});
   const step=(h-192)/14;let d='';
   coords.forEach((a,i)=>{stops[i].style.left=a.x+'px';stops[i].style.top=a.y+'px';if(i===0){d='M '+a.x+' '+a.y;return}const b=coords[i-1];d+=' C '+b.x+' '+(b.y-step*.48)+' '+a.x+' '+(a.y+step*.48)+' '+a.x+' '+a.y});
   for(const [stroke,width,offset] of [['#384e5260',39,5],['#ac8564',34,2],['#e8cda0',31,0],['#fff1cb',22,-1]]){
     node(svg,'path',{d,transform:'translate(0 '+offset+')',fill:'none',stroke,'stroke-width':width,'stroke-linecap':'round',...(width===22?{'stroke-dasharray':'2 10'}:{})});
   }
 }
 function stage(){
   const host=document.getElementById('scene'),el=host.parentElement,w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
   host.replaceChildren();landscape(host,w,h,['forest','snow','stars'].indexOf(el.dataset.biome),27);
 }
 return {map,stage};
})();
