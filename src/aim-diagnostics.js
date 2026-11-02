// Opt-in visual preview of the SAME tracked hitscan used by Game.shootTracked.
// Diagnostic only. It never mutates the level, aim, enemy state, or shooting rules.
import {WORLD_SCALE,normalizeDirection,traceTrackedShot,validAim} from './spatial.js';

export function previewTrackedShot(level,aim,weapon){
 if(!level||!weapon||!validAim(aim))return null;
 const direction=normalizeDirection(aim.direction),trace=traceTrackedShot(level,aim,weapon);
 if(!direction||!trace.impact)return null;
 const target=trace.targets[0]||null,distance=target?.distance??trace.impact.distance;
 if(!Number.isFinite(distance)||distance<0)return null;
 const end={x:aim.origin.x+direction.x*distance,
  y:aim.origin.y+direction.y*distance,height:aim.origin.height+direction.z*distance};
 return {
  from:[aim.origin.x*WORLD_SCALE,aim.origin.height*WORLD_SCALE,aim.origin.y*WORLD_SCALE],
  rayEnd:[end.x*WORLD_SCALE,end.height*WORLD_SCALE,end.y*WORLD_SCALE],
  // The ray is central aim; an enemy may be hittable at its edge via weapon spread.
  // Keep the two indicators separate so the preview never fakes perfect aim.
  targetMarker:target?[target.entity.x*WORLD_SCALE,target.height*WORLD_SCALE,target.entity.y*WORLD_SCALE]:null,
  target:!!target,kind:target?'target':trace.impact.type,clipped:!!aim.clipped
 };
}
