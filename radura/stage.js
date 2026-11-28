'use strict';
const $=id=>document.getElementById(id);
function paintTile(el,n){
 const palettes=[['#4e93bb','#dcb451','#9480b4','#d58da0','#86aa64'],['#74a6c3','#a4bccc','#90a4c3','#a4b4ce','#79abb7'],['#8678b8','#aa87b9','#776bab','#948ac2','#ad8cae']];
 el.style.setProperty('--pigment',n>=6?['#737381','#9bd1e6','#b7dceb','#987754','#9f84c8'][n-6]:palettes[level().biome][n-1]);el.dataset.mark=n;
}
const cells=[],buttons=[],sprites=new Map();
const hero=document.createElement('img');hero.id='pip';hero.alt='Runa';
for(let angle=0;angle<5;angle++)for(let pose=0;pose<4;pose++){
  const img=new Image();img.src='assets/walk'+angle+pose+'.webp';sprites.set(angle*4+pose,img);
}
let board,chosen,moves,spent,phase,position,drag,sequence=0;
const friends={
  mochi:{name:'Timo',ability:'Un passo in più',description:'Aggiunge una mossa al tentativo.',at:2},
  luma:{name:'Oria',ability:'Seconda luce',description:'Rende disponibili i pezzi già usati.',at:4},
  neve:{name:'Nives',ability:'Passi leggeri',description:'Riporta il tavoliere a prima dell’ultima mossa.',at:7},
  bruma:{name:'Brugo',ability:'Soffio di drago',description:'Spezza un blocco a tua scelta, anche di pietra.',at:13},
  lumi:{name:'Lumi',ability:'Stella cucita',description:'Regala una mossa e chiede un indizio sul tavoliere.',at:20},
  talpa:{name:'Dodo',ability:'Piccola galleria',description:'Scava attraverso due blocchi affiancati, da sinistra a destra.',at:35},
  riccio:{name:'Ago',ability:'Spine di rovo',description:'Libera tutte le radici della riga che tocchi.',at:50},
  lontra:{name:'Riva',ability:'Onda gentile',description:'Ripristina tutti i pezzi e aggiunge una mossa.',at:65}
};
let albumPage=0;
const saveKey='radura-viaggio-1';
let complete=0,equipped=null,owned=['classic'],look='classic',hat='none',neck='none',lastMove=null,breaking=false;
const coats=[{id:'classic',name:'Runa',price:0},{id:'honey',name:'Miele',price:2},{id:'moon',name:'Lunare',price:4}];
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
}complete=Math.max(0,Math.min(Radura.levels.length,parseInt(data.complete)||0));owned=coats.filter(c=>!c.price||data.owned?.includes(c.id)).map(c=>c.id);({look,hat,neck}=Wardrobe.restore(data));if(friends[data.friend]?.at<=complete)equipped=data.friend}catch{}
function save(){try{localStorage.setItem(saveKey,JSON.stringify({complete,friend:equipped,owned,look,hat,neck}))}catch{}}
let journeyFrom=null;
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
function outfitFrame(angle,gait){return Wardrobe.frame({look,hat,neck},angle,gait)}
function orient(angle,frame,mirror=false){hero.src=outfitFrame(angle,frame);hero.style.setProperty('--turn',mirror?-1:1)}
function stand(i){
  const cell=cells[i];position=i;hero.style.width=cell.offsetWidth*1.09+'px';
  hero.style.setProperty('--x',cell.offsetLeft-cell.offsetWidth*.045+'px');hero.style.setProperty('--y',cell.offsetTop-cell.offsetWidth*.06+'px');
}
function choose(i){
  if(phase!=='ready'||spent.has(i))return;
  if(chosen!==i)Feedback.play('select');chosen=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
}
function buildPieces(){buttons.length=0;$('pieces').replaceChildren();for(const [i,shape] of level().shapes.entries()){
  const button=document.createElement('button'),pattern=document.createElement('span');
  button.className='piece';button.setAttribute('aria-label','Pezzo '+(i+1));pattern.className='shape';
  shape.forEach(([x,y])=>{const u=document.createElement('i');u.className='unit';u.style.gridArea=(y+1)+' / '+(x+1);paintTile(u,[1,2,4][i]);pattern.append(u)});
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
    cell.dataset.visual=visual;cell.className='cell';delete cell.dataset.tile;delete cell.dataset.mark;
    cell.classList.toggle('void',board[i]===-1);cell.disabled=board[i]===-1;if(board[i]>0){cell.dataset.tile=board[i];paintTile(cell,board[i])}
    if(i===level().exit)cell.classList.add('gate');
    cell.setAttribute('aria-label','Riga '+(Math.floor(i/6)+1)+', colonna '+(i%6+1)+', '+(board[i]===-1?'fuori dal sentiero':board[i]>=6?['roccia','ghiaccio doppio','ghiaccio incrinato','radici','stelle gemelle'][board[i]-6]:board[i]?'occupata':i===level().exit?'portale':i===level().start?'Runa':i===level().friendCell?friends[level().friend].name:'libera'));
  });
  buttons.forEach((b,i)=>{b.disabled=spent.has(i)||phase!=='ready';b.setAttribute('aria-pressed',String(i===chosen))});
  $('counter').textContent='Livello '+(index+1)+' · '+(6+bonus-moves)+' mosse';
  $('support').dataset.active=equipped?'yes':'no';$('support').innerHTML=equipped?'<img src="assets/'+equipped+'.webp" alt="'+friends[equipped].name+'">':'♧';
  $('support').disabled=phase!=='ready';
  $('leave').disabled=phase==='moving'||phase==='walking';

}
function reset(){
  sequence++;endDrag();cells.forEach(c=>c.classList.remove('arriving'));lastMove=null;breaking=false;bonus=0;powerUsed=false;guestPosition=level().friendCell??null;
  hero.classList.remove('enterPortal');guest.classList.remove('enterPortal');
  guest.hidden=!level().friend;if(level().friend){guest.src='assets/'+level().friend+'.webp';guest.alt=friends[level().friend].name;placeGuest(guestPosition)}
  $('stageTitle').textContent=level().title;
  board=level().initial.slice();chosen=0;moves=0;spent=new Set();phase='ready';
  hero.classList.remove('walking');orient(1,0);stand(level().start);render();
  $('pieces').hidden=false;$('again').hidden=true;$('hint').hidden=false;$('restart').hidden=false;
  $('message').textContent=level().friend?'Accompagna '+friends[level().friend].name+' al portale.':index===0?'Posa il pezzo singolo e completa la riga per aprire il sentiero.':index===15?'Libera una linea accanto alle radici per scioglierle.':index===35?'Completa due linee sul ghiaccio per romperlo.':index===55?'Libera una stella gemella per accenderle tutte.':'';
}
async function play(i){
  if(phase!=='ready'||$('panel').open)return;
  if(breaking){
    const targets=powerTargets(equipped,board,i);
    if(!targets.length)return;
    const nextBoard=board.slice();for(const target of targets)nextBoard[target]=0;
    if(moves===0&&Radura.path(nextBoard).length){breaking=false;$('message').textContent='Questo aiuto aprirebbe il portale. Gioca prima un pezzo.';return}
    breaking=false;powerUsed=true;const serial=sequence;phase='moving';render();
    await CompanionMagic.cast(equipped,targets.map(k=>cells[k]));if(serial!==sequence)return;
    board=nextBoard;

    Feedback.play('clear');StoryArt.clear(cells,targets);render();await resolveMove(serial);return;
  }
  const result=Radura.move(board,chosen,i);
  if(!result){Feedback.play('invalid');$('message').textContent='Qui il pezzo non entra.';return}
  const serial=sequence;phase='moving';$('leave').disabled=true;lastMove={board:board.slice(),chosen,spent:new Set(spent),moves};spent.add(chosen);moves++;
  if(spent.size===3)spent.clear();
  for(const k of Radura.fit(board,chosen,i)){delete cells[k].dataset.visual;cells[k].dataset.tile=1;paintTile(cells[k],[1,2,4][chosen])}
  Feedback.play(result.clear.size?'clear':'place');
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){for(const k of Radura.fit(board,chosen,i))if(!result.clear.has(k))cells[k].animate([{transform:'scale(.82)'},{transform:'scale(1.04)',offset:.65},{transform:'scale(1)'}],{duration:200})}
  StoryArt.clear(cells,result.clear);
  board=result.next;
  for(const k of result.clear){cells[k].animate([{opacity:1},{opacity:.1}],{duration:180})}
  if(result.clear.size)await pause(160);if(sequence!==serial)return;
  chosen=buttons.findIndex((_,j)=>!spent.has(j));render();
  await resolveMove(serial);
}
async function resolveMove(serial){
  const route=Radura.path(board);
  if(moves===0||!route.length){
    if(moves>=6+bonus||!buttons.some((_,j)=>!spent.has(j)&&board.some((_,k)=>Radura.fit(board,j,k)))){
      Feedback.play('lost');phase='lost';$('leave').disabled=false;$('again').textContent='Riprova';$('pieces').hidden=true;$('again').hidden=false;$('hint').hidden=true;$('restart').hidden=true;$('message').textContent='La strada è ancora chiusa.';dialog('Sentiero chiuso');$('panelBody').textContent=moves>=6+bonus?'Hai esaurito le mosse.':'Nessun pezzo disponibile entra nel tavoliere.';action('Al viaggio',()=>{closePanel();home()});action('Riprova',()=>{closePanel();reset()});
    }else{phase='ready';render();$('message').textContent=''}
    return;
  }
  phase='walking';$('message').textContent='';$('hint').hidden=true;
  hero.classList.add('walking');let facing=1;
  let together=false;
  for(const next of route.slice(1)){
    if(together)placeGuest(position);if(next===level().friendCell)together=true;
    const d=next-position,target=d===1?2:d===-1?6:d===-6?4:0;
    while(facing!==target){
      const delta=(target-facing+12)%8-4;facing=(facing+Math.sign(delta)*.5+8)%8;
      orient(Math.min(facing,8-facing),0,facing>4);await pause(42);if(sequence!==serial)return;
    }
    cells[next].classList.add('route');stand(next);
    for(let frame=0;frame<4;frame++){
      orient(Math.min(facing,8-facing),frame,facing>4);await pause(65);if(sequence!==serial)return;
    }
  }
  cells[level().exit].classList.add('arriving');hero.classList.add('enterPortal');
  if(together){placeGuest(level().exit);await pause(250);if(sequence!==serial)return;guest.classList.add('enterPortal')}
  await pause(350);if(sequence!==serial)return;
  const earned=complete===index;if(earned)journeyFrom=index;complete=Math.max(complete,index+1);save();
  Feedback.play('win');phase='ended';render();$('again').textContent='Torna al viaggio';$('message').textContent=level().friend?friends[level().friend].name+' è nella collezione!':'Runa ha raggiunto il portale!';$('pieces').hidden=true;$('again').hidden=false;$('restart').hidden=true;
  dialog(index===Radura.levels.length-1?'Il viaggio è completo!':level().friend?friends[level().friend].name+' è al sicuro!':'Portale raggiunto!');
  const portrait=new Image();portrait.src=level().friend?'assets/'+level().friend+'.webp':outfitFrame(1,0);portrait.alt='';
  const recap=document.createElement('p');recap.textContent='Percorso aperto in '+moves+(moves===1?' mossa.':' mosse.')+(earned?' Hai raccolto una gemma.':'');$('panelBody').append(portrait,recap);
  action('Al viaggio',()=>{closePanel();home()});if(index<Radura.levels.length-1)action('Livello '+(index+2),()=>{closePanel();enter(index+1)});
}

function placeGuest(i){
  guestPosition=i;const cell=cells[i];guest.style.width=cell.offsetWidth+'px';
  guest.style.left=cell.offsetLeft+'px';guest.style.top=cell.offsetTop+'px';
}
function findHint(){
  const scripted=Radura.authoredHint(board,spent);if(scripted)return scripted;
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
  index=i;Radura.select(i);document.body.dataset.look=look;$('stage').dataset.biome=['forest','snow','stars'][level().biome];$('stage').dataset.region=Archipelago.at(i);$('stage').classList.toggle('irregular',level().initial.includes(-1));$('home').hidden=true;$('stage').hidden=false;buildPieces();Voyage.stage();reset();
}
function home(){
  sequence++;phase='home';endDrag();$('stage').hidden=true;$('home').hidden=false;tab('home');
}
function tab(name){
  $('home').dataset.tab=name;$('scrollMap').hidden=name!=='home';$('room').hidden=name==='home';
  const title=name==='home'?'Mochi Escape':name==='mochi'?'Gli amici di Runa':name==='shop'?'Il bazar del viaggio':'La sartoria di Runa';
  $('home').querySelector('h1').textContent=title;
  for(const [id,t] of [['album','mochi'],['shopTab','shop'],['tailorTab','tailor'],['homeTab','home']])$(id).setAttribute('aria-current',t===name?'page':'false');
  $('roomContent').replaceChildren();
  if(name==='tailor'){tailor();return}
  if(name==='shop'){emporium();return}
  if(name==='mochi'){
    $('roomTitle').textContent=Object.values(friends).filter(f=>f.at<=complete).length+' di '+Object.keys(friends).length+' amici salvati';
    friendCards($('roomContent'),false,()=>tab('mochi'));return;
  }
  $('trail').replaceChildren();const current=Math.min(Radura.levels.length-1,complete);
  Radura.levels.forEach((l,i)=>{
    const btn=document.createElement('button');btn.className='stop';btn.textContent=i+1;btn.disabled=i>complete;
    btn.setAttribute('aria-label','Livello '+(i+1)+' · '+l.title);
    if(i<complete)btn.classList.add('cleared');if(Radura.levels[i+1]?.region!==l.region)btn.classList.add('crossing');
    if(i===current){btn.classList.add('current');const pip=new Image();pip.src=outfitFrame(1,0);pip.alt='Runa';btn.append(pip)}
    btn.onclick=()=>enter(i);$('trail').append(btn);
  });
  Archipelago.map();requestAnimationFrame(()=>{if($('scrollMap').hidden)return;const map=$('scrollMap');const stops=$('trail').querySelectorAll('.stop'),offset=i=>stops[i].offsetTop-map.clientHeight*.63;map.scrollTop=offset(journeyFrom??current);if(journeyFrom!==null){Archipelago.advance(stops[journeyFrom],stops[current],outfitFrame);journeyFrom=null;map.scrollTo({top:offset(current),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})}});
}
function emporium(){
  $('roomTitle').textContent='Il bazar del viaggio';
  const scene=document.createElement('article');scene.className='emporium';
  scene.innerHTML='<div class="emporium-note"><h3>Apertura prossima</h3><p>Qui arriveranno gli articoli da acquistare. Puoi già provare tutti i costumi in sartoria.</p><button class="wood" type="button">Apri la sartoria</button></div>';
  scene.querySelector('button').onclick=()=>tab('tailor');$('roomContent').append(scene);
}
function tailor(){
  Wardrobe.show($('roomContent'),$('roomTitle'),{look,hat,neck},outfit=>{({look,hat,neck}=outfit);document.body.dataset.look=look;save()});
}
function dialog(title){
  $('panel').classList.remove('friendFolio');
  $('panelTitle').textContent=title;$('panelBody').replaceChildren();$('panelActions').replaceChildren();if(!$('panel').open)$('panel').showModal();
}
function action(label,fn){const btn=document.createElement('button');btn.className='wood';btn.textContent=label;btn.onclick=fn;$('panelActions').append(btn)}
function closePanel(){$('panel').close()}
function collection(inLevel){
  dialog(inLevel?'Amico di squadra':'Gli amici di Runa');
  friendCards($('panelBody'),inLevel,()=>collection(inLevel));
  abilityActions(inLevel);action('Chiudi',closePanel);
}
function friendCards(container,inLevel,refresh){
  const cast=Object.entries(friends).sort((a,b)=>a[1].at-b[1].at);
  const perPage=4,count=Math.ceil(cast.length/perPage);
  const list=document.createElement('div');list.className=inLevel?'supportList':'bookSpread';container.append(list);
  const visible=inLevel?cast:cast.slice(albumPage*perPage,(albumPage+1)*perPage);
  for(const [id,f] of visible){
    const locked=f.at>complete,card=document.createElement('button');
    card.className=inLevel?'friendCard':'friendCard portraitCard';
    card.disabled=inLevel&&(locked||powerUsed);
    card.setAttribute('aria-pressed',String(id===equipped));card.dataset.locked=String(locked);
    card.innerHTML='<img src="assets/'+id+'.webp" alt=""><span><strong>'+f.name+'</strong><small>'+(locked?'Livello '+f.at:id===equipped?'In squadra':f.ability)+'</small></span>';
    card.setAttribute('aria-label',f.name+' · '+(locked?'Da salvare al livello '+f.at:f.ability));
    card.onclick=()=>{
      if(inLevel){equipped=id;save();render();refresh();return}
      dialog(f.name);
      $('panel').classList.add('friendFolio');
      const portrait=new Image();portrait.src='assets/'+id+'.webp';portrait.alt='';
      const plate=document.createElement('div');plate.className='folioPortrait';plate.append(portrait);
      const ability=document.createElement('section');ability.className='folioAbility';
      const abilityName=document.createElement('strong');abilityName.textContent=f.ability;
      const abilityText=document.createElement('p');abilityText.textContent=f.description;
      const state=document.createElement('p');state.className='folioStatus';
      state.textContent=locked?'Da salvare al livello '+f.at:id===equipped?'In squadra con Runa':'Amico salvato';
      ability.append(abilityName,abilityText,state);
      $('panelBody').append(plate,ability);
      if(!locked&&id!==equipped)action('In squadra con Runa',()=>{equipped=id;save();closePanel();refresh()});
      action('Chiudi',closePanel);
    };
    list.append(card);
  }
  if(inLevel)return;
  const nav=document.createElement('nav');nav.className='bookTabs';nav.setAttribute('aria-label','Capitoli degli amici');
  for(let i=0;i<count;i++){
    const btn=document.createElement('button');btn.textContent=['Il primo viaggio','Lumi e gli amici'][i]||'Capitolo '+(i+1);
    btn.setAttribute('aria-pressed',String(albumPage===i));btn.onclick=()=>{albumPage=i;refresh()};nav.append(btn);
  }
  container.prepend(nav);
}
function powerTargets(id,state,cell){
  const row=Math.floor(cell/6)*6;
  if(id==='riccio')return Array.from({length:6},(_,j)=>row+j).filter(i=>state[i]===9);
  if(state[cell]<=0)return [];
  if(id==='talpa'&&cell%6<5&&state[cell+1]>0)return [cell,cell+1];
  return [cell];
}
function abilityActions(inLevel){
  if(!inLevel||!equipped)return;
  if(powerUsed){const note=document.createElement('p');note.textContent='Aiuto già usato in questo tentativo.';$('panelBody').append(note);return}
  const usable=equipped==='neve'?!!lastMove:equipped==='luma'?spent.size>0:equipped==='riccio'?board.includes(9):true;
  const f=friends[equipped];
  const detail=document.createElement('p');detail.textContent=usable?f.description:equipped==='riccio'?'Disponibile sui tavolieri con radici.':'Disponibile dopo aver posato un pezzo.';$('panelBody').append(detail);
  if(!usable)return;
  action('Usa '+f.ability,async()=>{
    if(phase!=='ready'||powerUsed)return;
    if(['bruma','talpa','riccio'].includes(equipped)){
      breaking=true;closePanel();$('message').textContent=equipped==='riccio'?'Tocca una riga con radici.':equipped==='talpa'?'Tocca il primo blocco della galleria.':'Tocca il blocco da spezzare.';return;
    }
    powerUsed=true;const serial=sequence;const id=equipped;phase='moving';closePanel();render();
    const target=id==='neve'?cells[level().start]:['luma','lontra'].includes(id)?buttons[0]:id==='lumi'?cells[position]:$('counter');
    await CompanionMagic.cast(id,['luma','lontra'].includes(id)?buttons:[target]);if(serial!==sequence)return;phase='ready';
    if(['mochi','lumi','lontra'].includes(equipped))bonus++;
    if(['luma','lontra'].includes(equipped))spent.clear();
    if(equipped==='neve'){board=lastMove.board;spent=lastMove.spent;moves=lastMove.moves;chosen=lastMove.chosen;lastMove=null}
    render();closePanel();$('message').textContent=f.name+' · '+f.ability;
    if(equipped==='lumi')$('hint').click();
  });
}
$('album').onclick=()=>tab('mochi');$('homeTab').onclick=()=>tab('home');$('tailorTab').onclick=()=>tab('tailor');$('shopTab').onclick=()=>tab('shop');$('support').onclick=()=>{if(phase==='ready'){breaking=false;collection(true)}};
$('leave').onclick=()=>{if(phase==='ended'||phase==='lost'){home();return}if(phase!=='ready')return;dialog('Abbandonare il livello?');$('panelBody').textContent='Tornerai al viaggio. Gli amici già salvati resteranno con te.';action('Continua a giocare',closePanel);action('Esci',()=>{closePanel();home()})};
$('again').onclick=()=>phase==='ended'?home():reset();$('restart').onclick=()=>{if(phase!=='ready')return;dialog('Ricominciare il livello?');$('panelBody').textContent='Ripartirai dalla prima mossa.';action('Continua',closePanel);action('Riprova',()=>{closePanel();reset()})};
new ResizeObserver(()=>{if(!$('scrollMap').hidden&&!$('home').hidden)Archipelago.map()}).observe($('trail'));
new ResizeObserver(()=>{if(!$('stage').hidden)Voyage.stage()}).observe($('stage'));
new ResizeObserver(()=>{if(!$('stage').hidden&&Number.isInteger(position)){stand(position);if(guestPosition!=null)placeGuest(guestPosition)}}).observe($('board'));
function handleBack(){
  if($('panel').open){closePanel();return true}
  if(phase==='home'){if($('home').dataset.tab==='home')return false;tab('home');return true}
  if(phase==='ready')$('leave').click();
  else if(phase==='ended'||phase==='lost')home();
  return true;
}
$('chapter').onclick=Archipelago.guide;
$('preferences').onclick=Feedback.options;
document.body.dataset.look=look;home();
