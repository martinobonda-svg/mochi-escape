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
      const flip=dir>4, frameKey=key+flip;
      if(frameKey===state.key)continue;
      const img=images.get(key);
      if(!img?.naturalWidth)continue;
      const ctx=view.getContext('2d'), size=view.width;
      const scale=Math.min(size/img.width,size/img.height);
      ctx.clearRect(0,0,size,size);ctx.save();
      if(flip){ctx.translate(size,0);ctx.scale(-1,1);}
      ctx.drawImage(img,(size-img.width*scale)/2,size-img.height*scale,img.width*scale,img.height*scale);
      ctx.restore();state.key=frameKey;view.dataset.ready='true';view.dataset.frame=frameKey;
    }
  }
  requestAnimationFrame(frame);
}
if(typeof Image==='function')startStorybook();

