// Opt-in Sector 01 mezzanine. This is a *solo* hardware research slice,
// not a change to the main campaign's saved geometry or BBS host authority.
import {STACK_HEIGHT,STACK_CEILING,rampHeight} from './net/vertical-arena.js';
export const SOLO_MEZZANINE=Object.freeze({
 schema:'btm.vertical-prototype/1',soloPreview:true,ceiling:STACK_CEILING,
 upper:Object.freeze({x0:14,x1:18,y0:19,y1:23,height:STACK_HEIGHT}),
 ramp:Object.freeze({x0:9,x1:14,y0:21,y1:23})
});
const cells=(rect)=>{const out=[];for(let y=rect.y0;y<rect.y1;y++)
 for(let x=rect.x0;x<rect.x1;x++)out.push([x,y]);return out;};
export function isSoloPreview(level){return !!level?.vertical?.soloPreview;}
export function enableSoloMezzanine(level,index){
 if(index!==0)return false;
 const zones=[...cells(SOLO_MEZZANINE.upper),...cells(SOLO_MEZZANINE.ramp)];
 for(const [x,y] of zones){
  if(level.cells[y]?.[x]!==0||level.doors[x+','+y])
   throw Error('Sector 01 mezzanine requires unobstructed authored floor at '+x+','+y);
 }
 level.vertical=structuredClone(SOLO_MEZZANINE);
 // Existing ramp pickups, including colored access cards, stay at the
 // same x/y but get correct vertical contact height as the slope rises.
 for(const item of level.items){
  const elevation=rampHeight(level,item.x,item.y);
  if(elevation!==null)item.floorHeight=elevation;
 }
 // New upper supplies are optional, never needed for gold extraction.
 level.items.push({id:level.items.length,type:'energy',x:16.5,y:20.5,
  floorHeight:STACK_HEIGHT,remaining:45,taken:false,bonusUpper:true});
 return true;
}
export function validSoloPreviewCheckpoint(level,player){
 if(!isSoloPreview(level))return true;
 const expected=SOLO_MEZZANINE,layout=level.vertical;
 return level.index===0&&
  JSON.stringify(layout)===JSON.stringify(expected)&&
  [player.height,player.vz,player.jumpBuffer,player.coyote].every(Number.isFinite)&&
  player.height>=0&&player.height<=STACK_CEILING-1.1+.01&&
  Math.abs(player.vz)<=18.01&&typeof player.grounded==='boolean'&&
  ['ground','upper','ramp'].includes(player.supportSurface);
}
