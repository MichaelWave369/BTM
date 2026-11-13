// Optional two-story solo color-card treasure hunt.
// Uses authored bonus alcoves and player-held keyring, not new gates or saves.
import {findRoute} from './collision.js';

export const CACHE_COLORS=Object.freeze({
 red:'#ff6878',blue:'#65b8ff',green:'#81e6a0'
});
const cachePath=new WeakMap();
export function accessCacheStatus(level){
 const caches=(level?.items||[]).filter(i=>i.bonusAccess&&CACHE_COLORS[i.bonusAccess]);
 return {collected:caches.filter(i=>i.taken).length,total:caches.length};
}
export function claimAccessCache(player,color,survival){
 if(!CACHE_COLORS[color])return false;
 const add=(field,amount,cap=100)=>player[field]=Math.min(cap,Math.max(0,(player[field]||0)+amount));
 // Every color delivers a distinct cap-limited bonus, even if the standard
 // energy/armor sprite was at full capacity. Only a genuine bonusAccess item
 // in the opt-in vertical preview may trigger these.
 if(color==='red'){add('health',35);add('armor',15);}
 if(color==='blue'){add(survival?'reserve':'energy',35,survival?180:100);add('ori',25);}
 if(color==='green'){add('health',20);add('armor',25);add('ori',20);}
 return true;
}
function coloredRoute(level,player,door){
 const keys=Object.keys(player.keys||{}).filter(k=>player.keys[k]).sort().join(',');
 const opened=Object.values(level.doors).filter(d=>d.open>=.84).map(d=>d.x+','+d.y).sort().join(';');
 const signature=[Math.floor(player.x),Math.floor(player.y),door.x,door.y,keys,opened,player.key].join('|');
 const previous=cachePath.get(level);
 if(previous?.signature===signature)return previous.path;
 const path=findRoute(level,player,{x:door.x+.5,y:door.y+.5},{allowLocked:player.key,keys:player.keys});
 cachePath.set(level,{signature,path});
 return path;
}
export function soloAccessMarkers(game){
 const level=game?.level,player=game?.player;
 if(!game?.verticalPreview||!level?.vertical?.soloPreview||!player)return [];
 if(player.supportSurface==='upper'){
  return level.items.filter(i=>i.bonusUpper&&!i.taken&&i.type?.startsWith('key:')).map(i=>({
   kind:'card',color:i.type.slice(4),x:i.x,y:i.y,floorHeight:i.floorHeight||0
  }));
 }
 const markers=[],targets=[];
 for(const cache of level.items.filter(i=>i.bonusAccess&&!i.taken)){
  const color=cache.bonusAccess;
  if(!player.keys?.[color]||!CACHE_COLORS[color])continue;
  const door=Object.values(level.doors).find(d=>d.bonus&&d.lockColor===color);
  if(!door)continue;
  targets.push(door);
  markers.push({kind:'door',color,x:door.x+.5,y:door.y+.5,floorHeight:0});
  if(door.open>=.84)markers.push({kind:'cache',color,x:cache.x,y:cache.y,floorHeight:0});
 }
 // Only an active Ori scan reveals the longer route. Normal gameplay never
 // marks unknown walls or grants a key that has not been collected.
 if(game.objectiveTime>0&&targets.length){
  const door=targets[0],path=coloredRoute(level,player,door);
  for(let i=1;i<Math.min(path.length,49);i+=2)
   markers.push({kind:'trail',color:door.lockColor,x:path[i].x,y:path[i].y,floorHeight:0});
 }
 return markers;
}
