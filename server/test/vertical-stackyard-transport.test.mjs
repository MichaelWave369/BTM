import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from '../index.mjs';
import {neutralInput} from '../../src/net/protocol.js';
import {STACK_HEIGHT} from '../../src/net/vertical-arena.js';

const {WebSocket}=createRequire(new URL('../package.json',import.meta.url))('ws');
const delay=()=>new Promise(resolve=>setTimeout(resolve,5));
async function peer(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 ws.on('message',data=>messages.push(JSON.parse(data)));
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),
  async wait(match){for(let i=0;i<240;i++){const m=messages.find(match);if(m)return m;await delay();}throw Error('Expected Stackyard wire message missing');}};
}

test('two independent BBS WebSockets receive stacked spawn floors and host-verified jump state',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-stackyard-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),peers=[];
 try{
  const a=await peer(server.address.port),b=await peer(server.address.port);
  peers.push(a,b);
  a.send({type:'create',nickname:'LOWER',mode:'deathmatch',arena:'stackyard',limit:10,capacity:2,bots:0});
  const wa=await a.wait(m=>m.type==='welcome');
  b.send({type:'join',nickname:'UPPER',code:wa.code});
  const wb=await b.wait(m=>m.type==='welcome');
  a.send({type:'ready',ready:true});b.send({type:'ready',ready:true});
  await delay();a.send({type:'start'});await delay();
  const r=server.rooms.get(wa.code),ground=r.actors.get(wa.id),high=r.actors.get(wb.id);
  assert.equal(r.state,'playing');
  assert.equal(r.arena,'stackyard');
  assert.equal(ground.player.height,0);
  assert.equal(high.player.height,STACK_HEIGHT);
  server.broadcast();
  const level=await a.wait(m=>m.type==='world'&&m.level?.vertical);
  assert.equal(level.level.vertical.schema,'btm.vertical-prototype/1');
  const s=await b.wait(m=>m.type==='snapshot'&&m.state==='playing'&&m.players?.find(p=>p.id===wb.id)?.height===STACK_HEIGHT);
  assert.equal(s.players.find(p=>p.id===wa.id).height,0);
  assert.equal(s.players.find(p=>p.id===wb.id).supportSurface,'upper');
  b.send({type:'input',seq:1,...neutralInput(),height:999,grounded:true});
  assert.match((await b.wait(m=>m.type==='error')).message,/Unknown protocol field/);
  assert.equal(high.player.height,STACK_HEIGHT);
  b.send({type:'input',seq:2,...neutralInput(),actions:['jump'],angle:0});
  await delay();server.step();
  assert(high.player.height>STACK_HEIGHT,'only a legal jump action changes host elevation');
  server.broadcast();
  const jumped=await a.wait(m=>m.type==='snapshot'&&m.players?.find(p=>p.id===wb.id)?.height>STACK_HEIGHT);
  assert.equal(jumped.players.find(p=>p.id===wb.id).grounded,false);
  // Host fixture: same horizontal tile, opposite floors, no hits through slab.
  Object.assign(ground.player,{x:14.5,y:12.5,height:0});
  Object.assign(high.player,{x:14.5,y:12.5,height:STACK_HEIGHT});
  assert.equal(r.targets(ground).length,0);
  assert.equal(r.targets(high).length,0);
  Object.assign(ground.player,{x:8,y:15.5});
  Object.assign(high.player,{x:10.3,y:15.5});
  assert.equal(r.targets(high).length,1,'high ground can see lower players around exposed deck edge');
  assert.equal(r.checkpoint(),null);
 }finally{
  for(const p of peers)p.ws.close();
  await server.close();await rm(dir,{recursive:true,force:true});
 }
});

test('stackyard cannot be opened as co-op, Beast or unsupported control mode',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-stackyard-guard-'));
 const server=await createServer({port:0,saveDir:dir,manual:true}),p=await peer(server.address.port);
 try{
  p.send({type:'create',nickname:'WAVE',mode:'beast',arena:'stackyard',beastType:'warden',capacity:2,limit:10,bots:0});
  assert.match((await p.wait(m=>m.type==='error')).message,/Invalid room settings/);
  assert.equal(server.rooms.size,0);
 }finally{p.ws.close();await server.close();await rm(dir,{recursive:true,force:true});}
});
