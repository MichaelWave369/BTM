// Quest 3 research campaign: deterministic playable mezzanines for all twelve
// original solo sectors. Activated only by ?solo2f=1 + a new campaign.
// Standard/Pit/BBS checkpoint geometry and native controller actions stay intact.
import {STACK_HEIGHT,STACK_CEILING,rampHeight} from './net/vertical-arena.js';
import {authoredSoloUpperCover,coverIntersectsBody} from './solo-cover.js';
import {validSoloJetpack} from './solo-jetpack.js';
export const SOLO_MEZZANINE=Object.freeze({
 schema:'btm.vertical-prototype/1',soloPreview:true,ceiling:STACK_CEILING,
 upper:Object.freeze({x0:14,x1:18,y0:19,y1:23,height:STACK_HEIGHT}),
 ramp:Object.freeze({x0:11,x1:14,y0:21,y1:22})
});
const cell=(x,y)=>x+','+y;
const cells=(rect)=>{const out=[];for(let y=rect.y0;y<rect.y1;y++)
 for(let x=rect.x0;x<rect.x1;x++)out.push([x,y]);return out;};
const open=(level,x,y)=>level.cells[y]?.[x]===0&&!level.doors[cell(x,y)];
// The ramp is a slope, not empty floor. Reserve a full approach apron around
// every regular, locked and secret doorway so it never blocks player use.
export function rampDoorClearance(level,ramp){
 const doors=Object.values(level.doors||{});
 return cells(ramp).every(([x,y])=>doors.every(d=>Math.abs(d.x-x)>1||Math.abs(d.y-y)>1));
}
// A compact ramp needs an unobstructed approach, not a slope pushed flush
// against the next wall. Avoid placing starting enemies in its footprint.
export function rampFootClearance(level,ramp){
 if(!rampDoorClearance(level,ramp))return false;
 for(let y=ramp.y0;y<ramp.y1;y++)for(let x=ramp.x0-2;x<ramp.x0;x++)
  if(!open(level,x,y))return false;
 return !level.enemies.some(e=>cells(ramp).some(([x,y])=>Math.floor(e.homeX??e.x)===x&&Math.floor(e.homeY??e.y)===y));
}
export function isSoloPreview(level){return !!level?.vertical?.soloPreview;}
function traversableFromEntry(level,spawn){
 const x=Math.floor(spawn.x),y=Math.floor(spawn.y),start=cell(x,y);
 const q=[[x,y]],seen=new Map([[start,0]]);
 for(let i=0;i<q.length;i++){
  const [px,py]=q[i],d=seen.get(cell(px,py));
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=px+dx,ny=py+dy,k=cell(nx,ny),door=level.doors[k];
   if(seen.has(k)||!(open(level,nx,ny)||door?.type===4&&!door.lockColor))continue;
   seen.set(k,d+1);q.push([nx,ny]);
  }
 }
 return seen;
}
const critical=(level,spawn)=>[spawn,level.key,level.exit,...level.relays,...level.captives];
export function chooseSoloMezzanine(level,index,spawn){
 if(index===0){const layout=structuredClone(SOLO_MEZZANINE);if(!rampFootClearance(level,layout.ramp))throw Error('Sector 01 ramp crowds an approach');return layout;}
 const accessible=traversableFromEntry(level,spawn),must=critical(level,spawn);
 let best=null;
 // Real unobstructed room geometry, not a random platform pasted through
 // walls. Fall back to a compact 3x3 deck if a busy nightmare stage demands it.
 for(const [width,height,length] of [[4,4,3],[4,3,3],[3,4,3],[3,3,3]]){
  for(let y=2;y+height<level.h;y++)for(let x=2;x+width+length<level.w;x++){
   const upper={x0:x+length,x1:x+length+width,y0:y,y1:y+height,height:STACK_HEIGHT};
   const ramp={x0:x,x1:x+length,y0:y+height-2,y1:y+height-1};
   const footprint=[...cells(upper),...cells(ramp)];
   if(!footprint.every(([cx,cy])=>open(level,cx,cy))||!rampFootClearance(level,ramp))continue;
   if(must.some(o=>cells(ramp).some(([rx,ry])=>Math.floor(o.x)===rx&&Math.floor(o.y)===ry)))continue;
   const entry=cell(ramp.x0-1,ramp.y0),distance=accessible.get(entry);
   if(distance===undefined)continue;
   // Every upper tile can be walked; the whole ramp is accessible from the
   // original open corridor network without any GOLD or colored key.
   const middleX=upper.x0+width/2,middleY=upper.y0+height/2;
   const centerPenalty=Math.abs(middleX-level.w/2)+Math.abs(middleY-level.h/2);
   const score=width*height*20+length*8-Math.abs(distance-(9+index))*1.5-
     centerPenalty*.6+(index%3===0?x*.1:y*.1);
   if(!best||score>best.score)best={upper,ramp,score};
  }
  if(best)break; // Prefer a large functional deck over a tiny shortcut.
 }
 if(!best)throw Error('No safe two-story mezzanine found in sector '+(index+1));
 return {schema:'btm.vertical-prototype/1',soloPreview:true,ceiling:STACK_CEILING,
  upper:best.upper,ramp:best.ramp,layoutIndex:index,entry:{x:spawn.x,y:spawn.y}};
}
export function soloUplinkPosition(layout){return {x:layout.upper.x0+.5,y:layout.upper.y1-.5,floorHeight:STACK_HEIGHT};}
// Opposite upper-deck corner from the uplink, supply and sentry. Available on every 3x3+ deck.
export function upperFragmentPosition(layout){return {x:layout.upper.x1-.5,y:layout.upper.y1-.5,floorHeight:STACK_HEIGHT};}
export function enableSoloMezzanine(level,index,spawn){
 const layout=chooseSoloMezzanine(level,index,spawn);
 const footprint=[...cells(layout.upper),...cells(layout.ramp)];
 if(!footprint.every(([x,y])=>open(level,x,y))||!rampFootClearance(level,layout.ramp))
  throw Error('Unsafe mezzanine floor in sector '+(index+1));
 level.vertical=layout;
 level.upperCover=authoredSoloUpperCover(layout);
 for(const item of level.items){
  const elevation=rampHeight(level,item.x,item.y);
  if(elevation!==null)item.floorHeight=elevation;
 }
 const u=layout.upper,cx=u.x0+Math.floor((u.x1-u.x0)/2)+.5,
  cy=u.y0+Math.floor((u.y1-u.y0)/2)+.5;
 const upperReward={x:cx,y:cy,floorHeight:STACK_HEIGHT};
 // Optional upstairs color access provides a genuine two-floor exploration
 // objective from Sector 02 onward, but never gates the campaign's gold exit.
 if(index>0){
  const color=level.items.find(i=>i.type.startsWith('key:'));
  if(color){Object.assign(color,upperReward,{bonusUpper:true});}
 }
 // Another supply is placed on a different tile from the upper key.
 const supplyX=u.x0+.5,supplyY=u.y0+.5;
 level.items.push({id:level.items.length,type:index%2?'armor':'energy',
  x:supplyX,y:supplyY,floorHeight:STACK_HEIGHT,taken:false,bonusUpper:true});
 // Optional scavenger goal; unlike the regular artifact, this never upgrades weapons.
 level.items.push({id:level.items.length,type:'artifact',...upperFragmentPosition(layout),
  taken:false,upperFragment:true,bonusUpper:true});
 // Independent upstairs side mission, never a replacement for extraction objectives.
 level.upperUplink={id:'upper-uplink-'+index,type:'relay',...soloUplinkPosition(layout),active:false,optional:true};
 return true;
}
export function validSoloPreviewCheckpoint(level,player){
 if(!isSoloPreview(level))return true;
 const l=level.vertical;
 if(!Number.isInteger(level.index)||level.index<0||level.index>11)return false;
 let expected;try{expected=chooseSoloMezzanine(level,level.index,l.entry||{x:4.5,y:21.5});}catch{return false;}
 const uplink=level.upperUplink,authored=soloUplinkPosition(expected);
 const fragments=level.items.filter(i=>i.upperFragment),fragment=fragments[0],fragmentPosition=upperFragmentPosition(expected);
 const sentries=level.enemies.filter(e=>e.upperGuard),expectedRole=['breacher','marksman','bulwark'][level.index%3];
 return JSON.stringify(l)===JSON.stringify(expected)&&
  JSON.stringify(level.upperCover)===JSON.stringify(authoredSoloUpperCover(expected))&&
  !coverIntersectsBody(level,player.x,player.y,.2,player)&&
  !!uplink&&uplink.id==='upper-uplink-'+level.index&&uplink.type==='relay'&&uplink.optional===true&&typeof uplink.active==='boolean'&&
  uplink.x===authored.x&&uplink.y===authored.y&&uplink.floorHeight===authored.floorHeight&&
  fragments.length===1&&fragment.type==='artifact'&&fragment.bonusUpper===true&&typeof fragment.taken==='boolean'&&
  fragment.x===fragmentPosition.x&&fragment.y===fragmentPosition.y&&fragment.floorHeight===fragmentPosition.floorHeight&&
  sentries.length===1&&sentries[0].upperGuardRole===expectedRole&&
  typeof sentries[0].coverReady==='boolean'&&Number.isFinite(sentries[0].coverRecharge)&&sentries[0].coverRecharge>=0&&sentries[0].coverRecharge<=6&&
  typeof sentries[0].dead==='boolean'&&typeof level.upperGuardCleared==='boolean'&&
  level.upperGuardCleared===sentries[0].dead&&
  validSoloJetpack(player)&&
  [player.height,player.vz,player.jumpBuffer,player.coyote].every(Number.isFinite)&&
  player.height>=0&&player.height<=STACK_CEILING-1.1+.01&&
  Math.abs(player.vz)<=18.01&&typeof player.grounded==='boolean'&&
  ['ground','upper','ramp'].includes(player.supportSurface);
}
