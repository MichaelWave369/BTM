// Optional two-story solo resonance-sweep hazards.
// A deterministic, visible warning comes before any damage. There is no
// new level geometry, engine, save field, network message or extraction gate.
export const SWEEP_PERIOD=6;
export const SWEEP_WARNING_START=3.6;
export const SWEEP_ACTIVE_START=4.8;
export const SWEEP_ACTIVE_END=5.5;
export const SWEEP_DAMAGE=9;
export const SWEEP_RADIUS=.38;
export const SOLO_SWEEP_COLORS=Object.freeze({
 safe:'#3b7188',warning:'#ffde79',active:'#ff627b',cooldown:'#5ccdc8'
});
const hits=new WeakMap();
export function soloSweepNodes(level){
 const u=level?.vertical?.soloPreview&&level.vertical.upper;
 if(!u)return [];
 const y=u.y0+Math.floor((u.y1-u.y0)/2)+.5;
 return [
  {id:'left',x:u.x0+.5,y,floorHeight:u.height,channel:0},
  {id:'right',x:u.x1-.5,y,floorHeight:u.height,channel:1}
 ];
}
export function soloSweepPhase(time,channel=0){
 if(!Number.isFinite(time))return 'safe';
 const offset=channel*SWEEP_PERIOD/2;
 const phase=((time+offset)%SWEEP_PERIOD+SWEEP_PERIOD)%SWEEP_PERIOD;
 return phase>=SWEEP_ACTIVE_START&&phase<SWEEP_ACTIVE_END?'active':
  phase>=SWEEP_WARNING_START&&phase<SWEEP_ACTIVE_START?'warning':
  phase>=SWEEP_ACTIVE_END?'cooldown':'safe';
}
export function soloSweepMarkers(level,time){
 return soloSweepNodes(level).map(node=>({
  ...node,phase:soloSweepPhase(time,node.channel)
 }));
}
// Call only from the solo Game world step. Damage is limited to one pulse
// per node per six-second period, regardless of framerate or tab resumption.
// WeakMap data is ephemeral, so ordinary v1 saves and preview snapshots keep
// their existing schemas; retry/level changes create a fresh level object.
export function applySoloSweep(game){
 const level=game?.level,player=game?.player,time=game?.time;
 if(game?.mode!=='playing'||!game.verticalPreview||!level?.vertical?.soloPreview||
    !player||!Number.isFinite(time)||player.supportSurface!=='upper')return false;
 const previous=hits.get(game);
 const record=previous?.level===level&&time>=previous.lastTime?
  previous:{level,lastTime:time,cycles:new Map()};
 record.lastTime=time;hits.set(game,record);
 if(Math.abs(player.height-level.vertical.upper.height)>.32)return false;
 for(const node of soloSweepMarkers(level,time)){
  if(node.phase!=='active'||Math.hypot(player.x-node.x,player.y-node.y)>SWEEP_RADIUS)continue;
  const cycle=Math.floor((time+node.channel*SWEEP_PERIOD/2)/SWEEP_PERIOD);
  if(record.cycles.get(node.id)===cycle)continue;
  record.cycles.set(node.id,cycle);
  game.damagePlayer(SWEEP_DAMAGE,{x:node.x,y:node.y});
  game.emit('burst',{x:node.x,y:node.y,height:node.floorHeight+.1,color:SOLO_SWEEP_COLORS.active,count:12});
  game.emit('toast',{text:'UPPER RESONANCE SWEEP · JUMP OR SIDESTEP'});
  return true;
 }
 return false;
}
