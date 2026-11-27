'use strict';
const Archipelago=(()=>{
  const ns='http://www.w3.org/2000/svg';
  const colors=[
    ['#e2e89b','#8fbb76','#58896e','#917e70','#665c60'],
    ['#fff9f1','#dce7f4','#a0bcda','#9794a6','#64657c'],
    ['#ebd9fe','#b898db','#9075ae','#797191','#4d4667']
  ];
  function el(parent,tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n}
  function path(g,d,fill,attrs={}){return el(g,'path',{d,fill,...attrs})}
  function oval(g,x,y,rx,ry,fill){return el(g,'ellipse',{cx:x,cy:y,rx,ry,fill})}
  function tree(g,x,y,scale,snow){
    const t=el(g,'g',{transform:'translate('+x+' '+y+') scale('+scale+')'});
    oval(t,2,1,16,4,'#36445e40');path(t,'M-3 2Q-1-11-4-27L2-31 4 1Z','#795d50');
    if(snow){for(let k=0;k<3;k++){const z=el(t,'g',{transform:'translate(0 '+(-k*11)+') scale('+(1-k*.17)+')'});path(z,'M0-32Q-6-18-19-9Q-8-4 0-9Q12-3 19-9Q7-20 0-32Z','#487980');path(z,'M0-32Q-6-18-16-12Q-11-10-6-14Q-1-10 4-16Q11-10 15-13Z','#f2f5ec')}}
    else{path(t,'M-19-18Q-25-31-12-36Q-11-50 3-49Q17-50 19-37Q31-31 23-20Q15-12 5-17Q-11-11-19-18Z','#478475');path(t,'M-19-23Q-23-32-11-36Q-8-47 3-46Q16-46 18-37Q7-40 3-32Q-7-36-13-24Z','#a5c876')}
  }
  function island(g,i){
    const biome=Math.floor(i/5),c=colors[biome];
    path(g,'M-79-3Q-82 8-71 17L-60 22-52 40-38 37-23 55-4 44 9 50 27 30 42 37 54 20 70 16 80-3Z',c[3]);
    path(g,'M-70 13L-57 16-52 40-60 22ZM-40 14L-20 22-23 55-34 37ZM3 21L27 13 9 50-4 44ZM43 15L69 9 54 20 42 37Z',c[4]);
    path(g,'M-81-4Q-73-18-49-17Q-30-27-7-20Q17-26 39-17Q64-18 79-7Q90 1 70 11Q46 21 16 17Q-7 26-33 17Q-70 20-81 6Z',c[2]);
    path(g,'M-81-5Q-69-18-49-18Q-24-28-4-22Q19-27 42-17Q65-17 79-7Q83 0 66 6Q45 13 20 10Q-7 19-32 11Q-68 14-81 2Z',c[1]);
    path(g,'M-77-6Q-60-18-42-15Q-25-23-9-19Q-24-15-32-12Q-59-12-70-4Z',c[0]);
    if(biome<2){tree(g,-52,-8,.72,biome===1);if(i%2===0)tree(g,53,-6,.51,biome===1)}
    else{for(const [x,y,s] of [[-52,-7,.85],[54,-5,.55],[-42,-9,.45]]){const t=el(g,'g',{transform:'translate('+x+' '+y+') scale('+s+')'});path(t,'M-9-15L-2-36 8-23 6-3-3 1Z','#b094ea');path(t,'M-2-36L1-15-3 1-9-15Z','#e2ceff')}}
    if(i%5===4){const portal=el(g,'g',{transform:'translate(0 -8)'});
      path(portal,'M-21 4V-14A21 23 0 0 1 21-14V4Z','url(#doorLight)');
      path(portal,'M-26 5V-15A26 28 0 0 1 26-15V5','none',{stroke:c[4],'stroke-width':8});
      path(portal,'M-26 4V-15A26 28 0 0 1 26-15V4','none',{stroke:c[0],'stroke-width':6,'stroke-dasharray':'11 2'});
      path(portal,'M0-49L4-43 0-37-4-43Z','#ffe39c')}
  }
  let frame=0,drawPerspective=()=>{};
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;drawPerspective()})}
  function map(){
    const host=document.getElementById('trail'),scroll=host.parentElement,w=host.clientWidth,h=host.clientHeight;
    const stops=[...host.querySelectorAll('.stop')];if(!w||!h||stops.length!==15)return;
    host.querySelector('.geography')?.remove();const svg=el(host,'svg',{class:'geography',width:w,height:h,viewBox:'0 0 '+w+' '+h,'aria-hidden':true});host.prepend(svg);
    const defs=el(svg,'defs',{}),sky=el(defs,'linearGradient',{id:'journeySky',x2:'0%',y2:'100%'}),light=el(defs,'radialGradient',{id:'doorLight'});
    for(const [offset,color] of [[0,'#363459'],[.23,'#7e79ad'],[.42,'#b7cce2'],[.56,'#d5e3ef'],[.72,'#ecdcb4'],[1,'#96cbb1']])el(sky,'stop',{offset,'stop-color':color});
    for(const [offset,color] of [[0,'#fffacb'],[.6,'#f9cbef'],[1,'#9379be']])el(light,'stop',{offset,'stop-color':color});
    el(svg,'rect',{width:w,height:h,fill:'url(#journeySky)'});
    const moon=el(svg,'g',{transform:'translate('+w*.19+' '+h*.062+') rotate(-17)'});
    path(moon,'M8-22A23 23 0 1 0 22 9Q-4 12 8-22Z','#ffedcc');
    // Small distant outcrops give the staircase a backdrop at a second depth.
    for(let k=0;k<18;k++){
      const y=h*(.035+k*.054),x=w*(k%2?.95:.06),c=colors[y<h*.34?2:y<h*.66?1:0];
      const distant=el(svg,'g',{opacity:.36,transform:'translate('+x+' '+y+') scale('+(w/480*(.43+(k%3)*.12))+')'});
      path(distant,'M-69 0Q-42-8-28-4L-12-26 0-10 14-19 27-5Q51-10 73-1L57 9 31 12 14 35-2 21-20 29-39 11-58 8Z',c[4]);
      path(distant,'M-69 0Q-44-8-27-4L-12-26 0-10 14-19 27-5Q52-10 73-1Q42 7 19 4Q-13 11-69 0Z',c[1]);
    }
    for(let k=0;k<80;k++){const x=((k*137+41)%997)/997*w,y=((k*311+17)%991)/991*h;
      if(y<h*.38)oval(svg,x,y,1+k%2,1+k%2,'#fff0dcbb');
      else if(k%3===0){const c=el(svg,'g',{transform:'translate('+x+' '+y+') scale('+(w/550)+')',opacity:.3});path(c,'M-54 4Q-55-5-40-8Q-35-24-16-19Q-2-35 14-22Q32-26 39-10Q59-11 61 1Q36 9-54 4Z','#fff9e6')}}
    const point=i=>({x:w*(.5+.24*Math.sin(i*1.12-.8)),y:h-96-i*(h-192)/14}),groups=[];
    for(let i=14;i>=0;i--){const a=point(i);stops[i].style.left=a.x+'px';stops[i].style.top=a.y+'px';
      if(i<14){const b=point(i+1);for(let j=9;j>=1;j--){const t=j/10,x=a.x+(b.x-a.x)*(t*t*(3-2*t)),y=a.y+(b.y-a.y)*t;
        const step=el(svg,'g',{transform:'translate('+x+' '+y+')'});path(step,'M-15-3L9-5 16-2 15 2-10 5-16 2Z','#96817c');path(step,'M-16-3L-10-6 11-7 16-4 11-1-12 1Z','#eddec5');path(step,'M-12 1L11-1 15-3','none',{stroke:'#fff1d4','stroke-width':1})}}
      const g=el(svg,'g',{});island(g,i);groups.push({g,a,btn:stops[i]})}
    drawPerspective=()=>{const height=scroll.clientHeight,top=scroll.scrollTop;if(!height)return;
      for(const {g,a,btn} of groups){const depth=Math.max(0,Math.min(1,(a.y-top)/height)),scale=(.66+.50*depth)*Math.min(1.45,w/360);
        g.setAttribute('transform','translate('+a.x+' '+a.y+') scale('+scale+')');btn.style.setProperty('--depth',.82+depth*.25)}};
    scroll.onscroll=schedule;drawPerspective();
  }
  return {map};
})();
