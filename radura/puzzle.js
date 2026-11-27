'use strict';
const Radura=(()=>{
  const start=25,exit=11;
  const shapes=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1],[1,1]]];
  const initial=[
    0,0,2,0,5,0, 1,0,0,5,0,0, 4,2,0,3,5,1,
    0,0,0,1,0,2, 5,0,0,2,0,0, 0,0,4,3,0,0
  ];
  function fit(board,slot,anchor){
    if(!Number.isInteger(anchor)||anchor<0||anchor>=36)return null;
    const cells=[];
    for(const [dx,dy] of shapes[slot]){
      const x=anchor%6+dx,y=Math.floor(anchor/6)+dy,k=y*6+x;
      if(x>=6||y>=6||board[k]||k===start||k===exit)return null;
      cells.push(k);
    }
    return cells;
  }
  function move(board,slot,anchor){
    const cells=fit(board,slot,anchor);
    if(!cells)return null;
    const next=board.slice(),clear=new Set();
    cells.forEach(i=>next[i]=[1,2,4][slot]);
    for(let i=0;i<6;i++)for(const line of [Array.from({length:6},(_,x)=>6*i+x),Array.from({length:6},(_,y)=>6*y+i)]){
      if(line.every(i=>next[i]))line.forEach(i=>clear.add(i));
    }
    clear.forEach(i=>next[i]=0);
    return {next,clear};
  }
  function path(board){
    const queue=[start],parent=new Map([[start,-1]]);
    for(let j=0;j<queue.length;j++){
      const k=queue[j];if(k===exit){const result=[];for(let p=k;p!==-1;p=parent.get(p))result.unshift(p);return result}
      for(const [dx,dy] of [[1,0],[0,-1],[-1,0],[0,1]]){
        const x=k%6+dx,y=Math.floor(k/6)+dy,n=6*y+x;
        if(x<0||x>5||y<0||y>5||board[n]||parent.has(n))continue;
        parent.set(n,k);queue.push(n);
      }
    }
    return [];
  }
  return {start,exit,shapes,initial,move,path,fit};
})();
if(typeof module!=='undefined')module.exports=Radura;

