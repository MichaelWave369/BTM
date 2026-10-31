import test from 'node:test';import assert from 'node:assert/strict';
import {matIdentity} from '../src/immersive-math.js';
import {visualLeftPose} from '../src/left-hand-pose.js';
import {WristComputer,equipmentPanel,placeComfortCaption,panelAngularBounds,panelsOverlap} from '../src/equipment-math.js';
import {handMesh,oriMesh} from '../src/equipment-meshes.js';
import {OriFlight} from '../src/ori-comfort.js';
import {Game} from '../src/core.js';
import {WORLD_SCALE} from '../src/spatial.js';
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
test('seated, standing and inverted/tilted grips project the whole hologram above the worn glove',()=>{
 for(const eyeHeight of [1.4,1.65,1.8])for(const pitch of [-35,0,45])for(const roll of [-180,-90,0,90,180]){
  const head=matIdentity(),tracked=matIdentity(),visual=matIdentity();head[13]=eyeHeight;tracked[12]=-.22;tracked[13]=eyeHeight-.25;tracked[14]=-.5;visualLeftPose(visual,tracked,{vrLeftHandPitch:pitch,vrLeftHandRoll:roll});
  const original=Array.from(tracked),r={hasLeft:true,hasVisualLeft:true,leftWorld:tracked,leftVisualWorld:visual,eye:[0,eyeHeight,0],headWorld:head},w=new WristComputer();w.togglePin();for(let t=0;t<800;t+=25)w.update(r,{vrWristActivation:'manual'},t);
  assert(w.visible,`pose ${eyeHeight}/${pitch}/${roll}`);assert(w.panel.up[1]>0);let gloveTop=-Infinity;
  for(let i=0;i<handMesh('left').data.length;i+=9){const v=handMesh('left').data;gloveTop=Math.max(gloveTop,visual[1]*v[i]+visual[5]*v[i+1]+visual[9]*v[i+2]+visual[13]);}
  const p=w.panel,bottom=p.center[1]-Math.abs(p.up[1])*p.height/2-Math.abs(p.right[1])*p.width/2;assert(bottom>gloveTop+.006,`hand intersection ${pitch}/${roll}`);
  assert(p.center[0]<-.03);assert.deepEqual(Array.from(tracked),original);w.reset();assert(!w.visible&&!w.pinned);
 }
});
test('peripheral communications preserve the central angular lane, wrist and real hand aim',()=>{
 const head=matIdentity(),r={eye:[0,1.65,0],headWorld:head,headAngle:-Math.PI/2};const p=placeComfortCaption(equipmentPanel(),r),b=panelAngularBounds(p,r);assert(b.x-b.w>.26);assert(p.width<.7);
 const wrist=equipmentPanel(.32,.22);wrist.center.splice(0,3,...p.center);placeComfortCaption(p,r,{},wrist);assert(!panelsOverlap(p,wrist,r));
 r.aim={direction:{x:.47,y:-.83,z:-.28}};placeComfortCaption(p,r);assert(p.hidden||p.center[1]>r.eye[1]);
});
test('original Ori mesh has a 16cm core, <25cm total envelope and bounded cached geometry',()=>{
 const shapes=new Set();for(const state of ['idle','assist','scan','low']){const m=oriMesh(state),v=m.data,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=9)for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[i+k]);max[k]=Math.max(max[k],v[i+k]);}assert(m.vertexCount<2200);assert(v.every(Number.isFinite));assert(max.every((n,i)=>n-min[i]<.25));assert.equal(m,oriMesh(state));shapes.add(v.join(','));}assert.equal(shapes.size,4);
});
test('Ori flight remains right, avoids walls/targets and never mutates the canonical companion',()=>{
 const g=new Game();g.start();for(let y=1;y<24;y++)for(let x=1;x<28;x++)g.level.cells[y][x]=0;g.level.enemies=[];g.level.relays=[];g.level.captives=[];g.level.exit={x:1.5,y:1.5};const h=matIdentity(),r={eye:[g.player.x*WORLD_SCALE,1.65,g.player.y*WORLD_SCALE],headWorld:h};const original={...g.ori},flight=new OriFlight();
 for(let i=0;i<120;i++)flight.update(g,r,.016);assert(flight.visible);assert(flight.position[0]-r.eye[0]>.6);assert(Math.hypot(flight.position[0]-r.eye[0],flight.position[2]-r.eye[2])>=1.3);assert.deepEqual(g.ori,original);
 // A closed room boundary blocks every route to the right dock. Hide, never show through it.
 for(let y=1;y<24;y++)g.level.cells[y][Math.floor(g.player.x)+1]=1;
 const previous=flight.position.slice();flight.update(g,r,.016);assert(!flight.visible);assert.deepEqual(flight.position,previous);
});
