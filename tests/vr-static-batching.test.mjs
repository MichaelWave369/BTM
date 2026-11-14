import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLevel} from '../src/core.js';
import {buildLevelGeometry,packStaticChunkGeometry} from '../src/level-geometry.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all twelve BTM sector meshes pack losslessly into one static GPU vertex stream',()=>{
 for(let sector=0;sector<12;sector++){
  const geo=buildLevelGeometry(createLevel(sector));
  const packed=packStaticChunkGeometry(geo.chunks);
  assert.equal(packed.chunks.length,geo.chunks.length,'retain chunk-by-chunk visibility bounds');
  assert.equal(packed.vertices.length,geo.vertexCount*9,'do not add or drop any triangles');
  assert.equal(packed.vertices.length%9,0);
  let expectedFirst=0;
  for(let i=0;i<geo.chunks.length;i++){
   const old=geo.chunks[i],draw=packed.chunks[i];
   assert.equal(draw.key,old.key);
   assert.deepEqual(draw.bounds,old.bounds);
   assert.equal(draw.firstVertex,expectedFirst,'draw ranges are contiguous');
   assert.equal(draw.vertexCount,old.vertexCount);
   const from=draw.firstVertex*9,to=(draw.firstVertex+draw.vertexCount)*9;
   assert.deepEqual(packed.vertices.subarray(from,to),old.vertices,'exact vertex and texture UV data retained');
   expectedFirst+=old.vertexCount;
  }
  assert.equal(expectedFirst,geo.vertexCount);
 }
});

test('static packed geometry handles empty and invalid input safely',()=>{
 assert.deepEqual(packStaticChunkGeometry([]).chunks,[]);
 assert.equal(packStaticChunkGeometry([]).vertices.length,0);
 assert.throws(()=>packStaticChunkGeometry([{vertices:new Float32Array(10),vertexCount:1}]),/Invalid static geometry chunk/);
 assert.throws(()=>packStaticChunkGeometry([{vertices:new Float32Array(9),vertexCount:2}]),/Invalid static geometry chunk/);
});

test('Quest stereo renderer binds static map VBO once per eye while preserving culling and dynamic entities',()=>{
 const s=source('src/vr-world-renderer.js');
 assert(s.includes('packStaticChunkGeometry(this.geometry.chunks)'));
 assert(s.includes('g.bufferData(g.ARRAY_BUFFER,packed.vertices,g.STATIC_DRAW)'));
 assert(s.includes('this.bind(this.staticBuffer);'));
 assert(s.includes('g.drawArrays(g.TRIANGLES,c.firstVertex,c.vertexCount)'));
 assert(s.includes('chunkInRange(c.bounds,rig.eye,q.distance)&&inFrustum(c.bounds,this.planes)'),
  'each eye keeps independent distance and frustum culling');
 assert(s.includes('this.bind(this.dynamic);g.drawArrays(g.TRIANGLES,0,dynamic.length/9)'),
  'all animated entities still use the authoritative dynamic vertex buffer');
 assert(!s.includes('this.bind(c.buffer)'),'cannot rebind dozens of static VBOs on every eye');
 assert(!s.includes('g.deleteBuffer(c.buffer)'),'single shared static buffer is deleted exactly once');
 assert(s.includes('if(this.staticBuffer)g.deleteBuffer(this.staticBuffer)'));
});
