import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TouchInput,VR_CONTROLS} from '../src/vr-input.js';
import {xrSource} from './vr-checks.js';
import {WristComputer} from '../src/equipment-math.js';
import {wristPose} from './equipment-checks.js';
import {fixture} from './immersive-checks.js';
import {stepImmersive} from '../src/immersive-play.js';
import {controllerActions} from '../src/gamepad.js';
import {Game} from '../src/core.js';

test('Quest X/Y/B/A map/reload/jump/dash preserve grip interaction, fire and airborne sprint',()=>{
 const input=new TouchInput(),l=xrSource('left'),r=xrSource('right'),sources=[l,r];
 input.poll(sources,.025);
 const tap=(hand,index,action)=>{
  const button=(hand==='left'?l:r).gamepad.buttons[index];
  button.pressed=true;
  const press=input.poll(sources,.025),held=input.poll(sources,.025);
  assert(press.actions.includes(action),hand+' '+index+' = '+action);
  assert(!held.actions.includes(action),'held '+action+' should not repeat');
  button.pressed=false;input.poll(sources,.025);
  return press;
 };
 const x=tap('left',4,'map');
 assert(!x.actions.includes('reload')&&!x.actions.includes('vision'));
 const y=tap('left',5,'reload');
 assert(!y.actions.includes('jump')&&!y.actions.includes('vision'));
 const b=tap('right',5,'jump');
 assert(!b.actions.includes('dodge')&&!b.actions.includes('help'));
 const a=tap('right',4,'dodge');
 assert(!a.actions.includes('interact'));
 tap('right',1,'interact');
 tap('left',1,'ori');
 r.gamepad.buttons[0].pressed=true;
 const fire=input.poll(sources,.025);assert(fire.fire&&fire.pointerPressed);
 r.gamepad.buttons[0].pressed=false;input.poll(sources,.025);
 l.gamepad.buttons[3].pressed=true;
 assert.equal(input.poll(sources,.025).sprint,true,'L3 held sprint / aerial thrust');
 assert(VR_CONTROLS.some(([input,action])=>input==='A / B / X / Y'&&action==='DASH / JUMP / WRIST MAP / RELOAD'));
 assert(VR_CONTROLS.some(([input,action])=>input==='RIGHT STICK CLICK'&&action.includes('NEXT WEAPON')));
});

test('X opens a tracked left wrist map without a watch-gaze click and closes on second press',()=>{
 const rig=wristPose(),w=new WristComputer();
 for(let t=0;t<=600;t+=25)w.update(rig,{},t);
 assert.equal(w.requested,false,'no gaze-only summon');
 assert.equal(w.toggleMap(),true);
 for(let t=625;t<=1000;t+=25)w.update(rig,{},t);
 assert(w.requested&&w.visible&&!w.pinned);
 const original=w.panel.center.slice(),initial=rig.leftWorld[13];
 rig.leftWorld[13]-=.30;
 for(let t=1025;t<=1400;t+=25)w.update(rig,{},t);
 assert(!w.watchReady,'looking away/lowering need not dismiss an explicit map');
 assert(w.requested&&w.visible,'X-opened map remains requested');
 assert(Math.abs(w.panel.center[1]-(original[1]-.30))<.00001,'wrist map stays on arm');
 assert.equal(w.toggleMap(),false);
 for(let t=1425;t<=1775;t+=25)w.update(rig,{},t);
 assert(!w.requested&&!w.visible,'second press closes it');
 assert.equal(w.mapRequested,false);
 rig.leftWorld[13]=initial;
 w.toggleMap();w.update(rig,{vrHudVisible:false},1800);
 assert(!w.requested&&!w.visible,'hiding headset UI wins over map shortcut');
});

test('map X toggles even under wrist capture, consumes simultaneous fire and does not rotate player',()=>{
 const f=fixture();f.g.start({verticalPreview:true});
 let opened=false,toggles=0,clicked=0;
 const spatial={rig:f.rig,pose:f.pose,pointerTarget:()=>{f.rig.uiWristOpen=opened;return opened?{action:()=>{clicked++;}}:null;},
  toggleWristMap:()=>{opened=!opened;toggles++;return opened;}};
 const before=f.g.player.a;
 f.pad.actions=['map'];f.pad.turn=1;f.pad.fire=true;f.pad.firePressed=true;f.pad.pointerPressed=true;
 let res=stepImmersive(f.g,spatial,f.pad,{},.025);
 assert(res.uiCaptured&&opened&&toggles===1);
 assert.equal(clicked,0);assert.equal(f.g.shots,0);
 assert.equal(f.g.player.a,before,'X opening map should suppress a simultaneous turn');
 f.pad.actions=[];f.pad.turn=0;f.pad.fire=false;f.pad.firePressed=false;f.pad.pointerPressed=false;
 res=stepImmersive(f.g,spatial,f.pad,{},.025);
 assert(res.uiCaptured,'wrist map captures combat behind its surface');
 f.pad.actions=['map'];f.pad.fire=true;f.pad.pointerPressed=true;
 res=stepImmersive(f.g,spatial,f.pad,{},.025);
 assert.equal(opened,false);assert.equal(toggles,2);
 assert.equal(f.g.shots,0,'close button cannot fire weapon behind map');
 f.pad.actions=[];f.pad.fire=false;f.pad.pointerPressed=false;
 stepImmersive(f.g,spatial,f.pad,{},.025);
 assert.equal(toggles,2,'no repeat when X is released');
});

test('Quest B calls one-shot jump and A calls directional dash during gameplay',()=>{
 const f=fixture();f.g.start({verticalPreview:true});
 const s={rig:f.rig,pose:f.pose,pointerTarget:()=>null};
 f.pad.actions=['jump'];f.pad.fire=false;
 stepImmersive(f.g,s,f.pad,{},.025);
 assert(f.g.player.jumpBuffer>0,'right B produces an actual jump request');
 const originalFuel=f.g.player.jetFuel;
 f.pad.actions=[];f.pad.sprint=true;
 stepImmersive(f.g,s,f.pad,{},.025);
 assert(f.g.player.jetFuel<originalFuel,'L3 held in flight starts jetpack');
 f.pad.actions=['dodge'];f.pad.sprint=false;f.pad.moveStrafe=1;
 const oldCooldown=f.g.dodgeCooldown;
 stepImmersive(f.g,s,f.pad,{},.025);
 assert(f.g.dodgeCooldown>oldCooldown,'right A activates the existing dash');
});

test('source wiring keeps the standard Xbox controller, UI pointer and offline shell intact',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/vr-input.js').includes('buttons[8]=face(left,4)'));
 assert(read('src/vr-input.js').includes('buttons[11]=face(right,5)'));
 assert(read('src/vr-input.js').includes('buttons[2]=face(left,5)'));
 assert(read('src/vr-input.js').includes('buttons[1]=face(right,4)'));
 assert(read('src/vr-world-renderer.js').includes('toggleWristMap(rig)'));
 assert(read('src/vr.js').includes('toggleWristMap:()=>this.presenter.toggleWristMap'));
 assert(read('src/world-ui.js').includes('data.map||this.wrist.mapRequested'));
 assert(read('src/immersive-play.js').includes('spatial.toggleWristMap()'));
 assert(read('src/gamepad.js').includes("if(action==='jump')game.jump()"));
 const controls=read('tests/controller-checks.js');
 assert(controls.includes("[2,'reload']")&&controls.includes("[3,'ori']"),'Xbox X reload and Y Ori stay unchanged');
 assert(read('scripts/build.mjs').includes("'./src/solo-jetpack.js'"));
 const manual=read('index.html');
 assert(manual.includes('R3 TAP')&&manual.includes('R3 HOLD'));
 assert(manual.includes('Right grip uses nearby targets')&&manual.includes('left Y reloads'));
 assert(!manual.includes('B dashes/bashes, X reloads, Y reveals secrets'));

});

test('Quest R3 quick tap cycles weapons exactly once; long hold pauses without cycling',()=>{
 const input=new TouchInput(),l=xrSource('left'),r=xrSource('right'),sources=[l,r];
 input.poll(sources,.025);const stick=r.gamepad.buttons[3];
 // No weapon cycling from a stick turn or diagonal aim.
 r.gamepad.axes[2]=1;r.gamepad.axes[3]=-1;
 for(let i=0;i<8;i++)assert(!input.poll(sources,.025).actions.includes('next'));
 r.gamepad.axes[2]=r.gamepad.axes[3]=0;
 stick.pressed=true;
 for(let i=0;i<5;i++)assert(!input.poll(sources,.025).actions.includes('next'));
 stick.pressed=false;
 const next=input.poll(sources,.025);
 assert(next.actions.includes('next')&&!next.actions.includes('pause'));
 assert(!input.poll(sources,.025).actions.includes('next'),'release cannot repeat');
 stick.pressed=true;let pauses=0,cycles=0;
 for(let i=0;i<30;i++){
  const pad=input.poll(sources,.025);
  pauses+=pad.actions.includes('pause')?1:0;cycles+=pad.actions.includes('next')?1:0;
 }
 assert.equal(pauses,1,'long hold causes one pause edge');
 assert.equal(cycles,0);
 stick.pressed=false;
 const after=input.poll(sources,.025);
 assert(!after.actions.includes('next'),'releasing long hold cannot change weapons');
 input.reset();
 const fresh=input.poll(sources,.025);
 assert(!fresh.actions.includes('pause')&&!fresh.actions.includes('next'),'reset discards pending tap');
});

test('Quest button map triggers real reload and weapon cycling without affecting Xbox',()=>{
 const game=new Game();game.start({verticalPreview:true});
 const g=game;
 g.selectWeapon(1);
 g.player.energy=100;g.player.reserve=100;
 g.player.energy=30;
 controllerActions(g,{actions:['reload']},{fire:false});
 assert(g.recharge>0||g.player.energy>30,'Y reload uses the original game recharge path');
 const before=g.weapon;
 controllerActions(g,{actions:['next']},{fire:false});
 assert.equal(g.weapon,(before+1)%g.unlocked);
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/gamepad.js').includes("reload:[2]"));
 assert(read('src/gamepad.js').includes("next:[5,15]"));
});
