// A genuine Chromium smoke test for the standalone, no-server 12-player arena.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_NETWORK_OUTPUT||'docs/equipment/ci/network';
await mkdir(out+'/screenshots',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','--port','5187'],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,
  args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  // Deliberately crash any WebSocket attempt: solo bot play must never dial.
  window.__socketCalls=0;
  window.WebSocket=class ForbiddenOfflineSocket{constructor(){window.__socketCalls++;throw Error('Offline arena tried to open a WebSocket');}};
  localStorage.setItem('mwave-ori-checkpoint-v1','ORIGINAL-SAVE-UNTAMPERED');
  localStorage.setItem('mwave-ori-pit-checkpoint-v1','PIT-SAVE-UNTAMPERED');
 });
 await page.goto('http://127.0.0.1:5187/');
 await page.locator('#solo-bots-btn').click();
 await page.waitForURL('**/bbs.html#solo-bots',{timeout:20000});
 await page.waitForFunction(()=>window.bbs?.net?.connected,null,{timeout:20000});
 assert.equal(await page.locator('#create-btn').textContent(),'START SOLO VS BOT PILOTS');
 assert.equal(await page.locator('#server-url').isHidden(),true);
 assert.equal(await page.locator('#connect-btn').isHidden(),true);
 assert.equal(await page.locator('#bots option').count(),11);
 await page.selectOption('#bots','11');
 assert.equal(await page.locator('#capacity').inputValue(),'12');
 await page.selectOption('#mode','deathmatch');
 await page.locator('#create-btn').click();
 await page.waitForFunction(()=>window.bbs?.game?.netState?.players?.length===12,null,{timeout:35000});
 const before=await page.evaluate(()=>{
  const {net,game}=window.bbs;
  return{offline:net.offlineBots,connected:net.connected,code:net.code,mode:game.netState.mode,
   count:game.netState.players.length,bots:game.netState.players.filter(p=>p.bot).length,
   positions:game.netState.players.filter(p=>p.bot).map(p=>({id:p.id,x:p.x,y:p.y})),
   state:game.netState.state,tick:game.netState.tick,playerId:net.id,
   networkCalls:window.__socketCalls};
 });
 assert.equal(before.offline,true);assert.equal(before.connected,true);
 assert.equal(before.mode,'deathmatch');assert.equal(before.count,12);
 assert.equal(before.bots,11);assert.equal(before.networkCalls,0);
 assert.equal(before.state,'playing');
 assert.equal(before.code,'SOLOBOTS');
 assert.equal(new Set(before.positions.map(p=>p.id)).size,11);
 await page.waitForFunction(tick=>window.bbs?.game?.netState?.tick>=tick+20,before.tick,{timeout:35000});
 const after=await page.evaluate(()=>({
  tick:window.bbs.game.netState.tick,
  positions:window.bbs.game.netState.players.filter(p=>p.bot).map(p=>({id:p.id,x:p.x,y:p.y})),
  networkCalls:window.__socketCalls,
  saveOriginal:localStorage.getItem('mwave-ori-checkpoint-v1'),
  savePit:localStorage.getItem('mwave-ori-pit-checkpoint-v1')
 }));
 assert(after.positions.some((p,i)=>Math.hypot(p.x-before.positions[i].x,p.y-before.positions[i].y)>.05),
  'AI pilots must actually navigate in the local simulation');
 assert.equal(after.networkCalls,0);
 assert.equal(after.saveOriginal,'ORIGINAL-SAVE-UNTAMPERED');
 assert.equal(after.savePit,'PIT-SAVE-UNTAMPERED');
 const cdp=await context.newCDPSession(page);
 const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 const png=Buffer.from(capture.data||'','base64');
 assert(png.length>2048&&png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 await writeFile(out+'/screenshots/offline-bots-12.png',png);
 await cdp.detach();
 // Local rematch: terminate the existing worker-owned room, then pick a new mode.
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!window.bbs.game.inputEnabled);
 await page.locator('#lobby-btn').click();
 await page.waitForFunction(()=>!window.bbs.game.netState&&!window.bbs.net.id);
 await page.selectOption('#bots','3');
 await page.selectOption('#mode','control');
 await page.locator('#create-btn').click();
 await page.waitForFunction(()=>window.bbs?.game?.netState?.players?.length===4&&window.bbs.game.netState.control,null,{timeout:35000});
 const fresh=await page.evaluate(()=>({
  mode:window.bbs.game.netState.mode,count:window.bbs.game.netState.players.length,
  state:window.bbs.game.netState.state,networkCalls:window.__socketCalls
 }));
 assert.deepEqual(fresh,{mode:'control',count:4,state:'playing',networkCalls:0});
 assert.deepEqual(errors,[],'no browser script failures');
 const report={passed:true,localOnly:true,withoutServer:true,players:before.count,bots:before.bots,
  mode:before.mode,workerTickAdvanced:after.tick>before.tick,realBotNavigation:true,
  rematch:fresh,originalAndPitSavesUntouched:true,webSocketsCreated:0,
  screenshots:[out+'/screenshots/offline-bots-12.png'],browser:browser.version(),pageErrors:errors,
  method:'Production BTM main-menu click, normal Chromium navigation, local Web Worker 30Hz authority, real bot movement and compositor capture. WebSocket constructor forbidden; no Node multiplayer server, mock scores, injected actor positions, or save writes.'};
 await writeFile(out+'/offline-bots-browser.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
