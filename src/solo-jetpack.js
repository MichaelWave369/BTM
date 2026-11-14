// Optional solo two-story jetpack research. No network authority and no
// behavior change to the standard campaign, Pit, BBS or custom ΦWAD levels.
// Hold the existing sprint action after jumping to boost; release to fall.
export const JET_FUEL_CAP=100;
export const JET_BURN=48;
export const JET_RECHARGE=32;
export const JET_ACCEL=21;
export const JET_MAX_ASCENT=4.4;
export const JET_CEILING_MARGIN=1.13;

export function initSoloJetpack(body){
 body.jetFuel=JET_FUEL_CAP;
 body.jetActive=false;
 return body;
}
export function validSoloJetpack(body){
 return body?.jetFuel===undefined||
  Number.isFinite(body.jetFuel)&&body.jetFuel>=0&&body.jetFuel<=JET_FUEL_CAP&&
  typeof body.jetActive==='boolean';
}
export function stepSoloJetpack(level,body,dt,held=false){
 if(!level?.vertical?.soloPreview||!Number.isFinite(body?.jetFuel)||!Number.isFinite(dt)||dt<=0)return false;
 if(body.grounded){
  body.jetFuel=Math.min(JET_FUEL_CAP,body.jetFuel+JET_RECHARGE*dt);
  body.jetActive=false;
  return false;
 }
 if(held&&body.jetFuel>0&&body.height<level.vertical.ceiling-JET_CEILING_MARGIN){
  body.jetFuel=Math.max(0,body.jetFuel-JET_BURN*dt);
  // A fresh jump starts at 7.2 m/s; never cut that jump velocity to our
  // slower cruising limit. Once falling, the burn slows and then lifts.
  if(body.vz<JET_MAX_ASCENT)body.vz=Math.min(JET_MAX_ASCENT,body.vz+JET_ACCEL*dt);
  body.jetActive=true;
  return true;
 }
 body.jetActive=false;
 return false;
}
