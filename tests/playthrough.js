// Test-only player. Reads the production state and drives public actions + movement.
// It never assigns player coordinates/health, enemy HP, keys, relays, or door states.
import {Game,SECTORS,angleDiff,canOccupy,distance,findRoute,lineOfSight} from '../src/core.js';
export class CampaignDriver {
  constructor({sectors=6,onEvent,game,resume=false,secrets=false,energyMode='legacy'}={}){this.game=game||new Game();if(!resume)this.game.start({energyMode});this.limit=sectors;this.withSecrets=secrets;this.onEvent=onEvent;this.results=[];this.steps=0;this.done=false;this.error=null;this.enterSector();}
  enterSector(){this.route=[];this.goalKey='';this.routeCell='';this.activeCaptive=null;this.detour=null;this.elapsed=0;this.measuredDistance=0;this.pickups=0;this.shots=0;this.defeated=0;this.hosts=0;this.doors=0;this.deaths=0;this.damage=0;this.bossPhases=new Set();this.startLevel=this.game.levelIndex;}
  routeTo(target,secrets=false){return findRoute(this.game.level,this.game.player,target,{allowLocked:this.game.player.key,secrets});}
  chooseGoal(){
    const g=this.game,p=g.player,l=g.level,nightmare=g.levelIndex>=6;
    const resources=l.items.filter(i=>!i.taken&&(i.type==='health'&&p.health<65||i.type==='armor'&&p.armor<35||i.type==='energy'&&(g.survival?p.reserve<80:p.energy<25))).map(i=>({...i,route:this.routeTo(i)})).filter(i=>i.route.length&&i.route.length<23).sort((a,b)=>a.route.length-b.route.length);
    if(resources.length)return {...resources[0],goal:'pickup',key:'pickup-'+resources[0].id};
    const captive=l.captives.find(c=>!c.freed&&c.id===this.activeCaptive)||l.captives.find(c=>!c.freed&&distance(p,c)<2&&lineOfSight(l,p,c));if(captive){this.activeCaptive=captive.id;return {...captive,goal:'captive',key:'captive-'+captive.id};}this.activeCaptive=null;
    const relay=l.relays.find(r=>!r.active);if(relay)return {...relay,goal:'relay',key:'relay-'+relay.id};
    if(!p.key)return {...l.key,goal:'key',key:'key'};
    const c=l.captives.find(c=>!c.freed);if(c)return {...c,goal:'captive',key:'captive-'+c.id};
    if(this.withSecrets&&!l.secretFound){const door=Object.values(l.doors).find(d=>d.type===6);return {x:door.x+.5,y:door.y+.5,goal:'secret',key:'secret'};}
    if(this.withSecrets){const artifact=l.items.find(i=>i.type==='artifact'&&!i.taken);if(artifact)return {...artifact,goal:'artifact',key:'artifact'};}
    const boss=l.enemies.find(e=>!e.dead&&e.type==='warden');if(boss)return {...boss,goal:'boss',key:'boss'};
    return {...l.exit,goal:'exit',key:'exit'};
  }
  finishSector(){const g=this.game;this.results.push({sector:g.levelIndex+1,name:SECTORS[g.levelIndex].name,seconds:+this.elapsed.toFixed(2),distance:+this.measuredDistance.toFixed(2),shots:this.shots,defeated:this.defeated,freed:this.hosts,pickups:this.pickups,doors:this.doors,secrets:g.level.secretFound?1:0,artifacts:g.level.items.filter(i=>i.type==='artifact'&&i.taken).length,deaths:this.deaths,damageTaken:+g.stats.damageTaken.toFixed(2),health:+g.player.health.toFixed(1),bossPhases:[...this.bossPhases]});if(this.results.length>=this.limit){this.done=true;return;}if(g.mode==='ending'){if(!g.continueCampaign()&&!g.continueBeyond())throw Error('Missing next-act continuation');}else g.next();this.enterSector();}
  tick(dt=.025){
    if(this.done)return;try{this.step(dt);}catch(e){this.error=e.message;this.done=true;}return this;
  }
  step(dt){
    const g=this.game;this.steps++;if(g.mode==='complete'||g.mode==='ending'){this.finishSector();return;}
    if(g.mode==='dead'){this.deaths++;if(this.deaths>8)throw Error(`Sector ${g.levelIndex+1}: retry budget exceeded`);g.retry();this.route=[];this.goalKey='';}
    this.elapsed+=dt;if(this.elapsed>600)throw Error(`Sector ${g.levelIndex+1}: traversal timeout at ${g.player.x.toFixed(2)},${g.player.y.toFixed(2)} pursuing ${this.goalKey}`);
    const p=g.player,l=g.level,previous={x:p.x,y:p.y},health=p.health;
    const threats=l.enemies.filter(e=>!e.dead&&distance(p,e)<10&&lineOfSight(l,p,e)).sort((a,b)=>distance(p,a)-distance(p,b));
    const target=threats[0],goal=this.chooseGoal(),goalCell=`${Math.floor(goal.x)},${Math.floor(goal.y)}`,cell=`${Math.floor(p.x)},${Math.floor(p.y)}`;
    if(this.goalKey!==goal.key||this.routeCell!==cell||this.goalCell!==goalCell||!this.route.length){this.goalKey=goal.key;this.goalCell=goalCell;this.routeCell=cell;this.route=this.routeTo(goal,goal.goal==='secret'||goal.goal==='artifact');}
    while(this.route.length>1&&distance(p,this.route[0])<.18)this.route.shift();
    let point=this.route[0]||goal,aim=target?Math.atan2(target.y-p.y,target.x-p.x):Math.atan2(point.y-p.y,point.x-p.x);
    const next=this.route.find(n=>distance(p,n)>.2)||point,door=l.doors[`${Math.floor(next.x)},${Math.floor(next.y)}`];
    if(door&&door.open<.84&&distance(p,{x:door.x+.5,y:door.y+.5})<1.7&&!target){aim=Math.atan2(door.y+.5-p.y,door.x+.5-p.x);g.update(dt,{look:angleDiff(aim,p.a)});if(door.type===6&&!g.shift)g.vision();g.interact();this.observe(previous,health);return;}
    if(['relay','captive'].includes(goal.goal)&&distance(p,goal)<1.3&&lineOfSight(l,p,goal))g.interact();
    if(p.energy<55&&g.recharge<=0&&g.vent<=0)g.reload();
    if(target&&p.ori>=30&&g.oriCooldown<=0)g.oriAbility();
    if(g.bassCharge>=100&&threats.filter(e=>distance(p,e)<6).length>=2)g.bassDrop();
    if(target){const d=distance(p,target),group=threats.length>1;let weapon=g.survival?(d<1.35||p.energy<2?0:1):g.levelIndex>=6&&group&&d<5&&p.energy>=10?2:d<1.35?0:g.unlocked>=6&&target.type==='warden'&&p.energy>=25?5:g.unlocked>=5&&target.type==='enforcer'&&p.energy>=14?4:group&&d<7&&p.energy>=10?2:1;if(p.energy<2)weapon=0;if(weapon!==g.weapon)g.selectWeapon(weapon);}
    let dx=point.x-p.x,dy=point.y-p.y;
    if(target&&!(g.levelIndex>=6&&goal.goal==='pickup'&&goal.type==='health'&&p.health<45&&distance(p,goal)<4)){const d=distance(p,target);if(d<(target.type==='warden'?7:6)&&d>1.2){const side=Math.floor(g.time/(g.levelIndex===11?.65:1.2))%2?1:-1;const tx=-Math.sin(aim)*side,ty=Math.cos(aim)*side;if(canOccupy(l,p.x+tx*.3,p.y+ty*.3)){dx=tx;dy=ty;}}else if(d<1.2){dx=p.x-target.x;dy=p.y-target.y;}}
    if(target&&g.survival&&g.weapon===0){dx=target.x-p.x;dy=target.y-p.y;if(distance(p,target)<1.5&&g.dodgeCooldown<=0)g.dodge();}
    const mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;const forward=Math.cos(aim)*dx+Math.sin(aim)*dy,side=-Math.sin(aim)*dx+Math.cos(aim)*dy;
    const input={sprint:g.levelIndex>=6&&threats.some(e=>e.type==='warden'),look:angleDiff(aim,p.a),forward:forward>.25,back:forward<-.25,right:side>.25,left:side<-.25,fire:!!target&&distance(p,target)<(g.weapon===0?1.7:24)};
    const incoming=g.projectiles.find(b=>b.enemy&&distance(p,b)<(g.levelIndex===11?1.9:1.35));if(incoming&&g.dodgeCooldown<=0)g.dodge({left:Math.floor(g.time)%2===0,right:Math.floor(g.time)%2!==0});
    g.update(dt,input);this.observe(previous,health);
  }
  observe(previous,health){const g=this.game;const moved=distance(previous,g.player);if(moved>1.15)throw Error('Unexpected player displacement');if(!canOccupy(g.level,g.player.x,g.player.y))throw Error('Player entered a solid wall');this.measuredDistance+=moved;this.damage+=Math.max(0,health-g.player.health);for(const e of g.level.enemies)if(e.type==='warden')this.bossPhases.add(e.phase);for(const event of g.events.splice(0)){if(event.type==='shot')this.shots++;if(event.type==='pickup')this.pickups++;if(event.type==='enemyDefeated')this.defeated++;if(event.type==='liberation')this.hosts++;if(event.type==='doorOpened')this.doors++;this.onEvent?.(event,g);}}
  report(){return {passed:this.done&&!this.error&&this.results.length===this.limit,error:this.error,steps:this.steps,results:this.results,method:'Production movement, aim, fire, reload, Ori, dodge, E interactions and exit proximity. No teleportation, direct objective/HP assignment, or calls to complete/damageEnemy.'};}
}
export function runCampaign(options={}){const driver=new CampaignDriver(options);while(!driver.done)driver.tick();return driver.report();}
export function runFailureRecovery(){
  const game=new Game();game.start();for(let i=0;i<100;i++)game.update(.025,{forward:true});game.interact();for(let i=0;i<80;i++)game.update(.025,{forward:true});
  let steps=0;while(game.mode==='playing'&&steps<3600){game.update(.025);steps++;game.events.splice(0);}
  const died=game.mode==='dead',damage=game.stats.damageTaken;if(!died)return {passed:false,error:'Natural enemy attacks did not produce a death',steps};
  game.retry();const retryHealth=game.player.health,retryAtCheckpoint=distance(game.player,SECTORS[0].spawn)<.01;
  const recovery=runCampaign({game,resume:true,sectors:1});return {passed:died&&retryAtCheckpoint&&retryHealth>0&&recovery.passed,naturalDeath:true,secondsToDeath:+(steps*.025).toFixed(2),damageTaken:damage,retryHealth,retryAtCheckpoint,recovery,method:'Walk through the first door, stop firing, take live enemy attacks until death, retry the stored checkpoint, then traverse and clear sector one.'};
}
