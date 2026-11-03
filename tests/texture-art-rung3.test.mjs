import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {
 ART_SURFACES,AUTHORED_NEW_STYLES,ART_TILE_SIZE,renderAuthoredTile,encodeTilePNG
} from '../scripts/author-texture-tiles.mjs';
import {
 AUTHORED_TEXTURE_MANIFESTS,loadAuthoredTexturePack,textureStyleFor,
 AUTO_MATERIAL_ASSIGNMENTS,textureTileSize,TEXTURE_PACKS
} from '../src/texture-packs.js';
import {Game} from '../src/core.js';

function parsePNG(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 let offset=8,width=0,height=0,compressed=[];
 while(offset<bytes.length){
  const len=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
  const payload=bytes.subarray(offset+8,offset+8+len);
  if(type==='IHDR'){width=payload.readUInt32BE(0);height=payload.readUInt32BE(4);
   assert.equal(payload[8],8);assert.equal(payload[9],2);}
  if(type==='IDAT')compressed.push(payload);
  offset+=12+len;
  if(type==='IEND')break;
 }
 return{width,height,pixels:inflateSync(Buffer.concat(compressed))};
}
test('all three missing art families are eight real distinct first-party PNG surfaces',()=>{
 const signatures=new Set();
 assert.deepEqual(AUTHORED_NEW_STYLES,['cyberpunk','horror','corporate']);
 assert.deepEqual(ART_SURFACES,['wall1','wall2','wall3','wall4','wall5','wall6','floor','ceiling']);
 for(const style of AUTHORED_NEW_STYLES){
  const local=new Set();
  for(const material of ART_SURFACES){
   const rgb=renderAuthoredTile(style,material),image=encodeTilePNG(rgb);
   const parsed=parsePNG(image);
   assert.deepEqual([parsed.width,parsed.height],[ART_TILE_SIZE,ART_TILE_SIZE]);
   assert.equal(parsed.pixels.length,256*(1+256*3));
   assert(image.length>2000&&image.length<240000,style+'/'+material+' bounded original tile');
   assert.equal(rgb.length,ART_TILE_SIZE*ART_TILE_SIZE*3);
   const sha=createHash('sha256').update(image).digest('hex');
   assert(!signatures.has(sha),'no two 256px tiles should be identical');
   signatures.add(sha);local.add(sha);
   const paletteValues=new Set();
   for(let i=0;i<rgb.length;i+=243)paletteValues.add(rgb[i]);
   assert(paletteValues.size>12,'surface must have authored tonal variation '+style+'/'+material);
   const manifest=AUTHORED_TEXTURE_MANIFESTS[style];
   assert(manifest&&Object.keys(manifest.surfaces).length===8,style+' manifest');
   assert.equal(manifest.surfaces[material],material+'.png');
  }
  assert.equal(local.size,8);
 }
 assert.equal(signatures.size,24);
});
test('RGB image pipeline preserves useful warning/edge contrast across the five authored packs',()=>{
 for(const style of AUTHORED_NEW_STYLES){
  for(const material of ['wall5','wall6','floor','ceiling']){
   const rgb=renderAuthoredTile(style,material);let min=255,max=0;
   for(let i=0;i<rgb.length;i+=3*17){
    const lum=(rgb[i]*.2126+rgb[i+1]*.7152+rgb[i+2]*.0722);
    min=Math.min(min,lum);max=Math.max(max,lum);
   }
   assert(max-min>48,'visible authored highlight range '+style+'/'+material+': '+(max-min));
  }
 }
});
test('auto style uses authored stage/Pit/arena metadata while explicit user overrides always win',()=>{
 assert.equal(AUTO_MATERIAL_ASSIGNMENTS.original.length,12);
 assert.equal(AUTO_MATERIAL_ASSIGNMENTS.pit.length,4);
 const g=new Game();g.start();const before=JSON.stringify(g.snapshot());
 for(let i=0;i<12;i++)assert.equal(textureStyleFor({campaign:'original',index:i},{textureStyle:'auto'}),AUTO_MATERIAL_ASSIGNMENTS.original[i]);
 for(let i=0;i<12;i++)assert.equal(textureStyleFor({campaign:'pit',index:i},{textureStyle:'auto'}),AUTO_MATERIAL_ASSIGNMENTS.pit[Math.floor(i/3)]);
 for(const [label,expected]of Object.entries(AUTO_MATERIAL_ASSIGNMENTS.arena))
  assert.equal(textureStyleFor({campaign:'arena',palette:{name:label}},{textureStyle:'auto'}),expected);
 assert.equal(textureStyleFor({campaign:'raid'},{textureStyle:'auto'}),'matrix-facility');
 for(const style of Object.keys(TEXTURE_PACKS)){
  for(const campaign of ['original','pit','arena','raid'])
   assert.equal(textureStyleFor({campaign,index:3},{textureStyle:style}),style);
 }
 assert.equal(JSON.stringify(g.snapshot()),before,'local artwork cannot change simulation');
});
test('quality tiers cap memory and unavailable local packs use only existing safe fallback',async()=>{
 for(const vrQuality of ['performance','balanced','high']){
  const size=textureTileSize({textureStyle:'cyberpunk',textureQuality:'ultra',vrQuality},1024);
  assert(size<=64,'sub-2048 GPU texture caps stay bounded');
 }
 assert.equal(textureTileSize({textureQuality:'enhanced',vrQuality:'balanced'},4096),128);
 assert.equal(textureTileSize({textureQuality:'ultra',vrQuality:'high'},4096),256);
 assert.deepEqual(await loadAuthoredTexturePack('cyberpunk',()=>null),{});
 assert.deepEqual(await loadAuthoredTexturePack('horror',()=>null),{});
 assert.deepEqual(await loadAuthoredTexturePack('corporate',()=>null),{});
 const image={naturalWidth:256,naturalHeight:256};
 const textures=await loadAuthoredTexturePack('corporate',async url=>url.includes('wall1')?image:null);
 assert.equal(textures.wall1,image);assert.equal(Object.keys(textures).length,1);
 const vr=readFileSync(new URL('../src/vr-world-renderer.js',import.meta.url),'utf8');
 const classic=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
 assert(vr.includes('createWorldAtlas'));
 assert(vr.includes('this.imageRevision++'));
 assert(classic.includes('this.packRevision++'));
 assert(classic.includes("if(authored)"));
});
test('production build creates PNGs and surface comparison sheet without external image services',()=>{
 const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 const source=readFileSync(new URL('../scripts/author-texture-tiles.mjs',import.meta.url),'utf8');
 assert(build.includes('await writeRung3Tiles(path.join(root,\'dist\'))'));
 assert(build.includes('authoredRung3.count!==24'));
 assert(source.includes("rung3-material-matrix.png"));
 assert(!source.includes('fetch('));
 assert(!source.includes('https://'));
});
