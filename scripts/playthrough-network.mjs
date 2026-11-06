// Two to four actual Node WebSocket clients, one authoritative room, input-only planners.
// A manual fixed-step test clock accelerates wall time, never changes simulation dt.
import{Room}from'../src/net/simulation.js';import assert from'node:assert/strict';
import{createServer}from'../server/index.mjs';import{NetworkPlanner}from'../tests/network-playthrough.js';import{createRequire}from'node:module';import{mkdir,mkdtemp,rm,writeFile,readFile,stat}from'node:fs/promises';import{tmpdir}from'node:os';import path from'node:path';
const{WebSocket}=createRequire(new URL('../server/package.json',import.meta.url))('ws'),out=process.env.BTM_NETWORK_OUTPUT||'docs/bbs-lan-clan',limit=Number(process.env.BTM_COOP_STAGES||1);
const playerCount=Number(process.env.BTM_COOP_PLAYERS||2);
assert([2,3,4].includes(playerCount),'BTM_COOP_PLAYERS must be 2, 3 or 4');
await mkdir(out,{recursive:true});const dir=await mkdtemp(path.join(tmpdir(),'btm-coop-')),server=await createServer({port:0,saveDir:dir,manual:true});
const yieldIO=()=>new Promise(r=>setImmediate(r));const delay=()=>new Promise(r=>setTimeout(r,1));
async function peer(){const ws=new WebSocket('ws://127.0.0.1:'+server.address.port+'/ws'),p={ws,seq:0,planner:new NetworkPlanner(),events:[],messages:[],closed:null,bytesIn:0,maxFrame:0};ws.on('message',b=>{p.bytesIn+=b.byteLength;p.maxFrame=Math.max(p.maxFrame,b.byteLength);const m=JSON.parse(b);p.messages.push(m);if(p.messages.length>100)p.messages.shift();if(m.type==='world')p.init=m;if(m.type==='welcome'){p.id=m.id;p.code=m.code;p.token=m.token;p.seq=m.seq;}if(m.type==='snapshot'){p.snapshot=m;p.events.push(...m.events);}if(m.type==='error')p.error=m.message;});ws.on('close',(code,reason)=>{p.closed=code;p.closeReason=String(reason);});p.send=m=>ws.send(JSON.stringify(m));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return p;}
const peers=[];let report;
try{
 let saved;
 if(process.env.BTM_COOP_RESUME){
  saved=JSON.parse(await readFile(process.env.BTM_COOP_RESUME,'utf8'));
  assert(saved.actors.length>=playerCount,'Saved checkpoint has too few players');
  await writeFile(path.join(dir,saved.code+'.json'),JSON.stringify(saved));
 }
 for(let index=0;index<playerCount;index++){
  const nickname='NETWORK-QA-'+String.fromCharCode(65+index),p=await peer();peers.push(p);
  if(saved)p.send({type:index===0?'resume':'join',nickname,code:saved.code,token:saved.actors[index].token});
  else if(index===0)p.send({type:'create',nickname,mode:'coop',arena:'no-carrier',limit:10,capacity:4});
  else p.send({type:'join',nickname,code:peers[0].code});
  const deadline=performance.now()+5000;
  while(!p.id&&!p.error&&!p.closed&&performance.now()<deadline)await delay();
  assert(p.id,p.error||nickname+' did not receive a welcome');
 }
 const [a]=peers;
 const room=server.rooms.get(a.code);
 assert.equal(new Set(peers.map(p=>p.id)).size,playerCount);
 if(saved){if(saved.state==='cleared')a.send({type:'next'});}
 else{
  for(const p of peers)p.send({type:'ready',ready:true});
  const allReady=()=>peers.every(p=>room.actors.get(p.id)?.ready);
  const deadline=performance.now()+5000;
  while(!allReady()&&performance.now()<deadline)await delay();
  assert(allReady(),'The host did not receive every Ready');
  a.send({type:'start'});
 }
 await delay();
 let retries=0,retryByStage={},steps=0,previousStage=-1;
 const stages=saved?structuredClone(saved.receipts):[];
 while(steps<150000){
  for(const p of peers){if(p.closed)throw Error('Socket closed '+p.closed+' / '+p.closeReason);if(p.error)throw Error(p.error);if(p.snapshot?.state==='playing'&&p.init?.revision===p.snapshot.revision){const m=p.planner.intent(p.init,p.snapshot,p.id);p.send({type:'input',seq:++p.seq,...m});}}
  await yieldIO();await delay();server.step();steps++;
  if(room.stage!==previousStage){console.log('COOP STAGE',room.stage+1,room.game.definition.name);previousStage=room.stage;}
  if(room.state==='wipe'){await writeFile('/tmp/btm-coop-failed.json',JSON.stringify(room.stageStart));console.log('WIPE',room.stage+1,'at',room.game.time.toFixed(2),'goals',peers.map(p=>p.planner.goalKey));retries++;if((retryByStage[room.stage]=(retryByStage[room.stage]||0)+1)>8)throw Error('Squad wipe budget exceeded at '+(room.stage+1));a.send({type:'retry'});await delay();}
  if(room.state==='cleared'||room.state==='campaign-complete'){
   const r=room.receipts.at(-1);if(!stages.some(x=>x.stage===r.stage)){stages.push({...r,players:[...room.actors.values()].map(p=>({id:p.id,health:p.player.health,charge:p.player.energy,reserve:p.player.reserve,distance:p.feel.stats.distance,shots:p.feel.stats.shots}))});await server.saveRoom(room);const file=path.join(dir,room.code+'.json'),savedStage=JSON.parse(await readFile(file,'utf8')),restored=new Room({code:room.code,mode:'coop',capacity:4});restored.restore(savedStage);assert.equal(restored.state,'cleared');assert.equal(restored.stage,room.stage);assert.deepEqual([...restored.actors.values()].map(a=>a.player),[...room.actors.values()].map(a=>a.player));assert.deepEqual(restored.game.level.items,room.game.level.items);assert.equal((await stat(file)).mode&0o777,0o600);console.log('CLEARED',r.stage,'seconds',r.seconds.toFixed(2));}
   if(stages.length>=limit)break;a.send({type:'next'});await delay();
  }
 }
 if(stages.length!==limit)throw Error('Network traversal budget exhausted at '+(room.stage+1));
 await writeFile(process.env.BTM_COOP_CHECKPOINT||'/tmp/btm-coop-completed.json',JSON.stringify(room.checkpoint()));
 report={passed:true,stages,steps,retries,retryByStage,distinctIds:peers.map(p=>p.id),checkpointRestoreChecks:stages.length,wire:peers.map(p=>({id:p.id,bytesIn:p.bytesIn,maxFrame:p.maxFrame})),events:peers[0].events.filter(e=>['downed','revived','bossPhase','bossAttack','stageCleared','frag'].includes(e.type)),method:playerCount+' independent Node WebSocket clients with input-only planners and one authoritative SharedWorld. The harness advances the ordinary 30 Hz clock in accelerated wall time. Physical Quest acceptance is separate.'};
}catch(e){report={passed:false,error:e.message,stack:e.stack,steps:server.rooms.values().next().value?.tick,connections:[...server.clients].map(c=>({id:c.actor?.id,bad:c.bad,lastReject:c.lastReject})),stages:server.rooms.values().next().value?.receipts,state:server.rooms.values().next().value?.state,actors:[...(server.rooms.values().next().value?.actors.values()||[])].map(a=>({id:a.id,status:a.status,player:a.player,goal:peers.find(p=>p.id===a.id)?.planner.goalKey})),method:'Actual WebSocket input failure retained.'};process.exitCode=1;}
finally{await writeFile(out+'/network-playthrough.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,error:report.error,stages:report.stages?.length},null,2));for(const p of peers)p.ws.close();await server.close();await rm(dir,{recursive:true,force:true});}
