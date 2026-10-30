import test from 'node:test';
import assert from 'node:assert/strict';
import {detectEngine, selectSkills, routeTask, validateSkills, skillPath} from '../scripts/route-agent-skills.mjs';

const names = text => selectSkills(text).map(skill => skill.name);

test('real BTM fingerprint is native custom WebXR, not a generic engine', async () => {
  assert.equal(await detectEngine(), 'btm-native-webxr');
  assert.equal(await detectEngine('/an/absent/project'), 'unknown');
  assert.deepEqual(selectSkills('shoot', 'unknown'), []);
});

test('routing is deterministic, ordered, and starts with local authority', () => {
  assert.deepEqual(names('Fix Quest diagonal turning and wrist selection'), [
    'btm-router', 'btm-quest3-input', 'btm-genewrist', 'input-systems'
  ]);
  assert.deepEqual(names('Improve enemy weapon recoil in our FPS'), ['btm-router', 'fps-shooter']);
  assert.deepEqual(names('Profile WebXR stutter and draw calls'), [
    'btm-router', 'btm-xr-comfort', 'performance-optimization'
  ]);
  assert.deepEqual(names('Review Gen.E.Wrist realm atlas travel'), ['btm-router', 'btm-genewrist']);
  assert.deepEqual(names('Update documentation'), ['btm-router']);
});

test('loaded content remains local, finite and scoped to selected skills', async () => {
  const result = await routeTask('Quest controllers', {load:true});
  assert.equal(result.engine, 'btm-native-webxr');
  assert.equal(result.contents.length, result.skills.length);
  assert(result.contents.some(item => item.name === 'btm-quest3-input'));
  assert(result.contents.every(item => item.content.startsWith('---\n')));
  assert(!result.skills.some(item => item.path.includes('..')));
});

test('all seven installed skills pass metadata checks and safe paths', async () => {
  const check = await validateSkills();
  assert.deepEqual(check, {ok:true, count:7, missing:[]});
  assert.throws(() => skillPath('../secrets'), RangeError);
  assert.throws(() => selectSkills(null), TypeError);
});
