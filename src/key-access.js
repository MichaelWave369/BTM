// Optional authored access gates for the original solo sectors.
// A color door remains cell type 4 and each matching card remains a normal item.
export const ACCESS_COLORS=Object.freeze(['red','blue','green']);
const name=(x,y)=>x+','+y;
const owned=keys=>new Set(Array.isArray(keys)?keys:Object.entries(keys||{}).filter(([,v])=>v).map(([k])=>k));
export function reachableWithAccess(level,spawn,keys=[]){
 const access=owned(keys),start=[Math.floor(spawn.x),Math.floor(spawn.y)];
 const queue=[start],seen=new Set([name(...start)]),depth=new Map([[name(...start),0]]);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i],dist=depth.get(name(x,y));
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   const xx=x+dx,yy=y+dy,k=name(xx,yy),tile=level.cells[yy]?.[xx],door=level.doors[k];
   if(seen.has(k)||!(tile===0||door?.type===4&&(!door.lockColor||access.has(door.lockColor))))continue;
   seen.add(k);depth.set(k,dist+1);queue.push([xx,yy]);
  }
 }
 return {seen,depth};
}
export function addColoredAccess(level,spawn,index=0){
 if(level.campaign==='pit')return [];
 const count=Math.min(3,1+Math.floor(index/3));
 const doors=Object.values(level.doors).filter(d=>d.type===4).slice(0,count);
 const gained=new Set(),placed=[];
 const reserved=[...level.items,...level.enemies,...level.captives,...level.relays,level.key,level.exit,spawn];
 for(let i=0;i<doors.length;i++){
  const door=doors[i],color=ACCESS_COLORS[(index+i)%ACCESS_COLORS.length];door.lockColor=color;
  // Own gate remains closed while placing the card. Only previously earned
  // color gates can be crossed. No secret or gold gates may hide mandatory cards.
  const {seen,depth}=reachableWithAccess(level,spawn,gained);let best=null;
  for(const k of seen){
   const [x,y]=k.split(',').map(Number),pos={x:x+.5,y:y+.5},dist=depth.get(k);
   if(level.cells[y]?.[x]!==0||dist<2||reserved.some(o=>Math.hypot(o.x-pos.x,o.y-pos.y)<.83))continue;
   const doorDist=Math.abs(x-door.x)+Math.abs(y-door.y);
   const score=Math.min(dist,12)*3-Math.abs(doorDist-5)*2+(gained.size?Math.min(dist,8):0);
   if(!best||score>best.score)best={...pos,score};
  }
  if(!best){delete door.lockColor;continue;} // Never lock a route without placing its card.
  const item={id:level.items.length,type:'key:'+color,x:best.x,y:best.y,taken:false,accessOrder:i};
  level.items.push(item);reserved.push(item);placed.push(item);gained.add(color);
 }
 return placed;
}
