import {TEXTURE_PACKS,textureStyleFor} from './texture-packs.js';

// Door readability is presentation-only. The original grid, secret discovery,
// collision and lock rules remain owned by Game and collision.js.
export const DOOR_MATERIALS=Object.freeze(['door:standard','door:locked','door:secret']);
export const DOOR_COLORS=Object.freeze({
 standard:Object.freeze([.12,.93,1,1]),
 locked:Object.freeze([1,.74,.25,1]),
 secret:Object.freeze([.72,.38,1,1])
});
export function doorKind(type,vision=false){
 return type===4?'standard':type===5?'locked':type===6&&vision?'secret':null;
}
export function doorSurfaceMaterial(type,vision=false){
 const kind=doorKind(type,vision);
 return kind?'door:'+kind:'wall'+type;
}
export function doorFrameParts(shape,type,vision=false){
 const kind=doorKind(type,vision);
 if(!kind)return [];
 const h=shape.size[1],width=Math.max(shape.size[0],shape.size[2]);
 const [x,,z]=shape.center;
 const alongX=shape.axis==='z';
 const post=(offset)=>{
  const center=alongX?[x+offset,h/2,z]:[x,h/2,z+offset];
  return {center,size:alongX?[.085,h,.16]:[.16,h,.085],color:DOOR_COLORS[kind]};
 };
 const lintel={center:[x,h-.048,z],size:alongX?[width,.096,.16]:[.16,.096,width],color:DOOR_COLORS[kind]};
 const status={center:alongX?[x+width*.37,h*.45,z]:[x,h*.45,z+width*.37],
  size:alongX?[.15,.19,.18]:[.18,.19,.15],color:DOOR_COLORS[kind]};
 return [post(-width*.46),post(width*.46),lintel,status];
}
export function paintDoorSurface(g,kind,level,settings={}){
 if(!['standard','locked','secret'].includes(kind))return false;
 const style=textureStyleFor(level,settings),theme=TEXTURE_PACKS[style],
  accent=kind==='standard'?'#5df6ec':kind==='locked'?'#ffcb60':'#bc84ff',
  secondary=kind==='standard'?'#b9fff7':kind==='locked'?'#fff0b9':'#e7caff';
 // Strong silhouette and thick luminous border remain readable in dark,
 // light, industrial and neon packs. Texture art never affects collision.
 g.fillStyle=style==='corporate'?'#2a424f':'#081620';g.fillRect(0,0,64,64);
 g.fillStyle=theme.wall;g.fillRect(6,6,52,52);
 g.fillStyle='#0b1520';g.fillRect(11,11,42,42);
 g.strokeStyle=accent;g.lineWidth=3;g.strokeRect(4,4,56,56);
 g.fillStyle=secondary;g.fillRect(8,8,48,2);
 g.fillStyle=accent;g.fillRect(8,53,48,3);
 // Readable vertical jambs and central control panel.
 g.fillStyle=accent;g.fillRect(8,14,3,35);g.fillRect(53,14,3,35);
 g.fillStyle='#263743';g.fillRect(15,16,34,31);
 g.strokeStyle=secondary;g.lineWidth=1;g.strokeRect(16,17,32,29);
 for(let x=19;x<=41;x+=11){g.fillStyle=theme.floor;g.fillRect(x,20,7,24);}
 if(kind==='standard'){
  g.fillStyle=accent;g.fillRect(29,16,6,31);
  g.fillStyle=secondary;g.fillRect(31,20,2,23);
  for(let y=12;y<51;y+=11){g.fillStyle=accent;g.fillRect(3,y,4,4);g.fillRect(57,y,4,4);}
 }else if(kind==='locked'){
  // Broad gold header stripes + unmistakable locked key-card emblem.
  for(let x=10;x<=49;x+=10){g.fillStyle=accent;g.fillRect(x,11,6,3);}
  g.fillStyle='#111821';g.fillRect(22,23,20,20);
  g.strokeStyle=accent;g.lineWidth=3;g.strokeRect(24,22,16,19);
  g.fillStyle=secondary;g.fillRect(27,19,10,5);g.fillRect(30,31,4,7);
 }else{
  // This tile is only selected when Resonance Vision reveals a secret.
  g.fillStyle=accent;g.fillRect(20,26,24,12);g.fillRect(26,20,12,24);
  g.fillStyle='#170b25';g.fillRect(27,27,10,10);
  g.fillStyle=secondary;g.fillRect(30,30,4,4);
 }
 return true;
}
