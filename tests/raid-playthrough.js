// Input-only raid planner. All mechanics run in the host; this emits ordinary player intents.
import{applyWorld}from'../src/net/codec.js';
import{neutralInput}from'../src/net/protocol.js';
import{distance,lineOfSight,findRoute,clamp,angleDiff,canOccupy}from'../src/core.js';
export class RaidPlanner{
 intent(init,s,id){
  const p=s.players.find(a=>a.id===id),l=applyWorld(structuredClone(init.level),s.world),m={...neutralInput(),angle:p.a,weapon:p.weapon};if(p.status!=='alive'||s.state!=='playing')return m;
  const index=s.players.findIndex(a=>a.id===id)%2,raid=s.raid,route=t=>{if(raid.phase!==2)return findRoute(l,p,t,{allowLocked:true});const planning={...l,cells:l.cells.map(row=>row.slice())};planning.cells[13][14]=3;return findRoute(planning,p,t,{allowLocked:true});},down=s.players.find(a=>a.id!==id&&a.status==='downed');
  let goal;if(down)goal={...down,channel:true};
  if(!goal){const supplies=l.items.filter(i=>!i.taken&&(i.type==='health'&&p.health<70||i.type==='armor'&&p.armor<30||i.type==='energy'&&p.reserve<45)).map(i=>({...i,route:route(i)})).filter(i=>i.route.length).sort((a,b)=>a.route.length-b.route.length);if(supplies.length&&(p.health<40||p.energy<8&&p.reserve===0||supplies[0].route.length<9))goal=supplies[0];}
  if(!goal){if(raid.state==='escape')goal=l.exit;else if(raid.phase===1){const pylons=l.enemies.filter(e=>e.raidRole==='pylon'&&!e.dead).sort((a,b)=>(Math.abs(a.x-(index?23.5:5.5))-Math.abs(b.x-(index?23.5:5.5)))||distance(p,a)-distance(p,b));goal=pylons[0];}else{const positions=raid.phase===2?[[6.5,13.5],[22.5,13.5]]:raid.phase===3?[[8.5,8.5],[20.5,8.5]]:[[7.5,5.5],[21.5,5.5]];goal={x:positions[index][0],y:positions[index][1],channel:true};}}
  goal||=l.exit;this.goal=goal.id??goal.x+','+goal.y;
  const path=route(goal),point=path.length>1?path[1]:goal,channel=!!goal.channel&&distance(p,goal)<1.2&&lineOfSight(l,p,goal),enemies=l.enemies.filter(e=>!e.dead&&lineOfSight(l,p,e)&&(e.raidRole==='core'?raid.phase===4&&raid.openUntil>s.time:distance(p,e)<20));
  enemies.sort((a,b)=>(a.raidRole==='core'?-100:distance(p,a))-(b.raidRole==='core'?-100:distance(p,b)));const target=enemies[0],d=target?distance(p,target):99;
  let aim=target?Math.atan2(target.y-p.y,target.x-p.x):Math.atan2(point.y-p.y,point.x-p.x),dx=point.x-p.x,dy=point.y-p.y;
  m.weapon=d<1.65||p.energy<2?0:1;
  if(channel){m.use=true;dx=dy=0;}
  else if(goal.raidRole&&target===goal&&d<9&&p.energy>=2){const side=index?1:-1;dx=-Math.sin(aim)*side;dy=Math.cos(aim)*side;if(!canOccupy(l,p.x+dx*.4,p.y+dy*.4))dx=dy=0;}
  if(target&&m.weapon===0&&!channel&&raid.state!=='escape'&&(!target.raidRole||target.raidRole==='pylon'||raid.openUntil>s.time)){const chase=route(target),n=chase.length>1?chase[1]:target;if(d>1.5){dx=n.x-p.x;dy=n.y-p.y;}}
  const door=l.doors[Math.floor(point.x)+','+Math.floor(point.y)];if(door&&door.open<.84&&distance(p,{x:door.x+.5,y:door.y+.5})<1.7){m.use=true;dx=dy=0;aim=Math.atan2(door.y+.5-p.y,door.x+.5-p.x);}
  const mag=Math.hypot(dx,dy)||1;m.angle=aim;m.move=clamp((Math.cos(aim)*dx+Math.sin(aim)*dy)/mag,-1,1);m.strafe=clamp((-Math.sin(aim)*dx+Math.cos(aim)*dy)/mag,-1,1);m.sprint=!channel;m.fire=!!target&&d<(m.weapon===0?1.8:24)&&raid.state!=='escape';
  if(p.energy<55&&p.reserve>0&&p.vent<=0&&p.recharge<=0)m.actions.push('reload');if(target&&d<7&&p.ori>=30&&p.oriCooldown<=0&&raid.phase!==3)m.actions.push('ori');
  if(!channel&&p.dodgeCooldown<=0&&(d<1.5||s.world.projectiles.some(b=>b.enemy&&distance(p,b)<1.5))){m.actions.push('dash');m.dashAngle=angleDiff(aim+(d<1.5?0:Math.PI/2),0);}
  return m;
 }
}
