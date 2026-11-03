import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,canOccupy,findRoute} from '../src/core.js';
import {solidAt,lineOfSight} from '../src/collision.js';
import {updatePitEnvironment} from '../src/pit-combat.js';
import {PIT_STAGES} from '../src/pit.js';

function fixture(){
 const g=new Game();
 g.startPit();g.loadLevel(3,false);
 g.level.enemies=[];g.level.hazards=[];g.level.items=[];
 g.oriAuto=999;g.events.length=0;
 g.player.x=4.5;g.player.y=17.5;
 g.player.armor=0;
 return g;
}
function enterPlate(g){
 const t=g.level.traps[0];
 g.update(.05); // start outside, record an unpressed state
 assert(!Number.isFinite(t.fireAt),'approach must be safe');
 g.player.x=t.x;g.player.y=t.y;
 g.update(.05);
 assert(Number.isFinite(t.fireAt),'entry should arm an actual warning');
 return t;
}
function fire(g,t){
 g.time=t.fireAt;
 g.update(.005);
 return g.projectiles.filter(b=>b.trap==='electric-orb');
}
test('only authored Pit chambers own optional reachable plates with actual wall emitters',()=>{
 for(let i=0;i<12;i++){
  const l=createLevel(i,'pit'),expected=[3,6,7].includes(i)?1:0;
  assert.equal(l.traps.length,expected,'new authored traps only in trial '+(i+1));
  if(!expected)continue;
  const t=l.traps[0];
  assert(canOccupy(l,t.x,t.y),'pressure pad must be walkable');
  assert(canOccupy(l,t.muzzleX,t.muzzleY,.05),'orb must leave the wall from open space');
  assert(solidAt(l,t.mountX,t.mountY),'turret head must actually attach to a wall');
  assert(lineOfSight(l,{x:t.muzzleX,y:t.muzzleY},t),'plate has a valid projectile lane');
  if(t.pattern==='crossfire'){
   assert(solidAt(l,t.secondMountX,t.secondMountY));
   assert(canOccupy(l,t.secondMuzzleX,t.secondMuzzleY,.05));
   assert(lineOfSight(l,{x:t.secondMuzzleX,y:t.secondMuzzleY},t));
  }
  assert(findRoute(l,PIT_STAGES[i].spawn,t).length,'plate is accessible without teleporting');
  assert(Math.hypot(t.x-PIT_STAGES[i].spawn.x,t.y-PIT_STAGES[i].spawn.y)>4,'no spawn trap');
 }
 assert(!('traps' in createLevel(0,'original')),'original campaign remains unchanged');
});

test('plate warns before launching, locks the entry point, and never retriggers while occupied',()=>{
 const g=fixture(),t=enterPlate(g);
 assert.equal(g.projectiles.length,0,'telegraph must precede attack');
 assert(g.events.some(e=>e.type==='pitTrapArmed'));
 assert(g.events.some(e=>e.type==='pitTell'));
 const aim=[t.targetX,t.targetY],firstFire=t.fireAt;
 g.time=firstFire-.2;updatePitEnvironment(g,.01);
 assert.equal(g.projectiles.length,0,'no premature shot');
 // Move away after the warning: projectile aims at the saved position, not
 // the player's continually moving head or body.
 g.player.y=t.y+1.1;
 const shots=fire(g,t);
 assert.equal(shots.length,1);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,1);
 assert.deepEqual(aim,[t.x,t.y]);
 const expected=Math.atan2(t.y-t.muzzleY,t.x-t.muzzleX);
 assert(Math.abs(shots[0].a-expected)<1e-8,'launcher does not home into a fleeing player');
 assert.equal(shots[0].enemy,true);
 assert.equal(shots[0].trap,'electric-orb');
 assert(shots[0].speed<=2.6,'orb must be dodgeable');
 g.player.y=t.y;
 g.update(.005);
 const count=g.events.filter(e=>e.type==='pitTrapArmed').length;
 for(let i=0;i<120;i++)g.update(.05);
 assert.equal(g.events.filter(e=>e.type==='pitTrapArmed').length,count,'standing on plate cannot spam');
 g.player.y=t.y+1.1;g.update(.005);
 g.player.y=t.y;g.update(.005);
 assert.equal(g.events.filter(e=>e.type==='pitTrapArmed').length,count+1,
  'exit then re-enter after cooldown may arm a new shot');
});

test('real wall collision stops an electric orb before it reaches the player',()=>{
 const g=fixture(),t=enterPlate(g),hp=g.player.health;
 const [orb]=fire(g,t);
 assert(orb);
 // Add a solid mid-lane wall after launch to exercise the SAME projectile
 // collision path used by ordinary enemies and boss bolts.
 g.level.cells[16][6]=2;
 for(let i=0;i<75;i++)g.updateProjectiles(.05);
 assert(!g.projectiles.includes(orb),'wall should remove the projectile');
 assert.equal(g.player.health,hp,'orb cannot travel through a wall');
});

test('electric orb deals at most one collision hit and respects Dash Bash shield',()=>{
 const g=fixture(),t=enterPlate(g),hp=g.player.health;
 g.shieldTime=3;g.shieldCharge=t.damage+2;
 const shot=fire(g,t);
 assert.equal(shot.length,1);
 for(let i=0;i<55;i++)g.update(.05);
 assert.equal(g.player.health,hp,'shield must absorb the orb instead of health');
 assert.equal(g.shieldCharge,2);
 assert.equal(g.events.filter(e=>e.type==='shieldHit').length,1,'exactly one impact');
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,1);
 assert(!g.projectiles.some(b=>b.trap==='electric-orb'),'orb removed after first impact');
});

test('trap state survives separate Pit save, retry resets it and old saves without traps remain valid',()=>{
 const g=fixture();
 g.pitRecord=[{stage:1},{stage:2},{stage:3}];
 g.saveCheckpoint();
 const t=enterPlate(g),pending=t.fireAt;
 const saved=g.snapshot();
 const restored=new Game();
 assert(restored.restore(saved,{campaign:'pit'}));
 assert.equal(restored.level.traps[0].fireAt,pending);
 assert.equal(restored.level.traps[0].wasInside,true);
 assert.equal(restored.level.traps[0].targetX,t.x);
 assert.equal(restored.snapshot().version,2);
 assert.equal(restored.snapshot().schema,'btm.pit/1');
 g.retry();
 assert.equal(g.level.traps[0].fireAt,undefined,'retry rolls back pending trap');
 assert.equal(g.level.traps[0].wasInside,undefined);
 assert.equal(g.player.energy,100,'no resource duplication or ammo tax');
 const legacy=structuredClone(saved);
 delete legacy.level.traps;
 const old=new Game();
 assert(old.restore(legacy,{campaign:'pit'}),'older Pit checkpoints have no trap array');
 assert.doesNotThrow(()=>updatePitEnvironment(old,.05));
 assert.equal(old.snapshot().version,2,'save format remains unchanged');
});

test('projectile cap and game pause keep the plate from fabricating extra attacks',()=>{
 const g=fixture(),t=enterPlate(g),now=g.time;
 g.mode='paused';g.update(2);
 assert.equal(g.time,now,'game pause must freeze the telegraph clock');
 assert.equal(t.fireAt>g.time,true);
 g.mode='playing';
 // Simulate an already full projectile budget; no duplicate extra orb.
 g.projectiles=Array.from({length:96},(_,i)=>({x:1,y:1,a:0,speed:0,life:5,damage:0,enemy:true,color:'#fff',id:i}));
 g.time=t.fireAt;
 updatePitEnvironment(g,.05);
 assert.equal(g.projectiles.length,96);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,0);
 updatePitEnvironment(g,.05);
 assert.equal(g.projectiles.length,96,'finished warning cannot fire twice');
});
