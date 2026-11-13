import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {traceTrackedShot} from '../src/spatial.js';
import {advanceVerticalBody,STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {soloSentryWaypoint,moveSoloUpperSentry} from '../src/solo-vertical-combat.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
import {readFileSync} from 'node:fs';

const preview=index=>{const g=new Game();g.start({verticalPreview:true});if(index)g.loadLevel(index,false);return g;};
const sentry=g=>g.level.enemies.find(e=>e.upperGuard);

test('every original stage has one optional upstairs combatant, while flat, Pit and co-op stay untouched',()=>{
 for(let i=0;i<12;i++){
  const normal=createLevel(i),vertical=createLevel(i,'original',{verticalPreview:true});
  const guards=vertical.enemies.filter(e=>e.upperGuard);
  assert.equal(guards.length,1,SECTORS[i].name);
  const e=guards[0],u=vertical.vertical.upper;
  assert(e.x>=u.x0&&e.x<u.x1&&e.y>=u.y0&&e.y<u.y1);
  assert.equal(e.floorHeight,STACK_HEIGHT);
  assert.equal(e.height,STACK_HEIGHT);
  assert.equal(e.supportSurface,'upper');
  assert.equal(e.human,false);
  assert.equal(e.pitBoss,undefined);
  assert.equal(e.maxHp,e.hp);
  assert(e.maxHp>0&&e.damage>0);
  assert.equal(vertical.enemies.length,normal.enemies.length+1);
  assert(normal.enemies.every(e=>!e.upperGuard&&e.floorHeight===undefined));
  assert(!createLevel(i,'pit',{verticalPreview:true}).enemies.some(e=>e.upperGuard));
  assert(vertical.key&&vertical.relays.length===normal.relays.length);
 }
});
test('upper sentry navigates the authored ramp down without teleporting between stories',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),e=sentry(g),r=g.level.vertical.ramp,
   target={x:r.x0+.5,y:(r.y0+r.y1)/2,height:0};
  let sawRamp=false,steps=0,last=e.height;
  e.state='pursue';e.range=1;
  for(;steps<2000;steps++){
   const oldX=e.x,oldY=e.y;
   moveSoloUpperSentry(g.level,e,target,1/60);
   advanceVerticalBody(g.level,e,1/60,{oldX,oldY});
   e.floorHeight=e.height;
   if(e.supportSurface==='ramp')sawRamp=true;
   assert(Number.isFinite(e.height)&&e.height>=0&&e.height<3.9);
   assert(Math.abs(e.height-last)<.2,SECTORS[i].name+' cannot teleport in height');
   last=e.height;
   if(sawRamp&&e.height<.5)break;
  }
  assert(sawRamp,SECTORS[i].name+' ramp is never entered');
  assert(e.height<.5,SECTORS[i].name+' guard failed descent: x='+e.x+', y='+e.y+', feet='+e.height);
  const back=soloSentryWaypoint(g.level,e,{x:e.homeX,y:e.homeY,height:STACK_HEIGHT});
  assert(back,SECTORS[i].name+' can route back upstairs');
 }
});
test('upper sentry can climb back up the actual ramp instead of phasing through the deck',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),e=sentry(g),r=g.level.vertical.ramp,
   home={x:e.homeX,y:e.homeY,height:STACK_HEIGHT};
  e.x=r.x0+.5;e.y=(r.y0+r.y1)/2;e.height=0;e.vz=0;
  e.grounded=true;e.supportSurface='ground';e.floorHeight=0;
  let reached=false;
  for(let n=0;n<2500;n++){
   const oldX=e.x,oldY=e.y;
   moveSoloUpperSentry(g.level,e,home,1/60);
   advanceVerticalBody(g.level,e,1/60,{oldX,oldY});
   if(e.height>=STACK_HEIGHT-.05&&Math.hypot(e.x-home.x,e.y-home.y)<.7){reached=true;break;}
  }
  assert(reached,SECTORS[i].name+' sentry cannot get back upstairs');
 }
});
test('upper guard AI can recognize and pursue a player standing on the same deck',()=>{
 const g=preview(0),e=sentry(g);
 g.player.x=e.x-1.5;g.player.y=e.y;g.player.height=STACK_HEIGHT;g.player.grounded=true;g.player.supportSurface='upper';
 const oldX=e.x;for(let n=0;n<90;n++){g.time+=1/60;g.updateWorld(1/60);}
 assert(e.state==='pursue');
 assert(e.x<oldX-.2,'guard moves toward nearby deck player');
 assert(Math.abs(e.floorHeight-e.height)<.001);
});
test('projectile hit volumes are genuinely floor aware in both directions',()=>{
 const g=preview(0),e=sentry(g);g.level.enemies=[e];
 g.player.x=e.x;g.player.y=e.y;g.player.height=0;g.player.armor=0;
 let hp=g.player.health;
 const projectile=(enemy,height)=>({x:e.x,y:e.y,height,vh:0,a:0,speed:0,life:.5,damage:10,enemy,color:'#f66',r:.12});
 g.projectiles=[projectile(true,STACK_HEIGHT+.6)];g.updateProjectiles(.02);
 assert.equal(g.player.health,hp,'upstairs beam cannot hit player below same floor tile');
 e.stun=1;const guardHp=e.hp;
 g.projectiles=[projectile(false,.6)];g.updateProjectiles(.02);
 assert.equal(e.hp,guardHp,'ground shot cannot hit a sentry through upper deck');
 g.projectiles=[projectile(false,STACK_HEIGHT+.6)];g.updateProjectiles(.02);
 assert(e.hp<guardHp,'same-floor projectile damages upstairs sentry');
 g.player.height=STACK_HEIGHT;hp=g.player.health;
 g.projectiles=[projectile(true,STACK_HEIGHT+.6)];g.updateProjectiles(.02);
 assert(g.player.health<hp,'same-floor enemy shot can hurt the player');
});
test('tracked VR gun respects the elevated sentry and its solid deck',()=>{
 const l=createLevel(0,'original',{verticalPreview:true}),e=l.enemies.find(e=>e.upperGuard);
 const aim=(height)=>({origin:{x:e.x-.8,y:e.y,height},direction:{x:.8,y:0,z:STACK_HEIGHT+.5-height}});
 const weapon={range:20,spread:0};
 assert.equal(traceTrackedShot(l,aim(.8),weapon).targets.filter(t=>t.entity===e).length,0);
 assert.equal(traceTrackedShot(l,aim(STACK_HEIGHT+1.5),weapon).targets.filter(t=>t.entity===e).length,1);
});
test('preview sentry survives memory snapshot without touching original v1 save',()=>{
 const g=preview(6),snap=g.snapshot(),saved={setItem(){throw Error('unexpected disk write')}};
 assert.throws(()=>writeCampaignCheckpoint(saved,g),/Preview/i);
 const restored=new Game();restored.restore(snap);
 assert(restored.level.enemies.some(e=>e.upperGuard&&e.floorHeight===STACK_HEIGHT));
 assert.equal(restored.level.enemies.length,g.level.enemies.length);
});
test('native stereo and classic sprites use their actual floor elevations',()=>{
 const world=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 assert(world.includes('e.floorHeight||0'));
 assert(classic.includes('floorHeight:e.floorHeight||0'));
});
