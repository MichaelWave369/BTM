// Optional upper-story enforcers for solo Quest/Classic research.
// No multiplayer messages, no new mandatory boss kills, no original save writes.
import {findRoute,moveBody} from './collision.js';
import {STACK_HEIGHT,initVerticalBody,upperAt,rampHeight} from './net/vertical-arena.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const high=(level,o)=>upperAt(level,o.x,o.y)&&(o.height||0)>=STACK_HEIGHT-.3;
export function addSoloUpperSentry(level,index,definition){
 if(!level?.vertical?.soloPreview)return null;
 const u=level.vertical.upper;
 const x=u.x1-.5,y=u.y0+.5,hp=Math.round(78*(definition.difficulty||1));
 const e=initVerticalBody({
  id:level.enemies.length,type:'enforcer',upperGuard:true,human:false,
  x,y,homeX:x,homeY:y,hp,maxHp:hp,damage:9*(definition.damageScale||1),
  speed:1.15*(definition.speedScale||1),range:2.15,delay:1.35,
  state:'patrol',cooldown:.8,tell:0,stun:0,flash:0,dead:false,
  phase:1,walk:0,pathTimer:0,recoil:0,pain:0
 },STACK_HEIGHT);
 e.floorHeight=e.height;
 level.enemies.push(e);
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
export function moveSoloUpperSentry(level,sentry,target,dt){
 if(!level?.vertical?.soloPreview||!sentry?.upperGuard||sentry.dead)return false;
 const waypoint=soloSentryWaypoint(level,sentry,target),goal=waypoint||target,
  distance=dist(sentry,goal);
 if(distance<.15)return false;
 const scale=Math.min(sentry.speed*dt,distance)/distance;
 moveBody(level,sentry,(goal.x-sentry.x)*scale,(goal.y-sentry.y)*scale,.23);
 return true;
}
