import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLevel,Game} from '../src/core.js';
import {doorGeometry,MATERIALS,materialUV} from '../src/level-geometry.js';
import {DOOR_MATERIALS,DOOR_COLORS,doorKind,doorSurfaceMaterial,doorFrameParts,paintDoorSurface} from '../src/door-visibility.js';
import {TEXTURE_PACKS} from '../src/texture-packs.js';
import {WALL_HEIGHT,WORLD_SCALE} from '../src/spatial.js';
import {WorldScene} from '../src/world-scene.js';
import {matIdentity} from '../src/immersive-math.js';
import {ImmersiveRig} from '../src/immersive-rig.js';

test('type 4 normal and type 5 key-locked doors get explicit atlas slots, secrets stay disguised by default',()=>{
 assert.deepEqual(DOOR_MATERIALS,['door:standard','door:locked','door:secret']);
 assert.equal(doorKind(4),'standard');assert.equal(doorKind(5),'locked');
 assert.equal(doorKind(6),null);assert.equal(doorKind(6,true),'secret');
 assert.equal(doorSurfaceMaterial(4),'door:standard');
 assert.equal(doorSurfaceMaterial(5),'door:locked');
 assert.equal(doorSurfaceMaterial(6),'wall6');
 assert.equal(doorSurfaceMaterial(6,true),'door:secret');
 const seen=new Set(MATERIALS.map(name=>materialUV(name).join(',')));
 assert.equal(seen.size,MATERIALS.length,'new door materials must not alias existing atlas UV slots');
 for(const name of DOOR_MATERIALS)assert.ok(MATERIALS.includes(name));
 // Previously existing material coordinates are immutable across this presentation-only change.
 assert.deepEqual(materialUV('wall1'),[2/1024,2/1024,62/1024,62/1024]);
 assert.deepEqual(materialUV('floor'),[(6*64+2)/1024,2/1024,(6*64+62)/1024,62/1024]);
});
test('all original and Pit stages render regular/locked doors as doors without changing objective grid or saves',()=>{
 const g=new Game();
 for(let i=0;i<12;i++){
  const level=createLevel(i);
  const before=JSON.stringify(level.cells);
  for(const d of Object.values(level.doors)){
   const geo=doorGeometry(level,d);
   assert.equal(geo.material,doorSurfaceMaterial(d.type));
   assert.equal(geo.solid,true);
   assert.equal(geo.size[1],WALL_HEIGHT*WORLD_SCALE);
   assert.equal(doorFrameParts(geo,d.type).length,d.type===6?0:4);
   assert.deepEqual(doorFrameParts(geo,d.type,true).length,4);
  }
  assert.equal(JSON.stringify(level.cells),before);
 }
 g.start();
 const before=JSON.stringify(g.snapshot());
 const d=Object.values(g.level.doors).find(x=>x.type===4);
 assert.ok(d);
 const geo=doorGeometry(g.level,d);
 d.open=.83;assert.equal(doorGeometry(g.level,d).solid,true);
 d.open=.84;assert.equal(doorGeometry(g.level,d).solid,false);
 assert.equal(geo.material,'door:standard');
 d.open=0;assert.equal(JSON.stringify(g.snapshot()),before);
});
test('VR jambs stay on the opening and do not follow the sliding panel',()=>{
 const level=createLevel(0),d=Object.values(level.doors).find(x=>x.type===4);
 const closed=doorGeometry(level,d),frameBefore=doorFrameParts(closed,d.type);
 assert.equal(frameBefore.length,4);
 const positions=frameBefore.map(part=>part.center.join(','));
 assert.ok(frameBefore.every(part=>part.color===DOOR_COLORS.standard));
 d.open=.75;
 const moving=doorGeometry(level,d),frameAfter=doorFrameParts(moving,d.type);
 assert.deepEqual(frameAfter.map(part=>part.center.join(',')),positions);
 assert.ok(moving.center[1]>closed.center[1]);
 assert.equal(doorFrameParts(doorGeometry(level,{...d,type:6}),6,false).length,0);
 assert.ok(doorFrameParts(doorGeometry(level,{...d,type:6}),6,true).every(part=>part.color===DOOR_COLORS.secret));
});
function recorder(){
 const calls=[],g={fillStyle:'',strokeStyle:'',lineWidth:1,
  fillRect(x,y,w,h){calls.push(['fill',this.fillStyle,x,y,w,h]);},
  strokeRect(x,y,w,h){calls.push(['stroke',this.strokeStyle,x,y,w,h]);}
 };
 return {g,calls};
}
test('all six styles paint visually distinctive standard, locked and revealed door art',()=>{
 for(const [style]of Object.entries(TEXTURE_PACKS)){
  const shapes=[];
  for(const kind of ['standard','locked','secret']){
   const {g,calls}=recorder();
   assert.equal(paintDoorSurface(g,kind,{index:0},{textureStyle:style}),true);
   const strokes=calls.filter(c=>c[0]==='stroke');
   assert.ok(strokes.length>=2);
   const highContrast={standard:'#5df6ec',locked:'#ffcb60',secret:'#bc84ff'}[kind];
   assert.ok(calls.some(c=>c[1]===highContrast),style+'/'+kind+' must retain a distinct visible accent');
   shapes.push(JSON.stringify(calls));
  }
  assert.equal(new Set(shapes).size,3,'door types must remain visually different in '+style);
 }
 const {g}=recorder();assert.equal(paintDoorSurface(g,'unknown',{index:0}),false);
});
test('WorldScene renders normal and locked door frames but never reveals hidden secrets early',()=>{
 const game=new Game();game.start();const scene=new WorldScene();
 const head=matIdentity();head[13]=1.65;
 const rig=new ImmersiveRig();rig.prepare(game,{head,rightRay:head},null,{},.014);
 const untouched=JSON.stringify(game.snapshot());
 const batch=scene.update(game,rig,0,{vrQuality:'balanced'});
 assert.ok(batch.length>0);assert.equal(batch.dropped,0);
 assert.equal(JSON.stringify(game.snapshot()),untouched);
 const src=await readFile(new URL('../src/world-scene.js',import.meta.url),'utf8');
 assert.match(src,/doorFrameParts\(v,d\.type,game\.shift\)/);
 assert.match(src,/doorSurfaceMaterial\(d\.type,game\.shift\)/);
});
test('VR atlas, classic renderer, and service worker all include distinct door surfaces',async()=>{
 const file=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const [atlas,classic,geometry,build]=await Promise.all([
  file('src/world-atlas.js'),file('src/renderer.js'),file('src/level-geometry.js'),file('scripts/build.mjs')
 ]);
 for(const key of DOOR_MATERIALS)assert.ok(atlas.includes("'"+key+"'"),key);
 assert.match(classic,/door\?doorKind\(door\.type,game\.shift\)/);
 assert.match(classic,/paintDoorSurface\(tile\.getContext/);
 assert.match(geometry,/\.\.\.DOOR_MATERIALS/);
 assert.match(build,/src\/door-visibility\.js/);
});
