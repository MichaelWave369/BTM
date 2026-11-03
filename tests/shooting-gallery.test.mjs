import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {enterGallery,galleryResult,advanceGallery,galleryHit,storeGalleryResult,GALLERY_KEY,GALLERY_SCHEMA,GALLERY_DURATION} from '../src/shooting-gallery.js';

function storage(){
 const store=new Map();
 return {getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),all:()=>Object.fromEntries(store)};
}
test('calibration vault is a safe offline BTM arena with three real mechanical dummies',()=>{
 const g=new Game();
 g.start();const saved=JSON.stringify(g.snapshot());
 const session=enterGallery(g);
 assert(g.gallery===session&&g.mode==='playing'&&g.energyMode==='legacy');
 assert.equal(g.gallery.duration,60);
 assert.equal(g.level.w,29);assert.equal(g.level.h,25);
 assert.equal(g.level.enemies.length,3);assert(g.level.enemies.every(e=>e.galleryTarget&&e.human===false));
 assert(g.level.enemies.every(e=>e.damage===0&&e.speed===0));
 assert(g.level.items.length===0&&g.level.relays.length===0&&g.level.captives.length===0);
 assert.equal(g.level.key.taken,true);
 assert.equal(g.exitReady,false);
 assert.equal(g.weapon,1);
 assert.equal(g.checkpoint,null,'the normal sector checkpoint must not become the practice arena');
 assert(!g.events.some(e=>e.type==='checkpoint'),'range starts without a campaign-save event');
 assert.equal(g.selectWeapon(0),false,'score drill must use the calibration blaster');
 assert.equal(g.weapon,1);
 // A fresh campaign still starts on its original canonical level.
 g.start();assert.equal(g.gallery,null);
 assert.deepEqual(g.level.cells,JSON.parse(saved).level.cells);
});
test('real engine misses and hits are counted as shots, with practice targets never liberated as humans',()=>{
 const g=new Game();enterGallery(g);
 const originalFreed=g.totalFreed;
 g.player.a=Math.PI/2;assert.equal(g.shoot(),true);
 assert.equal(g.gallery.shots,1);assert.equal(g.gallery.hits,0);assert.equal(g.gallery.score,0);
 g.cooldown=0;g.player.a=-Math.PI/2;
 assert.equal(g.shoot(),true);
 assert.equal(g.gallery.shots,2);assert.equal(g.gallery.hits,1);assert.equal(g.gallery.score,100);
 assert.equal(g.totalFreed,originalFreed);
 assert.equal(g.gallery.ended,false);
 const hit=g.level.enemies.find(e=>e.dead);
 assert(hit&&hit.galleryTarget&&hit.respawnAt>.6);
 galleryHit(g,hit,'weapon');assert.equal(g.gallery.hits,1,'a hit target cannot be hit twice');
 g.time=hit.respawnAt+.01;advanceGallery(g);
 assert.equal(hit.dead,false,'practice unit returns after a short cooldown');
 assert.equal(hit.hp,1);
});
test('Quest tracked-ray shooting hits real dummy targets via the existing server-neutral spatial trace',()=>{
 const g=new Game();enterGallery(g);
 const p=g.player;
 g.combatPose={head:{x:p.x,y:p.y,height:1.7},
  aim:{origin:{x:p.x,y:p.y,height:.8},direction:{x:0,y:-1,z:0}}};
 assert.equal(g.shoot(),true);
 assert.equal(g.gallery.shots,1);
 assert.equal(g.gallery.hits,1);
 assert(g.events.some(e=>e.type==='shot'&&e.aim));
 assert(g.events.some(e=>e.type==='galleryHit'));
});
test('optional tracking drill moves inert dummies deterministically without touching campaign or ammo',()=>{
 const g=new Game();g.startPit();const before=g.snapshot(),modeBefore=g.campaign;
 enterGallery(g,{moving:true});assert.equal(g.gallery.drill,'tracking-60');
 assert.equal(g.campaign,'original');assert.equal(modeBefore,'pit');
 assert(g.level.enemies.every(e=>e.galleryTarget&&e.damage===0&&e.speed===0));
 const originals=g.level.enemies.map(e=>e.homeX);
 g.time=3.25;advanceGallery(g);
 const first=g.level.enemies.map(e=>e.x);
 assert(first.some((x,i)=>Math.abs(x-originals[i])>.15),'targets should strafe visibly');
 advanceGallery(g);assert.deepEqual(g.level.enemies.map(e=>e.x),first,'same clock must yield same positions');
 g.time=3.5;advanceGallery(g);assert.notDeepEqual(g.level.enemies.map(e=>e.x),first);
 assert.equal(g.player.energy,100,'tracking targets never spend finite energy');
 assert.equal(g.checkpoint,null,'practice mode never snapshots campaign progress');
 g.startPit();assert.equal(g.gallery,null);assert.deepEqual(g.level.cells,before.level.cells);
});

test('moving target receives a real tracked shot at its updated position',()=>{
 const g=new Game();enterGallery(g,{moving:true});
 g.time=3.25;advanceGallery(g);
 const target=g.level.enemies[1],from={x:g.player.x,y:g.player.y,height:.8};
 const aim={origin:from,direction:{x:target.x-from.x,y:target.y-from.y,z:0}};
 assert(g.setCombatPose({head:{x:from.x,y:from.y,height:1.7},aim}));
 assert.equal(g.shoot(),true);
 assert.equal(g.gallery.shots,1);assert.equal(g.gallery.hits,1);
 assert.equal(target.dead,true);
 const score=galleryResult(g.gallery);
 assert.equal(score.drill,'tracking-60');
 assert.equal(score.score,100);assert.equal(score.accuracy,100);
 assert.equal(g.totalFreed,0);
 g.time=target.respawnAt+.01;advanceGallery(g);
 assert.equal(target.dead,false,'moving training unit respawns through existing safe logic');
});

test('tracking drill has separate unranked results and preserves classic Trophy Room record',()=>{
 const app=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(app.includes("if(report.drill==='signal-60')"),'moving practice must not overwrite classic best card');
 assert(app.includes("enterGallery(game,{moving:true})"));
 assert(html.includes('id="gallery-moving-btn"'));
 const normal=new Game();enterGallery(normal);
 const moving=new Game();enterGallery(moving,{moving:true});
 assert.equal(galleryResult(normal.gallery).drill,'signal-60');
 assert.equal(galleryResult(moving.gallery).drill,'tracking-60');
});

test('time limit ends precisely once, preserving a local standalone result without sector completion',()=>{
 const g=new Game();enterGallery(g);
 g.time=GALLERY_DURATION-.025;
 g.update(.05);
 assert.equal(g.mode,'complete');
 assert.equal(g.gallery.ended,true);
 assert.equal(g.events.filter(e=>e.type==='galleryComplete').length,1);
 assert.equal(g.events.filter(e=>e.type==='complete').length,0);
 assert.equal(g.totalFreed,0);
 assert.equal(g.gallery.shots,0);
 g.update(.05);assert.equal(g.events.filter(e=>e.type==='galleryComplete').length,1);
 assert.deepEqual(galleryResult(g.gallery),{
  drill:'signal-60',seconds:60,shots:0,hits:0,accuracy:0,score:0
 });
});
test('a local-only versioned scorecard accepts best scores, tie accuracy and corruption safely',()=>{
 const store=storage(),one={shots:20,hits:10,score:1000};
 const a=storeGalleryResult(store,one);
 assert.equal(a.schema,GALLERY_SCHEMA);assert.equal(a.plays,1);
 assert.deepEqual(a.best,{...galleryResult(one),drill:'signal-60'});
 const b=storeGalleryResult(store,{shots:15,hits:11,score:1100});
 assert.equal(b.best.score,1100);assert.equal(b.totalShots,35);assert.equal(b.totalHits,21);
 const c=storeGalleryResult(store,{shots:10,hits:9,score:1000});
 assert.equal(c.best.score,1100);assert.equal(c.plays,3);
 assert.deepEqual(Object.keys(store.all()),[GALLERY_KEY]);
 store.setItem(GALLERY_KEY,'{corrupt');
 const repaired=storeGalleryResult(store,{shots:0,hits:0,score:0});
 assert.equal(repaired.plays,1);assert.equal(repaired.best.accuracy,0);
 const blocked={getItem:()=>{throw Error('disabled');},setItem:()=>{throw Error('disabled');}};
 assert.doesNotThrow(()=>storeGalleryResult(blocked,one));
});
test('main application never exports range training through campaign checkpoints or archive rewards',()=>{
 const app=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert(app.includes("if(game.gallery||game.phiwadCustom||game.player.health<=0)return"));
 assert(app.includes("if(!game.gallery&&(game.mode==='playing'||game.mode==='paused'))"));
 assert(app.includes("if(e.type==='galleryComplete')galleryFinished(e.result)"));
 assert(app.includes("$('gallery-btn').addEventListener('click'"));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(html.includes('id="gallery-btn"'));
 assert(html.includes('id="gallery-result-screen"'));
});
