// Production BBS smoke with exactly ONE real Chromium/WebSocket participant.
// Server creates normal bot actors and runs their decisions, never browser code.
import {createServer} from '../server/index.mjs';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_NETWORK_OUTPUT||'docs/bbs-lan-clan';
await mkdir(out+'/screenshots',{recursive:true});
const dir=await mkdtemp(path.join(tmpdir(),'btm-one-human-bots-'));
const server=await createServer({port:0,saveDir:dir,manual:true});
let browser,context,page,room;
const events=[],errors=[],screens=[];
const io=()=>new Promise(r=>setTimeout(r,3));
async function pump(n=3){for(let i=0;i<n;i++){server.step();await io();}}
async function png(label){
 const cdp=await context.newCDPSession(page);
 const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 const data=Buffer.from(capture.data||'','base64');
 assert(data.length>2048&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
 'Expected genuine Chromium compositor PNG');
 const file='screenshots/solo-bot-'+label+'.png';await writeFile(out+'/'+file,data);
 await cdp.detach();screens.push(file);
}
async function begin(mode){
 await page.selectOption('#mode',mode);
 await page.selectOption('#capacity','2');
 await page.selectOption('#bots','1');
 await page.locator('#create-btn').click();
 await page.waitForFunction(()=>!!window.bbs.net.id);
 await pump();
 const code=await page.locator('#room-code').inputValue();
 room=server.rooms.get(code);
 assert(room&&room.actors.size===2);
 const actor=[...room.actors.values()].find(a=>a.bot);
 const human=[...room.actors.values()].find(a=>!a.bot);
 assert(actor&&human&&actor.connected&&human.connected&&actor.ready);
 assert.equal(room.owner,human.id);
 assert.equal(room.roster().find(a=>a.bot)?.nickname,'PHI BOT 1');
 assert((await page.locator('#roster').innerText()).includes('/ BOT'));
 await page.locator('#ready-btn').click();await pump();
 await page.locator('#start-btn').click();await pump();
 assert.equal(room.state,'playing');
 await page.evaluate(()=>window.bbs.resume());
 const start={x:actor.player.x,y:actor.player.y};
 for(let i=0;i<90;i++)await pump(1);
 const moved=Math.hypot(actor.player.x-start.x,actor.player.y-start.y);
 assert(moved>.25,`Bot failed to navigate in a one-human ${mode} match: ${moved}`);
 const data={mode,botId:actor.id,humanId:human.id,host:room.owner,moved,
  botLabel:room.roster().find(a=>a.bot)?.nickname,alive:actor.status,score:{...room.teamScore},
  tick:room.tick,humans:[...room.actors.values()].filter(a=>!a.bot).length};
 events.push(data);await png(mode);
 await page.locator('#leave-btn').click();
 await page.waitForFunction(()=>!window.bbs.net.id);
 await pump();
}
try{
 browser=await chromium.launch({headless:true,args:process.env.BTM_SOFTWARE_WEBGL==='1'?
 ['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 context=await browser.newContext({viewport:{width:1240,height:900},serviceWorkers:'allow'});
 page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const native=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Map();let serial=0;window.requestAnimationFrame=cb=>{const id=++serial;const timer=setTimeout(()=>{const r=native(t=>{pending.delete(id);cb(t);});pending.set(id,{r});},50);pending.set(id,{timer});return id;};window.cancelAnimationFrame=id=>{const p=pending.get(id);if(p){clearTimeout(p.timer);if(p.r)cancel(p.r);pending.delete(id);}};});
 await page.goto('http://127.0.0.1:'+server.address.port+'/bbs.html');
 await page.locator('#nickname').fill('SOLO-ORBIT');
 await page.locator('#connect-btn').click();
 await page.waitForFunction(()=>window.bbs?.net.connected);
 await begin('deathmatch');
 await begin('coop');
 assert.equal(events.length,2);
 assert.deepEqual(errors,[]);
 const report={passed:true,realHumans:1,realBrowsers:1,botModes:events,
  screenshots:screens,errors,method:'Real production BBS GUI + one genuine Chromium/WebSocket human; optional server-owned synthetic pilots auto-ready/start, navigate by normal live inputs in competitive and co-op rooms. Fixed 30 Hz host stepping only. No browser writes to world, health, bot action or match score. Physical Quest pending.'};
 await writeFile(out+'/browser-solo-bots.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(e){
 await writeFile(out+'/browser-solo-bots-failure.json',JSON.stringify({passed:false,error:e.message,stack:e.stack,events,errors,
 room:room&&{mode:room.mode,state:room.state,roster:room.roster()}},null,2)+'\n');
 throw e;
}finally{
 await context?.close().catch(()=>{});
 await browser?.close();
 await server.close();
 await rm(dir,{recursive:true,force:true});
}
