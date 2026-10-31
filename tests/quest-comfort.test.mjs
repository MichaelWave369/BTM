import test from 'node:test';
import assert from 'node:assert/strict';
import {TouchInput,VR_CONTROLS} from '../src/vr-input.js';
import {immersiveSettings} from '../src/immersive-rig.js';
import {equipmentSettings} from '../src/equipment-math.js';
import {visualLeftPose} from '../src/left-hand-pose.js';
import {oriVisualTarget} from '../src/ori-comfort.js';
const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,.3,1.4,-.5,1]);
test('default immersive turning is smooth while explicit snap preference survives',()=>{
 assert.equal(immersiveSettings({}).vrTurnMode,'smooth');
 assert.equal(immersiveSettings({vrTurnMode:'snap'}).vrTurnMode,'snap');
 assert.equal(immersiveSettings({vrTurnMode:'notreal'}).vrTurnMode,'smooth');
});
test('Quest right-stick diagonal motion turns but does not cycle weapons',()=>{
 const buttons=()=>Array.from({length:17},()=>({pressed:false,value:0}));
 const right={handedness:'right',profiles:['oculus-touch-v3'],gamepad:{mapping:'xr-standard',buttons:buttons(),axes:[0,0,0,0]}};
 const left={handedness:'left',profiles:['oculus-touch-v3'],gamepad:{mapping:'xr-standard',buttons:buttons(),axes:[0,0,0,0]}};
 const t=new TouchInput();t.poll([left,right],.016,{},true);
 right.gamepad.axes[2]=.95;right.gamepad.axes[3]=.85;
 let state=t.poll([left,right],.016,{},true);
 assert.equal(state.ready,true);assert(state.turn>.1);assert(!state.actions.includes('previous'));assert(!state.actions.includes('next'));
 right.gamepad.axes[2]=-.95;right.gamepad.axes[3]=-.99;
 state=t.poll([left,right],.016,{},true);
 assert(state.turn<-.1);assert(!state.actions.includes('previous'));assert(!state.actions.includes('next'));
 assert(VR_CONTROLS.some(x=>x[0]==='WRIST ARSENAL'));
});
test('calibration offsets sanitize and retain independent user settings',()=>{
 const settings=equipmentSettings({vrLeftHandPitch:999,vrLeftHandRoll:-999,vrLeftHandYaw:15,vrWristTopOffset:5,vrOriScale:12,vrOriPeripheral:false});
 assert.equal(settings.vrLeftHandPitch,65);assert.equal(settings.vrLeftHandRoll,-90);assert.equal(settings.vrLeftHandYaw,15);
 assert.equal(settings.vrWristTopOffset,.08);assert.equal(settings.vrOriScale,1);assert.equal(settings.vrOriPeripheral,false);
});
test('visual left hand rotation never mutates the original tracked pose or its origin',()=>{
 const tracked=identity(),original=Float32Array.from(tracked),out=new Float32Array(16);
 visualLeftPose(out,tracked,{vrLeftHandPitch:-30,vrLeftHandYaw:15,vrLeftHandRoll:20});
 assert.deepEqual(tracked,original);
 assert.equal(out[12],tracked[12]);assert.equal(out[13],tracked[13]);assert.equal(out[14],tracked[14]);
 assert(Math.abs(out[5]-1)>.05);
 visualLeftPose(out,tracked,{vrLeftHandPitch:0,vrLeftHandYaw:0,vrLeftHandRoll:0});
 assert.deepEqual(out,tracked);
});
test('Ori is moved to peripheral view without altering simulation coordinates',()=>{
 const head=identity(),eye=[0,1.65,0];
 const central={eye,head,x:0,z:-.9};
 const out=oriVisualTarget(central);
 assert(Math.abs(out.x)>.5);assert(Math.hypot(out.x-eye[0],out.z-eye[2])>=1.49);
 assert.equal(central.x,0);assert.equal(central.z,-.9);
 assert.deepEqual(oriVisualTarget({...central,peripheral:false}),{x:0,z:-.9});
});
test('Ori stays in a bounded right peripheral dock even when the simulation is far away',()=>{
 const eye=[0,1.65,0],head=identity();
 const out=oriVisualTarget({eye,head,x:3.5,z:-2.2});
 assert(out.x>.6);assert(out.z<-.8);assert(Math.hypot(out.x,out.z)<2.4);
});
