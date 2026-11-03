import test from 'node:test';
import assert from 'node:assert/strict';
import {Room,STAGES} from '../src/net/simulation.js';
import {packWorld,applyWorld} from '../src/net/codec.js';
import {canOccupy} from '../src/core.js';

function pit(stage,keepEnemies=false){
 const r=new Room({code:'ABCDEFGH',mode:'coop',capacity:4});
 for(const [i,n] of ['Mikey','Larrina'].entries()){
  const a=r.add({id:'p'+i,nickname:n,token:String(i+1).repeat(48)});a.ready=true;
 }
 r.start('p0');
 r.stage=stage+12;
 r.receipts=STAGES.slice(0,r.stage).map((s,i)=>({stage:i+1,...s,seconds:1,relays:true,key:true,bosses:[]}));
 r.load(false);
 for(const a of r.actors.values()){a.invulnerable=0;a.player.armor=0;}
 if(!keepEnemies){r.game.level.enemies=[];r.game.level.hazards=[];r.game.level.blasts=[];}
 return r;
}
const players=r=>[...r.actors.values()];
const count=(r,type)=>r.events.filter(e=>e.type===type).length;
function step(r,n){for(let i=0;i<n;i++)r.step();}
function place(a,x,y){Object.assign(a.player,{x,y});}

test('two co-op actors entering the same wall plate generate one server-owned electric orb',()=>{
 const r=pit(3),[a,b]=players(r),t=r.game.level.traps[0];
 assert(t,'co-op Pit retains authored wall emitter and pressure plate');
 assert(canOccupy(r.game.level,t.x,t.y));
 assert.equal(t.kind,'electric-orb');
 place(a,t.x,t.y);place(b,t.x+.12,t.y);
 r.step();
 assert.equal(count(r,'pitTrapArmed'),1);
 assert.equal(r.events.find(e=>e.type==='pitTrapArmed').targetId,a.id);
 assert(Number.isFinite(t.fireAt));
 assert.equal(r.game.projectiles.length,0,'warning precedes real projectile');
 step(r,33);
 assert.equal(count(r,'pitTrapFired'),1);
 assert(r.events.find(e=>e.type==='pitTrapFired').targetX===t.x);
 assert(r.game.projectiles.some(p=>p.enemy&&p.trap==='electric-orb'));
 // Even when both actors remain standing on the plate, cooldown expiry
 // must not generate another scheduled shot.
 step(r,260);
 assert.equal(count(r,'pitTrapArmed'),1);
 assert.equal(count(r,'pitTrapFired'),1);
 place(a,t.x+1.5,t.y);place(b,t.x+1.4,t.y);
 r.step();step(r,2);
 place(a,t.x,t.y);place(b,t.x+.1,t.y);r.step();
 assert.equal(count(r,'pitTrapArmed'),2,'new entry after exit and cooldown re-arms once');
});

test('a real server orb can hurt its chosen actor and shield absorbs that damage',()=>{
 const first=pit(3),[a,b]=players(first),trap=first.game.level.traps[0];
 place(b,25.5,21.5);place(a,trap.x,trap.y);
 step(first,100);
 assert(count(first,'pitTrapFired')===1,'trap must fire once');
 assert(a.player.health<100,'swept orb collision should damage the target');
 assert.equal(b.player.health,100,'off-lane actor is not damaged by another players orb');
 const shielded=pit(3),[c,d]=players(shielded),t=shielded.game.level.traps[0];
 place(d,25.5,21.5);place(c,t.x,t.y);
 c.feel.shieldTime=8;c.feel.shieldCharge=40;
 step(shielded,100);
 assert.equal(c.player.health,100);
 assert(c.feel.shieldCharge<40,'Dash Bash shield should absorb the real projectile');
 assert(count(shielded,'shieldHit')>=1);
});

test('staggered and crossfire wall traps are bounded, timed, and alternate authoritative emitters',()=>{
 for(const [stage,pattern] of [[7,'double'],[6,'crossfire']]){
  const r=pit(stage),[a,b]=players(r),t=r.game.level.traps[0];
  assert.equal(t.pattern,pattern);
  place(a,t.x,t.y);place(b,25.5,21.5);
  r.step();
  assert.equal(count(r,'pitTrapArmed'),1);
  step(r,80);
  const shots=r.events.filter(e=>e.type==='pitTrapFired');
  assert(shots.length<=2&&shots.length>=1);
  assert.equal(t.volleyShot,0);
  assert(!Number.isFinite(t.fireAt));
  if(pattern==='crossfire'&&shots.length===2)assert.notEqual(shots[0].side,shots[1].side);
  assert(r.game.projectiles.length<=96);
 }
});

test('charge tile and arc lane damage each co-op actor separately, at most once per cycle',()=>{
 for(const [stage,kind] of [[4,'charge-tile'],[6,'arc-lane']]){
  const r=pit(stage),[a,b]=players(r),h=r.game.level.floorTraps.find(x=>x.kind===kind);
  assert(h);
  place(a,h.x,h.y);place(b,h.x+.1,h.y);
  step(r,64);
  assert(a.player.health<100&&b.player.health<100,
   kind+' must damage each actor instead of the single local host avatar');
  const first=[a.player.health,b.player.health];
  step(r,9);
  assert.deepEqual([a.player.health,b.player.health],first,'no repeated damage in active cycle');
  assert.equal(Object.keys(h.hitBy).length,2,'per-actor cycle receipts are authority-owned');
 }
});

test('pressure-pulse arms once per shared entry, hits both actors in radius, and does not retrigger while occupied',()=>{
 const r=pit(9),[a,b]=players(r),h=r.game.level.floorTraps.find(x=>x.kind==='pressure-pulse');
 place(a,h.x,h.y);place(b,h.x+.75,h.y);
 r.step();assert.equal(count(r,'pitFloorArmed'),1);
 assert(a.player.health===100&&b.player.health===100);
 step(r,27);
 assert.equal(count(r,'pitFloorFired'),1);
 assert(a.player.health<100&&b.player.health<100,'both actors within blast radius take independent damage');
 step(r,195);
 assert.equal(count(r,'pitFloorArmed'),1,'standing on plate cannot farm pulses');
 place(a,h.x+2,h.y);place(b,h.x+2.1,h.y);r.step();
 place(a,h.x,h.y);r.step();
 assert.equal(count(r,'pitFloorArmed'),2);
});

test('trap timer snapshots drive two distinct clients, without sending geometry or client authority',()=>{
 const r=pit(3),[a,b]=players(r),t=r.game.level.traps[0];
 const west=structuredClone(r.init().level),east=structuredClone(r.init().level);
 place(a,t.x,t.y);r.step();
 const wa=r.snapshot(a),wb=r.snapshot(b);
 assert.equal(wa.events.filter(e=>e.type==='pitTrapArmed').length,1);
 assert.equal(wb.events.filter(e=>e.type==='pitTrapArmed').length,1);
 assert.deepEqual(wa.world.traps,wb.world.traps,'two peers see the same firing clock');
 assert(!('cells'in wa.world),'no duplicate static geometry every snapshot');
 applyWorld(west,wa.world);applyWorld(east,wb.world);
 assert.equal(west.traps[0].fireAt,t.fireAt);
 assert.equal(east.traps[0].fireAt,t.fireAt);
 assert.throws(()=>applyWorld(west,{...wa.world,traps:[['unknown',500]]}));
 assert.throws(()=>applyWorld(west,{...wa.world,traps:[[t.id,Infinity]]}));
 const previous=structuredClone(west);
 applyWorld(previous,{...wa.world,traps:undefined,floorTraps:undefined});
 assert.equal(previous.traps[0].fireAt,t.fireAt,'old format-1 wire remains accepted');
});

test('co-op checkpoints preserve one pending orb and reject forged authoritative trap data',()=>{
 const r=pit(3),[a]=players(r),t=r.game.level.traps[0];
 place(a,t.x,t.y);r.step();
 const save=r.checkpoint(),newRoom=()=>new Room({code:r.code,mode:'coop',capacity:4});
 const restored=newRoom();restored.restore(save);
 assert.equal(restored.game.level.traps[0].fireAt,t.fireAt);
 assert.deepEqual(restored.game.level.traps[0].insideActors,[a.id]);
 const restoredActor=restored.actors.get(a.id);restoredActor.invulnerable=0;
 restored.step();assert.equal(count(restored,'pitTrapArmed'),0);
 step(restored,33);assert.equal(count(restored,'pitTrapFired'),1,'one delayed shot survives resume');
 const noTraps=structuredClone(save);
 delete noTraps.world.level.traps;delete noTraps.world.level.floorTraps;
 const older=newRoom();older.restore(noTraps);
 assert.equal(older.game.level.traps.length,1,'old valid checkpoints safely recover current static trap');
 for(const corrupt of [
  s=>s.world.level.traps[0].x=1000,
  s=>s.world.level.traps[0].fireAt=1e9,
  s=>s.world.level.traps[0].insideActors=['unauthorized'],
  s=>s.world.level.traps=[...s.world.level.traps,...s.world.level.traps]
 ]){
  const bad=structuredClone(save);corrupt(bad);assert.throws(()=>newRoom().restore(bad));
 }
});

test('solo/Pit gallery and competitive arena rules remain isolated from co-op server traps',()=>{
 const competitive=new Room({code:'ABCDEFGH',mode:'deathmatch',capacity:4});
 for(let i=0;i<2;i++){let a=competitive.add({id:'p'+i,nickname:'Wave'+i,token:String(i+1).repeat(48)});a.ready=true;}
 competitive.start('p0');
 assert.equal(competitive.game.level.traps,undefined);
 step(competitive,20);
 assert.equal(count(competitive,'pitTrapArmed'),0);
 assert.equal(STAGES.length,24);
});
