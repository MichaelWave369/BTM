// Shared collision and navigation. Core re-exports the original API.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function tileAt(level,x,y){return level.cells[Math.floor(y)]?.[Math.floor(x)]??1;}
export function solidAt(level,x,y){
  const t=tileAt(level,x,y);if(t===0)return false;
  const door=level.doors[`${Math.floor(x)},${Math.floor(y)}`];return !door||door.open<.84;
}
export function canOccupy(level,x,y,r=.2){
  return ![[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]].some(([xx,yy])=>solidAt(level,xx,yy));
}
export function moveBody(level,body,dx,dy,r=.2){
  // Substeps prevent tunnelling, even after a slow frame or a large knockback.
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.12));
  for(let i=0;i<n;i++){if(canOccupy(level,body.x+dx/n,body.y,r))body.x+=dx/n;if(canOccupy(level,body.x,body.y+dy/n,r))body.y+=dy/n;}
}
export function castRay(level,x,y,dx,dy,max=40,ignoreCell=null){
  let mx=Math.floor(x),my=Math.floor(y),sx=dx<0?-1:1,sy=dy<0?-1:1;
  const ddx=Math.abs(1/(dx||1e-12)),ddy=Math.abs(1/(dy||1e-12));
  let tx=(dx<0?x-mx:mx+1-x)*ddx,ty=(dy<0?y-my:my+1-y)*ddy,side=0,dist=0;
  for(let i=0;i<128&&dist<max;i++){
    if(tx<ty){mx+=sx;dist=tx;tx+=ddx;side=0;}else{my+=sy;dist=ty;ty+=ddy;side=1;}
    if(mx<0||my<0||mx>=level.w||my>=level.h)return {distance:Math.min(dist,max),type:1,side,u:0,x:mx,y:my};
    if((!ignoreCell||mx!==ignoreCell.x||my!==ignoreCell.y)&&solidAt(level,mx+.5,my+.5)){
      const hit=side===0?y+dist*dy:x+dist*dx;
      return {distance:Math.max(.001,dist),type:level.cells[my][mx],side,u:hit-Math.floor(hit),x:mx,y:my};
    }
  }
  return {distance:max,type:0,side:0,u:0,x:mx,y:my};
}
export function lineOfSight(level,a,b){const d=distance(a,b);if(d<.001)return true;return castRay(level,a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,d+.05).distance>=d-.1;}
export function reachable(level,start,{doorsOpen=false,secretsOpen=false}={}){
  const key=(x,y)=>`${x},${y}`,q=[[Math.floor(start.x),Math.floor(start.y)]],visited=new Set([key(...q[0])]);
  for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=tileAt(level,nx,ny),k=key(nx,ny);if(visited.has(k)||!(t===0||doorsOpen&&(t===4||t===5)||secretsOpen&&t===6))continue;visited.add(k);q.push([nx,ny]);}}
  return visited;
}
export function findRoute(level,start,end,{allowLocked=false,secrets=false}={}){
  const origin=`${Math.floor(start.x)},${Math.floor(start.y)}`,goal=`${Math.floor(end.x)},${Math.floor(end.y)}`,parents=new Map([[origin,null]]),queue=[origin];
  for(let i=0;i<queue.length&&!parents.has(goal);i++){const [x,y]=queue[i].split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,key=`${xx},${yy}`,t=tileAt(level,xx,yy),d=level.doors[key];if(d?.networkLocked&&d.open<.84||parents.has(key)||!(t===0||t===4||t===5&&(allowLocked||d?.open>=.84)||t===6&&(secrets||d?.open>=.84)))continue;parents.set(key,queue[i]);queue.push(key);}}
  if(!parents.has(goal))return [];const route=[];for(let key=goal;key;key=parents.get(key)){const [x,y]=key.split(',').map(Number);route.push({x:x+.5,y:y+.5});}return route.reverse();
}
