import {readFile,stat} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('dist'),base=new URL('https://example.invalid/MichaelWave-Ori-BreakTheMatrix/');
let checked=0;
async function verifyURL(relative,parent=base){const url=new URL(relative,parent);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw Error('Asset escapes repository subpath: '+relative);const rel=decodeURIComponent(url.pathname.slice(base.pathname.length))||'index.html';const target=path.join(root,rel);if(!(await stat(target)).isFile())throw Error('Missing '+target);checked++;return {url,target};}
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const ref=match[1];if(ref.startsWith('#')||ref==='./')continue;await verifyURL(ref);}
for(const file of ['main.js','pit.js','pit-combat.js','pit-presentation.js','campaign-storage.js','communications.js','renderer.js','core.js','assets.js','audio.js','controls.js','gamepad.js','gauntlet.js','vr.js','collision.js','spatial.js','immersive-math.js','immersive-rig.js','left-hand-pose.js','ori-comfort.js','immersive-play.js','level-geometry.js','world-atlas.js','world-scene.js','neon-signal.js','signal-presentation.js','world-ui.js','genewrist-ui.js','genewrist-bridge.js','genewrist/catalog.js','genewrist/worlds.js','equipment-math.js','equipment-meshes.js','vr-world-renderer.js','vr-math.js','vr-input.js','vr-renderer.js']){const parent=new URL('src/'+file,base),source=await readFile(path.join(root,'src',file),'utf8');for(const m of source.matchAll(/from\s+['"]([^'"]+)['"]/g))await verifyURL(m[1],parent);}
const css=await readFile(path.join(root,'src/style.css'),'utf8');for(const m of css.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g))if(!m[1].startsWith('data:'))await verifyURL(m[1],new URL('src/style.css',base));
const sw=await readFile(path.join(root,'sw.js'),'utf8'),files=JSON.parse(sw.match(/const FILES=(\[[^;]+\]);/)[1]);for(const file of files)await verifyURL(file);
const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));for(const icon of manifest.icons)await verifyURL(icon.src);if(new URL(manifest.start_url,base).pathname!==base.pathname)throw Error('Manifest start_url escapes base');
// Rung 3 images are generated deterministically at build time rather than
// downloaded or embedded in the service worker. Verify every image is real,
// image-sized, present in dist and distinct before publishing a Pages build.
const signatures=new Set();
for(const style of ['cyberpunk','horror','corporate']){
 for(const material of ['wall1','wall2','wall3','wall4','wall5','wall6','floor','ceiling']){
  const {target}=await verifyURL('./texture-packs/'+style+'/'+material+'.png');
  const bytes=await readFile(target);
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
   bytes.readUInt32BE(16)!==256||bytes.readUInt32BE(20)!==256||bytes[25]!==2)
   throw Error('Bad authored 256px PNG: '+target);
  const digest=(await import('node:crypto')).createHash('sha256').update(bytes).digest('hex');
  if(signatures.has(digest))throw Error('Duplicate authored surface '+target);
  signatures.add(digest);
 }
}
const preview=await verifyURL('./texture-packs/rung3-material-matrix.png');
const previewBytes=await readFile(preview.target);
if(previewBytes.readUInt32BE(16)!==768||previewBytes.readUInt32BE(20)!==2048)
 throw Error('Incorrect Rung 3 surface comparison matrix');
console.log(`Build verification passed: ${checked} asset/import/cache references resolve under /MichaelWave-Ori-BreakTheMatrix/. ${signatures.size} original Rung 3 tiles + 3-column image matrix.`);
