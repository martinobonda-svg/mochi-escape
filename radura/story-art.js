'use strict';
const StoryArt=(()=>{
  const ns='http://www.w3.org/2000/svg';
  function node(parent,tag,attrs){const n=document.createElementNS(ns,tag);for(const [key,v] of Object.entries(attrs))n.setAttribute(key,v);parent.append(n);return n}
  function path(parent,d,fill,attrs={}){return node(parent,'path',{d,fill,...attrs})}
  function gradient(defs,id,stops,radial=false){
    const g=node(defs,radial?'radialGradient':'linearGradient',radial?{id}:{id,x1:'0%',x2:'75%',y1:'0%',y2:'100%'});
    stops.forEach(([offset,color,opacity=1])=>node(g,'stop',{offset,'stop-color':color,'stop-opacity':opacity}));return 'url(#'+id+')'
  }
  function twig(parent,scale){
    const g=node(parent,'g',{transform:'scale('+scale+')'});
    path(g,'M-6-5Q29 15 55 20Q92 31 130 73Q96 46 68 34Q84 56 82 69Q77 47 58 30Q18 22-8 12Z','#635645');
    for(let j=0;j<12;j++){
      const x=7+j*9,y=9+j*3.6+(j>6?(j-6)*2:0);
      const leaf=node(g,'g',{transform:'translate('+x+' '+y+') rotate('+(j%2?45:-60)+')'});
      path(leaf,'M0 1Q-6-10-2-22Q11-18 11-9Q10 0 0 1Z','url(#leafPaint)');
      path(leaf,'M1-1Q5-8 0-18','none',{stroke:'#cad48d','stroke-width':.8});
    }
    for(const [x,y] of [[56,32],[61,35],[59,39]])node(g,'circle',{cx:x,cy:y,r:2.5,fill:'#d88f69'})
  }
  function pine(parent,x,y,s){
    const g=node(parent,'g',{transform:'translate('+x+' '+y+') scale('+s+')'});
    path(g,'M-3 0L-1-39 3-40 4 1Z','#735d5e');
    for(let i=0;i<3;i++){
      const tier=node(g,'g',{transform:'translate(0 '+(-i*13)+') scale('+(1-i*.18)+')'});
      path(tier,'M0-45Q-7-26-22-11L-13-12-24-5Q-11-2-3-6Q7 0 23-6L15-13 21-12Q9-26 0-45Z','#537987');
      path(tier,'M0-45Q-8-25-20-13Q-12-12-8-17Q-4-11 1-18Q7-12 16-15Q6-28 0-45Z','url(#snowPaint)')}
  }
  function crystals(parent,x,y,s){
    const g=node(parent,'g',{transform:'translate('+x+' '+y+') scale('+s+')'});
    for(const [dx,dy,k,r] of [[-12,0,.72,-19],[0,0,1,6],[10,2,.55,25]]){
      const t=node(g,'g',{transform:'translate('+dx+' '+dy+') rotate('+r+') scale('+k+')'});
      path(t,'M-8-23L0-40 8-26 7-5 0 0-7-4Z','url(#gemPaint)');path(t,'M0-40L2-24 0 0-7-4-8-23Z','#dfc3ff',{opacity:.64});
      path(t,'M-7-23L2-24 8-26','none',{stroke:'#fff2ff','stroke-width':.9})}
  }
  function scene(svg,w,h,world){
    const defs=svg.querySelector('defs');
    gradient(defs,'leafPaint',[[0,'#c8db84'],[.5,'#82ae6e'],[1,'#457b64']]);
    gradient(defs,'snowPaint',[[0,'#fff9ea'],[.6,'#e3edfb'],[1,'#aac6da']]);
    gradient(defs,'gemPaint',[[0,'#f9d8ff'],[.45,'#b591eb'],[1,'#7457a3']]);
    const glow=gradient(defs,'horizonBloom',[[0,world===2?'#e8bfef':'#ffedbc',.63],[1,'#fff6e2',0]],true);
    const haze=node(svg,'ellipse',{cx:w*.68,cy:h*.23,rx:w*.60,ry:h*.28,fill:glow});
    svg.insertBefore(haze,svg.querySelector('circle')?.nextSibling||null);
    if(world===2){
      const points=[[.04,.21],[.13,.15],[.20,.19],[.27,.12],[.35,.14]];
      path(svg,points.map(([x,y],i)=>(i?'L':'M')+x*w+' '+y*h).join(' '),'none',{stroke:'#eddcfa','stroke-opacity':.4,'stroke-width':1});
      for(const [x,y] of points)node(svg,'circle',{cx:x*w,cy:y*h,r:2,fill:'#fff5d0'})
    }
    for(let side=0;side<2;side++){
      const edge=node(svg,'g',{transform:side?'translate('+w+' 0) scale(-1 1)':''});
      const scale=Math.min(w/420,h/780,1.6);
      if(world===0)twig(edge,scale*(side?.86:1.08));
      for(let band=0;band<3;band++){
        const at=h*(.83+band*.07),span=w*(.10+band*.048),color=[['#698b73','#507963','#375f56'],['#91abc2','#7695ac','#58788b'],['#8d77a5','#73668f','#504867']][world][band];
        path(edge,'M0 '+(at-20)+'Q'+span*.4+' '+(at-32)+' '+span*.62+' '+(at+2)+'T'+span+' '+(at+38)+'L'+(span+w*.10)+' '+h+'H0Z',color);
        if(world===1)pine(edge,span*.27,at-6,scale*(.7+band*.16));
        if(world===2)crystals(edge,span*.4,at+3,scale*(.65+band*.13));
        if(world===0){const clump=node(edge,'g',{transform:'translate('+span*.31+' '+at+') scale('+scale+')'});
          for(let k=0;k<5;k++)path(clump,'M0 2Q-7-10-5-18Q3-13 2 0Z',k%2?'#a8be77':'#789d70',{transform:'rotate('+(k*28-50)+')'});
          for(const [x,y] of [[-8,-4],[6,1],[0,-8]])node(clump,'circle',{cx:x,cy:y,r:2,fill:'#f6d7ab'})}
      }
    }
    const weather=node(svg,'g',{'aria-hidden':true});
    for(let j=0;j<13;j++){
      const x=(j%2===0?.03+(j%3)*.055:.80+(j%4)*.048)*w,y=((j*79+31)%197)/197*h;
      const g=node(weather,'g',{transform:'translate('+x+' '+y+')'}),p=node(g,'g',{class:'air air-'+world,style:'--time:'+(5+j%4)+'s;--delay:-'+(j*1.7)+'s'});
      if(world===0)path(p,'M-4 1Q-4-4 4-3Q4 2-3 3Z',j%2?'#ebd188':'#d2dc90');
      else if(world===1)node(p,'circle',{r:1.6+j%2,fill:'#fff'});
      else path(p,'M0-4L1-1 4 0 1 1 0 4-1 1-4 0-1-1Z','#fff3be')
    }
  }
  function clear(cells,indices){
    if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    let j=0;
    for(const i of indices){const c=cells[i],spark=document.createElement('i');spark.className='line-spark';spark.setAttribute('aria-hidden','true');c.append(spark);
      const motion=spark.animate([{opacity:0,transform:'scale(.35) rotate(-18deg)'},{opacity:1,offset:.34},{opacity:0,transform:'translateY(-30%) scale(1.25) rotate(16deg)'}],{duration:310,delay:(j++%6)*18});motion.onfinish=motion.oncancel=()=>spark.remove()}
  }
  return {scene,clear};
})();
