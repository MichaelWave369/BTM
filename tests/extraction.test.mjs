import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLevel} from '../src/core.js';
import {Room} from '../src/net/simulation.js';
import {neutralInput,validateMessage,MODES} from '../src/net/protocol.js';
import {OFFLINE_ARENA_MODES} from '../src/net/offline-bots.js';
import {freshExtraction,extractionPickup,extractionDrop,advanceExtraction,extractionSnapshot,
 EXTRACTION_VAULT,EXTRACTION_PAD,EXTRACTION_SECONDS,EXTRACTION_MAX_RETRIES} from '../src/net/extraction.js';

function readyRoom(){
 const r=new Room({code:'EXTRACT7',mode:'extraction',arena:'no-carrier',capacity:4,limit:10});
 for(const [i,name] of ['Mikey','Shayne'].entries()){
  const a=r.add({id:'p'+i,nickname:name,token:String(i+1).repeat(48)});a.ready=true;
 }
 r.start('p0');
 for(const a of r.actors.values())a.invulnerable=0;
 return r;
}
test('the mission is separate, traversable, PvE-only and never a 24-stage checkpoint',()=>{
 const level=createLevel(0),state=freshExtraction(level);
 assert(MODES.includes('extraction'));
 assert(!OFFLINE_ARENA_MODES.includes('extraction'));
 assert.deepEqual(state.vault,EXTRACTION_VAULT);
 assert.deepEqual(state.pad,EXTRACTION_PAD);
 assert.equal(state.remaining,EXTRACTION_SECONDS);
 const r=readyRoom();
 assert.equal(r.competitive,false);
 assert.equal(r.game.level.enemies.length,8);
 assert.equal(r.receipts.length,0);
 assert.equal(r.stage,0);
 assert.equal(r.checkpoint(),null);
 assert.equal(r.actors.get('p0').team,'cyan');
 assert.equal(r.actors.get('p1').team,'cyan');
 assert.equal(r.snapshot(r.actors.get('p0')).extraction.carrier,null);
 assert.equal(r.game.exitReady,false);
});
test('client-authoritative package, timer, position and scores are rejected by the wire contract',()=>{
 const base={type:'create',nickname:'Mikey',mode:'extraction',arena:'no-carrier',limit:10,capacity:4,bots:0};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)));
 for(const config of [{...base,bots:1},{...base,capacity:8},{...base,arena:'kill-switch'}])
  assert.throws(()=>validateMessage(JSON.stringify(config)));
 const input={type:'input',seq:1,...neutralInput()};
 for(const forged of [{intel:'mine'},{packageOwner:'p0'},{timeLeft:500},{extractionSuccess:true},{x:4.5,y:5.5},{score:999},{win:true}]){
  assert.throws(()=>validateMessage(JSON.stringify({...input,...forged})));
 }
});
test('pickup demands a living connected actor at the real guarded vault, then drop/reclaim on defeat',()=>{
 const r=readyRoom(),a=r.actors.get('p0'),b=r.actors.get('p1');
 assert.equal(extractionPickup(r.extraction,a,r.game.level),false);
 assert.equal(r.extraction.holderId,null);
 Object.assign(a.player,EXTRACTION_VAULT);r.use(a,1/30);
 assert.equal(r.extraction.holderId,a.id);
 assert.equal(extractionPickup(r.extraction,b,r.game.level),false);
 assert.equal(r.game.level.raidNodes[0].id,'EXFIL');
 r.defeat(a);
 assert.equal(r.extraction.holderId,null);
 assert.deepEqual(r.extraction.dropped,EXTRACTION_VAULT);
 Object.assign(b.player,EXTRACTION_VAULT);r.use(b,1/30);
 assert.equal(r.extraction.holderId,b.id);
 assert.equal(r.extraction.dropped,null);
 r.disconnect(b.id);
 assert.equal(r.extraction.holderId,null);
 assert.deepEqual(r.extraction.dropped,EXTRACTION_VAULT);
});
test('two-player spatial exfil requires the actual carrier on pad continuously holding USE',()=>{
 const r=readyRoom(),[a,b]=[...r.actors.values()];
 Object.assign(a.player,EXTRACTION_VAULT);r.use(a,1/30);
 // A teammate at the pad cannot falsely extract a package elsewhere.
 Object.assign(b.player,EXTRACTION_PAD);
 for(let i=0;i<105;i++)advanceExtraction(r.extraction,[a,b],r.game.level,1/30);
 assert.equal(r.extraction.completed,false);
 assert.equal(r.extraction.channel,0);
 Object.assign(a.player,EXTRACTION_PAD);
 a.input={...neutralInput(),use:true};
 for(let i=0;i<50;i++)advanceExtraction(r.extraction,[a,b],r.game.level,1/30);
 assert(r.extraction.channel>1);
 a.input.use=false;advanceExtraction(r.extraction,[a,b],r.game.level,1/30);
 assert.equal(r.extraction.channel,0,'channel cannot accrue across interrupted attempts');
 a.input.use=true;
 let result=null;for(let i=0;i<95;i++)result=advanceExtraction(r.extraction,[a,b],r.game.level,1/30);
 assert.equal(result.success,false,'completed missions cannot award extra wins on later ticks');
 assert.equal(r.extraction.completed,true);
 assert.equal(r.extraction.holderId,a.id);
 assert.equal(r.extraction.remaining<EXTRACTION_SECONDS,true);
});
test('full Room step produces a single successful squad result with no campaign receipts',()=>{
 const r=readyRoom(),a=r.actors.get('p0'),b=r.actors.get('p1');
 r.game.level.enemies.forEach(e=>e.dead=true);
 Object.assign(a.player,EXTRACTION_VAULT);r.use(a,1/30);
 Object.assign(a.player,EXTRACTION_PAD);
 Object.assign(b.player,{x:5.5,y:20.5});
 let seq=0;
 for(let i=0;i<120&&r.state==='playing';i++){
  if(i%3===0)r.input(a,{type:'input',seq:++seq,...neutralInput(),use:true});
  r.step();
 }
 assert.equal(r.state,'results');
 assert.equal(r.result.reason,'extraction-complete');
 assert.equal(r.result.winner,'squad');
 assert.equal(r.receipts.length,0);
 assert.equal(r.snapshot(a).extraction.completed,true);
 assert.equal(r.events.filter(e=>e.type==='extractionComplete').length,1);
});
test('fixed host countdown triggers alarms and failure without spoofed clock extension',()=>{
 const level=createLevel(0),state=freshExtraction(level);
 const p={id:'p',connected:true,status:'alive',player:{x:EXTRACTION_PAD.x,y:EXTRACTION_PAD.y},input:neutralInput()};
 let alarms=0,result;
 for(let i=0;i<EXTRACTION_SECONDS*10;i++){
  result=advanceExtraction(state,[p],level,.1);if(result.alarm)alarms++;
 }
 assert.equal(alarms,4);
 assert.equal(state.remaining,0);
 assert.equal(result.failed,true);
 assert.equal(state.completed,false);
 assert.equal(extractionPickup(state,p,level),false);
});
test('alarm tick adds only bounded server-owned enemies, even if clients send no actions',()=>{
 const r=readyRoom(),n=r.game.level.enemies.length;
 r.extraction.nextAlarm=.02;r.step();
 assert.equal(r.extraction.alarms,1);
 assert(r.game.level.enemies.length>=n);
 assert(r.game.level.enemies.length<=n+2);
 assert(r.events.some(e=>e.type==='extractionAlarm'));
});
test('squad wipe permits two local fresh retries but no third or save export',()=>{
 const r=readyRoom(),a=r.actors.get('p0');
 assert.throws(()=>r.command(a,{type:'save'}));
 for(let i=0;i<EXTRACTION_MAX_RETRIES;i++){
  r.state='wipe';r.command(a,{type:'retry'});
  assert.equal(r.state,'playing');
  assert.equal(r.extraction.retries,i+1);
  assert.equal(r.extraction.holderId,null);
  assert.equal(r.extraction.remaining,EXTRACTION_SECONDS);
  assert.equal(r.receipts.length,0);
 }
 r.state='wipe';assert.throws(()=>r.command(a,{type:'retry'}));
 assert.equal(r.checkpoint(),null);
});
test('browser portal, client hints and offline PWA have the mission but local bot worker does not',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const html=read('public/bbs.html'),ui=read('src/net/bbs.js'),client=read('src/net/client.js'),build=read('scripts/build.mjs');
 assert(html.includes('value="extraction"'));
 assert(ui.includes("mode==='extraction'"));
 assert(ui.includes('WITNESS INTEL RECOVERED'));
 assert(client.includes("this.netState?.extraction"));
 assert(build.includes("'./src/net/extraction.js'"));
 assert(!OFFLINE_ARENA_MODES.includes('extraction'));
});
