import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Room} from '../src/net/simulation.js';
import {createArena} from '../src/net/arenas.js';
import {neutralInput,validateMessage,MODES} from '../src/net/protocol.js';
import {OFFLINE_ARENA_MODES} from '../src/net/offline-bots.js';
import {freshBeastMatch,beastClawTarget,advanceBeast,beastSnapshot,
 BEAST_ROUND_SECONDS,BEAST_MELEE_COOLDOWN,BEAST_LUNGE_COOLDOWN,BEAST_LUNGE_DISTANCE,
 BEAST_BASE_HEALTH} from '../src/net/beast-inversion.js';
import {canOccupy} from '../src/collision.js';

function room({bots=0,hunters=1}={}){
 const r=new Room({code:'BEAST369',mode:'beast',arena:'no-carrier',capacity:Math.max(2,1+bots+hunters),limit:10});
 const owner=r.add({id:'owner',nickname:'Wave',token:'a'.repeat(48)});owner.ready=true;
 for(let i=0;i<hunters;i++){const p=r.add({id:'hunter'+i,nickname:'Hunter '+i,token:'b'.repeat(48)});p.ready=true;}
 for(let i=0;i<bots;i++)r.addBot('c'.repeat(48));
 r.start(owner.id);
 for(const a of r.actors.values())a.invulnerable=0;
 return r;
}
const input=(a,fields={})=>({type:'input',seq:a.lastSeq+1,...neutralInput(),...fields});

test('beast lobby is additive, bounded to five participants and cannot be selected in local bot arena',()=>{
 assert(MODES.includes('beast'));assert(!OFFLINE_ARENA_MODES.includes('beast'));
 const base={type:'create',nickname:'Wave',mode:'beast',arena:'no-carrier',limit:10,capacity:5,bots:3};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)));
 for(const bad of [{...base,capacity:6},{...base,health:900},{...base,role:'beast'},{...base,bots:5}])
  assert.throws(()=>validateMessage(JSON.stringify(bad)));
 const message=input({lastSeq:0});
 for(const forged of [{beastRole:true},{role:'beast'},{beastHp:999},{damage:200},{win:'beast'},{x:4,y:4}])
  assert.throws(()=>validateMessage(JSON.stringify({...message,...forged})));
});

test('the owner becomes the sole Crawler, other humans and labeled bots are Hunters',()=>{
 const r=room({bots:2,hunters:1}),beast=r.actors.get('owner');
 assert.equal(r.competitive,true);assert.equal(beast.team,'cyan');assert.equal(beast.feel.weapon,0);
 assert.equal(beast.player.health,BEAST_BASE_HEALTH+200);
 assert.equal(beast.player.armor,0);assert.equal(beast.player.energy,0);
 assert.equal(r.beast.beastId,beast.id);assert.equal(r.beast.hunterIds.length,3);
 assert.equal(r.snapshot(beast).beast.archetype,'crawler');
 assert.equal(r.snapshot(beast).beast.beastId,'owner');
 assert.equal(r.snapshot(beast).players.find(p=>p.id==='owner').role,'beast');
 assert.equal(r.roster().filter(p=>p.role==='beast').length,1);
 assert(r.roster().filter(p=>p.role==='hunter').every(p=>p.team==='pink'));
 assert.equal(r.checkpoint(),null);assert.deepEqual(r.receipts,[]);
 assert(r.game.level.enemies.length===0,'no campaign enemies are transformed');
 assert(r.spawns.length>=6);
});

test('beast claw hit is directional, cooldown-bound and host-owned',()=>{
 const r=room(),a=r.actors.get('owner'),b=r.actors.get('hunter0');
 Object.assign(a.player,{x:3.5,y:3.5,a:0});Object.assign(b.player,{x:4.6,y:3.5,armor:0});
 assert(canOccupy(r.game.level,a.player.x,a.player.y));assert(canOccupy(r.game.level,b.player.x,b.player.y));
 r.game.time=2;const hp=b.player.health;
 assert.equal(r.beastStrike(a),true);
 assert(b.player.health<hp);const after=b.player.health;
 assert.equal(r.beastStrike(a),false,'immediate double attack must fail');
 assert.equal(b.player.health,after);
 r.game.time+=BEAST_MELEE_COOLDOWN+.01;a.player.a=Math.PI;
 assert.equal(beastClawTarget(r.beast,a,r.actors.values(),r.game.level),null);
 assert.equal(r.beastStrike(a),false);assert.equal(b.player.health,after);
});

test('beast cannot use human firearms, supply pickups, reloads or regular dash',()=>{
 const r=room(),a=r.actors.get('owner');
 r.game.time=3;
 r.withActor(a,()=>{
  r.game.mode='playing';r.game.weapon=3;
  assert.equal(r.game.shoot(),false);
  assert.equal(r.game.dodge(),false);
  const before=r.game.level.items.filter(i=>i.taken).length;
  r.game.collectPlayerItems();
  assert.equal(r.game.level.items.filter(i=>i.taken).length,before);
 });
 a.lastSeq=0;const m=input(a,{weapon:5,actions:['reload','ori','bass','alternate']});
 assert.equal(r.input(a,m),true);r.step();
 assert.equal(a.feel.weapon,0);
 assert.equal(a.player.energy,0);
});

test('lunge obeys actual map collision, has a cooldown and never teleports',()=>{
 const r=room(),a=r.actors.get('owner');
 Object.assign(a.player,{x:3.5,y:3.5,a:0});r.game.time=3;
 const before={...a.player};
 assert.equal(r.beastLunge(a,0),true);
 const moved=Math.hypot(a.player.x-before.x,a.player.y-before.y);
 assert(moved>0&&moved<=BEAST_LUNGE_DISTANCE+.01);
 assert(canOccupy(r.game.level,a.player.x,a.player.y));
 assert.equal(r.beastLunge(a,0),false);
 r.game.time+=BEAST_LUNGE_COOLDOWN+.01;
 assert.equal(r.beastLunge(a,Math.PI),true);
 assert(canOccupy(r.game.level,a.player.x,a.player.y));
});

test('hosted Hunter damage against Beast ends match once with no respawn or fake campaign credit',()=>{
 const r=room(),beast=r.actors.get('owner'),hunter=r.actors.get('hunter0');
 r.game.time=3;r.hurt(beast,beast.player.health+100,hunter);
 assert.equal(beast.status,'dead');
 r.step();assert.equal(r.state,'results');assert.deepEqual(r.result,{winner:'hunters',reason:'beast-defeated'});
 assert.equal(r.events.filter(e=>e.type==='beastResult').length,1);
 assert.equal(r.receipts.length,0);assert.equal(r.checkpoint(),null);
 for(let i=0;i<200;i++)r.step();
 assert.equal(beast.status,'dead');
});

test('the Beast wins by eliminating all Hunters, while connected survivors win on fixed host time',()=>{
 const r=room(),hunter=r.actors.get('hunter0');r.defeat(hunter);r.step();
 assert.equal(r.state,'results');assert.equal(r.result.winner,'beast');
 assert.equal(r.result.reason,'hunters-eliminated');
 const s=freshBeastMatch('owner',[{id:'owner',bot:false},{id:'hunter0',bot:false}]);
 const players=[{id:'owner',connected:true,status:'alive'},{id:'hunter0',connected:true,status:'alive'}];
 let outcome=null;
 for(let i=0;i<BEAST_ROUND_SECONDS*10;i++)outcome=advanceBeast(s,players,i/10,.1);
 assert.deepEqual(outcome,{winner:'hunters',reason:'hunters-survived'});
 assert.equal(s.remaining,0);
 assert.equal(advanceBeast(s,players,BEAST_ROUND_SECONDS+.1,.1),null,'no duplicated win');
});

test('disconnect grace voids unattended roles and does not mint a win',()=>{
 const r=room(),beast=r.actors.get('owner');
 r.disconnect(beast.id);
 const state=r.beast;
 const people=[...r.actors.values()];
 assert.equal(advanceBeast(state,people,r.elapsed+10,1/30),null);
 const ended=advanceBeast(state,people,r.elapsed+16,1/30);
 assert.deepEqual(ended,{winner:null,reason:'player-abandoned'});
 assert.equal(beastSnapshot(state,20,people).completed,true);
});

test('one real human can face an actual labeled Hunter bot with ordinary server-generated inputs',()=>{
 const r=room({bots:1,hunters:0}),owner=r.actors.get('owner');
 assert.equal(r.roster().filter(a=>a.bot).length,1);
 for(let i=0;i<10;i++)r.step();
 assert.equal(r.state,'playing');
 assert(r.snapshot(owner).players.some(a=>a.bot&&a.role==='hunter'));
 assert.equal(r.beast.beastId,'owner');
});

test('desktop, immersive, PWA and Quest-ready shared interfaces expose the new role without fake victories',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('public/bbs.html').includes('value="beast"'));
 assert(read('src/net/client.js').includes('this.beastRole'));
 assert(read('src/net/bbs.js').includes('THE INVERSION'));
 assert(read('src/net/presentation.js').includes('crawlerBeastSprite'));
 assert(read('src/world-scene.js').includes("a.role==='beast'"));
 assert(read('scripts/build.mjs').includes("'./src/net/beast-inversion.js'"));
 assert(read('src/net/offline-bots.js').includes("'beast'"));
});
