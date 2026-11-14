import {controllerActions} from './gamepad.js';

// Keep capture through the release of fire, charge and turn. Left-stick
// locomotion is independent of the pointer and never needs to rearm here.
function wristInputsNeutral(pad) {
 return !pad || !(pad.fire || pad.firePressed || pad.pointerPressed || pad.charge > 0 ||
  pad.alternate != null || Math.abs(pad.turn || 0) > .01 || pad.actions?.length);
}

// One authoritative update. Rendering never advances gameplay.
export function stepImmersive(game, spatial, pad, settings, dt, {map = () => {}, reset = () => {}} = {}) {
 const {rig, pose} = spatial, playing = game.mode === 'playing';
 let target = null, captured = false;
 // X is a deliberate map shortcut. Keep left-stick locomotion but suppress
 // turn/fire/thrust on the opening or closing frame before rig preparation.
 const mapShortcut=playing&&pad?.actions?.includes('map')&&!!spatial.toggleWristMap;
 const movementPad=mapShortcut?{...pad,turn:0,sprint:false,fire:false,firePressed:false,pointerPressed:false,alternate:null,charge:0,actions:[]}:pad;
 const input = rig.prepare(game, pose, movementPad, settings, dt, playing, () => {
  target = playing ? spatial.pointerTarget?.(pad) : null;
  captured = !!target || !!rig.uiWristOpen || (!!rig.uiCaptured && !wristInputsNeutral(pad));
  rig.uiCaptured = captured;
  return captured;
 });
 if (rig.trackingJump) { game.clearCombatPose(); return {trackingLost: true, updated: false}; }
 if (!playing) return {updated: false};
 // Handle the dedicated Quest X map edge BEFORE normal wrist capture
 // suppresses combat buttons, so the same X closes the panel reliably.
 if (mapShortcut) {
  spatial.toggleWristMap();
  captured = true; rig.uiCaptured = true;
  input.jetpack = false;
  pad = {...pad,fire:false,firePressed:false,pointerPressed:false,alternate:null,actions:[]};
 }
 if (captured) {
  game.bufferedFire = null; game.charge = 0;
  if (target && pad?.pointerPressed) target.action();
  pad = null;
 }
 if (game.mode !== 'playing') {
  reset();
  rig.finish(game, pose, false);
  return {updated: false};
 }
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
