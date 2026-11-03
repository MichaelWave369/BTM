// Solo Pit's three optional floor mechanisms. This file owns simulation,
// not rendering or WebXR/controller state. Older Pit saves may omit floorTraps.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearSegment=(p,h,radius=h.radius)=>{
 const dx=h.toX-h.x,dy=h.toY-h.y,len=dx*dx+dy*dy;
 const t=len?Math.max(0,Math.min(1,((p.x-h.x)*dx+(p.y-h.y)*dy)/len)):0;
 return Math.hypot(p.x-h.x-dx*t,p.y-h.y-dy*t)<=radius+.16;
};
export function floorTrapState(h,time){
 if(h.kind==='pressure-pulse')
  return Number.isFinite(h.fireAt)?'warning':
   Number.isFinite(h.activeUntil)&&time<h.activeUntil?'active':'idle';
 const clock=time+(h.offset||0),phase=((clock%h.period)+h.period)%h.period;
 return phase>=h.activeStart&&phase<h.activeEnd?'active':
  phase>=h.warningStart&&phase<h.activeStart?'warning':'idle';
}
function announce(g,h,message){
 g.emit('pitTell',{text:message,x:h.x,y:h.y});
 g.emit('toast',{text:message});
 g.emit('sound',{name:'pit'+(g.definition.act+1),position:{x:h.x,y:h.y,height:.2}});
}
function damageOnce(g,h){
 g.damagePlayer(h.damage,h);
 g.emit('hazardHit',{kind:h.kind,damage:h.damage,id:h.id});
 g.emit('burst',{x:h.x,y:h.y,color:'#62e8ff',count:8,height:.08});
}
export function updatePitFloorTraps(g){
 if(g.campaign!=='pit'||g.mode!=='playing')return;
 for(const h of g.level.floorTraps||[]){
  if(h.kind==='pressure-pulse'){
   const entered=distance(g.player,h)<h.triggerRadius;
   if(entered&&!h.wasInside&&!Number.isFinite(h.fireAt)&&g.time>=(h.readyAt||0)){
    h.fireAt=g.time+h.warning;
    h.readyAt=g.time+h.cooldown;
    announce(g,h,'PRESSURE PULSE / GET CLEAR');
    g.emit('pitFloorArmed',{id:h.id,kind:h.kind,fireAt:h.fireAt});
   }
   h.wasInside=entered;
   if(!Number.isFinite(h.fireAt)||g.time<h.fireAt)continue;
   h.fireAt=null;h.activeUntil=g.time+.4;
   g.emit('pitFloorFired',{id:h.id,kind:h.kind});
   if(distance(g.player,h)<h.radius+.16)damageOnce(g,h);
   else g.emit('burst',{x:h.x,y:h.y,color:'#62e8ff',count:8,height:.08});
   continue;
  }
  const state=floorTrapState(h,g.time),cycle=Math.floor((g.time+(h.offset||0))/h.period);
  const close= h.kind==='arc-lane'?nearSegment(g.player,h,1.2):
   distance(g.player,h)<4;
  if(state==='warning'&&h.warned!==cycle&&close){
   h.warned=cycle;
   announce(g,h,h.kind==='arc-lane'?'ARC LANE / CROSS BETWEEN PULSES':'CHARGE TILE / MOVE CLEAR');
  }
  const contact=h.kind==='arc-lane'?nearSegment(g.player,h):
   distance(g.player,h)<h.radius+.16;
  if(state==='active'&&contact&&h.hitCycle!==cycle){
   h.hitCycle=cycle;damageOnce(g,h);
  }
 }
}
