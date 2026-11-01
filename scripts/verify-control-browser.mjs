// Real BBS Chromium control-mode smoke: two players, real UI/WS intent only.
import {createServer} from '../server/index.mjs';
import {neutralInput} from '../src/net/protocol.js';
import {findRoute,distance} from '../src/core.js';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_NETWORK_OUTPUT||'docs/bbs-lan-clan';
await mkdir(out+'/screenshots',{recursive:true});
const dir=await mkdtemp(path.join(tmpdir(),'btm-control-browser-'));
const server=await createServer({port:0,saveDir:dir,manual:true});
const pages=[],errors=[],evidence=[];
let browser,room;
const pause=()=>new Promise(r=>setTimeout(r,2));
async function tick(input){
 await Promise.all(pages.map((p,i)=>p.evaluate(m=>window.bbs.drive(m),{...neutralInput(),...input[i]})));
 for(let i=0;i<3;i++){await pause();server.step();}
 await pause();
}
function steer(level,p,goal){
 const d=distance(p,goal);
 if(d<.4)return {};
 const route=findRoute(level,p,goal,{allowLocked:true});
 const point=route.length>1?route[1]:goal;
 const angle=Math.atan2(point.y-p.y,point.x-p.x);
 return {angle,move:1,sprint:true};
}
async function snap(label){
 server.broadcast();const heartbeat=setInterval(()=>server.broadcast(),125);
 try{
  for(let i=0;i<2;i++){
   const p=pages[i],session=p._capture||(p._capture=await p.context().newCDPSession(p));
   const shot=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
   const bytes=Buffer.from(shot.data||'','base64');
   assert(bytes.length>1000&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
   const file='screenshots/control-'+label+'-client-'+i+'.png';
   await writeFile(out+'/'+file,bytes);
   evidence.push({label,client:i,file});
  }
 }finally{clearInterval(heartbeat);}
}
try{
 browser=await chromium.launch({headless:true,args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 for(const nickname of ['CONTROL-CYAN','CONTROL-PINK']){
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'allow'}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const original=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>setTimeout(()=>original(f),50);});
  await p.goto('http://127.0.0.1:'+server.address.port+'/bbs.html');
  await p.locator('#nickname').fill(nickname);
  await p.locator('#connect-btn').click();
  await p.waitForFunction(()=>window.bbs?.net.connected);
  pages.push(p);
 }
 await pages[0].selectOption('#mode','control');
 await pages[0].selectOption('#arena','no-carrier');
 await pages[0].selectOption('#limit','10');
 await pages[0].locator('#create-btn').click();
 await pages[0].waitForFunction(()=>!!window.bbs.net.id);
 const code=await pages[0].locator('#room-code').inputValue();
 await pages[1].locator('#room-code').fill(code);
 await pages[1].locator('#join-btn').click();
 await pages[1].waitForFunction(()=>!!window.bbs.net.id);
 for(const p of pages){p.pid=await p.evaluate(()=>window.bbs.net.id);await p.locator('#ready-btn').click();}
 await pause();for(let i=0;i<4;i++)server.step();
 await pages[0].locator('#start-btn').click();await pause();
 for(let i=0;i<4;i++)server.step();
 room=server.rooms.get(code);
 assert.equal(room.mode,'control');assert(room.control);
 assert.notEqual(pages[0].pid,pages[1].pid);
 for(const p of pages)await p.evaluate(()=>window.bbs.resume());
 const ids=pages.map(p=>p.pid),zone=room.control.zones[0],targets=[
  {x:zone.x-.25,y:zone.y},{x:zone.x+.25,y:zone.y}
 ];
 let arrived=false;
 for(let i=0;i<440;i++){
  const actors=ids.map(id=>room.actors.get(id));
  if(actors.every((a,j)=>distance(a.player,targets[j])<.65)){arrived=true;break;}
  await tick(actors.map((a,j)=>steer(room.game.level,a.player,targets[j])));
  assert.equal(room.state,'playing','control match ended before the players reached the hill');
 }
 assert(arrived,'Two real clients could not reach the control zone');
 for(let i=0;i<15;i++)await tick([{},{}]);
 assert(room.control.contested,'two connected live players must contest the hill');
 const before={...room.teamScore};
 for(let i=0;i<12;i++)await tick([{},{}]);
 assert.deepEqual(room.teamScore,before,'contested hill must not award points');
 await snap('contested');
 const retreat={x:3.5,y:21.5};
 let retreated=false;
 for(let i=0;i<220;i++){
  const pink=room.actors.get(ids[1]);
  if(distance(pink.player,zone)>zone.radius+1){retreated=true;break;}
  await tick([{},steer(room.game.level,pink.player,retreat)]);
 }
 assert(retreated,'pink player must leave via real movement');
 // One team's genuine control points now drive the winning score.
 for(let i=0;i<400&&room.state==='playing';i++)await tick([{},{}]);
 assert.equal(room.state,'results');
 assert.equal(room.result?.reason,'control-limit');
 assert.equal(room.result?.winner,'cyan');
 assert(room.teamScore.cyan>=10&&room.teamScore.pink<10);
 await snap('winner');
 assert.deepEqual(errors,[]);
 const report={passed:true,mode:'control',arena:'no-carrier',result:room.result,
  score:room.teamScore,rotation:room.control.index,contestVerified:true,
  ids,frames:room.tick,evidence,errors,
  method:'Two real Chromium pages create a native BBS control room, ready/start, independently walk to a real capture zone through ordinary WS input, contest without earning points, withdraw one actor with real movement, earn uncontested fixed-tick server points, and finish a scored match. Browser compositor pixels are captured via DevTools. No direct world/player/score/health mutation; synthetic browser not physical Quest.'};
 await writeFile(out+'/browser-control.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(e){
 await writeFile(out+'/browser-control-failure.json',JSON.stringify({passed:false,error:e.message,stack:e.stack,room:room&&{state:room.state,time:room.game.time,score:room.teamScore,control:room.control,players:[...room.actors.values()].map(a=>({id:a.id,status:a.status,position:a.player}))},pageErrors:errors},null,2)+'\n');
 throw e;
}finally{
 for(const p of pages)await p.context().close().catch(()=>{});
 await browser?.close();
 await server.close();
 await rm(dir,{recursive:true,force:true});
}
