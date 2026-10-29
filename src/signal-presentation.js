import {handMesh,appendEquipment} from './equipment-meshes.js';
import {oriVisualTarget} from './ori-comfort.js';
import {lineOfSight} from './collision.js';
import {WORLD_SCALE, entityHeight, traceEnvironment, rayEntityDistance} from './spatial.js';
import {signalFixtures, signalPalette} from './neon-signal.js';

const METAL = [.12, .17, .28, 1], GLOVE = [.24, .3, .43, 1];
const CYAN = [.3, .95, 1, 1], AMBER = [1, .54, .2, 1];

// Mirrors interact's reach/occlusion rules, including locked and hidden doors.
// Returns presentation data only; the original Game.interact remains authoritative.
export function interactionFocus(game, aim) {
 if (!aim || game.mode !== 'playing') return null;
 const l = game.level, p = game.player;
 const close = o => Math.hypot(p.x - o.x, p.y - o.y) < 1.55 && lineOfSight(l, p, o) &&
  rayEntityDistance(aim.origin, aim.direction, o, .1, 2.2) !== null;
 const captive = l.captives.find(c => !c.freed && close(c));
 if (captive) return {x: captive.x, y: captive.y, height: 1.65, label: 'FREE CAPTIVE'};
 const relay = l.relays.find(r => !r.active && close(r));
 if (relay) return {x: relay.x, y: relay.y, height: 1.15, label: 'BREAK RELAY'};
 const hit = traceEnvironment(l, aim.origin, aim.direction, 1.8), d = hit.cell && l.doors[hit.cell.x + ',' + hit.cell.y];
 if (d && hit.distance < 1.8 && d.open < .85 && (d.type !== 6 || game.shift))
  return {x: d.x + .5, y: d.y + .5, height: 1.9, locked: d.type === 5 && !p.key, label: d.type === 5 && !p.key ? 'GOLD KEY REQUIRED' : 'OPEN DOOR'};
 const sign = hit.cell && l.signs?.find(s => s.x === hit.cell.x && s.y === hit.cell.y);
 if (sign && hit.distance < 1.8) return {x: sign.x + .5, y: sign.y + .5, height: 1.7, label: 'READ ARCHIVE'};
 if (Math.hypot(p.x - l.exit.x, p.y - l.exit.y) < 1.8)
  return {x: l.exit.x, y: l.exit.y, height: 2.15, locked: !game.exitReady, label: game.exitReady ? 'EXTRACT' : 'PORTAL LOCKED'};
 return null;
}

export class SignalPresentation {
 constructor() {
  this.from = new Float32Array(3); this.to = new Float32Array(3);
  this.color = new Float32Array(4); this.ori = new Float32Array(3);
  this.fixtures = []; this.level = null; this.pulse = 0; this.clock = 0; this.fixtureCount = 0;
 }
 event(e) { if (['shot', 'oriAssist', 'bass', 'liberation'].includes(e.type)) this.pulse = .18; }
 ring(b, x, y, z, radius, segments, eye, color, vertical = false) {
  for (let i = 0; i < segments; i++) {
   const a = i * Math.PI * 2 / segments, n = (i + 1) * Math.PI * 2 / segments;
   this.from.set([x + Math.cos(a) * radius, y + (vertical ? Math.sin(a) * radius : 0), z + (vertical ? 0 : Math.sin(a) * radius)]);
   this.to.set([x + Math.cos(n) * radius, y + (vertical ? Math.sin(n) * radius : 0), z + (vertical ? 0 : Math.sin(n) * radius)]);
   b.line(this.from, this.to, .006, eye, color);
  }
 }
 hand(b,matrix,side,settings,power,pose){appendEquipment(b,handMesh(side,settings.vrHandStyle||'combat',pose,settings.vrQuality==='performance'?6:8),matrix,settings.vrHologramBrightness??.85,power);}
 update(b, game, rig, dt, settings, quality) {
  const l = game.level, eye = rig.eye, s = WORLD_SCALE, still = settings.reducedMotion;
  if (this.level !== l) {
   this.level = l; this.fixtures = signalFixtures(l); this.palette = signalPalette(l.index);
   this.ori.set([game.ori.x * s, 1.25, game.ori.y * s]); this.pulse = 0; this.clock = 0;
  }
  if (game.mode === 'playing') { this.clock += dt; this.pulse = Math.max(0, this.pulse - dt); }
  const t = still ? 0 : this.clock, p = this.palette, reach = quality.distance * quality.distance;
  this.fixtureCount = 0;
  for (const f of this.fixtures) {
   if ((f.x - eye[0]) ** 2 + (f.z - eye[2]) ** 2 > reach || this.fixtureCount >= quality.fixtures) continue;
   this.fixtureCount++;
   const gain = still ? .85 : .82 + Math.sin(t * 1.5 + f.phase) * .08 + this.pulse * .5;
   for (let k = 0; k < 3; k++) this.color[k] = p.glow[k] * gain; this.color[3] = 1;
   const width = f.dx ? .025 : .9, depth = f.dx ? .9 : .025;
   b.box([f.x, 2.42, f.z], [width, .045, depth], 'white', this.color);
   // Soft reflected color is a cheap floor decal; no light passes or bloom.
   b.floor(f.x - f.dx * .25, .008, f.z - f.dz * .25, .35, 'marker', [.07 * p.glow[0], .07 * p.glow[1], .07 * p.glow[2], 1]);
   if (f.terminal) {
    b.box([f.x, 1.32, f.z], [f.dx ? .028 : .5, .36, f.dx ? .5 : .028], 'signal:screen');
    b.box([f.x - f.dx * .015, 1.08, f.z - f.dz * .015], [f.dx ? .03 : .5, .018, f.dx ? .5 : .03], 'white', p.secondary);
    const offset = still ? 0 : Math.sin(t * .7 + f.phase) * .1;
    b.box([f.x - f.dx * .02, 1.32 + offset, f.z - f.dz * .02], [f.dx ? .012 : .42, .006, f.dx ? .42 : .012], 'white', this.color);
   }
  }
  if (rig.hasLeft) this.hand(b,rig.leftVisualWorld||rig.leftWorld,'left',settings,rig.uiCaptured?.2:0,rig.uiCaptured?'point':'relaxed');
  if (rig.hasRightGrip) this.hand(b,rig.rightGripWorld,'right',settings,game.charge*.2+game.muzzle*.15,game.weapon===0?'relaxed':'grip');

  // Ori's gameplay location, abilities and timing stay in the simulation.
  // The visual core follows smoothly and keeps a clear lane around the weapon ray.
  const visualTarget = oriVisualTarget({eye, head:rig.headWorld, x:game.ori.x*s, z:game.ori.y*s, aim:rig.aim, peripheral:settings.vrOriPeripheral!==false});
  const ox=visualTarget.x, oz=visualTarget.z;
  const follow = 1 - Math.exp(-Math.min(dt, .05) * 6);
  this.ori[0] += (ox - this.ori[0]) * follow;
  this.ori[2] += (oz - this.ori[2]) * follow;
  this.ori[1] = 1.25 + (still ? 0 : Math.sin(t * 2.4) * .035);
  const threat = l.enemies.find(e => !e.dead && e.tell > 0 && Math.hypot(e.x - game.player.x, e.y - game.player.y) < 9);
  const oriColor = threat || game.player.health < 30 ? AMBER : CYAN;
  const oriSize = Number.isFinite(settings.vrOriScale)?Math.max(.4,Math.min(1,settings.vrOriScale)):.65;
  this.ring(b, ...this.ori, (.28 + (game.assistTime > 0 ? .04 : 0))*oriSize, quality.rings, eye, oriColor);
  this.ring(b, ...this.ori, .23*oriSize, quality.rings, eye, p.secondary, true);
  b.billboard(this.ori[0], this.ori[1] - .18*oriSize, this.ori[2], .36*oriSize, .36*oriSize, 'ori', eye, oriColor);
  const attention = threat || (game.objectiveTime > 0 ? game.objectiveTarget : null);
  if (attention) {
   this.from.set(this.ori);
   const dx = attention.x * s - this.ori[0], dz = attention.y * s - this.ori[2], n = Math.hypot(dx, dz) || 1;
   this.to.set([this.ori[0] + dx / n * .42, this.ori[1], this.ori[2] + dz / n * .42]);
   b.line(this.from, this.to, .018, eye, oriColor);
  }
  if (game.scanTime > 0) this.ring(b, this.ori[0], .035, this.ori[2], .35 + (1.4 - game.scanTime) * 1.6, quality.rings, eye, CYAN);
  for (const e of l.enemies) {
   if (e.dead || (e.x * s - eye[0]) ** 2 + (e.y * s - eye[2]) ** 2 > reach) continue;
   if (e.type === 'warden') {
    this.ring(b, e.x * s, entityHeight(e.type) * s + .08, e.y * s, .39, quality.rings, eye, e.tell > 0 ? AMBER : p.secondary);
   }
   if (e.tell > 0) this.ring(b, e.x * s, .025, e.y * s, e.type === 'warden' ? .65 : .38, quality.rings, eye, AMBER);
  }
  const focus = interactionFocus(game, rig.aim);
  this.focus = focus;
  if (focus) this.ring(b, focus.x * s, .03, focus.y * s, .38, quality.rings, eye, focus.locked ? AMBER : CYAN);
 }
}
