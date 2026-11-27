'use strict';
const Radura=(()=>{
  const levels=[{"title":"La radura","start":25,"exit":11,"initial":[0,0,2,0,5,0,1,0,0,5,0,0,4,2,0,3,5,1,0,0,0,1,0,2,5,0,0,2,0,0,0,0,4,3,0,0],"shapes":[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1],[1,1]]],"solution":[[0,14]]},{"title":"Tra le felci","start":30,"exit":35,"initial":[1,2,3,0,5,1,0,0,5,1,2,3,0,1,0,3,0,5,2,3,4,5,0,2,0,5,1,0,3,4,0,0,0,4,5,0],"shapes":[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0],[0,1]]],"solution":[[1,16]],"friend":"mochi","friendCell":3},{"title":"Il ruscello","start":12,"exit":29,"initial":[1,0,0,0,0,1,3,4,5,1,0,0,0,0,2,3,0,5,0,3,0,5,0,0,4,0,1,0,3,0,1,0,0,0,0,1],"shapes":[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]]],"solution":[[0,11],[1,4]]},{"title":"Sotto la quercia","start":18,"exit":29,"initial":[1,0,3,4,0,1,0,4,0,1,0,3,5,0,0,3,4,0,0,0,4,0,0,0,4,5,0,0,3,0,0,0,0,4,0,0],"shapes":[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[0,1],[1,1]]],"solution":[[0,17],[1,13]],"friend":"luma","friendCell":4},{"title":"La soglia","start":24,"exit":5,"initial":[1,2,0,4,5,0,3,4,5,1,2,0,0,0,2,3,0,0,2,3,4,0,0,2,0,5,1,2,3,4,0,2,0,4,5,0],"shapes":[[[0,0]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[2,0]]],"solution":[[0,21],[1,21]]}];
  let level=levels[0];
  function fit(board,slot,anchor){
    if(!Number.isInteger(anchor)||anchor<0||anchor>=36)return null;
    const cells=[];
    for(const [dx,dy] of level.shapes[slot]){
      const x=anchor%6+dx,y=Math.floor(anchor/6)+dy,k=y*6+x;
      if(x>=6||y>=6||board[k]||k===level.start||k===level.exit||k===level.friendCell)return null;
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
  function segment(board,start,exit,forbidden){
    const queue=[start],parent=new Map([[start,-1]]);
    for(let j=0;j<queue.length;j++){
      const k=queue[j];if(k===exit){const result=[];for(let p=k;p!==-1;p=parent.get(p))result.unshift(p);return result}
      for(const [dx,dy] of [[1,0],[0,-1],[-1,0],[0,1]]){
        const x=k%6+dx,y=Math.floor(k/6)+dy,n=6*y+x;
        if(x<0||x>5||y<0||y>5||board[n]||n===forbidden||parent.has(n))continue;
        parent.set(n,k);queue.push(n);
      }
    }
    return [];
  }

  function path(board){
    if(level.friendCell==null)return segment(board,level.start,level.exit);
    const meeting=segment(board,level.start,level.friendCell,level.exit);
    const escape=segment(board,level.friendCell,level.exit);
    return meeting.length&&escape.length?meeting.concat(escape.slice(1)):[];
  }
  return {get level(){return level},select(i){level=levels[i]},levels,move,path,fit};
})();
if(typeof module!=='undefined')module.exports=Radura;
