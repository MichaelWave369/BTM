import {WORLD_SCALE,WALL_HEIGHT} from './spatial.js';
export const LEVEL_SCHEMA='mwori.level/1.0';
export const MATERIALS=[...Array.from({length:6},(_,i)=>'wall'+(i+1)),'floor','ceiling','white',...['plugged','repeater','enforcer','crawler','warden'].flatMap(type=>['enemy','pain'].flatMap(kind=>Array.from({length:4},(_,i)=>kind+':'+type+':'+i))),...['health','energy','armor','artifact','key'].map(t=>'item:'+t),'relay:off','relay:on','captive','ori',...['pod','console','speaker','lamp'].map(t=>'prop:'+t),...Array.from({length:4},(_,i)=>'sign:'+i),'portal','marker','signal:screen',...['gatekeeper','tyrant','mirror','abyss'].flatMap(id=>['pitboss:'+id,'pitboss:'+id+':open']),...['vent','arc','fracture','void'].map(id=>'hazard:'+id),'net:cyan','net:pink','net:downed','raid:core','raid:open','raid:pylon'];
const slots=new Map(MATERIALS.map((name,i)=>[name,i]));
export const materialUV=name=>{const i=slots.get(name)??slots.get('white'),x=i%16*64,y=Math.floor(i/16)*64;return [(x+2)/1024,(y+2)/1024,(x+62)/1024,(y+62)/1024];};
export function pushQuad(vertices,points,material='white',color=[1,1,1,1]){const uv=materialUV(material),coords=[[uv[0],uv[3]],[uv[2],uv[3]],[uv[2],uv[1]],[uv[0],uv[1]]];for(const i of [0,1,2,0,2,3])vertices.push(...points[i],...coords[i],...color);}
export function pushBox(vertices,center,size,material='white',color=[1,1,1,1]){const [x,y,z]=center,[w,h,d]=size.map(v=>v/2),p=[[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],[x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];for(const face of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]])pushQuad(vertices,face.map(i=>p[i]),material,color);}
const walkable=(level,x,y)=>level.cells[y]?.[x]===0||!!level.doors[x+','+y];
export function doorAxis(level,d){const ns=walkable(level,d.x,d.y-1)&&walkable(level,d.x,d.y+1),ew=walkable(level,d.x-1,d.y)&&walkable(level,d.x+1,d.y);return ns&&!ew?'z':'x';}
export function doorGeometry(level,d){const s=WORLD_SCALE,h=WALL_HEIGHT*s,axis=doorAxis(level,d);return {center:[(d.x+.5)*s,h*(.5+d.open),(d.y+.5)*s],size:axis==='x'?[.12,h,s]:[s,h,.12],material:'wall'+d.type,axis,solid:d.open<.84};}
export function buildLevelGeometry(level){
 const chunks=new Map(),s=WORLD_SCALE,h=WALL_HEIGHT*s,signs=new Map((level.signs||[]).map((o,i)=>[o.x+','+o.y,'sign:'+i]));
 const get=(x,y)=>{const key=Math.floor(x/8)+','+Math.floor(y/8);if(!chunks.has(key))chunks.set(key,{key,vertices:[],bounds:{min:[Math.floor(x/8)*8*s,0,Math.floor(y/8)*8*s],max:[(Math.floor(x/8)+1)*8*s,h,(Math.floor(y/8)+1)*8*s]}});return chunks.get(key).vertices;};
 for(let y=0;y<level.h;y++)for(let x=0;x<level.w;x++){
  const v=get(x,y),x0=x*s,x1=(x+1)*s,z0=y*s,z1=(y+1)*s;
  if(walkable(level,x,y)){pushQuad(v,[[x0,0,z1],[x1,0,z1],[x1,0,z0],[x0,0,z0]],'floor',[.9,.95,.9,1]);pushQuad(v,[[x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1]],'ceiling',[.6,.68,.66,1]);continue;}
  const material=signs.get(x+','+y)||'wall'+level.cells[y][x];
  if(walkable(level,x,y-1))pushQuad(v,[[x1,0,z0],[x0,0,z0],[x0,h,z0],[x1,h,z0]],material,[.94,.96,.94,1]);
  if(walkable(level,x,y+1))pushQuad(v,[[x0,0,z1],[x1,0,z1],[x1,h,z1],[x0,h,z1]],material,[.8,.86,.82,1]);
  if(walkable(level,x-1,y))pushQuad(v,[[x0,0,z0],[x0,0,z1],[x0,h,z1],[x0,h,z0]],material,[.72,.8,.75,1]);
  if(walkable(level,x+1,y))pushQuad(v,[[x1,0,z1],[x1,0,z0],[x1,h,z0],[x1,h,z1]],material,[.85,.9,.86,1]);
 }
 const result=[...chunks.values()].filter(c=>c.vertices.length).map(c=>({...c,vertices:new Float32Array(c.vertices),vertexCount:c.vertices.length/9}));
 return {schemaVersion:LEVEL_SCHEMA,scale:s,wallHeight:h,chunks:result,vertexCount:result.reduce((n,c)=>n+c.vertexCount,0),doorCount:Object.keys(level.doors).length};
}
export function exportLevelIR(level,definition){return {schemaVersion:LEVEL_SCHEMA,sector:level.index+1,name:definition.name,units:{tileMeters:WORLD_SCALE,wallHeightTiles:WALL_HEIGHT,coordinateSystem:'game x/y -> world X/Z; height -> Y'},grid:{width:level.w,height:level.h,cells:level.cells.map(r=>r.slice())},surfaces:MATERIALS.map(id=>({id,source:'owned-procedural:'+id})),collision:{model:'shared core grid',playerRadiusTiles:.2,doorPassThreshold:.84},spawn:{...definition.spawn},rooms:definition.rooms.map(r=>r.slice()),corridors:definition.halls.map(r=>r.slice()),regions:level.regions.map(r=>({...r,bounds:r.bounds.slice()})),doors:Object.values(level.doors).map(d=>({id:d.x+','+d.y,x:d.x,y:d.y,type:d.type,axis:doorAxis(level,d),material:'wall'+d.type})),entities:{enemies:definition.enemies.map(([type,x,y],id)=>({id,type,x,y})),items:definition.items.map(([type,x,y],id)=>({id,type,x,y})),captives:definition.captives.map(([x,y],id)=>({id,x,y})),props:level.props.map(p=>({...p}))},objectives:{relays:level.relays.map(r=>({id:r.id,x:r.x,y:r.y})),key:{x:level.key.x,y:level.key.y},extraction:{...level.exit}},secrets:{doors:Object.values(level.doors).filter(d=>d.type===6).map(d=>d.x+','+d.y)}};}
