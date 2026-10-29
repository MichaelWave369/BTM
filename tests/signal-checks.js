import {createLevel} from '../src/core.js';
import {signalPalette, signalFixtures, SIGNAL_QUALITY, chunkInRange} from '../src/neon-signal.js';
import {WorldScene} from '../src/world-scene.js';
import {immersiveSettings} from '../src/immersive-rig.js';
import {stepImmersive} from '../src/immersive-play.js';
import {interactionFocus} from '../src/signal-presentation.js';
import {VRWorldRenderer} from '../src/vr-world-renderer.js';
import {matIdentity} from '../src/immersive-math.js';
import {WORLD_SCALE} from '../src/spatial.js';
import {fixture, room, aimMatrix, primeWrist} from './immersive-checks.js';
const expect = (v, message = 'Assertion failed') => { if (!v) throw Error(message); };
const near = (a, b) => Math.abs(a - b) < 1e-5;
const idle = pad => Object.assign(pad, {moveForward: 0, moveStrafe: 0, turn: 0, fire: false,
 firePressed: false, pointerPressed: false, alternate: null, charge: 0, sprint: false, actions: []});

export function signalCases() { return [
 ['Twelve sector palettes are distinct, bounded and deterministic for custom fallback', () => {
  expect(new Set(Array.from({length: 12}, (_, i) => signalPalette(i).name)).size === 12);
  for (let i = 0; i < 12; i++) expect(signalPalette(i).glow.every(Number.isFinite));
  expect(signalPalette(undefined) === signalPalette(0));
 }],
 ['Decorative fixtures attach only to open cells and avoid doors and archive signs', () => {
  for (let i = 0; i < 12; i++) {
   const l = createLevel(i), fs = signalFixtures(l); expect(fs.length > 10);
   expect(JSON.stringify(fs) === JSON.stringify(signalFixtures(l)));
   for (const f of fs) {
    const x = Math.floor(f.x / WORLD_SCALE), y = Math.floor(f.z / WORLD_SCALE);
    expect(l.cells[y][x] === 0);
    expect(!l.doors[(x + f.dx) + ',' + (y + f.dz)]);
    expect(!l.signs.some(s => s.x === x + f.dx && s.y === y + f.dz));
   }
  }
 }],
 ['Distance culling retains crossing chunks and rejects distant geometry', () => {
  expect(chunkInRange({min: [-20, 0, -20], max: [20, 3, 20]}, [0, 1, 0], 1));
  expect(!chunkInRange({min: [21, 0, 21], max: [30, 3, 30]}, [0, 1, 0], 19));
  expect(chunkInRange({min: [19, 0, -1], max: [22, 3, 1]}, [0, 1, 0], 19));
 }],
 ['All sector/preset batches are finite, bounded and preserve game snapshots', () => {
  const f = fixture(), scene = new WorldScene();
  for (let i = 0; i < 12; i++) {
   f.g.loadLevel(i, false); f.rig.prepare(f.g, f.pose, f.pad, {}, .014);
   for (const [vrQuality, budget] of Object.entries(SIGNAL_QUALITY)) {
    const before = JSON.stringify(f.g.snapshot());
    const batch = scene.update(f.g, f.rig, .014, {vrQuality});
    expect(scene.counts.fixtures > 0 && scene.counts.fixtures <= budget.fixtures, i + ' ' + vrQuality);
    expect(batch.dropped === 0 && batch.length > 0);
    for (let j = 0; j < batch.length; j++) expect(Number.isFinite(batch.data[j]));
    expect(JSON.stringify(f.g.snapshot()) === before);
   }
  }
 }],
 ['Sustained event bursts remain bounded even during late-sector telegraphs', () => {
  const f = fixture(), scene = new WorldScene(); f.g.loadLevel(11, false);
  f.g.level.enemies.forEach(e => e.tell = .5);
  f.rig.prepare(f.g, f.pose, f.pad, {}, .014);
  for (let i = 0; i < 200; i++) scene.event({type: 'impact', x: f.g.player.x, y: f.g.player.y, count: 30}, f.g);
  for (let i = 0; i < 90; i++) {
   scene.update(f.g, f.rig, .014, {vrQuality: 'high'});
   expect(scene.batch.dropped === 0 && scene.effects.length <= 96);
  }
  expect(scene.effects.length === 0);
 }],
 ['Projectile trail budgets cap dense volleys without mutating simulation velocities', () => {
  const f = fixture(), scene = new WorldScene();
  f.g.projectiles = Array.from({length: 200}, (_, i) => ({x: f.g.player.x, y: f.g.player.y,
   a: i * .1, height: .8, speed: 3, vh: .2, color: '#ff6578', enemy: true}));
  const before = JSON.stringify(f.g.projectiles);
  for (const [vrQuality, q] of Object.entries(SIGNAL_QUALITY)) {
   const batch = scene.update(f.g, f.rig, .014, {vrQuality});
   expect(scene.counts.projectiles === 128 && scene.counts.trails === q.particles / 4 && !batch.dropped);
   expect(JSON.stringify(f.g.projectiles) === before);
  }
 }],
 ['Wrist capture blocks sticks, turning, fire, charge and every gameplay action', () => {
  const f = fixture(), {x, y, a, energy, ori} = f.g.player, weapon = f.g.weapon;
  f.pad.moveForward = f.pad.moveStrafe = f.pad.turn = 1;
  f.pad.fire = f.pad.firePressed = f.pad.pointerPressed = true;
  f.pad.charge = .8; f.pad.alternate = .8; f.pad.actions = ['dodge', 'ori', 'vision', 'reload', 'next', 'interact'];
  f.g.bufferedFire = {alternate: false, charge: 0, left: .15}; f.g.cooldown = .001;
  let actions = 0;
  const result = stepImmersive(f.g, {rig: f.rig, pose: f.pose, pointerTarget: () => ({action: () => actions++})}, f.pad, {}, .02);
  expect(result.uiCaptured && actions === 1 && f.g.shots === 0 && !f.g.bufferedFire && f.g.charge === 0);
  expect(near(x, f.g.player.x) && near(y, f.g.player.y) && near(a, f.g.player.a));
  expect(!f.g.shift && f.g.vent === 0 && f.g.weapon === weapon && f.g.player.ori >= ori && f.g.player.energy >= energy);
 }],
 ['Leaving a panel while holding controls cannot leak a shot or snap turn', () => {
  const f = fixture(), spatial = {rig: f.rig, pose: f.pose, pointerTarget: () => ({action: () => {}})};
  f.pad.fire = f.pad.firePressed = true; f.pad.turn = 1;
  stepImmersive(f.g, spatial, f.pad, {}, .02); spatial.pointerTarget = () => null;
  const angle = f.g.player.a;
  for (let i = 0; i < 10; i++) stepImmersive(f.g, spatial, f.pad, {}, .02);
  expect(f.g.shots === 0 && near(angle, f.g.player.a) && f.rig.uiCaptured);
  idle(f.pad); stepImmersive(f.g, spatial, f.pad, {}, .02); expect(!f.rig.uiCaptured);
  f.pad.fire = f.pad.firePressed = true; stepImmersive(f.g, spatial, f.pad, {}, .02);
  expect(f.g.shots === 1);
 }],
 ['Captured wrist controls still permit collision-safe physical head movement', () => {
  const f = fixture(), x = f.g.player.x, y = f.g.player.y;
  f.pose.head[12] += .08;
  stepImmersive(f.g, {rig: f.rig, pose: f.pose, pointerTarget: () => ({action: () => {}})}, f.pad, {}, .02);
  expect(Math.hypot(f.g.player.x - x, f.g.player.y - y) > .03 && f.g.shots === 0);
 }],
 ['Pointer testing receives current pose transforms before stick locomotion', () => {
  const f = fixture(); f.pose.leftGrip[12] -= .2; f.pad.turn = 1;
  const angle = f.g.player.a; let observed = false;
  stepImmersive(f.g, {rig: f.rig, pose: f.pose, pointerTarget: () => {
   observed = near(f.rig.leftWorld[12], f.rig.root[0] * f.pose.leftGrip[12] + f.rig.root[8] * f.pose.leftGrip[14] + f.rig.root[12]);
   return {action: () => {}};
  }}, f.pad, {}, .02);
  expect(observed && near(angle, f.g.player.a));
 }],
 ['Right glove follows grip independently of the tracked aiming ray', () => {
  const f = fixture(); f.pose.rightGrip = matIdentity();
  f.pose.rightGrip[12] = -.15; f.pose.rightGrip[13] = 1.4; f.pose.rightGrip[14] = -.2;
  f.rig.prepare(f.g, f.pose, f.pad, {}, .014);
  expect(f.rig.hasRightGrip && !near(f.rig.rightGripWorld[12], f.rig.rightWorld[12]));
  expect(near(f.rig.aim.direction.x, -f.rig.rightWorld[8]));
  f.pose.rightGrip[12] = 5; f.rig.prepare(f.g, f.pose, f.pad, {}, .014);
  expect(Math.hypot(f.rig.rightGripWorld[12] - f.rig.eye[0], f.rig.rightGripWorld[13] - f.rig.eye[1], f.rig.rightGripWorld[14] - f.rig.eye[2]) <= .851);
 }],
 ['Each weapon effect stays at the same safe muzzle as the actual tracked shot', () => {
  const f = fixture(), scene = new WorldScene(); f.g.unlocked = 6;
  for (let w = 0; w < 6; w++) {
   f.g.weapon = w; f.g.cooldown = 0; f.g.player.energy = 100;
   f.rig.prepare(f.g, f.pose, f.pad, {}, .014); f.g.shoot();
   const shot = f.g.events.filter(e => e.type === 'shot').at(-1);
   scene.update(f.g, f.rig, 0, {});
   expect(near(scene.from[0], shot.aim.origin.x * WORLD_SCALE) && near(scene.from[1], shot.aim.origin.height * WORLD_SCALE) && near(scene.from[2], shot.aim.origin.y * WORLD_SCALE));
  }
 }],
 ['Interaction focus honors relay reach, ray direction, occlusion and secret visibility', () => {
  const f = fixture(); f.g.level = {...room(), captives: [], relays: [{x: 3.5, y: 3.5}], signs: [], exit: {x: 5.5, y: 5.5}};
  f.g.player.x = 2.5; f.g.player.y = 3.5;
  let aim = {origin: {x: 2.5, y: 3.5, height: .7}, direction: {x: 1, y: 0, z: 0}};
  expect(interactionFocus(f.g, aim)?.label === 'BREAK RELAY');
  expect(!interactionFocus(f.g, {...aim, direction: {x: -1, y: 0, z: 0}}));
  f.g.level.relays = []; f.g.level.cells[3][3] = 6;
  f.g.level.doors['3,3'] = {x: 3, y: 3, type: 6, open: 0};
  expect(!interactionFocus(f.g, aim)); f.g.shift = true;
  expect(interactionFocus(f.g, aim)?.label === 'OPEN DOOR');
  f.g.level.doors['3,3'].type = 5; expect(interactionFocus(f.g, aim)?.locked);
 }],
 ['New comfort sliders sanitize values and smooth-turn speed does not affect snap angle', () => {
  const s = immersiveSettings({vrTurnSpeed: 20, vrVignetteStrength: -1});
  expect(s.vrTurnSpeed === 2 && s.vrVignetteStrength === .2);
  const f = fixture(), a = f.g.player.a; f.pad.turn = 1;
  f.rig.prepare(f.g, f.pose, f.pad, {vrTurnMode: 'smooth', vrTurnSpeed: .5}, .02);
  expect(near(f.g.player.a - a, .019));
  const b = f.g.player.a; f.rig.prepare(f.g, f.pose, f.pad, {vrTurnMode: 'snap', vrSnapAngle: 45, vrTurnSpeed: 2}, .02);
  expect(near(f.g.player.a - b, Math.PI / 4));
 }],
 ['Reduced motion steadies decorations without mutating ability timers', () => {
  const f = fixture(), scene = new WorldScene(); f.g.scanTime = 1; f.g.assistTime = .5;
  scene.update(f.g, f.rig, .014, {reducedMotion: true}); const y = scene.presentation.ori[1];
  for (let i = 0; i < 30; i++) scene.update(f.g, f.rig, .014, {reducedMotion: true});
  expect(scene.presentation.ori[1] === y && f.g.scanTime === 1 && f.g.assistTime === .5);
 }]
]; }

export async function browserSignalChecks() {
 const {WorldUI} = await import('../src/world-ui.js');
 const {createWorldAtlas} = await import('../src/world-atlas.js');
 const {makeAssets} = await import('../src/assets.js');
 const cases = signalCases().concat([
  ['Canvas panels capture blank and locked areas and invalidate missing hands', () => {
   const f = fixture(), ui = new WorldUI();
   primeWrist(ui,{game: f.g, settings: {}, activate: () => {}},f.rig);
   const p = ui.wristPanel, ray = matIdentity();
   const point = p.center.map((n, i) => n + p.up[i] * .1 + p.right[i] * p.width * .3);
   aimMatrix(ray, f.rig.eye, point.map((n, i) => n - f.rig.eye[i]));
   // interfaceTarget transforms a reference-space ray, so use identity root here.
   const rig = {...f.rig, root: matIdentity()};
   const presenter = {ui, rayWorld: matIdentity()};
   const target = VRWorldRenderer.prototype.interfaceTarget.call(presenter, {rightRay: ray}, rig, f.g,650);
   expect(target === ui.blocker && ui.cursor && rig.uiPointer && Math.hypot(...rig.uiPointer.to.map((n,i)=>n-rig.uiPointer.from[i])) > .1);
   rig.hasLeft = false;
   expect(!VRWorldRenderer.prototype.interfaceTarget.call(presenter, {rightRay: ray}, rig, f.g,650));
  }],
  ['World-only atlas art preserves Classic textures and differs by sector', () => {
   const assets = makeAssets(), before = assets.textures[1].toDataURL();
   const a = createWorldAtlas(createLevel(0), assets).toDataURL();
   const b = createWorldAtlas(createLevel(1), assets).toDataURL();
   expect(a !== b && before === assets.textures[1].toDataURL());
  }]
 ]);
 const results = [];
 for (const [name, check] of cases) {
  try { await check(); results.push({name, pass: true}); }
  catch (e) { results.push({name, pass: false, error: e.stack || e.message}); }
 }
 return {passed: results.every(r => r.pass), total: results.length, results,
  method: 'Production simulation, synthetic tracked input, actual Canvas/UI art. No physical Quest hardware.'};
}
