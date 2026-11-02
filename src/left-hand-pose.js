/**
 * Separate visual alignment for the left controller's glove and wrist.
 * The source tracked pose remains authoritative for real controller input.
 * Rotations are local to the tracked grip, applied without allocations.
 */
const radians = n => (Number.isFinite(n)?n:0)*Math.PI/180;
export function visualLeftPose(out,tracked,settings={}){
 if(!out||!tracked||out.length!==16||tracked.length!==16)throw Error('Expected 4x4 poses');
 if(out!==tracked)out.set(tracked);
 // Correct the visual-only Quest Touch gun-grip posture into a relaxed,
 // palm-presenting left hand. The player's calibrated pitch still applies;
 // 'classic' restores its original appearance without moving tracked input.
 const pitch=radians((settings.vrLeftHandPitch??20)+(settings.vrLeftHandPresentation==='palm'?-45:0));
 const yaw=radians(settings.vrLeftHandYaw??0);
 const roll=radians(settings.vrLeftHandRoll??0);
 if(pitch){
  const c=Math.cos(pitch),s=Math.sin(pitch);
  for(let i=0;i<3;i++){const y=out[4+i],z=out[8+i];out[4+i]=y*c+z*s;out[8+i]=-y*s+z*c;}
 }
 if(yaw){
  const c=Math.cos(yaw),s=Math.sin(yaw);
  for(let i=0;i<3;i++){const x=out[i],z=out[8+i];out[i]=x*c-z*s;out[8+i]=x*s+z*c;}
 }
 if(roll){
  const c=Math.cos(roll),s=Math.sin(roll);
  for(let i=0;i<3;i++){const x=out[i],y=out[4+i];out[i]=x*c+y*s;out[4+i]=-x*s+y*c;}
 }
 // Visual rotations never move the tracked grip's world-space anchor.
 for(let i=12;i<16;i++)out[i]=tracked[i];
 return out;
}
