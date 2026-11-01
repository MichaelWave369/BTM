// BBS LAN CLAN / server-owned Control Zone rules.
// Inputs provide movement, never scores, ownership, or objective state.
import {canOccupy,lineOfSight} from '../collision.js';
const AUTHOR_ZONES=Object.freeze({
 'no-carrier':Object.freeze([[11.5,12.5],[17.5,12.5]]),
 'sysops-revenge':Object.freeze([[11.5,12.5],[17.5,12.5]]),
 'kill-switch':Object.freeze([[14.5,12.5],[6.5,11.5]])
});
export const CONTROL_RADIUS=1.65,CONTROL_ROTATE_SECONDS=30;
export function controlZones(arena,level){
 const coords=AUTHOR_ZONES[arena];
 if(!coords)throw Error('Unrecognized control arena');
 const zones=coords.map(([x,y],index)=>Object.freeze({x,y,index,radius:CONTROL_RADIUS}));
 if(zones.some(z=>!canOccupy(level,z.x,z.y)))throw Error('Control zone placed inside a wall');
 return zones;
}
export function freshControlState(arena,level){
 const zones=controlZones(arena,level);
 return {zones,index:0,holder:null,contested:false,occupancy:{cyan:0,pink:0},
  progress:0,nextRotation:CONTROL_ROTATE_SECONDS};
}
export function controlZone(state){return state.zones[state.index];}
export function controlSnapshot(state,score){
 const zone=controlZone(state);
 return {zone:{...zone},holder:state.holder,contested:state.contested,
  occupancy:{...state.occupancy},rotationIn:Math.max(0,Math.round(state.nextRotation*10)/10),
  score:{cyan:score.cyan,pink:score.pink},zones:state.zones.length};
}
export function advanceControl(state,actors,level,now,dt,score,limit){
 if(!Number.isFinite(dt)||dt<0||dt>.1)throw Error('Invalid control tick');
 state.nextRotation-=dt;
 if(state.nextRotation<=0){
  state.index=(state.index+1)%state.zones.length;state.nextRotation+=CONTROL_ROTATE_SECONDS;
  state.progress=0;state.holder=null;state.contested=false;state.occupancy={cyan:0,pink:0};
  return {rotated:true,point:false,winner:null};
 }
 const zone=controlZone(state),counts={cyan:0,pink:0};
 for(const a of actors){
  if(!a.connected||a.status!=='alive'||a.invulnerable>now)continue;
  if(a.team!=='cyan'&&a.team!=='pink')continue;
  if(Math.hypot(a.player.x-zone.x,a.player.y-zone.y)<=zone.radius&&lineOfSight(level,a.player,zone))counts[a.team]++;
 }
 state.occupancy=counts;state.contested=counts.cyan>0&&counts.pink>0;
 const holder=state.contested?null:counts.cyan?'cyan':counts.pink?'pink':null;
 if(holder!==state.holder){state.holder=holder;state.progress=0;}
 if(!holder)return {rotated:false,point:false,winner:null};
 state.progress+=dt;
 const points=Math.floor(state.progress+1e-7);if(points<=0)return {rotated:false,point:false,winner:null};
 score[holder]+=points;state.progress-=points;
 const winner=score[holder]>=limit?holder:null;
 return {rotated:false,point:true,winner};
}
