import {PIT_BOSSES} from './pit.js';
import {hazardState} from './pit-combat.js';
const sprites=new Map();
export function pitBossSprite(id,open=false){
 const key=id+':'+open;if(sprites.has(key))return sprites.get(key);const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),color=PIT_BOSSES[id].color,core=open?'#fff5ca':color;
 const box=(x,y,w,h,fill)=>{g.fillStyle=fill;g.fillRect(x,y,w,h);},poly=(points,fill,stroke=color)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=stroke;g.lineWidth=2;g.stroke();};
 if(id==='gatekeeper'){
  box(23,73,17,18,'#475467');box(57,73,17,18,'#475467');poly([[23,16],[73,16],[81,67],[67,80],[28,80],[14,65]],'#313c4c');
  box(4,25,18,46,'#8a7661');box(75,25,18,46,'#8a7661');box(10,30,9,32,color);box(79,30,9,32,color);poly([[30,32],[66,32],[70,62],[48,75],[26,62]],'#171f2a');box(42,39,12,26,core);box(34,47,28,9,core);box(31,7,35,19,'#5c6873');box(38,14,20,5,core);
 }else if(id==='tyrant'){
  for(const x of [16,35,59,78]){box(x,5,3,36,'#a0b4c6');box(x-4,3,11,6,core);}poly([[17,36],[48,23],[80,36],[72,70],[48,83],[23,70]],'#293952');
  g.strokeStyle=color;g.lineWidth=5;g.beginPath();g.arc(48,52,22,0,Math.PI*2);g.stroke();poly([[48,32],[35,54],[46,54],[40,73],[61,47],[50,47]],core,core);box(32,83,32,4,color);box(40,90,16,3,color);
 }else if(id==='mirror'){
  poly([[48,3],[87,43],[70,80],[48,93],[24,80],[9,43]],'#35425e');poly([[48,13],[75,44],[48,79],[22,44]],'#111c31');
  for(const side of [-1,1])poly([[48+side*30,27],[48+side*44,48],[48+side*30,67],[48+side*21,48]],'#697891');poly([[48,28],[61,47],[48,64],[35,47]],core,core);box(45,37,6,24,'#0b1227');box(18,13,7,10,color);box(71,13,7,10,color);
 }else{
  poly([[48,1],[63,18],[81,7],[79,38],[94,56],[77,78],[61,81],[48,95],[34,81],[18,78],[2,56],[17,38],[15,7],[33,18]],'#422738');
  for(const [x,y,h]of [[13,36,35],[29,20,57],[58,20,57],[76,36,35]]){box(x,y,8,h,'#8c5b6b');box(x+2,y+3,3,h-6,color);}poly([[48,22],[67,51],[48,80],[29,51]],'#090e1b');g.fillStyle=core;g.beginPath();g.arc(48,50,12,0,Math.PI*2);g.fill();box(45,33,6,35,'#180d24');box(34,48,28,4,core);
 }
 sprites.set(key,c);return c;
}
export function paintHazardIcon(g,kind){
 g.clearRect(0,0,64,64);g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=4;g.strokeRect(5,5,54,54);
 if(kind==='vent')for(let i=0;i<4;i++)g.fillRect(14,14+i*10,36,4);
 else if(kind==='arc'){g.beginPath();g.moveTo(36,10);g.lineTo(20,34);g.lineTo(35,30);g.lineTo(27,54);g.lineTo(45,26);g.lineTo(31,29);g.stroke();}
 else if(kind==='fracture'){g.beginPath();g.moveTo(14,14);g.lineTo(50,50);g.moveTo(50,14);g.lineTo(14,50);g.stroke();}
 else{g.beginPath();g.arc(32,32,17,0,Math.PI*2);g.stroke();g.fillRect(29,18,6,28);}
}
export function pitFloorState(h,time){const s=hazardState(h,time);return s.active?'active':s.warning?'warning':'idle';}
