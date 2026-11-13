// BTM solo two-story preview wayfinder. Derived HUD guidance only:
// no level mutations, checkpoint fields, network state or gameplay gates.
import {findRoute} from './collision.js';
import {rampHeight} from './net/vertical-arena.js';

const cache=new WeakMap();
const pos=(x,y,floorHeight=0,kind='trail')=>({x,y,floorHeight,kind});
function lowerRoute(level,player,foot){
 const doors=Object.values(level.doors).filter(d=>d.open>=.84).map(d=>d.x+','+d.y).sort().join(';');
 const keys=Object.keys(player.keys||{}).filter(k=>player.keys[k]).sort().join(',');
 const key=[Math.floor(player.x),Math.floor(player.y),player.key?'G':'-',keys,doors].join('|');
 const prior=cache.get(level);
 if(prior?.key===key)return prior.route;
 const route=findRoute(level,player,foot,{allowLocked:player.key,keys:player.keys});
 cache.set(level,{key,route});
 return route;
}
export function soloWayfinder(game){
 const level=game?.level,player=game?.player,layout=level?.vertical;
 if(!layout?.soloPreview||!player||!game.verticalPreview)return [];
 const fragment=level.items.find(i=>i.upperFragment&&!i.taken);
 const guard=level.enemies.find(e=>e.upperGuard&&!e.dead);
 const pending=!level.upperUplink?.active||!!fragment||!!guard;
 if(!pending)return [];
 const onUpper=player.supportSurface==='upper',r=layout.ramp,upper=layout.upper,markers=[];
 if(!onUpper){
  const y=r.y0+.5,foot={x:r.x0+.5,y};
  // A continuous rising line of small discs follows the actual ramp slope,
  // including compact layouts used in sectors 2-12.
  for(let x=r.x0;x<r.x1;x++){
   const xx=x+.5;
   markers.push(pos(xx,y,rampHeight(level,xx,y)??0,x===r.x0?'entrance':'ramp'));
  }
  // Ori's existing ten-second scan highlights a real walkable route to the
  // ramp. Do not route through colored locks without their keys.
  if(game.objectiveTime>0){
   const path=lowerRoute(level,player,foot);
   for(let i=1;i<Math.min(path.length,49);i+=2){
    const step=path[i];
    if(step.x>=r.x0&&step.x<r.x1&&step.y>=r.y0&&step.y<r.y1)continue;
    markers.push(pos(step.x,step.y,0,'trail'));
   }
  }
 }else{
  const u=level.upperUplink;
  if(u&&!u.active)markers.push(pos(u.x,u.y,u.floorHeight,'uplink'));
  if(fragment)markers.push(pos(fragment.x,fragment.y,fragment.floorHeight,'fragment'));
 }
 return markers;
}
export const SOLO_WAYFINDER_COLORS=Object.freeze({
 entrance:'#63efff',ramp:'#62dce7',trail:'#45c5a4',
 uplink:'#83efff',fragment:'#cd98ff'
});
