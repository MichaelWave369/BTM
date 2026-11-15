// External Playwright only; no runtime dependencies or fake completion writes.
import{createRequire}from'node:module';import{spawn}from'node:child_process';import{mkdir,writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.BTM_PLAYWRIGHT_MODULE||'playwright'),out=process.env.BTM_PIT_OUTPUT||'docs/pit-of-despair';await mkdir(out+'/screenshots',{recursive:true});const server=spawn(process.execPath,['scripts/serve.mjs','--port','5184'],{stdio:['ignore','pipe','inherit']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'allow'}),page=await context.newPage(),errors=[],captures=[];page.setDefaultTimeout(45000);page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await page.addInitScript(()=>localStorage.setItem('mwave-ori-settings-v1',JSON.stringify({controlMode:'keyboard',reducedMotion:true})));
 await page.goto('http://127.0.0.1:5184/');await page.locator('#start-btn').click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mwave-ori-checkpoint-v1')).version),1);
 await page.keyboard.press('Escape');await page.locator('#quit-btn').click();const original=await page.evaluate(()=>localStorage.getItem('mwave-ori-checkpoint-v1'));await page.locator('#app').screenshot({path:out+'/screenshots/menu.png'});await page.locator('#pit-btn').click();await page.waitForFunction(()=>document.querySelector('#header-sector').textContent.startsWith('PIT /'));
 await page.keyboard.press('KeyZ');await page.keyboard.press('KeyR');await page.waitForTimeout(1100);await page.locator('#app').screenshot({path:out+'/screenshots/menu-survival.png'});
 const pitInitial=await page.evaluate(()=>JSON.parse(localStorage.getItem('mwave-ori-pit-checkpoint-v1')));assert.equal(pitInitial.schema,'btm.pit/1');assert.equal(pitInitial.energyMode,'survival');assert.equal(await page.evaluate(()=>localStorage.getItem('mwave-ori-checkpoint-v1')),original);
 await page.keyboard.press('Escape');await page.locator('#quit-btn').click();await page.locator('#continue-pit-btn').click();await page.waitForFunction(()=>document.querySelector('#header-sector').textContent.startsWith('PIT /'));
 await page.goto('http://127.0.0.1:5184/pit-qa.html');await page.waitForFunction(()=>typeof window.runPit==='function');
 await page.exposeFunction('capturePit',async(kind,stage,immersive,metrics)=>{
  assert.equal(metrics.campaign,'pit');assert.equal(metrics.glError,0);assert.equal(metrics.stats.entities.dropped,0);assert(metrics.leftHash!==metrics.rightHash&&metrics.lit>100);
  if(!immersive){const name=kind==='boss'?'boss-'+String(stage).padStart(2,'0'):'trial-'+String(stage).padStart(2,'0');await page.locator('#world').screenshot({path:out+'/screenshots/'+name+'-stereo.png'});await page.locator('#classic').screenshot({path:out+'/screenshots/'+name+'-classic.png'});}
  captures.push({kind,immersive,...metrics});console.log((immersive?'TRACKED':'CLASSIC')+' '+kind+' '+stage);
 });
 async function campaign(immersive){let timer;try{return await Promise.race([page.evaluate(value=>window.runPit(value),immersive),new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('Pit browser campaign exceeded four-minute watchdog')),240000);})]);}finally{clearTimeout(timer);}}
 const classic=await campaign(false),immersive=await campaign(true);assert(classic.passed,classic.error);assert(immersive.passed,immersive.error);assert.equal(classic.results.length,12);assert.equal(immersive.results.length,12);assert.equal(captures.filter(c=>c.kind==='boss'&&!c.immersive).length,4,'Four visible boss combat captures required');
 // Store the actual fully played ending through the same public save adapter.
 await page.evaluate(async()=>{const m=await import('./src/campaign-storage.js');m.writeCampaignCheckpoint(localStorage,window.playedPit.game);});
 assert.equal(await page.evaluate(()=>localStorage.getItem('mwave-ori-checkpoint-v1')),original);
 await page.goto('http://127.0.0.1:5184/');await page.locator('#continue-pit-btn').click();await page.waitForFunction(()=>document.querySelector('#result-copy').textContent.startsWith('Twelve trials.'));assert.equal(await page.locator('#result-btn').textContent(),'START ANOTHER PIT RUN');await page.locator('#app').screenshot({path:out+'/screenshots/ending.png'});
 await page.locator('#result-home').click();await page.locator('#continue-btn').click();await page.waitForFunction(()=>document.querySelector('#header-sector').textContent.includes('SECTOR 01'));
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mwave-ori-pit-checkpoint-v1')));assert.equal(stored.pitRecord.length,12);assert(stored.pitCleared);
 // An active registration is not necessarily controlling this tab yet. The
 // offline Pit reload must run under a controlling worker with a cached shell.
 // Preserve the real, fully played checkpoint and all original storage bytes.
 // A clean browser context prevents retained multi-stage WebGL/Canvas resources
 // from contaminating the separate cold offline boot check.
 const storedState=await context.storageState();
 await context.close();
 const offlineContext=await browser.newContext({
   viewport:{width:1440,height:1000},serviceWorkers:'allow',storageState:storedState
 });
 const offlinePage=await offlineContext.newPage();
 offlinePage.setDefaultTimeout(45000);
 offlinePage.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const base='http://127.0.0.1:5184/';
 await offlinePage.goto(base,{waitUntil:'domcontentloaded'});
 // Unlike navigator.serviceWorker.ready, controller confirms this particular
 // page is intercepted. Also require real, populated mandatory cached assets.
 await offlinePage.waitForFunction(()=>navigator.serviceWorker?.controller?.state==='activated');
 await offlinePage.waitForFunction(async()=>{
   const shell=await caches.match(new URL('./',location.href).href);
   const html=await caches.match(new URL('./index.html',location.href).href);
   const main=await caches.match(new URL('./src/main.js',location.href).href);
   return !!shell?.ok&&!!html?.ok&&!!main?.ok;
 });
 assert.equal(await offlinePage.locator('#continue-pit-btn').count(),1,'Cold online Pit continue control missing');
 const pitBytes=await offlinePage.evaluate(()=>localStorage.getItem('mwave-ori-pit-checkpoint-v1'));
 assert.equal(JSON.parse(pitBytes).pitRecord.length,12);
 assert.equal(await offlinePage.evaluate(()=>localStorage.getItem('mwave-ori-checkpoint-v1')),original);
 await offlineContext.setOffline(true);
 const offlineResponse=await offlinePage.reload({waitUntil:'domcontentloaded',timeout:45000});
 assert(offlineResponse?.ok(), 'Pit offline navigation must return the cached game shell');
 assert.equal(await offlinePage.locator('#continue-pit-btn').count(),1,'Pit continue control missing after disconnected reload');
 assert.equal(await offlinePage.evaluate(()=>localStorage.getItem('mwave-ori-pit-checkpoint-v1')),pitBytes,'Offline reload changed the earned Pit checkpoint');
 await offlinePage.locator('#continue-pit-btn').click();await offlinePage.waitForFunction(()=>document.querySelector('#result-copy').textContent.startsWith('Twelve trials.'));await offlinePage.locator('#result-btn').click();await offlinePage.waitForFunction(()=>document.querySelector('#header-sector').textContent.startsWith('PIT /'));assert.equal(await offlinePage.evaluate(()=>localStorage.getItem('mwave-ori-checkpoint-v1')),original,'Original save changed during offline Pit retry');assert.equal(errors.length,0,errors.join('\n'));await offlineContext.close();
 const report={passed:true,browser:browser.version(),method:'Production dist in real Chromium. Actual Game driver movement/combat/loot/bosses/progression in Classic and tracked adapter, native Canvas/WebGL captures with synthetic stereo, real DOM mode/save/continue/ending/original-continue checks and disconnected Pit restart. Exact aim/map knowledge; no physical Quest/human balance validation.',classic,immersive,captures,originalSlotPreserved:true,endingResumed:true,offlinePitPlayable:true,pageErrors:errors};await writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,classic:classic.passed,immersive:immersive.passed,captures:captures.length,originalSlotPreserved:true,offlinePitPlayable:true,pageErrors:errors},null,2));
}finally{await browser?.close();server.kill();}
