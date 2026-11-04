import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Room} from '../src/net/simulation.js';
import {NetworkView} from '../src/net/client.js';
import {neutralInput,validateMessage} from '../src/net/protocol.js';
import {BEAST_ARCHETYPES,freshBeastMatch,beastArcTargets,beastClawTarget,beastPulseTarget,beastSnapshot} from '../src/net/beast-inversion.js';
import {canOccupy,lineOfSight} from '../src/collision.js';

function room({type='plugged',hunters=2}={}){
 const r=new Room({code:'PLUGGED9',mode:'beast',beastType:type,arena:'no-carrier',limit:10,capacity:hunters+1});
 const beast=r.add({id:'owner',nickname:'WAVE',token:'a'.repeat(48)});beast.ready=true;
 const other=[];for(let i=0;i<hunters;i++){const p=r.add({id:'hunter'+i,nickname:'HUNTER'+i,token:'b'.repeat(48)});p.ready=true;other.push(p);}
 r.start(beast.id);for(const actor of r.actors.values())actor.invulnerable=0;
 return {r,beast,hunters:other};
}

test('Plugged is an optional, immutable host-created Beast, not an input-controlled transformation',()=>{
 const base={type:'create',nickname:'Wave',mode:'beast',beastType:'plugged',arena:'no-carrier',limit:10,capacity:3,bots:0};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)));
 for(const bad of [{...base,beastType:'PLUGGED'},{...base,beastType:'unknown-beast'},
  {...base,mode:'team'},{...base,beastHealth:999}])
  assert.throws(()=>validateMessage(JSON.stringify(bad)));
 for(const prop of [{beastType:'plugged'},{archetype:'plugged'},{guardUntil:9999},{targets:['hunter0']},{role:'beast'},{health:900},{x:2,y:2}])
  assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),...prop})));
 assert.throws(()=>new Room({code:'INVALID9',mode:'beast',beastType:'unknown-beast'}));
 assert.throws(()=>freshBeastMatch('owner',[{id:'owner',bot:false},{id:'other',bot:false}],'invalid'));
 const old=room({type:'crawler',hunters:1});
 assert.equal(old.r.beast.archetype,'crawler');
 assert.equal(old.beast.player.health,BEAST_ARCHETYPES.crawler.health);
 const rep=room({type:'repeater',hunters:1});
 assert.equal(rep.r.beast.archetype,'repeater');
 assert.equal(rep.beast.player.health,BEAST_ARCHETYPES.repeater.health);
});

test('the Plugged has separate host-owned health, role, arc and guard state and no saved campaign credits',()=>{
 const {r,beast}=room({hunters:3});
 assert.equal(beast.player.health,BEAST_ARCHETYPES.plugged.health+2*BEAST_ARCHETYPES.plugged.perHunter);
 assert.equal(beast.player.energy,0);assert.equal(beast.player.reserve,0);assert.equal(beast.player.armor,0);
 assert.equal(beast.feel.weapon,0);
 const snap=r.snapshot(r.actors.get('hunter0'));
 assert.equal(snap.beast.archetype,'plugged');
 assert.equal(snap.beast.beastId,beast.id);assert.equal(snap.beast.beastMaxHealth,580);
 assert.equal(snap.beast.guardRemaining,0);
 assert.equal(snap.players.find(p=>p.id===beast.id).archetype,'plugged');
 assert.equal(snap.roster.find(p=>p.id===beast.id).role,'beast');
 assert.equal(r.checkpoint(),null);assert.deepEqual(r.receipts,[]);
 assert.equal(r.game.level.enemies.length,0);
});

test('forked Plugged arc only selects two live, visible, frontal Hunters in bounded chain range',()=>{
 const {r,beast,hunters:[one,two,behind]}=room({hunters:3});
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(one.player,{x:5.5,y:3.5,armor:0});
 Object.assign(two.player,{x:5.5,y:4.5,armor:0});
 Object.assign(behind.player,{x:3.5,y:2.5,armor:0});
 for(const a of [beast,one,two,behind])assert(canOccupy(r.game.level,a.player.x,a.player.y));
 assert(lineOfSight(r.game.level,beast.player,two.player));
 assert.deepEqual(beastArcTargets(r.beast,beast,r.actors.values(),r.game.level),[one,two]);
 assert.equal(beastClawTarget(r.beast,beast,r.actors.values(),r.game.level),null);
 assert.equal(beastPulseTarget(r.beast,beast,r.actors.values(),r.game.level),null);
 r.game.time=3;
 assert.equal(r.beastStrike(beast),true);
 assert.equal(one.player.health,100-BEAST_ARCHETYPES.plugged.damage);
 assert.equal(two.player.health,100-BEAST_ARCHETYPES.plugged.chainDamage);
 assert.equal(behind.player.health,100);
 assert.equal(r.beastStrike(beast),false);
 assert.equal(one.player.health,100-BEAST_ARCHETYPES.plugged.damage);
 assert(r.events.some(e=>e.type==='beastArc'&&e.targets.length===2));
});

test('the arc never chains around walls or includes a disconnected Hunter or non-Hunter',()=>{
 const {r,beast,hunters:[one,two]}=room();
 Object.assign(beast.player,{x:7.5,y:6.5,a:0});
 Object.assign(one.player,{x:11.5,y:6.5,armor:0});
 Object.assign(two.player,{x:11.5,y:7.5,armor:0});
 assert(!lineOfSight(r.game.level,beast.player,one.player));
 assert.deepEqual(beastArcTargets(r.beast,beast,r.actors.values(),r.game.level),[]);
 assert.equal(r.beastStrike(beast),false);
 assert.equal(one.player.health,100);assert.equal(two.player.health,100);
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(one.player,{x:5.5,y:3.5});Object.assign(two.player,{x:5.5,y:4.5});
 r.disconnect(two.id);
 assert.deepEqual(beastArcTargets(r.beast,beast,r.actors.values(),r.game.level),[one]);
});

test('grounding is stationary, lasts 2.4 host seconds, halves Hunter damage and has a hard 8-second cooldown',()=>{
 const {r,beast,hunters:[hunter]}=room({hunters:1});
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});Object.assign(hunter.player,{x:4.5,y:3.5,armor:0});
 r.game.time=3;
 assert.equal(r.beastLunge(beast,0),true);
 assert.equal(r.beast.groundedUntil,3+BEAST_ARCHETYPES.plugged.guardDuration);
 assert.equal(r.beast.lungeAt,3+BEAST_ARCHETYPES.plugged.lungeCooldown);
 assert.equal(r.beastLunge(beast,0),false);
 assert.equal(beastSnapshot(r.beast,3,r.actors.values()).guardRemaining,2.4);
 const hp=beast.player.health;
 r.hurt(beast,60,hunter);
 assert.equal(hp-beast.player.health,30);
 const before={x:beast.player.x,y:beast.player.y};
 r.input(beast,{type:'input',seq:1,...neutralInput(),move:1,roomX:1,roomY:1,angle:0,sprint:true,actions:[]});
 r.step();
 assert(Math.hypot(beast.player.x-before.x,beast.player.y-before.y)<.001,'rooted Beast does not move from keyboard or room locomotion');
 r.game.time=5.6;
 assert.equal(beastSnapshot(r.beast,r.game.time,r.actors.values()).guardRemaining,0);
 assert.equal(r.beastLunge(beast,0),false,'grounded effect expiration is not cooldown expiry');
 const after=beast.player.health;r.hurt(beast,60,hunter);
 assert.equal(after-beast.player.health,60);
 r.game.time=11.01;
 assert.equal(r.beastLunge(beast,0),true);
 assert.equal(r.beast.groundedUntil,11.01+BEAST_ARCHETYPES.plugged.guardDuration);
});

test('Plugged still has no guns, items, normal dash, revival or fake win rewards',()=>{
 const {r,beast,hunters:[hunter]}=room({hunters:1});r.game.time=2;
 r.withActor(beast,()=>{
  r.game.mode='playing';r.game.weapon=5;
  assert.equal(r.game.shoot(),false);assert.equal(r.game.dodge(),false);
  assert.equal(r.game.collectPlayerItems(),undefined);
 });
 assert.equal(beast.player.energy,0);
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(hunter.player,{x:4.5,y:3.5,armor:0,health:20});
 assert.equal(r.beastStrike(beast),true);
 assert.equal(hunter.status,'dead');
 r.step();
 assert.deepEqual(r.result,{winner:'beast',reason:'hunters-eliminated'});
 assert.equal(r.checkpoint(),null);assert.equal(r.receipts.length,0);
});

test('Client movement prediction roots only the active Plugged, leaving Crawler/Repeater unchanged',()=>{
 for(const type of ['crawler','repeater','plugged']){
  const net={intent:{},actions:new Set()},view=new NetworkView(net);
  view.mode='playing';view.status='alive';view.inputEnabled=true;
  view.beastRole=true;view.beastArchetype=type;view.netState={beast:{guardRemaining:2.1}};
  view.player={...view.player,x:4.5,y:20.5,a:-Math.PI/2};
  const start={...view.player};
  view.update(1/30,{moveForward:1,sprint:true});
  const travel=Math.hypot(view.player.x-start.x,view.player.y-start.y);
  if(type==='plugged')assert.equal(travel,0);
  else assert(travel>.05&&travel<.18);
  assert.equal(net.intent.weapon,0);
  if(type==='plugged'){
   view.netState.beast.guardRemaining=0;
   view.update(1/30,{moveForward:1,sprint:true});
   assert(Math.hypot(view.player.x-start.x,view.player.y-start.y)>.05);
  }
 }
});

test('Classic, immersive and lobby present the new form without external art, fake accounts or gun meshes',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('public/bbs.html').includes('value="plugged"'));
 assert(read('src/net/bbs.js').includes("'PLUGGED ARC'"));
 assert(read('src/net/presentation.js').includes('pluggedBeastSprite'));
 assert(read('src/renderer.js').includes('pluggedBeastSprite'));
 assert(read('src/world-scene.js').includes("a.archetype==='plugged'"));
 assert(read('src/world-scene.js').includes('if(game.beastRole)'));
 assert(read('src/net/client.js').includes("guardRemaining||0"));
});
