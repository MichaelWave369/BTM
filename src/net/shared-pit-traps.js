// Authoritative co-op Pit hazards. The server calls this ONCE per fixed tick,
// after all actors move and before projectile physics. Clients only receive
// bounded state snapshots. Solo Pit deliberately keeps its own mechanics.
import {lineOfSight} from '../collision.js';
import {floorTrapState} from '../pit-floor-traps.js';
import {PIT_STAGES} from '../pit.js';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inLane=(p,h,extra=0)=>{
 const dx=h.toX-h.x,dy=h.toY-h.y,mag=dx*dx+dy*dy;
 const u=mag?Math.max(0,Math.min(1,((p.x-h.x)*dx+(p.y-h.y)*dy)/mag)):0;
 return Math.hypot(p.x-h.x-u*dx,p.y-h.y-u*dy)<h.radius+extra;
};
function announce(g,h,message){
 g.emit('pitTell',{text:message,x:h.x,y:h.y});
 g.emit('toast',{text:message});
 g.emit('sound',{name:'alarm',position:{x:h.x,y:h.y,height:.3}});
}
function hit(g,h,a){
 // Keep the victim's actor context active for BOTH the real damage and
 // its event. SharedWorld.emit otherwise tags events with the primary actor.
 g.room.withActor(a,()=>{
  g.damagePlayer(h.damage,h);
  g.emit('hazardHit',{trapId:h.id,kind:h.kind,damage:h.damage});
 });
}
function insideNow(trap,actors,radius=trap.radius){
 return actors.filter(a=>dist(a.player,trap)<radius).map(a=>a.id);
}
function enteredActors(trap,actors,radius=trap.radius){
 const before=new Set(trap.insideActors||[]);
 const inside=insideNow(trap,actors,radius);
 trap.insideActors=inside;
 return actors.filter(a=>inside.includes(a.id)&&!before.has(a.id));
}
function advanceOrb(g,trap,actors){
 const entrants=enteredActors(trap,actors);
 if(entrants.length&&!Number.isFinite(trap.fireAt)&&g.time>=(trap.readyAt||0)){
  const a=entrants[0]; // stable server actor order; a shared plate arms once
  trap.fireAt=g.time+trap.warning;trap.readyAt=g.time+trap.cooldown;
  trap.targetX=a.player.x;trap.targetY=a.player.y;trap.volleyShot=0;
  const text=trap.pattern==='crossfire'?'CROSSFIRE / TWO WALLS CHARGING':
   trap.pattern==='double'?'DOUBLE ORB / STAGGERED VOLLEY':
   'ELECTRIC ORB / PRESSURE PLATE ARMED';
  announce(g,trap,text);
  g.emit('pitTrapArmed',{trapId:trap.id,pattern:trap.pattern||'single',
   x:trap.x,y:trap.y,fireAt:trap.fireAt,targetId:a.id});
 }
 if(!Number.isFinite(trap.fireAt)||g.time<trap.fireAt)return;
 const shot=trap.volleyShot||0,total=Math.max(1,Math.min(2,trap.burst||1));
 const side=trap.pattern==='crossfire'?(shot+(trap.volleyCycle||0))%2:0;
 const source=side?{x:trap.secondMuzzleX,y:trap.secondMuzzleY}:
  {x:trap.muzzleX,y:trap.muzzleY};
 const target={x:trap.targetX,y:trap.targetY},due=trap.fireAt;
 // Consume scheduled shot before geometry/projectile limits. Otherwise a
 // blocked launcher can emit multiple hits after a delayed/retried tick.
 trap.volleyShot=shot+1;
 if(trap.volleyShot>=total){
  trap.fireAt=null;trap.volleyShot=0;
  if(trap.pattern==='crossfire')trap.volleyCycle=((trap.volleyCycle||0)+1)%2;
 }else trap.fireAt=Math.max(g.time,due)+Math.max(.3,trap.interval||.45);
 if(g.projectiles.length>=96||!Number.isFinite(source.x)||!Number.isFinite(source.y))return;
 if(dist(source,target)<.1||!lineOfSight(g.level,source,target))return;
 g.projectiles.push({x:source.x,y:source.y,height:.7,
  a:Math.atan2(target.y-source.y,target.x-source.x),
  speed:trap.speed,damage:trap.damage,life:3,enemy:true,
  trap:'electric-orb',color:'#59e7ff',r:.15});
 g.emit('pitTrapFired',{trapId:trap.id,shot:shot+1,side,
  x:source.x,y:source.y,targetX:target.x,targetY:target.y});
 g.emit('sound',{name:'oriBolt',position:{x:source.x,y:source.y,height:.7}});
 g.emit('burst',{x:source.x,y:source.y,height:.7,color:'#59e7ff',count:8});
}
function advanceFloor(g,h,actors){
 if(h.kind==='pressure-pulse'){
  const entrants=enteredActors(h,actors,h.triggerRadius);
  if(entrants.length&&!Number.isFinite(h.fireAt)&&g.time>=(h.readyAt||0)){
   h.fireAt=g.time+h.warning;h.readyAt=g.time+h.cooldown;
   announce(g,h,'PRESSURE PULSE / SQUAD MOVE CLEAR');
   g.emit('pitFloorArmed',{trapId:h.id,kind:h.kind,fireAt:h.fireAt});
  }
  if(!Number.isFinite(h.fireAt)||g.time<h.fireAt)return;
  h.fireAt=null;h.activeUntil=g.time+.4;
  g.emit('pitFloorFired',{trapId:h.id,kind:h.kind});
  for(const a of actors)if(dist(a.player,h)<h.radius+.16)hit(g,h,a);
  g.emit('burst',{x:h.x,y:h.y,height:.08,color:'#62e8ff',count:8});
  return;
 }
 const cycle=Math.floor((g.time+(h.offset||0))/h.period);
 const phase=floorTrapState(h,g.time);
 const near=a=>h.kind==='arc-lane'?inLane(a.player,h,.16):dist(a.player,h)<h.radius+.16;
 if(phase==='warning'&&h.warned!==cycle&&actors.some(a=>
  h.kind==='arc-lane'?inLane(a.player,h,1.2):dist(a.player,h)<4)){
  h.warned=cycle;announce(g,h,h.kind==='arc-lane'?
   'ARC LANE / CROSS BETWEEN PULSES':'CHARGE TILE / MOVE CLEAR');
 }
 if(phase!=='active')return;
 h.hitBy??={};
 for(const a of actors)if(near(a)&&h.hitBy[a.id]!==cycle){
  h.hitBy[a.id]=cycle;hit(g,h,a);
 }
}
export function updateSharedPitTraps(g){
 if(g.campaign!=='pit'||g.room?.competitive||g.mode!=='playing')return;
 const actors=g.room.live().filter(a=>a.connected);
 for(const trap of g.level.traps||[])advanceOrb(g,trap,actors);
 for(const floor of g.level.floorTraps||[])advanceFloor(g,floor,actors);
}
// Server checkpoint hardening: retain only a bounded subset of transient
// authority state, always reconstructing static geometry from owned Pit stage
// templates. Older valid saves with missing trap arrays get safe idle traps.
export function recoverSharedPitTrapState(level,stage,time,actorIds=[]){
 if(stage<0||stage>=12)return;
 const template=PIT_STAGES[stage];
 const ids=new Set(actorIds);
 const boundedTime=v=>Number.isFinite(v)&&v>=0&&v<=time+10;
 function reconstruct(saved,canonical,fields){
  if(saved!==undefined&&(!Array.isArray(saved)||saved.length!==canonical.length))
   throw Error('Invalid cooperative Pit trap collection');
  return canonical.map((def,i)=>{
   const input=saved?.[i];
   if(input&&(input.id!==def.id||input.kind!==def.kind||input.x!==def.x||input.y!==def.y))
    throw Error('Invalid cooperative Pit trap descriptor');
   const result={...def};
   for(const field of fields){
    const v=input?.[field];
    if(v===undefined||v===null)continue;
    if(field==='insideActors'){
     if(!Array.isArray(v)||v.length>4||v.some(id=>!ids.has(id))||new Set(v).size!==v.length)
      throw Error('Invalid cooperative trap occupants');
     result.insideActors=v.slice();
    }else if(field==='hitBy'){
     if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length>4||
      Object.entries(v).some(([id,cycle])=>!ids.has(id)||!Number.isInteger(cycle)||cycle<0||cycle>100000))
      throw Error('Invalid cooperative trap damage receipt');
     result.hitBy={...v};
    }else if(field==='volleyShot'||field==='volleyCycle'){
     if(!Number.isInteger(v)||v<0||v>2)throw Error('Invalid cooperative orb burst state');
     result[field]=v;
    }else if(field==='targetX'||field==='targetY'){
     if(!Number.isFinite(v)||v<0||v>29)throw Error('Invalid cooperative orb target');
     result[field]=v;
    }else if(field==='warned'){
     if(!Number.isInteger(v)||v<0||v>100000)throw Error('Invalid cooperative warning cycle');
     result[field]=v;
    }else{
     if(!boundedTime(v))throw Error('Invalid cooperative trap timer');
     result[field]=v;
    }
   }
   if(Number.isFinite(result.fireAt)&&(!Number.isFinite(result.targetX)||!Number.isFinite(result.targetY))&&
    result.kind==='electric-orb')throw Error('Invalid armed cooperative trap');
   return result;
  });
 }
 level.traps=reconstruct(level.traps,template.traps||[],
  ['insideActors','fireAt','readyAt','targetX','targetY','volleyShot','volleyCycle']);
 level.floorTraps=reconstruct(level.floorTraps,template.floorTraps||[],
  ['insideActors','fireAt','readyAt','activeUntil','warned','hitBy']);
}
