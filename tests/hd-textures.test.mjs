import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {SURFACE_MATERIALS,AUTHORED_TEXTURE_MANIFESTS,textureTileSize,loadAuthoredTexturePack,textureStyleFor,validateTextureManifest} from '../src/texture-packs.js';

const ART_STYLES=['industrial','matrix-facility'];
const bytes=async (style,material)=>readFile(new URL('../public/texture-packs/'+style+'/'+material+'.png',import.meta.url));

function unpackPng(file){
 assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 let pos=8,width=0,height=0,idats=[],ended=false;
 while(pos+12<=file.length){
  const size=file.readUInt32BE(pos);const name=file.toString('ascii',pos+4,pos+8),data=file.subarray(pos+8,pos+8+size);
  assert.ok(pos+12+size<=file.length,'PNG chunk must fit');
  if(name==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],2);}
  if(name==='IDAT')idats.push(data);
  pos+=size+12;if(name==='IEND'){ended=true;break;}
 }
 assert.ok(ended&&idats.length>0);
 const rgba=inflateSync(Buffer.concat(idats));
 assert.equal(rgba.length,(width*3+1)*height);
 for(let y=0;y<height;y++)assert.equal(rgba[y*(width*3+1)],0);
 return {width,height,pixels:rgba};
}
test('Industrial and Matrix Facility ship sixteen original 256x256 PNG material images',async()=>{
 assert.deepEqual(Object.keys(AUTHORED_TEXTURE_MANIFESTS),ART_STYLES);
 const pictures=[];
 for(const style of ART_STYLES){
  const manifest=AUTHORED_TEXTURE_MANIFESTS[style];
  const paths=validateTextureManifest(manifest,style);
  assert.deepEqual(Object.keys(paths),SURFACE_MATERIALS);
  const patterns=[];
  for(const material of SURFACE_MATERIALS){
   const data=await bytes(style,material),decoded=unpackPng(data);
   assert.equal(decoded.width,256);assert.equal(decoded.height,256);
   assert.ok(data.length>100000&&data.length<300000,style+'/'+material);
   const pixels=decoded.pixels;const colors=new Set();
   for(let y=0;y<256;y+=11)for(let x=0;x<256;x+=13){
    const p=y*769+1+x*3;colors.add(pixels[p]+','+pixels[p+1]+','+pixels[p+2]);
   }
   assert.ok(colors.size>16,style+'/'+material+' must contain multiple distinct surface colors (got '+colors.size+')');
   patterns.push([...colors].sort().join('|'));
   pictures.push([style,material,data.length]);
  }
  assert.equal(new Set(patterns).size,SURFACE_MATERIALS.length,'all eight materials must have distinct authored looks');
 }
 assert.equal(pictures.length,16);
});
test('image loading remains local, optional, dimension-safe and fallbacks are handled',async()=>{
 const visited=[];
 const loaded=await loadAuthoredTexturePack('industrial',async url=>{
  visited.push(url);if(url.endsWith('/floor.png'))throw Error('Offline');
  if(url.endsWith('/ceiling.png'))return {naturalWidth:32,naturalHeight:32};
  return {naturalWidth:256,naturalHeight:256};
 });
 assert.equal(visited.length,8);
 assert.equal(Object.keys(loaded).length,6,'bad image dimensions or offline floor must not take down the pack');
 assert.ok(Object.isFrozen(loaded));
 assert.deepEqual(await loadAuthoredTexturePack('retro',async()=>{throw Error('Should not load');}),{});
 for(const url of visited)assert.match(url,/^\.\/texture-packs\/industrial\/(?:wall[1-6]|floor|ceiling)\.png$/);
});
test('atlas tiers obey GPU limits and default Quest profile while maintaining the original Retro path',()=>{
 assert.equal(textureTileSize({textureQuality:'retro',vrQuality:'high'},4096),64);
 assert.equal(textureTileSize({textureQuality:'enhanced',vrQuality:'balanced'},4096),128);
 assert.equal(textureTileSize({textureQuality:'ultra',vrQuality:'high'},4096),256);
 assert.equal(textureTileSize({textureQuality:'ultra',vrQuality:'balanced'},4096),128);
 assert.equal(textureTileSize({textureQuality:'ultra',vrQuality:'high'},2048),128);
 assert.equal(textureTileSize({textureQuality:'ultra',vrQuality:'performance'},4096),64);
 assert.equal(textureTileSize({textureQuality:'enhanced',vrQuality:'high'},1024),64);
 assert.equal(textureStyleFor({index:0},{textureStyle:'retro'}),'retro');
});
test('HD atlas builds remain visual-only; source paths and image loaders are wired',async()=>{
 const file=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const [atlas,vr,classic,serve,ui]=await Promise.all([
  file('src/world-atlas.js'),file('src/vr-world-renderer.js'),file('src/renderer.js'),file('scripts/serve.mjs'),file('index.html')
 ]);
 assert.match(atlas,/canvas\.width = canvas\.height = 16 \* tileSize/);
 assert.match(atlas,/authored\[material\]/);
 assert.match(vr,/loadAuthoredTexturePack\(style\)/);
 assert.match(vr,/this\.packCache\.set\(style,images\)/);
 assert.match(vr,/textureTileSize\(data\.settings/);
 assert.match(classic,/loadAuthoredTexturePack\(style\)/);
 assert.match(serve,/image\/png/);
 assert.match(ui,/Industrial and Matrix Facility now use original 256px image materials/);
});
