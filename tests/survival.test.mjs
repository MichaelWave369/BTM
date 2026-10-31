import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,RESERVE_CAPACITY,canOccupy} from '../src/core.js';
function arena(){const g=new Game();g.start();for(let y=1;y<24;y++)for(let x=1;x<28;x++)g.level.cells[y][x]=0;g.level.doors={};g.level.enemies=[];g.level.items=[];g.level.captives=[];g.player.x=4.5;g.player.y=4.5;g.player.a=0;g.events=[];return g;}
const tick=(g,n=20)=>{for(let i=0;i<n;i++)g.update(.05);};
function enemy(g,type='plugged',x=5.8,y=4.5){const e={...createLevel(type==='warden'?2:0).enemies.find(e=>e.type===type),x,y,stun:0};g.level.enemies.push(e);return e;}
test('new runs use finite Survival charge; idle, relays and sector changes print no ammo',()=>{
 const g=arena();assert.equal(g.energyMode,'survival');assert.equal(g.player.energy,100);assert.equal(g.player.reserve,45);
 g.player.energy=17;g.player.reserve=6;tick(g,100);assert.equal(g.player.energy,17);
 g.level.relays=[{x:4.5,y:4.5,active:false}];g.interact();assert.equal(g.player.energy,17);assert.equal(g.player.reserve,6);
 g.loadLevel(1);assert.equal(g.player.energy,17);assert.equal(g.player.reserve,6);
});
test('reload transfers finite reserves after delay, supports partials and zero reserve',()=>{
 const g=arena();g.player.energy=7;g.player.reserve=29;assert(g.reload());assert.equal(g.shoot(),false);tick(g,8);assert.equal(g.player.energy,7);assert.equal(g.reload(),false);tick(g,12);assert.equal(g.player.energy,36);assert.equal(g.player.reserve,0);assert.equal(g.reload(),false);
 g.player.energy=93;g.player.reserve=19;g.recharge=0;g.reload();tick(g);assert.equal(g.player.energy,100);assert.equal(g.player.reserve,12);assert.equal(g.reload(),false);
});
test('energy cells fill reserves, retain capacity overflow and persist partial pickups',()=>{
 const g=arena();g.player.reserve=170;g.level.items=[{id:99,x:4.5,y:4.5,type:'energy',taken:false}];tick(g,1);assert.equal(g.player.reserve,RESERVE_CAPACITY);assert.equal(g.level.items[0].remaining,35);assert.equal(g.level.items[0].taken,false);
 const h=new Game();h.restore(g.snapshot());h.player.energy=60;h.reload();tick(h);assert.equal(h.player.energy,100);assert.equal(h.player.reserve,175);assert(h.level.items[0].taken);
});
test('retry and saving mid-reload conserve charge and pickup state together',()=>{
 const g=arena();g.player.energy=13;g.player.reserve=21;g.level.items=[{id:1,x:4.5,y:4.5,type:'energy',taken:true}];g.reload();tick(g,3);g.saveCheckpoint();
 for(let i=0;i<4;i++){g.player.energy=0;g.player.reserve=0;g.retry();assert.equal(g.player.energy,13);assert.equal(g.player.reserve,21);assert(g.level.items[0].taken);assert.equal(g.vent,0);}
 g.reload();tick(g);assert.equal(g.player.energy+g.player.reserve,34);
});
test('legacy v1 saves retain old recharge and migrate without a finite-reserve gift',()=>{
 const g=arena(),old=g.snapshot();delete old.energyMode;delete old.player.reserve;old.player.energy=10;
 const h=new Game();h.restore(old);assert.equal(h.energyMode,'legacy');assert.equal(h.player.reserve,0);tick(h);assert(h.player.energy>10);h.loadLevel(1);assert.equal(h.player.energy,100);
 h.start({energyMode:'legacy'});assert.equal(h.player.energy,100);h.player.energy=5;assert(h.reload());tick(h);assert(h.player.energy>45);
});
test('all energy guns dry fire at zero; the original slap remains dangerous and free',()=>{
 const g=arena(),e=enemy(g,'plugged',5.5);g.player.energy=0;g.unlocked=6;
 for(let w=1;w<6;w++){g.weapon=w;g.cooldown=0;assert.equal(g.shoot(),false);assert.equal(e.hp,e.maxHp);}g.weapon=0;g.cooldown=0;assert(g.shoot());assert(e.hp<e.maxHp);assert.equal(g.player.energy,0);
});
test('dash hits one frontal target, respects armor and never strikes through walls',()=>{
 for(const type of ['plugged','enforcer','warden']){const g=arena(),e=enemy(g,type),hp=e.hp;assert(g.dodge());assert(e.hp<hp);assert(e.stun>0);assert.equal(g.shieldCharge,0);assert(canOccupy(g.level,g.player.x,g.player.y));assert.equal(g.dodge(),false);if(type==='warden')assert(hp-e.hp<=8);}
 const g=arena(),e=enemy(g,'plugged',6);g.level.cells[4][5]=1;const hp=e.hp;g.dodge();assert.equal(e.hp,hp);assert(g.player.x<4.81);assert(g.shieldCharge>0);
});
test('rear/lateral targets are not frontal bashes; shield absorbs at most 18 and expires',()=>{
 const g=arena(),e=enemy(g,'plugged',3.5);g.player.armor=0;g.dodge();assert.equal(e.hp,e.maxHp);g.damagePlayer(10);assert.equal(g.player.health,100);g.damagePlayer(20);assert.equal(g.player.health,88);assert.equal(g.shieldCharge,0);
 const h=arena();h.player.armor=0;h.dodge();tick(h,7);h.damagePlayer(10);assert.equal(h.player.health,90);h.mode='paused';h.dodgeCooldown=0;assert.equal(h.dodge(),false);
});
test('dash uses tracked aim without changing body yaw and captured controls suppress bash',async()=>{
 const g=arena(),e=enemy(g,'plugged',4.5,5.8);g.setCombatPose({head:{x:4.5,y:4.5,height:1},aim:{origin:{x:4.5,y:4.5,height:.7},direction:{x:0,y:1,z:0}}});g.dodge();assert(e.hp<e.maxHp);assert.equal(g.player.a,0);
 const {fixture}=await import('./immersive-checks.js'),{stepImmersive}=await import('../src/immersive-play.js');const f=fixture();f.pad.actions=['dodge','reload'];const before=f.g.player.reserve;stepImmersive(f.g,{rig:f.rig,pose:f.pose,pointerTarget:()=>({action:()=>{}})},f.pad,{},.02);assert.equal(f.g.dodgeCooldown,0);assert.equal(f.g.vent,0);assert.equal(f.g.player.reserve,before);
});
