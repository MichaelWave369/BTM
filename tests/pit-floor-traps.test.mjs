import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,canOccupy,findRoute} from '../src/core.js';
import {PIT_STAGES} from '../src/pit.js';
import {floorTrapState,updatePitFloorTraps} from '../src/pit-floor-traps.js';

const stages=new Map([[4,'charge-tile'],[6,'arc-lane'],[9,'pressure-pulse']]);
function fixture(index){
 const g=new Game();g.startPit();g.loadLevel(index,false);
 g.level.enemies=[];g.level.items=[];g.level.hazards=[];
 g.oriAuto=999;g.player.armor=0;g.events=[];
 return {g,h:g.level.floorTraps[0]};
}

test('three distinct floor mechanics are authored on reachable Pit tiles, not campaign',()=>{
 for(let i=0;i<12;i++){
  const l=createLevel(i,'pit');
  assert.equal(l.floorTraps.length,stages.has(i)?1:0);
  if(!stages.has(i))continue;
  const h=l.floorTraps[0];
  assert.equal(h.kind,stages.get(i));
  assert(canOccupy(l,h.x,h.y),'floor hazard center must be walkable');
  assert(findRoute(l,PIT_STAGES[i].spawn,h).length,'players must be able to reach the hazard');
  assert(Math.hypot(h.x-PIT_STAGES[i].spawn.x,h.y-PIT_STAGES[i].spawn.y)>4,
   'no damaging spawn tile');
  if(h.kind==='arc-lane'){
   assert(canOccupy(l,h.toX,h.toY),'arc end must be walkable');
   assert(findRoute(l,PIT_STAGES[i].spawn,{x:h.toX,y:h.toY}).length);
  }
 }
 assert(!('floorTraps' in createLevel(0,'original')));
});

test('charge tile warns before activating and allows one shielded impact per cycle',()=>{
 const {g,h}=fixture(4);
 g.player.x=h.x;g.player.y=h.y;g.shieldCharge=40;g.shieldTime=12;
 g.time=0.5;updatePitFloorTraps(g);
 assert.equal(floorTrapState(h,g.time),'idle');
 assert.equal(g.events.filter(e=>e.type==='hazardHit').length,0);
 g.time=1.15;updatePitFloorTraps(g);
 assert.equal(floorTrapState(h,g.time),'warning');
 assert(g.events.some(e=>e.type==='pitTell'&&/CHARGE TILE/.test(e.text)));
 assert.equal(g.player.health,100);
 g.time=2.05;updatePitFloorTraps(g);
 assert.equal(floorTrapState(h,g.time),'active');
 assert.equal(g.shieldCharge,30);
 assert.equal(g.player.health,100);
 for(let i=0;i<5;i++){g.time+=.025;updatePitFloorTraps(g);}
 assert.equal(g.shieldCharge,30,'standing in one activation cannot take repeated hits');
 g.time=1.15+h.period;updatePitFloorTraps(g);
 assert.equal(g.events.filter(e=>e.type==='pitTell').length,2);
 g.time=2.05+h.period;updatePitFloorTraps(g);
 assert.equal(g.shieldCharge,20,'new periodic cycle can hit once after a warning');
 assert.equal(g.events.filter(e=>e.type==='hazardHit').length,2);
});

test('periodic arc lane only hits points near its charged segment, never outside it',()=>{
 const {g,h}=fixture(6);
 g.player.x=6.5;g.player.y=17.5;
 g.time=1.4-h.offset;updatePitFloorTraps(g);
 assert.equal(floorTrapState(h,g.time),'warning');
 assert(g.events.some(e=>e.type==='pitTell'&&/ARC LANE/.test(e.text)));
 const hp=g.player.health;
 g.time=2.15-h.offset;updatePitFloorTraps(g);
 assert.equal(g.player.health,hp-h.damage);
 updatePitFloorTraps(g);
 assert.equal(g.player.health,hp-h.damage,'one impact per cycle');
 g.player.x=6.5;g.player.y=19.2;
 g.time=2.15-h.offset+h.period;updatePitFloorTraps(g);
 assert.equal(g.player.health,hp-h.damage,'outside the segment is safe');
 g.player.x=h.toX;g.player.y=h.toY;
 g.time=2.15-h.offset+h.period*2;updatePitFloorTraps(g);
 assert.equal(g.player.health,hp-h.damage*2,'endpoint collision counts');
});

test('pressure pulse has a warning, locks its location and fires once after entering',()=>{
 const {g,h}=fixture(9);
 g.player.x=h.x;g.player.y=h.y+1.6;g.time=0;
 updatePitFloorTraps(g);
 g.player.x=h.x;g.player.y=h.y;g.time=.05;
 updatePitFloorTraps(g);
 assert(Number.isFinite(h.fireAt));
 assert.equal(floorTrapState(h,g.time),'warning');
 const firstFire=h.fireAt;
 const hp=g.player.health;
 g.time=firstFire-.05;updatePitFloorTraps(g);
 assert.equal(g.player.health,hp);
 g.player.x=h.x;g.player.y=h.y+1.6;
 g.time=firstFire;updatePitFloorTraps(g);
 assert.equal(g.player.health,hp,'pulse hits location, not fleeing player');
 assert.equal(floorTrapState(h,g.time),'active');
 assert.equal(g.events.filter(e=>e.type==='pitFloorFired').length,1);
 g.time=firstFire+.45;updatePitFloorTraps(g);
 assert.equal(floorTrapState(h,g.time),'idle');
 g.player.x=h.x;g.player.y=h.y;g.time=h.readyAt+.01;
 updatePitFloorTraps(g);
 assert.equal(g.events.filter(e=>e.type==='pitFloorArmed').length,2);
 g.shieldTime=2;g.shieldCharge=h.damage+4;
 g.time=h.fireAt;updatePitFloorTraps(g);
 assert.equal(g.shieldCharge,4);
 assert.equal(g.player.health,hp,'Dash shield mitigates pulse');
 assert.equal(g.events.filter(e=>e.type==='pitFloorFired').length,2);
 for(let i=0;i<10;i++)updatePitFloorTraps(g);
 assert.equal(g.events.filter(e=>e.type==='pitFloorFired').length,2,'standing cannot spam');
});

test('Pit saves preserve a pending pulse and older v2 checkpoints without floorTraps load',()=>{
 const {g,h}=fixture(9);
 g.pitRecord=Array.from({length:9},(_,i)=>({stage:i+1}));
 g.player.x=h.x;g.player.y=h.y;g.time=.1;updatePitFloorTraps(g);
 const saved=g.snapshot(),pending=h.fireAt;
 assert.equal(saved.version,2);assert.equal(saved.schema,'btm.pit/1');
 const restored=new Game();assert(restored.restore(saved,{campaign:'pit'}));
 assert.equal(restored.level.floorTraps[0].fireAt,pending);
 restored.time=pending;updatePitFloorTraps(restored);
 assert.equal(restored.events.filter(e=>e.type==='pitFloorFired').length,1);
 const old=structuredClone(saved);delete old.level.floorTraps;
 const backward=new Game();assert(backward.restore(old,{campaign:'pit'}));
 assert.doesNotThrow(()=>updatePitFloorTraps(backward));
 assert.equal(backward.snapshot().version,2);
 g.saveCheckpoint();
 g.time=pending;updatePitFloorTraps(g);
 g.retry();
 assert.equal(g.level.floorTraps[0].fireAt,pending,'retry restores pending warning');
});

test('paused simulation cannot advance timed hazards or pressure warnings',()=>{
 const {g,h}=fixture(9);
 g.player.x=h.x;g.player.y=h.y;g.time=.05;updatePitFloorTraps(g);
 const at=g.time,fireAt=h.fireAt;
 g.mode='paused';g.update(5);
 assert.equal(g.time,at);assert.equal(h.fireAt,fireAt);
 updatePitFloorTraps(g);
 assert.equal(g.events.filter(e=>e.type==='pitFloorFired').length,0);
});
