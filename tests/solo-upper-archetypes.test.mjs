import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {SOLO_UPPER_GUARDS,soloUpperRole,moveSoloUpperSentry} from '../src/solo-vertical-combat.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

const make=index=>{const g=new Game();g.start({verticalPreview:true});if(index)g.loadLevel(index,false);return g;};
const guard=g=>g.level.enemies.find(e=>e.upperGuard);

test('twelve preview sectors alternate four breachers, marksmen and bulwarks without affecting standard missions',()=>{
 const counts={breacher:0,marksman:0,bulwark:0};
 for(let i=0;i<12;i++){
  const g=make(i),e=guard(g),role=soloUpperRole(i),flat=createLevel(i);
  assert.equal(e.upperGuardRole,role.id,SECTORS[i].name);
  assert.equal(e.type,'enforcer');
  assert.equal(e.range,role.range);
  assert.equal(e.delay,role.delay);
  assert.equal(e.coverReady,role.id==='bulwark');
  assert.equal(e.coverRecharge,0);
  assert.equal(e.hp,e.maxHp);
  assert(validSoloPreviewCheckpoint(g.level,g.player));
  counts[e.upperGuardRole]++;
  assert.equal(flat.enemies.some(e=>e.upperGuardRole),false);
  assert.equal(flat.upperGuardCleared,undefined);
  assert.equal(createLevel(i,'pit',{verticalPreview:true}).enemies.some(e=>e.upperGuardRole),false);
 }
 assert.deepEqual(counts,{breacher:4,marksman:4,bulwark:4});
 assert.equal(SOLO_UPPER_GUARDS.length,3);
 assert(soloUpperRole(0).speed>soloUpperRole(1).speed);
 assert(soloUpperRole(1).range>soloUpperRole(0).range);
 assert(soloUpperRole(2).hp>soloUpperRole(0).hp);
});

test('bulwark absorbs only the first weapon impact, recharges, and Ori stun bypasses its cover',()=>{
 const g=make(2),e=guard(g),hp=e.hp;
 assert.equal(e.coverReady,true);
 g.damageEnemy(e,35);
 assert.equal(e.hp,hp-13,'22 damage shield absorption before weapon hit');
 assert.equal(e.coverReady,false);
 assert.equal(e.coverRecharge,6);
 assert(g.events.some(event=>event.type==='toast'&&event.text.includes('BULWARK COVER')));
 g.damageEnemy(e,30);
 assert.equal(e.hp,hp-43,'no second cover absorption before recharge');
 for(let i=0;i<120;i++)g.updateEnemy(e,.05);
 assert.equal(e.coverReady,true,'shield should recharge after six seconds');
 assert.equal(e.coverRecharge,0);
 e.stun=3;const before=e.hp;
 g.damageEnemy(e,25);
 assert.equal(e.hp,before-25,'Ori stun exposes full damage');
 assert.equal(e.coverReady,true,'stunned shield does not consume its charge');
 g.damageEnemy(e,25);
 assert.equal(e.hp,before-50);
 assert.equal(e.coverReady,true);
 const saved=g.snapshot(),next=new Game();next.restore(saved);
 assert.equal(guard(next).upperGuardRole,'bulwark');
 assert.equal(guard(next).coverReady,true);
});

test('marksman strafes safely within the authored upper deck and retains the existing ramp navigation',()=>{
 const g=make(1),e=guard(g),u=g.level.vertical.upper;
 e.state='pursue';
 const target={x:u.x0+.6,y:u.y1-.6,height:STACK_HEIGHT,supportSurface:'upper'};
 const start={x:e.x,y:e.y};
 let moved=false;
 for(let i=0;i<180;i++){
  e.walk+=.05;
  const before={x:e.x,y:e.y};
  moveSoloUpperSentry(g.level,e,target,.05);
  moved||=Math.hypot(e.x-before.x,e.y-before.y)>.001;
  assert(e.x>=u.x0+.28&&e.x<=u.x1-.28,SECTORS[1].name+' x');
  assert(e.y>=u.y0+.28&&e.y<=u.y1-.28,SECTORS[1].name+' y');
 }
 assert(moved,'marksman moves in a strafing orbit');
 assert(Math.hypot(e.x-start.x,e.y-start.y)>.1);
 const below={x:g.level.vertical.ramp.x0+.5,y:(g.level.vertical.ramp.y0+g.level.vertical.ramp.y1)/2,height:0};
 assert(moveSoloUpperSentry(g.level,e,below,.05),'marksman must still use the common ramp route');
});

test('long-range guard has a clear advance warning before projectile firing',()=>{
 const g=make(1),e=guard(g);
 const u=g.level.vertical.upper;
 Object.assign(g.player,{x:u.x0+.5,y:u.y1-.5,height:STACK_HEIGHT,supportSurface:'upper'});
 e.state='pursue';e.cooldown=0;e.tell=0;
 g.updateEnemy(e,.05);
 assert(e.tell>.9,'marksman retains a readable long telegraph');
 assert.equal(g.projectiles.length,0);
 assert(g.level.enemies.filter(e=>e.upperGuard).length===1);
});

test('optional sentry hunt and temporary snapshots reject forged combat roles and preserve legacy storage',()=>{
 const g=make(2),e=guard(g),s=g.snapshot();
 const bad=structuredClone(s);bad.level.enemies.find(e=>e.upperGuard).upperGuardRole='breacher';
 assert.throws(()=>new Game().restore(bad),/checkpoint/i);
 const badTimer=structuredClone(s);badTimer.level.enemies.find(e=>e.upperGuard).coverRecharge=9;
 assert.throws(()=>new Game().restore(badTimer),/checkpoint/i);
 const store={writes:0,setItem(){this.writes++;}};
 g.damageEnemy(e,e.hp+100);
 assert.equal(g.totalUpperClears,1);
 assert.equal(g.level.upperGuardCleared,true);
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const flat=new Game();flat.start();
 assert.equal('totalUpperClears' in flat.snapshot(),false);
 assert.equal(flat.level.enemies.some(e=>e.upperGuardRole),false);
 const pit=new Game();pit.startPit();
 assert.equal(pit.level.enemies.some(e=>e.upperGuardRole),false);
 assert.doesNotThrow(()=>new Game().restore(flat.snapshot()));
});

test('native stereo and Classic show three clearly differentiated guard roles without new art dependencies',()=>{
 const stereo=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 assert(stereo.includes("e.upperGuardRole==='breacher'"));
 assert(stereo.includes("e.upperGuardRole==='marksman'"));
 assert(stereo.includes("e.upperGuardRole==='bulwark'"));
 assert(stereo.includes('e.coverReady'));
 assert(classic.includes("o.e.upperGuardRole==='breacher'"));
 assert(classic.includes("o.e.upperGuardRole==='marksman'"));
 assert(classic.includes('o.e.coverReady'));
});
