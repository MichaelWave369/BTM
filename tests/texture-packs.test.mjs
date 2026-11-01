import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 SURFACE_MATERIALS,TEXTURE_QUALITY,TEXTURE_PACKS,TEXTURE_STYLES,
 textureSettings,textureStyleFor,textureSignature,validateTextureManifest,paintPackSurface
} from '../src/texture-packs.js';

test('six registered material styles plus auto and all eight surface classes',()=>{
 assert.equal(Object.keys(TEXTURE_PACKS).length,6);
 assert.deepEqual(TEXTURE_STYLES,['auto','retro','industrial','cyberpunk','horror','corporate','matrix-facility']);
 assert.deepEqual(SURFACE_MATERIALS,['wall1','wall2','wall3','wall4','wall5','wall6','floor','ceiling']);
 assert.deepEqual(TEXTURE_QUALITY,['retro','enhanced','ultra']);
 for(const [key,pack]of Object.entries(TEXTURE_PACKS)){
  assert.equal(typeof pack.label,'string',key);
  for(const k of ['wall','floor','ceiling','edge','accent'])assert.match(pack[k],/^#[0-9a-f]{6}$/i,key+'/'+k);
 }
});
test('invalid, legacy and unexpected preferences fall back safely to the actual original retro renderer',()=>{
 assert.deepEqual(textureSettings(),{textureStyle:'retro',textureQuality:'enhanced'});
 assert.deepEqual(textureSettings({textureStyle:'remote-evil',textureQuality:'1080p'}),textureSettings());
 assert.deepEqual(textureSettings({textureStyle:null,textureQuality:null}),textureSettings());
 assert.equal(textureStyleFor({index:0},{}),'retro');
 assert.equal(textureSignature({index:0},{}),'retro/enhanced');
});
test('auto picks deterministic theme without changing stage, campaign or network state',()=>{
 const stage={index:2,campaign:'original',cells:[[0]],enemies:[],doors:{},seed:'dont-change'};
 const before=JSON.stringify(stage);
 assert.equal(textureStyleFor(stage,{textureStyle:'auto'}),'corporate');
 assert.equal(textureStyleFor({...stage,campaign:'pit'},{textureStyle:'auto'}),'horror');
 assert.equal(textureStyleFor({...stage,campaign:'arena'},{textureStyle:'auto'}),'cyberpunk');
 assert.equal(textureStyleFor({...stage,campaign:'raid'},{textureStyle:'auto'}),'matrix-facility');
 assert.equal(textureStyleFor(stage,{textureStyle:'industrial'}),'industrial');
 assert.equal(JSON.stringify(stage),before);
});
test('material manifests validate locally bounded first-party image paths',()=>{
 const ok=validateTextureManifest({schema:'btm.texture-pack/1',style:'industrial',surfaces:{wall1:'steel-panel.webp',floor:'grate.png',ceiling:'vents.jpg'}},'industrial');
 assert.equal(ok.wall1,'./texture-packs/industrial/steel-panel.webp');
 assert.equal(ok.floor,'./texture-packs/industrial/grate.png');
 assert.ok(Object.isFrozen(ok));
 const manifest=(surfaces)=>({schema:'btm.texture-pack/1',style:'industrial',surfaces});
 for(const bad of ['https://host.com/steal.png','../../secret.png','/absolute.png','..\\secret.webp','evil.svg','a?size=huge.png','data:image/png;base64,fff']){
  assert.throws(()=>validateTextureManifest(manifest({floor:bad}),'industrial'),/Unsafe/);
 }
 assert.throws(()=>validateTextureManifest(manifest({enemy:'alter.png'}),'industrial'),/Unsafe/);
 assert.throws(()=>validateTextureManifest(manifest({floor:'good.png'}),'not-installed'),/Invalid/);
 assert.throws(()=>validateTextureManifest({schema:'bad',style:'industrial',surfaces:{}},'industrial'),/Invalid/);
});
function recordingContext(){
 const calls=[];
 const g={fillStyle:'#000',strokeStyle:'#000',lineWidth:1,globalAlpha:1,
  fillRect(x,y,w,h){calls.push(['fill',this.fillStyle,x,y,w,h]);},
  strokeRect(x,y,w,h){calls.push(['strokeRect',this.strokeStyle,x,y,w,h]);},
  beginPath(){calls.push(['begin']);},
  moveTo(x,y){calls.push(['move',x,y]);},
  lineTo(x,y){calls.push(['line',x,y]);},
  stroke(){calls.push(['stroke',this.strokeStyle]);},
  drawImage(){calls.push(['image']);}
 };
 return {g,calls};
}
test('all six styles paint distinct wall, floor and ceiling tiles at each tier',()=>{
 for(const material of ['wall1','floor','ceiling']){
  const signatures=new Set();
  for(const textureStyle of Object.keys(TEXTURE_PACKS)){
   const {g,calls}=recordingContext();
   assert.equal(paintPackSurface(g,material,{index:0},{textureStyle,textureQuality:'enhanced'}),true);
   assert.ok(calls.length>4,textureStyle+' '+material);
   signatures.add(JSON.stringify(calls));
  }
  assert.equal(signatures.size,6,material+' visual styles must actually differ');
  for(const textureQuality of TEXTURE_QUALITY){
   const {g,calls}=recordingContext();
   assert.equal(paintPackSurface(g,material,{index:0},{textureStyle:'industrial',textureQuality}),true);
   assert.ok(calls.length>6);
  }
 }
 const {g}=recordingContext();assert.equal(paintPackSurface(g,'enemy:warden',{index:0},{}),false);
});
test('both renderers and Picture settings are wired to style switching without modifying simulation',async()=>{
 const file=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const [atlas,vr,classic,main,index,build]=await Promise.all(['src/world-atlas.js','src/vr-world-renderer.js','src/renderer.js','src/main.js','index.html','scripts/build.mjs'].map(file));
 assert.match(atlas,/surface\('wall'\+i/);
 assert.match(atlas,/floor: surface\('floor'\)/);
 assert.match(atlas,/ceiling: surface\('ceiling'\)/);
 assert.match(vr,/this\.textureKey!==key/);
 assert.match(vr,/this\.level!==level/);
 assert.match(classic,/currentTextureKey!==textureSignature/);
 assert.match(index,/id="textureStyle"/);assert.match(index,/id="textureQuality"/);
 assert.match(main,/textureSettings\(stored\)/);
 assert.match(build,/\.\/src\/texture-packs\.js/);
});
