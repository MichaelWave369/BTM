import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {validSoloPreviewCheckpoint,soloUplinkPosition} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';
import {readFileSync} from 'node:fs';

function preview(index=0){
 const g=new Game();g.start({verticalPreview:true});
 if(index)g.loadLevel(index,false);
 return g;
}
test('every preview sector has one optional upper signal separated from guard and loot',()=>{
 for(let index=0;index<12;index++){
  const normal=createLevel(index),level=createLevel(index,'original',{verticalPreview:true});
  assert.equal(normal.upperUplink,undefined);
  const u=level.upperUplink,position=soloUplinkPosition(level.vertical);
  assert(u&&u.active===false&&u.optional===true&&u.type==='relay',SECTORS[index].name);
  assert.equal(u.id,'upper-uplink-'+index);
  assert.deepEqual({x:u.x,y:u.y,floorHeight:u.floorHeight},position);
  assert.equal(u.floorHeight,STACK_HEIGHT);
  assert(level.enemies.some(e=>e.upperGuard&&Math.hypot(e.x-u.x,e.y-u.y)>=1));
  assert(level.items.filter(i=>i.bonusUpper).every(i=>Math.hypot(i.x-u.x,i.y-u.y)>=1));
  assert.deepEqual(level.relays,normal.relays);
  assert.deepEqual(level.key,normal.key);assert.deepEqual(level.exit,normal.exit);
  assert.equal(createLevel(index,'pit',{verticalPreview:true}).upperUplink,undefined);
  const g=preview(index);assert(validSoloPreviewCheckpoint(g.level,g.player));
 }
});
test('normal E/right-grip interaction syncs upstairs but never from underneath',()=>{
 const g=preview(),u=g.level.upperUplink;
 Object.assign(g.player,{x:u.x,y:u.y,height:0,armor:22,ori:14,reserve:0});
 assert.notEqual(g.interactionHint(),'[ E ] SYNC UPPER SIGNAL');
 g.interact();assert.equal(u.active,false);assert.equal(g.totalUplinks,0);
 Object.assign(g.player,{height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
 assert.equal(g.interactionHint(),'[ E ] SYNC UPPER SIGNAL');
 g.interact();
 assert.equal(u.active,true);assert.equal(g.totalUplinks,1);
 assert.equal(g.player.armor,47);assert.equal(g.player.ori,49);assert.equal(g.player.reserve,35);
 assert(g.events.some(e=>e.type==='pickup'&&e.item==='UPPER SIGNAL 1/12'));
 g.interact();assert.equal(g.totalUplinks,1,'cannot farm an activated uplink');
 assert.equal(g.checkpoint.level.upperUplink.active,true);
});
test('twelve signals count once and do not unlock any mandatory extraction objectives',()=>{
 const g=preview();
 for(let index=0;index<12;index++){
  if(index)g.loadLevel(index,false);
  const u=g.level.upperUplink;
  Object.assign(g.player,{x:u.x,y:u.y,height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
  g.interact();
  assert.equal(g.totalUplinks,index+1,SECTORS[index].name);
  assert(u.active);
  assert.equal(g.level.relays.filter(r=>r.active).length,0);
  assert.equal(g.exitReady,false);
  assert.equal(g.level.key.taken,false);
 }
 assert.equal(g.totalUplinks,12);
});
test('preview snapshots remember activated uplinks, reject tampering, and leave old v1 saves valid',()=>{
 const g=preview(5),u=g.level.upperUplink;
 Object.assign(g.player,{x:u.x,y:u.y,height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
 g.interact();
 const snap=g.snapshot(),next=new Game();next.restore(snap);
 assert.equal(next.level.upperUplink.active,true);assert.equal(next.totalUplinks,1);
 assert.throws(()=>writeCampaignCheckpoint({setItem(){throw Error('unexpected write')}},g),/Preview/i);
 const tampered=structuredClone(snap);tampered.level.upperUplink.x+=1;
 assert.throws(()=>new Game().restore(tampered),/checkpoint/i);
 const old=new Game();old.start();const legacy=old.snapshot();
 assert.equal('totalUplinks' in legacy,false,'normal original save format is unmodified');
 const pit=new Game();pit.startPit();assert.equal('totalUplinks' in pit.snapshot(),false,'Pit schema is unmodified');
 const restored=new Game();restored.restore(legacy);
 assert.equal(restored.totalUplinks,0);
});
test('Quest stereo, Classic and wrist map display the optional upper signal using existing assets',()=>{
 const stereo=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 const desktop=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 const wrist=readFileSync(new URL('../src/world-ui.js',import.meta.url),'utf8');
 assert(stereo.includes('u.floorHeight*s'));
 assert(desktop.includes("l.upperUplink.active?'relayOn':'relay'"));
 assert(wrist.includes('UPLINK '));assert(wrist.includes('l.upperUplink'));
});
