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
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(let i=0;i<36;i++){
  const cell=document.createElement('button');cell.className='cell';cell.dataset.index=i;
  cell.onclick=()=>play(i);cells.push(cell);$('board').append(cell);
}
$('board').append(hero);
function orient(angle,frame,mirror=false){hero.src=sprites.get(angle*4+frame).src;hero.style.transform=mirror?'scaleX(-1)':''}
function stand(i){
  const cell=cells[i];position=i;hero.style.width=cell.offsetWidth*1.09+'px';
  hero.style.left=cell.offsetLeft-cell.offsetWidth*.045+'px';hero.style.top=cell.offsetTop-cell.offsetWidth*.06+'px';
}
function choose(i){
  if(phase!=='ready'||spent.has(i))return;
  chosen=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
}
for(const [i,shape] of Radura.shapes.entries()){
  const button=document.createElement('button'),pattern=document.createElement('span');
  button.className='piece';button.setAttribute('aria-label','Pezzo '+(i+1));pattern.className='shape';
  shape.forEach(([x,y])=>{const u=document.createElement('i');u.className='unit';u.style.gridArea=(y+1)+' / '+(x+1);u.style.backgroundImage=tile([1,2,4][i]);pattern.append(u)});
  button.append(pattern);button.style.touchAction='none';button.onclick=()=>choose(i);
  button.onpointerdown=e=>{if(drag||phase!=='ready'||spent.has(i))return;choose(i);drag={id:e.pointerId};button.setPointerCapture(e.pointerId)};
  button.onpointerup=e=>{if(drag?.id!==e.pointerId)return;drag=null;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell');if(target)play(Number(target.dataset.index))};
  button.onlostpointercapture=button.onpointercancel=e=>{if(drag?.id===e.pointerId)drag=null};
  buttons.push(button);$('pieces').append(button);
}
function render(){
  cells.forEach((cell,i)=>{cell.className='cell';delete cell.dataset.tile;cell.style.backgroundImage='';
    if(board[i]){cell.dataset.tile=board[i];cell.style.backgroundImage=tile(board[i])}
    if(i===Radura.exit)cell.classList.add('gate');
    cell.setAttribute('aria-label','Riga '+(Math.floor(i/6)+1)+', colonna '+(i%6+1)+', '+(board[i]?'occupata':i===Radura.exit?'portale':i===Radura.start?'Pip':'libera'));
  });
  buttons.forEach((b,i)=>{b.disabled=spent.has(i)||phase!=='ready';b.setAttribute('aria-pressed',String(i===chosen))});
  $('counter').textContent='Livello 1 · '+(6-moves)+' mosse';
}
function reset(){
  sequence++;drag=null;board=Radura.initial.slice();chosen=0;moves=0;spent=new Set();phase='ready';
  hero.classList.remove('walking');orient(1,0);stand(Radura.start);render();
  $('pieces').hidden=false;$('again').hidden=true;$('hint').hidden=false;$('restart').hidden=false;
  $('message').textContent='Completa una riga per aprire il sentiero.';
}
async function play(i){
  if(phase!=='ready')return;
  const result=Radura.move(board,chosen,i);
  if(!result){$('message').textContent='Qui il pezzo non entra.';return}
  const serial=sequence;phase='moving';spent.add(chosen);moves++;
  if(spent.size===3)spent.clear();
  const old=board;board=result.next;
  for(const k of result.clear){if(old[k])cells[k].animate([{opacity:1},{opacity:.1}],{duration:180})}
  await pause(185);if(sequence!==serial)return;
  chosen=buttons.findIndex((_,j)=>!spent.has(j));render();
  const route=Radura.path(board);
  if(!route.length){
    if(moves===6||!buttons.some((_,j)=>!spent.has(j)&&board.some((_,k)=>Radura.fit(board,j,k)))){
      phase='ended';$('pieces').hidden=true;$('again').hidden=false;$('hint').hidden=true;$('restart').hidden=true;$('message').textContent='La strada è ancora chiusa.';
    }else{phase='ready';render();$('message').textContent='Cerca una riga o una colonna da completare.'}
    return;
  }
  phase='walking';$('message').textContent='Il sentiero è aperto.';$('hint').hidden=true;
  hero.classList.add('walking');let facing=1;
  for(const next of route.slice(1)){
    const d=next-position,target=d===1?2:d===-1?6:d===-6?4:0;
    cells[next].classList.add('route');stand(next);
    for(let frame=0;frame<4;frame++){
      const delta=(target-facing+12)%8-4;facing=(facing+Math.sign(delta)+8)%8;
      orient(Math.min(facing,8-facing),frame,facing>4);await pause(65);if(sequence!==serial)return;
    }
  }
  phase='ended';orient(1,0);$('message').textContent='Pip ha raggiunto il portale!';$('pieces').hidden=true;$('again').hidden=false;$('restart').hidden=true;
}
$('hint').onclick=()=>{
  if(phase!=='ready')return;
  const anchors=[14,...Array.from({length:36},(_,i)=>i).filter(i=>i!==14)];
  for(let j=0;j<3;j++)if(!spent.has(j))for(const i of anchors){
    const m=Radura.move(board,j,i);if(m&&Radura.path(m.next).length){choose(j);cells.forEach(c=>c.classList.remove('suggest'));cells[i].classList.add('suggest');$('message').textContent='Posa il pezzo nella casella illuminata.';return}
  }
  $('message').textContent='Cerca una linea quasi piena, oppure riprova.';
};
$('again').onclick=$('restart').onclick=reset;
new ResizeObserver(()=>stand(position)).observe($('board'));
reset();

