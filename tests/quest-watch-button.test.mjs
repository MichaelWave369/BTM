import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './immersive-checks.js';
import {stepImmersive} from '../src/immersive-play.js';
import {equipmentSettings,WristComputer} from '../src/equipment-math.js';
import {wristPose} from './equipment-checks.js';
import {readFileSync} from 'node:fs';
import {matIdentity} from '../src/immersive-math.js';
import {hitPanel} from '../src/vr-math.js';
import {TouchInput} from '../src/vr-input.js';
import {xrSource} from './vr-checks.js';

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

const closeVector=(a,b,description,epsilon=1e-4)=>{
 assert.equal(a.length,b.length);
 for(let i=0;i<a.length;i++)assert(Math.abs(a[i]-b[i])<epsilon,
  description+' axis '+i+' expected '+b[i]+' got '+a[i]);
};

test('headset yaw and head motion cannot drag or dismiss a clicked wrist screen',()=>{
 const r=wristPose(),w=advance(new WristComputer(),r);
 w.togglePin();advance(w,r,675,1100);
 const original={center:w.panel.center.slice(),right:w.panel.right.slice(),up:w.panel.up.slice(),normal:w.panel.normal.slice()};
 // Turn the headset 180 degrees while the left hand stays exactly still.
 // Opening required gaze, but holding the menu must not.
 r.headWorld[0]=-1;r.headWorld[10]=-1;
 advance(w,r,1125,1550);
 assert.equal(w.watchReady,false,'headset no longer looks at the watch');
 assert(w.pinned&&w.requested&&w.visible,'a head turn does not dismiss or interrupt the menu');
 closeVector(w.panel.center,original.center,'head yaw preserves wrist-anchored position');
 closeVector(w.panel.right,original.right,'head yaw preserves menu right');
 closeVector(w.panel.up,original.up,'head yaw preserves menu up');
 closeVector(w.panel.normal,original.normal,'head yaw preserves menu normal');
 // A small physical head translation also cannot alter the wrist transform.
 r.eye[0]+=.06;r.eye[1]+=.03;
 w.update(r,{},1575);
 assert(w.requested);
 closeVector(w.panel.center,original.center,'head translation preserves panel position');
});

test('menu follows wrist translation and rotation in the watch coordinate system',()=>{
 const r=wristPose(),w=advance(new WristComputer(),r);
 w.togglePin();advance(w,r,675,1100);
 const before=w.panel.center.slice(),watch=w.status.center.slice();
 const shift=[.06,.02,-.04];
 for(let i=0;i<3;i++)r.leftWorld[12+i]+=shift[i];
 w.update(r,{},1125);
 closeVector(w.panel.center,before.map((v,i)=>v+shift[i]),'panel follows hand translation');
 closeVector(w.status.center,watch.map((v,i)=>v+shift[i]),'watch follows hand translation');
 // Twist the real wrist around its watch-facing axis without touching the
 // head matrix. Panel axes must rotate exactly with the small watch.
 const m=r.leftWorld,axisX=[m[0],m[1],m[2]],axisZ=[m[8],m[9],m[10]];
 const c=Math.cos(.19),s=Math.sin(.19);
 for(let i=0;i<3;i++){m[i]=axisX[i]*c+axisZ[i]*s;m[8+i]=-axisX[i]*s+axisZ[i]*c;}
 w.update(r,{},1150);
 const p=w.panel,status=w.status,gap=(status.height+p.height)*.5+ .065;
 closeVector(p.right,status.right,'panel right tracks watch');
 closeVector(p.up,status.up,'panel up tracks watch');
 closeVector(p.normal,status.normal,'panel normal tracks watch');
 closeVector(p.center,status.center.map((v,i)=>v+status.up[i]*gap+status.normal[i]*.014),
  'hinge stays just above watch');
 assert(w.requested,'a small wrist movement preserves deliberate menu activation');
 assert(Math.hypot(...p.center.map((v,i)=>v-status.center[i]))<.28,
  'the whole menu remains physically near the watch');
});

test('right-controller ray reaches wrist-mounted panel with valid UV coordinates',()=>{
 const r=wristPose(),w=advance(new WristComputer(),r);
 w.togglePin();advance(w,r,675,1100);
 const p=w.panel,ray=matIdentity();
 for(const [u,v] of [[.5,.5],[.18,.24],[.84,.82]]){
  const point=p.center.map((x,i)=>x+p.right[i]*(u-.5)*p.width+p.up[i]*(.5-v)*p.height);
  for(let i=0;i<3;i++){ray[12+i]=point[i]+p.normal[i]*.38;ray[8+i]=p.normal[i];}
  const hit=hitPanel(ray,p);
  assert(hit,'right-trigger selection ray must intersect actual menu');
  assert(Math.abs(hit.u-u)<1e-5&&Math.abs(hit.v-v)<1e-5,
   'stereo/UI hit region must stay aligned with hand-locked panel');
 }
});

test('Touch keeps walking through watch hover, open, selection and close',()=>{
 const {g,rig,pose}=fixture(),input=new TouchInput(),left=xrSource('left'),right=xrSource('right');
 const sources=[left,right],trigger=right.gamepad.buttons[0];
 const aim=g.player.a;
 let open=false,selected=0,target={action:()=>{open=true;}};
 const spatial={rig,pose,pointerTarget:()=>{rig.uiWristOpen=open;return target;}};
 input.poll(sources,.025);
 left.gamepad.axes[3]=-1;
 const walk=()=>{
  const y=g.player.y,time=g.time;
  const result=stepImmersive(g,spatial,input.poll(sources,.025),{},.025);
  assert(g.player.y<y,'held left stick keeps moving');
  assert(g.time>time,'the world advances while using Fieldlink');
  return result;
 };
 assert(walk().uiCaptured,'hover reserves the trigger for the watch');
 trigger.pressed=true;walk();assert(open);
 target={action:()=>{selected++;}};
 walk();assert.equal(selected,0,'holding the opening press cannot select again');
 trigger.pressed=false;walk();
 right.gamepad.axes[2]=1;
 trigger.pressed=true;walk();assert.equal(selected,1);
 assert.equal(g.player.a,aim,'the right stick is blocked during capture');
 trigger.pressed=false;right.gamepad.axes[2]=0;walk();
 target={action:()=>{open=false;}};
 trigger.pressed=true;walk();assert.equal(open,false);
 target=null;assert(walk().uiCaptured,'the closing press still owns the trigger');
 assert.equal(g.shots,0);
 trigger.pressed=false;assert.equal(walk().uiCaptured,false);
 trigger.pressed=true;walk();assert.equal(g.shots,1,'a fresh press fires with the left stick held');
});

test('an open watch captures combat even without a pointer target',()=>{
 const f=fixture(),aim=f.g.player.a,ori=f.g.player.ori;
 f.pad.fire=f.pad.firePressed=true;f.pad.alternate=.8;f.pad.actions=['ori'];f.pad.turn=1;
 const result=stepImmersive(f.g,{rig:f.rig,pose:f.pose,pointerTarget:()=>{
  f.rig.uiWristOpen=true;return null;
 }},f.pad,{},.025);
 assert(result.uiCaptured);
 assert.equal(f.g.player.a,aim);
 assert.equal(f.g.player.ori,ori);
 assert.equal(f.g.shots,0);
});

test('leaving the watch consumes an in-progress charge through its release',()=>{
 const f=fixture();let target={action:()=>{}};
 const spatial={rig:f.rig,pose:f.pose,pointerTarget:()=>target};
 f.pad.charge=.4;stepImmersive(f.g,spatial,f.pad,{},.025);
 target=null;f.pad.charge=0;f.pad.alternate=.4;
 assert(stepImmersive(f.g,spatial,f.pad,{},.025).uiCaptured);
 assert.equal(f.g.shots,0);
 f.pad.alternate=null;
 assert.equal(stepImmersive(f.g,spatial,f.pad,{},.025).uiCaptured,false);
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
