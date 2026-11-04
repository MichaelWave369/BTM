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
 return{ws,messages,send:m=>ws.send(JSON.stringify(m)),
  async wait(predicate){for(let i=0;i<250;i++){const m=messages.find(predicate);if(m)return m;await pause();}throw Error('Expected BBS message not received');}};
}

test('three real WebSocket actors observe host-selected Plugged, forked arc, guard and authoritative victory',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-plugged-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),peers=[];
 try{
  for(let i=0;i<3;i++)peers.push(await peer(server.address.port));
  const [a,b,c]=peers;
  a.send({type:'create',nickname:'PLUGGED',mode:'beast',beastType:'plugged',arena:'no-carrier',capacity:3,limit:10,bots:0});
  const wa=await a.wait(m=>m.type==='welcome');
  b.send({type:'join',nickname:'HUNTER-ONE',code:wa.code});
  c.send({type:'join',nickname:'HUNTER-TWO',code:wa.code});
  const wb=await b.wait(m=>m.type==='welcome'),wc=await c.wait(m=>m.type==='welcome');
  for(const p of peers)p.send({type:'ready',ready:true});
  await pause();a.send({type:'start'});await pause();
  const room=server.rooms.get(wa.code),beast=room.actors.get(wa.id),
   h1=room.actors.get(wb.id),h2=room.actors.get(wc.id);
  assert.equal(room.state,'playing');
  assert.equal(room.beast.archetype,'plugged');
  assert.equal(beast.player.health,495);
  server.broadcast();
  const start=await c.wait(m=>m.type==='snapshot'&&m.state==='playing'&&m.beast?.archetype==='plugged');
  assert.equal(start.players.find(p=>p.id===wa.id).archetype,'plugged');
  assert.equal(start.roster.find(p=>p.id===wa.id).role,'beast');
  a.send({type:'input',seq:1,...neutralInput(),beastType:'crawler'});
  assert.match((await a.wait(m=>m.type==='error')).message,/Unknown protocol field/);
  assert.equal(room.beast.archetype,'plugged');
  // Fixture positions change only on the host, never through player packets.
  Object.assign(beast.player,{x:3.5,y:3.5,a:0});
  Object.assign(h1.player,{x:5.5,y:3.5,armor:0});
  Object.assign(h2.player,{x:5.5,y:4.5,armor:0});
  for(const p of room.actors.values())p.invulnerable=0;
  room.game.time=2;
  a.send({type:'input',seq:2,...neutralInput(),angle:0,weapon:5,fire:true,actions:['dash']});
  await pause();server.step();
  assert.equal(h1.player.health,72);
  assert.equal(h2.player.health,86);
  assert(room.beast.groundedUntil>room.game.time);
  const hp=beast.player.health;
  room.hurt(beast,40,h1);
  assert.equal(hp-beast.player.health,20);
  server.broadcast();
  const active=await b.wait(m=>m.type==='snapshot'&&m.beast?.guardRemaining>0);
  assert.equal(active.beast.archetype,'plugged');
  // The server keeps the sole authority to advance cooldown and grant victory.
  for(let seq=3;seq<11&&room.state==='playing';seq++){
   room.game.time+=1.7;
   a.send({type:'input',seq,...neutralInput(),angle:0,weapon:5,fire:true});
   await pause();server.step();
  }
  assert.equal(room.state,'results');
  assert.deepEqual(room.result,{winner:'beast',reason:'hunters-eliminated'});
  assert.equal(room.receipts.length,0);
  server.broadcast();
  const result=await c.wait(m=>m.type==='snapshot'&&m.state==='results');
  assert.equal(result.result.winner,'beast');
  assert.equal(result.beast.archetype,'plugged');
 }finally{
  for(const p of peers)p.ws.close();
  await server.close();await rm(dir,{recursive:true,force:true});
 }
});

test('Plugged creation is not accepted in non-Beast playlists, without creating a room',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-plugged-forged-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),a=await peer(server.address.port);
 try{
  a.send({type:'create',nickname:'WAVE',mode:'control',beastType:'plugged',arena:'no-carrier',capacity:2,limit:10,bots:0});
  assert.match((await a.wait(m=>m.type==='error')).message,/Invalid Beast archetype/);
  assert.equal(server.rooms.size,0);
 }finally{a.ws.close();await server.close();await rm(dir,{recursive:true,force:true});}
});
