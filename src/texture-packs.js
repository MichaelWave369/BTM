import {paintSignalSurface,signalPalette} from './neon-signal.js';

// Presentation-only texture profiles. No gameplay geometry or network protocol changes.
export const SURFACE_MATERIALS=Object.freeze([...Array.from({length:6},(_,i)=>'wall'+(i+1)),'floor','ceiling']);
export const TEXTURE_QUALITY=Object.freeze(['retro','enhanced','ultra']);
export const TEXTURE_PACKS=Object.freeze({
 retro:Object.freeze({label:'Retro / Original',wall:'#10192e',floor:'#10192e',ceiling:'#10192e',edge:'#5df6ec',accent:'#ff59c4'}),
 industrial:Object.freeze({label:'Gritty Industrial',wall:'#343c3d',floor:'#242c2e',ceiling:'#252e31',edge:'#b89f73',accent:'#efa64c'}),
 cyberpunk:Object.freeze({label:'Neon Cyberpunk',wall:'#101530',floor:'#0b1527',ceiling:'#111a38',edge:'#22e6fd',accent:'#fb48c8'}),
 horror:Object.freeze({label:'Dark Sci-Fi Horror',wall:'#221c23',floor:'#15171d',ceiling:'#1c1821',edge:'#8c4259',accent:'#ef445f'}),
 corporate:Object.freeze({label:'Clean Corporate Simulation',wall:'#becbd2',floor:'#879eab',ceiling:'#b6cbd5',edge:'#4d8198',accent:'#4cc2ed'}),
 'matrix-facility':Object.freeze({label:'Matrix Control Facility',wall:'#14252b',floor:'#0f2027',ceiling:'#1c2930',edge:'#46e3b1',accent:'#d0f3db'})
});
export const TEXTURE_STYLES=Object.freeze(['auto',...Object.keys(TEXTURE_PACKS)]);
export function textureSettings(input={}){
 return {textureStyle:TEXTURE_STYLES.includes(input.textureStyle)?input.textureStyle:'retro',
  textureQuality:TEXTURE_QUALITY.includes(input.textureQuality)?input.textureQuality:'enhanced'};
}
export function textureStyleFor(level,settings={}){
 const {textureStyle}=textureSettings(settings);
 if(textureStyle!=='auto')return textureStyle;
 if(level?.campaign==='pit')return 'horror';
 if(level?.campaign==='arena')return 'cyberpunk';
 if(level?.campaign==='raid')return 'matrix-facility';
 const index=Number.isInteger(level?.index)?level.index:0;
 return ['matrix-facility','industrial','corporate','cyberpunk','horror','matrix-facility'][((index%6)+6)%6];
}
export function textureSignature(level,settings={}){
 const s=textureSettings(settings);return textureStyleFor(level,s)+'/'+s.textureQuality;
}
// Pack manifests cannot supply remote URLs, parent traversal, dynamic code or non-surface IDs.
// Later art rungs can supply images keyed by the validated local paths returned here.
export function validateTextureManifest(manifest,style){
 if(!Object.hasOwn(TEXTURE_PACKS,style)||!manifest||manifest.schema!=='btm.texture-pack/1'||manifest.style!==style)throw Error('Invalid BTM texture pack');
 const assets={};
 for(const [material,file]of Object.entries(manifest.surfaces||{})){
  if(!SURFACE_MATERIALS.includes(material)||typeof file!=='string'||!/^[a-z0-9_-]+\.(?:png|webp|jpe?g)$/i.test(file))throw Error('Unsafe or unsupported texture material');
  assets[material]='./texture-packs/'+style+'/'+file;
 }
 return Object.freeze(assets);
}
const mix=(hex,white=.10)=>{
 const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 return '#'+v.map(n=>Math.min(255,Math.round(n+(255-n)*white)).toString(16).padStart(2,'0')).join('');
};
const line=(g,x1,y1,x2,y2,color,width=1)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
const box=(g,x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
export function paintPackSurface(g,material,level,settings={},base=null){
 if(!SURFACE_MATERIALS.includes(material))return false;
 const style=textureStyleFor(level,settings),quality=textureSettings(settings).textureQuality,kind=material.startsWith('wall')?'wall':material,profile=TEXTURE_PACKS[style];
 if(style==='retro'){
  const pal=signalPalette(level);
  paintSignalSurface(g,kind,material==='wall5'?{...pal,primary:'#ffd078'}:material==='wall6'?{...pal,primary:'#b48bff'}:pal,base);
  return true;
 }
 const wall=Number(material.slice(4))||1,detail=quality==='retro'?1:quality==='ultra'?4:2;
 box(g,0,0,64,64,profile[kind]);box(g,0,0,64,3,mix(profile[kind],.13));
 if(style==='industrial'){
  box(g,3,5,58,54,mix(profile[kind],.12));g.strokeStyle='#151c20';g.lineWidth=3;g.strokeRect(4,6,56,51);
  for(let y=14;y<57;y+=14)line(g,6,y,58,y,'#151a1b',2);
  for(let i=0;i<detail*8;i++){const x=7+(i*23+wall*7)%49,y=8+(i*17+wall*11)%47;line(g,x,y,x+3+(i%4),y-1,'#758083',1);}
  for(const x of [9,55])for(const y of [10,53]){box(g,x,y,4,4,'#1c2222');box(g,x+1,y+1,1,1,profile.edge);}
  if(kind==='floor')for(let x=14;x<=49;x+=17)box(g,x,28,6,8,'#172126');
  if(kind==='ceiling')box(g,24,9,16,46,'#52676a');
 }else if(style==='cyberpunk'){
  box(g,5,5,54,54,'#141c34');g.strokeStyle=profile.edge;g.lineWidth=2;g.strokeRect(5,5,54,54);
  line(g,10,12,54,12,profile.accent,2);line(g,9,51,54,51,profile.edge,2);
  for(let i=0;i<detail*3;i++){const y=19+i*7;if(y<49)box(g,12,y,32-(i%3)*5,2,i%2?profile.edge:profile.accent);}
  if(kind==='floor'){for(let x=0;x<=64;x+=16)line(g,x,0,x,64,profile.edge,1);for(let y=0;y<=64;y+=16)line(g,0,y,64,y,profile.accent,1);}
  if(kind==='ceiling'){box(g,23,0,18,64,profile.accent);box(g,29,0,6,64,'#d2ffff');}
 }else if(style==='horror'){
  box(g,3,4,58,56,'#2d2229');g.strokeStyle='#6e394c';g.lineWidth=2;g.strokeRect(4,5,55,53);
  for(let i=0;i<detail*5;i++){const x=5+(i*19+wall*9)%49,y=7+(i*23)%44;line(g,x,y,x+8,y+3+(i%5),i%3?'#3e303b':profile.edge,1);}
  for(let y=17;y<=47;y+=15)box(g,9,y,46,3,'#14151c');
  if(kind==='floor')box(g,16,18,33,25,'#1b181d');
  if(kind==='ceiling'){box(g,10,5,44,54,'#171620');box(g,24,0,16,64,'#633046');}
  box(g,49,39,5,11,profile.accent);
 }else if(style==='corporate'){
  box(g,3,3,58,58,'#d4e0e4');g.strokeStyle=profile.edge;g.lineWidth=2;g.strokeRect(5,5,54,54);
  for(let y=16;y<55;y+=16)line(g,5,y,59,y,'#8aa0af',1);
  for(let x=20;x<60;x+=20)line(g,x,5,x,59,'#94a9b3',1);
  box(g,10,9,44,4,profile.accent);box(g,11,54,42,2,'#7c9cab');
  if(kind==='ceiling'){box(g,18,9,28,46,'#eefaff');box(g,27,12,10,41,profile.accent);}
  if(kind==='floor'){box(g,7,7,50,50,'#aabcc8');g.strokeStyle='#eaf4f8';g.strokeRect(10,10,44,44);}
 }else{
  box(g,3,4,58,56,'#25383e');g.strokeStyle='#091e22';g.lineWidth=3;g.strokeRect(4,5,56,54);
  for(let x=10;x<=52;x+=14){box(g,x,9,7,44,'#102a2e');box(g,x+2,12,2,38,profile.edge);}
  for(let i=0;i<detail*4;i++){const x=8+(i*11+wall*3)%47,y=11+(i*7)%40;box(g,x,y,2,4,i%2?profile.accent:profile.edge);}
  if(kind==='floor'){for(let y=10;y<56;y+=16)line(g,6,y,58,y,'#4b686d',2);box(g,28,27,9,9,profile.accent);}
  if(kind==='ceiling'){box(g,21,0,22,64,'#0b2023');box(g,29,7,6,49,profile.accent);}
 }
 // Seams are deterministic and the top/left edge repeats cleanly on every tile.
 box(g,0,0,64,1,'#121c22');box(g,0,0,1,64,'#121c22');
 return true;
}
