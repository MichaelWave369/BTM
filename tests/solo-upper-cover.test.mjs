import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,moveBody,SECTORS,canOccupy} from '../src/core.js';
import {STACK_HEIGHT,initVerticalBody,advanceVerticalBody,verticalSight} from '../src/net/vertical-arena.js';
import {authoredSoloUpperCover,coverIntersectsBody,traceUpperCover} from '../src/solo-cover.js';
import {traceEnvironment,traceTrackedShot} from '../src/spatial.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
const make=i=>{const g=new Game();g.start({verticalPreview:true});if(i)g.loadLevel(i,false);return g;};

test('all 12 solo mezzanines have two valid physical barricades with central lane and objectives clear',()=>{
 for(let index=0;index<12;index++){
  const g=make(index),l=g.level,u=l.vertical.upper,covers=l.upperCover;
  assert.equal(covers.length,2,SECTORS[index].name);
  assert.deepEqual(covers,authoredSoloUpperCover(l.vertical));
  assert.equal(covers[0].y,u.y0+.5);assert.equal(covers[1].y,u.y1-.5);
  const x=covers[0].x,centerY=u.y0+Math.floor((u.y1-u.y0)/2)+.5;
  assert.equal(coverIntersectsBody(l,x,centerY,.2,{height:STACK_HEIGHT}),false,'middle lane clear');
  assert(l.items.filter(i=>i.bonusUpper).every(i=>!coverIntersectsBody(l,i.x,i.y,.2,{height:STACK_HEIGHT})));
  assert(!coverIntersectsBody(l,l.upperUplink.x,l.upperUplink.y,.2,{height:STACK_HEIGHT}));
  assert(!coverIntersectsBody(l,l.enemies.find(e=>e.upperGuard).x,l.enemies.find(e=>e.upperGuard).y,.2,{height:STACK_HEIGHT}));
  assert(validSoloPreviewCheckpoint(l,g.player));
  const flat=createLevel(index),pit=createLevel(index,'pit',{verticalPreview:true});
  assert.equal(flat.upperCover,undefined);
  assert.equal(pit.upperCover,undefined);
  assert(buildLevelGeometry(l).vertexCount>buildLevelGeometry({...l,upperCover:[]}).vertexCount,'actual native mesh cover geometry');
 }
});

test('ground-floor movement beneath each barricade remains free; upper body hits solid obstruction',()=>{
 for(let index=0;index<12;index++){
  const l=make(index).level,c=l.upperCover[0];
  assert.equal(canOccupy(l,c.x,c.y,.2,{height:0}),true);
  assert.equal(canOccupy(l,c.x,c.y,.2,{height:STACK_HEIGHT}),false);
  assert(coverIntersectsBody(l,c.x,c.y,.2,{height:STACK_HEIGHT}));
  const player={x:c.x-.9,y:c.y,height:STACK_HEIGHT};
  moveBody(l,player,1.8,0);
  assert(player.x<c.x-c.width/2-.15,SECTORS[index].name+' no upper-floor walk-through');
  const below={x:c.x-.9,y:c.y,height:0};
  moveBody(l,below,1.8,0);
  assert(below.x>c.x+.8,SECTORS[index].name+' ground floor remains traversable under cover');
 }
});

test('tracked shots, Classic vertical sight, and projectiles use one real 3D cover hitbox',()=>{
 const g=make(0),l=g.level,c=l.upperCover[0],h=STACK_HEIGHT+.75;
 const origin={x:c.x-1,y:c.y,height:h},direction={x:1,y:0,z:0};
 const hit=traceEnvironment(l,origin,direction,3);
 assert.equal(hit.type,'cover');assert(hit.distance>.2&&hit.distance<1);
 assert.equal(traceUpperCover(l,origin,direction,3)?.cover.id,c.id);
 assert.notEqual(traceEnvironment(l,{...origin,height:.5},direction,3).type,'cover','same shot underneath deck is unobstructed by upper barricade');
 const e=l.enemies.find(e=>e.upperGuard);
 assert.equal(e.y,c.y,'first sector has a guard behind north cover');
 assert.equal(traceTrackedShot(l,{origin,direction},{range:3,spread:0}).targets.some(t=>t.entity===e),false);
 assert.equal(verticalSight(l,{x:origin.x,y:origin.y,height:STACK_HEIGHT},{x:e.x,y:e.y,height:STACK_HEIGHT}),false);
 g.level.enemies=[e];e.stun=2;
 const bullet=(height)=>({x:origin.x,y:origin.y,height,vh:0,a:0,speed:12,life:1,damage:15,enemy:false,color:'#fff',r:.1});
 const before=e.hp;
 g.projectiles=[bullet(h)];for(let i=0;i<5&&g.projectiles.length;i++)g.updateProjectiles(.05);
 assert.equal(e.hp,before,'cover absorbed the weapon projectile');
 assert.equal(g.projectiles.length,0);
 const behind={x:e.x,y:e.y,height:STACK_HEIGHT+1.0};
 assert.equal(traceEnvironment(l,behind,{x:-1,y:0,z:0},4).type==='cover',true,'cover works from either side');
});

test('ramp traversal and elevated guard vertical support remain usable with cover enabled',()=>{
 for(let index=0;index<12;index++){
  const l=make(index).level,r=l.vertical.ramp,u=l.vertical.upper;
  const p=initVerticalBody({x:r.x0+.5,y:r.y0+.5});
  for(let step=0;step<260&&p.x<u.x0+.45;step++){
   const oldX=p.x,oldY=p.y;
   moveBody(l,p,.035,0);
   advanceVerticalBody(l,p,1/60,{oldX,oldY});
  }
  assert(p.x>=u.x0+.4,SECTORS[index].name+' ramp unobstructed');
  assert.equal(p.supportSurface,'upper');
 }
});

test('cover is not a new extraction gate and cannot be forged through the memory-only preview save',()=>{
 const g=make(7),store={writes:0,setItem(){this.writes++}};
 const saved=g.snapshot();
 assert.equal(saved.level.upperCover.length,2);
 const restored=new Game();restored.restore(saved);
 assert.deepEqual(restored.level.upperCover,g.level.upperCover);
 for(const modify of [
  s=>{s.level.upperCover[0].height=0;},
  s=>{s.level.upperCover[0].x+=.5;},
  s=>{s.level.upperCover.pop();}
 ]){
  const bad=structuredClone(saved);modify(bad);
  assert.throws(()=>new Game().restore(bad),/checkpoint/i);
 }
 g.level.relays.forEach(r=>r.active=true);g.player.key=true;
 assert.equal(g.exitReady,true,'cover never makes another objective mandatory');
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const normal=new Game();normal.start();
 assert.equal('upperCover' in normal.snapshot().level,false);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,normal));
});

test('both renderers and flight paths are wired to the same authored cover',()=>{
 const core=readFileSync(new URL('../src/core.js',import.meta.url),'utf8');
 const native=readFileSync(new URL('../src/level-geometry.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 const spatial=readFileSync(new URL('../src/spatial.js',import.meta.url),'utf8');
 const movement=readFileSync(new URL('../src/collision.js',import.meta.url),'utf8');
 assert(native.includes('for(const c of level.upperCover||[])'));
 assert(classic.includes("o.type==='upperCover'"));
 assert(spatial.includes("type='cover'"));
 assert(core.includes("deck.type==='cover'"));
 assert(movement.includes('coverIntersectsBody'));
});
