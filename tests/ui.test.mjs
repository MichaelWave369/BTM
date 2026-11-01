import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {UI,WEAPON_UI} from '../src/arcade-ui.js';
import {Game} from '../src/core.js';
import {Renderer} from '../src/renderer.js';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
test('HUD semantic text colors meet 4.5:1 contrast on the instrument panel',()=>{for(const key of ['text','cyan','pink','violet','gold','muted','red']){const a=luminance(UI[key]),b=luminance(UI.panel);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,key);}});
test('All six weapon UI colors are independent of gameplay weapon definitions',()=>{assert.equal(WEAPON_UI.length,6);assert.equal(new Set(WEAPON_UI).size,6);assert.ok(Object.isFrozen(WEAPON_UI));});
test('All production interaction IDs remain unique and reachable in markup',async()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');for(const m of main.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);for(const id of ['health','armor','energy','ori-energy','objective','radar','portrait','weapon-slots','settings-back','vr-btn','immersive-btn'])assert.ok(ids.includes(id));});
test('Every custom SVG icon reference resolves to an authored symbol',()=>{const symbols=new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map(m=>m[1]));for(const m of html.matchAll(/<use href="#([^"]+)"/g))assert.ok(symbols.has(m[1]),m[1]);});
test('Bundled fonts have valid TTF headers and their actual redistribution licenses',async()=>{for(const name of ['Oxanium','RacingSansOne']){const font=await readFile(new URL('../public/fonts/'+name+'.ttf',import.meta.url));assert.equal(font.readUInt32BE(0),0x00010000);const license=await readFile(new URL('../public/fonts/'+name+'-OFL.txt',import.meta.url),'utf8');assert.match(license,/SIL OPEN FONT LICENSE Version 1\.1/);assert.match(license,/Copyright/);}});
test('Interface has no remote font, image, stylesheet or script requirement',async()=>{const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');assert.doesNotMatch(css,/@import|url\(['"]?https?:/);assert.doesNotMatch(html,/(?:src|href)="https?:/);assert.doesNotMatch(html,/Neon-Synthwave-Matrix-Game-UI\.png/);});
function mapContext(){const calls=[];const g={fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,fillRect(...args){calls.push({color:this.fillStyle,args});},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},rotate(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},strokeRect(){},fillText(){}};return {g,calls};}
test('Cover title scene is opt-in and preserves a fully local fallback',async()=>{
  const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
  const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(html,/id="title-cover-art"[^>]*src="\.\/art\/btm-title-cover\.avif"/);
  assert.match(css,/\.title-screen\.album-cover-ready \.title-album/);
  assert.match(css,/@media\(max-width:820px\)/);
  assert.match(main,/titleCover\.addEventListener\('error',updateTitleCover\)/);
  assert.match(build,/existsSync\('dist\/art\/btm-title-cover\.avif'\)/);
});
test('The redesigned minimap does not reveal unseen geometry or objectives',()=>{const game=new Game();game.start();game.level.seen.fill(0);game.objectiveTime=0;const {g,calls}=mapContext();Renderer.prototype.drawMap.call({},game,false,g,256,220);assert.equal(calls.length,1,'Only the map background may be painted when nothing is discovered');});
test('Minimap rendering is presentation-only and preserves game snapshots',()=>{const game=new Game();game.start();game.objectiveTime=4;const before=JSON.stringify(game.snapshot()),{g}=mapContext();Renderer.prototype.drawMap.call({},game,false,g,256,220);assert.equal(JSON.stringify(game.snapshot()),before);});
