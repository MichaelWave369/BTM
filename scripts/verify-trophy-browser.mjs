// Real Chromium verification of the local-first Trophy Room.
// Test data comes from validated native BTM snapshots, not invented DOM totals.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Game} from '../src/core.js';
import {ARCHIVE_RECORDS,ARCHIVE_SCHEMA,ARCHIVE_STORAGE_KEY} from '../src/archive-ledger.js';
import {GALLERY_KEY,GALLERY_SCHEMA} from '../src/shooting-gallery.js';
const {chromium}=createRequire(import.meta.url)(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_TROPHY_OUTPUT||'docs/equipment/ci/trophy';
await mkdir(out+'/screenshots',{recursive:true});
const game=new Game();game.start();
const pit=new Game();pit.startPit();
const fixtures={
 original:JSON.stringify(game.snapshot()),
 pit:JSON.stringify(pit.snapshot()),
 archive:JSON.stringify({schema:ARCHIVE_SCHEMA,ids:ARCHIVE_RECORDS.slice(0,3).map(r=>r.id)}),
 gallery:JSON.stringify({schema:GALLERY_SCHEMA,plays:1,totalShots:12,totalHits:9,
  best:{drill:'signal-60',seconds:60,shots:12,hits:9,accuracy:75,score:900}})
};
const server=spawn(process.execPath,['scripts/serve.mjs','--port','5184'],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;const errors=[],screens=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,
  args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const ctx=await browser.newContext({viewport:{width:1440,height:1080}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({original,pit,archive,gallery})=>{
  localStorage.setItem('mwave-ori-settings-v1',JSON.stringify({controlMode:'keyboard',reducedMotion:true}));
  localStorage.setItem('mwave-ori-checkpoint-v1',original);
  localStorage.setItem('mwave-ori-pit-checkpoint-v1',pit);
  localStorage.setItem('mwave-btm-human-ledger-v1',archive);
  localStorage.setItem('mwave-btm-gallery-best-v1',gallery);
 },fixtures);
 await page.goto('http://127.0.0.1:5184/');
 const cdp=await ctx.newCDPSession(page);
 async function screenshot(name){
  const capture=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const data=Buffer.from(capture.data||'','base64');
  assert(data.length>2048&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
   'Trophy image must be real Chromium compositor PNG');
  const file=out+'/screenshots/trophy-'+name+'.png';await writeFile(file,data);screens.push(file);
 }
 const keys=['mwave-ori-checkpoint-v1','mwave-ori-pit-checkpoint-v1',
  ARCHIVE_STORAGE_KEY,GALLERY_KEY];
 const before=await page.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
 await page.locator('#trophy-btn').click();
 assert.equal(await page.locator('#trophy-screen').isVisible(),true);
 assert.equal(await page.locator('#trophy-medals [role=listitem]').count(),12);
 assert.match(await page.locator('#trophy-earned').textContent(),/^3 \/ 12$/);
 const wing=await page.locator('#trophy-stat-panels').textContent();
 assert(wing.includes('1 / 12')&&wing.includes('3 / 48')&&wing.includes('900')&&wing.includes('75%'));
 const status=await page.locator('.trophy-network').textContent();
 assert(status.includes('NOT')||status.includes('Not connected'));
 assert(status.includes('not online ranks')||status.includes('not online'));
 await screenshot('cabinet');
 await page.locator('#trophy-screen').evaluate(el=>el.scrollTop=el.scrollHeight);
 await screenshot('medals');
 await page.locator('#trophy-open-ledger').click();
 assert.equal(await page.locator('#archive-screen').isVisible(),true);
 await page.locator('#archive-back').click();
 assert.equal(await page.locator('#trophy-screen').isVisible(),true,'ledger returns to cabinet');
 await page.locator('#trophy-back').click();
 assert.equal(await page.locator('#title-screen').isVisible(),true);
 let after=await page.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
 assert.deepEqual(after,before,'a Trophy Room visit must not write any save, achievement or private record');
 // Real BBS lobby should link directly into the Trophy Room on the same origin
 // without requiring a running LAN node or silently granting competitive stats.
 await page.goto('http://127.0.0.1:5184/bbs.html');
 // Exercise the visible BBS header doorway with a genuine user click, not a\n // programmatic navigation or force-click on the footer far below the fold.\n assert.equal(await page.locator('a[href="./#trophy-room"]').count(),2);\n await page.locator('#trophy-link').click();
 await page.waitForFunction(()=>!document.querySelector('#trophy-screen')?.hidden);
 assert.equal(await page.locator('#trophy-screen').isVisible(),true,'BBS doorway opens actual cabinet');
 assert.match(await page.locator('.trophy-network').textContent(),/not online ranks/);
 await page.locator('#trophy-back').click();
 assert.equal(await page.locator('#title-screen').isVisible(),true);
 // During a real paused campaign, returning from the room must remain paused.
 await page.locator('#start-btn').click();
 await page.waitForFunction(()=>document.querySelector('#objective')?.textContent.includes('BREAK CONTROL'));
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#pause-screen').isVisible(),true);
 const beforePause=await page.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
 await page.locator('#pause-trophy').click();
 assert.equal(await page.locator('#trophy-screen').isVisible(),true);
 assert.equal(await page.locator('#trophy-open-range').isHidden(),true,
  'switching drills must never silently discard a paused campaign');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#pause-screen').isVisible(),true);
 after=await page.evaluate(ks=>ks.map(k=>localStorage.getItem(k)),keys);
 assert.deepEqual(after,beforePause,'opening the trophy cabinet from pause must not save/restart');
 await page.locator('#resume-btn').click();
 assert.equal(await page.locator('#overlay').isHidden(),true);
 assert.deepEqual(errors,[],'no game page errors');
 const report={passed:true,medals:12,earned:3,wingCounts:true,privacyVerified:true,
  responsiveCabinetScreens:screens,mainAndPauseNavigation:true,bbsDoorway:true,
  savedSlotsBitwiseUnchanged:true,pageErrors:errors,
  method:'Production Chromium, real DOM and native validated campaign/Pit snapshots. Archive and gallery seeded from real schema in test-only browser fixture. Visited cabinet, collected actual compositor pixels, navigated Ledger return, paused real game and checked save bytes. No test-only gameplay overrides or fake online leaderboard.'};
 await writeFile(out+'/trophy-browser.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
