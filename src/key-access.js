// Bonus color-lock alcoves for the original single-floor campaign.
// The original corridors, doors and objectives are never locked or rerouted.
export const ACCESS_COLORS=Object.freeze(['red','blue','green']);
const name=(x,y)=>x+','+y;
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const owned=keys=>new Set(Array.isArray(keys)?keys:Object.entries(keys||{}).filter(([,v])=>v).map(([k])=>k));
export function reachableWithAccess(level,spawn,keys=[]){
 const access=owned(keys),start=[Math.floor(spawn.x),Math.floor(spawn.y)];
 const queue=[start],seen=new Set([name(...start)]),depth=new Map([[name(...start),0]]);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i],dist=depth.get(name(x,y));
  for(const [dx,dy] of DIRS){
   const xx=x+dx,yy=y+dy,k=name(xx,yy),tile=level.cells[yy]?.[xx],door=level.doors[k];
   if(seen.has(k)||!(tile===0||door?.type===4&&(!door.lockColor||access.has(door.lockColor))))continue;
   seen.add(k);depth.set(k,dist+1);queue.push([xx,yy]);
  }
 }
 return {seen,depth};
}
function findBonusSite(level,reachable,used){
 const sites=[];
 for(let y=2;y<level.h-2;y++)for(let x=2;x<level.w-2;x++){
  if(level.cells[y][x]===0||level.doors[name(x,y)]||used.has(name(x,y)))continue;
  for(const [dx,dy] of DIRS){
   const ax=x-dx,ay=y-dy,bx=x+dx,by=y+dy;
   if(level.cells[ay]?.[ax]!==0||!reachable.seen.has(name(ax,ay)))continue;
   if(level.cells[by]?.[bx]===0||level.doors[name(bx,by)]||used.has(name(bx,by)))continue;
   // A one-cell blind pocket: all three neighbors other than its new door
   // remain solid and never connect to an existing corridor or secret.
   if([[dx,dy],[-dy,dx],[dy,-dx]].some(([sx,sy])=>{
    const nx=bx+sx,ny=by+sy;
    return level.cells[ny]?.[nx]===0||level.doors[name(nx,ny)];
   }))continue;
   const distance=reachable.depth.get(name(ax,ay)),score=distance>3&&distance<25?100-Math.abs(distance-12):0;
   sites.push({x,y,bx,by,ax,ay,score,dist:distance});
  }
 }
 // Deterministic and spread across the stage for exploration.
 sites.sort((a,b)=>b.score-a.score||b.dist-a.dist||a.y-b.y||a.x-b.x);
 return sites[0]||null;
}
export function addColoredAccess(level,spawn,index=0){
 if(level.campaign==='pit')return [];
 const count=Math.min(3,1+Math.floor(index/3));
 const original=reachableWithAccess(level,spawn),used=new Set(),placed=[];
 const reserved=[...level.items,...level.enemies,...level.captives,...level.relays,level.key,level.exit,spawn];
 for(let i=0;i<count;i++){
  const site=findBonusSite(level,original,used);
  if(!site)break;
  const color=ACCESS_COLORS[(index+i)%ACCESS_COLORS.length],
   id=name(site.x,site.y),loot={x:site.bx+.5,y:site.by+.5},
   door={x:site.x,y:site.y,type:4,open:0,target:0,lockColor:color,bonus:true};
  // Add an entirely optional dead-end room; never color-lock a preexisting
  // door, a main path, or an essential relay/rescue/extraction route.
  level.cells[site.y][site.x]=4;level.cells[site.by][site.bx]=0;level.doors[id]=door;
  used.add(id);used.add(name(site.bx,site.by));
  const candidate=[...original.seen].map(k=>{
   const [x,y]=k.split(',').map(Number);return {x:x+.5,y:y+.5,d:original.depth.get(k)};
  }).filter(o=>level.cells[Math.floor(o.y)]?.[Math.floor(o.x)]===0&&o.d>2&&
   reserved.every(r=>Math.hypot(r.x-o.x,r.y-o.y)>.82));
  candidate.sort((a,b)=>Math.abs(a.d-site.dist)-Math.abs(b.d-site.dist)||b.d-a.d||a.y-b.y||a.x-b.x);
  if(!candidate.length){
   delete level.doors[id];level.cells[site.y][site.x]=level.cells[site.by][site.bx]=level.cells[site.y][site.x]||1;
   continue;
  }
  const location=candidate[0],item={id:level.items.length,type:'key:'+color,
   x:location.x,y:location.y,taken:false,accessOrder:i};
  level.items.push(item);reserved.push(item);placed.push(item);
  const supply={id:level.items.length,type:i%2?'armor':'energy',...loot,taken:false,bonusAccess:color};
  level.items.push(supply);
 }
 return placed;
}
