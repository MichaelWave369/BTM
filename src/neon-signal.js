import {WORLD_SCALE} from './spatial.js';
// Original, presentation-only Neon Signal art. No gameplay state or remote assets.
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(1);
const PALETTES = [
  ['Wake signal', '#47edff', '#ff51bb'], ['Static cathedral', '#a087ff', '#42eaff'],
  ['Demiurge alarm', '#ff6578', '#ffc36b'], ['Memory lattice', '#43f4d2', '#b58aff'],
  ['Blackout current', '#548fff', '#ff58c9'], ['Null crown', '#c195ff', '#ffba68'],
  ['Dead letters', '#ffb66c', '#51e6ff'], ['Meatspace firewall', '#ff6d93', '#6b98ff'],
  ['Redundancy pit', '#ff7665', '#ef66ff'], ['Panopticon', '#64ceff', '#f46cff'],
  ['God process', '#f6c975', '#b48bff'], ['Impossible frequency', '#76fff1', '#ff76db']
].map(([name, primary, accent]) => Object.freeze({name, primary, accent,
  glow: Object.freeze(rgb(primary)), secondary: Object.freeze(rgb(accent)),
  fog: Object.freeze(rgb(primary).slice(0, 3).map(v => v * .025))}));

export function signalPalette(index = 0) {
  if(index&&typeof index==='object'){if(index.campaign==='pit'&&index.palette)return index.palette;index=index.index||0;}
  return PALETTES[((index % 12) + 12) % 12] || PALETTES[0];
}

export const SIGNAL_QUALITY = Object.freeze({
  performance: Object.freeze({scale: .65, distance: 19, particles: 24, fixtures: 12, rings: 8}),
  balanced: Object.freeze({scale: .85, distance: 27, particles: 48, fixtures: 28, rings: 12}),
  high: Object.freeze({scale: 1, distance: 36, particles: 96, fixtures: 48, rings: 16})
});

export function chunkInRange(bounds, eye, distance) {
  let squared = 0;
  for (const i of [0, 2]) {
    const delta = Math.max(bounds.min[i] - eye[i], 0, eye[i] - bounds.max[i]);
    squared += delta * delta;
  }
  return squared <= distance * distance;
}

// Fixtures sit a few millimeters in front of existing walls. They never add collision.
export function signalFixtures(level) {
  const fixtures = [];
  for (let y = 1; y < level.h - 1; y++) for (let x = 1; x < level.w - 1; x++) {
    if (level.cells[y][x] !== 0 || (x * 7 + y * 11) % 4) continue;
    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const wx = x + dx, wy = y + dz;
      if (!level.cells[wy]?.[wx] || level.doors[wx + ',' + wy] ||
          level.signs?.some(s => s.x === wx && s.y === wy)) continue;
      fixtures.push({x: (x + .5 + dx * .488) * WORLD_SCALE,
        z: (y + .5 + dz * .488) * WORLD_SCALE, dx, dz, phase: x * .8 + y * 1.7,
        terminal: (x + y) % 3 === 0});
      break;
    }
  }
  return fixtures;
}

// Called once on sector load; intentionally leaves Classic's asset factories untouched.
export function paintSignalSurface(g, kind, palette, base = null) {
  g.fillStyle = '#10192e'; g.fillRect(0, 0, 64, 64);
  if (base) { g.globalAlpha = .28; g.drawImage(base, 0, 0, 64, 64); g.globalAlpha = 1; }
  g.fillStyle = '#070d1d';
  if (kind === 'floor') {
    g.fillRect(0, 0, 64, 3); g.fillRect(0, 0, 3, 64);
    g.strokeStyle = '#293959'; g.strokeRect(5, 5, 53, 53);
    g.fillStyle = palette.primary; g.fillRect(8, 8, 18, 1);
    g.fillStyle = '#303459'; g.fillRect(8, 54, 46, 2);
    g.fillStyle = palette.accent; g.fillRect(51, 50, 3, 2);
  } else if (kind === 'ceiling') {
    for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 3);
    g.fillStyle = '#334263'; g.fillRect(23, 0, 18, 64);
    g.fillStyle = palette.primary; g.fillRect(27, 8, 10, 48);
    g.fillStyle = '#c9f9ff'; g.fillRect(30, 10, 4, 44);
  } else {
    g.fillRect(0, 0, 64, 4); g.fillRect(0, 0, 3, 64); g.fillRect(0, 59, 64, 5);
    g.strokeStyle = '#49506b'; g.strokeRect(6, 12, 51, 39);
    g.fillStyle = '#253650'; g.fillRect(8, 14, 47, 2);
    g.fillStyle = palette.primary; g.fillRect(3, 6, 58, 2); g.fillRect(4, 54, 56, 1);
    g.fillStyle = palette.accent; g.fillRect(48, 37, 5, 10);
    g.fillStyle = '#12192c'; for (let x = 11; x < 42; x += 5) g.fillRect(x, 38, 2, 9);
    g.fillStyle = '#9ab1ca'; for (const x of [8, 53]) for (const y of [19, 47]) g.fillRect(x, y, 2, 2);
  }
}
