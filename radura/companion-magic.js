'use strict';
// The visitor travels in viewport coordinates from its support button to the affected tiles.
const CompanionMagic=(()=>{
  const spells={
    mochi:['#ffd36b','+1',-22],luma:['#d5b3ff','✦',-35],neve:['#a9ebff','❄',25],
    bruma:['#ff9d5d','✴',-8],lumi:['#ffdd80','★',-32],talpa:['#d3ae76','◆',20],
    riccio:['#9bd488','❧',-12],lontra:['#71dbdc','≈',18]
  };
  const center=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]};
  async function cast(id,targets){
    const [color,mark,bend]=spells[id],layer=document.createElement('div');
    layer.className='spell-layer';layer.setAttribute('aria-hidden','true');layer.style.setProperty('--magic',color);
    document.body.append(layer);
    try{
      const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
      const from=center(document.getElementById('support')),points=targets.map(center),[x,y]=points[0];
      const visitor=new Image();visitor.src='assets/'+id+'.webp';visitor.alt='';layer.append(visitor);
      const size=Math.max(38,Math.min(76,document.querySelector('.cell').offsetWidth));
      visitor.style.width=size+'px';visitor.style.left=x+'px';visitor.style.top=y+'px';
      const dx=from[0]-x,dy=from[1]-y;
      const travel=visitor.animate(reduced?[{opacity:.4},{opacity:1}]:[
        {transform:'translate(-50%,-80%) translate('+dx+'px,'+dy+'px) scale(.55)',opacity:.3},
        {transform:'translate(-50%,-80%) translate('+dx*.45+'px,'+(dy*.45+bend)+'px) rotate('+bend*.22+'deg)',offset:.5},
        {transform:'translate(-50%,-80%)',opacity:1}
      ],{duration:reduced?50:360,easing:'ease-out',fill:'forwards'});
      await travel.finished;
      if(!reduced){
        // Ember spray, icy rewind, moon orbit, burrowing dirt, rising thorns and a water ripple.
        const motifs={bruma:['✴',88,-15],neve:['❄',-110,-12],luma:['✧',180,-24],talpa:['●',28,15],
          riccio:['❧',-64,-25],lontra:['≈',0,-8],mochi:['+',-84,-29],lumi:['✦',140,-23]};
        const [glyph,turn,rise]=motifs[id];
        for(let k=0;k<6;k++){
          const p=document.createElement('i'),a=(k+1)*Math.PI/3;
          p.textContent=glyph;layer.append(p);p.style.left=x+'px';p.style.top=y+'px';
          p.animate([{opacity:0,transform:'scale(.3)'},{opacity:1,offset:.25},
            {opacity:0,transform:'translate('+Math.cos(a)*size*.55+'px,'+(Math.sin(a)*size*.35+rise)+'px) rotate('+turn+'deg) scale(.8)'}],
            {duration:320,easing:'ease-out',fill:'forwards'});
        }
      }
      await Promise.all(points.map(async ([px,py],n)=>{
        const spark=document.createElement('span');spark.textContent=mark;layer.append(spark);
        spark.style.left=px+'px';spark.style.top=py+'px';
        const anim=spark.animate(reduced?[{opacity:1},{opacity:0}]:[
          {transform:'translate(-50%,-50%) scale(.45)',opacity:.3},
          {transform:'translate(-50%,-50%) scale(1.16)',opacity:1,offset:.35},
          {transform:'translate(-50%,-76%) scale(1.35)',opacity:0}
        ],{duration:reduced?100:350,delay:reduced?0:n*40,easing:'ease-out'});
        await anim.finished;
      }));
    }finally{layer.remove()}
  }
  return {cast};
})();
