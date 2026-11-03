import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,canOccupy} from '../src/core.js';
import {solidAt,lineOfSight} from '../src/collision.js';
import {enterHazardVault,HAZARD_VAULT_DURATION} from '../src/hazard-vault.js';
import {galleryResult} from '../src/shooting-gallery.js';
import {writeCampaignCheckpoint,ORIGINAL_SAVE_KEY,PIT_SAVE_KEY} from '../src/campaign-storage.js';

const session=()=>{const game=new Game();enterHazardVault(game);return game;};

test('Hazard Vault is six genuine, separately placed Pit mechanisms with safe walkable spawn',()=>{
 const g=session(),l=g.level;
 assert.equal(g.gallery.drill,'hazard-gauntlet');
 assert.equal(g.gallery.duration,HAZARD_VAULT_DURATION);
 assert.equal(HAZARD_VAULT_DURATION,90);
 assert.equal(g.campaign,'pit');
 assert.equal(g.mode,'playing');
 assert.equal(l.w,29);assert.equal(l.h,25);
 assert.equal(l.traps.length,3);
 assert.equal(l.floorTraps.length,3);
 assert.deepEqual(l.traps.map(t=>t.pattern||'single'),['single','double','crossfire']);
 assert.deepEqual(l.floorTraps.map(t=>t.kind),['charge-tile','arc-lane','pressure-pulse']);
 assert(l.enemies.length===0&&l.hazards.length===0&&l.items.length===0);
 assert(l.relays.length===0&&l.captives.length===0&&l.blasts.length===0);
 assert(l.key.taken&&g.player.key);
 assert(g.checkpoint===null);
 assert(!g.events.some(e=>e.type==='checkpoint'),'initial Pit setup cannot be reported to save system');
 assert.equal(g.exitReady,false,'the practice round must not clear a Pit stage');
 assert(canOccupy(l,g.player.x,g.player.y));
 for(const trap of l.traps){
  assert(solidAt(l,trap.mountX,trap.mountY),'emitter must mount to real wall');
  assert(canOccupy(l,trap.muzzleX,trap.muzzleY,.05),'muzzle must not start inside wall');
  assert(canOccupy(l,trap.x,trap.y),'activation plate must be walkable');
  assert(lineOfSight(l,{x:trap.muzzleX,y:trap.muzzleY},trap),'firing lane must be open');
  if(trap.pattern==='crossfire'){
   assert(solidAt(l,trap.secondMountX,trap.secondMountY));
   assert(canOccupy(l,trap.secondMuzzleX,trap.secondMuzzleY,.05));
   assert(lineOfSight(l,{x:trap.secondMuzzleX,y:trap.secondMuzzleY},trap));
  }
  assert(Math.hypot(trap.x-g.player.x,trap.y-g.player.y)>4,'do not start on a trap');
 }
 for(const trap of l.floorTraps){
  assert(canOccupy(l,trap.x,trap.y));
  if(trap.kind==='arc-lane')assert(canOccupy(l,trap.toX,trap.toY));
  assert(Math.hypot(trap.x-g.player.x,trap.y-g.player.y)>4);
 }
 assert.equal(g.oriAuto,Infinity);
});

test('real plate entry arms the event, launches a bounded real projectile and advances lab stat',()=>{
 const g=session(),plate=g.level.traps[1];
 g.player.x=plate.x;g.player.y=plate.y;g.time=.01;
 g.update(.05);
 assert.equal(g.gallery.activations,1);
 assert(g.events.some(e=>e.type==='pitTrapArmed'&&e.id===plate.id));
 assert(Number.isFinite(plate.fireAt));
 const due=plate.fireAt;g.time=due;
 g.update(.05);
 assert(g.projectiles.some(p=>p.enemy&&p.trap==='electric-orb'));
 assert(g.events.some(e=>e.type==='pitTrapFired'&&e.id===plate.id));
 assert.equal(g.gallery.activations,1,'repeated standing cannot rearm the plate');
});

test('both floor pulses and real shield mitigation count against practice, not campaign',()=>{
 const g=session(),pulse=g.level.floorTraps.find(x=>x.kind==='pressure-pulse');
 g.player.x=pulse.x;g.player.y=pulse.y;g.time=.1;
 g.update(.05);
 assert.equal(g.gallery.activations,1);
 assert(g.events.some(e=>e.type==='pitFloorArmed'&&e.id===pulse.id));
 g.shieldTime=2;g.shieldCharge=20;
 g.time=pulse.fireAt;g.update(.05);
 assert.equal(g.gallery.shielded,pulse.damage,'uses actual Game.damagePlayer shieldHit');
 assert.equal(g.player.health,100);
 assert.equal(g.gallery.healthDamage,0);
 assert(g.events.some(e=>e.type==='pitFloorFired'));
 g.shieldTime=0;g.player.armor=0;g.damagePlayer(7,{x:pulse.x,y:pulse.y});
 // Practice damage is reported from the regular authoritative health counter.
 g.time+=.05;g.update(.05);
 assert(g.gallery.healthDamage>=7);
 assert.equal(g.totalFreed,0);
 assert.equal(g.pitRecord.length,0);
});

test('90 seconds finishes once with practice-only result and never awards Pit completion',()=>{
 const g=session();g.time=HAZARD_VAULT_DURATION-.025;
 g.update(.05);
 assert.equal(g.mode,'complete');
 assert.equal(g.gallery.ended,true);
 const completed=g.events.filter(e=>e.type==='galleryComplete');
 assert.equal(completed.length,1);
 assert.equal(completed[0].result.drill,'hazard-gauntlet');
 assert.equal(completed[0].result.survived,true);
 assert.equal(completed[0].result.seconds,90);
 assert(!g.events.some(e=>e.type==='complete'||e.type==='checkpoint'));
 assert.equal(g.totalFreed,0);
 assert.equal(g.pitRecord.length,0);
 g.update(.05);
 assert.equal(g.events.filter(e=>e.type==='galleryComplete').length,1);
});

test('lethal trap damage ends in a one-time practice result rather than Pit progress',()=>{
 const g=session(),charge=g.level.floorTraps.find(x=>x.kind==='charge-tile');
 g.level.traps=[];g.level.floorTraps=[charge];
 g.player.x=charge.x;g.player.y=charge.y;
 g.player.armor=0;g.player.health=1;
 g.time=charge.activeStart+.01;
 g.update(.05);
 assert.equal(g.mode,'complete');
 assert.equal(g.gallery.ended,true);
 const result=g.events.filter(e=>e.type==='galleryComplete');
 assert.equal(result.length,1);
 assert.equal(result[0].result.survived,false);
 assert.equal(g.pitRecord.length,0);
 assert.equal(g.checkpoint,null);
});

test('both original and Pit checkpoint APIs refuse practice without mutating existing slots',()=>{
 const saved=new Map([[ORIGINAL_SAVE_KEY,'original-slot'],[PIT_SAVE_KEY,'pit-slot']]);
 const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 const g=session();
 assert.equal(g.saveCheckpoint(),false);
 assert.equal(writeCampaignCheckpoint(storage,g),null);
 assert.equal(saved.get(ORIGINAL_SAVE_KEY),'original-slot');
 assert.equal(saved.get(PIT_SAVE_KEY),'pit-slot');
 assert.equal(g.checkpoint,null);
 const app=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(app.includes("if(game.gallery||game.phiwadCustom||game.player.health<=0)return"));
 assert(app.includes("enterHazardVault(game)"));
 assert(html.includes('id="hazard-vault-btn"'));
 assert(app.includes("if(report.drill==='signal-60')"),'only stationary range can write its best-score card');
 const report=galleryResult(g.gallery);
 assert.equal(report.drill,'hazard-gauntlet');
 assert.equal(report.survived,false);
 g.startPit();
 assert.equal(g.gallery,null);
 assert.equal(g.campaign,'pit');
 assert(g.checkpoint!==null,'returning to actual campaign restores normal checkpoint support');
});

test('Quest and Classic renderers display practice hazards without an extraction portal',()=>{
 const scene=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 assert(scene.includes("for(const trap of l.floorTraps||[])"));
 assert(scene.includes("for(const trap of l.traps||[])"));
 assert(scene.includes("!game.networkCompetitive&&!game.gallery"));
 assert(renderer.includes("for(const floor of l.floorTraps||[])"));
 assert(renderer.includes("for(const trap of l.traps||[])"));
 assert(renderer.includes("!game.networkCompetitive&&!game.gallery"));
});
