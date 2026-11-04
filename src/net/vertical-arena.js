// Optional two-story BBS test arena physics. Never mutates the 24-stage
// campaign, old flat arenas or their checkpoint schemas.
import {lineOfSight} from '../collision.js';
import {traceEnvironment} from '../spatial.js';

export const STACK_HEIGHT=1.85;
export const STACK_CEILING=3.9;
export const JUMP_IMPULSE=7.2;
export const JUMP_GRAVITY=13.4;
export const JUMP_BUFFER=.13;
export const JUMP_COYOTE=.11;
export const VERTICAL_BODY_HEIGHT=1.1;
const STEP=.16;
const within=(r,x,y)=>x>=r.x0&&x<r.x1&&y>=r.y0&&y<r.y1;
const round=n=>Math.round(n*1000)/1000;

export function stackyardLayout(){
 return {schema:'btm.vertical-prototype/1',upper:{x0:10,x1:26,y0:4,y1:21,height:STACK_HEIGHT},
  ramp:{x0:4,x1:10,y0:9,y1:11},ceiling:STACK_CEILING};
}
export function isVertical(level){return level?.vertical?.schema==='btm.vertical-prototype/1';}
export function upperAt(level,x,y){return isVertical(level)&&within(level.vertical.upper,x,y);}
export function rampHeight(level,x,y){
 if(!isVertical(level)||!within(level.vertical.ramp,x,y))return null;
 const r=level.vertical.ramp;
 return STACK_HEIGHT*Math.max(0,Math.min(1,(x-r.x0)/(r.x1-r.x0)));
}
// Which surface catches an actor descending toward this spot? Both ground
// and upper platform may occupy one x/y coordinate, so the feet height matters.
export function supportHeight(level,x,y,feet=0){
 if(!isVertical(level))return 0;
 const ramp=rampHeight(level,x,y);
 if(ramp!==null)return ramp;
 if(upperAt(level,x,y)&&feet>=STACK_HEIGHT-.045)return STACK_HEIGHT;
 return 0;
}
export function initVerticalBody(body,height=0){
 body.height=height;body.vz=0;body.grounded=true;body.supportSurface=height>STACK_HEIGHT/2?'upper':'ground';
 body.jumpBuffer=0;body.coyote=JUMP_COYOTE;return body;
}
export function requestVerticalJump(level,body){
 if(!isVertical(level)||!body||!Number.isFinite(body.height))return false;
 body.jumpBuffer=JUMP_BUFFER;return true;
}
// 60-120 Hz substeps keep travel stable even when browser frames are slow.
// Existing 2D wall collision remains authoritative via Game.updatePlayer.
// No packet contains height, vz, grounded, landing position or support id.
export function advanceVerticalBody(level,body,dt,{oldX=body.x,oldY=body.y}={}){
 if(!isVertical(level))return false;
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Invalid vertical step');
 if(!Number.isFinite(body.height)||!Number.isFinite(body.vz))initVerticalBody(body);
 let landed=false;
 const count=Math.max(1,Math.ceil(dt/(1/120))),h=dt/count;
 const initial=body.height;
 for(let i=0;i<count;i++){
  body.jumpBuffer=Math.max(0,(body.jumpBuffer||0)-h);
  body.coyote=body.grounded?JUMP_COYOTE:Math.max(0,(body.coyote||0)-h);
  if(body.jumpBuffer>0&&(body.grounded||body.coyote>0)){
   body.vz=JUMP_IMPULSE;body.grounded=false;body.coyote=0;body.jumpBuffer=0;
  }
  // The platform edge has real side collision. A jumping player must clear
  // its top before moving horizontally over the deck, unless they arrived
  // along the authored ramp near its top.
  if(upperAt(level,body.x,body.y)&&!upperAt(level,oldX,oldY)&&
   body.height<STACK_HEIGHT-.055&&body.height+VERTICAL_BODY_HEIGHT>STACK_HEIGHT+.001){
   body.x=oldX;body.y=oldY;
  }
  const ground=supportHeight(level,body.x,body.y,body.height);
  if(body.grounded){
   const oldGround=supportHeight(level,oldX,oldY,body.height);
   // A grounded actor cannot climb a 1.85-floor ledge from below. Use the
   // authored ramp or jump in from the side, crossing above the slab.
   if(ground-body.height>.32){
    body.x=oldX;body.y=oldY;
   }else if(body.height-ground>.22){
    // Leaving the high ledge creates a fall, never an instant drop to ground.
    body.grounded=false;body.vz=Math.min(0,body.vz);
   }else{
    body.height=Math.max(0,ground);body.vz=0;
   }
  }else{
   const prior=body.height;
   body.vz=Math.max(-18,body.vz-JUMP_GRAVITY*h);
   body.height+=body.vz*h;
   const upper=isVertical(level)&&upperAt(level,body.x,body.y);
   // The underside is solid: jumping beneath a deck cannot phase through it.
   if(upper&&prior+VERTICAL_BODY_HEIGHT<=STACK_HEIGHT+.002&&
     body.height+VERTICAL_BODY_HEIGHT>STACK_HEIGHT){
    body.height=STACK_HEIGHT-VERTICAL_BODY_HEIGHT-.003;
    body.vz=Math.min(0,body.vz);
   }
   const ceiling=level.vertical.ceiling-VERTICAL_BODY_HEIGHT;
   if(body.height>ceiling){body.height=ceiling;body.vz=Math.min(0,body.vz);}
   const surface=supportHeight(level,body.x,body.y,body.height);
   if(body.vz<=0&&body.height<=surface+.005){
    body.height=surface;body.vz=0;body.grounded=true;landed=true;
   }
  }
  body.height=Math.max(0,Math.min(level.vertical.ceiling-VERTICAL_BODY_HEIGHT,body.height));
  body.supportSurface=body.height>=STACK_HEIGHT-.06&&upperAt(level,body.x,body.y)?'upper':
   rampHeight(level,body.x,body.y)!==null?'ramp':'ground';
 }
 // Deterministic fall damage is an explicit future balance gate; this first
 // safe prototype lands without health loss, and never drops below ground.
 return landed;
}
export function verticalSight(level,from,to){
 if(!isVertical(level))return lineOfSight(level,from,to);
 const a={x:from.x,y:from.y,height:(from.height||0)+.92},
  b={x:to.x,y:to.y,height:(to.height||0)+.79};
 const vec={x:b.x-a.x,y:b.y-a.y,z:b.height-a.height},length=Math.hypot(vec.x,vec.y,vec.z);
 if(length<.001)return true;
 const ray=traceEnvironment(level,a,vec,length+.015);
 return ray.distance>=length-.06;
}
// Bot Pilots are still bounded intent producers, never privileged movers.
// Two waypoints force every inter-floor pursuit through the only authored
// ramp, instead of using a flat shortest path through the deck underside.
// Their movement and landing remain owned by Room.step/advanceVerticalBody.
export function stackyardBotWaypoint(level,from,target){
 if(!isVertical(level)||!from||!target)return null;
 const ramp=level.vertical.ramp,midY=(ramp.y0+ramp.y1)/2,
  foot={x:ramp.x0-.5,y:midY},crest={x:ramp.x1+.5,y:midY};
 const onRamp=rampHeight(level,from.x,from.y)!==null;
 const upper=o=>o.supportSurface==='upper'||
  (upperAt(level,o.x,o.y)&&Number.isFinite(o.height)&&o.height>=STACK_HEIGHT-.18);
 const targetHigh=upper(target),selfHigh=upper(from);
 if(targetHigh){
  if(selfHigh&&!onRamp)return null;
  if(onRamp||Math.hypot(from.x-foot.x,from.y-foot.y)<.65)return crest;
  return foot;
 }
 if(onRamp)return foot;
 if(!selfHigh)return null;
 if(Math.hypot(from.x-crest.x,from.y-crest.y)<.65)return foot;
 return crest;
}
export function verticalSnapshot(body){
 return {height:round(body.height||0),vz:round(body.vz||0),grounded:!!body.grounded,
  supportSurface:body.supportSurface||'ground'};
}
