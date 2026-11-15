import {canOccupy, findRoute} from '../collision.js';
import {ACCESS_COLORS} from '../key-access.js';
import {STACK_CEILING, STACK_HEIGHT} from '../net/vertical-arena.js';
import {rampDoorClearance} from '../solo-vertical.js';
import {TEXTURE_PACKS} from '../texture-packs.js';

export const EPISODE_SCHEMA = 'btm.episode/1';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WALL = {'.': 0, '#': 1, '2': 2, '3': 3, '+': 4, '$': 5, '?': 6, r: 4, b: 4, g: 4};
const LOCK = {r: 'red', b: 'blue', g: 'green'};
const ENEMIES = ['plugged', 'repeater', 'enforcer', 'crawler', 'warden'];
const ITEMS = ['health', 'energy', 'armor', 'artifact', ...ACCESS_COLORS.map(color => 'key:' + color)];
const at = ([x, y]) => ({x, y});
const cell = (level, x, y) => level.cells[Math.floor(y)]?.[Math.floor(x)];
const assert = (condition, message) => { if (!condition) throw Error(message); };

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function episodeSaveKey(id) {
  assert(typeof id === 'string' && ID.test(id), 'Invalid episode ID');
  return 'mwave-ori-episode-' + id + '-checkpoint-v1';
}

// ASCII layouts compile to the same tile, door and collision data as existing BTM maps.
export function decodeEpisodeMap(map) {
  const h = map?.length, w = map?.[0]?.length;
  assert(Array.isArray(map) && w >= 7 && w <= 40 && h >= 7 && h <= 32, 'Unsupported episode map dimensions');
  const doors = {};
  const cells = map.map((row, y) => {
    assert(typeof row === 'string' && row.length === w, 'Episode map rows must have equal width');
    return [...row].map((symbol, x) => {
      assert(Object.hasOwn(WALL, symbol), 'Unknown episode tile ' + symbol);
      const type = WALL[symbol];
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        assert(type > 0 && type < 4, 'Episode map must have a solid perimeter');
      }
      if (type >= 4) doors[x + ',' + y] = {x, y, type, open: 0, target: 0, ...(LOCK[symbol] ? {lockColor: LOCK[symbol]} : {})};
      return type;
    });
  });
  for (const {x, y} of Object.values(doors)) {
    const north = cells[y - 1][x] === 0, south = cells[y + 1][x] === 0;
    const west = cells[y][x - 1] === 0, east = cells[y][x + 1] === 0;
    assert(north && south && !west && !east || west && east && !north && !south,
      'A door needs one clear axis at ' + x + ',' + y);
  }
  return {w, h, cells, doors};
}

export function episodeVertical(level, layout) {
  const {upper, ramp} = layout;
  for (const rect of [upper, ramp]) {
    assert([rect.x0, rect.x1, rect.y0, rect.y1].every(Number.isInteger) &&
      rect.x0 > 0 && rect.x1 < level.w && rect.y0 > 0 && rect.y1 < level.h &&
      rect.x1 > rect.x0 && rect.y1 > rect.y0, 'Invalid episode deck bounds');
    for (let y = rect.y0; y < rect.y1; y++) for (let x = rect.x0; x < rect.x1; x++) {
      assert(cell(level, x, y) === 0, 'Episode deck crosses a wall or door');
    }
  }
  assert(upper.x0 === ramp.x1 && ramp.x1 - ramp.x0 >= 3 && ramp.y0 >= upper.y0 &&
    ramp.y1 <= upper.y1 && rampDoorClearance(level, ramp), 'Episode ramp needs a clear deck connection');
  for (let y = ramp.y0; y < ramp.y1; y++) {
    assert(cell(level, ramp.x0 - 1, y) === 0 && cell(level, ramp.x0 - 2, y) === 0, 'Episode ramp needs a clear approach');
  }
  return {schema: 'btm.vertical-prototype/1', ceiling: STACK_CEILING, upper: {...upper, height: STACK_HEIGHT}, ramp: {...ramp}};
}

function validateStage(stage) {
  assert(ID.test(stage.id ?? '') && typeof stage.name === 'string' && stage.name &&
    typeof stage.subtitle === 'string' && typeof stage.tag === 'string', 'Invalid episode stage metadata');
  assert(Object.hasOwn(TEXTURE_PACKS, stage.material) && Array.isArray(stage.palette) &&
    stage.palette.length === 2 && stage.palette.every(color => /^#[0-9a-f]{6}$/i.test(color)), 'Invalid episode material or palette');
  const level = decodeEpisodeMap(stage.map);
  assert(Array.isArray(stage.relays) && stage.relays.length >= 1 && stage.relays.length <= 4, 'Episode stage needs 1–4 relays');
  assert(stage.enemies.length <= 18 && stage.enemies.every(([type]) => ENEMIES.includes(type)), 'Invalid episode enemy roster');
  assert(stage.items.length <= 28 && stage.items.every(([type]) => ITEMS.includes(type)), 'Invalid episode supply roster');
  assert(!stage.bossName || stage.enemies.filter(([type]) => type === 'warden').length === 1, 'Named boss needs one Warden');
  assert(stage.rooms.length <= 16 && stage.theme.rooms.length === stage.rooms.length &&
    stage.theme.props.length <= 12 && stage.theme.signs.length <= 8, 'Invalid episode landmark budget');
  assert(stage.theme.props.every(([type, x, y]) => ['pod', 'speaker', 'console', 'lamp'].includes(type) && cell(level, x, y) === 0) &&
    stage.theme.signs.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y) &&
      [1, 2, 3].includes(cell(level, x, y))), 'Episode props need floor and signs need walls');
  const ground = [...stage.relays, ...stage.captives, stage.key, stage.exit,
    ...stage.enemies.map(([, x, y]) => [x, y]), ...stage.items.map(([, x, y]) => [x, y])];
  const {spawn} = stage;
  assert(Number.isFinite(spawn.a) && ground.concat([[spawn.x, spawn.y]]).every(([x, y]) =>
    [x, y].every(Number.isFinite) && canOccupy(level, x, y)), 'Episode spawn, objective, enemy or pickup overlaps a wall');

  // Unlock colored doors only after finding their keys. The gold key and all
  // required objectives must be reachable without opening a secret or climbing.
  const keys = {};
  const accessible = (point, opts) => findRoute(level, spawn, point, {keys, ...opts}).length > 0;
  for (let pass = 0; pass < ACCESS_COLORS.length; pass++) {
    for (const [type, x, y] of stage.items) {
      if (type.startsWith('key:') && accessible({x, y})) keys[type.slice(4)] = true;
    }
  }
  assert(accessible(at(stage.key)), 'Gold key requires itself or a secret');
  const required = [...stage.relays, stage.exit, ...stage.enemies.filter(([type]) => type === 'warden').map(([, x, y]) => [x, y])];
  assert(required.every(p => accessible(at(p), {allowLocked: true})), 'Unreachable episode objective');
  assert(ground.every(p => accessible(at(p), {allowLocked: true, secrets: true})), 'Unreachable episode placement');
  assert(Object.values(level.doors).filter(d => d.type === 6).length <= 1, 'Use one secret cache per stage');

  if (stage.vertical) {
    const vertical = episodeVertical(level, stage.vertical);
    const {ramp, upper} = vertical;
    const inRamp = ([x, y]) => x >= ramp.x0 && x < ramp.x1 && y >= ramp.y0 && y < ramp.y1;
    assert(!ground.concat([[spawn.x, spawn.y]]).some(inRamp), 'Episode ramp overlaps a ground placement');
    assert(accessible({x: ramp.x0 - .5, y: ramp.y0 + .5}, {allowLocked: true}), 'Unreachable episode ramp');
    const upperItems = stage.vertical.items;
    assert(upperItems.length > 0 && upperItems.length <= 4 && upperItems.every(([type, x, y]) =>
      ITEMS.includes(type) && !type.startsWith('key:') && x >= upper.x0 + .2 && x <= upper.x1 - .2 &&
      y >= upper.y0 + .2 && y <= upper.y1 - .2), 'Episode deck needs reachable optional items');
  }
}

export function createEpisodeRegistry(entries) {
  const episodes = new Map();
  for (const input of entries) {
    const episode = structuredClone(input);
    episodeSaveKey(episode.id);
    assert(!episodes.has(episode.id) && typeof episode.title === 'string' && episode.title &&
      typeof episode.summary === 'string' && typeof episode.ending === 'string' && Number.isInteger(episode.revision) &&
      episode.revision > 0 && Array.isArray(episode.stages) && episode.stages.length > 0, 'Invalid or duplicate episode');
    const stages = new Set();
    for (const stage of episode.stages) {
      assert(!stages.has(stage.id), 'Duplicate episode stage ' + stage.id);
      try { validateStage(stage); } catch (error) { throw Error(episode.id + '/' + stage.id + ': ' + error.message); }
      stage.color = stage.palette[0];
      stages.add(stage.id);
    }
    episode.hosts = episode.stages.reduce((sum, stage) => sum + stage.captives.length +
      stage.enemies.filter(([type]) => type === 'plugged' || type === 'repeater').length, 0);
    episode.secretCount = episode.stages.filter(stage => stage.map.some(row => row.includes('?'))).length;
    episodes.set(episode.id, freeze(episode));
  }
  return Object.freeze({list: Object.freeze([...episodes.values()]), get: id => episodes.get(id)});
}

export const NO_EPISODES = createEpisodeRegistry([]);
