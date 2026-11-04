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
 ws.on('message',data=>messages.push(JSON.parse(data)));
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),
  async wait(predicate){for(let i=0;i<220;i++){const m=messages.find(predicate);if(m)return m;await pause();}throw Error('Expected BBS wire message not received');}};
}

test('three WebSockets agree on Warden host, warning, timed field pulse and authoritative outcome',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-warden-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),peers=[];
 try{
  for(let i=0;i<3;i++)peers.push(await peer(server.address.port));
  const [a,b,c]=peers;
  a.send({type:'create',nickname:'TITAN',mode:'beast',beastType:'warden',arena:'no-carrier',limit:10,capacity:3,bots:0});
  const wa=await a.wait(m=>m.type==='welcome');
  b.send({type:'join',nickname:'HUNTER ONE',code:wa.code});
  c.send({type:'join',nickname:'HUNTER TWO',code:wa.code});
  const wb=await b.wait(m=>m.type==='welcome'),wc=await c.wait(m=>m.type==='welcome');
  for(const p of peers)p.send({type:'ready',ready:true});
  await pause();a.send({type:'start'});await pause();
  const room=server.rooms.get(wa.code),beast=room.actors.get(wa.id),
   h1=room.actors.get(wb.id),h2=room.actors.get(wc.id);
  assert.equal(room.state,'playing');assert.equal(room.beast.archetype,'warden');
  assert.equal(beast.player.health,630);
  server.broadcast();
  const start=await c.wait(m=>m.type==='snapshot'&&m.state==='playing'&&m.beast?.archetype==='warden');
  assert.equal(start.beast.beastMaxHealth,630);
  assert.equal(start.players.find(p=>p.id===wa.id).archetype,'warden');
  assert.equal(start.roster.find(p=>p.id===wa.id).role,'beast');
  // No packet can request a different role, set field coordinates or mint hits.
  a.send({type:'input',seq:1,...neutralInput(),field:{x:5,y:5},damage:1000});
  assert.match((await a.wait(m=>m.type==='error')).message,/Unknown protocol field/);
  assert.equal(room.beast.field,null);
  Object.assign(beast.player,{x:3.5,y:3.5,a:0});
  Object.assign(h1.player,{x:5.5,y:3.5,armor:0});
  Object.assign(h2.player,{x:5.5,y:4.5,armor:0});
  for(const actor of room.actors.values())actor.invulnerable=0;
  room.game.time=2;
  a.send({type:'input',seq:2,...neutralInput(),angle:0,actions:['dash']});
  await pause();server.step();
  assert(room.beast.field&&room.beast.field.armedAt>room.game.time);
  server.broadcast();
  const warning=await b.wait(m=>m.type==='snapshot'&&m.beast?.field?.phase==='warning');
  assert.equal(warning.beast.field.x,3.5);assert.equal(warning.beast.field.y,3.5);
  room.game.time=room.beast.field.armedAt-.15;
  server.step();assert.equal(h1.player.health,100);assert.equal(h2.player.health,100);
  room.game.time=room.beast.field.armedAt;
  server.step();
  assert.equal(h1.player.health,89);assert.equal(h2.player.health,89);
  server.step();assert.equal(h1.player.health,89,'one pulse only until next host interval');
  server.broadcast();
  const active=await c.wait(m=>m.type==='snapshot'&&m.beast?.field?.phase==='active');
  assert(active.beast.field.remaining>0);
  // Set vulnerable health only in the test server fixture. The ordinary,
  // validated Warden FIRE intent still chooses a real target and kills.
  Object.assign(h1.player,{x:4.5,y:3.5,health:20});
  Object.assign(h2.player,{x:4.8,y:3.5,health:20});
  room.game.time=room.beast.field.armedAt+.5;
  a.send({type:'input',seq:3,...neutralInput(),angle:0,fire:true});
  await pause();server.step();
  assert.equal(h1.status,'dead');
  room.game.time=room.beast.field.armedAt+2.1;
  a.send({type:'input',seq:4,...neutralInput(),angle:0,fire:true});
  await pause();server.step();
  assert.equal(room.state,'results');
  assert.deepEqual(room.result,{winner:'beast',reason:'hunters-eliminated'});
  assert.equal(room.receipts.length,0);assert.equal(room.checkpoint(),null);
  server.broadcast();
  const final=await b.wait(m=>m.type==='snapshot'&&m.state==='results');
  assert.equal(final.result.winner,'beast');
 }finally{
  for(const p of peers)p.ws.close();
  await server.close();await rm(dir,{recursive:true,force:true});
 }
});

test('host cannot choose Warden in Deathmatch and unrecognized types create no room',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-warden-reject-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),p=await peer(server.address.port);
 try{
  p.send({type:'create',nickname:'WAVE',mode:'deathmatch',beastType:'warden',arena:'no-carrier',limit:10,capacity:2,bots:0});
  assert.match((await p.wait(m=>m.type==='error')).message,/Invalid Beast archetype/);
  assert.equal(server.rooms.size,0);
 }finally{p.ws.close();await server.close();await rm(dir,{recursive:true,force:true});}
});
