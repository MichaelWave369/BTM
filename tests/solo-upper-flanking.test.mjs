import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS,canOccupy} from '../src/core.js';
import {STACK_HEIGHT,advanceVerticalBody,verticalSight} from '../src/net/vertical-arena.js';
import {soloUpperFlankWaypoint,moveSoloUpperSentry,soloSentryWaypoint} from '../src/solo-vertical-combat.js';
import {coverIntersectsBody} from '../src/solo-cover.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
const make=i=>{const g=new Game();g.start({verticalPreview:true});if(i)g.loadLevel(i,false);return g;};
const guard=g=>g.level.enemies.find(e=>e.upperGuard);
const across=(l)=>({x:l.vertical.upper.x0+.5,y:l.vertical.upper.y0+.5,height:STACK_HEIGHT,supportSurface:'upper'});

test('all 12 guards select genuinely walkable cover bypasses without changing their combat roles',()=>{
 for(let i=0;i<12;i++){
  const g=make(i),l=g.level,e=guard(g),target=across(l);
  assert.equal(verticalSight(l,e,target),false,SECTORS[i].name+' cover must block sight');
  const wp=soloUpperFlankWaypoint(l,e,target);
  assert(wp,SECTORS[i].name+' needs a safe flanking node');
  assert(canOccupy(l,wp.x,wp.y,.23,e),SECTORS[i].name+' waypoint collision');
  assert(!coverIntersectsBody(l,wp.x,wp.y,.23,e));
  assert(wp.x>=l.vertical.upper.x0+.23&&wp.x<l.vertical.upper.x1-.23);
  assert(wp.y>=l.vertical.upper.y0+.23&&wp.y<l.vertical.upper.y1-.23);
  assert(validSoloPreviewCheckpoint(l,g.player));
  assert(['breacher','marksman','bulwark'][i%3]===e.upperGuardRole);
 }
});

test('each sentry physically reaches a clear flank lane instead of staring at barricades',()=>{
 for(let i=0;i<12;i++){
  const g=make(i),l=g.level,e=guard(g),target=across(l),begin={x:e.x,y:e.y,height:e.height};
  e.state='pursue';
  let clear=false,sawInside=false;
  for(let n=0;n<800;n++){
   const oldX=e.x,oldY=e.y,oldH=e.height;
   moveSoloUpperSentry(l,e,target,1/60);
   advanceVerticalBody(l,e,1/60,{oldX,oldY});
   e.floorHeight=e.height;
   assert(canOccupy(l,e.x,e.y,.23,e),SECTORS[i].name+' solid barricade collision');
   assert(e.x>=l.vertical.upper.x0+.22&&e.x<l.vertical.upper.x1-.22);
   assert(e.y>=l.vertical.upper.y0+.22&&e.y<l.vertical.upper.y1-.22);
   assert.equal(e.supportSurface,'upper','no fake floor hop');
   assert(Math.abs(e.height-oldH)<.2,'no height teleport');
   if(e.y>l.vertical.upper.y0+.75)sawInside=true;
   if(verticalSight(l,e,target)){clear=true;break;}
  }
  assert(sawInside,SECTORS[i].name+' guard must use inner lane');
  assert(clear,SECTORS[i].name+' guard must regain real 3D line of sight');
  assert(Math.hypot(e.x-begin.x,e.y-begin.y)>.4,SECTORS[i].name+' guard made no progress');
 }
});

test('nearby covered footsteps alert a guard but never authorize shots through a solid obstacle',()=>{
 const g=make(0),e=guard(g),u=g.level.vertical.upper;
 Object.assign(g.player,{x:u.x0+1.2,y:u.y0+.5,height:STACK_HEIGHT,supportSurface:'upper',grounded:true});
 e.state='patrol';e.cooldown=0;e.tell=0;
 assert.equal(verticalSight(g.level,e,g.player),false);
 const hp=g.player.health,before=g.projectiles.length;
 g.updateEnemy(e,.05);
 assert.equal(e.state,'pursue','guard investigated footsteps on same deck');
 assert.equal(e.tell,0,'cover never permits a projectile telegraph without sight');
 assert.equal(g.player.health,hp);
 assert.equal(g.projectiles.length,before);
});

test('nearby ground-floor sounds do not alert upper sentries through the deck',()=>{
 const g=make(0),e=guard(g);
 Object.assign(g.player,{x:e.x-.5,y:e.y,height:0,supportSurface:'ground'});
 e.state='patrol';e.cooldown=0;e.tell=0;
 g.updateEnemy(e,.05);
 assert.equal(e.state,'patrol');
 assert.equal(g.projectiles.length,0);
});

test('safe, direct same-deck pursuit and existing ramp handoff bypass the flank graph',()=>{
 for(let i=0;i<12;i++){
  const g=make(i),e=guard(g),u=g.level.vertical.upper,r=g.level.vertical.ramp;
  const open={x:e.x,y:e.y+.85,height:STACK_HEIGHT,supportSurface:'upper'};
  assert.equal(soloUpperFlankWaypoint(g.level,e,open),null,'direct open approach stays direct');
  const below={x:r.x0+.5,y:(r.y0+r.y1)/2,height:0,supportSurface:'ground'};
  const waypoint=soloSentryWaypoint(g.level,e,below);
  assert(waypoint);
  assert.equal(soloUpperFlankWaypoint(g.level,e,below),null,'never propose a graph route between floors');
  assert.equal(createLevel(i,'original').upperCover,undefined,'flat mode unchanged');
  assert(!createLevel(i,'pit',{verticalPreview:true}).enemies.some(x=>x.upperGuard));
 }
});

test('flank planning never mutates checkpoints, adds save fields, or alters normal disk storage',()=>{
 const g=make(3),e=guard(g),snap=g.snapshot();
 soloUpperFlankWaypoint(g.level,e,across(g.level));
 assert.deepEqual(g.snapshot(),snap,'navigation plan is ephemeral');
 const next=new Game();next.restore(snap);
 assert(validSoloPreviewCheckpoint(next.level,next.player));
 const store={writes:0,setItem(){this.writes++;}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const normal=new Game();normal.start();
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,normal));
 assert.equal(store.writes,1);
});

test('movement and pursuit integrate in existing native engine, no new offline package dependency',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const source=read('src/solo-vertical-combat.js'),core=read('src/core.js');
 assert(source.includes('soloUpperFlankWaypoint(level,sentry,waypoint||target)'));
 assert(source.includes('canOccupy(level,x,y,radius,sentry)'));
 assert(core.includes("e.supportSurface==='upper'&&p.supportSurface==='upper'"));
 assert(read('scripts/build.mjs').includes("'./src/solo-vertical-combat.js'"));
 assert(read('scripts/verify-offline.mjs').includes("'./src/solo-cover.js'"));
});
