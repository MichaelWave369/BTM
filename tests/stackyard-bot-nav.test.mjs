import test from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../src/net/simulation.js';
import {botIntent} from '../src/net/bot-pilot.js';
import {createArena} from '../src/net/arenas.js';
import {STACK_HEIGHT,stackyardBotWaypoint,verticalSight} from '../src/net/vertical-arena.js';

const level=()=>createArena('stackyard').level;
const upper=(x,y)=>({x,y,height:STACK_HEIGHT,grounded:true,supportSurface:'upper'});
const lower=(x,y)=>({x,y,height:0,grounded:true,supportSurface:'ground'});
function match(){
 const room=new Room({code:'VERT3690',mode:'deathmatch',arena:'stackyard',limit:10,capacity:2});
 const host=room.add({id:'host',nickname:'HUMAN',token:'a'.repeat(48)});
 const bot=room.addBot('local-only');
 host.ready=true;room.start(host.id);
 host.invulnerable=bot.invulnerable=0;
 return {room,host,bot};
}
test('vertical routing keeps legacy arenas unchanged and gives deterministic ramp entrances',()=>{
 const stack=level(),flat=createArena('no-carrier').level;
 const top=upper(14.5,12.5),bottom=lower(14.5,12.5);
 assert.equal(stackyardBotWaypoint(flat,bottom,top),null);
 assert.equal(stackyardBotWaypoint(stack,top,upper(20.5,13.5)),null);
 assert.equal(stackyardBotWaypoint(stack,bottom,lower(20.5,13.5)),null);
 assert.deepEqual(stackyardBotWaypoint(stack,bottom,top),{x:3.5,y:10});
 assert.deepEqual(stackyardBotWaypoint(stack,top,bottom),{x:10.5,y:10});
 assert.deepEqual(stackyardBotWaypoint(stack,lower(3.5,10),top),{x:10.5,y:10});
 assert.deepEqual(stackyardBotWaypoint(stack,{x:7,y:9.5,height:.92,supportSurface:'ramp'},top),{x:10.5,y:10});
 assert.deepEqual(stackyardBotWaypoint(stack,{x:7,y:9.5,height:.92,supportSurface:'ramp'},bottom),{x:3.5,y:10});
 assert.deepEqual(stackyardBotWaypoint(stack,upper(10.5,10),bottom),{x:3.5,y:10});
 assert.equal(stackyardBotWaypoint(stack,lower(3.5,10),null),null);
});
test('Bot Pilot never shoots through a floor but can target an exposed opposite-floor edge',()=>{
 const {room,host,bot}=match();
 Object.assign(host.player,lower(14.5,12.5),{health:100});
 Object.assign(bot.player,upper(14.5,12.5),{health:100});
 room.tick=1;
 assert.equal(verticalSight(room.game.level,bot.player,host.player),false);
 const obstructed=botIntent(room,bot);
 assert.equal(obstructed.fire,false,'the platform occludes true cross-floor LOS');
 assert(Math.hypot(obstructed.move,obstructed.strafe)>.1,'pursues legal ramp path');
 assert.deepEqual(obstructed.actions,[]);
 // A genuinely exposed edge permits host-approved downward fire, not
 // an unrestricted 2D aim shot through the opaque upper deck.
 Object.assign(bot.player,upper(10.3,15.5));
 Object.assign(host.player,lower(8.0,15.5));
 assert.equal(verticalSight(room.game.level,bot.player,host.player),true);
 const exposed=botIntent(room,bot);
 assert.equal(exposed.fire,true);
 assert(room.targets(bot).some(a=>a.networkId===host.id));
 Object.assign(bot.player,upper(14.5,12.5));
 Object.assign(host.player,lower(14.5,12.5));
 assert.equal(botIntent(room,bot).fire,false);
 assert.equal(room.targets(bot).length,0);
});
test('real fixed-step Bot Pilot descends the ramp in a live deathmatch without teleport',()=>{
 const {room,host,bot}=match();
 assert.equal(host.player.height,0);
 assert.equal(bot.player.height,STACK_HEIGHT);
 Object.assign(host.player,lower(14.5,12.5),{a:0,health:100});
 const origin={x:bot.player.x,y:bot.player.y};
 let visitedRamp=false,descended=false,largestStep=0,last=bot.player.height;
 for(let i=0;i<540;i++){
  if(room.state!=='playing')break;
  room.step();
  largestStep=Math.max(largestStep,Math.abs(bot.player.height-last));
  last=bot.player.height;
  if(bot.player.supportSurface==='ramp')visitedRamp=true;
  if(visitedRamp&&bot.player.height<.3)descended=true;
  if(descended)break;
 }
 assert(visitedRamp,'autonomous Bot Pilot reaches real authored connector');
 assert(descended,'Bot Pilot actually descends to lower floor in server simulation');
 assert(largestStep<.3,'no client-supplied teleport or instantaneous floor swap');
 assert(Math.hypot(bot.player.x-origin.x,bot.player.y-origin.y)>3,'movement is real');
 assert.equal(room.receipts.length,0,'competitive movement never awards story credits');
 assert.equal(room.checkpoint(),null);
});
test('bots on both decks remain ordinary BBS actors with no jumping or injected height packet',()=>{
 const {room,host,bot}=match();
 Object.assign(host.player,upper(22.5,16.5),{health:100});
 Object.assign(bot.player,lower(6.5,15.5),{health:100});
 const first=botIntent(room,bot);
 assert(!Object.hasOwn(first,'height')&&!Object.hasOwn(first,'vz'));
 assert(!first.actions.includes('jump'),'authored ramp is the legal connector');
 assert(Math.hypot(first.move,first.strafe)>.1);
 for(let i=0;i<90;i++)room.step();
 const wire=room.snapshot(host);
 const pilot=wire.players.find(a=>a.id===bot.id);
 assert(Number.isFinite(pilot.height)&&Number.isFinite(pilot.vz));
 assert(pilot.height>=0&&pilot.height<=room.game.level.vertical.ceiling);
 assert.equal(pilot.bot,true);
});
