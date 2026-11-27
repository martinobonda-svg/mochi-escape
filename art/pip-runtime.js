/* Storybook poses share one clock. Selecting a piece does not restart the actor. */
function startStorybook(){
  const images=new Map(), states=new WeakMap();
  for(const key of Object.keys(ASSETS)){
    if(!/^(walk|coniglio$|ermellino$|gufo$)/.test(key))continue;
    const image=new Image();image.src=artURL(key);images.set(key,image);
  }
  for(const key of ['forestGate','snowGate','starsGate','rockTile','iceTile','starTile','forestSign','snowSign','starsSign','goldButton','creamButton','waystone','starsFrame','snowFrame']){
    document.documentElement.style.setProperty('--'+key,'url('+artURL(key)+')');
  }
  for(const [variable,key] of Object.entries({forestSceneArt:'forestScene',snowSceneArt:'snowScene',starsSceneArt:'starsScene',forestFrame:'forestFrame'})){
    document.documentElement.style.setProperty('--'+variable,'url('+artURL(key)+')');
  }
  const lights={
    forest:['rgba(255,215,128,.095)','rgba(92,99,52,.065)'],
    snow:['rgba(200,231,255,.14)','rgba(127,162,221,.13)'],
    stars:['rgba(229,190,255,.17)','rgba(107,81,163,.17)']
  };
  function frame(time){
    requestAnimationFrame(frame);
    if(document.hidden)return;
    for(const view of document.querySelectorAll('canvas.pip-model')){
      if(!view.getClientRects().length)continue;
      const actor=view.closest('.hero,.journey-pip');
      const walking=actor?.matches('.run,.travelling');
      const target=walking?Number(actor.dataset.heading??3):1;
      let state=states.get(view);
      if(!state){state={angle:1,last:time,key:''};states.set(view,state);}
      const delta=(target-state.angle+12)%8-4;
      const step=Math.min(Math.abs(delta),Math.min(time-state.last,80)/65);
      state.angle=(state.angle+Math.sign(delta)*step+8)%8;
      state.last=time;
      const dir=Math.round(state.angle)%8;
      const pose=walking?Math.floor(time/92)%4:0;
      const mesh=view.dataset.mesh;
      const key=!mesh?'walk'+Math.min(dir,8-dir)+pose:mesh==='draghetto'?'walk5'+pose:mesh;
      const flip=dir>4,theme=actor?.dataset.biome||view.closest('#playScreen')?.dataset.theme||'forest';
      const size=Math.max(1,Math.min(384,Math.round(view.getBoundingClientRect().width*(window.devicePixelRatio||1))));
      const frameKey=key+flip+theme+size;
      if(frameKey===state.key)continue;
      const img=images.get(key);
      if(!img?.naturalWidth)continue;
      if(view.width!==size){view.width=size;view.height=size;}
      const ctx=view.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      const scale=Math.min(size/img.width,size/img.height);
      ctx.clearRect(0,0,size,size);ctx.save();
      if(flip){ctx.translate(size,0);ctx.scale(-1,1);}
      ctx.drawImage(img,(size-img.width*scale)/2,size-img.height*scale,img.width*scale,img.height*scale);
      ctx.restore();
      const light=lights[theme]||lights.forest;
      const gradient=ctx.createLinearGradient(0,0,size*.8,size);
      gradient.addColorStop(0,light[0]);gradient.addColorStop(1,light[1]);
      ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle=gradient;ctx.fillRect(0,0,size,size);ctx.restore();
      state.key=frameKey;view.dataset.ready='true';view.dataset.frame=frameKey;
    }
  }
  requestAnimationFrame(frame);
}
if(typeof Image==='function')startStorybook();

