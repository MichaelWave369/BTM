// Actual production UI + live keyboard combat. Tooling is external to the game.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.BTM_PLAYWRIGHT_MODULE||'playwright');
const out=process.env.BTM_BROWSER_OUTPUT||'docs/ori-reborn',errors=[];
await mkdir(out+'/screenshots',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','--port','5180'],{stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.BTM_CHROMIUM_EXECUTABLE||undefined,args:process.env.BTM_SOFTWARE_WEBGL==='1'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('mwave-ori-settings-v1',JSON.stringify({controlMode:'keyboard',reducedMotion:true})));
 await page.goto('http://127.0.0.1:5180/');await page.locator('#start-btn').click();
 const initial=Number(await page.locator('#energy').textContent());assert.equal(initial,100);assert.match(await page.locator('#reserve').textContent(),/RES 45\/180/);
 // Fire real energy shots, then walk to/open the first door and engage the host.
 await page.keyboard.down('KeyZ');await page.waitForTimeout(1800);await page.keyboard.up('KeyZ');
 const spent=Number(await page.locator('#energy').textContent());assert(spent<initial);
 await page.waitForTimeout(500);assert.equal(Number(await page.locator('#energy').textContent()),spent,'passive energy refill');
 await page.keyboard.press('KeyR');await page.waitForTimeout(1100);
 const reloaded=Number(await page.locator('#energy').textContent()),reserve=await page.locator('#reserve').textContent();assert(reloaded>spent);assert.notEqual(reserve,'RES 45/180');
 await page.keyboard.down('KeyW');await page.waitForTimeout(2000);await page.keyboard.up('KeyW');await page.keyboard.press('KeyE');await page.waitForTimeout(500);
 await page.keyboard.down('KeyW');await page.keyboard.down('KeyZ');await page.waitForTimeout(1300);await page.keyboard.up('KeyW');await page.waitForTimeout(1200);await page.keyboard.up('KeyZ');
 await page.screenshot({path:out+'/screenshots/desktop-survival-combat.png',clip:await page.locator('#app').boundingBox()});
 await page.keyboard.press('Space');await page.waitForTimeout(100);
 const dash=await page.locator('#dash-status').textContent();assert.match(dash,/DASH|SHIELD/);
 await page.keyboard.press('Escape');await page.locator('#pause-settings').click();await page.locator('#captions').uncheck();await page.locator('#spokenDialogue').check();await page.locator('#settings-back').click();await page.locator('#resume-btn').click();
 assert(await page.locator('#dialogue').isHidden());
 await page.keyboard.press('KeyH');const log=await page.locator('#communication-log').textContent();assert(log.includes('ORI:'));assert(log.includes('RELOADING'));
 await page.screenshot({path:out+'/screenshots/communication-log.png',clip:await page.locator('#app').boundingBox()});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mwave-ori-checkpoint-v1')));assert.equal(saved.energyMode,'survival');assert(Number.isFinite(saved.player.reserve));
 assert.equal(errors.length,0,errors.join('\n'));
 const report={passed:true,browser:browser.version(),initial,spent,reloaded,reserve,dash,captionsOff:true,speechOptInFallback:true,logRetained:true,survivalCheckpoint:true,pageErrors:errors,method:'Real Chromium, production dist, real DOM controls and keyboard movement/fire/reload/dash. No simulation or HP/objective writes. Optional speech engine unavailable/device-dependent; no assertion of audible output. Desktop gameplay captures, no physical Quest.'};
 await writeFile(out+'/survival-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill();}
