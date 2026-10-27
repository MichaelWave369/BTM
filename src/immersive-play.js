import {controllerActions} from './gamepad.js';
// One authoritative update. Rendering never advances gameplay.
export function stepImmersive(game,spatial,pad,settings,dt,{map=()=>{},reset=()=>{}}={}){
 const {rig,pose}=spatial,playing=game.mode==='playing',input=rig.prepare(game,pose,pad,settings,dt,playing);
 if(rig.trackingJump){game.clearCombatPose();return {trackingLost:true,updated:false};}
 if(!playing)return {updated:false};
 const target=spatial.pointerTarget?.();if(target){if(pad){pad.fire=false;pad.firePressed=false;pad.alternate=null;}if(pad?.pointerPressed){target.action();reset();}}
 if(game.mode!=='playing'){rig.finish(game,pose,false);return {updated:false};}
 game.charge=pad?.charge||0;input.fire=!!pad?.fire;game.update(dt,input);rig.finish(game,pose,game.mode==='playing');
 if(game.mode==='playing'&&pad?.ready){controllerActions(game,pad,{map,fire:false,dodgeAngle:rig.moveAngle});rig.finish(game,pose,true);if(pad.firePressed)game.requestFire();if(pad.alternate!=null)game.requestFire(true,pad.alternate);game.advanceCombat(dt,pad.fire);}
 else if(game.mode==='playing')game.advanceCombat(dt,false);
 return {updated:true};
}
