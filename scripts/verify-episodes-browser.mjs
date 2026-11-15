// Isolated browser tooling. The game has no Playwright runtime dependency.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {ORIGINAL_SAVE_KEY, PIT_SAVE_KEY} from '../src/campaign-storage.js';
import {episodeSaveKey} from '../src/episodes/registry.js';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.BTM_PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.BTM_EPISODE_OUTPUT || 'docs/equipment/ci/episodes';
const port = '5196', base = 'http://127.0.0.1:' + port + '/';
const episodeId = process.env.BTM_EPISODE_ID === 'synthetic-city' ? 'synthetic-city' : 'buried-network';
const episodeTitle = episodeId === 'synthetic-city' ? 'Synthetic City' : 'The Buried Network';
const firstStage = episodeId === 'synthetic-city' ? 'arrival-curfew' : 'cable-mouth';
const lastStage = episodeId === 'synthetic-city' ? 'crown-broadcast' : 'last-carrier';
const slot = episodeSaveKey(episodeId), bbs = 'mwave-bbs-settings-v1';
const oldSlots = [ORIGINAL_SAVE_KEY, PIT_SAVE_KEY, bbs];
await mkdir(output, {recursive: true});
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', port], {stdio: ['ignore', 'pipe', 'inherit']});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.once('data', resolve);
    server.once('error', reject);
    server.once('exit', code => reject(Error('Preview server quit with code ' + code)));
  });
  browser = await chromium.launch({
    headless: true, executablePath: process.env.BTM_CHROMIUM_EXECUTABLE || undefined,
    args: process.env.BTM_SOFTWARE_WEBGL === '1' ? ['--no-sandbox', '--disable-dev-shm-usage',
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []
  });
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'allow'});
  const page = await context.newPage();
  const errors = [];
  const watch = p => p.on('pageerror', error => errors.push(error.message));
  watch(page);
  await page.addInitScript(({bbs}) => {
    if (!localStorage.getItem(bbs)) localStorage.setItem(bbs, JSON.stringify({nickname: 'Local clan sentinel'}));
    localStorage.setItem('mwave-ori-settings-v1', JSON.stringify({
      controlMode: 'keyboard', reducedMotion: true, textureStyle: 'auto', music: 0, sfx: 0
    }));
  }, {bbs});
  await page.goto(base);
  const read = key => page.evaluate(key => localStorage.getItem(key), key);
  async function enter(id, label) {
    await page.locator(id).click();
    await page.waitForFunction(label => document.querySelector('#header-sector').textContent.includes(label), label);
  }
  async function home() {
    await page.keyboard.press('Escape');
    await page.locator('#quit-btn').click();
  }
  async function walkOutOfIntake() {
    await page.bringToFront();
    await page.locator('#app[data-screen="playing"]').waitFor();
    await page.locator('#game').focus();
    await page.keyboard.down('KeyW');
    try {
      // The simulation caps its time step. Wait for an actual room transition
      // so a slow software-rendered runner has time to cross the intake.
      if (episodeId === 'synthetic-city') await page.waitForTimeout(5000);
      else await page.waitForFunction(() => document.querySelector('#room-label').textContent === 'ACCESS CORRIDOR',
        undefined, {polling: 100, timeout: 60000});
    } finally {
      await page.keyboard.up('KeyW');
    }
    await home();
  }
  const choose = label => page.getByRole('button', {name: label + ' / ' + episodeTitle, exact: true}).click();
  await enter('#start-btn', 'SECTOR 01');
  await home();
  await enter('#pit-btn', 'TRIAL 1');
  await home();
  const before = await Promise.all(oldSlots.map(read));
  assert(before.every(Boolean));
  await page.locator('#episodes-btn').click();
  await page.locator('#episodes-screen').screenshot({path: output + '/episode-picker.png'});
  await choose('NEW RUN');
  await page.waitForFunction(() => document.querySelector('#header-sector').textContent.includes('STAGE 1 OF 9'));
  const initial = JSON.parse(await read(slot));
  assert.equal(initial.stageId, firstStage);
  await walkOutOfIntake();
  const walked = JSON.parse(await read(slot));
  assert(Math.hypot(walked.player.x - initial.player.x, walked.player.y - initial.player.y) > 1, 'Production keyboard input must move the episode player');
  assert.deepEqual(await Promise.all(oldSlots.map(read)), before);
  console.log('Production keyboard movement and independent save slots verified.');

  // Run the production engine and both renderers on the delivered build.
  // A separate page keeps the verification driver off the normal game UI.
  const qa = await context.newPage(), captures = [];
  watch(qa);
  await qa.goto(base + 'qa.html');
  await qa.evaluate(() => {
    document.body.style.cssText = 'margin:0;background:#0a1018';
    document.body.replaceChildren(...[['stereo', 1120, 600], ['classic', 640, 360]].map(([id, width, height]) => {
      const canvas = document.createElement('canvas');
      Object.assign(canvas, {id, width, height});
      canvas.style.display = 'block';
      return canvas;
    }));
  });
  await qa.exposeFunction('episodeCapture', async metrics => {
    const {kind, stage, eyes, shown, details, glError} = metrics;
    assert.equal(glError, 0);
    assert.equal(details.entities.dropped, 0);
    assert(details.drawCalls > 2 && details.triangles < 12000, 'Bounded batched World submission');
    assert(eyes[0] !== eyes[1] && shown.every(n => n > 100), 'Both eyes must render distinct visible geometry');
    assert(metrics.canvasClassic > 100, 'Classic Canvas must render visible geometry');
    if (kind !== 'tracked-entry') {
      const name = `stage-${String(stage).padStart(2, '0')}-${kind}`;
      await qa.locator('#stereo').screenshot({path: output + '/' + name + '-stereo.png'});
      await qa.locator('#classic').screenshot({path: output + '/' + name + '-classic.png'});
    }
    captures.push(metrics);
  });
  const played = await qa.evaluate(async episodeId => {
    const [{EpisodeDriver}, {Renderer}, {VRWorldRenderer}, {ImmersiveRig},
      {matIdentity}, {perspective}, {distance, angleDiff, lineOfSight}] = await Promise.all([
      import('./tests/episode-playthrough.js'), import('./src/renderer.js'), import('./src/vr-world-renderer.js'),
      import('./src/immersive-rig.js'), import('./src/immersive-math.js'), import('./src/vr-math.js'),
      import('./src/core.js')
    ]);
    const flat = new Renderer(document.querySelector('#classic'));
    const world = new VRWorldRenderer(document.querySelector('#stereo'));
    const rig = new ImmersiveRig(), head = matIdentity();
    head[13] = 1.65;
    const settings = {reducedMotion: true, vrQuality: 'performance', vrEyeHeight: 1.65,
      textureStyle: 'auto', textureQuality: 'enhanced'};
    const views = [-.032, .032].map((offset, index) => {
      const matrix = matIdentity();
      matrix[12] = -offset;
      matrix[13] = -1.65;
      return {viewport: {x: index * 560, y: 0, width: 560, height: 600},
        projectionMatrix: perspective(Math.PI / 2, 560 / 600), transform: {inverse: {matrix}}};
    });
    async function render(game, kind) {
      world.ensureTexturePack(game.level, settings);
      flat.ensureTexturePack(game.level, settings);
      await Promise.all([world.packPending.get(game.level.material), flat.packPending.get(game.level.material)]);
      const view = Object.create(game);
      view.player = {...game.player};
      // Tracked thumbsticks move relative to the synthetic head, while the
      // tracked hand aims independently. Use that actual heading for the replay.
      view.player.a = game.combatPose?.head.angle ?? game.player.a;
      if (kind === 'finale') view.player.a = game.lastAngle ?? game.player.a;
      view.clearCombatPose = () => {};
      view.setCombatPose = () => {};
      rig.recenter();
      rig.prepare(view, {head}, null, settings, .016, false);
      rig.fade = 0;
      const data = {game: view, settings, screen: '', communications: [], activate: () => {}};
      const details = structuredClone(world.renderWorld(views, view, rig, .016, data));
      flat.draw(view, .016, {...settings, externalMap: true});
      const gl = world.gl, pixels = new Uint8Array(1120 * 600 * 4);
      gl.readPixels(0, 0, 1120, 600, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const eyes = [0, 0], shown = [0, 0];
      for (let eye = 0; eye < 2; eye++) {
        for (let y = 0; y < 600; y += 6) for (let x = 0; x < 560; x += 6) {
          const i = (y * 1120 + x + eye * 560) * 4;
          const color = pixels[i] + pixels[i + 1] * 7 + pixels[i + 2] * 13;
          eyes[eye] = (Math.imul(eyes[eye], 31) + color) | 0;
          if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 30) shown[eye]++;
        }
      }
      const image = flat.g.getImageData(0, 0, 640, 360).data;
      let canvasClassic = 0;
      for (let i = 0; i < image.length; i += 36) if (image[i] + image[i + 1] + image[i + 2] > 30) canvasClassic++;
      await window.episodeCapture({kind, stage: game.levelIndex + 1, name: game.definition.name, eyes, shown,
        details, canvasClassic, glError: gl.getError(), surface: game.player.supportSurface ?? 'ground',
        bossPhase: game.level.enemies.find(e => e.type === 'warden' && !e.dead)?.phase ?? null});
    }

    const reports = [];
    let finalSave;
    for (const immersive of [false, true]) {
      const driver = new EpisodeDriver({immersive, episodeId}), entries = new Set(), decks = new Set();
      let finale = false;
      while (!driver.done) {
        driver.tick();
        const game = driver.game, i = game.levelIndex, player = game.player;
        if (!entries.has(i) && driver.measuredDistance >= 4) {
          entries.add(i);
          await render(game, immersive ? 'tracked-entry' : 'entry');
        }
        if (!immersive && player.supportSurface === 'upper' && !decks.has(i)) {
          decks.add(i);
          await render(game, 'deck');
        }
        const boss = game.level.enemies.find(e => e.type === 'warden' && !e.dead);
        if (!immersive && !finale && boss?.phase >= 2 && distance(player, boss) < 10 &&
          lineOfSight(game.level, player, boss) &&
          Math.abs(angleDiff(Math.atan2(boss.y - player.y, boss.x - player.x), player.a)) < .45) {
          finale = true;
          await render(game, 'finale');
        }
      }
      reports.push(driver.report());
      finalSave = driver.game.checkpoint;
    }
    world.dispose();
    return {reports, finalSave};
  }, episodeId);

  for (const report of played.reports) {
    assert(report.passed, report.error);
    assert.equal(report.results.length, 9);
    assert(report.results.every(r => r.secret && r.goldKey && r.shots > 0));
    assert.deepEqual(report.results[8].bossPhases, [1, 2, 3]);
    assert.equal(report.results[8].bossDead, true);
  }
  for (const kind of ['entry', 'tracked-entry']) assert.equal(captures.filter(c => c.kind === kind).length, 9);
  assert.equal(captures.filter(c => c.kind === 'deck' && c.surface === 'upper').length, 3);
  assert(captures.some(c => c.kind === 'finale' && c.bossPhase >= 2));
  await qa.close();
  console.log('Classic, tracked, and stereo browser proof complete for all nine stages.');

  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#episodes-btn').click();
  await choose('CONTINUE');
  await page.waitForFunction(() => document.querySelector('#header-sector').textContent.includes('STAGE 1 OF 9'));
  assert.deepEqual(JSON.parse(await read(slot)), walked);
  // Close the active run before installing the finale. Reloading from live or
  // paused gameplay intentionally writes that run's checkpoint on pagehide.
  await home();
  // Both the episode module and the actual played finale restore while disconnected.
  await page.evaluate(async ({snapshot, slot, episodeId}) => {
    const [{Game}, {EPISODES}, {writeCampaignCheckpoint}] = await Promise.all([
      import('./src/core.js'), import('./src/episodes/index.js'), import('./src/campaign-storage.js')
    ]);
    const game = new Game({episodes: EPISODES});
    game.restore(snapshot, {campaign: 'episode', episodeId});
    writeCampaignCheckpoint(localStorage, game);
    if (!localStorage.getItem(slot)) throw Error('Episode checkpoint was not written');
  }, {snapshot: played.finalSave, slot, episodeId});
  assert.equal(JSON.parse(await read(slot)).stageId, lastStage);
  await page.reload();
  assert.equal(JSON.parse(await read(slot)).episodeCleared, true);
  await page.locator('#episodes-btn').click();
  await choose('CONTINUE');
  await page.waitForFunction(() => document.querySelector('#result-title').textContent === 'EPISODE COMPLETE');
  assert.match(await page.locator('#result-copy').textContent(), episodeId === 'synthetic-city' ? /Crown Broadcast/ : /Carrier Warden/);
  await page.locator('#result-screen').screenshot({path: output + '/offline-ending.png'});
  await page.locator('#result-btn').click();
  await choose('NEW RUN');
  await page.waitForFunction(() => document.querySelector('#header-sector').textContent.includes('STAGE 1 OF 9'));
  await walkOutOfIntake();
  assert(Math.hypot(JSON.parse(await read(slot)).player.x - initial.player.x, JSON.parse(await read(slot)).player.y - initial.player.y) > 1, 'New episode run moves offline');
  assert.deepEqual(await Promise.all(oldSlots.map(read)), before);
  assert.deepEqual(errors, []);

  const report = {passed: true, browser: browser.version(), classic: played.reports[0], tracked: played.reports[1],
    captures, independentSlots: true, offlineResume: true, offlineFinale: true, offlineNewRun: true,
    method: 'Production build in Chromium, software WebGL with synthetic stereo and tracked input. Real localStorage and disconnected service-worker navigation.'};
  await writeFile(output + '/browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(episodeTitle + ': 9 Classic + 9 tracked stages, 3 upper decks and finale; ' +
    captures.length + ' stereo samples, isolated checkpoints and offline resume/restart.');
} finally {
  await browser?.close();
  server.kill();
}
