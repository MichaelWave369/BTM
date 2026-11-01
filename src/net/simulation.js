import {Finale,createRaidLevel,RAID_DEFINITION} from './finale.js';
import {packWorld,raidObjectiveTarget} from './codec.js';
import {Game,SECTORS,CAMPAIGN_HOSTS,WEAPONS,clamp,angleDiff,distance,moveBody,canOccupy,lineOfSight,solidAt,createLevel} from '../core.js';
import {PIT_STAGES,PIT_HOSTS} from '../pit.js';
import {safeTrackedAim,entityHeight,WALL_HEIGHT} from '../spatial.js';
import {hazardState} from '../pit-combat.js';
import {createArena} from './arenas.js';
import {freshControlState,controlZone,controlSnapshot,advanceControl} from './control-zones.js';
import {neutralInput,TICK_RATE} from './protocol.js';
export const AVATAR_FIELDS=['damageDirection','weapon','cooldown','recharge','vent','shotAnim','hurt','shake','dodgeCooldown','dodgeFlash','shieldTime','shieldCharge','oriCooldown','objectiveTime','hitPulse','assistTime','scanTime','equipAnim','portraitTime','speechCooldown','muzzle','shift','charge','stats','playerMotion','combatPose','lessonDistance','footDistance','moving','sprinting','bufferedFire','nav','navTime'];
const round=n=>Math.round(n*1000)/1000;
export const STAGES=Object.freeze([...SECTORS.map((d,index)=>({campaign:'original',index,name:d.name})),...PIT_STAGES.map((d,index)=>({campaign:'pit',index,name:d.name}))]);
class SharedWorld extends Game{
 constructor(room){super();this.room=room;}
 get definition(){return this.room?._definition||super.definition;}
 get liberation(){return this.room&&!this.room.competitive?Math.round(this.totalFreed/(CAMPAIGN_HOSTS+PIT_HOSTS)*100):super.liberation;}
 get objective(){return this.room?.raid?this.room.raid.state==='escape'?'SQUAD EXTRACT / SOUTH BRIDGE':this.room.raid.phase===1?'DESTROY THE FOUR SHIELD PYLONS':this.room.raid.phase===2?'TWO CONSOLES / USE THE END BRIDGES':this.room.raid.phase===3?'RESTORE ORI / BOTH REPAIR DISHES':'SYNCHRONIZE RESONATORS / EXPOSE PRIME':super.objective;}
 get objectiveTarget(){return this.room?.raid?raidObjectiveTarget(this.level,this.player,{...this.room.raid.snapshot(),time:this.time}):super.objectiveTarget;}
 get exitReady(){return this.room?.raid?this.room.raid.state==='escape':this.room?.competitive?false:super.exitReady;}
 complete(){return this.room?.extract()||false;}
 saveCheckpoint(){if(this.room)this.room.dirty=true;return true;}
 banter(key,...args){if(this.room?.raid&&key==='boss-down')return false;return super.banter(key,...args);}
 emit(type,data={}){super.emit(type,{...data,...(this.actorId?{actorId:this.actorId}:{})});}
 damagePlayer(amount,source){
  const a=this.room?.actors.get(this.actorId);if(!a||a.status!=='alive'||a.invulnerable>this.time)return;
  super.damagePlayer(amount,source);this.mode='playing';
  if(a.player.health<=0)this.room.defeat(a,null);
 }
 damageEnemy(e,damage,stun=0,source='weapon'){
  if(e.networkId){this.room.hurt(this.room.actors.get(e.networkId),damage,this.room.actors.get(this.actorId));return;}
  if(e.raidRole&&this.room.raid&&!this.room.raid.hit(e,damage,stun,source))return;
  super.damageEnemy(e,damage,stun,source);if(e.dead&&e.raidRole)this.room.raid.defeated(e);
 }
 shoot(alternate=false,charge=0){
  const room=this.room,a=room?.actors.get(this.actorId);if(!a||a.status!=='alive')return false;
  if(a.input.aim)this.room.trackedPose(a,a.input.aim);
  const old=this.level.enemies,start=this.projectiles.length;
  if(room.competitive)this.level.enemies=room.targets(a);
  try{const fired=super.shoot(alternate,charge);if(fired){a.invulnerable=0;for(const b of this.projectiles.slice(start)){b.owner=a.id;b.weapon=this.weapon;}if(this.projectiles.length>128)this.projectiles.length=128;}return fired;}
  finally{this.level.enemies=old;}
 }
 dodge(input={}){
  const old=this.level.enemies;if(this.room.competitive)this.level.enemies=this.room.targets(this.room.actors.get(this.actorId));
  try{return super.dodge(input);}finally{this.level.enemies=old;}
 }
 updateEnemy(e,dt){
  if(e.raidRole)return;const a=this.room.target(e);if(!a)return;
  this.room.withActor(a,()=>super.updateEnemy(e,dt));
 }
 collectPlayerItems(){
  if(this.room.competitive)return super.collectPlayerItems();
  const reserved=this.level.items.filter(i=>i.ownerId&&i.ownerId!==this.actorId&&!i.taken);for(const i of reserved)i.taken=true;
  const entries=[];for(const i of this.level.items)if(i.type==='energy'&&i.claims){const available=Math.max(0,45-(i.claims[this.actorId]||0));entries.push({item:i,pool:i.remaining,taken:i.taken,available});i.remaining=Math.min(i.remaining,available);if(available<=0)i.taken=true;}
  super.collectPlayerItems();
  for(const i of reserved)i.taken=false;
  for(const {item:i,pool,taken,available}of entries){const spent=Math.min(pool,available)-(i.remaining||0);i.claims[this.actorId]=(i.claims[this.actorId]||0)+Math.max(0,spent);i.remaining=pool-Math.max(0,spent);i.taken=taken||i.remaining<=0;}
 }
 updateEnvironment(dt){
  const room=this.room,l=this.level;
  for(const h of l.hazards||[]){const state=hazardState(h,this.time);
   for(const a of room.live()){if(distance(a.player,h)>=h.radius+.16)continue;
    if(state.warning&&h.warned!==state.cycle){h.warned=state.cycle;this.emit('pitTell',{text:'FLOOR '+h.kind.toUpperCase()+' / MOVE CLEAR'});}
    h.hits??={};if(state.active&&this.time-(h.hits[a.id]??-1)>.8){h.hits[a.id]=this.time;room.withActor(a,()=>this.damagePlayer(h.damage,h));}
   }
  }
  for(const b of l.blasts||[])if(!b.hit&&this.time>=b.at){b.hit=true;for(const a of room.live())if(distance(a.player,b)<b.radius&&lineOfSight(l,a.player,b))room.withActor(a,()=>this.damagePlayer(b.damage,b));this.emit('burst',{x:b.x,y:b.y,color:this.definition.color,count:10});}
  if(l.blasts)l.blasts=l.blasts.filter(b=>this.time<b.at+.35);
 }
 updateProjectiles(dt){
  const l=this.level,room=this.room;
  for(const b of this.projectiles){
   for(let i=0;i<3&&!b.dead;i++){
    b.x+=Math.cos(b.a)*b.speed*dt/3;b.y+=Math.sin(b.a)*b.speed*dt/3;if(Number.isFinite(b.height))b.height+=(b.vh||0)*dt/3;
    if(solidAt(l,b.x,b.y)||Number.isFinite(b.height)&&(b.height<0||b.height>WALL_HEIGHT)){b.dead=true;break;}
    if(b.enemy||room.competitive){const a=room.live().find(a=>a.id!==b.owner&&distance(a.player,b)<.28&&(!Number.isFinite(b.height)||b.height>=.08&&b.height<=(a.input.aim?.eye||1.03)+.08));if(a){if(b.enemy)room.withActor(a,()=>this.damagePlayer(b.damage,b));else room.hurt(a,b.damage,room.actors.get(b.owner));b.dead=true;}}
    else{const e=l.enemies.find(e=>!e.dead&&distance(e,b)<.4&&(!Number.isFinite(b.height)||b.height>=0&&b.height<=entityHeight(e.type)));if(e){const a=room.actors.get(b.owner);if(a)room.withActor(a,()=>{const weapon=this.weapon;this.weapon=b.weapon;this.damageEnemy(e,b.damage,.2);this.weapon=weapon;});b.dead=true;}}
   }b.life-=dt;
  }this.projectiles=this.projectiles.filter(b=>!b.dead&&b.life>0).slice(0,128);
 }
}
export class Room{
 constructor({code,mode='deathmatch',arena='no-carrier',limit=10,capacity=2,finaleEnabled=true}){
  this.finaleEnabled=finaleEnabled;this.raid=null;this.control=null;this.code=code;this.mode=mode;this.arena=arena;this.limit=limit;this.capacity=capacity;this.competitive=mode!=='coop';this.actors=new Map();this.owner=null;this.state='lobby';this.tick=0;this.elapsed=0;this.revision=0;this.eventId=0;this.events=[];this.stage=0;this.receipts=[];this.teamScore={cyan:0,pink:0};this.round=1;this.dirty=false;this.game=new SharedWorld(this);this.game.events=[];
 }
 add({id,nickname,token}){
  if(this.state!=='lobby'||!this.competitive&&this.started)throw Error('Campaign in progress; use your reconnect token');if(this.actors.size>=this.capacity)throw Error('Room full');
  const a={id,nickname,token,connected:true,ready:false,team:this.mode==='coop'?'cyan':this.actors.size%2?'pink':'cyan',status:'lobby',frags:0,deaths:0,lastSeq:0,lastInput:-99,input:neutralInput(),actions:[],player:null,feel:{},lastEvent:0};this.actors.set(id,a);this.owner??=id;this.event('joined',{player:id});return a;
 }
 disconnect(id){const a=this.actors.get(id);if(!a)return;a.connected=false;a.disconnectedAt=this.elapsed;a.input=neutralInput();a.actions=[];if(this.owner===id)this.owner=[...this.actors.values()].find(p=>p.connected)?.id||id;this.event('disconnected',{player:id});this.dirty=true;}
 reconnect(a){a.connected=true;a.input=neutralInput();a.actions=[];a.lastInput=this.elapsed;this.event('reconnected',{player:a.id});return a;}
 remove(id){this.actors.delete(id);if(this.owner===id)this.owner=[...this.actors.values()].find(a=>a.connected)?.id||this.actors.keys().next().value||null;this.event('left',{player:id});}
 live(){return [...this.actors.values()].filter(a=>a.status==='alive');}
 withActor(a,fn){
  const g=this.game;if(g.actorId===a.id)return fn();const old={player:g.player,actorId:g.actorId};for(const k of AVATAR_FIELDS)old[k]=g[k];
  g.player=a.player;g.actorId=a.id;for(const k of AVATAR_FIELDS)g[k]=a.feel[k];
  try{return fn();}finally{for(const k of AVATAR_FIELDS)a.feel[k]=g[k];for(const [k,v]of Object.entries(old))g[k]=v;}
 }
 spawn(a,index,carry=false){
  const g=this.game,prior=a.player,positions=this.spawns;
  let s=positions[index%positions.length];
  if(this.competitive){
   const foes=this.live().filter(p=>p!==a),clearance=point=>Math.min(99,...foes.map(p=>distance(p.player,{x:point[0],y:point[1]})));
   s=[...positions].sort((a,b)=>clearance(b)-clearance(a))[0];
  }
  a.player={x:s[0],y:s[1],a:s[2],health:carry?Math.max(40,prior?.health||0):100,armor:carry?Math.max(0,prior?.armor||0):25,energy:carry?prior?.energy??100:100,reserve:carry?prior?.reserve??45:45,ori:100,vision:100,key:false};
  a.usedAt=-1;a.chargeTime=0;a.status='alive';a.invulnerable=g.time+(this.competitive?1.25:2);a.revive=0;a.input=neutralInput();a.input.angle=s[2];a.actions=[];
  const old={};for(const k of AVATAR_FIELDS)old[k]=g[k];g.resetFeel();for(const k of AVATAR_FIELDS)a.feel[k]=typeof g[k]==='number'?0:g[k];a.feel.weapon=1;a.feel.recharge=a.feel.vent=a.feel.cooldown=0;a.feel.shieldCharge=0;a.feel.shieldTime=0;a.feel.stats={distance:0,damageTaken:0,damageDealt:0,shots:0,doors:0,pickups:0,oriAssists:0};a.feel.nav=null;a.feel.navTime=0;a.feel.bufferedFire=null;for(const k of AVATAR_FIELDS)g[k]=old[k];
 }
 start(id){
  if(id!==this.owner||this.state!=='lobby')throw Error('Only the room owner can start from the lobby');for(const a of this.actors.values())if(!a.connected)this.remove(a.id);const connected=[...this.actors.values()].filter(a=>a.connected);if(connected.length<2||connected.some(a=>!a.ready))throw Error('At least two connected, ready players are required');
  if(['team','clan','control'].includes(this.mode))connected.forEach((a,i)=>a.team=i%2?'pink':'cyan');
  this.started=true;this.raid=null;this.game.totalFreed=0;this.game.totalArtifacts=0;this.game.totalSecrets=0;this.game.campaignTime=0;this.game.rng=369;this.partySize=connected.length;this.stage=0;this.receipts=[];this.teamScore={cyan:0,pink:0};this.round=1;for(const a of this.actors.values()){a.frags=a.deaths=0;}this.load(false);this.event('started');
 }
 load(carry=true){
  const g=this.game;this.state='playing';this.result=null;this.revision++;g.events=[];g.projectiles=[];g.mode='playing';g.energyMode='survival';g.unlocked=6;g.totalArtifacts??=0;
  if(this.competitive){const a=createArena(this.arena);this._definition=a.definition;g.campaign='original';g.levelIndex=0;g.level=a.level;g.time=0;this.spawns=a.spawns;this.control=this.mode==='control'?freshControlState(this.arena,g.level):null;if(this.control){const z=controlZone(this.control);g.level.raidNodes=[{x:z.x,y:z.y,active:false}];}}
  else{const d=STAGES[this.stage];this._definition=null;g.campaign=d.campaign;g.loadLevel(d.index,false);g.unlocked=6;g.level.items.forEach(i=>{if(i.type==='energy'){i.remaining=45*this.partySize;i.claims={};}});for(const e of g.level.enemies){e.hp=e.maxHp=Math.round(e.maxHp*(1+.45*(this.partySize-1))/Math.sqrt(d.campaign==='original'&&d.index>=6?g.definition.difficulty||1:1));e.damage*=1+.12*(this.partySize-1);}if(d.campaign==='original'&&d.index>=6)this.addSquadCaches();this.spawns=this.coopSpawns(g.definition.spawn);}
  let i=0;for(const a of this.actors.values())this.spawn(a,i++,carry&&!this.competitive);
  g.player=this.actors.values().next().value.player;g.resetFeel();g.mode='playing';g.events=[];this.stageStart=this.checkpoint(false);this.dirty=true;
 }
 addSquadCaches(){
  const l=this.game.level,p=this.game.definition.spawn,room=this.game.definition.rooms[0],used=new Set([...l.items,...l.enemies,...l.relays,...l.captives].map(i=>Math.floor(i.x)+','+Math.floor(i.y))),spots=[];
  for(let y=room[1];y<=room[3];y++)for(let x=room[0];x<=room[2];x++)if(canOccupy(l,x+.5,y+.5)&&Math.hypot(x+.5-p.x,y+.5-p.y)>1.5&&!used.has(x+','+y))spots.push({x:x+.5,y:y+.5});
  spots.sort((a,b)=>distance(a,p)-distance(b,p));let id=Math.max(...l.items.map(i=>i.id))+1;
  for(let i=0;i<2;i++){const point=spots.shift();if(!point)throw Error('Co-op cache has no safe floor');l.items.push({id:id++,type:'energy',...point,taken:false,remaining:45*this.partySize,claims:{},squadCache:true});}
  for(const a of this.actors.values())for(const type of ['armor','health','health']){const point=spots.shift();if(!point)throw Error('Co-op supply cache has no safe floor');l.items.push({id:id++,type,...point,taken:false,ownerId:a.id,squadCache:true});}
 }
 loadRaid(){
  if(this.competitive||this.receipts.length!==24||!this.finaleEnabled)throw Error('Twenty-four verified stages are required');
  const g=this.game;this._definition=RAID_DEFINITION;g.campaign='original';g.levelIndex=0;g.level=createRaidLevel(this.partySize);for(const i of g.level.items)if(i.type==='energy')i.claims={};g.time=0;g.projectiles=[];g.events=[];g.unlocked=6;g.mode='playing';g.resetFeel();this.spawns=[[7.5,21.5,-Math.PI/2],[21.5,21.5,-Math.PI/2],[5.5,21.5,-Math.PI/2],[23.5,21.5,-Math.PI/2]];let index=0;for(const a of this.actors.values())this.spawn(a,index++,true);g.player=this.actors.values().next().value.player;this.raid=new Finale(this);this.state='playing';this.result=null;this.revision++;this.stageStart=this.checkpoint(false);this.dirty=true;this.raid.tell('THE AWAKENING / four shield pylons. Keep the whole squad in the signal.');
 }
 coopSpawns(p){const points=[[p.x,p.y,p.a]];for(let radius=.6;radius<2&&points.length<4;radius+=.5)for(let i=0;i<8&&points.length<4;i++){const x=p.x+Math.cos(i*Math.PI/4)*radius,y=p.y+Math.sin(i*Math.PI/4)*radius;if(canOccupy(this.game.level,x,y))points.push([x,y,p.a]);}return points;}
 trackedPose(a,m){
  const g=this.game,head={x:a.player.x,y:a.player.y,height:m.eye},aim=safeTrackedAim(g.level,head,{origin:{x:a.player.x+m.x,y:a.player.y+m.y,height:m.height},direction:{x:m.dx,y:m.dy,z:m.dz}});
  g.setCombatPose({head,aim});
 }
 input(a,m){
  if(m.seq<=a.lastSeq||m.seq>a.lastSeq+120)return false;if(a.actions.length+m.actions.length>8)return false;
  a.lastSeq=m.seq;a.lastInput=this.elapsed;a.input={...m,actions:[]};a.actions.push(...m.actions);return true;
 }
 command(a,m){
  if(m.type==='ready'){if(this.state!=='lobby')throw Error('Return to lobby first');a.ready=m.ready;}
  else if(m.type==='start'){if(!this.competitive&&this.state==='suspended'){if(a.id!==this.owner)throw Error('Only SYSOP can resume the shared session');this.state=this.resumeState||'playing';return;}this.start(a.id);}
  else if(m.type==='lobby'){if(!this.competitive&&this.state==='wipe')throw Error('Retry the squad checkpoint before suspending');if(a.id!==this.owner)throw Error('Only owner returns the room to lobby');this.resumeState=this.state;this.state=this.competitive?'lobby':'suspended';for(const p of this.actors.values()){p.ready=false;p.input=neutralInput();p.actions=[];}this.dirty=true;}
  else if(m.type==='next'){if(a.id!==this.owner||this.competitive||this.state!=='cleared')throw Error('A cleared cooperative stage is required');if(this.stage>=23){if(!this.finaleEnabled||this.receipts.length!==24)throw Error('The Final Frequency is not available on this node');this.loadRaid();return;}this.stage++;this.load(true);}
  else if(m.type==='retry'){if(a.id!==this.owner||this.state!=='wipe')throw Error('Retry requires a squad wipe');this.restore(this.stageStart);this.state='playing';for(const p of this.actors.values())p.player.health=Math.max(65,p.player.health);this.revision++;}
  else if(m.type==='save'){if(this.competitive)throw Error('Only co-op campaigns have host saves');this.dirty=true;}
 }
 target(e){
  const live=this.live().filter(a=>a.connected);if(!live.length)return null;
  const prior=this.actors.get(e.targetId);if(prior?.status==='alive'&&prior.connected&&e.targetUntil>this.game.time&&distance(e,prior.player)<13)return prior;
  const best=[...live].sort((a,b)=>distance(e,a.player)-distance(e,b.player))[0];e.targetId=best.id;e.targetUntil=this.game.time+.7;return best;
 }
 targets(shooter){return this.live().filter(a=>a!==shooter&&(this.mode==='deathmatch'||a.team!==shooter.team)).map(a=>({...a.player,networkId:a.id,type:'plugged',human:false,dead:false,hp:a.player.health,maxHp:100,stun:0,phase:1}));}
 hurt(a,amount,killer){
  if(!a||a.status!=='alive'||a.invulnerable>this.game.time||!killer||a.id===killer.id||this.mode!=='deathmatch'&&a.team===killer.team)return;
  this.withActor(a,()=>{const g=this.game;g.damagePlayer(amount,killer.player);});
  if(a.status!=='alive'&&killer.id!==a.id){killer.frags++;if(this.mode==='team')this.teamScore[killer.team]++;this.event('frag',{killer:killer.id,victim:a.id});if(['deathmatch','team'].includes(this.mode)&&(this.mode==='team'?this.teamScore[killer.team]:killer.frags)>=this.limit){this.state='results';this.result={winner:this.mode==='team'?killer.team:killer.id,reason:'frag-limit'};}}
 }
 defeat(a){
  if(a.status!=='alive')return;a.player.health=0;a.input=neutralInput();a.actions=[];a.deaths++;
  a.status=this.competitive?'dead':'downed';a.respawnAt=this.game.time+3;a.bleedAt=this.game.time+45;a.feel.bufferedFire=null;this.event(this.competitive?'death':'downed',{player:a.id});
 }
 use(a,dt){
  const down=[...this.actors.values()].find(p=>p!==a&&p.status==='downed'&&distance(a.player,p.player)<1.45&&lineOfSight(this.game.level,a.player,p.player));
  if(!this.competitive&&down){if(down.reviveBy&&down.reviveBy!==a.id&&down.reviveTick===this.tick)return;if(down.reviveBy&&down.reviveBy!==a.id)down.revive=0;down.reviveBy=a.id;down.reviveTick=this.tick;down.revive=(down.revive||0)+dt;if(down.revive>=2){down.status='alive';down.player.health=35;down.revive=0;this.event('revived',{player:down.id,by:a.id});}return;}
  if(this.raid?.use(a))return;
  if(this.game.time-(a.usedAt??-1)>.25){a.usedAt=this.game.time;this.withActor(a,()=>this.game.interact());}
 }
 extract(){
  if(this.raid)return this.raid.extract();
  if(this.competitive||this.state!=='playing'||!this.game.exitReady)return false;
  const active=this.live().filter(a=>a.connected);if(!active.length||active.some(a=>distance(a.player,this.game.level.exit)>1.8))return false;
  this.receipts.push({stage:this.stage+1,...STAGES[this.stage],seconds:this.game.time,relays:this.game.level.relays.every(r=>r.active),key:this.game.level.key.taken,captives:this.game.level.captives.every(c=>c.freed),bosses:this.game.level.enemies.filter(e=>e.type==='warden').map(e=>({id:e.pitBoss||'warden',dead:e.dead,phase:e.phase}))});
  this.state='cleared';this.result={stage:this.stage+1,name:STAGES[this.stage].name};this.event('stageCleared',{stage:this.stage+1});this.dirty=true;return true;
 }
 step(dt=1/TICK_RATE){
  this.tick++;this.elapsed+=dt;
  for(const a of this.actors.values()){if(!a.connected&&this.elapsed-a.disconnectedAt>90&&this.state==='lobby')this.remove(a.id);if(a.status==='downed'&&this.game.time>=a.bleedAt)a.status='dead';}
  if(this.state!=='playing'||![...this.actors.values()].some(a=>a.connected))return;
  const g=this.game;g.time+=dt;
  if(this.competitive)for(const a of this.actors.values())if(a.connected&&a.status==='dead'&&this.mode!=='clan'&&g.time>=a.respawnAt)this.spawn(a,this.tick);
  for(const a of this.live()){
   if(this.state!=='playing')break;if(a.status!=='alive')continue;
   const m=this.elapsed-a.lastInput>.3?{...neutralInput(),angle:a.player.a,weapon:a.feel.weapon}:a.input;
   this.withActor(a,()=>{
    g.player.a=angleDiff(m.angle,0);g.weapon=m.weapon;
    const speed=m.sprint?4.1:2.65,c=Math.cos(g.player.a),s=Math.sin(g.player.a),wx=(m.roomX||0),wy=(m.roomY||0),f=m.move*speed+c*wx+s*wy,r=m.strafe*speed-s*wx+c*wy;
    g.updatePlayer(dt,{moveForward:f/4.1,moveStrafe:r/4.1,sprint:true,deferFire:true});g.sprinting=m.sprint;
    if(m.aim)this.trackedPose(a,m.aim);else g.clearCombatPose();
    g.collectPlayerItems();
    if(m.charging)a.chargeTime=Math.min(1.5,(a.chargeTime||0)+dt);
    for(const action of a.actions.splice(0)){if(action==='alternate'){if((a.chargeTime||0)>.12)g.requestFire(true,a.chargeTime/1.5);a.chargeTime=0;}else if(action==='fire')g.requestFire();else if(action==='reload')g.reload();else if(action==='dash')g.dodge({angle:m.dashAngle??g.player.a});else if(action==='ori'&&!this.competitive&&!this.raid?.corrupted)g.oriAbility();else if(action==='bass'&&!this.competitive)g.bassDrop();else if(action==='vision')g.vision();}
    if(!m.charging)a.chargeTime=0;g.advanceCombat(dt,m.fire&&!m.charging);if(m.use)this.use(a,dt);
   });
  }
  if(this.state!=='playing'){this.flushEvents();return;}
  this.raid?.update(dt);
  if(this.state!=='playing'){this.flushEvents();return;}
  const active=this.live().filter(a=>a.connected),primary=active[this.tick%Math.max(1,active.length)];
  for(const a of this.actors.values()){
   if(a.status==='downed'&&a.reviveTick!==this.tick){a.revive=0;a.reviveBy=null;}
   if(this.game.level.key.taken&&a.player)a.player.key=true;
  }
  if(primary)this.withActor(primary,()=>{g.updateShared(dt);if(this.competitive){g.updateEnvironment(dt);g.updateProjectiles(dt);}else{const auto=g.oriAuto;if(this.raid?.corrupted)g.oriAuto=1e9;g.updateWorld(dt);if(this.raid?.corrupted)g.oriAuto=auto;}});
  if(this.state!=='playing'){this.flushEvents();return;}
  if(this.competitive){for(const item of g.level.items){if(item.taken&&item.respawnAt===undefined)item.respawnAt=g.time+(item.type==='energy'?10:15);if(item.taken&&g.time>=item.respawnAt){item.taken=false;delete item.remaining;delete item.respawnAt;}}
   if(this.mode==='control'&&this.control){
     const change=advanceControl(this.control,this.actors.values(),g.level,g.time,dt,this.teamScore,this.limit);
     const zone=controlZone(this.control);g.level.raidNodes=[{x:zone.x,y:zone.y,active:!!this.control.holder&&!this.control.contested}];
     if(change.rotated)this.event('controlZone',{index:this.control.index,x:zone.x,y:zone.y});
     if(change.point)this.event('controlScore',{cyan:this.teamScore.cyan,pink:this.teamScore.pink,holder:this.control.holder});
     if(change.winner){this.state='results';this.result={winner:change.winner,reason:'control-limit'};}
    }
    if(this.mode==='clan'){const teams=new Set(this.live().map(a=>a.team));if(teams.size<2){const winner=[...teams][0]||null;if(winner)this.teamScore[winner]++;this.state='round';this.result={winner,reason:'elimination'};this.nextRound=g.time+3;}}
  }else if(!this.live().filter(a=>a.connected).length||this.raid&&[...this.actors.values()].filter(a=>['alive','downed'].includes(a.status)).length<2){this.state='wipe';this.event('wipe',{text:this.raid?'TWO SURVIVING SIGNALS REQUIRED / RETRY RAID CHECKPOINT':'SQUAD DOWN'});}
  this.flushEvents();
 }
 advanceIntermission(dt){if(this.state==='round'){this.game.time+=dt;if(this.game.time>=this.nextRound){if(Object.values(this.teamScore).some(s=>s>=this.limit))this.state='results';else{this.round++;this.load(false);}}}}
 flushEvents(){for(const e of this.game.events.splice(0)){if(e.type==='checkpoint'||e.type==='complete'||e.type==='dead')continue;this.event(e.type,e);}}
 event(type,data={}){this.events.push({...data,type,id:++this.eventId});if(this.events.length>96)this.events.shift();}
 roster(){return [...this.actors.values()].map(a=>({id:a.id,nickname:a.nickname,connected:a.connected,ready:a.ready,team:a.team,status:a.status,frags:a.frags,deaths:a.deaths}));}
 init(){return{type:'world',revision:this.revision,definition:this.game.definition,level:structuredClone(this.game.level),stage:this.stage,competitive:this.competitive};}
 snapshot(a){
  const g=this.game,events=this.events.filter(e=>e.id>a.lastEvent);a.lastEvent=this.eventId;
  const players=[...this.actors.values()].filter(a=>a.player).map(a=>({id:a.id,nickname:a.nickname,team:a.team,connected:a.connected,status:a.status,frags:a.frags,deaths:a.deaths,seq:a.lastSeq,revive:round(a.revive||0),respawn:round(Math.max(0,(a.respawnAt||0)-g.time)),...Object.fromEntries(Object.entries(a.player).map(([k,v])=>[k,typeof v==='number'?round(v):v])),pose:a.feel.combatPose?{eye:a.feel.combatPose.head.height,right:{x:round(a.feel.combatPose.aim.origin.x-a.player.x),y:round(a.feel.combatPose.aim.origin.y-a.player.y),height:round(a.feel.combatPose.aim.origin.height),dx:round(a.feel.combatPose.aim.direction.x),dy:round(a.feel.combatPose.aim.direction.y),dz:round(a.feel.combatPose.aim.direction.z)}}:null,weapon:a.feel.weapon,cooldown:round(a.feel.cooldown||0),recharge:round(a.feel.recharge||0),oriCooldown:round(a.feel.oriCooldown||0),dodgeCooldown:round(a.feel.dodgeCooldown||0),stats:a.feel.stats,hurt:round(a.feel.hurt||0),hitPulse:round(a.feel.hitPulse||0),assistTime:round(a.feel.assistTime||0),scanTime:round(a.feel.scanTime||0),damageDirection:a.feel.damageDirection??null,vent:round(a.feel.vent||0),shield:round(a.feel.shieldTime||0),shieldCharge:a.feel.shieldCharge||0,shotAnim:round(a.feel.shotAnim||0)}));
  return{type:'snapshot',tick:this.tick,time:round(g.time),revision:this.revision,code:this.code,owner:this.owner,mode:this.mode,arena:this.arena,limit:this.limit,capacity:this.capacity,state:this.state,stage:this.stage,completed:this.receipts.length,raid:this.raid?.snapshot()||null,control:this.control?controlSnapshot(this.control,this.teamScore):null,finaleAvailable:this.finaleEnabled&&this.receipts.length===24&&!this.raid,round:this.round,teamScore:this.teamScore,result:this.result,roster:this.roster(),players,world:packWorld(g,a.id),events};
 }
 checkpoint(includeEntry=true){
  if(this.competitive)return null;const g=this.game,state=this.state==='suspended'?this.resumeState:this.state;g.pitRecord=this.receipts.filter(r=>r.campaign==='pit').map(r=>({...r,stage:r.index+1}));
  const world=g.snapshot();if(g.campaign==='pit'){world.pitCleared=['cleared','campaign-complete'].includes(state);}
  return structuredClone({schema:'btm.coop/1',code:this.code,owner:this.owner,stage:this.stage,state,partySize:this.partySize,finale:this.raid?.snapshot()||null,receipts:structuredClone(this.receipts),world,actors:[...this.actors.values()].map(a=>({id:a.id,nickname:a.nickname,token:a.token,team:a.team,player:a.player,status:a.status,invulnerable:a.invulnerable,bleedAt:a.bleedAt,frags:a.frags,deaths:a.deaths,lastSeq:a.lastSeq,feel:Object.fromEntries(AVATAR_FIELDS.filter(k=>!['nav','combatPose','bufferedFire'].includes(k)).map(k=>[k,a.feel[k]]))})),...(includeEntry?{entry:this.stageStart}:{} )});
 }
 restore(s){
  if(!s||s.schema!=='btm.coop/1'||!Number.isInteger(s.stage)||s.stage<0||s.stage>23||!Array.isArray(s.receipts)||s.receipts.length!==(s.finale?24:s.stage+(['cleared','campaign-complete'].includes(s.state)?1:0))||s.receipts.some((r,i)=>r.stage!==i+1)||!Array.isArray(s.actors)||s.actors.length<2||s.actors.length>4)throw Error('Invalid cooperative checkpoint');
  const descriptor=STAGES[s.stage],states=['playing','cleared','ending'];
  if(s.code!==this.code||!states.includes(s.state)||s.state==='ending'&&!s.finale||!Number.isInteger(s.partySize)||s.partySize<2||s.partySize>4||s.partySize!==s.actors.length||!s.actors.some(a=>a.id===s.owner)||!Number.isFinite(s.world?.time)||s.world.time<0||s.world.time>86400||s.entry?.entry)throw Error('Invalid cooperative session metadata');
  const template=s.finale?createRaidLevel(s.partySize):createLevel(descriptor.index,descriptor.campaign),l=s.world.level;
  if(!l||JSON.stringify(l.cells)!==JSON.stringify(template.cells)||!Array.isArray(l.items)||l.items.length>128||!Array.isArray(l.enemies)||l.enemies.length>128||!Array.isArray(l.relays)||l.relays.length!==template.relays.length||!Array.isArray(l.captives)||l.captives.length!==template.captives.length)throw Error('Invalid cooperative world');
  const bounded=(v,max)=>Number.isFinite(v)&&v>=0&&v<=max;
  for(const e of l.enemies)if(!['plugged','repeater','enforcer','crawler','warden'].includes(e.type)||![e.x,e.y,e.hp,e.maxHp].every(Number.isFinite)||e.x<0||e.x>=29||e.y<0||e.y>=25||e.maxHp<=0||e.maxHp>50000||e.hp>e.maxHp||typeof e.dead!=='boolean')throw Error('Invalid cooperative enemy');
  for(const i of l.items)if(!['health','armor','energy','artifact'].includes(i.type)||![i.x,i.y].every(Number.isFinite)||!canOccupy(l,i.x,i.y)||typeof i.taken!=='boolean'||i.type==='energy'&&(!bounded(i.remaining,45*s.partySize)||!i.claims||Object.entries(i.claims).some(([id,value])=>!s.actors.some(a=>a.id===id)||!bounded(value,45))))throw Error('Invalid cooperative supplies');
  for(const [key,d]of Object.entries(l.doors||{}))if(!template.doors[key]||!bounded(d.open,1)||!bounded(d.target,1)||d.x!==template.doors[key].x||d.y!==template.doors[key].y||d.type!==template.doors[key].type)throw Error('Invalid cooperative door');
  for(const a of s.actors)if(typeof a.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(a.id)||!['alive','downed','dead'].includes(a.status)||!bounded(a.player?.health,100)||!bounded(a.player?.armor,100)||!bounded(a.player?.ori,100)||!bounded(a.player?.vision,100)||a.status==='alive'&&a.player.health<=0||a.status!=='alive'&&a.player.health!==0||!Number.isInteger(a.lastSeq)||!bounded(a.lastSeq,2147483647)||!Number.isInteger(a.feel?.weapon)||!bounded(a.feel.weapon,5))throw Error('Invalid cooperative player state');
  const game=new SharedWorld(this);
  const alive=s.actors.find(a=>a.player?.health>0);if(!alive)throw Error('Checkpoint has no living player');const world=structuredClone(s.world);world.player={...alive.player};
  if(s.finale){
   if(!this.finaleEnabled||s.stage!==23||s.receipts.length!==24)throw Error('Finale checkpoint requires a completed campaign');
   const template=createRaidLevel(s.partySize),l=world.level;
   if(l?.campaign!=='raid'||JSON.stringify(l.cells)!==JSON.stringify(template.cells)||!Array.isArray(l.enemies)||l.enemies.length>64||l.enemies.filter(e=>e.raidRole==='core').length!==1||l.enemies.some(e=>!['plugged','repeater','enforcer','crawler','warden'].includes(e.type)||![e.x,e.y,e.hp,e.maxHp].every(Number.isFinite)||e.maxHp>50000||!canOccupy(template,e.x,e.y)))throw Error('Invalid finale world');
   Object.assign(game,world);game.level=structuredClone(l);game.campaign='original';game.levelIndex=0;game.ori={x:alive.player.x+.4,y:alive.player.y+.2};game.resetFeel();game.projectiles=[];game.events=[];
  }else{if((s.world.campaign==='pit')!==(descriptor.campaign==='pit')||s.world.levelIndex!==descriptor.index)throw Error('Checkpoint stage mismatch');game.restore(world,{campaign:descriptor.campaign});}
  const actors=new Map();for(const a of s.actors){if(!/^[a-f0-9]{48}$/.test(a.token)||!a.player||!['x','y','health','energy','reserve','a'].every(k=>Number.isFinite(a.player[k]))||!canOccupy(game.level,a.player.x,a.player.y)||a.player.energy<0||a.player.energy>100||a.player.reserve<0||a.player.reserve>180||actors.has(a.id))throw Error('Invalid saved avatar');actors.set(a.id,{...structuredClone(a),connected:this.actors.get(a.id)?.connected||false,ready:false,lastEvent:0,lastInput:-99,input:neutralInput(),actions:[],feel:{...a.feel,nav:null,navTime:0,combatPose:null,bufferedFire:null},revive:0,usedAt:-1,chargeTime:0,disconnectedAt:this.elapsed});}
  for(const [id,value]of actors){const existing=this.actors.get(id);if(existing){const seq=existing.lastSeq;Object.assign(existing,value);existing.lastSeq=Math.max(seq,value.lastSeq);actors.set(id,existing);}}
  this.started=true;this.game=game;this._definition=s.finale?RAID_DEFINITION:null;this.raid=s.finale?new Finale(this):null;if(this.raid)this.raid.restore(s.finale);this.stage=s.stage;this.receipts=structuredClone(s.receipts);this.partySize=s.partySize;this.owner=s.owner;this.state=s.state;this.actors=actors;this.stageStart=s.entry||s;this.spawns=this.coopSpawns(game.definition.spawn);game.mode='playing';game.player=this.actors.get(alive.id).player;this.revision++;this.dirty=true;
 }
}
