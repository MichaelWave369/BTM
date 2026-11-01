import {PIT_BOSSES} from './pit.js';
import {moveBody,lineOfSight} from './collision.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function hazardState(h,time){const clock=time+h.offset,cycle=Math.floor(clock/h.period),t=clock-cycle*h.period;return{cycle,warning:t>=1.2&&t<2.15,active:t>=2.15&&t<3.05};}
function warn(g,e,text){g.emit('pitTell',{text,x:e.x,y:e.y});g.emit('toast',{text});g.emit('sound',{name:'pit'+(g.definition.act+1),position:{x:e.x,y:e.y,height:.65}});}
function bolts(g,e,a,count,spread,speed=3.7){
 for(let i=0;i<count&&g.projectiles.length<96;i++){const angle=a+(i-(count-1)/2)*spread,d=distance(e,g.player),height=1,target=g.combatPose?Math.min(.8,g.combatPose.head.height*.65):.7;g.projectiles.push({x:e.x,y:e.y,a:angle,speed,life:5,damage:12+g.definition.act*3,enemy:true,color:PIT_BOSSES[e.pitBoss].color,r:.13,...(g.combatPose?{height,vh:(target-height)/Math.max(.1,d/speed)}:{})});}
}
function ring(g,e,count,rotation){for(let i=0;i<count;i++)bolts(g,e,rotation+i*Math.PI*2/count,1,0,3.1+e.phase*.15);}
function mark(g,x,y,radius,delay,damage){const blasts=g.level.blasts;if(blasts.length<8)blasts.push({x,y,radius,at:g.time+delay,damage,hit:false});}
export function exposePitBoss(e,source){if(!e?.pitBoss)return;if(source==='ori'||source==='bash'||source==='slap')e.exposed=Math.max(e.exposed||0,source==='bash'?2.4:source==='slap'?2:1.8);if(source==='bash'&&e.pitBoss==='gatekeeper'){e.tell=0;e.ramTime=0;e.cooldown=Math.max(1.8,e.cooldown);}}
export function pitDamageMultiplier(g,e,source){
 if(!e.pitBoss)return 1;
 if(source==='ori'||source==='bash'||source==='weapon'&&g.weapon===0)exposePitBoss(e,source==='weapon'?'slap':source);
 if(e.exposed>0)return e.pitBoss==='mirror'?1.8:1.6;
 if(e.pitBoss==='mirror'&&source==='weapon'&&g.weapon!==0&&(e.counterCooldown||0)<=0){e.counterCooldown=1.2;bolts(g,e,Math.atan2(g.player.y-e.y,g.player.x-e.x),1,0,2.6);warn(g,e,'MIRROR GUARDED / HOLD FIRE');}
 return e.pitBoss==='abyss'?.6:.32;
}
export function updatePitBoss(g,e,dt){
 const p=g.player,l=g.level,d=distance(e,p),visible=d<13&&lineOfSight(l,e,p),phase=e.hp<e.maxHp*.34?3:e.hp<e.maxHp*.67?2:1;
 e.exposed=Math.max(0,(e.exposed||0)-dt);e.counterCooldown=Math.max(0,(e.counterCooldown||0)-dt);
 if(phase!==e.phase){e.phase=phase;e.stun=0;e.exposed=0;e.tell=0;e.ramTime=0;e.cooldown=.15;g.say(PIT_BOSSES[e.pitBoss].name+' / phase '+phase+'. '+PIT_BOSSES[e.pitBoss].tip,'ORI',2);g.emit('bossPhase',{boss:e.pitBoss,phase});g.emit('sound',{name:'alarm'});}
 if(visible){e.state='pursue';if(!e.introduced){e.introduced=true;g.say(PIT_BOSSES[e.pitBoss].tip,'ORI',2);}}
 if(e.stun>0)return;
 if(e.ramTime>0){const step=Math.min(dt,e.ramTime),parts=Math.max(1,Math.ceil(6.75*step/.08));e.ramTime-=step;for(let i=0;i<parts;i++){moveBody(l,e,Math.cos(e.lockedAngle)*6.75*step/parts,Math.sin(e.lockedAngle)*6.75*step/parts,.28);if(!e.ramStruck&&distance(e,p)<.7){g.damagePlayer(18+g.definition.act*4,e);e.ramStruck=true;e.ramTime=0;break;}}return;}
 if(e.tell>0){
  e.tell=Math.max(0,e.tell-dt);if(e.tell>0)return;
  const a=e.lockedAngle||0;
  if(e.attack==='ram'){
   e.ramTime=.4;e.ramStruck=false;
  }else if(e.attack==='ground'){
   mark(g,e.markX,e.markY,.85,.75,18+g.definition.act*3);
   if(e.phase>1){mark(g,e.markX+1.4,e.markY,.65,1.05,16);mark(g,e.markX-1.4,e.markY,.65,1.05,16);}
   if(e.phase===3)ring(g,e,10,a+.16);
  }else if(e.attack==='cross'){
   ring(g,e,e.phase===1?4:8,a+Math.PI/4);if(e.phase===3)bolts(g,e,a,3,.27,4);
  }else if(e.attack==='ring')ring(g,e,6+e.phase*2,a+.3);
  else bolts(g,e,a,2+e.phase*2,.18,3.7+g.definition.act*.2);
  e.exposed=Math.max(e.exposed,1.65+(e.pitBoss==='abyss'?.55:0));e.cooldown=2.25-e.phase*.18;e.cycle=(e.cycle||0)+1;g.emit('bossAttack',{boss:e.pitBoss,attack:e.attack,phase:e.phase});return;
 }
 if(e.state!=='pursue')return;
 if(visible&&e.cooldown<=0){
  const n=e.cycle||0,id=e.pitBoss;
  e.attack=id==='gatekeeper'?(n%2&&e.phase>1?'fan':'ram'):id==='tyrant'?(n%2?'ring':'ground'):id==='mirror'?'cross':e.phase===1?'fan':e.phase===2?(n%2?'ground':'ring'):(n%2?'ram':'ground');
  e.lockedAngle=Math.atan2(p.y-e.y,p.x-e.x);e.markX=p.x;e.markY=p.y;e.tell=e.attack==='ram'?1.1:e.attack==='ground'?1.05:.9;
  warn(g,e,e.attack==='ram'?'RAM LOCKED / STRAFE OR BASH':e.attack==='ground'?'MARKED GROUND / KEEP MOVING':e.attack==='cross'?'MIRROR CROSS / FIND THE GAP':e.attack==='ring'?'RING PULSE / GAP OR COVER':'VOLLEY LOCKED / BREAK SIGHT');return;
 }
 if(e.pitBoss!=='tyrant'&&visible){const a=Math.atan2(p.y-e.y,p.x-e.x),speed=e.pitBoss==='mirror'?.55:.32,side=e.pitBoss==='mirror'?Math.sin(g.time*.7)*.9:0;if(d>4.5||side)moveBody(l,e,Math.cos(a+side)*speed*dt,Math.sin(a+side)*speed*dt,.28);}
}
export function updatePitEnvironment(g,dt){
 if(g.campaign!=='pit')return;
 for(const h of g.level.hazards){const state=hazardState(h,g.time);
  if(state.warning&&h.warned!==state.cycle&&distance(g.player,h)<4&&lineOfSight(g.level,g.player,h)){h.warned=state.cycle;warn(g,h,'FLOOR '+h.kind.toUpperCase()+' / MOVE CLEAR');}
  if(state.active&&distance(g.player,h)<h.radius+.16&&g.time-(h.lastHit??-1)>.8){h.lastHit=g.time;g.damagePlayer(h.damage,h);g.emit('hazardHit',{kind:h.kind,damage:h.damage});}
 }
 for(const b of g.level.blasts){if(!b.hit&&g.time>=b.at){b.hit=true;if(distance(g.player,b)<b.radius&&lineOfSight(g.level,g.player,b))g.damagePlayer(b.damage,b);g.emit('burst',{x:b.x,y:b.y,color:g.definition.color,count:10});}}
 g.level.blasts=g.level.blasts.filter(b=>g.time<b.at+.35);
 g.pitAmbient=(g.pitAmbient||0)-dt;if(g.pitAmbient<=0){g.pitAmbient=9;g.emit('sound',{name:'pit'+(g.definition.act+1)});}
}
