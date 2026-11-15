// Exact aim and authored map knowledge. The driver only uses simulation input
// and the production checkpoint adapter to advance the episode.
import {Game, distance, findRoute} from '../src/core.js';
import {EPISODES} from '../src/episodes/index.js';
import {episodeSaveKey} from '../src/episodes/registry.js';
import {verticalSight} from '../src/net/vertical-arena.js';
import {writeCampaignCheckpoint, ORIGINAL_SAVE_KEY, PIT_SAVE_KEY} from '../src/campaign-storage.js';
import {CampaignDriver} from './playthrough.js';
import {TrackedGame} from './immersive-playthrough.js';

export const BURIED_ID = 'buried-network';
const BBS_PREFS_KEY = 'mwave-bbs-settings-v1';
export const createEpisodeGame = immersive => new (immersive ? TrackedGame : Game)({episodes: EPISODES});

export class EpisodeDriver extends CampaignDriver {
  constructor({immersive = false, onEvent} = {}) {
    const game = createEpisodeGame(immersive);
    game.startEpisode(BURIED_ID);
    super({game, resume: true, sectors: game.stageCount, secrets: true, onEvent});
    this.immersive = immersive;
    this.slots = new Map([[ORIGINAL_SAVE_KEY, 'original'], [PIT_SAVE_KEY, 'pit'], [BBS_PREFS_KEY, 'bbs']]);
    this.legacy = [...this.slots];
    this.flatLayouts = new WeakMap();
  }

  canSee(from, to) {
    if (!this.game.level.vertical) return super.canSee(from, to);
    return verticalSight(this.game.level, from, {...to, height: to.floorHeight || 0});
  }

  routeTo(target, secrets = false) {
    const {level, player} = this.game, options = {allowLocked: player.key, keys: player.keys, secrets};
    if (!level.vertical) return findRoute(level, player, target, options);
    const {ramp, upper} = level.vertical, y = ramp.y0 + .5;
    const foot = {x: ramp.x0 - .5, y}, crest = {x: upper.x0 + .5, y};
    const nodes = Array.from({length: ramp.x1 - ramp.x0}, (_, i) => ({x: ramp.x0 + i + .5, y}));
    const above = player.supportSurface === 'upper', ascending = (target.floorHeight || 0) >= upper.height;
    const onRamp = player.supportSurface === 'ramp';
    let flat = this.flatLayouts.get(level);
    if (!flat) {
      const cells = level.cells.map(row => row.slice());
      for (let row = ramp.y0; row < ramp.y1; row++) cells[row].fill(1, ramp.x0, ramp.x1);
      flat = {...level, cells};
      this.flatLayouts.set(level, flat);
    }
    if (ascending && above) return findRoute(level, player, target, options);
    if (ascending) {
      const approach = onRamp ? [] : findRoute(flat, player, foot, options);
      if (!onRamp && !approach.length) return [];
      return [...approach, ...nodes.filter(n => !onRamp || n.x >= Math.floor(player.x) + .5),
        ...findRoute(level, crest, target, options)];
    }
    if (above || onRamp) {
      const deck = above ? findRoute(level, player, crest, options) : [];
      return [...deck, ...nodes.slice().reverse().filter(n => above || n.x <= Math.floor(player.x) + .5),
        ...findRoute(flat, foot, target, options)];
    }
    return findRoute(flat, player, target, options);
  }

  combatWeapon(target, group) {
    const {player} = this.game;
    if (target.type === 'warden' && player.energy >= 14 && distance(player, target) < 10.5) return 4;
    return super.combatWeapon(target, group);
  }

  chooseGoal() {
    const key = this.game.level.items.find(item => item.type.startsWith('key:') && !item.taken && this.routeTo(item).length);
    return key ? {...key, goal: 'pickup', key: 'color-key-' + key.id} : super.chooseGoal();
  }

  finishSector() {
    const g = this.game, l = g.level;
    if (!g.exitReady || g.mode !== (g.levelIndex === g.stageCount - 1 ? 'ending' : 'complete'))
      throw Error('Episode extraction did not advance progression');
    const boss = l.enemies.find(e => e.type === 'warden');
    const deckArtifact = l.items.find(i => i.type === 'artifact' && i.floorHeight > 0);
    const storage = {setItem: (key, value) => this.slots.set(key, value)};
    writeCampaignCheckpoint(storage, g);
    if (this.legacy.some(([key, value]) => this.slots.get(key) !== value)) throw Error('Legacy slot changed');
    const snapshot = JSON.parse(this.slots.get(episodeSaveKey(BURIED_ID)));
    const restored = createEpisodeGame(this.immersive);
    restored.restore(snapshot, {campaign: 'episode', episodeId: BURIED_ID});
    if (restored.mode !== g.mode || restored.definition.id !== g.definition.id ||
      restored.player.energy !== g.player.energy || restored.player.reserve !== g.player.reserve)
      throw Error('Episode checkpoint did not conserve progress or resources');

    this.results.push({
      stage: g.levelIndex + 1, name: g.definition.name, stageId: g.definition.id, mode: restored.mode,
      seconds: +this.elapsed.toFixed(2), distance: +this.measuredDistance.toFixed(2), deaths: this.deaths,
      relays: l.relays.filter(r => r.active).length, goldKey: g.player.key, captives: l.captives.filter(c => c.freed).length,
      secret: l.secretFound, deckArtifact: deckArtifact?.taken ?? null,
      shots: this.shots, defeated: this.defeated, bossDead: boss?.dead ?? null, bossPhases: [...this.bossPhases],
      charge: g.player.energy, reserve: g.player.reserve
    });
    if (g.mode === 'ending') {this.done = true; return;}
    this.game = restored;
    restored.next();
    this.enterSector();
  }
}

export function runEpisode(options) {
  const driver = new EpisodeDriver(options);
  while (!driver.done) driver.tick();
  return driver.report();
}
