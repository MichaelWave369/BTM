// Actual production Chromium smoke for the offline shooting gallery.
// No direct Game mutations, no fake hits, no custom browser-only renderer.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_GALLERY_OUTPUT||'docs/equipment/ci/gallery';
await mkdir(out+'/screenshots',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','--port','5182'],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
const errors=[],evidence=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,
  args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:1440,height:1024}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('mwave-ori-settings-v1',JSON.stringify({controlMode:'keyboard',reducedMotion:true})));
 await page.goto('http://127.0.0.1:5182/');
 const checkpoints={
  original:'vault-isolation-original-sentinel-369',
  pit:'vault-isolation-pit-sentinel-369'
 };
 await page.evaluate(saved=>{
  localStorage.setItem('mwave-ori-checkpoint-v1',saved.original);
  localStorage.setItem('mwave-ori-pit-checkpoint-v1',saved.pit);
 },checkpoints);
 await page.locator('#gallery-btn').click();
 await page.waitForFunction(()=>document.querySelector('#objective')?.textContent.includes('CALIBRATION VAULT'));
 assert.equal(await page.locator('#overlay').isHidden(),true);
 assert.match(await page.locator('#header-sector').textContent(),/CALIBRATION VAULT/);
 assert.match(await page.locator('#weapon-name').textContent(),/BLASTER/);
 const before=await page.locator('#objective').textContent();
 assert.match(before,/0 HITS \/ 0 SHOTS/);
 const cdp=await context.newCDPSession(page);
 async function capture(name){
  const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const png=Buffer.from(data||'','base64');
  assert(png.length>2048&&png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
   'Gallery screenshot must be a nonempty real Chromium compositor PNG');
  const file=out+'/screenshots/gallery-'+name+'.png';
  await writeFile(file,png);evidence.push(file);
 }
 await capture('aim');
 // The original BTM keyboard fire path produces a real local weapon shot.
 await page.keyboard.press('KeyZ');
 await page.waitForFunction(()=>/\d+ HITS \/ [1-9]\d* SHOTS/.test(document.querySelector('#objective')?.textContent||''),null,{timeout:5000});
 const shot=await page.locator('#objective').textContent();
 await capture('after-shot');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.querySelector('#pause-screen')&&!document.querySelector('#pause-screen').hidden);
 assert.equal(await page.locator('#save-btn').isHidden(),true,'range must never offer the campaign SAVE CHECKPOINT action');
 const paused=await page.locator('#objective').textContent();
 await page.waitForTimeout(320);
 assert.equal(await page.locator('#objective').textContent(),paused,'timer must not advance when game is paused');
 await page.locator('#quit-btn').click();
 await page.waitForFunction(()=>!document.querySelector('#title-screen').hidden);
 const after=await page.evaluate(()=>({
  original:localStorage.getItem('mwave-ori-checkpoint-v1'),
  pit:localStorage.getItem('mwave-ori-pit-checkpoint-v1')
 }));
 assert.deepEqual(after,checkpoints,'practice cannot modify campaign or Pit storage');
 // Returning for another drill must start a fresh 0/0, not inherit progress.
 await page.locator('#gallery-btn').click();
 await page.waitForFunction(()=>document.querySelector('#objective')?.textContent.includes('CALIBRATION VAULT'));
 assert.match(await page.locator('#objective').textContent(),/0 HITS \/ 0 SHOTS/);
 assert.deepEqual(errors,[],'no production browser script errors');
 const report={passed:true,browser:browser.version(),initial:before,afterShot:shot,
  pausesClock:true,checkpointsBytePreserved:true,repeatDrillFresh:true,
  screenshots:evidence,errors,method:'Real production main menu, real BTM keyboard shot, paused-game clock and quit/restart flows. Full compositor PNG evidence. Local save sentinels prove both independent story slots remain byte-for-byte unchanged. Quest physical tracking remains a separate field test.'};
 await writeFile(out+'/gallery-browser.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
