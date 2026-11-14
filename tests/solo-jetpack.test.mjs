import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {gameplayInput} from '../src/gamepad.js';
import {initVerticalBody,advanceVerticalBody,requestVerticalJump,STACK_HEIGHT,STACK_CEILING} from '../src/net/vertical-arena.js';
import {initSoloJetpack,stepSoloJetpack,validSoloJetpack,JET_FUEL_CAP,JET_BURN,JET_RECHARGE,JET_MAX_ASCENT} from '../src/solo-jetpack.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
const preview=i=>{const g=new Game();g.start({verticalPreview:true});if(i)g.loadLevel(i,false);return g;};

test('all 12 opt-in two-story sectors get fuel without affecting original worlds or extraction',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),p=g.player;
  assert.equal(p.jetFuel,JET_FUEL_CAP,SECTORS[i].name);
  assert.equal(p.jetActive,false);
  assert(validSoloPreviewCheckpoint(g.level,p));
  g.level.relays.forEach(r=>r.active=true);g.player.key=true;
  g.level.enemies.filter(e=>e.type==='warden').forEach(e=>e.dead=true);
  assert(g.exitReady,'jetpack is never a mandatory extraction gate');
  assert.equal(createLevel(i).vertical,undefined);
  assert.equal(createLevel(i,'pit',{verticalPreview:true}).vertical,undefined);
 }
 const original=new Game();original.start(),pit=new Game();pit.startPit();
 assert.equal('jetFuel' in original.player,false);
 assert.equal('jetFuel' in pit.player,false);
 assert.equal('jetActive' in original.player,false);
});

test('boost cannot launch a grounded player; normal jump remains at the original impulse',()=>{
 const g=preview(0),p=g.player,l=g.level;
 const x=p.x,y=p.y;
 for(let i=0;i<50;i++)advanceVerticalBody(l,p,.02,{jetpack:true});
 assert.equal(p.height,0);
 assert.equal(p.jetFuel,100);
 assert.equal(p.jetActive,false);
 assert.equal(p.x,x);assert.equal(p.y,y);
 assert(requestVerticalJump(l,p));
 advanceVerticalBody(l,p,1/120,{jetpack:true});
 assert(p.vz>JET_MAX_ASCENT,'holding boost must never truncate the normal 7.2 jump');
 assert(p.jetFuel<100);
 assert(p.jetActive);
});

test('jet thrust has finite fuel, maintains air strafing and stops when released',()=>{
 const g=preview(1),l=g.level,p=g.player,r=l.vertical.ramp;
 p.x=r.x0+.5;p.y=r.y0+.5;
 assert(requestVerticalJump(l,p));
 let highest=0,fuelPrevious=100,wasActive=false;
 for(let i=0;i<90;i++){
  const oldX=p.x,oldY=p.y;
  advanceVerticalBody(l,p,1/120,{oldX,oldY,jetpack:true});
  highest=Math.max(highest,p.height);
  assert(p.jetFuel<=fuelPrevious+1e-8,'fuel must not refill in flight');
  fuelPrevious=p.jetFuel;if(p.jetActive)wasActive=true;
 }
 assert(wasActive&&highest>.5,'flight extends the original jump');
 assert(p.jetFuel<100);
 const before=p.jetFuel;
 advanceVerticalBody(l,p,.05,{jetpack:false});
 assert.equal(p.jetActive,false,'releasing held sprint disables thrust');
 assert(p.jetFuel<=before+1e-8,'no air recharge');
 const independent=initSoloJetpack(initVerticalBody({x:r.x0+.5,y:r.y0+.5}));
 requestVerticalJump(l,independent);
 for(let i=0;i<400;i++)advanceVerticalBody(l,independent,1/120,{jetpack:true});
 assert(independent.jetFuel>=0&&independent.jetFuel<=100);
 assert(independent.jetFuel<100,'fuel is finite');
});

test('physically solid upper deck undersides and ceiling still cap thrust on all sectors',()=>{
 for(let i=0;i<12;i++){
  const l=preview(i).level,u=l.vertical.upper;
  const below=initSoloJetpack(initVerticalBody({x:u.x0+.5,y:u.y0+.5}));
  requestVerticalJump(l,below);
  let maxHeight=0;
  for(let n=0;n<200;n++){
   advanceVerticalBody(l,below,1/120,{jetpack:true});
   maxHeight=Math.max(maxHeight,below.height);
  }
  assert(maxHeight<STACK_HEIGHT-1,SECTORS[i].name+' boost passed through deck underside');
  const above=initSoloJetpack(initVerticalBody({x:u.x0+.5,y:u.y0+.5},STACK_HEIGHT));
  requestVerticalJump(l,above);
  for(let n=0;n<200;n++){
   advanceVerticalBody(l,above,1/120,{jetpack:true});
   assert(above.height<=STACK_CEILING-1.1+1e-8,'must respect ceiling');
  }
 }
});

test('actual Game.update, keyboard and Xbox/Quest sprint input share one boost intent',()=>{
 const desktop=gameplayInput(new Set(['KeyJ','ShiftLeft']),undefined,false,1);
 assert.equal(desktop.jetpack,true);
 assert.equal(desktop.sprint,true);
 assert.equal(gameplayInput(new Set(),{moveForward:0,moveStrafe:0,turn:0,sprint:true,fire:false}).jetpack,true);
 const g=preview(0),p=g.player;g.level.enemies.forEach(e=>e.stun=20);
 g.jump();
 g.update(1/60,{jetpack:true});
 assert(p.jetFuel<100);
 assert(p.jetActive);
 const start=p.jetFuel;
 g.update(1/60,{jetpack:false});
 assert.equal(p.jetActive,false);
 assert(p.jetFuel<=start);
 assert(g.events.some(e=>e.type==='burst'&&e.color==='#62e6ff'));
});

test('jetpack fuel recharges only on the ground and snapshots remain preview-only',()=>{
 const g=preview(6),p=g.player,l=g.level;
 p.jetFuel=20;p.grounded=false;p.height=.5;p.vz=-1;
 stepSoloJetpack(l,p,.05,false);
 assert.equal(p.jetFuel,20);
 p.grounded=true;p.height=0;p.vz=0;
 stepSoloJetpack(l,p,1,false);
 assert.equal(p.jetFuel,20+JET_RECHARGE);
 assert.equal(p.jetActive,false);
 assert.equal(JET_BURN,48);
 const snap=g.snapshot(),restored=new Game();
 assert.equal(restored.restore(snap),true);
 assert.equal(restored.player.jetFuel,20+JET_RECHARGE);
 assert(validSoloPreviewCheckpoint(restored.level,restored.player));
 const old=structuredClone(snap);delete old.player.jetFuel;delete old.player.jetActive;
 const backward=new Game();assert.equal(backward.restore(old),true);
 assert.equal(backward.player.jetFuel,100);
 for(const modify of [v=>{v.player.jetFuel=-1;},v=>{v.player.jetFuel=101;},v=>{v.player.jetActive='yes';}]){
  const bad=structuredClone(snap);modify(bad);assert.throws(()=>new Game().restore(bad),/checkpoint/i);
 }
 const store={writes:0,setItem(){this.writes++}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const flat=new Game();flat.start();
 assert.equal('jetFuel' in flat.snapshot().player,false);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,flat));
 assert.equal(store.writes,1);
});

test('native stereo, wrist, Classic, and offline shell wire the optional thruster',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/core.js').includes('jetpack:!!input.jetpack'));
 assert(read('src/immersive-rig.js').includes('jetpack=playing&&!captured&&!!pad?.sprint'));
 assert(read('src/vr-input.js').includes('buttons[10]=pressed(l,3)'));
 assert(read('src/gamepad.js').includes("jetpack:keys.has('ShiftLeft')"));
 assert(read('src/world-ui.js').includes("'JET '+Math.ceil(p.jetFuel"));
 assert(read('src/renderer.js').includes("'JET '+Math.ceil(fuel)"));
 assert(read('src/world-scene.js').includes('p.jetActive'));
 assert(read('scripts/build.mjs').includes("'./src/solo-jetpack.js'"));
 assert(read('scripts/verify-offline.mjs').includes("'./src/solo-jetpack.js'"));
});
