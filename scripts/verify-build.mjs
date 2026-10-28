import {readFile,stat} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('dist'),base=new URL('https://example.invalid/MichaelWave-Ori-BreakTheMatrix/');
let checked=0;
async function verifyURL(relative,parent=base){const url=new URL(relative,parent);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw Error('Asset escapes repository subpath: '+relative);const rel=decodeURIComponent(url.pathname.slice(base.pathname.length))||'index.html';const target=path.join(root,rel);if(!(await stat(target)).isFile())throw Error('Missing '+target);checked++;return {url,target};}
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const ref=match[1];if(ref.startsWith('#')||ref==='./')continue;await verifyURL(ref);}
for(const file of ['main.js','renderer.js','core.js','assets.js','audio.js','controls.js','gamepad.js','gauntlet.js','vr.js','collision.js','spatial.js','immersive-math.js','immersive-rig.js','immersive-play.js','level-geometry.js','world-atlas.js','world-scene.js','neon-signal.js','signal-presentation.js','world-ui.js','vr-world-renderer.js','vr-math.js','vr-input.js','vr-renderer.js']){const parent=new URL('src/'+file,base),source=await readFile(path.join(root,'src',file),'utf8');for(const m of source.matchAll(/from\s+['"]([^'"]+)['"]/g))await verifyURL(m[1],parent);}
const css=await readFile(path.join(root,'src/style.css'),'utf8');for(const m of css.matchAll(/url\(['"]?([^)'"]+)['"]?\)/g))if(!m[1].startsWith('data:'))await verifyURL(m[1],new URL('src/style.css',base));
const sw=await readFile(path.join(root,'sw.js'),'utf8'),files=JSON.parse(sw.match(/const FILES=(\[[^;]+\]);/)[1]);for(const file of files)await verifyURL(file);
const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));for(const icon of manifest.icons)await verifyURL(icon.src);if(new URL(manifest.start_url,base).pathname!==base.pathname)throw Error('Manifest start_url escapes base');
console.log(`Build verification passed: ${checked} asset/import/cache references resolve under /MichaelWave-Ori-BreakTheMatrix/.`);
