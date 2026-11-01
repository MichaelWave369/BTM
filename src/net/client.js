import {applyWorld,raidObjectiveTarget} from './codec.js';
import {Game,WEAPONS,moveBody,angleDiff,clamp,distance} from '../core.js';
import{PROTOCOL,INPUT_RATE,neutralInput,validateMessage,endpoint}from'./protocol.js';
const now=()=>performance.now();
export class NetworkClient{
 constructor({onMessage=()=>{},onStatus=()=>{},socket=url=>new WebSocket(url)}={}){Object.assign(this,{onMessage,onStatus,makeSocket:socket});this.ws=null;this.seq=0;this.id=null;this.code=null;this.token=null;this.bytesIn=0;this.bytesOut=0;this.lastSnapshot=0;this.intent=neutralInput();this.actions=new Set();this.connected=false;this.rtt=null;}
 connect(address){this.disconnect();this.address=endpoint(address,globalThis.location?.protocol==='https:');this.onStatus('DIALING '+this.address);return new Promise((resolve,reject)=>{
  const ws=this.makeSocket(this.address);this.ws=ws;let opened=false;const deadline=setTimeout(()=>{ws.close();reject(Error('Connection timed out'));},8000);
  ws.onopen=()=>{if(this.ws!==ws){ws.close();return;}opened=true;clearTimeout(deadline);this.connected=true;this.onStatus('CONNECTED / SELECT CREATE OR JOIN');this.timer=setInterval(()=>this.flush(),1000/INPUT_RATE);this.pingTimer=setInterval(()=>{this.pingAt=now();this.send({type:'ping',id:Math.floor(this.pingAt)%2147483647});},3000);resolve();};
  ws.onmessage=e=>{if(this.ws!==ws)return;if(typeof e.data!=='string'||e.data.length>262144){ws.close(1009,'Invalid server payload');return;}try{const m=JSON.parse(e.data);this.bytesIn+=e.data.length;if(m.type==='hello'&&m.protocol!==PROTOCOL)throw Error('Server protocol mismatch');if(m.type==='left'){this.id=null;this.code=null;this.intent=neutralInput();this.actions.clear();}if(m.type==='welcome'){this.id=m.id;this.code=m.code;this.token=m.token;this.seq=m.seq;this.intent=neutralInput();this.actions.clear();}if(m.type==='snapshot')this.lastSnapshot=now();if(m.type==='pong')this.rtt=Math.round(now()-this.pingAt);this.onMessage(m);}catch(err){this.onStatus('PROTOCOL ERROR / '+err.message);ws.close(1002,'Protocol error');}};
  ws.onerror=()=>{clearTimeout(deadline);this.onStatus('NO CARRIER / CHECK ADDRESS, SERVER AND TLS');if(!opened)reject(Error('Connection failed. Check server address, allowed origin and trusted WSS.'));};
  ws.onclose=()=>{if(this.ws!==ws)return;clearTimeout(deadline);clearInterval(this.timer);clearInterval(this.pingTimer);this.connected=false;this.intent=neutralInput();this.actions.clear();this.onStatus('NO CARRIER / RECONNECT TO KEEP YOUR AVATAR');this.onMessage({type:'disconnected'});if(!opened)reject(Error('Connection closed'));};
 });}
 send(m){if(this.ws?.readyState!==1)return false;const text=JSON.stringify(m);try{validateMessage(text);}catch(e){this.onStatus('CHECK INPUT / '+e.message);this.onMessage({type:'error',message:e.message});return false;}if(this.ws.bufferedAmount>32768){this.ws.close(1013,'Connection stalled');return false;}this.bytesOut+=text.length;this.ws.send(text);return true;}
 action(action){if(this.actions.size<8)this.actions.add(action);}
 flush(){if(!this.id||!this.connected)return;const m={type:'input',seq:++this.seq,...this.intent,actions:[...this.actions]};this.actions.clear();this.send(m);}
 neutral(){this.intent={...neutralInput(),angle:this.intent.angle,weapon:this.intent.weapon};this.actions.clear();this.flush();}
 disconnect(){clearInterval(this.timer);clearInterval(this.pingTimer);if(this.ws){this.ws.onclose=null;this.ws.close();}this.ws=null;this.id=null;this.connected=false;this.actions.clear();}
}
export class NetworkView extends Game{
 constructor(net){super();this.net=net;this.netDefinition=null;this.mode='paused';this.unlocked=6;this.remotePlayers=[];this.selectedWeapon=1;this.inputEnabled=false;this.networkCompetitive=true;this.roomMotion={x:0,y:0};this.useUntil=0;this.previousRemote=[];this.remoteStamp=now();this.lastEvent=0;this.netState=null;this.revision=-1;this.flashUntil=0;}
 get definition(){return this.netDefinition||super.definition;}
 get networkLabel(){return this.netState?.raid?'FINAL / P'+this.netState.raid.phase+' / '+this.netState.raid.state.toUpperCase():this.netState?.mode==='coop'?'CO-OP / '+(this.netState.stage+1)+' OF 24':'BBS / '+this.definition.name;}
 get objective(){return this.netObjective||'ENTER THE NODE';}
 get liberation(){return this.netLiberation||0;}
 get exitReady(){return !!this.netExitReady;}
 get objectiveTarget(){if(this.netState?.raid)return raidObjectiveTarget(this.level,this.player,{...this.netState.raid,time:this.time});if(this.netState?.control?.zone)return this.netState.control.zone;return this.networkCompetitive?(this.remotePlayers.find(a=>a.status==='alive')||this.player):super.objectiveTarget;}
 accept(m){
  if(m.type==='world'){
   if(!m.level||m.level.w!==29||m.level.h!==25||m.level.cells?.length!==25||m.level.cells.some(r=>r.length!==29)||!Array.isArray(m.level.enemies)||m.level.enemies.length>128||!m.definition)throw Error('Invalid world dimensions');
   this.level=structuredClone(m.level);this.netDefinition=m.definition;this.networkCompetitive=m.competitive;this.levelIndex=m.level.index;this.campaign=m.level.campaign==='pit'?'pit':'original';this.revision=m.revision;this.projectiles=[];this.remotePlayers=[];this.netState=null;this.needsRecenter=true;return;
  }
  if(m.type!=='snapshot'||m.revision!==this.revision)return;
  if(!Array.isArray(m.players)||m.players.length>8||!m.world||!Array.isArray(m.events)||m.events.length>96||m.world.enemies?.length>128||m.world.projectiles?.length>128)throw Error('Invalid snapshot');
  const mine=m.players.find(p=>p.id===this.net.id);this.netState=m;this.oriCorrupted=m.raid?.phase===3&&m.raid.state!=='escape';this.time=m.time;this.netObjective=this.networkCompetitive?'FRAG LIMIT '+m.limit+' / '+m.state.toUpperCase():m.world.objective;this.netLiberation=m.world.liberation;this.netExitReady=m.world.exitReady;
  const w=m.world;applyWorld(this.level,w);
  this.ori={...w.ori};this.projectiles=structuredClone(w.projectiles);this.bassCharge=w.bassCharge;this.totalFreed=w.totalFreed;this.totalArtifacts=w.totalArtifacts;
  this.previousRemote=this.remotePlayers;this.remotePlayers=m.players.filter(p=>p.id!==this.net.id).map(p=>({...p}));this.remoteStamp=now();
  if(mine){const old=this.player,first=this.serverDriven||!this.inputEnabled||this.needsRecenter||!this.hasBody||mine.status!=='alive'||distance(old,mine)>1;this.player={...mine,x:first?mine.x:old.x+(mine.x-old.x)*.45,y:first?mine.y:old.y+(mine.y-old.y)*.45,a:first?mine.a:old.a};this.hasBody=true;this.vent=mine.vent;this.shieldTime=mine.shield;this.shieldCharge=mine.shieldCharge;this.shotAnim=mine.shotAnim;this.muzzle=mine.shotAnim;if(this.serverDriven)this.selectedWeapon=mine.weapon;this.weapon=this.selectedWeapon;this.status=mine.status;this.damageDirection=mine.damageDirection;this.stats=mine.stats||this.stats;for(const k of ['cooldown','recharge','oriCooldown','dodgeCooldown','hurt','hitPulse','assistTime','scanTime'])this[k]=mine[k]||0;}
  for(const e of m.events)if(e.id>this.lastEvent){this.lastEvent=e.id;if(e.type==='sound'&&e.name==='fire'&&e.actorId===this.net.id)this.flashUntil=now()+90;if(e.actorId&&e.actorId!==this.net.id&&['playerHurt','hit','dryFire'].includes(e.type))continue;this.events.push(e);}
  if(this.events.length>128)this.events.splice(0,this.events.length-128);
 }
 advanceVisual(dt){
  const t=clamp((now()-this.remoteStamp)/100,0,1);for(const p of this.remotePlayers){const old=this.previousRemote.find(a=>a.id===p.id);if(old&&distance(old,p)<3){p.renderX=old.x+(p.x-old.x)*t;p.renderY=old.y+(p.y-old.y)*t;}else{p.renderX=p.x;p.renderY=p.y;}}
  for(const k of ['hurt','hitPulse','assistTime','scanTime'])this[k]=Math.max(0,this[k]-dt);this.muzzle=Math.max(0,(this.flashUntil-now())/90);this.shotAnim=Math.max(this.muzzle,this.shotAnim-dt*5);
 }
 update(dt,input={}){
  this.advanceVisual(dt);if(!this.inputEnabled||this.mode!=='playing'||this.status!=='alive'){this.net.intent={...neutralInput(),angle:this.player.a,weapon:this.selectedWeapon};return;}
  if(input.turn)this.player.a+=input.turn*dt*1.9;if(input.look)this.player.a+=input.look;this.player.a=angleDiff(this.player.a,0);
  const f=input.moveForward??((input.forward?1:0)-(input.back?1:0)),r=input.moveStrafe??((input.right?1:0)-(input.left?1:0)),norm=Math.max(1,Math.hypot(f,r)),speed=(input.sprint?4.1:2.65)*Math.min(.05,dt),c=Math.cos(this.player.a),s=Math.sin(this.player.a);
  moveBody(this.level,this.player,(c*f-s*r)/norm*speed,(s*f+c*r)/norm*speed);this.moving=!!(f||r);this.sprinting=!!input.sprint;
  let aim=null;const pose=this.combatPose;if(pose?.aim){const d=pose.aim.direction,o=pose.aim.origin;aim={x:clamp(o.x-this.player.x,-.53,.53),y:clamp(o.y-this.player.y,-.53,.53),height:clamp(o.height,.08,1.6),eye:clamp(pose.head.height,.35,1.6),dx:d.x,dy:d.y,dz:d.z};}
  this.net.intent={move:clamp(f,-1,1),strafe:clamp(r,-1,1),angle:this.player.a,sprint:!!input.sprint,fire:!!input.fire,charging:!!this.altHeld||this.charge>0,use:!!this.useHeld||now()<this.useUntil,weapon:this.selectedWeapon,actions:[],aim,dashAngle:this.dashAngle??this.player.a,roomX:clamp(this.roomMotion.x/Math.max(.01,dt),-1,1),roomY:clamp(this.roomMotion.y/Math.max(.01,dt),-1,1)};this.roomMotion.x=this.roomMotion.y=0;
 }
 moveTrackedBody(dx,dy){moveBody(this.level,this.player,dx,dy);this.roomMotion.x+=dx;this.roomMotion.y+=dy;}
 selectWeapon(index){if(Number.isInteger(index)&&index>=0&&index<6){this.selectedWeapon=this.weapon=index;this.equipAnim=.24;return true;}return false;}
 requestFire(alternate=false){if(this.inputEnabled&&this.mode==='playing'&&this.status==='alive')this.net.action(alternate?'alternate':'fire');return true;}
 advanceCombat(dt,fire){if(this.net.intent)this.net.intent.fire=!!fire&&this.inputEnabled&&this.status==='alive';}
 reload(){if(this.inputEnabled)this.net.action('reload');}
 dodge(input={}){if(this.inputEnabled){const base=input.angle??(this.combatPose?Math.atan2(this.combatPose.aim.direction.y,this.combatPose.aim.direction.x):this.player.a);this.dashAngle=angleDiff(base+(input.left?-Math.PI/2:input.right?Math.PI/2:input.back?Math.PI:0),0);this.net.action('dash');}}
 oriAbility(){if(this.networkCompetitive||this.oriCorrupted){this.emit('toast',{text:this.oriCorrupted?'ORI LINK CORRUPTED / REPAIR THE DISHES':'ORI SUPPORT / CO-OP ONLY'});return;}if(this.inputEnabled)this.net.action('ori');}
 bassDrop(){if(this.networkCompetitive){this.emit('toast',{text:'SQUAD BASS DROP / CO-OP ONLY'});return;}if(this.inputEnabled)this.net.action('bass');}
 vision(){this.shift=!this.shift;if(this.inputEnabled)this.net.action('vision');}
 interact(){if(this.inputEnabled)this.useUntil=now()+3000;}
 interactionHint(){
  const down=this.remotePlayers.find(a=>a.status==='downed'&&distance(this.player,a)<1.45);if(down)return '[ E ] REVIVE '+down.nickname;
  if(this.netState?.raid?.phase===2&&distance(this.player,{x:14.5,y:13.5})<1.8)return 'FRACTURE BARRIER / USE END BRIDGES';
  const node=this.level.raidNodes?.find(n=>distance(this.player,n)<1.5);if(node)return '[ E ] CHANNEL '+node.id.toUpperCase();return super.interactionHint();
 }

 saveCheckpoint(){return false;}
 cancelCombat(){this.net.actions.delete('fire');this.net.actions.delete('alternate');this.charge=0;this.altHeld=false;this.net.intent.fire=false;this.net.intent.charging=false;}
 suspend(){this.inputEnabled=false;this.mode='paused';this.useUntil=0;this.useHeld=false;this.roomMotion.x=this.roomMotion.y=0;this.cancelCombat();this.net.neutral();}
 resume(){this.cancelCombat();this.net.neutral();this.inputEnabled=true;this.mode='playing';}
}
