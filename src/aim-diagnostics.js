// Opt-in visual preview of the SAME tracked hitscan used by Game.shootTracked.
// Diagnostic only. It never mutates the level, aim, enemy state, or shooting rules.
import {WORLD_SCALE,traceTrackedShot,validAim} from './spatial.js';

export function previewTrackedShot(level,aim,weapon){
 if(!level||!weapon||!validAim(aim))return null;
 const {targets,impact,rayEnd:end}=traceTrackedShot(level,aim,weapon);
 if(!end)return null;
 const target=targets[0]||null;
 return {
  from:[aim.origin.x*WORLD_SCALE,aim.origin.height*WORLD_SCALE,aim.origin.y*WORLD_SCALE],
  rayEnd:[end.x*WORLD_SCALE,end.height*WORLD_SCALE,end.y*WORLD_SCALE],
  // The ray is central aim; an enemy may be hittable at its edge via weapon spread.
  // Keep the two indicators separate so the preview never fakes perfect aim.
  targetMarker:target?[target.entity.x*WORLD_SCALE,target.height*WORLD_SCALE,target.entity.y*WORLD_SCALE]:null,
  targetOffsetMeters:target?Math.hypot(target.entity.x-end.x,target.height-end.height,target.entity.y-end.y)*WORLD_SCALE:null,
  target:!!target,kind:target?'target':impact.type,clipped:!!aim.clipped
 };
}
