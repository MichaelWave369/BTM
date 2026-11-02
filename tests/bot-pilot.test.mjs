import test from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../src/net/simulation.js';
import {validateMessage,neutralInput} from '../src/net/protocol.js';
import {botIntent} from '../src/net/bot-pilot.js';

const token=x=>x.repeat(48);
function fixture(mode='deathmatch'){
 const room=new Room({code:'BOTROOM7',mode,capacity:4,limit:5,arena:'no-carrier'});
 const human=room.add({id:'human1',nickname:'Mikey',token:token('a')});
 const bot=room.addBot(token('b'));
 human.ready=true;room.start(human.id);
 return{room,human,bot};
}
test('old private rooms remain valid and bot counts are bounded and explicitly opted into',()=>{
 const old={type:'create',nickname:'Mikey',mode:'deathmatch',arena:'no-carrier',limit:5,capacity:2};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(old)));
 assert.doesNotThrow(()=>validateMessage(JSON.stringify({...old,bots:1})));
 for(const bots of [-1,2,4,1.5,'1',null])assert.throws(()=>validateMessage(JSON.stringify({...old,bots})));
 assert.throws(()=>validateMessage(JSON.stringify({...old,bots:1,botHealth:999})));
 assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),botId:'bot_1'})));
 const room=new Room({code:'BOTROOM0',capacity:2});
 const human=room.add({id:'human',nickname:'Mikey',token:token('a')});human.ready=true;
 assert.throws(()=>room.start(human.id),'one human with no bots must still require a second real player');
});
test('one real person starts a private arena with one labeled, normally spawned server bot',()=>{
 const {room,human,bot}=fixture();
 assert.equal(room.owner,human.id);assert.equal(room.state,'playing');
 assert.equal(room.actors.size,2);assert.equal(bot.bot,true);assert.equal(bot.ready,true);
 assert.equal(room.roster().find(a=>a.id===bot.id)?.bot,true);
 assert.equal(room.snapshot(human).players.find(a=>a.id===bot.id)?.bot,true);
 assert.equal(room.snapshot(human).mode,'deathmatch');
 assert.equal(room.input(bot,{...neutralInput(),seq:1}),false,'external gameplay input must never drive synthetic actors');
 const before={x:bot.player.x,y:bot.player.y},humanBefore={x:human.player.x,y:human.player.y};
 for(let i=0;i<90;i++)room.step();
 assert(Math.hypot(bot.player.x-before.x,bot.player.y-before.y)>.4,'pilot should move through the real arena');
 assert.deepEqual({x:human.player.x,y:human.player.y},humanBefore,'no fake movement of human avatar');
 assert(room.game.level.cells[Math.floor(bot.player.y)][Math.floor(bot.player.x)]===0,'bot must stay on actual floor');
});
test('bots generate bounded movement and only use existing actions, not score or position setters',()=>{
 const {room,bot}=fixture();
 for(let i=0;i<100;i++){
  const m=botIntent(room,bot);
  assert(Math.abs(m.move)<=1&&Math.abs(m.strafe)<=1);
  assert(Number.isFinite(m.angle)&&Math.abs(m.angle)<=4*Math.PI);
  assert(m.actions.every(a=>['ori','reload','dash'].includes(a)));
  assert(!('x'in m)&&!('y'in m)&&!('score'in m)&&!('health'in m)&&!('winner'in m));
  assert.doesNotThrow(()=>validateMessage(JSON.stringify({type:'input',seq:i+1,...m})));
  room.step();
 }
});
test('control-zone bots are regular occupants, can contest and never set scores directly',()=>{
 const {room,human,bot}=fixture('control');
 const before={...room.teamScore};
 for(let i=0;i<30;i++)room.step();
 assert.deepEqual(room.teamScore,before,'no invisible automatic points before standing inside a real hill');
 const point=room.control.zones[room.control.index];const m=botIntent(room,bot);
 assert(m&&typeof m.sprint==='boolean');
 assert.equal(room.mode,'control');
 assert(room.snapshot(human).control.zone.x===point.x);
});
test('co-op support bot is a real squad participant and is retained through host save/restore',()=>{
 const {room,human,bot}=fixture('coop');
 assert.equal(room.competitive,false);assert.equal(bot.team,'cyan');assert.equal(room.partySize,2);
 const initial={x:bot.player.x,y:bot.player.y};
 for(let i=0;i<70;i++)room.step();
 assert(Math.hypot(bot.player.x-initial.x,bot.player.y-initial.y)>.25,'co-op support bot should navigate towards an objective');
 const saved=room.checkpoint();
 assert.equal(saved.actors.length,2);
 assert(saved.actors.find(a=>a.id===bot.id)?.bot);
 const restored=new Room({code:room.code,mode:'coop',capacity:4});
 restored.restore(saved);
 const recovered=restored.actors.get(bot.id);
 assert.equal(recovered.bot,true);
 assert.equal(recovered.connected,true);
 assert.equal(recovered.ready,true);
 const pre=restored.tick;restored.step();
 assert(restored.tick>pre);
 assert.equal(restored.owner,human.id);
});
test('a room without any connected real humans stops bot-only competition and score farming',()=>{
 const {room,human,bot}=fixture('control');
 room.disconnect(human.id);const prev={tick:room.tick,time:room.game.time,score:{...room.teamScore}};
 for(let i=0;i<150;i++)room.step();
 assert.equal(room.game.time,prev.time);
 assert.deepEqual(room.teamScore,prev.score);
 assert.equal(room.actors.get(bot.id).connected,true);
});

test('disconnecting the only human never makes a PHI BOT the SYSOP',()=>{
 const {room,human,bot}=fixture('coop');
 const original=room.owner;
 room.disconnect(human.id);
 assert.equal(room.owner,original,'bot must not inherit room ownership');
 assert.notEqual(room.owner,bot.id);
 room.reconnect(human);
 assert.equal(room.owner,human.id);
 const stranger=room.addBot?.bind(room);
 assert.equal(typeof stranger,'function');
});
