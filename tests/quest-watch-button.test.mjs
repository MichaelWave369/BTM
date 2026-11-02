import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './immersive-checks.js';
import {stepImmersive} from '../src/immersive-play.js';
import {equipmentSettings,WristComputer} from '../src/equipment-math.js';
import {wristPose} from './equipment-checks.js';
import {readFileSync} from 'node:fs';

const advance=(w,r,start=0,end=650)=>{for(let time=start;time<=end;time+=25)w.update(r,{},time);return w;};

test('turning a raised wrist for a full second does not auto-open or stop gameplay',()=>{
 const r=wristPose(),w=advance(new WristComputer(),r,0,1500);
 assert(w.watchReady,'raised synthetic watch should be ready for a click');
 assert(!w.requested&&!w.visible&&!w.pinned);
 for(const legacy of ['gaze','raised','manual'])
  assert.equal(equipmentSettings({vrWristActivation:legacy}).vrWristActivation,'button');
});

test('clicking the wrist button opens directly above cuff without tether lines',()=>{
 const r=wristPose(),w=advance(new WristComputer(),r);
 assert(w.canToggle(r,{}));
 w.togglePin();advance(w,r,675,1100);
 assert(w.visible&&w.requested&&w.open>.8);
 const distance=Math.hypot(...w.panel.center.map((v,i)=>v-w.status.center[i]));
 assert(distance<.56,'menu is anchored to the watch, not projected to the far field');
 assert(w.panel.center[1]>w.status.center[1]+.12);
 const scene=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 assert(!scene.includes('rig.equipmentLink'),'no two decorative tether lines');
});

test('an intentionally open watch freezes game clock and held locomotion',()=>{
 const f=fixture(),initialTime=f.g.time,initialPosition=[f.g.player.x,f.g.player.y];
 f.pad.moveForward=1;f.pad.turn=.8;f.pad.fire=true;f.pad.pointerPressed=true;
 let pressed=0;
 const shown=stepImmersive(f.g,{rig:f.rig,pose:f.pose,pointerTarget:()=>{
   f.rig.uiWristOpen=true;return {action:()=>pressed++};
 }},f.pad,{},.025);
 assert.equal(pressed,1);
 assert.equal(shown.wristPaused,true);
 assert.equal(f.g.time,initialTime);
 assert.equal(f.g.shots,0);
 assert.deepEqual([f.g.player.x,f.g.player.y],initialPosition);
});

test('closing watch resumes held walking after right trigger release',()=>{
 const f=fixture();f.pad.moveForward=1;f.pad.fire=true;f.pad.pointerPressed=true;
 stepImmersive(f.g,{rig:f.rig,pose:f.pose,pointerTarget:()=>{
   f.rig.uiWristOpen=true;return {action:()=>{}};
 }},f.pad,{},.025);
 const when=f.g.time;
 f.pad.fire=false;f.pad.firePressed=false;f.pad.pointerPressed=false;
 f.pad.actions=[];f.pad.charge=0;f.pad.alternate=null;
 const res=stepImmersive(f.g,{rig:f.rig,pose:f.pose,pointerTarget:()=>{
   f.rig.uiWristOpen=false;return null;
 }},f.pad,{},.025);
 assert.equal(res.uiCaptured,false);
 assert.equal(res.updated,true);
 assert(f.g.time>when);
 assert.equal(f.g.shots,0);
 assert(f.g.moving||Math.abs(f.rig.input.moveForward)>0,'held left stick resumes without neutral');
});

test('the watch button is separately targeted, while left grip remains the Ori action',()=>{
 const renderer=readFileSync(new URL('../src/vr-world-renderer.js',import.meta.url),'utf8');
 assert(renderer.includes('selected.u>=.50&&selected.v>=.70&&selected.v<=.97'));
 assert(!renderer.includes("pad?.actions?.includes('ori')&&ui.wrist.canToggle"));
 const ui=readFileSync(new URL('../src/world-ui.js',import.meta.url),'utf8');
 assert(ui.includes("'OPEN MENU'")&&ui.includes("'CLOSE MENU'"));
});
