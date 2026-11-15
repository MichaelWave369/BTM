import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, SECTORS} from '../src/core.js';
import {PIT_STAGES} from '../src/pit.js';
import {writeCampaignCheckpoint, ORIGINAL_SAVE_KEY, PIT_SAVE_KEY} from '../src/campaign-storage.js';
import {createEpisodeRegistry, decodeEpisodeMap, episodeSaveKey} from '../src/episodes/registry.js';

const stage = {
  id: 'test-vault', name: 'TEST VAULT', tag: 'TEST', subtitle: 'Test transmission.',
  material: 'industrial', palette: ['#d3b16b', '#50d7ff'],
  map: [
    '###########',
    '#.....#...#',
    '#.....#...#',
    '#.....$...#',
    '#.....#...#',
    '###########',
    '###########'
  ],
  spawn: {x: 1.5, y: 3.5, a: 0}, relays: [[3.5, 3.5]], key: [4.5, 3.5], exit: [8.5, 3.5],
  enemies: [], captives: [], items: [], rooms: [], theme: {rooms: [], props: [], signs: []}
};
const a = {id: 'test-a', revision: 1, title: 'Test A', summary: 'Test episode.', ending: 'Test ending.',
  stages: [stage, {...stage, id: 'last-vault'}]};
const b = {...a, id: 'test-b', title: 'Test B'};
const episodes = createEpisodeRegistry([a, b]);
const newGame = () => new Game({episodes});

function playVault(game) {
  assert.equal(game.exitReady, false);
  assert.equal(game.complete(), false);
  assert.equal(game.objective, 'BREAK CONTROL RELAYS 0/1');
  for (let i = 0; i < 12; i++) game.update(.025, {forward: true});
  game.interact();
  assert.equal(game.objective, 'FIND THE GOLDEN ACCESS KEY');
  for (let i = 0; i < 44; i++) game.update(.025, {forward: true});
  assert.equal(game.player.key, true);
  for (let i = 0; i < 20; i++) game.update(.025, {forward: true});
  game.interact();
  for (let i = 0; i < 120 && game.mode === 'playing'; i++) game.update(.025, {forward: true});
}

test('registry validates immutable IDs, rectangular maps, door axes, and key order', () => {
  assert.equal(episodes.list.length, 2);
  assert.throws(() => createEpisodeRegistry([a, a]), /duplicate episode/);
  assert.throws(() => createEpisodeRegistry([{...a, stages: [stage, stage]}]), /Duplicate episode stage/);
  assert.throws(() => createEpisodeRegistry([{...a, id: '../invalid'}]), /Invalid episode ID/);
  assert.throws(() => createEpisodeRegistry([{...a, stages: [{...stage, key: [8.5, 3.5]}]}]), /Gold key requires itself/);
  assert.throws(() => decodeEpisodeMap([...stage.map.slice(0, -1), '##########.']), /solid perimeter/);
  const badDoorAxis = stage.map.map(row => row === '#.....#...#' ? '#.........#' : row);
  assert.throws(() => decodeEpisodeMap(badDoorAxis), /clear axis/);
  assert.throws(() => episodes.get(a.id).stages[0].map.push('bad'), TypeError);
});

test('episode stages carry resources, restore cleared stages, and end at their own length', () => {
  const game = newGame();
  assert.throws(() => game.startEpisode('missing'), /Unknown episode/);
  game.startEpisode(a.id);
  assert.equal(game.stageCount, 2);
  assert.equal(game.level.w, 11);
  assert.equal(game.level.h, 7);
  playVault(game);
  assert.equal(game.mode, 'complete');
  const continued = newGame();
  continued.restore(game.snapshot(), {campaign: 'episode', episodeId: a.id});
  assert.equal(continued.mode, 'complete');
  assert.equal(continued.definition.id, 'test-vault');
  const charge = continued.player.energy, reserve = continued.player.reserve;
  continued.next();
  assert.equal(continued.definition.id, 'last-vault');
  assert.equal(continued.player.energy, charge);
  assert.equal(continued.player.reserve, reserve);
  playVault(continued);
  assert.equal(continued.mode, 'ending');
  assert.equal(continued.continueBeyond(), false);
  const ending = newGame();
  ending.restore(continued.snapshot(), {campaign: 'episode', episodeId: a.id});
  assert.equal(ending.mode, 'ending');
  ending.next();
  assert.equal(ending.levelIndex, 1);
  ending.startPit();
  assert.equal(ending.stageCount, 12);
  assert.equal(ending.episode, null);
});

test('writes and retries stay inside the matching episode slot', () => {
  const slots = new Map();
  const storage = {setItem: (key, value) => slots.set(key, value)};
  const game = newGame();
  game.start();
  writeCampaignCheckpoint(storage, game);
  game.startPit();
  writeCampaignCheckpoint(storage, game);
  slots.set('mwave-bbs-settings-v1', '{"nickname":"test"}');
  const previous = [...slots];
  game.startEpisode(a.id);
  const entry = game.snapshot();
  writeCampaignCheckpoint(storage, game);
  game.damagePlayer(500);
  assert.equal(game.mode, 'dead');
  assert.equal(writeCampaignCheckpoint(storage, game), null);
  game.retry();
  assert.equal(game.mode, 'playing');
  assert.equal(game.definition.id, entry.stageId);
  game.startEpisode(b.id);
  const second = game.snapshot();
  writeCampaignCheckpoint(storage, game);
  assert.throws(() => game.restore(entry, {campaign: 'episode', episodeId: b.id}), /different campaign or episode/);
  assert.throws(() => game.restore(second, {campaign: 'pit'}), /different campaign/);
  assert.throws(() => game.restore({...second, stageId: 'missing'}), /installed stage/);
  assert.throws(() => game.restore({...second, episodeRevision: 2}), /installed stage/);
  assert.throws(() => game.restore({...second, episodeCleared: true}), /installed stage/);
  const corrupt = structuredClone(second);
  corrupt.level.cells[0][0] = 0;
  assert.throws(() => game.restore(corrupt), /installed stage/);
  game.checkpoint = entry;
  assert.throws(() => writeCampaignCheckpoint(storage, game), /namespace mismatch/);
  for (const [key, value] of previous) assert.equal(slots.get(key), value);
  for (const id of [a.id, b.id]) assert.equal(JSON.parse(slots.get(episodeSaveKey(id))).episodeId, id);
  game.restore(JSON.parse(slots.get(ORIGINAL_SAVE_KEY)), {campaign: 'original'});
  assert.equal(game.episode, null);
  assert.equal(game.definition, SECTORS[0]);
  game.restore(JSON.parse(slots.get(PIT_SAVE_KEY)), {campaign: 'pit'});
  assert.equal(game.definition, PIT_STAGES[0]);
  assert.equal(SECTORS.length, 12);
  assert.equal(PIT_STAGES.length, 12);
});
