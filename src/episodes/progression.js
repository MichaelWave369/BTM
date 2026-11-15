import {canOccupy} from '../collision.js';
import {decodeEpisodeMap, episodeVertical, EPISODE_SCHEMA} from './registry.js';

export function episodeMode(index, count) {
  return index === count - 1 ? 'ending' : 'complete';
}

export function episodeSnapshotFields(game) {
  return {
    version: 3, schema: EPISODE_SCHEMA, campaign: 'episode',
    episodeId: game.episode.id, episodeRevision: game.episode.revision,
    stageId: game.definition.id, episodeCleared: ['complete', 'ending'].includes(game.mode)
  };
}

export function restoreEpisodeState(game, snapshot) {
  const fields = [
    'levelIndex', 'level', 'player', 'time', 'totalFreed', 'totalArtifacts', 'totalSecrets',
    'campaignTime', 'unlocked', 'weapon', 'levelFreed', 'levelKills', 'shots', 'hits', 'bassCharge', 'rng'
  ];
  for (const field of fields) game[field] = snapshot[field];
}

export function validEpisodeCheckpoint(snapshot, episode) {
  const {level, player, levelIndex} = snapshot;
  const stage = episode?.stages[levelIndex];
  if (!stage || snapshot.schema !== EPISODE_SCHEMA || snapshot.campaign !== 'episode' ||
      snapshot.episodeId !== episode.id || snapshot.episodeRevision !== episode.revision ||
      snapshot.stageId !== stage.id || typeof snapshot.episodeCleared !== 'boolean' ||
      !['legacy', 'survival'].includes(snapshot.energyMode) || level?.campaign !== 'episode' ||
      level.episodeId !== episode.id || level.stageId !== stage.id || level.index !== levelIndex ||
      !player || ![player.x, player.y, player.a, player.health, player.armor, player.ori, player.vision,
        player.energy, player.reserve].every(Number.isFinite) ||
      player.health <= 0 || player.health > 100 || player.energy < 0 || player.energy > 100 ||
      player.reserve < 0 || player.reserve > 180 || typeof player.key !== 'boolean' ||
      !Number.isInteger(snapshot.unlocked) || snapshot.unlocked < 3 || snapshot.unlocked > 6 ||
      !Number.isInteger(snapshot.weapon) || snapshot.weapon < 0 || snapshot.weapon >= snapshot.unlocked ||
      ![snapshot.time, snapshot.campaignTime, snapshot.totalFreed, snapshot.totalArtifacts, snapshot.totalSecrets,
        snapshot.levelFreed, snapshot.levelKills, snapshot.shots, snapshot.hits, snapshot.bassCharge, snapshot.rng]
        .every(n => Number.isFinite(n) && n >= 0) || !snapshot.v2?.stats) return false;

  const map = decodeEpisodeMap(stage.map);
  if (level.w !== map.w || level.h !== map.h || JSON.stringify(level.cells) !== JSON.stringify(map.cells) ||
      !Array.isArray(level.seen) || level.seen.length !== map.w * map.h || !level.doors ||
      Object.keys(level.doors).length !== Object.keys(map.doors).length ||
      !Array.isArray(level.regions) || !Array.isArray(level.signs) || !Array.isArray(level.props) ||
      !Array.isArray(level.enemies) || level.enemies.length !== stage.enemies.length ||
      !Array.isArray(level.relays) || level.relays.length !== stage.relays.length ||
      !Array.isArray(level.items) || level.items.length !== stage.items.length + (stage.vertical?.items.length ?? 0) ||
      !Array.isArray(level.captives) || level.captives.length !== stage.captives.length) return false;
  for (const [key, {x, y, type, lockColor}] of Object.entries(map.doors)) {
    const door = level.doors[key];
    if (!door || door.x !== x || door.y !== y || door.type !== type || door.lockColor !== lockColor ||
        !Number.isFinite(door.open) || door.open < 0 || door.open > 1 || ![0, 1].includes(door.target)) return false;
  }
  const matches = (point, [x, y]) => point?.x === x && point?.y === y;
  if (!matches(level.key, stage.key) || level.key.taken !== player.key || !matches(level.exit, stage.exit) ||
      !level.relays.every((relay, i) => matches(relay, stage.relays[i]) && typeof relay.active === 'boolean') ||
      !level.enemies.every((enemy, i) => enemy?.type === stage.enemies[i][0] && typeof enemy.dead === 'boolean' &&
        [enemy.x, enemy.y, enemy.hp, enemy.maxHp, enemy.speed].every(Number.isFinite)) ||
      !level.captives.every((captive, i) => matches(captive, stage.captives[i]) && typeof captive.freed === 'boolean') ||
      !level.items.every((item, i) => {
        const [type, x, y] = stage.items[i] ?? stage.vertical.items[i - stage.items.length];
        return item?.type === type && matches(item, [x, y]) && typeof item.taken === 'boolean';
      }) ||
      !canOccupy(level, player.x, player.y)) return false;
  if (snapshot.episodeCleared && (!player.key || level.relays.some(relay => !relay.active) ||
      level.enemies.some(enemy => enemy.type === 'warden' && !enemy.dead))) return false;

  if (!stage.vertical) return level.vertical == null;
  const vertical = episodeVertical(map, stage.vertical);
  return JSON.stringify(level.vertical) === JSON.stringify(vertical) &&
    [player.height, player.vz, player.jumpBuffer, player.coyote].every(Number.isFinite) &&
    player.height >= 0 && player.height <= vertical.ceiling - 1.1 + .01 &&
    typeof player.grounded === 'boolean' && ['ground', 'upper', 'ramp'].includes(player.supportSurface);
}
