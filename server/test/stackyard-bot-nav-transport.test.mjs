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
async function connect(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 ws.on('message',data=>messages.push(JSON.parse(data)));
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),async wait(match){
  for(let i=0;i<240;i++){const found=messages.find(match);if(found)return found;await delay();}
  throw Error('Expected BBS bot wire proof missing');
 }};
}
test('one real browser-equivalent WebSocket sees a real Bot Pilot descend from upper Stackyard',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'btm-vertical-bot-wire-'));
 const server=await createServer({port:0,saveDir:dir,manual:true});
 let peer;
 try{
  peer=await connect(server.address.port);
  peer.send({type:'create',nickname:'HUMAN',mode:'deathmatch',arena:'stackyard',
   limit:10,capacity:2,bots:1});
  const welcome=await peer.wait(m=>m.type==='welcome');
  const room=server.rooms.get(welcome.code);
  assert(room);
  const bot=[...room.actors.values()].find(a=>a.bot);
  assert(bot?.connected);
  peer.send({type:'ready',ready:true});await delay();
  peer.send({type:'start'});await delay();
  assert.equal(room.state,'playing');
  assert.equal(bot.player.height,STACK_HEIGHT);
  server.broadcast();
  const begin=await peer.wait(m=>m.type==='snapshot'&&m.state==='playing'&&
   m.players?.some(p=>p.id===bot.id&&p.height===STACK_HEIGHT));
  assert.equal(begin.players.find(p=>p.id===bot.id).bot,true);
  assert.equal(begin.players.find(p=>p.id===welcome.id).height,0);
  // A client cannot take over another participant or request a fabricated
  // teleport. The host owns the bot's height and all its ordinary movement.
  peer.send({type:'input',seq:1,...neutralInput(),height:STACK_HEIGHT,botId:bot.id});
  assert.match((await peer.wait(m=>m.type==='error')).message,/Unknown protocol field/);
  let ramp=false,lower=false;
  for(let i=0;i<570&&room.state==='playing';i++){
   server.step();
   ramp ||= bot.player.supportSurface==='ramp';
   lower ||= ramp&&bot.player.supportSurface==='ground'&&bot.player.height<.12;
   if(i%15===0||lower)server.broadcast();
   if(lower)break;
  }
  assert(ramp,'bot physically reaches the ramp via bounded server intent');
  assert(lower,'bot reaches the opposite floor without client position writes');
  const frame=await peer.wait(m=>m.type==='snapshot'&&
   m.players?.some(p=>p.id===bot.id&&p.height<.3&&p.supportSurface==='ground'));
  assert.equal(frame.roster.find(a=>a.id===bot.id).bot,true);
  assert.equal(room.checkpoint(),null);
 }finally{
  peer?.ws.close();
  await server.close();
  await rm(dir,{recursive:true,force:true});
 }
});
