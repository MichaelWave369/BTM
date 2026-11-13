import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {CACHE_COLORS,accessCacheStatus,claimAccessCache,soloAccessMarkers} from '../src/solo-access-hunt.js';
import {STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

const preview=i=>{const g=new Game();g.start({verticalPreview:true});if(i)g.loadLevel(i,false);return g;};
const caches=l=>l.items.filter(i=>i.bonusAccess);

test('all twelve two-story maps have paired, optional, color-specific cache hunts',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),l=g.level,items=caches(l);
  assert.equal(items.length,Math.min(3,1+Math.floor(i/3)),SECTORS[i].name);
  assert.deepEqual(accessCacheStatus(l),{collected:0,total:items.length});
  for(const cache of items){
   assert(CACHE_COLORS[cache.bonusAccess],cache.bonusAccess);
   assert(Object.values(l.doors).some(d=>d.bonus&&d.lockColor===cache.bonusAccess));
   assert(l.items.some(k=>k.type==='key:'+cache.bonusAccess));
   assert.equal(cache.taken,false);
   assert.equal(cache.floorHeight,undefined,'ground-floor cache untouched by upstairs layout');
  }
  const keys=l.items.filter(k=>k.bonusUpper&&k.type.startsWith('key:'));
  assert.equal(keys.length,i===0?0:1,'sectors 2+ move one color key to the real upper deck');
  assert(validSoloPreviewCheckpoint(l,g.player));
  g.level.relays.forEach(r=>r.active=true);g.player.key=true;
  g.level.enemies.filter(e=>e.type==='warden').forEach(e=>e.dead=true);
  assert(g.exitReady,'no cache becomes a required extraction objective');
 }
});

test('cards and their matching ground-floor doors produce distinct non-solid waypoints',()=>{
 for(let i=1;i<12;i++){
  const g=preview(i),l=g.level,key=l.items.find(k=>k.bonusUpper&&k.type.startsWith('key:'));
  Object.assign(g.player,{x:key.x-.55,y:key.y,height:STACK_HEIGHT,supportSurface:'upper'});
  assert(soloAccessMarkers(g).some(m=>m.kind==='card'&&m.color===key.type.slice(4)&&m.floorHeight===STACK_HEIGHT));
  key.taken=true;g.player.keys[key.type.slice(4)]=true;
  const spawn=g.definition.spawn;
  Object.assign(g.player,{x:spawn.x,y:spawn.y,height:0,supportSurface:'ground'});
  const before=soloAccessMarkers(g);
  const color=key.type.slice(4),door=l.doors[Object.keys(l.doors).find(k=>l.doors[k].lockColor===color)];
  assert(before.some(m=>m.kind==='door'&&m.color===color&&m.x===door.x+.5&&m.y===door.y+.5));
  assert(!before.some(m=>m.kind==='trail'),'long navigation trail needs an active Ori scan');
  g.objectiveTime=10;
  const guided=soloAccessMarkers(g);
  assert(guided.some(m=>m.kind==='trail'&&m.color===color),'Ori scan guides to held card matching door');
  assert(guided.filter(m=>m.kind==='trail').length<=24,'bounded number of route markers');
  for(const m of guided.filter(m=>m.kind==='trail')){
   assert.equal(m.floorHeight,0);
   assert.equal(l.cells[Math.floor(m.y)]?.[Math.floor(m.x)]===0||
      l.doors[Math.floor(m.x)+','+Math.floor(m.y)]!==undefined,true);
  }
  door.open=1;
  assert(soloAccessMarkers(g).some(m=>m.kind==='cache'&&m.color===color));
  const cache=caches(l).find(c=>c.bonusAccess===color);
  cache.taken=true;
  assert(!soloAccessMarkers(g).some(m=>m.color===color),'completed color hunt stops signaling');
 }
});

test('red/blue/green caches provide distinct capped benefits in survival and legacy mode',()=>{
 const base=()=>({health:20,armor:15,ori:10,energy:20,reserve:15});
 for(const survival of [true,false]){
  let p=base();assert(claimAccessCache(p,'red',survival));assert.equal(p.health,55);assert.equal(p.armor,30);assert.equal(p.ori,10);
  p=base();assert(claimAccessCache(p,'blue',survival));assert.equal(p.ori,35);assert.equal(p[survival?'reserve':'energy'],50);
  assert.equal(p[survival?'energy':'reserve'],survival?20:15);
  p=base();assert(claimAccessCache(p,'green',survival));assert.equal(p.health,40);assert.equal(p.armor,40);assert.equal(p.ori,30);
  p={health:100,armor:100,ori:100,energy:100,reserve:180};
  assert(claimAccessCache(p,'green',survival));
  assert.deepEqual(p,{health:100,armor:100,ori:100,energy:100,reserve:180},'no cap exceeded');
 }
 assert.equal(claimAccessCache(base(),'gold',true),false,'gold extraction key is never a cache reward');
});

test('real preview cache pickup works once at full resources and survives memory checkpoint',()=>{
 for(let i=0;i<12;i++){
  const g=preview(i),l=g.level,items=caches(l);
  Object.assign(g.player,{health:100,armor:100,ori:100,energy:100,reserve:180});
  let collected=0;
  for(const cache of items){
   Object.assign(g.player,{x:cache.x,y:cache.y,height:0,supportSurface:'ground'});
   const count=g.stats.pickups;
   g.collectPlayerItems();
   assert.equal(cache.taken,true,SECTORS[i].name+' cache claim');
   assert.equal(g.stats.pickups,count+1,'exactly one pickup at max resources');
   assert.equal(accessCacheStatus(l).collected,++collected);
   const events=g.events.filter(e=>e.type==='pickup'&&e.item?.includes('SIGNAL CACHE'));
   assert.equal(events.length,collected);
   g.collectPlayerItems();
   assert.equal(accessCacheStatus(l).collected,collected,'no duplicate cache pickup');
   assert(g.player.health<=100&&g.player.armor<=100&&g.player.ori<=100&&g.player.reserve<=180);
  }
  const snap=g.snapshot(),restored=new Game();
  assert.equal(restored.restore(snap),true);
  assert.deepEqual(accessCacheStatus(restored.level),{collected:items.length,total:items.length});
  assert(validSoloPreviewCheckpoint(restored.level,restored.player));
 }
});

test('normal campaign, Pit, and BBS opt-out preserve original loot, routes and storage',()=>{
 const normal=new Game();normal.start();
 const item=caches(normal.level)[0],before=normal.snapshot();
 normal.player.x=item.x;normal.player.y=item.y;
 normal.player.armor=100;normal.player.reserve=180;
 const stats=normal.stats.pickups;
 normal.collectPlayerItems();
 if(item.type==='armor'||item.type==='energy')assert.equal(item.taken,false,'full normal supplies remain uncollectible');
 assert.equal(normal.stats.pickups,stats);
 assert.equal(normal.level.vertical,undefined);
 assert.deepEqual(soloAccessMarkers(normal),[]);
 const pit=new Game();pit.startPit();
 assert.deepEqual(soloAccessMarkers(pit),[]);
 assert.deepEqual(accessCacheStatus(pit.level),{collected:0,total:0});
 const coop=createLevel(5,'original',{coloredAccess:false});
 assert.deepEqual(accessCacheStatus(coop),{collected:0,total:0});
 const g=preview(5),store={writes:0,setItem(){this.writes++}};
 assert.throws(()=>writeCampaignCheckpoint(store,g),/Preview/i);assert.equal(store.writes,0);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(store,normal));assert.equal(store.writes,1);
 assert.equal(before.version,1);
});

test('all renderers, HUD and generated service-worker tests include cache hunt dependencies',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/core.js').includes('claimAccessCache(p,item.bonusAccess,this.survival)'));
 assert(read('src/world-scene.js').includes('soloAccessMarkers(game)'));
 assert(read('src/renderer.js').includes("o.type==='soloAccess'"));
 assert(read('src/renderer.js').includes('soloAccessMarkers(game)'));
 assert(read('src/world-ui.js').includes('accessCacheStatus(game.level)'));
 assert(read('src/main.js').includes('COLOR CACHES'));
 assert(read('scripts/build.mjs').includes("'./src/solo-access-hunt.js'"));
 assert(read('scripts/verify-offline.mjs').includes("'./src/solo-access-hunt.js'"));
});
