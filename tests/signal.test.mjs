import test from 'node:test';
import {signalCases} from './signal-checks.js';
for (const [name, run] of signalCases()) test(name, run);

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game, SECTORS} from '../src/core.js';
import {enterPhiWadMission, leavePhiWadMission} from '../src/phi-content/runtime.js';
import {buildHostedMissionPack} from '../src/phi-content/hosted-missions.js';
import {WorldScene, QUALITY} from '../src/world-scene.js';
import {ImmersiveRig} from '../src/immersive-rig.js';
import {matIdentity} from '../src/immersive-math.js';
test('CODE BROWN geometry and all preset effects preserve custom objectives and campaign isolation', async () => {
 const entry = JSON.parse(await readFile(new URL('../public/missions/code-brown-signal-breakout.json', import.meta.url), 'utf8'));
 const g = new Game(), scene = new WorldScene(), originals = SECTORS.slice();
 enterPhiWadMission(g, buildHostedMissionPack(entry));
 try {
  const rig = new ImmersiveRig(), head = matIdentity(); head[13] = 1.65;
  rig.prepare(g, {head, rightRay: head}, null, {}, .014);
  for (const vrQuality of Object.keys(QUALITY)) {
   const before = JSON.stringify(g.snapshot()), batch = scene.update(g, rig, .014, {vrQuality});
   assert.equal(batch.dropped, 0); assert.ok(batch.length > 0);
   assert.equal(JSON.stringify(g.snapshot()), before);
   assert.equal(g.level.enemies.length, 9); assert.equal(g.level.relays.length, 2);
  }
 } finally {leavePhiWadMission(g);}
 assert.deepEqual(SECTORS, originals); assert.equal(SECTORS.length, 12);
});
