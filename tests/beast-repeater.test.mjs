import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Room} from '../src/net/simulation.js';
import {NetworkView} from '../src/net/client.js';
import {BEAST_ARCHETYPES,beastPulseTarget,freshBeastMatch,beastSnapshot} from '../src/net/beast-inversion.js';
import {neutralInput,validateMessage} from '../src/net/protocol.js';
import {lineOfSight,canOccupy} from '../src/collision.js';

function pair(type='repeater'){
 const r=new Room({code:'REPEAT69',mode:'beast',beastType:type,arena:'no-carrier',limit:10,capacity:2});
 const beast=r.add({id:'wave',nickname:'Wave',token:'a'.repeat(48)}),
  hunter=r.add({id:'hunter',nickname:'Hunter',token:'b'.repeat(48)});
 beast.ready=hunter.ready=true;
 r.start(beast.id);beast.invulnerable=hunter.invulnerable=0;
 return {r,beast,hunter};
}

test('server accepts only explicit Crawler/Repeater at lobby creation and never in mid-match input',()=>{
 const base={type:'create',nickname:'Wave',mode:'beast',arena:'no-carrier',limit:10,capacity:2,bots:0};
 for(const type of ['crawler','repeater'])assert.doesNotThrow(()=>validateMessage(JSON.stringify({...base,beastType:type})));
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)),'older clients still default to Crawler');
 for(const wrong of [{...base,beastType:'warden'},{...base,beastType:'REPEATER'},
  {...base,beastType:999},{...base,mode:'deathmatch',beastType:'repeater'}])
  assert.throws(()=>validateMessage(JSON.stringify(wrong)),/Invalid Beast archetype/);
 for(const props of [{beastType:'repeater'},{archetype:'repeater'},{role:'beast'},{beastHealth:900},{x:7.5,y:3.5}]){
  assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),...props})));
 }
 assert.throws(()=>new Room({code:'INVALID8',mode:'beast',beastType:'warden'}));
 assert.throws(()=>freshBeastMatch('wave',[{id:'wave',bot:false},{id:'hunter',bot:false}],'warden'));
});

test('Repeater identity is host-owned and its lower health preserves original Crawler stats',()=>{
 const {r,beast,hunter}=pair();
 assert.equal(r.beast.archetype,'repeater');
 assert.equal(beast.player.health,BEAST_ARCHETYPES.repeater.health);
 assert.equal(beast.player.armor,0);
 assert.equal(beast.feel.weapon,0);
 assert.equal(hunter.team,'pink');
 assert.equal(r.snapshot(hunter).beast.archetype,'repeater');
 const remote=r.snapshot(hunter).players.find(p=>p.id===beast.id);
 assert.equal(remote.role,'beast');assert.equal(remote.archetype,'repeater');
 assert.equal(r.roster().find(p=>p.id===beast.id).archetype,'repeater');
 assert.equal(beastSnapshot(r.beast,r.game.time,r.actors.values()).beastMaxHealth,260);
 assert.equal(r.checkpoint(),null);assert.equal(r.receipts.length,0);
 const original=pair('crawler');assert.equal(original.beast.player.health,BEAST_ARCHETYPES.crawler.health);
 assert.equal(original.r.beast.archetype,'crawler');
});

test('pulse is narrow, truly LOS-checked, cooldown-limited and can never hit through walls',()=>{
 const {r,beast,hunter}=pair();r.game.time=2;
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(hunter.player,{x:7.5,y:3.5,armor:0});
 assert(canOccupy(r.game.level,beast.player.x,beast.player.y));
 assert(canOccupy(r.game.level,hunter.player.x,hunter.player.y));
 assert(lineOfSight(r.game.level,beast.player,hunter.player));
 assert.equal(beastPulseTarget(r.beast,beast,r.actors.values(),r.game.level),hunter);
 const before=hunter.player.health;
 assert.equal(r.beastStrike(beast),true);
 assert.equal(hunter.player.health,before-BEAST_ARCHETYPES.repeater.damage);
 assert.equal(r.beastStrike(beast),false);
 assert.equal(hunter.player.health,before-BEAST_ARCHETYPES.repeater.damage);
 assert(r.events.some(e=>e.type==='beastPulse'&&e.target===hunter.id));
 r.game.time+=BEAST_ARCHETYPES.repeater.cooldown+.01;
 hunter.player.y=4.8; // steeply outside the Repeater's sight cone
 assert.equal(beastPulseTarget(r.beast,beast,r.actors.values(),r.game.level),null);
 assert.equal(r.beastStrike(beast),false);
 Object.assign(beast.player,{x:7.5,y:6.5,a:0});
 Object.assign(hunter.player,{x:11.5,y:6.5});
 assert(!lineOfSight(r.game.level,beast.player,hunter.player),'solid column blocks the attack');
 r.game.time+=BEAST_ARCHETYPES.repeater.cooldown+.01;
 assert.equal(r.beastStrike(beast),false);
 assert.equal(hunter.player.health,before-BEAST_ARCHETYPES.repeater.damage);
});

test('Repeater evade is short, collision-safe, cooldown-bound and weaker than Crawler lunge',()=>{
 const {r,beast}=pair();Object.assign(beast.player,{x:3.5,y:3.5,a:0});r.game.time=3;
 const start={...beast.player};
 assert.equal(r.beastLunge(beast,0),true);
 const covered=Math.hypot(beast.player.x-start.x,beast.player.y-start.y);
 assert(covered>0&&covered<=BEAST_ARCHETYPES.repeater.lunge+1e-6);
 assert(BEAST_ARCHETYPES.repeater.lunge<BEAST_ARCHETYPES.crawler.lunge);
 assert(canOccupy(r.game.level,beast.player.x,beast.player.y));
 assert.equal(r.beastLunge(beast,0),false);
 r.game.time+=BEAST_ARCHETYPES.repeater.lungeCooldown+.02;
 assert.equal(r.beastLunge(beast,Math.PI),true);
 assert(canOccupy(r.game.level,beast.player.x,beast.player.y));
});

test('Repeater cannot use human weapons or collect loot, and Hunter elimination still ends the host match',()=>{
 const {r,beast,hunter}=pair();r.game.time=3;
 r.withActor(beast,()=>{
  r.game.mode='playing';r.game.weapon=5;
  assert.equal(r.game.shoot(),false);
  assert.equal(r.game.dodge(),false);
  assert.equal(r.game.collectPlayerItems(),undefined);
 });
 assert.equal(beast.player.energy,0);
 Object.assign(beast.player,{x:3.5,y:3.5,a:0});
 Object.assign(hunter.player,{x:4.5,y:3.5,armor:0,health:12});
 assert.equal(r.beastStrike(beast),true);
 assert.equal(hunter.status,'dead');r.step();
 assert.deepEqual(r.result,{winner:'beast',reason:'hunters-eliminated'});
 assert.equal(r.checkpoint(),null);
});

test('Beast client prediction integrates frame time for both archetypes, not one full second per frame',()=>{
 for(const archetype of ['crawler','repeater']){
  const view=new NetworkView({intent:{},actions:new Set()});
  view.mode='playing';view.inputEnabled=true;view.status='alive';
  view.beastRole=true;view.beastArchetype=archetype;
  view.player={...view.player,x:4.5,y:20.5,a:-Math.PI/2};
  const before={...view.player};
  view.update(1/30,{moveForward:1,sprint:true});
  const travel=Math.hypot(view.player.x-before.x,view.player.y-before.y);
  assert(travel>0&&travel<.18,archetype+' movement prediction must stay within one 30Hz tick');
  assert.equal(view.net.intent.weapon,0);
 }
});

test('both Beast forms are presented in hosted lobby, Canvas and immersive VR without new art assets',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('public/bbs.html').includes('id="beast-type"'));
 assert(read('src/net/bbs.js').includes("beastType:$('beast-type').value"));
 assert(read('src/renderer.js').includes('repeaterBeastSprite'));
 assert(read('src/net/presentation.js').includes('repeaterBeastSprite'));
 assert(read('src/world-scene.js').includes("a.archetype==='repeater'"));
 assert(read('src/net/client.js').includes('BEAST_ARCHETYPES'));
});
