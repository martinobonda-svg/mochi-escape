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
  mochi:{name:'Mochi',ability:'Un passo in più',description:'Aggiunge una mossa al tentativo.',at:2},
  luma:{name:'Luma',ability:'Seconda luce',description:'Rende disponibili i pezzi già usati.',at:4}
};
const saveKey='radura-viaggio-1';
let complete=0,equipped=null;
try{const data=JSON.parse(localStorage.getItem(saveKey)||'{}');complete=Math.max(0,Math.min(5,parseInt(data.complete)||0));if(friends[data.friend]?.at<=complete)equipped=data.friend}catch{}
function save(){try{localStorage.setItem(saveKey,JSON.stringify({complete,friend:equipped}))}catch{}}
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
function orient(angle,frame,mirror=false){hero.src=sprites.get(angle*4+frame).src;hero.style.transform=mirror?'scaleX(-1)':''}
function stand(i){
  const cell=cells[i];position=i;hero.style.width=cell.offsetWidth*1.09+'px';
  hero.style.left=cell.offsetLeft-cell.offsetWidth*.045+'px';hero.style.top=cell.offsetTop-cell.offsetWidth*.06+'px';
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
  button.onpointerdown=e=>{if(drag||phase!=='ready'||spent.has(i))return;choose(i);drag={id:e.pointerId};button.setPointerCapture(e.pointerId)};
  button.onpointerup=e=>{if(drag?.id!==e.pointerId)return;drag=null;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell');if(target)play(Number(target.dataset.index))};
  button.onlostpointercapture=button.onpointercancel=e=>{if(drag?.id===e.pointerId)drag=null};
  buttons.push(button);$('pieces').append(button);
}
}
function render(){
  cells.forEach((cell,i)=>{cell.className='cell';delete cell.dataset.tile;cell.style.backgroundImage='';
    if(board[i]){cell.dataset.tile=board[i];cell.style.backgroundImage=tile(board[i])}
    if(i===level().exit)cell.classList.add('gate');
    cell.setAttribute('aria-label','Riga '+(Math.floor(i/6)+1)+', colonna '+(i%6+1)+', '+(board[i]?'occupata':i===level().exit?'portale':i===level().start?'Pip':i===level().friendCell?friends[level().friend].name:'libera'));
  });
  buttons.forEach((b,i)=>{b.disabled=spent.has(i)||phase!=='ready';b.setAttribute('aria-pressed',String(i===chosen))});
  $('counter').textContent='Livello '+(index+1)+' · '+(6+bonus-moves)+' mosse';
  $('support').innerHTML=equipped?'<img src="assets/'+equipped+'.webp" alt="'+friends[equipped].name+'">':'♧';
  $('support').disabled=phase!=='ready';

}
function reset(){
  sequence++;drag=null;bonus=0;powerUsed=false;guestPosition=level().friendCell??null;
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
  const result=Radura.move(board,chosen,i);
  if(!result){$('message').textContent='Qui il pezzo non entra.';return}
  const serial=sequence;phase='moving';leave.disabled=true;spent.add(chosen);moves++;
  if(spent.size===3)spent.clear();
  const old=board;board=result.next;
  for(const k of result.clear){if(old[k])cells[k].animate([{opacity:1},{opacity:.1}],{duration:180})}
  await pause(185);if(sequence!==serial)return;
  chosen=buttons.findIndex((_,j)=>!spent.has(j));render();
  const route=Radura.path(board);
  if(!route.length){
    if(moves>=6+bonus||!buttons.some((_,j)=>!spent.has(j)&&board.some((_,k)=>Radura.fit(board,j,k)))){
      phase='lost';$('again').textContent='Riprova';$('pieces').hidden=true;$('again').hidden=false;$('hint').hidden=true;$('restart').hidden=true;$('message').textContent='La strada è ancora chiusa.';
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
  index=i;Radura.select(i);$('home').hidden=true;$('stage').hidden=false;buildPieces();reset();
}
function home(){
  sequence++;phase='home';drag=null;$('stage').hidden=true;$('home').hidden=false;
  $('trail').replaceChildren();$('tally').textContent=Object.values(friends).filter(f=>f.at<=complete).length+' / 2';
  const points=[[29,86],[58,69],[83,58],[43,42],[59,19]];
  Radura.levels.forEach((l,i)=>{
    const btn=document.createElement('button');btn.className='stop';btn.textContent=i+1;btn.disabled=i>complete;
    btn.setAttribute('aria-label','Livello '+(i+1)+' · '+l.title);btn.style.left=points[i][0]+'%';btn.style.top=points[i][1]+'%';
    if(i===Math.min(4,complete)){btn.classList.add('current');const pip=new Image();pip.src='assets/walk10.webp';pip.alt='Pip';btn.append(pip)}
    btn.onclick=()=>enter(i);$('trail').append(btn);
  });
}
function dialog(title){
  $('panelTitle').textContent=title;$('panelBody').replaceChildren();$('panelActions').replaceChildren();if(!$('panel').open)$('panel').showModal();
}
function action(label,fn){const btn=document.createElement('button');btn.className='wood';btn.textContent=label;btn.onclick=fn;$('panelActions').append(btn)}
function closePanel(){$('panel').close()}
function collection(inLevel){
  dialog(inLevel?'Amico di squadra':'Gli amici di Pip');
  for(const [id,f] of Object.entries(friends)){
    const locked=f.at>complete,card=document.createElement('button');card.className='friendCard';card.disabled=locked||(inLevel&&powerUsed);
    card.setAttribute('aria-pressed',String(id===equipped));card.innerHTML='<img src="assets/'+id+'.webp" alt=""><span><strong>'+f.name+(locked?' 🔒':id===equipped?' ✓':'')+'</strong><small>'+(locked?'Da salvare al livello '+f.at:f.ability+' · '+f.description)+'</small></span>';
    card.onclick=()=>{equipped=id;save();if(inLevel)render();collection(inLevel)};$('panelBody').append(card);
  }
  if(inLevel&&equipped&&!powerUsed){
    const usable=equipped==='mochi'||spent.size>0;
    if(usable)action('Usa '+friends[equipped].ability,()=>{if(phase!=='ready'||powerUsed)return;powerUsed=true;if(equipped==='mochi')bonus++;else spent.clear();render();closePanel();$('message').textContent=equipped==='mochi'?'Mochi ti regala una mossa.':'Luma ha recuperato i pezzi.'});
    else{const p=document.createElement('p');p.textContent='Potrai usare Luma dopo aver posato un pezzo.';$('panelBody').append(p)}
  }else if(inLevel&&powerUsed){const p=document.createElement('p');p.textContent='Aiuto già usato in questo tentativo.';$('panelBody').append(p)}
  action('Chiudi',closePanel);
}
$('album').onclick=()=>collection(false);$('support').onclick=()=>{if(phase==='ready')collection(true)};
$('leave').onclick=()=>{if(phase==='ended'||phase==='lost'){home();return}if(phase!=='ready')return;dialog('Abbandonare il livello?');$('panelBody').textContent='Tornerai al viaggio. Gli amici già salvati resteranno con te.';action('Continua a giocare',closePanel);action('Esci',()=>{closePanel();home()})};
$('again').onclick=()=>phase==='ended'?home():reset();$('restart').onclick=reset;
new ResizeObserver(()=>{if(!$('stage').hidden&&Number.isInteger(position)){stand(position);if(guestPosition!=null)placeGuest(guestPosition)}}).observe($('board'));
home();

