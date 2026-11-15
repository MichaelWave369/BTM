import test from 'node:test';
import assert from 'node:assert/strict';
import {EPISODES} from '../src/episodes/index.js';
import {decodeEpisodeMap, episodeSaveKey} from '../src/episodes/registry.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {textureStyleFor} from '../src/texture-packs.js';
import {createEpisodeGame, runEpisode} from './episode-playthrough.js';

const CITY = 'synthetic-city';

test('Synthetic City contains nine distinct authored districts and nine genuine hidden routes', () => {
  const episode = EPISODES.get(CITY);
  assert(episode);
  assert(EPISODES.get('buried-network'), 'Buried Network must remain installed');
  assert(EPISODES.list.length >= 2, 'Existing standalone episodes must remain installed');
  assert.equal(episode.stages.length, 9);
  assert.equal(episode.secretCount, 9);
  assert.equal(new Set(episode.stages.map(stage => stage.map.join('\n'))).size, 9);
  assert(new Set(episode.stages.map(stage => stage.material)).size >= 5);
  assert.equal(episode.stages.filter(stage => stage.vertical).length, 3);
  assert.equal(episode.stages.at(-1).enemies.filter(([type]) => type === 'warden').length, 1);
  assert.notEqual(episodeSaveKey(CITY), episodeSaveKey('buried-network'));

  const game = createEpisodeGame(false);
  game.startEpisode(CITY);
  assert.equal(game.stageCount, 9);
  for (const [index, stage] of episode.stages.entries()) {
    const grid = decodeEpisodeMap(stage.map);
    assert.equal(grid.w, 37);
    assert.equal(grid.h, 30);
    assert.equal(Object.values(grid.doors).filter(d => d.type === 5).length, 1);
    assert.equal(Object.values(grid.doors).filter(d => d.type === 6).length, 1);
    assert(stage.items.some(([type]) => type === 'artifact') || stage.vertical?.items.some(([type]) => type === 'artifact'));
    game.loadLevel(index, false);
    const world = buildLevelGeometry(game.level);
    assert(world.vertexCount > 0, 'Every city district needs renderable world geometry');
    assert.equal(textureStyleFor(game.level, {textureStyle:'auto'}), stage.material);
    assert.equal(game.level.signs.length, 2);
    assert.equal(game.level.campaign, 'episode');
    assert.equal(game.level.episodeId, CITY);
    assert.equal(game.level.stageId, stage.id);
    assert.equal(!!game.level.vertical, !!stage.vertical);
  }
});

for (const immersive of [false, true]) {
  test(`Synthetic City completes nine stages through ${immersive?'synthetic tracked':'Classic'} input and isolated checkpoints`, () => {
    const report = runEpisode({immersive, episodeId: CITY});
    assert(report.passed, report.error || 'Not all nine districts completed');
    assert.equal(report.results.length, 9);
    for (const [i, result] of report.results.entries()) {
      assert.equal(result.stageId, EPISODES.get(CITY).stages[i].id);
      assert.equal(result.mode, i === 8 ? 'ending' : 'complete');
      assert.equal(result.secret, true);
      assert.equal(result.goldKey, true);
      assert.equal(result.relays, EPISODES.get(CITY).stages[i].relays.length);
      assert.equal(result.deckArtifact, EPISODES.get(CITY).stages[i].vertical ? true : null);
      assert(result.shots > 0 && result.defeated > 0);
    }
    assert.deepEqual(report.results[8].bossPhases, [1,2,3]);
    assert.equal(report.results[8].bossDead, true);
  });
}
