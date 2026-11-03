// Copyright (c) MichaelWave369 / BTM. MIT-licensed first-party art source.
// Three authored 256px RGB image families; no third-party assets or packages.
// The original Industrial/Matrix PNGs and procedural Retro fallback are unchanged.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

export const AUTHORED_NEW_STYLES=Object.freeze(['cyberpunk','horror','corporate']);
export const ART_SURFACES=Object.freeze(['wall1','wall2','wall3','wall4','wall5','wall6','floor','ceiling']);
export const ART_TILE_SIZE=256;
const PALETTES={
 cyberpunk:['101728','21233b','0a1021','344763','627189','12bad5','72f2ff','b6298a','ff65d2','f1ae4d','060914','577087','10172e','38648e','171e37','e7f7ff'],
 horror:['1a171e','2c2429','100e14','593c47','816569','783a4c','d37680','ae263f','f05d66','c9a266','0b0a10','65565d','19161c','63464c','1b1722','dfc6ac'],
 corporate:['cfdbe1','e9f1f0','8a9ea9','a1bac5','f8faf5','2c9bb8','b2f5ff','6c9b90','b6edc9','eeb75e','394c58','acc1ca','b9ccd2','8ba6b2','e3eced','ffffff']
};
const hex=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n>>>0);return b;};
const crcTable=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
const crc32=b=>{let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
function chunk(type,data){
 const label=Buffer.from(type,'ascii');return Buffer.concat([u32(data.length),label,data,u32(crc32(Buffer.concat([label,data])))]);
}
export function encodeTilePNG(rgb,size=ART_TILE_SIZE){
 if(rgb.length!==size*size*3)throw Error('Invalid tile RGB');
 const raw=Buffer.alloc(size*(size*3+1));
 for(let y=0;y<size;y++)rgb.copy(raw,y*(size*3+1)+1,y*size*3,(y+1)*size*3);
 const hdr=Buffer.alloc(13);hdr.writeUInt32BE(size,0);hdr.writeUInt32BE(size,4);hdr[8]=8;hdr[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
export function renderAuthoredTile(style,surface){
 if(!AUTHORED_NEW_STYLES.includes(style)||!ART_SURFACES.includes(surface))throw Error('Unknown original BTM surface');
 const S=ART_TILE_SIZE,colors=PALETTES[style].map(hex),pixels=Buffer.alloc(S*S*3),wall=surface.startsWith('wall')?Number(surface.slice(4)):0;
 let seed=(AUTHORED_NEW_STYLES.indexOf(style)+1)*911+wall*293+(surface==='floor'?73:surface==='ceiling'?137:0);
 const rand=(x,y,s=0)=>{let v=Math.imul(x+31,374761393)^Math.imul(y+53,668265263)^Math.imul(seed+s,2246822519);v=Math.imul(v^(v>>>13),1274126177);return(v^(v>>>16))>>>0;};
 const rgb=(role,variation=0)=>colors[role].map(n=>Math.max(0,Math.min(255,n+variation)));
 function point(x,y,c){if(x<0||x>=S||y<0||y>=S)return;const i=(y*S+x)*3;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];}
 function rect(x,y,w,h,c){for(let yy=Math.max(0,y|0);yy<Math.min(S,y+h);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(S,x+w);xx++)point(xx,yy,c);}
 function border(x,y,w,h,c,t=3){rect(x,y,w,t,c);rect(x,y+h-t,w,t,c);rect(x,y,t,h,c);rect(x+w-t,y,t,h,c);}
 function line(x,y,x2,y2,c,t=2){x=Math.round(x);y=Math.round(y);x2=Math.round(x2);y2=Math.round(y2);let dx=Math.abs(x2-x),dy=-Math.abs(y2-y),sx=x<x2?1:-1,sy=y<y2?1:-1,e=dx+dy;for(;;){rect(x-(t>>1),y-(t>>1),t,t,c);if(x===x2&&y===y2)break;const twice=e*2;if(twice>=dy){e+=dy;x+=sx;}if(twice<=dx){e+=dx;y+=sy;}}}
 const col=(role,v=0)=>rgb(role,v),C=(role,v=0)=>col(role,v);
 function rivet(x,y){rect(x-4,y-4,9,9,C(10));rect(x-2,y-2,5,5,C(11,13));point(x,y,C(15,-22));}
 function danger(x,y,w,h){rect(x,y,w,h,C(9));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(((xx+yy*2)>>4)&1)point(xx,yy,C(10));border(x,y,w,h,C(3),2);}
 function scratch(n,role){for(let i=0;i<n;i++){let x=12+rand(i,4)%226,y=12+rand(4,i)%220,d=8+rand(i,10)%59;line(x,y,Math.min(244,x+d),Math.min(244,y+Math.round(d/5)),C(role,-10+i%16),1);}}
 const baseRole=surface==='floor'?12:surface==='ceiling'?14:0;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++)point(x,y,C(baseRole,style==='corporate'?(rand(x>>2,y>>2)%5)-2:(rand(x>>1,y>>1)%13)-6));
 if(wall){
  rect(7,7,242,242,C(1));border(5,5,246,246,C(3),5);
  rect(15,15,226,226,C(2));border(14,14,228,228,C(11),3);
  for(const x of [22,234])for(const y of [22,234])rivet(x,y);
  if(style==='cyberpunk'){
   rect(20,23,216,15,C(1,8));rect(24,27,150,3,C(5,35));rect(181,27,50,3,C(8,20));
   rect(20,220,216,13,C(1));rect(25,224,205,3,C(5,18));rect(231,42,4,170,C(7,25));
   if(wall===1){border(33,46,186,164,C(5,18),3);rect(41,55,170,149,C(1,-8));for(let i=0;i<5;i++){rect(48,66+i*27,110+i%3*12,4,C(i%2?5:7,18));rect(168,65+i*27,24,8,C(11));}}
   if(wall===2){rect(38,51,176,160,C(1,-8));for(let i=0;i<11;i++){rect(45,58+i*14,160,7,C(10));rect(48,60+i*14,147,2,C(3,15));}rect(40,211,166,6,C(5,30));}
   if(wall===3){for(let i=0;i<4;i++){let x=37+i*48;rect(x,46,27,170,C(1,-8));border(x,46,27,170,C(i%2?7:5,24),3);rect(x+9,50,7,160,C(i%2?8:6,24));}rect(48,111,159,13,C(11));}
   if(wall===4){rect(43,47,170,169,C(10));border(43,47,170,169,C(7,25),5);for(let i=0;i<9;i++)rect(54,65+i*16,130-(i%4)*11,4,C(i%3?5:7,15));rect(165,182,36,20,C(5,24));}
   if(wall===5){danger(35,86,185,46);border(31,77,192,67,C(7,15),4);rect(48,161,160,11,C(5,25));for(let i=0;i<7;i++)rect(55+i*23,166,10,5,C(15,-15));}
   if(wall===6){border(35,47,185,168,C(7,20),5);rect(56,61,143,138,C(1));for(let i=0;i<6;i++)line(65+i*23,70,65+i*23,189,C(5,20),3);danger(49,91,159,15);}
   scratch(12,3);
  }else if(style==='horror'){
   rect(19,25,218,198,C(1,-10));border(21,26,214,198,C(3),5);rect(29,33,198,183,C(2));
   for(let i=0;i<6;i++)rect(30,36+i*31,196,3,C(3,-10));
   if(wall===1){for(let i=0;i<4;i++)border(44+i*6,50+i*6,166-i*12,151-i*12,C(3),2);scratch(48,4);}
   if(wall===2){for(let i=0;i<13;i++){rect(36,48+i*12,184,7,C(10));rect(43,49+i*12,160,2,C(4,-20));}scratch(27,7);}
   if(wall===3){for(let i=0;i<4;i++){rect(37+i*48,42,28,168,C(3));rect(43+i*48,47,12,158,C(2));}scratch(35,8);}
   if(wall===4){rect(47,47,160,164,C(10));border(47,47,160,164,C(7),4);for(let i=0;i<11;i++)rect(59,63+i*12,83+rand(i,3)%67,3,C(4+i%4,-15));scratch(32,3);}
   if(wall===5){danger(36,86,182,41);rect(47,144,162,25,C(2));for(let i=0;i<7;i++)rect(52+i*22,150,6,14,C(8));scratch(37,7);}
   if(wall===6){for(let i=0;i<4;i++)border(38+i*10,50+i*9,181-i*20,160-i*18,C(4+i%2,-15),3);danger(48,111,157,16);scratch(38,3);}
   for(let i=0;i<35;i++){let x=20+rand(i,8)%215,y=20+rand(i,9)%210;rect(x,y,2+rand(i,11)%8,1+rand(i,5)%5,C(i%4===0?8:3,-17));}
  }else{
   rect(21,21,213,214,C(1));border(21,21,213,214,C(3),3);for(let i=0;i<4;i++)rect(24,64+i*43,207,2,C(3,-17));
   if(wall===1){for(let i=0;i<4;i++){let x=32+(i%2)*99,y=34+Math.floor(i/2)*91;border(x,y,91,83,C(3),2);rect(x+11,y+10,70,60,C(1,6));}rect(51,33,152,4,C(5));}
   if(wall===2){rect(42,38,172,177,C(1));for(let i=0;i<11;i++){rect(57,52+i*14,144,6,C(3,-25));rect(63,54+i*14,131,1,C(15,-10));}}
   if(wall===3){for(let i=0;i<4;i++){let x=38+i*50;rect(x,36,38,181,C(3));rect(x+5,41,28,171,C(1,8));rect(x+12,47,14,160,C(15,-20));}rect(35,103,188,8,C(5));}
   if(wall===4){rect(40,42,177,168,C(2));border(40,42,177,168,C(5),4);rect(54,59,144,130,C(1,8));for(let i=0;i<7;i++)rect(65,71+i*17,113-i%3*14,3,C(i%3?3:5));rect(177,72,8,102,C(5));}
   if(wall===5){danger(39,92,179,32);rect(38,137,181,40,C(1));border(38,137,181,40,C(5),3);rect(51,149,150,10,C(15,-10));}
   if(wall===6){border(36,38,181,181,C(3),3);rect(48,50,155,156,C(1));for(let i=0;i<5;i++)rect(59+i*27,63,9,135,C(3));rect(68,113,125,13,C(5));}
   for(let i=0;i<12;i++){const x=30+rand(i,12)%193,y=33+rand(i,17)%187;rect(x,y,4,2,C(15,-35));}
  }
 }else if(surface==='floor'){
  if(style==='cyberpunk'){
   for(let i=0;i<256;i+=64){rect(i,0,4,256,C(5));rect(0,i,256,4,C(7));}
   for(let i=0;i<256;i+=32){rect(i,0,1,256,C(3));rect(0,i,256,1,C(3));}
   for(let i=0;i<4;i++){let x=17+(i%2)*127,y=18+Math.floor(i/2)*127;rect(x,y,82,74,C(1));border(x,y,82,74,C(i%2?7:5),2);rect(x+17,y+17,49,40,C(2));}
   for(let i=0;i<18;i++)rect(16+rand(i,4)%213,12+rand(i,5)%226,7,3,C(i%2?5:7));
  }else if(style==='horror'){
   for(let i=0;i<256;i+=64){rect(i,0,6,256,C(10));rect(0,i,256,5,C(3));}
   for(let i=0;i<4;i++){let x=(i%2)*128+18,y=Math.floor(i/2)*128+18;rect(x,y,92,92,C(1,-12));border(x,y,92,92,C(3),2);}
   scratch(75,4);for(let i=0;i<55;i++){let x=rand(i,2)%255,y=rand(2,i)%255;rect(x,y,3+rand(i,4)%11,1+rand(i,10)%6,C(i%4?3:8,-12));}
  }else{
   for(let i=0;i<256;i+=64){rect(i,0,3,256,C(13));rect(0,i,256,3,C(13));}
   for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){rect(x+8,y+7,49,49,C(1));border(x+8,y+7,49,49,C(3),2);rect(x+15,y+14,35,34,C(4));}
   for(let i=0;i<16;i++)rect((i%4)*64+27,Math.floor(i/4)*64+27,9,9,C(5,-15));
  }
 }else if(style==='cyberpunk'){
  rect(0,0,256,256,C(2));for(let i=0;i<256;i+=64){rect(0,i,256,6,C(3));rect(i,0,6,256,C(3));}
  for(let i=0;i<4;i++){let x=(i%2)*128+16,y=Math.floor(i/2)*128+16;rect(x,y,94,93,C(1));border(x,y,94,93,C(7),3);rect(x+25,y+34,44,27,C(5,20));rect(x+33,y+34,28,27,C(15,-5));}
 }else if(style==='horror'){
  for(let i=0;i<256;i+=64){rect(i,0,7,256,C(3));rect(0,i,256,8,C(10));}
  for(let i=0;i<4;i++){let x=(i%2)*128+22,y=Math.floor(i/2)*128+20;rect(x,y,82,83,C(2));border(x,y,82,83,C(4),3);rect(x+32,y+8,14,66,C(8));}scratch(35,3);
 }else{
  for(let i=0;i<256;i+=128){rect(0,i,256,5,C(3));rect(i,0,5,256,C(3));}
  for(let i=0;i<4;i++){let x=(i%2)*128+12,y=Math.floor(i/2)*128+12;rect(x,y,104,104,C(1));border(x,y,104,104,C(11),4);rect(x+18,y+18,68,68,C(15));rect(x+29,y+18,46,68,C(4));}
 }
 return pixels;
}
export async function writeRung3Tiles(destination){
 let count=0,bytes=0;
 for(const style of AUTHORED_NEW_STYLES){
  const dir=path.join(destination,'texture-packs',style);await mkdir(dir,{recursive:true});
  for(const surface of ART_SURFACES){
   const png=encodeTilePNG(renderAuthoredTile(style,surface));
   await writeFile(path.join(dir,surface+'.png'),png);bytes+=png.length;count++;
  }
 }
 return {count,bytes};
}
