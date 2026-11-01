import {pitBossSprite,paintHazardIcon} from './pit-presentation.js';
import {makeAssets, makeSign} from './assets.js';
import {MATERIALS} from './level-geometry.js';
import {signalPalette, paintSignalSurface} from './neon-signal.js';

export function createWorldAtlas(level, assets = makeAssets()) {
 const canvas = document.createElement('canvas');
 canvas.width = canvas.height = 1024;
 const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
 const palette = signalPalette(level);
 function tile(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const t = c.getContext('2d'); t.imageSmoothingEnabled = false; draw(t); return c;
 }
 const walls = {};
 for (let i = 1; i <= 6; i++) walls[i] = tile(t => paintSignalSurface(t, 'wall',
  i === 5 ? {...palette, primary: '#ffd078'} : i === 6 ? {...palette, primary: '#b48bff'} : palette,
  assets.textures[i]));
 const special = {
  floor: tile(t => paintSignalSurface(t, 'floor', palette)),
  ceiling: tile(t => paintSignalSurface(t, 'ceiling', palette)),
  white: tile(t => { t.fillStyle = '#fff'; t.fillRect(0, 0, 64, 64); }),
  portal: tile(t => {
   t.strokeStyle = palette.accent; t.lineWidth = 5; t.strokeRect(7, 3, 50, 58);
   t.strokeStyle = palette.primary; t.lineWidth = 3;
   for (let r = 8; r < 27; r += 7) { t.beginPath(); t.arc(32, 32, r, 0, Math.PI * 2); t.stroke(); }
   t.fillStyle = '#d9ffff'; t.font = '24px serif'; t.fillText('Φ', 22, 40);
  }),
  marker: tile(t => { t.fillStyle = '#fff'; t.beginPath(); t.moveTo(32, 2);
   t.lineTo(60, 32); t.lineTo(32, 62); t.lineTo(4, 32); t.closePath(); t.fill(); }),
  'signal:screen': tile(t => {
   t.fillStyle = '#07142b'; t.fillRect(0, 0, 64, 64);
   t.strokeStyle = palette.primary; t.strokeRect(2, 2, 59, 59);
   t.fillStyle = palette.primary; t.font = '9px monospace'; t.fillText('SIGNAL', 7, 15);
   for (let i = 0; i < 6; i++) t.fillRect(7, 23 + i * 5, 14 + (i * 13) % 39, 2);
   t.fillStyle = palette.accent; t.fillRect(44, 48, 10, 7);
  })
 };
 const sprites = assets.sprites;
 MATERIALS.forEach((name, i) => {
  let image = special[name];
  if (name.startsWith('wall')) image = walls[Number(name.slice(4))];
  if (name.startsWith('enemy:') || name.startsWith('pain:')) {
   const [kind, type, frame] = name.split(':'); image = (kind === 'pain' ? assets.pain : sprites)[type][Number(frame)];
  }
  if(name.startsWith('pitboss:'))image=pitBossSprite(name.split(':')[1],name.endsWith(':open'));
  if(name.startsWith('hazard:'))image=tile(t=>paintHazardIcon(t,name.split(':')[1]));
  if (name.startsWith('item:')) image = sprites[name.slice(5)];
  if (name.startsWith('relay:')) image = sprites[name.endsWith('on') ? 'relayOn' : 'relay'];
  if (name.startsWith('prop:')) image = sprites[name.slice(5)];
  if (name === 'ori' || name === 'captive') image = sprites[name];
  if (name.startsWith('sign:')) {
   const sign = level.signs[Number(name.slice(5))];
   if (sign) image = makeSign(sign, walls[level.cells[sign.y][sign.x]]);
  }
  if (image) g.drawImage(image, i % 16 * 64 + 2, Math.floor(i / 16) * 64 + 2, 60, 60);
 });
 return canvas;
}
