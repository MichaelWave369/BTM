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
 return {ws,messages,send:msg=>ws.send(JSON.stringify(msg)),
  async wait(predicate){for(let i=0;i<200;i++){const found=messages.find(predicate);if(found)return found;await pause();}throw Error('Expected wire message not received');}};
}

test('two actual BBS WebSockets receive server-owned Beast/Hunter roles and only honest intent changes combat',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-beast-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),connections=[];
 try{
  const a=await peer(server.address.port),b=await peer(server.address.port);
  connections.push(a,b);
  a.send({type:'create',nickname:'CRAWLER',mode:'beast',arena:'no-carrier',capacity:2,limit:10,bots:0});
  const wa=await a.wait(m=>m.type==='welcome');
  b.send({type:'join',nickname:'HUNTER',code:wa.code});
  const wb=await b.wait(m=>m.type==='welcome');
  a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});await pause();
  a.send({type:'start'});await pause();
  const room=server.rooms.get(wa.code),beast=room.actors.get(wa.id),hunter=room.actors.get(wb.id);
  assert.equal(room.state,'playing');assert.equal(room.beast.beastId,wa.id);
  assert.equal(beast.team,'cyan');assert.equal(hunter.team,'pink');
  server.broadcast();
  const snap=await b.wait(m=>m.type==='snapshot'&&m.state==='playing'&&m.beast?.beastId===wa.id);
  assert.equal(snap.beast.archetype,'crawler');
  assert.equal(snap.players.find(p=>p.id===wa.id).role,'beast');
  assert.equal(snap.players.find(p=>p.id===wb.id).role,'hunter');
  // A forged role packet is rejected at the wire, not interpreted as a transformation.
  a.send({type:'input',seq:1,...neutralInput(),role:'hunter'});
  const bad=await a.wait(m=>m.type==='error');
  assert.match(bad.message,/Unknown protocol field/);
  assert.equal(room.beast.beastId,wa.id);
  assert.equal(beast.player.health,room.beast.health);
  // Server test fixture puts the two connected actors on genuinely traversable
  // floor. Actual FIRE input still has to pass validated intent and cooldown.
  Object.assign(beast.player,{x:3.5,y:3.5,a:0});
  Object.assign(hunter.player,{x:4.55,y:3.5,armor:0});
  beast.invulnerable=hunter.invulnerable=0;
  let hp=hunter.player.health;
  for(let seq=2;seq<=5&&room.state==='playing';seq++){
   room.game.time+=1.1;
   a.send({type:'input',seq,...neutralInput(),angle:0,fire:true,weapon:5});
   await pause();server.step();
   assert(hunter.player.health<hp,'only host-accepted claw damage may reduce Hunter health');
   hp=hunter.player.health;
  }
  assert.equal(room.state,'results');assert.deepEqual(room.result,{winner:'beast',reason:'hunters-eliminated'});
  assert.equal(hunter.status,'dead');assert.equal(room.receipts.length,0);
  server.broadcast();
  const result=await a.wait(m=>m.type==='snapshot'&&m.state==='results');
  assert.equal(result.result.winner,'beast');
  assert.equal(result.result.reason,'hunters-eliminated');
 }finally{
  for(const c of connections)c.ws.close();
  await server.close();await rm(dir,{recursive:true,force:true});
 }
});

test('one real host can start Inversion against a clearly labeled server Hunter bot',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-beast-bot-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),a=await peer(server.address.port);
 try{
  a.send({type:'create',nickname:'WAVE',mode:'beast',arena:'no-carrier',capacity:2,limit:10,bots:1});
  const w=await a.wait(m=>m.type==='welcome');
  a.send({type:'ready',ready:true});await pause();a.send({type:'start'});await pause();
  const room=server.rooms.get(w.code);
  assert.equal(room.state,'playing');
  assert.equal(room.roster().filter(x=>x.bot).length,1);
  assert.equal(room.roster().find(x=>x.bot).role,'hunter');
  for(let i=0;i<10;i++)server.step();
  assert.equal(room.state,'playing');
  assert(room.snapshot(room.actors.get(w.id)).players.some(x=>x.bot&&x.role==='hunter'));
 }finally{
  a.ws.close();await server.close();await rm(dir,{recursive:true,force:true});
 }
});
