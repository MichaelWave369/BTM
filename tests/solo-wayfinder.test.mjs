import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS,findRoute} from '../src/core.js';
import {soloWayfinder,SOLO_WAYFINDER_COLORS} from '../src/solo-wayfinder.js';
import {rampHeight,STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
const preview=index=>{const g=new Game();g.start({verticalPreview:true});if(index)g.loadLevel(index,false);return g;};

test('twelve upper decks have correctly elevated, non-solid entrance and ascending ramp markers',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),l=g.level,r=l.vertical.ramp;
  assert(validSoloPreviewCheckpoint(l,g.player));
  const marks=soloWayfinder(g),ramp=marks.filter(m=>m.kind==='entrance'||m.kind==='ramp');
  assert.equal(ramp.length,r.x1-r.x0,SECTORS[i].name);
  assert.equal(ramp[0].kind,'entrance');
  assert.equal(ramp[0].x,r.x0+.5);
  assert.equal(ramp[0].y,r.y0+.5);
  for(let j=0;j<ramp.length;j++){
   assert.equal(ramp[j].x,r.x0+j+.5);
   assert.equal(ramp[j].floorHeight,rampHeight(l,ramp[j].x,ramp[j].y));
   if(j)assert(ramp[j].floorHeight>ramp[j-1].floorHeight);
  }
  assert.equal(l.upperCover.length,2);
  assert.equal('soloWayfinder' in l,false,'presentation leaves actual level untouched');
  assert.equal(soloWayfinder(g).some(m=>m.kind==='trail'),false,'no path scan until Ori is used');
 }
});

test('Ori scan routes ground-floor guidance around existing walls and locked colored doors',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),l=g.level,r=l.vertical.ramp;
  g.objectiveTime=10;
  const marks=soloWayfinder(g),trail=marks.filter(m=>m.kind==='trail');
  const foot={x:r.x0+.5,y:r.y0+.5};
  const route=findRoute(l,g.player,foot,{allowLocked:g.player.key,keys:g.player.keys});
  assert(route.length>0,SECTORS[i].name+' ramp should be reachable');
  assert(trail.length>0,SECTORS[i].name+' scan should produce navigation breadcrumbs');
  assert(trail.length<=24,'route is bounded to protect stereo draw calls');
  for(const mark of trail){
   assert(route.some(p=>p.x===mark.x&&p.y===mark.y),'marker must lie on the true navigation route');
   const door=l.doors[Math.floor(mark.x)+','+Math.floor(mark.y)];
   assert(!door?.lockColor||door.open>=.84||g.player.keys?.[door.lockColor],
    'scan cannot route through an inaccessible color lock');
   assert.equal(mark.floorHeight,0,'waypoints before the ramp stay on the ground');
  }
 }
});

test('route refreshes if the player moves, and disappearing scan never alters regular objectives',()=>{
 const g=preview(0),r=g.level.vertical.ramp;
 const original=g.objectiveTarget;
 g.objectiveTime=10;
 assert(soloWayfinder(g).some(m=>m.kind==='trail'));
 const start={x:g.player.x,y:g.player.y};
 g.player.x=r.x0+.5;g.player.y=r.y0+.5;
 assert.equal(soloWayfinder(g).filter(m=>m.kind==='trail').length,0);
 g.player.x=start.x;g.player.y=start.y;
 assert(soloWayfinder(g).some(m=>m.kind==='trail'));
 g.objectiveTime=0;
 assert.equal(soloWayfinder(g).some(m=>m.kind==='trail'),false);
 assert.deepEqual(g.objectiveTarget,original,'main campaign objective is never replaced');
});

test('uplink and fragment pings appear only upstairs and stop after completion',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),l=g.level;
  const fragment=l.items.find(e=>e.upperFragment);
  const guard=l.enemies.find(e=>e.upperGuard);
  Object.assign(g.player,{x:l.vertical.upper.x0+.5,y:l.vertical.upper.y1-.5,
   height:STACK_HEIGHT,supportSurface:'upper'});
  const marks=soloWayfinder(g);
  assert.equal(marks.filter(m=>m.kind==='uplink').length,1);
  assert.equal(marks.filter(m=>m.kind==='fragment').length,1);
  assert.equal(marks.some(m=>m.kind==='ramp'||m.kind==='trail'),false);
  assert.deepEqual(marks.find(m=>m.kind==='uplink'),{kind:'uplink',x:l.upperUplink.x,y:l.upperUplink.y,floorHeight:STACK_HEIGHT});
  assert.deepEqual(marks.find(m=>m.kind==='fragment'),{kind:'fragment',x:fragment.x,y:fragment.y,floorHeight:STACK_HEIGHT});
  l.upperUplink.active=true;
  assert.equal(soloWayfinder(g).some(m=>m.kind==='uplink'),false);
  fragment.taken=true;
  assert.equal(soloWayfinder(g).some(m=>m.kind==='fragment'),false);
  guard.dead=true;
  assert.deepEqual(soloWayfinder(g),[],'nothing remains to guide once all optional goals complete');
 }
});

test('wayfinder never writes to normal disk saves, modifies the map, or appears in flat/Pit/coop campaigns',()=>{
 const flat=new Game();flat.start();const pit=new Game();pit.startPit();const g=preview(4);
 assert.deepEqual(soloWayfinder(flat),[]);
 assert.deepEqual(soloWayfinder(pit),[]);
 assert.equal(createLevel(1,'original').upperCover,undefined);
 const before=structuredClone(g.snapshot());
 g.objectiveTime=10;soloWayfinder(g);
 assert.deepEqual(g.snapshot(),before,'wayfinder cache is outside gameplay snapshots');
 const store={writes:0,setItem(){this.writes++;}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,flat));
 assert.equal(store.writes,1);
 assert.equal(new Game().restore(flat.snapshot()),true);
});

test('native stereo, Classic, wrist, build and actual offline verifier all use the same optional module',()=>{
 const file=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
 const stereo=file('src/world-scene.js'),classic=file('src/renderer.js'),wrist=file('src/world-ui.js');
 const build=file('scripts/build.mjs'),offline=file('scripts/verify-offline.mjs');
 assert(stereo.includes('soloWayfinder(game)')&&stereo.includes('SOLO_WAYFINDER_COLORS'));
 assert(classic.includes('soloWayfinder(game)')&&classic.includes("o.type==='soloWayfinder'"));
 assert(wrist.includes('soloWayfinder(game)'));
 assert(build.includes("'./src/solo-wayfinder.js'"),'the new module must be cached for offline Code Brown');
 assert(offline.includes("'./src/solo-wayfinder.js'"));
 assert.equal(Object.keys(SOLO_WAYFINDER_COLORS).length,5);
});
