import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

const preview=()=>{const g=new Game();g.start({verticalPreview:true});return g;};
const guard=g=>g.level.enemies.find(e=>e.upperGuard);

test('every two-story solo sector has one optional living upper sentry hunt, but normal and Pit do not',()=>{
 for(let index=0;index<12;index++){
  const flat=createLevel(index),vertical=createLevel(index,'original',{verticalPreview:true});
  assert.equal(flat.upperGuardCleared,undefined,SECTORS[index].name);
  assert.equal(flat.enemies.some(e=>e.upperGuard),false);
  assert.equal(vertical.upperGuardCleared,false,SECTORS[index].name);
  assert.equal(vertical.enemies.filter(e=>e.upperGuard).length,1);
  const g=preview();if(index)g.loadLevel(index,false);
  assert.equal(g.totalUpperClears,0);
  assert(validSoloPreviewCheckpoint(g.level,g.player));
  assert.equal(createLevel(index,'pit',{verticalPreview:true}).upperGuardCleared,undefined);
 }
});

test('defeating an upper guard grants capped health and armor once and saves the actual cleared guard',()=>{
 const g=preview(),e=guard(g);
 Object.assign(g.player,{health:62,armor:23});
 const firstHp=e.hp;
 g.damageEnemy(e,firstHp+100);
 assert.equal(e.dead,true);
 assert.equal(g.level.upperGuardCleared,true);
 assert.equal(g.totalUpperClears,1);
 assert.equal(g.player.health,82);
 assert.equal(g.player.armor,38);
 assert.equal(g.checkpoint.level.upperGuardCleared,true);
 assert.equal(g.checkpoint.level.enemies.find(e=>e.upperGuard).dead,true);
 assert(g.events.some(e=>e.type==='toast'&&e.text==='UPPER SENTRY CLEARED / 1/12'));
 g.damageEnemy(e,1000);
 assert.equal(g.totalUpperClears,1);
 assert.equal(g.player.health,82);
 g.retry();
 assert.equal(g.totalUpperClears,1);
 assert.equal(guard(g).dead,true);
 assert.equal(g.level.upperGuardCleared,true);
 assert.equal(g.player.health,82);
});

test('upper guard hunt tally spans all twelve sectors with no effect on mandatory gold extraction',()=>{
 const g=preview();
 g.level.relays.forEach(r=>r.active=true);
 g.player.key=true;
 assert.equal(g.exitReady,true,'unbeaten optional upper guard must not lock extraction');
 for(let index=0;index<12;index++){
  if(index)g.loadLevel(index,false);
  const e=guard(g);
  g.player.health=99;
  g.player.armor=98;
  g.damageEnemy(e,e.hp+100);
  assert.equal(g.totalUpperClears,index+1,SECTORS[index].name);
  assert.equal(g.player.health,100,'health reward capped');
  assert.equal(g.player.armor,100,'armor reward capped');
  assert.equal(g.level.upperGuardCleared,true);
  assert(validSoloPreviewCheckpoint(g.level,g.player));
 }
 const restored=new Game();restored.restore(g.snapshot());
 assert.equal(restored.totalUpperClears,12);
 assert.equal(restored.level.upperGuardCleared,true);
});

test('tampered sentry state or counters are rejected, while flat v1 and Pit saves remain isolated',()=>{
 const g=preview(),e=guard(g),store={writes:0,setItem(){this.writes++;}};
 g.damageEnemy(e,e.hp+100);
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const s=g.snapshot();
 for(const modify of [
  t=>{t.level.upperGuardCleared=false;},
  t=>{t.level.enemies.find(e=>e.upperGuard).dead=false;},
  t=>{t.totalUpperClears=13;},
  t=>{t.totalUpperClears=-1;},
  t=>{delete t.totalUpperClears;}
 ]){
  const bad=structuredClone(s);modify(bad);
  assert.throws(()=>new Game().restore(bad),/checkpoint/i);
 }
 const flat=new Game();flat.start();
 assert.equal('totalUpperClears' in flat.snapshot(),false);
 assert.equal(flat.level.upperGuardCleared,undefined);
 const pit=new Game();pit.startPit();
 assert.equal('totalUpperClears' in pit.snapshot(),false);
 assert.equal(pit.level.upperGuardCleared,undefined);
 assert.doesNotThrow(()=>new Game().restore(flat.snapshot()));
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,flat));
 assert.equal(store.writes,1);
});

test('wrist and classic map show living upper sentries and preview-only progress',()=>{
 const wrist=readFileSync(new URL('../src/world-ui.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert(wrist.includes("g.fillText('SENTRY '+(game.totalUpperClears||0)+'/12'"));
 assert(wrist.includes('l.enemies.find(e=>e.upperGuard&&!e.dead)'));
 assert(classic.includes('l.enemies.filter(e=>e.upperGuard&&!e.dead)'));
 assert(main.includes("summary.push(['SENTRIES '+(game.totalUpperClears||0)+'/12'"));
});
