import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {upperFragmentPosition,validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

const preview=()=>{const g=new Game();g.start({verticalPreview:true});return g;};
const fragment=level=>level.items.find(i=>i.upperFragment);

test('all twelve authored mezzanines contain one safe, optional violet frequency fragment',()=>{
 for(let index=0;index<12;index++){
  const original=createLevel(index),level=createLevel(index,'original',{verticalPreview:true});
  assert.equal(fragment(original),undefined,SECTORS[index].name);
  assert.equal(level.items.filter(i=>i.upperFragment).length,1,SECTORS[index].name);
  const item=fragment(level),position=upperFragmentPosition(level.vertical);
  assert.deepEqual({x:item.x,y:item.y,floorHeight:item.floorHeight},position);
  assert.equal(item.type,'artifact');
  assert.equal(item.bonusUpper,true);
  assert.equal(item.taken,false);
  const uplink=level.upperUplink;
  assert(Math.hypot(item.x-uplink.x,item.y-uplink.y)>=2);
  assert(level.enemies.filter(e=>e.upperGuard).every(e=>Math.hypot(e.x-item.x,e.y-item.y)>=1.5));
  assert(level.items.filter(i=>i.bonusUpper&&!i.upperFragment).every(i=>Math.hypot(i.x-item.x,i.y-item.y)>=1));
  assert.equal(createLevel(index,'pit',{verticalPreview:true}).items.some(i=>i.upperFragment),false);
  const g=preview();if(index)g.loadLevel(index,false);
  assert(validSoloPreviewCheckpoint(g.level,g.player),SECTORS[index].name);
 }
});

test('fragments collect only on the second floor, reward once, and do not upgrade regular artifacts',()=>{
 const g=preview(),item=fragment(g.level),p=g.player;
 Object.assign(p,{x:item.x,y:item.y,height:0,armor:40,ori:40,reserve:0,grounded:true,supportSurface:'ground'});
 g.collectPlayerItems();
 assert.equal(item.taken,false);
 assert.equal(g.totalUpperFragments,0);
 Object.assign(p,{height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
 g.collectPlayerItems();
 assert.equal(item.taken,true);
 assert.equal(g.totalUpperFragments,1);
 assert.equal(g.totalArtifacts,0);
 assert.equal(p.armor,52);
 assert.equal(p.ori,52);
 assert.equal(p.reserve,20);
 assert(g.events.some(e=>e.type==='pickup'&&e.item==='FREQUENCY FRAGMENT 1/12'));
 g.collectPlayerItems();
 assert.equal(g.totalUpperFragments,1);
 assert.equal(g.checkpoint.level.items.find(i=>i.upperFragment).taken,true);
 g.retry();
 assert.equal(g.totalUpperFragments,1);
 assert.equal(fragment(g.level).taken,true);
});

test('frequency fragments count across the twelve sector-sampling route without gating gold extraction',()=>{
 const g=preview();
 for(let index=0;index<12;index++){
  if(index)g.loadLevel(index,false);
  const i=fragment(g.level);
  Object.assign(g.player,{x:i.x,y:i.y,height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
  g.collectPlayerItems();
  assert.equal(g.totalUpperFragments,index+1,SECTORS[index].name);
  assert.equal(g.level.relays.filter(r=>r.active).length,0);
  assert.equal(g.level.key.taken,false);
  assert.equal(g.exitReady,false);
 }
 assert.equal(g.totalUpperFragments,12);
 const s=g.snapshot(),restored=new Game();restored.restore(s);
 assert.equal(restored.totalUpperFragments,12);
 assert.equal(fragment(restored.level).taken,true);
});

test('preview counters validate snapshots and cannot modify the original or Pit saves',()=>{
 const g=preview(),item=fragment(g.level);
 Object.assign(g.player,{x:item.x,y:item.y,height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
 g.collectPlayerItems();
 const s=g.snapshot();
 assert.equal(s.totalUpperFragments,1);
 const store={writes:0,setItem(){this.writes++;}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);
 assert.equal(store.writes,0);
 const tampered=structuredClone(s);tampered.level.items.find(i=>i.upperFragment).x++;
 assert.throws(()=>new Game().restore(tampered),/checkpoint/i);
 const missing=structuredClone(s);missing.level.items.find(i=>i.upperFragment).upperFragment=false;
 assert.throws(()=>new Game().restore(missing),/checkpoint/i);
 const impossible=structuredClone(s);impossible.totalUpperFragments=13;
 assert.throws(()=>new Game().restore(impossible),/checkpoint/i);
 const regular=new Game();regular.start();
 assert.equal('totalUpperFragments' in regular.snapshot(),false);
 assert.equal(fragment(regular.level),undefined);
 const pit=new Game();pit.startPit();
 assert.equal('totalUpperFragments' in pit.snapshot(),false);
 assert.equal(fragment(pit.level),undefined);
 assert.equal(new Game().restore(regular.snapshot()),true);
});

test('Quest billboard, both automaps, and the HUD show only optional preview fragment progress',()=>{
 const world=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 const wrist=readFileSync(new URL('../src/world-ui.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert(world.includes('i.upperFragment?[.85,.65,1.35,1]:WHITE'));
 assert(classic.includes('i.upperFragment&&!i.taken'));
 assert(wrist.includes('FRAGMENTS '));
 assert(wrist.includes('fragment&&l.seen'));
 assert.match(main,/if\(game\.verticalPreview\)\s*\{?\s*summary\.push\(\['FRAGMENTS '/);
});
