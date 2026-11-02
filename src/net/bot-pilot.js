// Sovereign, input-only BBS bot pilots. No cloud inference, fabricated sockets,
// client-supplied scores, world writes, damage authority or hidden hit bonuses.
import {neutralInput} from './protocol.js';
import {distance,lineOfSight,findRoute,canOccupy,clamp} from '../core.js';

const vec=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const nearest=(p,arr)=>arr.sort((a,b)=>distance(p,a)-distance(p,b))[0];
function nextPoint(level,player,goal){
 const path=findRoute(level,player,goal,{allowLocked:!!player.key});
 return path.length>1?path[1]:path[0]||goal;
}
function livingEnemy(room,actor){
 return nearest(actor.player,room.live().filter(p=>p!==actor&&p.connected&&
  (room.mode==='deathmatch'||p.team!==actor.team)).map(p=>p.player));
}
function chooseCoop(room,actor){
 const g=room.game,l=g.level,p=actor.player,partners=[...room.actors.values()].filter(a=>a!==actor&&!a.bot);
 const down=nearest(p,partners.filter(a=>a.status==='downed').map(a=>a.player));
 if(down)return{point:down,kind:'revive',range:1.2};
 const supplies=l.items.filter(i=>!i.taken&&(
  i.type==='health'&&p.health<45||
  i.type==='armor'&&p.armor<15||
  i.type==='energy'&&p.energy<12&&p.reserve<15
 )).filter(i=>!i.ownerId||i.ownerId===actor.id);
 const supply=nearest(p,supplies);
 if(supply)return{point:supply,kind:'pickup',range:.35};
 // Use the same authored campaign objectives as humans, never jump a checkpoint.
 const unfreed=l.captives.filter(c=>!c.freed),unlit=l.relays.filter(r=>!r.active);
 const goal=nearest(p,unlit.length?unlit:unfreed);
 if(goal)return{point:goal,kind:'use',range:1.15};
 if(!l.key.taken)return{point:l.key,kind:'pickup',range:.35};
 // Once the real objective is complete, squadmates extract instead of
 // endlessly chasing optional enemies off the route.
 if(g.exitReady)return{point:l.exit,kind:'exit',range:1.15};
 const enemies=l.enemies.filter(e=>!e.dead);
 if(enemies.length)return{point:nearest(p,enemies),kind:'fight',range:4};
 const lead=nearest(p,partners.filter(a=>a.status==='alive').map(a=>a.player));
 return {point:lead||l.exit,kind:'follow',range:1.7};
}
export function botIntent(room,actor){
 const p=actor.player,m={...neutralInput(),angle:p?.a||0,weapon:1};
 if(!p||actor.status!=='alive'||room.state!=='playing')return m;
 const level=room.game.level,cooperative=!room.competitive;
 const opponent=cooperative
  ?nearest(p,level.enemies.filter(e=>!e.dead&&distance(p,e)<13&&lineOfSight(level,p,e)))
  :livingEnemy(room,actor);
 const goal=cooperative?chooseCoop(room,actor):
  room.mode==='control'&&room.control
   ?{point:room.control.zones[room.control.index],kind:'hill',range:.75}
   :{point:opponent||{x:level.exit.x,y:level.exit.y},kind:'fight',range:3.5};
 const target=goal.point||{x:p.x,y:p.y};
 const d=distance(p,target),contact=opponent&&distance(p,opponent),
  sees=opponent&&contact<12&&lineOfSight(level,p,opponent);
 // Respect real cover: never fire through walls or at an unobserved actor.
 const tick=room.tick,aim=sees?Math.atan2(opponent.y-p.y,opponent.x-p.x):
  Math.atan2(target.y-p.y,target.x-p.x);
 m.angle=aim+(sees ? .035*Math.sin(tick*.12+(actor.botIndex||0)) : 0);
 m.weapon=contact!==undefined&&contact<1.5?0:1;
 const channel=['revive','use'].includes(goal.kind)&&d<goal.range&&lineOfSight(level,p,target);
 const hold=goal.kind==='hill'&&d<goal.range||goal.kind==='follow'&&d<goal.range;
 let dx=0,dy=0;
 if(channel){m.use=true;}
 else if(!hold){
  const route=nextPoint(level,p,target),delta=vec(p,route);
  dx=delta.x;dy=delta.y;
 }
 if(sees&&goal.kind==='fight'&&contact<1.4){
  dx=-Math.cos(aim);dy=-Math.sin(aim);
 }
 const mag=Math.hypot(dx,dy);if(mag>.05){
  const vx=dx/mag,vy=dy/mag;
  m.move=clamp(Math.cos(m.angle)*vx+Math.sin(m.angle)*vy,-1,1);
  m.strafe=clamp(-Math.sin(m.angle)*vx+Math.cos(m.angle)*vy,-1,1);
  m.sprint=true;
 }
 if(m.weapon===1&&p.energy<35&&p.reserve>0&&actor.feel?.recharge<=0&&actor.feel?.vent<=0)
  m.actions.push('reload');
 if(!channel&&sees&&contact<(m.weapon===0?1.6:11)&&tick%9<5){
  m.fire=true;
  if(cooperative&&contact<6&&p.ori>=30&&actor.feel?.oriCooldown<=0&&tick%60===0)m.actions.push('ori');
 }
 // Navigation uses the same collision/floor checks as the live campaign.
 if(mag>.05&&!canOccupy(level,p.x+dx/mag*.25,p.y+dy/mag*.25)){
  m.move=0;m.strafe=0;
 }
 return m;
}
