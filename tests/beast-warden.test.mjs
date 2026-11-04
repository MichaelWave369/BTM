import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Room} from '../src/net/simulation.js';
import {NetworkView} from '../src/net/client.js';
import {neutralInput,validateMessage} from '../src/net/protocol.js';
import {BEAST_ARCHETYPES,freshBeastMatch,beastWardenTarget,
 deployWardenField,wardenFieldTargets,beastSnapshot} from '../src/net/beast-inversion.js';
import {canOccupy,lineOfSight} from '../src/collision.js';

function match({archetype='warden',hunters=2}={}){
 const room=new Room({code:'WARDEN69',mode:'beast',beastType:archetype,arena:'no-carrier',capacity:hunters+1,limit:10});
 const beast=room.add({id:'owner',nickname:'WARDEN',token:'a'.repeat(48)});beast.ready=true;
 const others=[];
 for(let i=0;i<hunters;i++){const hunter=room.add({id:'hunter'+i,nickname:'HUNTER '+i,token:'b'.repeat(48)});hunter.ready=true;others.push(hunter);}
 room.start(beast.id);for(const a of room.actors.values())a.invulnerable=0;
 return {room,beast,hunters:others};
}

test('Warden is a valid host-locked Beast, never a role or free-damage client input',()=>{
 const base={type:'create',nickname:'WAVE',mode:'beast',beastType:'warden',arena:'no-carrier',capacity:3,limit:10,bots:0};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)));
 for(const bad of [{...base,beastType:'WARDEN'},{...base,beastType:'alien'}, {...base,mode:'deathmatch'}])
  assert.throws(()=>validateMessage(JSON.stringify(bad)));
 for(const forgery of [{beastType:'warden'},{role:'beast'},{field:{x:5,y:5}},{damage:999},
  {health:9999},{x:3.5,y:4.5},{targets:['hunter0']}]){
  assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),...forgery})));
 }
 assert.throws(()=>new Room({code:'BADWARDN',mode:'beast',beastType:'bogus'}));
 assert.throws(()=>freshBeastMatch('owner',[{id:'owner',bot:false},{id:'h',bot:false}],'bogus'));
 for(const [name,baseHp] of [['crawler',360],['repeater',260],['plugged',410]]){
  const {room,beast}=match({archetype:name,hunters:1});
  assert.equal(room.beast.archetype,name);
  assert.equal(beast.player.health,baseHp);
 }
});

test('host assigns one original Warden with stronger HP, slow movement and zero campaign credit',()=>{
 const {room,beast}=match({hunters:3});
 assert.equal(room.beast.archetype,'warden');
 assert.equal(beast.player.health,BEAST_ARCHETYPES.warden.health+2*BEAST_ARCHETYPES.warden.perHunter);
 assert.equal(beast.player.armor,0);assert.equal(beast.player.energy,0);assert.equal(beast.feel.weapon,0);
 assert(BEAST_ARCHETYPES.warden.walk<BEAST_ARCHETYPES.plugged.walk);
 assert.equal(room.snapshot(beast).beast.beastMaxHealth,740);
 assert.equal(room.snapshot(room.actors.get('hunter0')).players.find(p=>p.id===beast.id).archetype,'warden');
 assert.equal(room.checkpoint(),null);
 assert.deepEqual(room.receipts,[]);
 assert.equal(room.game.level.enemies.length,0);
});

test('Warden crush has a forward angle, LOS and host cooldown; no Warden firearms',()=>{
 const {room,beast,hunters:[hunter]}=match({hunters:1});
 room.game.time=2;
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});Object.assign(hunter.player,{x:5.25,y:3.5,armor:0});
 assert(canOccupy(room.game.level,hunter.player.x,hunter.player.y));
 assert.equal(beastWardenTarget(room.beast,beast,room.actors.values(),room.game.level),hunter);
 assert.equal(room.beastStrike(beast),true);
 assert.equal(hunter.player.health,100-BEAST_ARCHETYPES.warden.damage);
 assert.equal(room.beastStrike(beast),false);
 room.game.time+=BEAST_ARCHETYPES.warden.cooldown+.05;beast.player.a=Math.PI;
 assert.equal(beastWardenTarget(room.beast,beast,room.actors.values(),room.game.level),null);
 assert.equal(room.beastStrike(beast),false);
 room.withActor(beast,()=>{
  room.game.mode='playing';room.game.weapon=5;
  assert.equal(room.game.shoot(),false);
  assert.equal(room.game.dodge(),false);
  assert.equal(room.game.collectPlayerItems(),undefined);
 });
});

test('Warden field warns for one second, then pulses once per host second to all visible Hunters',()=>{
 const {room,beast,hunters:[first,second]}=match();
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(first.player,{x:5.5,y:3.5,armor:0});
 Object.assign(second.player,{x:5.5,y:4.5,armor:0});
 room.game.time=2;
 assert.equal(room.beastLunge(beast,0),true);
 assert.equal(room.beast.field.x,3.5);assert.equal(room.beast.field.y,3.5);
 assert.equal(room.beastLunge(beast,0),false,'one active field per cooldown');
 assert.equal(beastSnapshot(room.beast,2,room.actors.values()).field.phase,'warning');
 const field=room.beast.field,profile=BEAST_ARCHETYPES.warden;
 assert.equal(field.armedAt,2+profile.fieldWindup);
 assert.deepEqual(wardenFieldTargets(room.beast,room.actors.values(),room.game.level,2.99),[]);
 assert.equal(first.player.health,100);
 // The real fixed-step server, not the client, applies each tick's damage.
 room.game.time=field.armedAt;
 room.step();
 assert.equal(first.player.health,100-profile.fieldDamage);
 assert.equal(second.player.health,100-profile.fieldDamage);
 assert.equal(room.snapshot(beast).beast.field.phase,'active');
 assert(room.events.some(e=>e.type==='beastFieldPulse'&&e.targets.length===2));
 room.step();room.step();
 assert.equal(first.player.health,100-profile.fieldDamage,'no repeated per-frame damage');
 room.game.time=field.armedAt+profile.fieldTick+.05;
 room.step();
 assert.equal(first.player.health,100-profile.fieldDamage*2);
 assert.equal(second.player.health,100-profile.fieldDamage*2);
 assert.equal(room.beast.lungeAt,2+profile.lungeCooldown);
 room.game.time=field.expiresAt+.01;
 room.step();
 assert.equal(room.beast.field,null);
 assert.equal(first.player.health,100-profile.fieldDamage*2);
});

test('fixed field is avoidable and cannot see through a manufactured arena wall',()=>{
 const {room,beast,hunters:[first,second]}=match();
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(first.player,{x:5.5,y:3.5,armor:0});
 Object.assign(second.player,{x:3.5,y:4.5,armor:0});
 // Only in this unit fixture, insert a solid column separating Warden
 // and the first Hunter while both remain on safe traversable floor.
 room.game.level.cells[3][4]=1;
 assert(canOccupy(room.game.level,beast.player.x,beast.player.y));
 assert(canOccupy(room.game.level,first.player.x,first.player.y));
 assert(!lineOfSight(room.game.level,beast.player,first.player));
 room.game.time=2;assert.equal(room.beastLunge(beast,0),true);
 const candidates=wardenFieldTargets(room.beast,room.actors.values(),room.game.level,room.beast.field.armedAt);
 assert.deepEqual(candidates,[second],'wall separates first Hunter, second is reachable');
 // The field does not follow fleeing Hunters. Moving away before the next
 // pulse prevents damage without forcibly moving their VR playspace.
 Object.assign(second.player,{x:7.5,y:3.5});
 assert.deepEqual(wardenFieldTargets(room.beast,room.actors.values(),room.game.level,room.beast.field.nextPulseAt),[]);
});

test('Warden field vanishes on death/disconnect, and cooldown cannot be bypassed by repeated DASH',()=>{
 const {room,beast,hunters:[hunter]}=match({hunters:1});
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(hunter.player,{x:4.5,y:3.5});
 room.game.time=2;assert.equal(room.beastLunge(beast,0),true);
 assert.equal(room.beastLunge(beast,0),false);
 room.game.time=3;room.defeat(beast);
 assert.deepEqual(wardenFieldTargets(room.beast,room.actors.values(),room.game.level,3.1),[]);
 assert.equal(room.beast.field,null);
 const again=match({hunters:1});
 again.room.game.time=2;again.room.beastLunge(again.beast,0);
 again.room.disconnect(again.beast.id);
 assert.deepEqual(wardenFieldTargets(again.room.beast,again.room.actors.values(),again.room.game.level,3.1),[]);
 assert.equal(again.room.beast.field,null);
});

test('Warden client remains bounded to frame-time movement and host field snapshots',()=>{
 const net={intent:{},actions:new Set()},view=new NetworkView(net);
 view.mode='playing';view.status='alive';view.inputEnabled=true;view.beastRole=true;view.beastArchetype='warden';
 view.player={...view.player,x:4.5,y:20.5,a:-Math.PI/2};
 const start={...view.player};
 view.update(1/30,{moveForward:1,sprint:true});
 const moved=Math.hypot(view.player.x-start.x,view.player.y-start.y);
 assert(moved>.05&&moved<.13);
 assert.equal(net.intent.weapon,0);
});

test('fourth Beast is visible in host lobby, HUD, classic sprite and native VR, without a human rifle',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('public/bbs.html').includes('value="warden"'));
 assert(read('src/net/bbs.js').includes("'WARDEN CRUSH'"));
 assert(read('src/net/presentation.js').includes('wardenBeastSprite'));
 assert(read('src/renderer.js').includes('wardenBeastSprite'));
 assert(read('src/world-scene.js').includes("a.archetype==='warden'"));
 assert(read('src/world-scene.js').includes('if(game.beastRole)'));
 assert(read('src/net/client.js').includes("'WARDEN CRUSH + FIELD"));
});
