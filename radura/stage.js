'use strict';
const $=id=>document.getElementById(id);
const colors=['','blue','yellow','purple','pink','green'];
const tile=n=>'url(assets/'+colors[n]+'.webp)';
const cells=[],buttons=[],sprites=new Map();
const hero=document.createElement('img');hero.id='pip';hero.alt='Pip';
for(let angle=0;angle<5;angle++)for(let pose=0;pose<4;pose++){
  const img=new Image();img.src='assets/walk'+angle+pose+'.webp';sprites.set(angle*4+pose,img);
}
let board,chosen,moves,spent,phase,position,drag,sequence=0;
const friends={
  neve:{name:'Neve',ability:'Passi leggeri',description:'Riporta il tavoliere a prima dell’ultima mossa.',at:7},
  bruma:{name:'Bruma',ability:'Soffio di drago',description:'Spezza un blocco a tua scelta.',at:13},
  mochi:{name:'Mochi',ability:'Un passo in più',description:'Aggiunge una mossa al tentativo.',at:2},
  luma:{name:'Luma',ability:'Seconda luce',description:'Rende disponibili i pezzi già usati.',at:4}
};
const saveKey='radura-viaggio-1';
let complete=0,equipped=null,owned=['classic'],look='classic',lastMove=null,breaking=false;
const coats=[{id:'classic',name:'Pip',price:0},{id:'honey',name:'Miele',price:2},{id:'moon',name:'Lunare',price:4}];
function balance(){return complete-coats.reduce((sum,c)=>sum+(owned.includes(c.id)?c.price:0),0)}

try{const current=localStorage.getItem(saveKey);let data;
if(current){data=JSON.parse(current)}else{
  const previous=JSON.parse(localStorage.getItem('mochi-staircase-v1')||'null');
  if(previous){data={complete:Math.max(Number(previous.unlocked)||0,previous.stars?.[14]>0?15:0)}}
  else {
    const old=Number(localStorage.getItem('mochi-level-v1'))||0;
    const end=localStorage.getItem('mochi-complete-v03')==='1'?30:old===19&&localStorage.getItem('mochi-complete-v02')==='1'?20:old;
    data={complete:[0,1,2,3,4,10,11,12,13,19,20,21,23,26,29].filter(i=>i<end).length};
  }
}complete=Math.max(0,Math.min(15,parseInt(data.complete)||0));owned=coats.filter(c=>!c.price||data.owned?.includes(c.id)).map(c=>c.id);look=owned.includes(data.look)?data.look:'classic';if(friends[data.friend]?.at<=complete)equipped=data.friend}catch{}
function save(){try{localStorage.setItem(saveKey,JSON.stringify({complete,friend:equipped,owned,look}))}catch{}}
let index=0,bonus=0,powerUsed=false,guestPosition=null;
const guest=document.createElement('img');guest.className='friend';guest.hidden=true;
function level(){return Radura.level}
function goal(){return level().friend?'Trova '+friends[level().friend].name:'Al portale'}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(let i=0;i<36;i++){
  const cell=document.createElement('button');cell.className='cell';cell.dataset.index=i;
  cell.onclick=()=>play(i);cells.push(cell);$('board').append(cell);
}
$('board').append(guest,hero);
const outfitCache=new Map();
function outfitFrame(angle,frame){
  if(look==='classic')return sprites.get(angle*4+frame).src;
  if(!outfitCache.has(look)){
    const images=[];for(let a=0;a<4;a++)for(let f=0;f<4;f++){const im=new Image();im.src='assets/'+look+a+f+'.webp';images.push(im)}outfitCache.set(look,images);
  }
  return outfitCache.get(look)[Math.min(3,angle)*4+frame].src;
}
function orient(angle,frame,mirror=false){hero.src=outfitFrame(angle,frame);hero.style.setProperty('--turn',mirror?-1:1)}
function stand(i){
  const cell=cells[i];position=i;hero.style.width=cell.offsetWidth*1.09+'px';
  hero.style.setProperty('--x',cell.offsetLeft-cell.offsetWidth*.045+'px');hero.style.setProperty('--y',cell.offsetTop-cell.offsetWidth*.06+'px');
}
function choose(i){
  if(phase!=='ready'||spent.has(i))return;
  chosen=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
}
function buildPieces(){buttons.length=0;$('pieces').replaceChildren();for(const [i,shape] of level().shapes.entries()){
  const button=document.createElement('button'),pattern=document.createElement('span');
  button.className='piece';button.setAttribute('aria-label','Pezzo '+(i+1));pattern.className='shape';
  shape.forEach(([x,y])=>{const u=document.createElement('i');u.className='unit';u.style.gridArea=(y+1)+' / '+(x+1);u.style.backgroundImage=tile([1,2,4][i]);pattern.append(u)});
  button.append(pattern);button.style.touchAction='none';button.onclick=()=>choose(i);
  button.onpointerdown=e=>{
    if(drag||phase!=='ready'||spent.has(i)||breaking)return;
    choose(i);const r=$('board').getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,originX:e.clientX,originY:e.clientY,rect:r,slot:i,anchor:-1,request:0,active:false};
    button.setPointerCapture(e.pointerId);
  };
  button.onpointermove=e=>{
    if(drag?.id!==e.pointerId)return;drag.x=e.clientX;drag.y=e.clientY;
    if(!drag.active&&Math.hypot(drag.x-drag.originX,drag.y-drag.originY)<5)return;
    if(!drag.active){drag.active=true;const ghost=$('dragGhost');ghost.replaceChildren(pattern.cloneNode(true));ghost.style.setProperty('--unit',drag.rect.width/6+'px');ghost.hidden=false}
    if(!drag.request)drag.request=requestAnimationFrame(paintDrag);
  };
  button.onpointerup=e=>{
    if(drag?.id!==e.pointerId)return;const anchor=anchorAt(e.clientX,e.clientY,drag.rect);
    endDrag();if(anchor!==-1)play(anchor);
  };
  button.onlostpointercapture=button.onpointercancel=e=>{if(drag?.id===e.pointerId)endDrag()};
  buttons.push(button);$('pieces').append(button);
}
}
function anchorAt(x,y,r){
  if(x<r.left||x>=r.right||y<r.top||y>=r.bottom)return -1;
  return Math.floor((y-r.top)*6/r.height)*6+Math.floor((x-r.left)*6/r.width);
}
function endDrag(){
  if(drag?.request)cancelAnimationFrame(drag.request);drag=null;$('dragGhost').hidden=true;
  for(const c of cells)c.classList.remove('preview');
}
function paintDrag(){
  if(!drag)return;drag.request=0;const {x,y,rect,slot}=drag,k=anchorAt(x,y,rect);
  $('dragGhost').style.transform='translate3d('+(x-rect.width/12)+'px,'+(y-rect.height/12)+'px,0)';
  if(k===drag.anchor)return;drag.anchor=k;for(const c of cells)c.classList.remove('preview');
  for(const i of Radura.fit(board,slot,k)||[])cells[i].classList.add('preview');
}
function render(){
  cells.forEach((cell,i)=>{
    const visual=[index,board[i],i===level().exit].join('/');
    cell.classList.remove('suggest','route','preview');
    if(cell.dataset.visual===visual)return;
    cell.dataset.visual=visual;cell.className='cell';delete cell.dataset.tile;cell.style.backgroundImage='';
    if(board[i]){cell.dataset.tile=board[i];cell.style.backgroundImage=board[i]===6?'url(assets/rockTile.webp)':index>=10?'url(assets/starTile.webp)':index>=5?'url(assets/iceTile.webp)':tile(board[i])}
    if(i===level().exit)cell.classList.add('gate');
    cell.setAttribute('aria-label','Riga '+(Math.floor(i/6)+1)+', colonna '+(i%6+1)+', '+(board[i]?'occupata':i===level().exit?'portale':i===level().start?'Pip':i===level().friendCell?friends[level().friend].name:'libera'));
  });
  buttons.forEach((b,i)=>{b.disabled=spent.has(i)||phase!=='ready';b.setAttribute('aria-pressed',String(i===chosen))});
  $('counter').textContent='Livello '+(index+1)+' · '+(6+bonus-moves)+' mosse';
  $('support').dataset.active=equipped?'yes':'no';$('support').innerHTML=equipped?'<img src="assets/'+equipped+'.webp" alt="'+friends[equipped].name+'">':'♧';
  $('support').disabled=phase!=='ready';
  $('leave').disabled=phase==='moving'||phase==='walking';

}
function reset(){
  sequence++;endDrag();lastMove=null;breaking=false;bonus=0;powerUsed=false;guestPosition=level().friendCell??null;
  hero.classList.remove('enterPortal');guest.classList.remove('enterPortal');
  guest.hidden=!level().friend;if(level().friend){guest.src='assets/'+level().friend+'.webp';guest.alt=friends[level().friend].name;placeGuest(guestPosition)}
  $('stageTitle').textContent=level().title;
  board=level().initial.slice();chosen=0;moves=0;spent=new Set();phase='ready';
  hero.classList.remove('walking');orient(1,0);stand(level().start);render();
  $('pieces').hidden=false;$('again').hidden=true;$('hint').hidden=false;$('restart').hidden=false;
  $('message').textContent=level().friend?'Accompagna '+friends[level().friend].name+' al portale.':'';
}
async function play(i){
  if(phase!=='ready'||$('panel').open)return;
  if(breaking){
    if(!board[i])return;breaking=false;powerUsed=true;const serial=sequence;phase='moving';board=board.slice();board[i]=0;render();await resolveMove(serial);return;
  }
  const result=Radura.move(board,chosen,i);
  if(!result){$('message').textContent='Qui il pezzo non entra.';return}
  const serial=sequence;phase='moving';$('leave').disabled=true;lastMove={board:board.slice(),chosen,spent:new Set(spent),moves};spent.add(chosen);moves++;
  if(spent.size===3)spent.clear();
  for(const k of Radura.fit(board,chosen,i)){delete cells[k].dataset.visual;cells[k].dataset.tile=1;cells[k].style.backgroundImage=index>=10?'url(assets/starTile.webp)':index>=5?'url(assets/iceTile.webp)':tile([1,2,4][chosen])}
  board=result.next;
  for(const k of result.clear){cells[k].animate([{opacity:1},{opacity:.1}],{duration:180})}
  if(result.clear.size)await pause(160);if(sequence!==serial)return;
  chosen=buttons.findIndex((_,j)=>!spent.has(j));render();
  await resolveMove(serial);
}
async function resolveMove(serial){
  const route=Radura.path(board);
  if(!route.length){
    if(moves>=6+bonus||!buttons.some((_,j)=>!spent.has(j)&&board.some((_,k)=>Radura.fit(board,j,k)))){
      phase='lost';$('leave').disabled=false;$('again').textContent='Riprova';$('pieces').hidden=true;$('again').hidden=false;$('hint').hidden=true;$('restart').hidden=true;$('message').textContent='La strada è ancora chiusa.';
    }else{phase='ready';render();$('message').textContent=''}
    return;
  }
  phase='walking';$('message').textContent='';$('hint').hidden=true;
  hero.classList.add('walking');let facing=1;
  let together=false;
  for(const next of route.slice(1)){
    if(together)placeGuest(position);if(next===level().friendCell)together=true;
    const d=next-position,target=d===1?2:d===-1?6:d===-6?4:0;
    cells[next].classList.add('route');stand(next);
    for(let frame=0;frame<4;frame++){
      const delta=(target-facing+12)%8-4;facing=(facing+Math.sign(delta)+8)%8;
      orient(Math.min(facing,8-facing),frame,facing>4);await pause(65);if(sequence!==serial)return;
    }
  }
  hero.classList.add('enterPortal');
  if(together){placeGuest(level().exit);await pause(250);if(sequence!==serial)return;guest.classList.add('enterPortal')}
  await pause(350);if(sequence!==serial)return;
  complete=Math.max(complete,index+1);save();
  phase='ended';render();$('again').textContent='Torna al viaggio';orient(1,0);$('message').textContent=level().friend?friends[level().friend].name+' è nella collezione!':'Pip ha raggiunto il portale!';$('pieces').hidden=true;$('again').hidden=false;$('restart').hidden=true;
}

function placeGuest(i){
  guestPosition=i;const cell=cells[i];guest.style.width=cell.offsetWidth+'px';
  guest.style.left=cell.offsetLeft+'px';guest.style.top=cell.offsetTop+'px';
}
function findHint(){
  const anchors=Array.from({length:36},(_,i)=>i);
  // Prefer the authored solution when it still fits the actual position.
  const opening=level().solution[moves];
  if(opening&&board.every((v,i)=>v===level().initial[i])&&!spent.has(opening[0]))return opening;
  function search(state,used,depth){
    for(let slot=0;slot<3;slot++)if(!used.has(slot))for(const i of anchors){
      const m=Radura.move(state,slot,i);if(!m)continue;
      if(Radura.path(m.next).length)return [slot,i];
      if(depth>1){const next=new Set(used);next.add(slot);if(next.size===3)next.clear();if(search(m.next,next,depth-1))return [slot,i]}
    }
    return null;
  }
  for(let d=1;d<=Math.min(2,6+bonus-moves);d++){const result=search(board,spent,d);if(result)return result}
  return null;
}
$('hint').onclick=()=>{
  if(phase!=='ready')return;const move=findHint();
  if(!move){$('message').textContent='Prova a liberare una linea vicino al portale.';return}
  choose(move[0]);cells.forEach(c=>c.classList.remove('suggest'));cells[move[1]].classList.add('suggest');$('message').textContent='Tocca la casella illuminata.';
};
function enter(i){
  if(i>complete||!Radura.levels[i])return;
  index=i;document.body.dataset.look=look;$('stage').dataset.biome=i<5?'forest':i<10?'snow':'stars';Radura.select(i);$('home').hidden=true;$('stage').hidden=false;buildPieces();reset();
}
const anchors=[[30,94.9],[57,82.2],[78,75.9],[46,66.8],[57,53.4],[38,42.4],[62,36.8],[54,32.5],[33,29.25],[41,26.45],[49,19.65],[42.5,17.6],[55,14.85],[68,12.7],[56,10.6]];
function home(){
  sequence++;phase='home';endDrag();$('stage').hidden=true;$('home').hidden=false;tab('home');
}
function tab(name){
  $('home').dataset.tab=name;$('scrollMap').hidden=name!=='home';$('room').hidden=name==='home';
  const title=name==='home'?'Il viaggio di Pip':name==='mochi'?'Gli amici di Pip':'Il negozio';
  $('home').querySelector('h1').textContent=title;
  for(const [id,t] of [['album','mochi'],['shopTab','shop'],['homeTab','home']])$(id).setAttribute('aria-current',t===name?'page':'false');
  $('roomContent').replaceChildren();
  if(name==='shop'){shop();return}
  if(name==='mochi'){
    $('roomTitle').textContent=Object.values(friends).filter(f=>f.at<=complete).length+' di 4 amici salvati';
    friendCards($('roomContent'),false,()=>tab('mochi'));return;
  }
  $('trail').replaceChildren();const current=Math.min(14,complete);
  Radura.levels.forEach((l,i)=>{
    const btn=document.createElement('button');btn.className='stop';btn.textContent=i+1;btn.disabled=i>complete;
    btn.setAttribute('aria-label','Livello '+(i+1)+' · '+l.title);btn.style.left=anchors[i][0]+'%';btn.style.top=anchors[i][1]+'%';
    if(i===current){btn.classList.add('current');const pip=new Image();pip.src=outfitFrame(1,0);pip.alt='Pip';btn.append(pip)}
    btn.onclick=()=>enter(i);$('trail').append(btn);
  });
  requestAnimationFrame(()=>{if($('scrollMap').hidden)return;const map=$('scrollMap');map.scrollTop=$('trail').children[current].offsetTop-map.clientHeight*.63});
}
function shop(){
  $('roomTitle').textContent='Gemme del viaggio · '+balance();
  for(const coat of coats){
    const has=owned.includes(coat.id);const card=document.createElement('button');card.className='friendCard skin '+coat.id;
    card.disabled=coat.id===look||(!has&&balance()<coat.price);card.innerHTML='<img src="assets/walk10.webp" alt=""><span><strong>'+coat.name+'</strong><small>'+(coat.id===look?'In uso':has?'Indossa':coat.price+' gemme · Sblocca')+'</small></span>';
    card.style.setProperty('--portrait','url(assets/portrait-'+coat.id+'.webp)');card.style.setProperty('--tag','url(assets/tag-'+coat.id+'.webp)');
    card.setAttribute('aria-label',coat.name+' · '+(coat.id===look?'in uso':has?'indossa':coat.price+' gemme'));
    card.onclick=()=>{if(!has){if(balance()<coat.price)return;owned.push(coat.id)}look=coat.id;document.body.dataset.look=look;save();tab('shop')};$('roomContent').append(card);
  }
  $('roomTitle').title='Una gemma per ogni nuovo livello completato.';
}
function dialog(title){
  $('panelTitle').textContent=title;$('panelBody').replaceChildren();$('panelActions').replaceChildren();if(!$('panel').open)$('panel').showModal();
}
function action(label,fn){const btn=document.createElement('button');btn.className='wood';btn.textContent=label;btn.onclick=fn;$('panelActions').append(btn)}
function closePanel(){$('panel').close()}
function collection(inLevel){
  dialog(inLevel?'Amico di squadra':'Gli amici di Pip');
  friendCards($('panelBody'),inLevel,()=>collection(inLevel));
  abilityActions(inLevel);action('Chiudi',closePanel);
}
function friendCards(container,inLevel,refresh){
  for(const [id,f] of Object.entries(friends).sort((a,b)=>a[1].at-b[1].at)){
    const locked=f.at>complete,card=document.createElement('button');card.className='friendCard';card.disabled=locked||(inLevel&&powerUsed);
    card.setAttribute('aria-pressed',String(id===equipped));card.innerHTML='<img src="assets/'+id+'.webp" alt=""><span><strong>'+f.name+(locked?' 🔒':id===equipped?' ✓':'')+'</strong><small>'+(locked?'Da salvare al livello '+f.at:f.ability+' · '+f.description)+'</small></span>';
    if(!inLevel){card.classList.add('portraitCard');card.style.backgroundImage='url(assets/card-'+id+'.webp)';card.dataset.status=locked?'🔒 '+f.at:id===equipped?'✓':'';card.setAttribute('aria-label',f.name+' · '+(locked?'bloccato fino al livello '+f.at:f.description))}
    card.onclick=()=>{if(!inLevel){dialog(f.name);$('panelBody').textContent=f.ability+' · '+f.description;action(id===equipped?'In squadra':'Scegli',()=>{equipped=id;save();closePanel();refresh()});action('Chiudi',closePanel);return}equipped=id;save();if(inLevel)render();refresh()};container.append(card);
  }
}
function abilityActions(inLevel){
  if(inLevel&&equipped&&!powerUsed){
    const usable=equipped==='neve'?!!lastMove:equipped==='luma'?spent.size>0:true;
    if(usable)action('Usa '+friends[equipped].ability,()=>{if(phase!=='ready'||powerUsed)return;if(equipped==='bruma'){breaking=true;closePanel();$('message').textContent='Tocca il blocco da spezzare.';return}powerUsed=true;if(equipped==='mochi')bonus++;else if(equipped==='neve'){board=lastMove.board;spent=lastMove.spent;moves=lastMove.moves;chosen=lastMove.chosen;lastMove=null}else spent.clear();render();closePanel();$('message').textContent=equipped==='mochi'?'Mochi ti regala una mossa.':equipped==='neve'?'Neve ha recuperato la mossa.':'Luma ha recuperato i pezzi.'});
    else{const p=document.createElement('p');p.textContent='Disponibile dopo aver posato un pezzo.';$('panelBody').append(p)}
  }else if(inLevel&&powerUsed){const p=document.createElement('p');p.textContent='Aiuto già usato in questo tentativo.';$('panelBody').append(p)}
}
$('album').onclick=()=>tab('mochi');$('homeTab').onclick=()=>tab('home');$('shopTab').onclick=()=>tab('shop');$('support').onclick=()=>{if(phase==='ready'){breaking=false;collection(true)}};
$('leave').onclick=()=>{if(phase==='ended'||phase==='lost'){home();return}if(phase!=='ready')return;dialog('Abbandonare il livello?');$('panelBody').textContent='Tornerai al viaggio. Gli amici già salvati resteranno con te.';action('Continua a giocare',closePanel);action('Esci',()=>{closePanel();home()})};
$('again').onclick=()=>phase==='ended'?home():reset();$('restart').onclick=reset;
new ResizeObserver(()=>{if(!$('stage').hidden&&Number.isInteger(position)){stand(position);if(guestPosition!=null)placeGuest(guestPosition)}}).observe($('board'));
function handleBack(){
  if($('panel').open){closePanel();return true}
  if(phase==='home'){if($('home').dataset.tab==='home')return false;tab('home');return true}
  if(phase==='ready')$('leave').click();
  else if(phase==='ended'||phase==='lost')home();
  return true;
}
document.body.dataset.look=look;home();
