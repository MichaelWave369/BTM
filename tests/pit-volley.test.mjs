import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,canOccupy,findRoute} from '../src/core.js';
import {solidAt,lineOfSight} from '../src/collision.js';
import {updatePitEnvironment} from '../src/pit-combat.js';
import {PIT_STAGES} from '../src/pit.js';

function fixture(index){
 const g=new Game();g.startPit();g.loadLevel(index,false);
 g.level.enemies=[];g.level.hazards=[];g.level.items=[];
 g.oriAuto=999;g.events.length=0;g.player.armor=0;
 const t=g.level.traps[0];
 assert(t,'expected an authored volley chamber');
 g.player.x=t.x;g.player.y=t.y+1.1;
 g.update(.05);
 g.player.x=t.x;g.player.y=t.y;
 g.update(.05);
 assert(Number.isFinite(t.fireAt),'plate must arm on entry');
 return {g,t};
}
function due(g,t){
 assert(Number.isFinite(t.fireAt),'a pending volley is expected');
 g.time=t.fireAt;updatePitEnvironment(g,.001);
}
test('all three trap patterns use authored reachable chambers and genuine wall mounts',()=>{
 const patterns=new Map([[3,'single'],[6,'crossfire'],[7,'double']]);
 for(let i=0;i<12;i++){
  const l=createLevel(i,'pit');
  assert.equal(l.traps.length,patterns.has(i)?1:0);
  if(!patterns.has(i))continue;
  const t=l.traps[0];
  assert.equal(t.pattern||'single',patterns.get(i));
  assert(canOccupy(l,t.x,t.y));
  assert(findRoute(l,PIT_STAGES[i].spawn,t).length);
  assert(solidAt(l,t.mountX,t.mountY));
  assert(canOccupy(l,t.muzzleX,t.muzzleY,.05));
  assert(lineOfSight(l,{x:t.muzzleX,y:t.muzzleY},t));
  assert(Math.hypot(t.x-PIT_STAGES[i].spawn.x,t.y-PIT_STAGES[i].spawn.y)>4);
  if(t.pattern==='crossfire'){
   assert(solidAt(l,t.secondMountX,t.secondMountY),'opposite launcher sits on a wall');
   assert(canOccupy(l,t.secondMuzzleX,t.secondMuzzleY,.05));
   assert(lineOfSight(l,{x:t.secondMuzzleX,y:t.secondMuzzleY},t));
  }
 }
 assert(!('traps' in createLevel(0,'original')));
});

test('Bloodless Grid double volley has a readable gap and locked targets',()=>{
 const {g,t}=fixture(7),target={x:t.targetX,y:t.targetY};
 assert.equal(t.pattern,'double');
 assert.equal(g.events.filter(e=>e.type==='pitTrapArmed').length,1);
 assert(g.events.some(e=>e.type==='pitTell'&&/DOUBLE/.test(e.text)));
 assert.equal(g.projectiles.length,0);
 g.time=t.fireAt-.01;updatePitEnvironment(g,.01);
 assert.equal(g.projectiles.length,0,'warning must not fire early');
 due(g,t);
 assert.equal(g.projectiles.length,1);
 const first=g.events.find(e=>e.type==='pitTrapFired');
 assert.equal(first.shot,1);
 assert.equal(first.side,0);
 const secondDue=t.fireAt;
 assert(secondDue-g.time>=t.interval-.01,'second orb delayed rather than simultaneous');
 g.player.x+=.8;g.player.y+=.7;
 g.time=secondDue-.01;updatePitEnvironment(g,.01);
 assert.equal(g.projectiles.length,1,'no second shot before the gap');
 due(g,t);
 assert.equal(g.projectiles.length,2);
 assert.equal(t.fireAt,null);
 assert(g.events.filter(e=>e.type==='pitTrapFired').length===2);
 for(const e of g.events.filter(e=>e.type==='pitTrapFired')){
  assert.equal(e.targetX,target.x);assert.equal(e.targetY,target.y);
  assert.equal(e.x,t.muzzleX);assert.equal(e.y,t.muzzleY);
 }
 updatePitEnvironment(g,.01);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,2,'no repeat without new entry');
});

test('Shattered Choir crossfire uses two actual opposing muzzles, alternating next entry',()=>{
 const {g,t}=fixture(6);
 assert.equal(t.pattern,'crossfire');
 assert(g.events.some(e=>e.type==='pitTell'&&/CROSSFIRE/.test(e.text)));
 due(g,t);
 const first=g.events.find(e=>e.type==='pitTrapFired');
 assert.equal(first.shot,1);assert.equal(first.side,0);
 assert.equal(first.x,t.muzzleX);
 due(g,t);
 const shots=g.events.filter(e=>e.type==='pitTrapFired');
 assert.equal(shots.length,2);
 assert.equal(shots[1].shot,2);assert.equal(shots[1].side,1);
 assert.equal(shots[1].x,t.secondMuzzleX);
 assert.equal(shots[1].targetX,first.targetX);
 assert.equal(shots[1].targetY,first.targetY);
 assert.equal(t.volleyCycle,1);
 // Once cooldown has expired, physically leave and re-enter. The starting
 // wall alternates while the second always answers from the opposite side.
 g.time=t.readyAt+.01;g.player.y+=1.1;updatePitEnvironment(g,.01);
 g.player.y-=1.1;updatePitEnvironment(g,.01);
 assert.equal(g.events.filter(e=>e.type==='pitTrapArmed').length,2);
 due(g,t);due(g,t);
 const secondVolley=g.events.filter(e=>e.type==='pitTrapFired').slice(2);
 assert.equal(secondVolley.length,2);
 assert.deepEqual(secondVolley.map(e=>e.side),[1,0]);
});

test('both projectiles use core wall/door collision and shield instead of custom hit detection',()=>{
 const {g,t}=fixture(7),hp=g.player.health;
 g.shieldTime=4;g.shieldCharge=t.damage*2+4;
 due(g,t);due(g,t);
 assert.equal(g.projectiles.length,2);
 for(let i=0;i<55;i++)g.updateProjectiles(.05);
 assert.equal(g.player.health,hp);
 assert.equal(g.shieldCharge,4,'both shield impacts should consume the real damage budget');
 assert.equal(g.events.filter(e=>e.type==='shieldHit').length,2);
 assert.equal(g.projectiles.length,0);
 const other=fixture(6),c=other.g;
 due(c,other.t);due(c,other.t);
 c.level.cells[20][3]=1;c.level.cells[20][7]=1;
 const before=c.player.health;
 for(let i=0;i<70;i++)c.updateProjectiles(.05);
 assert.equal(c.player.health,before,'a wall stops either side of the volley');
 assert.equal(c.projectiles.length,0);
});

test('full projectile budget skips spent volley slots instead of spamming when space frees',()=>{
 const {g,t}=fixture(7);
 g.projectiles=Array.from({length:96},(_,id)=>({x:1,y:1,a:0,speed:0,life:5,enemy:true,damage:0,color:'#fff',id}));
 due(g,t);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,0);
 assert.equal(t.volleyShot,1);
 g.projectiles=[];
 due(g,t);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,1);
 assert.equal(g.events.find(e=>e.type==='pitTrapFired').shot,2);
 assert.equal(t.fireAt,null);
 updatePitEnvironment(g,.01);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,1);
});

test('mid-volley Pit checkpoint restores pending delayed shot exactly once, old saves still load',()=>{
 const {g,t}=fixture(6);
 g.pitRecord=Array.from({length:6},(_,i)=>({stage:i+1}));
 due(g,t);
 const snap=g.snapshot(),pending=t.fireAt;
 const restored=new Game();
 assert.equal(restored.restore(snap,{campaign:'pit'}),true);
 const a=restored.level.traps[0];
 assert.equal(a.volleyShot,1);assert.equal(a.fireAt,pending);
 assert.equal(a.targetX,t.targetX);assert.equal(a.targetY,t.targetY);
 due(restored,a);
 assert.equal(restored.events.filter(e=>e.type==='pitTrapFired').length,1);
 assert.equal(restored.events.find(e=>e.type==='pitTrapFired').shot,2);
 assert.equal(a.fireAt,null);
 due(g,t);
 assert.equal(g.events.filter(e=>e.type==='pitTrapFired').length,2);
 const old=structuredClone(snap);
 delete old.level.traps;
 const oldGame=new Game();
 assert(oldGame.restore(old,{campaign:'pit'}));
 assert.doesNotThrow(()=>updatePitEnvironment(oldGame,.05));
 assert.equal(oldGame.snapshot().schema,'btm.pit/1');
});
