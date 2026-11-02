import {controllerActions} from './gamepad.js';

// Input capture survives leaving a panel until every gameplay control is neutral.
// Physical head motion still goes through the rig's collision-safe sweep.
export function immersivePadNeutral(pad) {
 return !pad || !(pad.fire || pad.firePressed || pad.pointerPressed || pad.charge > 0 ||
  pad.alternate != null || pad.sprint || Math.abs(pad.turn || 0) > .01 ||
  Math.abs(pad.moveForward || 0) > .01 || Math.abs(pad.moveStrafe || 0) > .01 || pad.actions?.length);
}

// One authoritative update. Rendering never advances gameplay.
export function stepImmersive(game, spatial, pad, settings, dt, {map = () => {}, reset = () => {}} = {}) {
 const {rig, pose} = spatial, playing = game.mode === 'playing';
 let target = null, captured = false;
 const input = rig.prepare(game, pose, pad, settings, dt, playing, () => {
  target = playing ? spatial.pointerTarget?.(pad) : null;
  rig.uiCaptured = !!target || !!rig.uiCaptured && !immersivePadNeutral(pad);
  // Resume held walking when the watch is closed and fire/abilities have
  // been released. No phantom menu may strand the movement stick.
  if(rig.uiWristOpen)rig.wristRearm=true;
  else if(rig.wristRearm&&!pad?.fire&&!pad?.firePressed&&!pad?.pointerPressed&&
          !(pad?.charge>0)&&pad?.alternate==null&&!pad?.actions?.length){
   rig.uiCaptured=!!target;rig.wristRearm=false;
  }
  captured = rig.uiCaptured;
  return captured;
 });
 if (rig.trackingJump) { game.clearCombatPose(); return {trackingLost: true, updated: false}; }
 if (!playing) return {updated: false};
 if (captured) {
  game.bufferedFire = null; game.charge = 0;
  if (target && pad?.pointerPressed) { target.action(); reset(); }
  pad = null;
 }
 if (game.mode !== 'playing') { rig.finish(game, pose, false); return {updated: false}; }
 // The watch itself is a deliberate tactical pause. Controls stay clickable
 // while enemies, projectiles, timers and damage stop advancing.
 if(rig.uiWristOpen){game.bufferedFire=null;game.charge=0;return {updated:false,uiCaptured:true,wristPaused:true};}
 game.charge = pad?.charge || 0;
 input.fire = !!pad?.fire;
 game.update(dt, input); rig.finish(game, pose, game.mode === 'playing');
 if (game.mode === 'playing' && pad?.ready) {
  controllerActions(game, pad, {map, fire: false, dodgeAngle: rig.moveAngle});
  rig.finish(game, pose, true);
  if (pad.firePressed) game.requestFire();
  if (pad.alternate != null) game.requestFire(true, pad.alternate);
  game.advanceCombat(dt, pad.fire);
 } else if (game.mode === 'playing') game.advanceCombat(dt, false);
 return {updated: true, uiCaptured: captured};
}
