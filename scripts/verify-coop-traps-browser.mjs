// Production two-browser proof: one server-owned Pit orb on a shared plate.
// No client is allowed to declare a hit, spawn a bolt or change trap phase.
import {createServer} from '../server/index.mjs';
import {STAGES} from '../src/net/simulation.js';
import {canOccupy} from '../src/core.js';
import {neutralInput} from '../src/net/protocol.js';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_NETWORK_OUTPUT||'docs/bbs-lan-clan';
await mkdir(out+'/screenshots',{recursive:true});
const saveDir=await mkdtemp(path.join(tmpdir(),'btm-shared-traps-'));
const host=await createServer({port:0,saveDir,manual:true});
const pages=[],errors=[];
let browser;
const sleep=()=>new Promise(resolve=>setTimeout(resolve,6));
async function pump(n=1){for(let i=0;i<n;i++){await sleep();host.step();}await sleep();}
try{
 browser=await chromium.launch({headless:true,args:process.env.BTM_SOFTWARE_WEBGL==='1'?
  ['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 for(const nickname of ['COOP-TRAP-ONE','COOP-TRAP-TWO']){
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const outer=await context.newPage();outer.on('pageerror',e=>errors.push(e.message));
  await outer.goto('http://127.0.0.1:'+host.address.port+'/');
  await outer.locator('#bbs-btn').click();
  await outer.waitForFunction(()=>!!document.querySelector('#bbs-portal-frame')?.contentWindow?.bbs);
  const page=outer.frames().find(f=>f.url().includes('/bbs.html?embedded=1'));
  assert(page,'BTM in-game BBS frame should remain inside the same browser');
  await page.locator('#nickname').fill(nickname);
  await page.locator('#connect-btn').click();
  await page.waitForFunction(()=>window.bbs.net.connected);
  pages.push({outer,page,context});
 }
 await pages[0].page.selectOption('#mode','coop');
 await pages[0].page.locator('#create-btn').click();
 await pages[0].page.waitForFunction(()=>!!window.bbs.net.id);
 const code=await pages[0].page.locator('#room-code').inputValue();
 await pages[1].page.locator('#room-code').fill(code);
 await pages[1].page.locator('#join-btn').click();
 await pages[1].page.waitForFunction(()=>!!window.bbs.net.id);
 await pump(3);
 for(const p of pages)await p.page.locator('#ready-btn').click();
 await pump(3);
 await pages[0].page.locator('#start-btn').click();
 await pump(5);
 const room=host.rooms.get(code);assert(room,'true authoritative server room required');
 room.stage=15;room.receipts=STAGES.slice(0,15).map((s,i)=>({stage:i+1,...s,seconds:1,relays:true,key:true,bosses:[]}));
 room.load(false);
 room.game.level.enemies=[];room.game.level.hazards=[];room.game.level.blasts=[];
 const trap=room.game.level.traps[0];assert.equal(trap.kind,'electric-orb');
 // Choose an unobstructed near-plate approach based on actual stage geometry.
 const offsets=[[-.9,0],[.9,0],[0,-.9],[0,.9]];
 const chosen=offsets.find(([dx,dy])=>
  canOccupy(room.game.level,trap.x+dx,trap.y+dy)&&
  canOccupy(room.game.level,trap.x+dx+.07,trap.y+dy+.07));
 assert(chosen,'cannot find two safe approach coordinates for the Pit plate');
 const [dx,dy]=chosen,angle=Math.atan2(-dy,-dx);
 const actors=[...room.actors.values()];
 actors.forEach((a,i)=>{Object.assign(a.player,{x:trap.x+dx+i*.07,y:trap.y+dy+i*.07,armor:0});a.invulnerable=0;});
 host.broadcast();
 for(const p of pages)await p.page.waitForFunction(revision=>window.bbs.game.revision===revision,room.revision);
 const intent={...neutralInput(),move:1,angle,sprint:true,weapon:1};
 for(const p of pages)await p.page.evaluate(m=>{window.bbs.game.resume();window.bbs.drive(m);window.bbs.net.flush();},intent);
 await pump(7);
 assert.equal(room.events.filter(e=>e.type==='pitTrapArmed').length,1,'one plate entry means one server warning');
 assert(Number.isFinite(trap.fireAt),'server schedules a real telegraph interval');
 host.broadcast();
 // WebSocket delivery is asynchronous even under a manually stepped server.
 // Await matching clocks on BOTH real clients instead of racing a page.evaluate.
 const expectedClock=Math.round(trap.fireAt*1000)/1000;
 for(const p of pages)await p.page.waitForFunction(clock=>
  Math.abs((window.bbs?.game?.level?.traps?.[0]?.fireAt??-99)-clock)<.001,
  expectedClock,{timeout:12000});
 const before=await Promise.all(pages.map(p=>p.page.evaluate(()=>({
  id:window.bbs.net.id,clock:window.bbs.game.level.traps?.[0]?.fireAt,
  revision:window.bbs.game.revision,mode:window.bbs.game.netState?.mode
 }))));
 assert(Math.abs(before[0].clock-trap.fireAt)<.001,'client A must match host quantized warning');
 assert(Math.abs(before[1].clock-trap.fireAt)<.001,'client B must match host quantized warning');
 assert(before.every(x=>x.mode==='coop'),'two real browser BBS sessions remain connected in co-op');
 for(const p of pages)await p.page.evaluate(m=>{window.bbs.drive(m);window.bbs.net.flush();},neutralInput());
 await pump(38);
 const fired=room.events.filter(e=>e.type==='pitTrapFired');
 assert.equal(fired.length,1,'the host and the two client browsers cannot duplicate an orb');
 assert.equal(fired[0].id,trap.id);
 // Capture real compositor frames with both live BBS clients in the game.
 for(let i=0;i<pages.length;i++){
  const cdp=await pages[i].context.newCDPSession(pages[i].outer);
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile(out+'/screenshots/coop-trap-client-'+i+'.png',Buffer.from(shot.data,'base64'));
  await cdp.detach();
 }
 assert.deepEqual(errors,[],'two browser clients should have no page exceptions');
 const report={passed:true,serverOwnedWarnings:1,serverOwnedOrbs:1,clientClocks:before,
  trap:trap.id,twoSeparateChromiumContexts:true,method:'Two independently connected production BBS frames use actual WebSocket movement packets to cross one Pit plate. Server fixed-step authority arms once and launches one real bolt; both frames receive the same warning clock. Chromium compositor screenshots. This is browser proof, NOT physical Quest field acceptance.'};
 await writeFile(out+'/coop-shared-trap-browser.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(e){
 await writeFile(out+'/coop-shared-trap-failure.json',JSON.stringify({error:e.message,stack:e.stack,events:errors},null,2)+'\n');throw e;
}finally{
 for(const p of pages)await p.context.close().catch(()=>{});
 await browser?.close();
 await host.close();
 await rm(saveDir,{recursive:true,force:true});
}
