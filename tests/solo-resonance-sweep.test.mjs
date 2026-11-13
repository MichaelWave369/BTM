import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS,canOccupy} from '../src/core.js';
import {STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {coverIntersectsBody} from '../src/solo-cover.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
import {
 SWEEP_PERIOD,SWEEP_WARNING_START,SWEEP_ACTIVE_START,SWEEP_ACTIVE_END,
 SWEEP_DAMAGE,SWEEP_RADIUS,SOLO_SWEEP_COLORS,
 soloSweepNodes,soloSweepPhase,soloSweepMarkers,applySoloSweep
} from '../src/solo-resonance-sweep.js';
const preview=i=>{const g=new Game();g.start({verticalPreview:true});if(i)g.loadLevel(i,false);return g;};

test('two Resonance Sweep pads fit all twelve authored decks without blocking cover or objects',()=>{
 for(let index=0;index<12;index++){
  const g=preview(index),l=g.level,u=l.vertical.upper,nodes=soloSweepNodes(l);
  assert.equal(nodes.length,2,SECTORS[index].name);
  assert.deepEqual(nodes.map(n=>n.id),['left','right']);
  assert(nodes[0].x<nodes[1].x);
  for(const n of nodes){
   assert.equal(n.floorHeight,STACK_HEIGHT);
   assert.equal(n.y,u.y0+Math.floor((u.y1-u.y0)/2)+.5);
   assert(n.x>=u.x0&&n.x<u.x1&&n.y>=u.y0&&n.y<u.y1);
   assert(canOccupy(l,n.x,n.y,.2,{height:STACK_HEIGHT}),SECTORS[index].name+' node overlaps physical cover');
   assert(!coverIntersectsBody(l,n.x,n.y,.2,{height:STACK_HEIGHT}));
   assert(l.items.filter(i=>i.bonusUpper).every(i=>Math.hypot(i.x-n.x,i.y-n.y)>=1));
   assert(Math.hypot(l.upperUplink.x-n.x,l.upperUplink.y-n.y)>=1);
   assert(l.enemies.filter(e=>e.upperGuard).every(e=>Math.hypot(e.x-n.x,e.y-n.y)>=1));
  }
  assert(validSoloPreviewCheckpoint(l,g.player));
  assert.deepEqual(soloSweepNodes(createLevel(index)),[]);
  assert.deepEqual(soloSweepNodes(createLevel(index,'pit',{verticalPreview:true})),[]);
  assert.deepEqual(soloSweepNodes(createLevel(index,'original',{coloredAccess:false})),[]);
 }
});

test('pads have 1.2-second amber warning and 0.7-second red pulse, staggered by 3 seconds',()=>{
 assert.equal(SWEEP_PERIOD,6);
 assert(Math.abs(SWEEP_ACTIVE_START-SWEEP_WARNING_START-1.2)<1e-8);
 assert(Math.abs(SWEEP_ACTIVE_END-SWEEP_ACTIVE_START-.7)<1e-8);
 assert.equal(soloSweepPhase(0),'safe');
 assert.equal(soloSweepPhase(3.75),'warning');
 assert.equal(soloSweepPhase(4.9),'active');
 assert.equal(soloSweepPhase(5.8),'cooldown');
 assert.equal(soloSweepPhase(6),'safe');
 assert.equal(soloSweepPhase(4.9,1),'safe','pads must not pulse simultaneously');
 assert.equal(soloSweepPhase(1.9,1),'active','second pad runs three seconds ahead');
 assert.equal(soloSweepPhase(-1.1),'active','period is stable for negative times too');
 assert.deepEqual(Object.keys(SOLO_SWEEP_COLORS),['safe','warning','active','cooldown']);
 const markers=soloSweepMarkers(preview(0).level,4.9);
 assert.deepEqual(markers.map(n=>n.phase),['active','safe']);
 assert.deepEqual(soloSweepMarkers(createLevel(0),4.9),[]);
});

test('standing upstairs in an active pad takes a single real shield/armor/health hit per cycle',()=>{
 const g=preview(0),n=soloSweepNodes(g.level)[0];
 Object.assign(g.player,{x:n.x,y:n.y,height:STACK_HEIGHT,supportSurface:'upper',armor:0,health:100});
 g.time=4.95;
 assert.equal(applySoloSweep(g),true);
 assert.equal(g.player.health,100-SWEEP_DAMAGE);
 assert.equal(g.stats.damageTaken,SWEEP_DAMAGE);
 assert.equal(g.events.filter(e=>e.type==='toast'&&e.text.includes('RESONANCE SWEEP')).length,1);
 assert(g.events.some(e=>e.type==='burst'&&e.height>STACK_HEIGHT));
 assert.equal(applySoloSweep(g),false,'same simulation frame cannot hit twice');
 g.time=5.2;assert.equal(applySoloSweep(g),false,'same pulse cannot deal repeated damage across frames');
 g.time=10.95;assert.equal(applySoloSweep(g),true,'next cycle can apply another hit');
 assert.equal(g.player.health,100-SWEEP_DAMAGE*2);
 assert.equal(g.stats.damageTaken,SWEEP_DAMAGE*2);
});

test('yellow warning, jumps, safe side lanes and downstairs players never take sweep damage',()=>{
 const g=preview(3),n=soloSweepNodes(g.level)[0],p=g.player;
 Object.assign(p,{x:n.x,y:n.y,height:STACK_HEIGHT,supportSurface:'upper',armor:0,health:100});
 g.time=4.2;assert.equal(applySoloSweep(g),false,'warning has no damage');
 g.time=4.95;p.height=STACK_HEIGHT+.5;
 assert.equal(applySoloSweep(g),false,'a jump clears the low pulse');
 p.height=STACK_HEIGHT;p.x+=SWEEP_RADIUS+.2;
 assert.equal(applySoloSweep(g),false,'sidestepping clears the scanner');
 p.x=n.x;p.height=0;p.supportSurface='ground';
 assert.equal(applySoloSweep(g),false,'the player beneath the platform is safe');
 p.height=STACK_HEIGHT;p.supportSurface='upper';
 assert.equal(applySoloSweep(g),true,'skipping the pulse while below does not consume the upstairs hit');
 assert.equal(p.health,91);
});

test('actual Game.update world tick integrates floor-only sweep damage and preserves route objectives',()=>{
 const g=preview(5),n=soloSweepNodes(g.level)[0];
 g.level.enemies.forEach(e=>{e.stun=100;});
 Object.assign(g.player,{x:n.x,y:n.y,height:STACK_HEIGHT,supportSurface:'upper',grounded:true,armor:0,health:100});
 const original=g.objective,exit=g.exitReady;
 g.time=4.9;
 g.update(.05,{});
 assert.equal(g.player.health,91);
 assert.equal(g.stats.damageTaken,9);
 assert.equal(g.objective,original,'no extraction objective changes');
 assert.equal(g.exitReady,exit);
 g.update(.05,{});
 assert.equal(g.player.health,91,'subsequent frames in same pulse do not hit again');
});

test('no sweep state is persisted to old save formats or the memory-only preview checkpoint',()=>{
 const g=preview(6),snap=g.snapshot();
 assert.equal('soloSweep' in snap,false);
 assert.equal('upperSweep' in snap.level,false);
 assert.equal('sweepCycle' in snap.player,false);
 const original=structuredClone(snap),n=soloSweepNodes(g.level)[0];
 soloSweepMarkers(g.level,4.9);
 assert.deepEqual(g.snapshot(),original,'render-time states are derived only');
 Object.assign(g.player,{x:n.x,y:n.y,height:STACK_HEIGHT,supportSurface:'upper',armor:0,health:100});
 g.time=4.95;assert.equal(applySoloSweep(g),true);
 const save=g.snapshot(),restored=new Game();assert.equal(restored.restore(save),true);
 assert(validSoloPreviewCheckpoint(restored.level,restored.player));
 assert.equal(restored.player.health,91);
 const normal=new Game();normal.start();const pit=new Game();pit.startPit();
 assert.deepEqual(soloSweepMarkers(normal.level,5),[]);
 assert.deepEqual(soloSweepMarkers(pit.level,5),[]);
 const store={writes:0,setItem(){this.writes++}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);assert.equal(store.writes,0);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,normal));assert.equal(store.writes,1);
 assert.equal(normal.snapshot().version,1);
});

test('Classic, native stereo, Gen.E.Wrist, engine and offline shell use one timing model',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/core.js').includes('applySoloSweep(this)'));
 assert(read('src/world-scene.js').includes('soloSweepMarkers(l,game.time)'));
 assert(read('src/renderer.js').includes("o.type==='soloSweep'"));
 assert(read('src/world-ui.js').includes('SOLO_SWEEP_COLORS[node.phase]'));
 assert(read('scripts/build.mjs').includes("'./src/solo-resonance-sweep.js'"));
 assert(read('scripts/verify-offline.mjs').includes("'./src/solo-resonance-sweep.js'"));
});
