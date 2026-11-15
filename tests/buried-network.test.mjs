import test from 'node:test';
import assert from 'node:assert/strict';
import {EPISODES} from '../src/episodes/index.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {textureStyleFor} from '../src/texture-packs.js';
import {BURIED_ID, createEpisodeGame, runEpisode} from './episode-playthrough.js';

test('The Buried Network registers nine distinct, bounded native worlds', () => {
  const episode = EPISODES.get(BURIED_ID), game = createEpisodeGame(false);
  assert.equal(episode.stages.length, 9);
  assert.equal(episode.secretCount, 9);
  assert.equal(new Set(episode.stages.map(stage => stage.map.join('\n'))).size, 9);
  assert.equal(new Set(episode.stages.map(stage => stage.material)).size, 5);
  game.startEpisode(BURIED_ID);
  const counts = [];
  for (let i = 0; i < episode.stages.length; i++) {
    game.loadLevel(i, false);
    const {level, definition} = game;
    const geometry = buildLevelGeometry(level);
    counts.push(geometry.vertexCount / 3);
    assert(geometry.vertexCount > 0);
    assert.equal(textureStyleFor(level, {textureStyle: 'auto'}), definition.material);
    assert.equal(textureStyleFor(level, {textureStyle: 'retro'}), 'retro');
    assert.equal(level.signs.length, 2);
    assert.equal(Object.values(level.doors).filter(door => door.type === 6).length, 1);
    assert.equal(level.enemies.some(e => e.type === 'warden'), i === 8);
  }
  assert(Math.max(...counts) < 6000, 'Each episode mesh stays below 6,000 static triangles');
});

for (const immersive of [false, true]) {
  test(`all nine episode stages clear through ${immersive ? 'synthetic tracked' : 'Classic'} gameplay and save/resume`, () => {
    const {passed, error, results} = runEpisode({immersive});
    assert(passed, error);
    assert.equal(results.length, 9);
    const episode = EPISODES.get(BURIED_ID);
    for (const [index, result] of results.entries()) {
      const stage = episode.stages[index];
      assert.equal(result.stageId, stage.id);
      assert.equal(result.relays, stage.relays.length);
      assert.equal(result.captives, stage.captives.length);
      assert.equal(result.goldKey, true);
      assert.equal(result.secret, true);
      assert.equal(result.deckArtifact, stage.vertical ? true : null);
      assert(result.shots > 0 && result.defeated > 0);
      assert.equal(result.mode, index < 8 ? 'complete' : 'ending');
    }
    assert.deepEqual(results[8].bossPhases, [1, 2, 3]);
    assert.equal(results[8].bossDead, true);
  });
}
