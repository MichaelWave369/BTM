// Optional development tool: Playwright is supplied externally, never shipped to players.
// Build first. Set BTM_PLAYWRIGHT_MODULE / BTM_CHROMIUM_EXECUTABLE when not on PATH.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.BTM_PLAYWRIGHT_MODULE || 'playwright');
const output = 'docs/immersive-next', results = {}, errors = [];
await mkdir(output + '/screenshots', {recursive: true});
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', '5174'], {stdio: ['ignore', 'pipe', 'inherit']});
await new Promise((resolve, reject) => {server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(Error('Server exited: ' + code)));});
let browser;
try {
 browser = await chromium.launch({headless: true, executablePath: process.env.BTM_CHROMIUM_EXECUTABLE || undefined,
  args: process.env.BTM_SOFTWARE_WEBGL === '1' ? ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []});
 const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'allow'});
 const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
 const base = 'http://127.0.0.1:5174';
 async function run(url, button) {
  await page.goto(base + url); await page.locator(button).click();
  await page.waitForFunction(() => {try {const r = JSON.parse(document.querySelector('#raw').textContent); return typeof r.passed === 'boolean' || r.status === 'FAIL' || r.status === 'UNAVAILABLE';} catch {return false;}}, null, {timeout: 120000});
  return JSON.parse(await page.locator('#raw').textContent());
 }
 results.signal = await run('/immersive-next-qa.html', '#checks');
 results.webgl = await run('/immersive-next-qa.html', '#graphics');
 for (const [sector, weapon, name] of [[0,1,'wake-stereo'],[4,3,'blackout-stereo'],[11,5,'frequency-stereo']]) {
  await page.selectOption('#sector', String(sector)); await page.selectOption('#weapon', String(weapon));
  await page.locator('#preview').click();
  await page.locator('#world').screenshot({path: output + '/screenshots/' + name + '.png'});
 }
 await page.locator('#wrist').screenshot({path: output + '/screenshots/wrist.png'});
 results.immersive = await run('/immersive-qa.html', '#checks');
 results.ui = await run('/ui-qa.html', '#run');
 results.arcade = await run('/qa.html', '#xr');
 results.xbox = await run('/qa.html', '#controller');
 results.smoke = await run('/qa.html', '#smoke');
 // An actual service worker reload in a disconnected Chromium context.
 await page.goto(base + '/');
 await page.evaluate(async () => {await navigator.serviceWorker.ready;}); await page.reload();
 await context.setOffline(true); await page.reload();
 await page.waitForFunction(() => document.getElementById('start-btn') && !document.getElementById('start-btn').disabled);
 const offline = await page.evaluate(() => ({controlled: !!navigator.serviceWorker.controller,
  title: document.title, scripts: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')).length}));
 await page.locator('#codebrown-btn').click();
 await page.waitForFunction(() => document.body.classList.contains('playing'));
 offline.codeBrownPlayable = await page.locator('#objective').textContent().then(Boolean);
 results.offline = {passed: offline.controlled && offline.codeBrownPlayable && offline.scripts > 0, ...offline};
 results.runtime = {browser: browser.version(), softwareWebGL: process.env.BTM_SOFTWARE_WEBGL === '1', node: process.version,
  method: 'Local production build in real Chromium; synthetic XR poses, actual Canvas/WebGL and offline worker. No physical XR/haptics/compositor or comfort validation.'};
 results.pageErrors = errors;
 results.passed = errors.length === 0 && ['signal','webgl','immersive','ui','arcade','xbox','smoke','offline'].every(k => results[k].passed);
 await writeFile(output + '/browser-results.json', JSON.stringify(results, null, 2) + '\n');
 console.log(JSON.stringify({passed: results.passed, browser: results.runtime.browser, groups: Object.fromEntries(['signal','webgl','immersive','ui','arcade','xbox','smoke','offline'].map(k => [k, {passed: results[k].passed, total: results[k].total}]))}, null, 2));
 if (!results.passed) process.exitCode = 1;
} finally {await browser?.close(); server.kill();}
