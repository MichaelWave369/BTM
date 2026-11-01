import {applyWorld} from '../src/net/codec.js';
// Input-only network planner. It reads received snapshots and emits protocol intents.
// No simulation, HP/position/objective writes, direct damage, or completion calls.
import{CampaignDriver}from'./playthrough.js';import{pitTacticalInput}from'./pit-playthrough.js';import{neutralInput}from'../src/net/protocol.js';import{angleDiff,distance,findRoute,lineOfSight,canOccupy,clamp}from'../src/core.js';
class PlanningView{
 constructor(){this.levelIndex=0;this.player={x:4.5,y:20.5,a:-Math.PI/2};this.level={enemies:[],items:[],captives:[],relays:[],doors:{},key:{},exit:{}};this.stats={damageTaken:0};this.mode='playing';this.events=[];this.wire=neutralInput();}
 refresh(init,snap,id){
  const p=snap.players.find(p=>p.id===id);if(!p)throw Error('Missing own authoritative avatar');this.player={...p};this.level=applyWorld(structuredClone(init.level),snap.world);this.levelIndex=init.level.index;this.campaign=init.level.campaign;this.definition=init.definition;this.time=snap.time;this.projectiles=snap.world.projectiles;this.weapon=p.weapon;this.survival=true;this.unlocked=6;this.stats=p.stats||{damageTaken:0};this.bassCharge=snap.world.bassCharge||0;this.shift=false;this.status=p.status;for(const k of ['recharge','vent','oriCooldown','dodgeCooldown'])this[k]=p[k]||0;this.partners=snap.players.filter(p=>p.id!==id);this.wire={...neutralInput(),angle:p.a,weapon:p.weapon};
 }
 update(dt,input={}){if(this.campaign==='pit')input=pitTacticalInput(this,input);Object.assign(this.wire,{angle:angleDiff(this.player.a+(input.look||0),0),move:input.moveForward??((input.forward?1:0)-(input.back?1:0)),strafe:input.moveStrafe??((input.right?1:0)-(input.left?1:0)),sprint:!!input.sprint,fire:!!input.fire});}
 interact(){this.wire.use=true;}
 action(a){if(!this.wire.actions.includes(a))this.wire.actions.push(a);}
 reload(){this.action('reload');}
 oriAbility(){this.action('ori');}
 bassDrop(){this.action('bass');}
 vision(){this.action('vision');this.shift=true;}
 dodge(){this.action('dash');}
 selectWeapon(w){this.weapon=this.wire.weapon=w;}
}
export class NetworkPlanner extends CampaignDriver{
 constructor(){super({game:new PlanningView(),resume:true,sectors:1});this.revision=-1;}
 chooseGoal(){const down=this.game.partners.filter(p=>p.status==='downed').map(p=>({...p,route:findRoute(this.game.level,this.game.player,p,{allowLocked:this.game.player.key})})).filter(p=>p.route.length).sort((a,b)=>a.route.length-b.route.length)[0];if(down)return{...down,goal:'captive',key:'revive-'+down.id};const g=this.game,p=g.player;if(g.levelIndex>=6||g.campaign==='pit'){const aid=g.level.items.filter(i=>!i.taken&&(i.type==='health'&&p.health<80||i.type==='armor'&&p.armor<50)).map(i=>({...i,route:this.routeTo(i)})).filter(i=>i.route.length&&i.route.length<18).sort((a,b)=>a.route.length-b.route.length);if(aid.length)return{...aid[0],goal:'pickup',key:'pickup-'+aid[0].id};}return super.chooseGoal();}
 observe(){for(const e of this.game.level.enemies)if(e.type==='warden')this.bossPhases.add(e.phase);}
 intent(init,snapshot,id){
  if(this.revision!==init.revision){this.enterSector();this.revision=init.revision;}
  this.game.refresh(init,snapshot,id);const g=this.game,p=g.player,l=g.level,m=g.wire;if(g.status!=='alive'||snapshot.state!=='playing')return m;
  let goal=this.chooseGoal();const needy=p.energy<2&&p.reserve===0;
  if(needy&&!String(goal.key).startsWith('revive-')){const cells=l.items.filter(i=>i.type==='energy'&&!i.taken).map(i=>({...i,route:this.routeTo(i)})).filter(i=>i.route.length).sort((a,b)=>a.route.length-b.route.length);if(cells.length)goal={...cells[0],goal:'pickup',key:'pickup-'+cells[0].id};}
  this.goalKey=goal.key;const threats=l.enemies.filter(e=>!e.dead&&distance(p,e)<10&&lineOfSight(l,p,e)).sort((a,b)=>distance(p,a)-distance(p,b)),target=threats[0],d=target?distance(p,target):99;
  const route=this.routeTo(goal),point=route.length>1?route[1]:goal;let dx=point.x-p.x,dy=point.y-p.y,aim=target?Math.atan2(target.y-p.y,target.x-p.x):Math.atan2(dy,dx);
  const channel=['relay','captive'].includes(goal.goal)&&distance(p,goal)<1.25&&lineOfSight(l,p,goal),urgent=goal.goal==='pickup'&&(needy||goal.type==='health'&&p.health<45);
  let weapon=d<1.45||p.energy<2?0:1;m.weapon=weapon;g.weapon=weapon;
  if(channel){m.use=true;dx=dy=0;}
  else if(target&&(!urgent||d<4)&&(goal.goal==='boss'||weapon===0||g.levelIndex>=6&&g.campaign!=='pit')){if(weapon===0&&d>1.5){const chase=findRoute(l,p,target,{allowLocked:p.key}),next=chase.length>1?chase[1]:chase[0];if(next){dx=next.x-p.x;dy=next.y-p.y;}}else if(weapon===0&&d<=1.5){dx=dy=0;}else if(d<8&&d>1.5){const side=Math.floor(g.time/(g.levelIndex>=6?.45:1.3))%2?1:-1;const x=-Math.sin(aim)*side,y=Math.cos(aim)*side;if(canOccupy(l,p.x+x*.3,p.y+y*.3)){dx=x;dy=y;}}}
  const door=l.doors[Math.floor(point.x)+','+Math.floor(point.y)];if(door&&door.open<.84&&distance(p,{x:door.x+.5,y:door.y+.5})<1.7){aim=Math.atan2(door.y+.5-p.y,door.x+.5-p.x);m.use=true;dx=dy=0;}
  const mag=Math.hypot(dx,dy)||1;m.angle=aim;m.move=(Math.cos(aim)*dx+Math.sin(aim)*dy)/mag;m.strafe=(-Math.sin(aim)*dx+Math.cos(aim)*dy)/mag;m.sprint=!channel&&goal.goal!=='boss';m.fire=!!target&&d<(weapon===0?1.7:24)&&(!target.pitBoss||target.exposed>0||weapon===0);
  if(g.bassCharge>=100&&threats.filter(e=>distance(p,e)<6).length>=2)m.actions.push('bass');
  if(p.energy<55&&p.reserve>0&&g.vent<=0&&g.recharge<=0)m.actions.push('reload');if(target&&d<7&&p.ori>=30&&g.oriCooldown<=0)m.actions.push('ori');
  if(target&&g.dodgeCooldown<=0&&!channel&&(d<1.5||threats.length>=2)){m.actions.push('dash');m.dashAngle=angleDiff(aim+(d<1.5?0:Math.PI/2),0);}const bolt=g.projectiles.find(b=>b.enemy&&distance(p,b)<1.5);if(bolt&&g.dodgeCooldown<=0&&!m.actions.includes('dash')){m.actions.push('dash');m.dashAngle=angleDiff(bolt.a+Math.PI/2,0);}
  if(g.campaign==='pit'){const t=pitTacticalInput(g,{look:angleDiff(aim,p.a),forward:m.move>.25,back:m.move<-.25,right:m.strafe>.25,left:m.strafe<-.25,fire:m.fire,sprint:m.sprint});m.move=(t.forward?1:0)-(t.back?1:0);m.strafe=(t.right?1:0)-(t.left?1:0);m.fire=t.fire;m.sprint=t.sprint;}
  m.move=clamp(m.move,-1,1);m.strafe=clamp(m.strafe,-1,1);return m;
 }
}
