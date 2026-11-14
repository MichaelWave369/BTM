import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLevel,SECTORS,Game} from '../src/core.js';
import {WALL_HEIGHT,WORLD_SCALE} from '../src/spatial.js';
import {doorGeometry,buildLevelGeometry,materialUV,pushTiledWall} from '../src/level-geometry.js';
import {doorSurfaceMaterial} from '../src/door-visibility.js';
import {rampDoorClearance} from '../src/solo-vertical.js';
import {STACK_CEILING} from '../src/net/vertical-arena.js';

test('original and Pit door shells keep old height; all solo two-story doors seal the full ceiling',()=>{
 for(let index=0;index<12;index++){
  const flat=createLevel(index),tall=createLevel(index,'original',{verticalPreview:true});
  assert.equal(tall.vertical.ceiling,STACK_CEILING);
  for(const d of Object.values(tall.doors)){
   const shape=doorGeometry(tall,d);
   assert.equal(shape.size[1],STACK_CEILING*WORLD_SCALE,SECTORS[index].name);
   assert.equal(shape.center[1],shape.size[1]/2);
   assert.equal(shape.material,doorSurfaceMaterial(d.type));
   assert.equal(shape.solid,true);
   d.open=.5;
   assert.equal(doorGeometry(tall,d).center[1],shape.size[1], 'panel slides by its entire height');
   d.open=0;
  }
  for(const d of Object.values(flat.doors))assert.equal(doorGeometry(flat,d).size[1],WALL_HEIGHT*WORLD_SCALE);
  assert.deepEqual(tall.cells,flat.cells,'doors and underlying grid are unchanged');
 }
 for(let i=0;i<12;i++){
  const pit=createLevel(i,'pit');
  for(const d of Object.values(pit.doors))assert.equal(doorGeometry(pit,d).size[1],WALL_HEIGHT*WORLD_SCALE);
 }
});

test('tall wall texture bands repeat original texel density without bleeding between atlas tiles',()=>{
 const h=STACK_CEILING*WORLD_SCALE,step=WALL_HEIGHT*WORLD_SCALE;
 const points=[[0,0,0],[WORLD_SCALE,0,0],[WORLD_SCALE,h,0],[0,h,0]],v=[];
 const uv=materialUV('wall1');pushTiledWall(v,points,'wall1');
 assert.equal(v.length,3*6*9,'3 vertical texture bands (last cropped)');
 const bands=[v.slice(0,54),v.slice(54,108),v.slice(108)];
 for(const band of bands){
  const ys=[];for(let i=0;i<band.length;i+=9){ys.push(band[i+1]);assert(band[i+3]>=uv[0]-1e-8&&band[i+3]<=uv[2]+1e-8);
   assert(band[i+4]>=uv[1]-1e-8&&band[i+4]<=uv[3]+1e-8,'never sample neighbor atlas row');
  }
  assert(Math.max(...ys)-Math.min(...ys)<=step+1e-8);
 }
 assert(Math.abs(Math.min(...bands[0].filter((_,i)=>i%9===1)))<1e-8);
 assert(Math.abs(Math.max(...bands[2].filter((_,i)=>i%9===1))-h)<1e-8);
 const flat=[];pushTiledWall(flat,[[0,0,0],[1,0,0],[1,step,0],[0,step,0]],'wall1');
 assert.equal(flat.length,54,'one tile map remains one quad');
 const preview=createLevel(0,'original',{verticalPreview:true}),ordinary=createLevel(0);
 assert(buildLevelGeometry(preview).vertexCount>buildLevelGeometry(ordinary).vertexCount);
});

test('ramp footprints reserve a one-tile door apron for all twelve levels',()=>{
 for(let index=0;index<12;index++){
  const level=createLevel(index,'original',{verticalPreview:true}),r=level.vertical.ramp;
  assert(rampDoorClearance(level,r),SECTORS[index].name+' must leave room to operate every door');
  for(const d of Object.values(level.doors)){
   for(let y=r.y0;y<r.y1;y++)for(let x=r.x0;x<r.x1;x++)
    assert(Math.abs(d.x-x)>1||Math.abs(d.y-y)>1,SECTORS[index].name+' door '+d.x+','+d.y);
  }
 }
 assert.equal(createLevel(0,'original',{verticalPreview:true}).vertical.ramp.x0,10);
 const l=createLevel(0);
 assert.equal(rampDoorClearance(l,{x0:8,x1:10,y0:20,y1:21}),false,'test fixture directly crowds the known door');
});

test('native VR door mesh and wall sealing share the same atlas and keep the secret disguised',()=>{
 const level=createLevel(0,'original',{verticalPreview:true});
 const secret=Object.values(level.doors).find(d=>d.type===6);
 assert(secret);
 assert.equal(doorSurfaceMaterial(secret.type),'wall6','unrevealed secret must still appear to be a wall');
 assert.equal(doorGeometry(level,secret).size[1],STACK_CEILING*WORLD_SCALE);
 const world=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 assert(world.includes('for(let bottom=0;bottom<height-.00001;bottom+=tile)'),'each tall door must be drawn in height bands');
 assert(world.includes('doorFrameParts(v,d.type,game.shift)'),'door jambs still remain stationary');
 const geometry=readFileSync(new URL('../src/level-geometry.js',import.meta.url),'utf8');
 assert(geometry.includes('pushTiledWall(v,'));
});
