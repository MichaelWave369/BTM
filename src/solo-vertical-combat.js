// Optional upper-story enforcers for solo Quest/Classic research.
// No multiplayer messages, no new mandatory boss kills, no original save writes.
import {findRoute,moveBody,canOccupy} from './collision.js';
import {STACK_HEIGHT,initVerticalBody,upperAt,rampHeight} from './net/vertical-arena.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const high=(level,o)=>upperAt(level,o.x,o.y)&&(o.height||0)>=STACK_HEIGHT-.3;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// Familiar silhouettes, different combat decisions. One role per authored deck.
// No extra monsters and no additional extraction gates.
export const SOLO_UPPER_GUARDS=Object.freeze([
 Object.freeze({id:'breacher',label:'BREACHER',hp:72,speed:1.55,range:1.7,delay:1.05,damage:10}),
 Object.freeze({id:'marksman',label:'MARKSMAN',hp:67,speed:.9,range:6,delay:2,damage:11}),
 Object.freeze({id:'bulwark',label:'BULWARK',hp:130,speed:.92,range:2.3,delay:1.65,damage:12})
]);
export const soloUpperRole=index=>SOLO_UPPER_GUARDS[index%SOLO_UPPER_GUARDS.length];
export function addSoloUpperSentry(level,index,definition){
 if(!level?.vertical?.soloPreview)return null;
 const u=level.vertical.upper;
 const role=soloUpperRole(index),x=u.x1-.5,y=u.y0+.5,hp=Math.round(role.hp*(definition.difficulty||1));
 const e=initVerticalBody({
  id:level.enemies.length,type:'enforcer',upperGuard:true,upperGuardRole:role.id,human:false,
  coverReady:role.id==='bulwark',coverRecharge:0,
  x,y,homeX:x,homeY:y,hp,maxHp:hp,damage:role.damage*(definition.damageScale||1),
  speed:role.speed*(definition.speedScale||1),range:role.range,delay:role.delay,
  state:'patrol',cooldown:.8,tell:0,stun:0,flash:0,dead:false,
  phase:1,walk:0,pathTimer:0,recoil:0,pain:0
 },STACK_HEIGHT);
 e.floorHeight=e.height;
 level.enemies.push(e);
 level.upperGuardCleared=false;
 return e;
}
export function soloSentryWaypoint(level,sentry,target){
 if(!level?.vertical?.soloPreview||!sentry?.upperGuard||!target)return null;
 const r=level.vertical.ramp,middle=(r.y0+r.y1)/2,
  foot={x:r.x0+.5,y:middle},crest={x:r.x1+.5,y:middle};
 const targetUp=high(level,target);
 const onRamp=rampHeight(level,sentry.x,sentry.y)!==null;
 if(onRamp)return targetUp?crest:foot;
 const sentryUp=high(level,sentry);
 if(sentryUp&&!targetUp)return dist(sentry,crest)>.55?crest:foot;
 if(!sentryUp&&targetUp){
  if(dist(sentry,foot)<.65)return crest;
  const path=findRoute(level,sentry,foot);
  // Ground navigation honors the current door states, never teleports
  // through locked colored supply rooms or solid corridor walls.
  return path[1]||foot;
 }
 return null;
}
// Tiny, deterministic upper-deck collision graph. The 0.5-tile nodes are
// checked with the *same* body radius/cover hitboxes as actual movement.
// This is a local path suggestion, not teleportation or a second AI engine.
// No path state enters saves, multiplayer messages or mission objectives.
export function soloUpperFlankWaypoint(level,sentry,target){
 if(!level?.vertical?.soloPreview||!sentry?.upperGuard||!target||
    !high(level,sentry)||!upperAt(level,target.x,target.y))return null;
 const u=level.vertical.upper,radius=.23,edge=radius+.012,
  inside=(x,y)=>x>=u.x0+edge&&x<u.x1-edge&&y>=u.y0+edge&&y<u.y1-edge,
  free=(x,y)=>inside(x,y)&&canOccupy(level,x,y,radius,sentry),
  segment=(from,to)=>{
   const d=Math.hypot(to.x-from.x,to.y-from.y);
   for(let i=1,n=Math.max(1,Math.ceil(d/.1));i<=n;i++){
    const t=i/n;
    if(!free(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t))return false;
   }
   return true;
  };
 // When the direct lane is clear, preserve the existing chase/strafe.
 if(segment(sentry,target))return null;
 const columns=(u.x1-u.x0)*2,rows=(u.y1-u.y0)*2,total=columns*rows,
  node=id=>({x:u.x0+.25+(id%columns)*.5,y:u.y0+.25+Math.floor(id/columns)*.5});
 const nodes=Array.from({length:total},(_,i)=>node(i));
 const open=nodes.map(p=>free(p.x,p.y));
 const nearest=point=>{
  let best=-1,score=Infinity;
  for(let i=0;i<total;i++){
   const q=nodes[i],d=Math.hypot(q.x-point.x,q.y-point.y);
   if(!open[i]||d>=score||!segment(point,q))continue;
   best=i;score=d;
  }
  return best;
 };
 const start=nearest(sentry),end=nearest(target);
 if(start<0||end<0)return null;
 const previous=Array(total).fill(-1),queue=[start];
 previous[start]=start;
 for(let head=0;head<queue.length&&previous[end]<0;head++){
  const id=queue[head],x=id%columns,y=Math.floor(id/columns);
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const nx=x+dx,ny=y+dy;
   if(nx<0||ny<0||nx>=columns||ny>=rows)continue;
   const next=ny*columns+nx;
   if(previous[next]>=0||!open[next]||!segment(nodes[id],nodes[next]))continue;
   previous[next]=id;queue.push(next);
  }
 }
 if(previous[end]<0)return null;
 const path=[];for(let at=end;;at=previous[at]){path.push(at);if(at===start)break;}
 path.reverse();
 // Join the first node safely before following BFS steps. Once close enough,
 // take the next node; recomputation per frame cannot skip the real cover.
 return Math.hypot(sentry.x-nodes[start].x,sentry.y-nodes[start].y)>.14?
  nodes[start]:nodes[path[1]??start];
}
export function moveSoloUpperSentry(level,sentry,target,dt){
 if(!level?.vertical?.soloPreview||!sentry?.upperGuard||sentry.dead)return false;
 const waypoint=soloSentryWaypoint(level,sentry,target);
 const detour=soloUpperFlankWaypoint(level,sentry,waypoint||target);
 if(detour){
  const d=dist(sentry,detour);
  if(d>.015){const step=Math.min(sentry.speed*dt,d)/d;moveBody(level,sentry,(detour.x-sentry.x)*step,(detour.y-sentry.y)*step,.23);return true;}
 }
 // Marksmen strafe laterally on the upper floor rather than acting like
 // another melee enforcer. Never strafe off the authored deck or block ramp pursuit.
 if(!waypoint&&sentry.state==='pursue'&&sentry.upperGuardRole==='marksman'&&high(level,sentry)&&high(level,target)){
  const d=dist(sentry,target);
  if(d<sentry.range*.82&&d>.1){
   const u=level.vertical.upper,dx=(target.x-sentry.x)/d,dy=(target.y-sentry.y)/d,
    side=Math.floor(sentry.walk/2)%2===0?1:-1,retreat=d<2.3?-.5:0,
    x=clamp(sentry.x+dx*retreat-dy*side*.65,u.x0+.38,u.x1-.38),
    y=clamp(sentry.y+dy*retreat+dx*side*.65,u.y0+.38,u.y1-.38),
    gap=Math.hypot(x-sentry.x,y-sentry.y);
   if(gap>.03){const step=Math.min(sentry.speed*dt,gap)/gap;moveBody(level,sentry,(x-sentry.x)*step,(y-sentry.y)*step,.23);return true;}
   return false;
  }
 }
 const goal=waypoint||target,
  distance=dist(sentry,goal);
 if(distance<.15)return false;
 const scale=Math.min(sentry.speed*dt,distance)/distance;
 moveBody(level,sentry,(goal.x-sentry.x)*scale,(goal.y-sentry.y)*scale,.23);
 return true;
}
