import test from 'node:test';
import assert from 'node:assert/strict';
import {matIdentity} from '../src/immersive-math.js';
import {visualLeftPose} from '../src/left-hand-pose.js';
import {equipmentSettings,WristComputer} from '../src/equipment-math.js';
import {handMesh} from '../src/equipment-meshes.js';

const pose=()=>{
 const tracked=matIdentity();
 tracked[12]=-.22;tracked[13]=1.4;tracked[14]=-.5;
 return tracked;
};
const rigFor=(tracked,profile='palm')=>{
 const head=matIdentity();head[13]=1.65;
 const visual=matIdentity();visualLeftPose(visual,tracked,equipmentSettings({vrLeftHandPresentation:profile}));
 return {hasLeft:true,hasVisualLeft:true,leftWorld:tracked,leftVisualWorld:visual,headWorld:head,eye:[0,1.65,0]};
};
function advance(w,r,settings={},start=0,stop=650){
 for(let time=start;time<=stop;time+=25)w.update(r,settings,time);
 return w;
}

test('open palm is the default visual profile and Classic restores the previous transform',()=>{
 const tracked=pose(),original=Array.from(tracked),palm=matIdentity(),classic=matIdentity();
 const a=equipmentSettings({}),b=equipmentSettings({vrLeftHandPresentation:'classic'});
 assert.equal(a.vrLeftHandPresentation,'palm');
 assert.equal(b.vrLeftHandPresentation,'classic');
 assert.equal(equipmentSettings({vrLeftHandPresentation:'invalid'}).vrLeftHandPresentation,'palm');
 visualLeftPose(palm,tracked,a);visualLeftPose(classic,tracked,b);
 assert.deepEqual(Array.from(tracked),original,'the tracked Touch grip must not be modified');
 assert.deepEqual(Array.from(palm.slice(12,16)),Array.from(tracked.slice(12,16)));
 assert.deepEqual(Array.from(classic.slice(12,16)),Array.from(tracked.slice(12,16)));
 assert(Math.abs(palm[5]-classic[5])>.1,'palm rendering must not be the same gun-pose transform');
 const toward=[.22,.25,.5],norm=Math.hypot(...toward);
 const facing=m=>(m[4]*toward[0]+m[5]*toward[1]+m[6]*toward[2])/norm;
 assert(facing(palm)>facing(classic)+.15,'the open palm must face the viewer better than the gun posture');
 const watch=matIdentity();visualLeftPose(watch,tracked,a,1);
 assert.deepEqual(Array.from(watch),Array.from(classic),'full physical watch turn hands control back to the tracked grip');
 const noAdjust=matIdentity();visualLeftPose(noAdjust,tracked,{vrLeftHandPitch:0,vrLeftHandYaw:0,vrLeftHandRoll:0});
 assert.deepEqual(Array.from(noAdjust),original,'legacy caller with explicit zero calibration stays neutral');
});

test('left palm has open fingers and separate palm plating; right weapon glove stays unchanged',()=>{
 const palm=handMesh('left','combat','palm'),rest=handMesh('left','combat','relaxed');
 const right=handMesh('right','combat','grip');
 assert(palm.vertexCount>rest.vertexCount,'additional palm pads must be real mesh geometry');
 assert.equal(right,handMesh('right','combat','grip'));
 assert.equal(palm.data.length,palm.vertexCount*9);
 assert([...palm.data].every(Number.isFinite));
});

test('rotating a wrist never opens Fieldlink without pressing its button',()=>{
 const tracked=pose(),r=rigFor(tracked),w=new WristComputer();
 advance(w,r,{},0,675);assert(!w.requested&&!w.visible);
 const turn=65*Math.PI/180;
 tracked[5]=Math.cos(turn);tracked[6]=Math.sin(turn);
 tracked[9]=-Math.sin(turn);tracked[10]=Math.cos(turn);
 visualLeftPose(r.leftVisualWorld,tracked,equipmentSettings(),1);
 advance(w,r,{},700,1400);
 assert(w.watchFacing>.57&&w.watchReady);
 assert(!w.visible&&!w.requested,'watch turning must NOT open the menu');
 w.togglePin();advance(w,r,{},1425,1925);
 assert(w.visible&&w.requested);
 const delta=w.panel.center.map((x,i)=>x-w.status.center[i]);
 assert(Math.hypot(...delta)<.56&&delta[1]>.12,'menu must be directly above its cuff');
 tracked[5]=1;tracked[6]=0;tracked[9]=0;tracked[10]=1;
 advance(w,r,{},1950,2550);
 assert(!w.requested&&!w.visible&&!w.pinned);
});

test('explicit watch button survives glove choice without changing controller poses',()=>{
 const tracked=pose(),r=rigFor(tracked,'classic'),w=new WristComputer();
 const rightRay=matIdentity(),savedRight=Array.from(rightRay);
 advance(w,r,{},0,650);assert(!w.visible);
 const turn=65*Math.PI/180;
 tracked[5]=Math.cos(turn);tracked[6]=Math.sin(turn);
 tracked[9]=-Math.sin(turn);tracked[10]=Math.cos(turn);
 advance(w,r,{},675,750);
 assert(w.canToggle(r,{}));
 const original=Array.from(tracked);
 w.togglePin();advance(w,r,{},775,1225);
 assert(w.visible&&w.pinned);
 assert.deepEqual(Array.from(tracked),original);
 assert.deepEqual(Array.from(rightRay),savedRight);
});
