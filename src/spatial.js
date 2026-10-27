import {castRay,solidAt} from './collision.js';
export const WORLD_SCALE=1.6,WALL_HEIGHT=1.7;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const entityHeight=type=>type==='warden'?1.45:type==='crawler'?.43:1.03;
export function normalizeDirection(d){const n=Math.hypot(d?.x||0,d?.y||0,d?.z||0);return n>.00001?{x:d.x/n,y:d.y/n,z:d.z/n}:null;}
export function validAim(aim){return !!(aim?.origin&&aim?.direction&&['x','y','height'].every(k=>Number.isFinite(aim.origin[k]))&&['x','y','z'].every(k=>Number.isFinite(aim.direction[k]))&&Math.hypot(aim.direction.x,aim.direction.y,aim.direction.z)>.001);}
// Game coordinates: x/y horizontal, height vertical. Range is in tiles.
export function traceEnvironment(level,origin,direction,max=25){
 const d=normalizeDirection(direction);if(!d)return null;
 let t=max,type='range',cell=null;const horizontal=Math.hypot(d.x,d.y);
 if(horizontal>.00001){const hit=castRay(level,origin.x,origin.y,d.x/horizontal,d.y/horizontal,max*horizontal+.01),along=hit.distance/horizontal;if(hit.type&&along<t){t=along;type='wall';cell=hit;}}
 const vertical=d.z>0?(WALL_HEIGHT-origin.height)/d.z:d.z<0?-origin.height/d.z:Infinity;
 if(vertical>=0&&vertical<t){t=vertical;type=d.z>0?'ceiling':'floor';cell=null;}
 if(solidAt(level,origin.x,origin.y)||origin.height<0||origin.height>WALL_HEIGHT){t=0;type='blocked';cell=null;}
 return {distance:Math.max(0,t),type,cell,x:origin.x+d.x*t,y:origin.y+d.y*t,height:origin.height+d.z*t};
}
export function safeTrackedAim(level,head,desired){
 if(!validAim(desired))return null;
 const delta={x:desired.origin.x-head.x,y:desired.origin.y-head.y,z:desired.origin.height-head.height},length=Math.hypot(delta.x,delta.y,delta.z),limit=.85/WORLD_SCALE,direction=normalizeDirection(desired.direction);
 const ray=length>.00001?traceEnvironment(level,head,delta,Math.min(length,limit)):null;
 const t=ray?Math.max(0,Math.min(length,limit,ray.distance-(ray.type==='range'?0:.025))):0,ratio=length>.00001?t/length:0;
 return {origin:{x:head.x+delta.x*ratio,y:head.y+delta.y*ratio,height:head.height+delta.z*ratio},direction,clipped:length>limit||!!ray&&ray.distance<length-.01};
}
export function rayEntityDistance(o,d,e,spread=0,range=25){
 const dx=e.x-o.x,dy=e.y-o.y,planar=d.x*d.x+d.y*d.y;if(planar<.00001)return null;
 const t=(dx*d.x+dy*d.y)/planar;if(t<0||t>range)return null;
 const horizontal=Math.hypot(dx-d.x*t,dy-d.y*t),padding=Math.tan(spread)*t,radius=(e.type==='warden'?.38:e.type==='crawler'?.24:.25)+padding,z=o.height+d.z*t;
 return horizontal<=radius&&z>=-padding&&z<=entityHeight(e.type)+padding?t:null;
}
export function traceTrackedShot(level,aim,weapon){
 if(!validAim(aim))return {targets:[],impact:null};const d=normalizeDirection(aim.direction),impact=traceEnvironment(level,aim.origin,d,weapon.range),targets=[];
 for(const e of level.enemies){if(e.dead)continue;const t=rayEntityDistance(aim.origin,d,e,weapon.spread,Math.min(weapon.range,impact.distance));if(t===null)continue;
  const center={x:e.x,y:e.y,height:clamp(aim.origin.height+d.z*t,.05,entityHeight(e.type))},delta={x:center.x-aim.origin.x,y:center.y-aim.origin.y,z:center.height-aim.origin.height},distance=Math.hypot(delta.x,delta.y,delta.z),wall=traceEnvironment(level,aim.origin,delta,distance+.02);
  if(wall.distance>=distance-.08)targets.push({entity:e,distance:t,height:center.height});
 }targets.sort((a,b)=>a.distance-b.distance);return {targets,impact};
}
