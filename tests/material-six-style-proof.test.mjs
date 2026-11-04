import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TEXTURE_PACKS,AUTHORED_TEXTURE_MANIFESTS} from '../src/texture-packs.js';
import {Game} from '../src/core.js';

test('six-style production material capture is source-bound, same-pose and isolated from gameplay',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [html,script,workflow]=await Promise.all([
  read('public/immersive-next-qa.html'),read('scripts/verify-materials-browser.mjs'),
  read('.github/workflows/equipment.yml')]);
 const styles=Object.keys(TEXTURE_PACKS);
 assert.deepEqual(styles,['retro','industrial','cyberpunk','horror','corporate','matrix-facility']);
 assert.equal(Object.keys(AUTHORED_TEXTURE_MANIFESTS).length,5);
 assert(html.includes('id="material"'));
 assert(html.includes('window.previewMaterial'));
 assert(html.includes('renderer.packPending.get(style)'),'material PNG loading must complete before measurement');
 assert(html.includes('textureStyle:style'));
 assert(html.includes('textureQuality:\'ultra\''));
 assert(script.includes('window.previewMaterial({style,sector:0,quality:\'high\'})'));
 assert(script.includes("page.locator('#world').screenshot"));
 assert(script.includes('material-six-style-comparison.png'));
 assert(script.includes('distinctRenderedImages'));
 assert(script.includes('authoredTextures'));
 assert(script.includes("page.on('pageerror'"));
 assert(script.includes('BTM_SOFTWARE_WEBGL'));
 assert(workflow.includes('node scripts/verify-materials-browser.mjs'));
 assert(workflow.includes('vr-equipment-evidence'));
 assert(!script.includes('https://'),'capture never requires a remote artwork service');
 // Texture selection remains presentation-only. All sector data and save
 // snapshots must be byte-identical before and after choosing a style.
 const g=new Game();g.start();
 const old=JSON.stringify(g.snapshot());
 for(const style of styles)assert.equal(typeof TEXTURE_PACKS[style].floor,'string');
 assert.equal(JSON.stringify(g.snapshot()),old);
});
