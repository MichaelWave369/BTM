import test from 'node:test';
import assert from 'node:assert/strict';
import {createOfflineArena,validateOfflineArena,MAX_SOLO_PARTICIPANTS} from '../src/net/offline-bots.js';
import {createArena} from '../src/net/arenas.js';
import {neutralInput} from '../src/net/protocol.js';

const setup=(overrides={})=>({nickname:'WAVE',mode:'deathmatch',arena:'no-carrier',
 limit:10,bots:11,capacity:12,...overrides});

test('offline local authority admits exactly one human plus eleven labeled bot actors',()=>{
 const {room,player,settings}=createOfflineArena(setup());
 assert.equal(MAX_SOLO_PARTICIPANTS,12);
 assert.equal(settings.capacity,12);
 assert.equal(room.localBots,true);
 assert.equal(room.state,'playing');
 assert.equal(room.roster().length,12);
 assert.equal(room.roster().filter(actor=>actor.bot).length,11);
 assert.equal(room.roster().filter(actor=>!actor.bot).length,1);
 assert(room.roster().every(actor=>actor.connected));
 assert.equal(new Set(room.roster().map(actor=>actor.id)).size,12);
 assert.equal(new Set([...room.actors.values()].map(actor=>[actor.player.x,actor.player.y].join(','))).size,12,
  'twelve combatants should not be spawned on one another');
 const before=room.snapshot(player);
 assert.equal(before.players.length,12);
 assert.equal(before.code,'SOLOBOTS');
 assert.equal(before.capacity,12);
 assert.equal(before.mode,'deathmatch');
 assert.equal(before.players.filter(actor=>actor.bot).length,11);
 assert(!room.receipts.length,'not a signed multiplayer/raid receipt');
 room.input(player,{type:'input',seq:1,...neutralInput(),actions:[]});
 for(let i=0;i<30;i++)room.step(1/30);
 assert(room.tick>=30&&room.game.time>0);
 assert.equal(room.snapshot(player).players.length,12);
});

test('solo spawn expansion is local-only; original eight-player online map pool stays untouched',()=>{
 for(const arena of ['no-carrier','sysops-revenge','kill-switch']){
  const standard=createArena(arena),expanded=createArena(arena,12);
  assert.equal(standard.spawns.length,8);
  assert.equal(expanded.spawns.length,12);
  assert.deepEqual(expanded.spawns.slice(0,8),standard.spawns);
  assert.equal(new Set(expanded.spawns.map(p=>p.slice(0,2).join(','))).size,12);
  for(const [x,y] of expanded.spawns)assert.equal(expanded.level.cells[Math.floor(y)][Math.floor(x)],0);
 }
});

test('every competitive mode starts locally with a 12-player room and actual team rules',()=>{
 for(const mode of ['deathmatch','team','clan','control']){
  const {room,player}=createOfflineArena(setup({mode,arena:'kill-switch',bots:5,capacity:6}));
  assert.equal(room.state,'playing');
  assert.equal(room.roster().length,6);
  assert.equal(room.competitive,true);
  assert.equal(room.snapshot(player).players.length,6);
  if(mode==='control')assert(room.control&&room.snapshot(player).control);
  if(mode==='team'||mode==='clan'||mode==='control'){
   const count=room.roster().reduce((a,p)=>(a[p.team]++,a),{cyan:0,pink:0});
   assert.equal(count.cyan,3);assert.equal(count.pink,3);
  }
 }
});

test('offline configuration refuses invalid and unearned online-style room sizes',()=>{
 for(const bad of [
  {bots:0,capacity:1},{bots:12,capacity:13},{bots:11,capacity:8},
  {bots:2,capacity:12},{mode:'coop'},{mode:'unknown'},{arena:'bogus'},
  {limit:99},{nickname:'???'}
 ])assert.throws(()=>validateOfflineArena(setup(bad)));
 assert.equal(validateOfflineArena(setup({bots:1,capacity:2})).capacity,2);
});
