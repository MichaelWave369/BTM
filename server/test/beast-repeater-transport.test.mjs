import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from '../index.mjs';
import {neutralInput} from '../../src/net/protocol.js';

const {WebSocket}=createRequire(new URL('../package.json',import.meta.url))('ws');
const pause=()=>new Promise(resolve=>setTimeout(resolve,5));
async function peer(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 ws.on('message',packet=>messages.push(JSON.parse(packet)));
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),
  async wait(predicate){for(let i=0;i<200;i++){const message=messages.find(predicate);if(message)return message;await pause();}throw Error('Timed out waiting for BBS message');}};
}

test('two actual WebSockets agree on host-selected Repeater, cover rule, pulse and winner',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-repeater-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),peers=[];
 try{
  const a=await peer(server.address.port),b=await peer(server.address.port);peers.push(a,b);
  a.send({type:'create',nickname:'WAVE',mode:'beast',beastType:'repeater',arena:'no-carrier',capacity:2,limit:10,bots:0});
  const wa=await a.wait(m=>m.type==='welcome');
  b.send({type:'join',nickname:'HUNTER',code:wa.code});
  const wb=await b.wait(m=>m.type==='welcome');
  a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});await pause();a.send({type:'start'});await pause();
  const room=server.rooms.get(wa.code),beast=room.actors.get(wa.id),hunter=room.actors.get(wb.id);
  assert.equal(room.beast.archetype,'repeater');
  assert.equal(beast.player.health,260);
  server.broadcast();
  const snap=await b.wait(m=>m.type==='snapshot'&&m.beast?.archetype==='repeater'&&m.state==='playing');
  assert.equal(snap.beast.beastId,wa.id);
  assert.equal(snap.players.find(p=>p.id===wa.id).archetype,'repeater');
  assert.equal(snap.roster.find(p=>p.id===wa.id).role,'beast');
  a.send({type:'input',seq:1,...neutralInput(),archetype:'crawler'});
  assert.match((await a.wait(m=>m.type==='error')).message,/Unknown protocol field/);
  assert.equal(room.beast.archetype,'repeater');
  // These coordinates are an explicit host test fixture; clients never sent
  // their positions. The solid column must reject an otherwise aimed pulse.
  Object.assign(beast.player,{x:7.5,y:6.5,a:0});
  Object.assign(hunter.player,{x:11.5,y:6.5,armor:0});
  beast.invulnerable=hunter.invulnerable=0;
  room.game.time=2;
  a.send({type:'input',seq:2,...neutralInput(),angle:0,fire:true,weapon:5});
  await pause();server.step();
  assert.equal(hunter.player.health,100,'solid cover rejects Repeater damage');
  // Expose a traversable open corridor. The exact same bounded FIRE action
  // can now hit, but only at the host-defined 1.35-second cadence.
  Object.assign(beast.player,{x:3.5,y:3.5,a:0});
  Object.assign(hunter.player,{x:7.5,y:3.5,armor:0});
  let hp=hunter.player.health;
  for(let seq=3;seq<11&&room.state==='playing';seq++){
   room.game.time+=1.4;
   a.send({type:'input',seq,...neutralInput(),angle:0,fire:true,weapon:5});
   await pause();server.step();
   assert(hunter.player.health<hp,'host accepted pulse after cooldown');
   hp=hunter.player.health;
  }
  assert.equal(room.state,'results');
  assert.deepEqual(room.result,{winner:'beast',reason:'hunters-eliminated'});
  assert.equal(room.receipts.length,0);
  server.broadcast();
  const result=await a.wait(m=>m.type==='snapshot'&&m.state==='results');
  assert.equal(result.result.winner,'beast');
  assert.equal(result.beast.archetype,'repeater');
 }finally{
  for(const p of peers)p.ws.close();
  await server.close();await rm(dir,{recursive:true,force:true});
 }
});

test('non-Beast lobbies reject Repeater selection before creating any room',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-repeater-guard-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),c=await peer(server.address.port);
 try{
  c.send({type:'create',nickname:'WAVE',mode:'deathmatch',beastType:'repeater',arena:'no-carrier',capacity:2,limit:10,bots:0});
  assert.match((await c.wait(m=>m.type==='error')).message,/Invalid Beast archetype/);
  assert.equal(server.rooms.size,0);
 }finally{c.ws.close();await server.close();await rm(dir,{recursive:true,force:true});}
});
