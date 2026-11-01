import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WEAPONS} from '../src/core.js';
import {matIdentity} from '../src/immersive-math.js';
import {OriFlight,oriVisualTarget} from '../src/ori-comfort.js';
import {equipmentPanel,placeComfortCaption,panelAngularBounds,panelsOverlap} from '../src/equipment-math.js';
import {traceTrackedShot,WORLD_SCALE} from '../src/spatial.js';

function openRoom(){
 const game=new Game();game.start();
 const w=25,h=25;
 Object.assign(game.level,{w,h,cells:Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>!x||!y||x===w-1||y===h-1?1:0)),doors:{},enemies:[],relays:[],captives:[],exit:{x:23.5,y:23.5}});
 game.player.x=game.player.y=12.5;
 return game;
}
function rigFor(game,height=1.65,angle=0){
 const head=matIdentity(),c=Math.cos(angle),s=Math.sin(angle);
 head[0]=c;head[2]=-s;head[8]=s;head[10]=c;head[13]=height;
 return {headWorld:head,headAngle:angle-Math.PI/2,eye:[game.player.x*WORLD_SCALE,height,game.player.y*WORLD_SCALE]};
}
test('Ori remains in the visible right glance lane without changing companion simulation',()=>{
 const game=openRoom(),original=JSON.stringify(game.ori),rig=rigFor(game);
 const flight=new OriFlight();for(let i=0;i<120;i++)flight.update(game,rig,.016);
 assert(flight.visible,flight.reason);
 const dx=flight.position[0]-rig.eye[0],dz=flight.position[2]-rig.eye[2];
 const right=rig.headWorld[0]*dx+rig.headWorld[2]*dz;
 const forward=-rig.headWorld[8]*dx-rig.headWorld[10]*dz;
 const yaw=Math.atan2(right,forward)*180/Math.PI;
 assert(yaw>=17&&yaw<=29,'Ori should be glanceable, got '+yaw.toFixed(2)+'°');
 assert(flight.position[1]>rig.eye[1]&&flight.position[1]<rig.eye[1]+.25);
 assert.equal(JSON.stringify(game.ori),original,'Ori visual motion may not write to gameplay state');
 const target=oriVisualTarget({eye:rig.eye,head:rig.headWorld,x:0,z:0});
 assert.equal(target.x,flight.position[0]);assert.equal(target.z,flight.position[2]);
});
test('Ori follows head direction across seated/standing and quarter turns in an empty room',()=>{
 for(const height of [1.4,1.65,1.8])for(const theta of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const g=openRoom(),rig=rigFor(g,height,theta),flight=new OriFlight();
  flight.update(g,rig,.016);
  assert(flight.visible,`head pose ${height}/${theta}: ${flight.reason}`);
  const dx=flight.position[0]-rig.eye[0],dz=flight.position[2]-rig.eye[2];
  const front=-rig.headWorld[8]*dx-rig.headWorld[10]*dz,right=rig.headWorld[0]*dx+rig.headWorld[2]*dz;
  assert(front>1&&right>.5&&right<1,'Ori must remain in front-right of head');
 }
});
test('Walls block Ori rather than drawing it through architecture',()=>{
 const g=openRoom(),rig=rigFor(g),flight=new OriFlight();
 flight.update(g,rig,.016);assert(flight.visible);
 const x=Math.floor(g.player.x);
 for(let y=1;y<24;y++)g.level.cells[y][x+1]=1;
 flight.update(g,rig,.016);assert.equal(flight.visible,false);
 assert.equal(flight.reason,'no-clear-right-dock');
});
test('Captions dock below Ori, within a natural right-hand glance, without central aim overlap',()=>{
 const game=openRoom(),rig=rigFor(game),flight=new OriFlight();
 flight.update(game,rig,.016);
 const panel=placeComfortCaption(equipmentPanel(),rig,{oriVisible:true,oriPosition:new Float32Array(flight.position)});
 const ang=panelAngularBounds(panel,rig);
 assert(!panel.hidden);
 assert(ang.x*180/Math.PI>=20&&ang.x*180/Math.PI<28,'right-side caption angle');
 assert(ang.x-ang.w>.26,'caption inner edge must clear central aiming lane');
 assert(panel.center[1]<rig.eye[1]-.25,'caption should sit below eye level');
 const ori={...equipmentPanel(.26,.26),center:[...flight.position]};
 assert(!panelsOverlap(panel,ori,rig),'Ori and caption must occupy different visual lanes');
});
test('Caption fallback yields to the actual right-hand firing ray',()=>{
 const g=openRoom(),r=rigFor(g),p=equipmentPanel();
 r.aim={direction:{x:.68,y:-1.42,z:-.36}};
 placeComfortCaption(p,r,{level:g.level});
 if(!p.hidden){
  const b=panelAngularBounds(p,r),yaw=Math.atan2(.68,1.42),pitch=Math.atan2(-.36,Math.hypot(.68,1.42));
  assert(Math.abs(yaw-b.x)>=b.w+.09||Math.abs(pitch-b.y)>=b.h+.09);
 }
});
test('Tracked shots continue to respect ray, spread and solid wall occlusion',()=>{
 const g=openRoom(),level=g.level;
 level.enemies=[{x:14.5,y:10.5,type:'plugged',dead:false}];
 const origin={x:10.5,y:10.5,height:.7};
 assert.equal(traceTrackedShot(level,{origin,direction:{x:1,y:0,z:0}},WEAPONS[1]).targets.length,1);
 assert.equal(traceTrackedShot(level,{origin,direction:{x:1,y:.45,z:0}},WEAPONS[1]).targets.length,0);
 level.cells[10][12]=1;
 assert.equal(traceTrackedShot(level,{origin,direction:{x:1,y:0,z:0}},WEAPONS[1]).targets.length,0);
});
