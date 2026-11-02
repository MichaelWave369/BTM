import {tileAt,solidAt,canOccupy,moveBody,castRay,lineOfSight,reachable,findRoute} from './collision.js';
export {tileAt,solidAt,canOccupy,moveBody,castRay,lineOfSight,reachable,findRoute} from './collision.js';
import {validAim,traceEnvironment,traceTrackedShot,rayEntityDistance,entityHeight,WALL_HEIGHT} from './spatial.js';
import {EXPANSION,decorateLevel} from './expansion.js';
import {recordForSign} from './archive-ledger.js';
import {galleryShot,galleryHit,advanceGallery} from './shooting-gallery.js';
import {GAUNTLET} from './gauntlet.js';
import {PIT_STAGES,PIT_HOSTS,PIT_BOSSES} from './pit.js';
import {updatePitBoss,updatePitEnvironment,pitDamageMultiplier,exposePitBoss} from './pit-combat.js';
// Deterministic simulation. No DOM, rendering, network, or audio dependencies.
export const ENERGY_CAPACITY=100,RESERVE_CAPACITY=180;
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angleDiff = (a, b) => Math.atan2(Math.sin(a-b), Math.cos(a-b));
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const WEAPONS = [
  {name:'WAKE-UP SLAP', short:'SLAP', color:'#ffb269', cost:0, damage:42, cooldown:.30, range:1.7, spread:.32},
  {name:'RESONANCE BLASTER', short:'BLASTER', color:'#b9ff53', cost:2, damage:24, cooldown:.18, range:25, spread:.075},
  {name:'BASS CANNON', short:'BASS', color:'#bd8bff', cost:10, damage:56, cooldown:.72, range:9, spread:.29},
  {name:'Φ PULSE RIFLE', short:'Φ PULSE', color:'#ffd870', cost:5, damage:48, cooldown:.36, range:25, spread:.09},
  {name:'ALTERMATH DISRUPTOR', short:'ALTERMATH', color:'#5df6ec', cost:14, damage:63, cooldown:.9, range:11, spread:.22},
  {name:'THE UNPLUGGER', short:'UNPLUGGER', color:'#fff0d2', cost:25, damage:115, cooldown:1.25, range:24, spread:.11}
];
const ENEMY = {
  plugged:{hp:70,speed:.64,damage:10,range:1.0,delay:1.2,human:true},
  repeater:{hp:58,speed:1.0,damage:8,range:7,delay:1.55,human:true},
  enforcer:{hp:120,speed:.74,damage:14,range:8,delay:1.8,human:false},
  crawler:{hp:50,speed:1.4,damage:8,range:.95,delay:1.1,human:false},
  warden:{hp:680,speed:.52,damage:20,range:11,delay:2.0,human:false}
};
export const SECTORS = [
  {name:'THE WAKE-UP CALL',tag:'NEURAL PROCESSING FACILITY',color:'#b9ff53',subtitle:'Good morning. Your reality subscription has expired.',wall:1,spawn:{x:4.5,y:20.5,a:-Math.PI/2},
    rooms:[[1,17,7,23],[1,3,9,12],[9,13,17,22],[12,2,20,10],[21,12,27,22],[23,3,27,8]],
    halls:[[4,11,4,18],[6,20,11,20],[13,8,13,15],[16,17,23,17],[24,7,24,13]],
    doors:[[4,14,4],[8,20,4],[13,11,4],[19,17,5],[24,10,6]],
    relays:[[4.5,5.5],[17.5,4.5]],key:[18.5,8.5],exit:[25.5,20.5],
    enemies:[['plugged',4.5,10.5],['plugged',7.5,8.5],['repeater',7.5,5.5],['plugged',12.5,18.5],['repeater',15.5,16.5],['plugged',15.5,8.5],['repeater',18.5,5.5],['enforcer',24.5,16.5]],
    items:[['health',3.5,18.5],['energy',6.5,10.5],['armor',11.5,20.5],['energy',14.5,14.5],['health',15.5,4.5],['energy',22.5,19.5],['artifact',25.5,5.5],['health',26.5,6.5]],
    captives:[[2.5,6.5],[19.5,3.5]],secret:[24,10]},
  {name:'CATHEDRAL OF STATIC',tag:'BROADCAST & BELIEF ENGINE',color:'#c898ff',subtitle:'Please remain seated while we uninstall your dogma.',wall:2,spawn:{x:4.5,y:21.5,a:-Math.PI/2},
    rooms:[[1,17,8,23],[2,8,10,15],[12,7,21,18],[3,2,10,6],[23,3,27,11],[23,16,27,22]],
    halls:[[5,14,5,19],[8,11,14,11],[6,5,6,9],[20,8,24,8],[25,10,25,18],[8,4,14,4],[14,4,14,8]],
    doors:[[5,16,4],[11,11,4],[6,7,4],[22,8,5],[25,14,4],[11,4,6]],
    relays:[[5.5,3.5],[18.5,10.5]],key:[19.5,15.5],exit:[25.5,20.5],
    enemies:[['repeater',5.5,12.5],['plugged',8.5,9.5],['enforcer',7.5,3.5],['crawler',14.5,12.5],['repeater',18.5,8.5],['enforcer',19.5,16.5],['plugged',24.5,5.5],['crawler',26.5,9.5],['enforcer',25.5,17.5]],
    items:[['health',3.5,20.5],['energy',7.5,13.5],['armor',9.5,4.5],['artifact',13.5,4.5],['energy',13.5,15.5],['health',20.5,17.5],['energy',24.5,10.5],['health',26.5,18.5]],
    captives:[[3.5,10.5],[25.5,4.5]],secret:[11,4]},
  {name:'THE DEMIURGE CORE',tag:'CENTRAL REALITY MAINFRAME',color:'#5df6ec',subtitle:'The architect would like a word. Bring the bass.',wall:3,spawn:{x:4.5,y:21.5,a:-Math.PI/2},
    rooms:[[1,17,8,23],[1,7,9,14],[11,2,19,10],[11,14,19,22],[22,2,27,9],[22,12,27,22],[2,2,7,5]],
    halls:[[5,13,5,18],[8,10,13,10],[13,8,13,16],[18,18,24,18],[24,8,24,14],[18,5,24,5],[4,4,4,8]],
    doors:[[5,16,4],[10,10,4],[13,12,4],[20,18,5],[24,10,5],[20,5,4],[4,6,6]],
    relays:[[4.5,9.5],[15.5,4.5]],key:[17.5,7.5],exit:[25.5,3.5],
    enemies:[['enforcer',5.5,12.5],['crawler',7.5,8.5],['repeater',12.5,8.5],['enforcer',17.5,5.5],['crawler',15.5,16.5],['enforcer',17.5,20.5],['enforcer',24.5,14.5],['warden',25,18],['repeater',25.5,7.5]],
    items:[['health',2.5,20.5],['energy',7.5,12.5],['artifact',4.5,3.5],['armor',13.5,3.5],['energy',18.5,8.5],['health',12.5,20.5],['energy',18.5,19.5],['health',26.5,20.5],['energy',23.5,17.5],['energy',26.5,13.5]],
    captives:[[2.5,8.5],[16.5,15.5]],secret:[4,6]},
  ...EXPANSION,...GAUNTLET
];
export const CAMPAIGN_HOSTS = SECTORS.reduce((n,l)=>n+l.captives.length+l.enemies.filter(e=>ENEMY[e[0]].human).length,0);
export function createLevel(index,campaign='original'){
  const def=(campaign==='pit'?PIT_STAGES:SECTORS)[index],w=29,h=25;if(!def)throw Error('Unknown campaign stage');
  const cells=Array.from({length:h},()=>Array(w).fill(def.wall));
  const carve=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=0;};
  def.rooms.forEach(r=>carve(...r));def.halls.forEach(r=>carve(...r));
  const doors={}; def.doors.forEach(([x,y,t])=>{cells[y][x]=t;doors[`${x},${y}`]={x,y,type:t,open:0,target:0};});
  // Pillars break sightlines without disconnecting the rooms.
  const pillars=def.pillars||(index===0?[[3,8],[7,10],[14,17],[16,6],[23,14]]:index===1?[[5,10],[8,13],[15,9],[18,13],[15,16],[25,7]]:[[3,11],[7,10],[15,6],[16,18],[24,15]]);
  pillars.forEach(([x,y])=>cells[y][x]=def.wall);
  const enemies=def.enemies.map(([type,x,y,pitBoss],id)=>({id,type,pitBoss,x,y,homeX:x,homeY:y,...ENEMY[type],hp:Math.round((pitBoss?PIT_BOSSES[pitBoss].hp:ENEMY[type].hp*(def.difficulty||1))),speed:ENEMY[type].speed*(def.speedScale||1),damage:ENEMY[type].damage*(1+(campaign==='pit'?0:Math.max(0,index-2)*.055))*(def.damageScale||1),maxHp:Math.round((pitBoss?PIT_BOSSES[pitBoss].hp:ENEMY[type].hp*(def.difficulty||1))),state:'patrol',cooldown:pitBoss?.4:1+id*.13,tell:0,stun:0,flash:0,dead:false,phase:1,walk:0,pathTimer:0}));
  const level={index,w,h,...(campaign==='pit'?{campaign:'pit',palette:def.palette,hazards:structuredClone(def.hazards),blasts:[]}:{}),cells,doors,enemies,items:def.items.map(([type,x,y],id)=>({id,type,x,y,taken:false})),captives:def.captives.map(([x,y],id)=>({id,x,y,freed:false})),relays:def.relays.map(([x,y],id)=>({id,x,y,active:false})),key:{x:def.key[0],y:def.key[1],taken:false},exit:{x:def.exit[0],y:def.exit[1]},seen:Array(w*h).fill(false),secretFound:false};
  decorateLevel(level,def,index);return level;
}
export class Game {
  constructor(){this.gallery=null;this.campaign='original';this.energyMode='survival';this.mode='title';this.events=[];this.time=0;this.levelIndex=0;this.totalFreed=0;this.totalArtifacts=0;this.totalSecrets=0;this.campaignTime=0;this.unlocked=3;this.weapon=1;this.effects=[];this.projectiles=[];this.rng=369;this.loadLevel(0,false);this.mode='title';}
  random(){this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296;}
  emit(type,data={}){this.events.push({type,...data});}
  say(text,speaker='ORI',priority=1){
    const line={text,speaker,priority};
    if(this.speechCooldown>0&&priority<2){if(this.speechQueue.length<6)this.speechQueue.push(line);return;}
    this.emit('dialogue',line);this.speechCooldown=Math.min(4.8,1.8+text.length*.027);
    if(priority>=3)this.speechQueue=this.speechQueue.filter(s=>s.priority>=2);
  }
  banter(id,lines,priority=1){if(this.chatterUsed[id])return;this.chatterUsed[id]=true;for(const [speaker,text] of lines)this.say(text,speaker,priority);}
  resetFeel(saved={}){
    this.combatPose=null;this.playerMotion={x:0,y:0};this.speechQueue=[];this.speechCooldown=0;this.chatterUsed=saved.chatterUsed||{};this.footDistance=0;this.dangerCooldown=0;this.hitPulse=0;this.muzzle=0;this.equipAnim=0;this.bufferedFire=null;this.portraitMood='FOCUSED';this.portraitTime=0;this.assistTime=0;this.scanTime=0;this.charge=0;this.damageDirection=null;this.region='';this.lesson=0;this.lessonDistance=0;
    this.stats=saved.stats||{distance:0,damageTaken:0,damageDealt:0,shots:0,doors:0,pickups:0,oriAssists:0};
  }
  get definition(){return (this.campaign==='pit'?PIT_STAGES:SECTORS)[this.levelIndex];}
  get stageCount(){return this.campaign==='pit'?PIT_STAGES.length:12;}
  get survival(){return this.energyMode==='survival';}
  get tactics(){return this.definition.tactics||0;}
  start({energyMode='survival',campaign='original'}={}){this.gallery=null;this.campaign=campaign==='pit'?'pit':'original';this.pitRecord=[];this.pitDeaths=0;this.energyMode=this.campaign==='pit'?'survival':energyMode==='legacy'?'legacy':'survival';this.totalFreed=0;this.totalArtifacts=0;this.totalSecrets=0;this.campaignTime=0;this.unlocked=3;this.weapon=1;this.rng=369;this.loadLevel(0,false);this.mode='playing';if(this.campaign==='original')this.banter('hello',[['ORI','Rise and shine, Michael. The Matrix has terrible customer service.'],['WAVE','Good. I brought a cancellation policy. And a bass cannon.']]);}
  startPit(){this.start({campaign:'pit'});this.say('The Twelve Trials. Finite cells. Read the floor, punish recovery, and keep Ori close.','ORI',2);}
  loadLevel(index,carry=true){
    const health=carry?Math.max(this.campaign==='pit'?40:65,this.player?.health??100):100,armor=carry?Math.max(this.campaign==='pit'?0:20,this.player?.armor??0):25;this.nav=null;this.navTime=0;
    const energy=this.survival?(carry?this.player?.energy??100:100):100,reserve=this.survival?(carry?this.player?.reserve??45:45):0;
    this.levelIndex=index;this.level=createLevel(index,this.campaign);this.pitAmbient=2;if(this.survival)for(const e of this.level.enemies){e.speed*=1.08;e.damage*=1.1;}this.player={...this.definition.spawn,health,armor,energy,reserve,ori:100,vision:100,key:false};
    this.ori={x:this.player.x+.35,y:this.player.y+.3,a:0};this.effects=[];this.projectiles=[];this.time=0;this.levelFreed=0;this.shots=0;this.hits=0;this.cooldown=0;this.recharge=0;this.vent=0;this.shotAnim=0;this.hurt=0;this.shake=0;this.shift=false;this.bassCharge=0;this.dodgeCooldown=0;this.dodgeFlash=0;this.shieldTime=0;this.shieldCharge=0;this.oriCooldown=0;this.oriAuto=3;this.warning=4;this.objectiveTime=0;this.levelKills=0;this.unlocked=this.campaign==='pit'?6:Math.max(this.unlocked,index===0?3:index===1?4:6);this.mode='playing';this.resetFeel();this.checkpoint=this.snapshot();this.emit('checkpoint');this.emit('sector',{index,name:this.definition.name,campaign:this.campaign});
  }
  get liberation(){return Math.round(this.totalFreed/(this.campaign==='pit'?PIT_HOSTS:CAMPAIGN_HOSTS)*100);}
  get objective(){if(this.gallery)return 'CALIBRATION VAULT / '+Math.max(0,Math.ceil(60-this.time))+'s · '+this.gallery.hits+' HITS / '+this.gallery.shots+' SHOTS';const n=this.level.relays.filter(r=>r.active).length;if(n<2)return `BREAK CONTROL RELAYS ${n}/2`;if(!this.player.key)return 'FIND THE GOLDEN ACCESS KEY';if(this.level.enemies.some(e=>e.type==='warden'&&!e.dead))return 'DEFEAT '+(PIT_BOSSES[this.definition.boss]?.name||'THE WARDEN');return 'REACH THE EXTRACTION PORTAL';}
  get objectiveTarget(){if(this.gallery)return this.level.enemies.find(e=>!e.dead)||{x:14.5,y:10.5,label:'PRACTICE TARGETS'};return this.level.relays.find(r=>!r.active)||(!this.player.key?{...this.level.key,label:'GOLD ACCESS KEY'}:null)||this.level.enemies.find(e=>e.type==='warden'&&!e.dead)||{...this.level.exit,label:'EXTRACTION'};}
  get exitReady(){if(this.gallery)return false;return this.level.relays.every(r=>r.active)&&this.player.key&&!this.level.enemies.some(e=>e.type==='warden'&&!e.dead);}
  selectWeapon(index){if(this.gallery&&index!==1){this.emit('toast',{text:'CALIBRATION / BLASTER ONLY'});return false;}if(index<0||index>=this.unlocked){this.emit('toast',{text:'WEAPON LOCKED · advance to the next sector'});return false;}if(this.weapon!==index){this.weapon=index;this.equipAnim=.24;this.emit('sound',{name:'equip'});this.emit('weapon');}return true;}
  setCombatPose(pose){if(!validAim(pose?.aim)||!pose?.head||!['x','y','height'].every(k=>Number.isFinite(pose.head[k]))){this.combatPose=null;return false;}this.combatPose=pose;return true;}
  clearCombatPose(){this.combatPose=null;}
  advanceCombat(dt,fire=false){if(this.mode!=='playing')return;if(this.bufferedFire){this.bufferedFire.left-=dt;if(this.bufferedFire.left<=0)this.bufferedFire=null;else if(this.cooldown<=0){const shot=this.bufferedFire;this.bufferedFire=null;this.shoot(shot.alternate,shot.charge);}}if(fire)this.shoot();}
  requestFire(alternate=false,charge=0){if(this.mode!=='playing')return false;if(this.shoot(alternate,charge))return true;if(this.cooldown<=.14&&this.vent<=0)this.bufferedFire={alternate,charge,left:.15};return false;}
  vision(){if(!this.shift&&this.player.vision<8){this.emit('toast',{text:'RESONANCE RECHARGING'});return;}this.shift=!this.shift;this.emit('sound',{name:'vision'});}
  reload(){
    if(this.mode!=='playing'||this.recharge>0||this.vent>0||this.player.energy>=(this.survival?ENERGY_CAPACITY:99))return false;
    if(this.survival&&this.player.reserve<=0){this.emit('toast',{text:'NO RESERVE · FIND ENERGY CELLS · 1 FOR SLAP'});return false;}
    this.vent=.8;this.recharge=this.survival?.9:5;if(this.survival)this.bufferedFire=null;
    this.emit('sound',{name:'reload'});this.emit('toast',{text:this.survival?'RELOADING · DRAWING FROM RESERVE':'VENTING · LEGACY RECHARGE'});return true;
  }
  dodge(input={}){
    if(this.mode!=='playing'||this.dodgeCooldown>0)return false;
    if(!this.survival){this.dodgeCooldown=1.7;this.dodgeFlash=.24;const base=Number.isFinite(input.angle)?input.angle:this.combatPose?Math.atan2(this.combatPose.aim.direction.y,this.combatPose.aim.direction.x):this.player.a,a=base+(input.left?-Math.PI/2:input.right?Math.PI/2:input.back?Math.PI:0);moveBody(this.level,this.player,Math.cos(a),Math.sin(a));this.emit('sound',{name:'dodge'});return true;}
    this.dodgeCooldown=1.7;this.dodgeFlash=.24;
    const base=Number.isFinite(input.angle)?input.angle:this.combatPose?Math.atan2(this.combatPose.aim.direction.y,this.combatPose.aim.direction.x):this.player.a;
    const a=base+(input.left?-Math.PI/2:input.right?Math.PI/2:input.back?Math.PI:0),dx=Math.cos(a),dy=Math.sin(a),p=this.player,l=this.level,start={x:p.x,y:p.y};
    // A narrow frontal sweep, bounded by the actual collision-safe travel.
    const frontal=l.enemies.filter(e=>!e.dead&&Math.abs(angleDiff(Math.atan2(e.y-p.y,e.x-p.x),base))<.55&&lineOfSight(l,p,e)).map(e=>({e,forward:(e.x-p.x)*dx+(e.y-p.y)*dy,side:Math.abs((e.x-p.x)*dy-(e.y-p.y)*dx)})).filter(t=>t.forward>=0&&t.forward<=1.5&&t.side<.42).sort((a,b)=>a.forward-b.forward)[0];
    const travel=frontal?Math.min(1,Math.max(0,frontal.forward-.46)):1;
    moveBody(l,p,dx*travel,dy*travel);
    if(frontal&&distance(p,frontal.e)<.76&&lineOfSight(l,start,frontal.e)){
      const e=frontal.e,boss=e.type==='warden',armored=e.type==='enforcer';
      this.damageEnemy(e,boss?8:armored?14:28,boss?.18:armored?.45:.9,'bash');
      moveBody(l,e,dx*(boss?.08:armored?.25:.5),dy*(boss?.08:armored?.25:.5),.23);
      this.emit('bash',{x:e.x,y:e.y});this.emit('burst',{x:e.x,y:e.y,color:'#ffcd75',count:18});this.emit('toast',{text:boss?'BASH · BOSS RESISTS':'DASH BASH'});
    }else{this.shieldTime=.30;this.shieldCharge=18;this.emit('shield',{charge:18});}
    this.emit('sound',{name:'dodge'});return true;
  }
  interact(){
    if(this.mode!=='playing')return;
    const p=this.player,l=this.level;
    const aim=this.combatPose?.aim,close=(o,r=1.55)=>distance(p,o)<r&&lineOfSight(l,p,o)&&(!aim||rayEntityDistance(aim.origin,aim.direction,o,.1,2.2)!==null);
    const captive=l.captives.find(c=>!c.freed&&close(c));
    if(captive){captive.freed=true;this.freeHost(captive);this.banter('captive',[['ORI','One more mind, back in its own hands. That is the whole point.'],['WAVE','You pick your own frequency from here, bro.']]);return;}
    const relay=l.relays.find(r=>!r.active&&close(r));
    if(relay){relay.active=true;p.health=Math.min(100,p.health+15);if(!this.survival)p.energy=100;this.emit('sound',{name:'relay'});this.emit('burst',{x:relay.x,y:relay.y,color:'#b9ff53',count:28});this.say(l.relays.every(r=>r.active)?'Control signal is down. Grab the key and find our exit.':'One relay down. Bureaucracy is taking physical damage.');this.saveCheckpoint();return;}
    // Interact with the first solid cell in the direction of the crosshair.
    const hit=aim?traceEnvironment(l,aim.origin,aim.direction,1.8):null,ray=aim?(hit.cell?{...hit.cell,distance:hit.distance}:{x:-1,y:-1,distance:Infinity}):castRay(l,p.x,p.y,Math.cos(p.a),Math.sin(p.a),1.8),d=l.doors[`${ray.x},${ray.y}`];
    if(d&&ray.distance<1.8){
      if(d.type===5&&!p.key){this.emit('toast',{text:'GOLD KEY REQUIRED'});this.say('A keycard. Apparently enlightenment still needs credentials.');return;}
      if(d.type===6&&!l.secretFound){l.secretFound=true;this.totalSecrets++;this.emit('secret');this.banter('secret',[['ORI','Unregistered storage. The simulation forgot to encrypt the cupboard.'],['WAVE','Code Brown, bro. Emergency bass supplies.']]);}
      if(!d.target){this.stats.doors++;this.lesson=Math.max(this.lesson,2);this.emit('doorOpened',{x:d.x,y:d.y});}d.target=1;this.nav=null;this.emit('sound',{name:'door',position:{x:d.x+.5,y:d.y+.5,height:.8}});return;
    }
    const sign=l.signs?.find(s=>s.x===ray.x&&s.y===ray.y);if(sign&&ray.distance<1.8){const record=recordForSign(this.campaign,this.levelIndex,sign.id);sign.read=true;this.say(record?.excerpt||sign.text,'ARCHIVE',2);this.emit('story',{id:sign.id,archiveId:record?.id||null,sector:this.levelIndex,campaign:this.campaign});return;}
    if(distance(p,l.exit)<1.8){if(this.exitReady)this.complete();else this.emit('toast',{text:this.objective});return;}
    this.emit('toast',{text:'AIM AT A DOOR, RELAY, OR CAPTIVE · THEN E'});
  }
  saveCheckpoint(){if(this.player.health<=0)return false;this.checkpoint=this.snapshot();this.emit('checkpoint');return true;}
  oriAbility(){
    if(this.gallery)return false;
    if(this.mode!=='playing'||this.player.ori<30||this.oriCooldown>0){this.emit('toast',{text:'ORI IS RECHARGING'});return false;}
    this.player.ori-=30;this.oriCooldown=3;
    const target=this.level.enemies.filter(e=>!e.dead&&distance(this.player,e)<7&&lineOfSight(this.level,this.player,e)).sort((a,b)=>Math.abs(angleDiff(Math.atan2(a.y-this.player.y,a.x-this.player.x),(this.combatPose?Math.atan2(this.combatPose.aim.direction.y,this.combatPose.aim.direction.x):this.player.a)))-Math.abs(angleDiff(Math.atan2(b.y-this.player.y,b.x-this.player.x),(this.combatPose?Math.atan2(this.combatPose.aim.direction.y,this.combatPose.aim.direction.x):this.player.a))))[0];
    this.emit('sound',{name:'ori'});this.assistTime=.85;this.stats.oriAssists++;
    if(target){exposePitBoss(target,'ori');target.stun=target.pitBoss?.45:3;target.flash=.25;this.ori.target={x:target.x,y:target.y};this.emit('oriAssist',{x:target.x,y:target.y});this.emit('beam',{from:{...this.ori},to:{x:target.x,y:target.y},color:'#5df6ec',ori:true});this.say(target.pitBoss?PIT_BOSSES[target.pitBoss].name+' grounded. Core open!':target.type==='warden'?'Warden staggered. Now, Michael!':'Their control signal is muted. Your turn, Michael.','ORI',2);}
    else{this.objectiveTime=10;this.scanTime=1.4;this.emit('scan',{x:this.player.x,y:this.player.y});const secret=Object.values(this.level.doors).find(d=>d.type===6&&d.open<.5&&distance(this.player,d)<7);if(secret){this.shift=true;this.player.vision=Math.max(50,this.player.vision);this.say('An encrypted wall nearby. Follow the violet signal.');}else this.say('Route marked. Cyan dots on the map, Michael. Try not to lick the terminals.');}
    return true;
  }
  freeHost(entity){this.totalFreed++;this.levelFreed++;this.lesson=3;this.bassCharge=clamp(this.bassCharge+20,0,100);this.portraitMood='GRIN';this.portraitTime=1.1;this.emit('liberation',{x:entity.x,y:entity.y});this.emit('sound',{name:'free'});}
  damageEnemy(e,damage,stun=0,source='weapon'){
    if(this.gallery&&e.galleryTarget){galleryHit(this,e,source);return;}
    if(e.dead)return;let actual=damage*(1+Math.floor(this.totalArtifacts/2)*.15)*pitDamageMultiplier(this,e,source);if(e.pitBoss){const floor=e.phase===1?e.maxHp*.66:e.phase===2?e.maxHp*.33:0;actual=Math.min(actual,Math.max(0,e.hp-floor));}e.hp-=actual;e.flash=.15;e.pain=.18;e.stun=Math.max(e.stun,stun*(source==='weapon'?1-this.tactics*.65:1),source==='weapon'&&e.type!=='warden'?.08:0);if(e.pitBoss)e.stun=Math.min(e.stun,.55);e.state='pursue';e.recoil=source==='ori'?0:.16;
    this.stats.damageDealt+=Math.min(actual,Math.max(0,e.hp+actual));if(source==='weapon')this.hitPulse=.16;
    this.emit('hit',{x:e.x,y:e.y,color:source==='ori'?'#5df6ec':WEAPONS[this.weapon].color,source,damage:Math.round(actual),finisher:e.hp<=0});
    if(e.hp<=0){e.dead=true;e.state='freed';this.levelKills++;this.bassCharge=clamp(this.bassCharge+12,0,100);if(e.human)this.freeHost(e);else{this.emit('burst',{x:e.x,y:e.y,color:e.type==='warden'?'#ffd870':'#5df6ec',count:20});this.emit('sound',{name:'destroy'});}
      this.emit('enemyDefeated',{enemy:e.type,human:e.human,x:e.x,y:e.y});
      if(e.pitBoss)this.emit('pitBossDefeated',{boss:e.pitBoss,stage:this.levelIndex+1});
      if(e.type==='warden'){this.banter('boss-down',[['ORI',e.pitBoss?PIT_BOSSES[e.pitBoss].name+' defeated. The next descent belongs to you.':'Warden unplugged. The exit belongs to you now.'],['WAVE','Ledger above ego. Bass above everything else.'] ],2);this.portraitMood='BROOO';this.portraitTime=2;this.saveCheckpoint();}
      if(this.levelKills===1)this.banter('first-host',[['ORI','Host liberated. We break the program, Michael. We save the person.'],['WAVE','Wake up, bro. You have got a whole life to get back to.']]);
    }
  }
  shoot(alternate=false,charge=0){
    if(this.mode!=='playing'||this.cooldown>0||this.vent>0)return false;
    const w=WEAPONS[this.weapon],mult=alternate?1.65:1,cost=Math.ceil(w.cost*mult);
    if(this.player.energy<cost){if(this.weapon!==0)this.emit('dryFire');if(this.weapon!==0)this.emit('toast',{text:this.survival?'DRY · R / X RELOAD · 1 FOR SLAP':'LOW ENERGY · R TO VENT · 1 FOR SLAP'});this.cooldown=.25;return false;}
    this.player.energy-=cost;this.cooldown=w.cooldown*(alternate?1.5:1);this.shotAnim=1;this.muzzle=1;this.shake=[.08,.12,.42,.17,.24,.38][this.weapon]*(alternate?1.25:1);this.shots++;this.stats.shots++;galleryShot(this);this.emit('shot',{weapon:this.weapon,alternate,charge,...(this.combatPose?{aim:{origin:{...this.combatPose.aim.origin},direction:{...this.combatPose.aim.direction}}}:{})});this.emit('sound',{name:'fire',weapon:this.weapon,alternate});
    const p=this.player,damage=w.damage*mult*(1+charge*.5);
    if(this.combatPose)return this.shootTracked(w,damage,alternate);
    if(this.weapon===3){this.projectiles.push({x:p.x,y:p.y,a:p.a,speed:9,life:3,damage,enemy:false,color:w.color,r:.12});return true;}
    const targets=this.level.enemies.filter(e=>!e.dead&&distance(p,e)<=w.range&&Math.abs(angleDiff(Math.atan2(e.y-p.y,e.x-p.x),p.a))<w.spread+.18/Math.max(1,distance(p,e))&&lineOfSight(this.level,p,e)).sort((a,b)=>distance(p,a)-distance(p,b));
    const many=[2,4,5].includes(this.weapon)||alternate&&this.weapon===0;
    const hit=many?targets:targets.slice(0,1);if(hit.length)this.hits++;
    for(const e of hit){this.damageEnemy(e,damage,this.weapon===2?1.1:this.weapon===4?2.2:0);if(this.weapon===2){const d=Math.max(.01,distance(p,e));moveBody(this.level,e,(e.x-p.x)/d*.65,(e.y-p.y)/d*.65,.2);}}
    const ray=castRay(this.level,p.x,p.y,Math.cos(p.a),Math.sin(p.a),w.range),end=hit[0]||{x:p.x+Math.cos(p.a)*Math.max(0,ray.distance-.04),y:p.y+Math.sin(p.a)*Math.max(0,ray.distance-.04)};
    if(!hit.length&&this.weapon>0){this.emit('impact',{x:end.x,y:end.y,color:w.color});this.emit('sound',{name:'ricochet'});}
    if(this.weapon===5||this.weapon===1)this.emit('beam',{from:{x:p.x,y:p.y},to:{x:end.x,y:end.y},color:w.color});
    return true;
  }
  shootTracked(w,damage,alternate){
    const aim=this.combatPose.aim,o=aim.origin,d=aim.direction;
    if(this.weapon===3){this.projectiles.push({x:o.x,y:o.y,height:o.height,a:Math.atan2(d.y,d.x),speed:9*Math.hypot(d.x,d.y),vh:9*d.z,life:3,damage,enemy:false,color:w.color,r:.12});return true;}
    const trace=traceTrackedShot(this.level,aim,w),many=[2,4,5].includes(this.weapon)||alternate&&this.weapon===0,targets=many?trace.targets:trace.targets.slice(0,1);if(targets.length)this.hits++;
    for(const {entity:e}of targets){this.damageEnemy(e,damage,this.weapon===2?1.1:this.weapon===4?2.2:0);if(this.weapon===2){const distance=Math.max(.01,Math.hypot(e.x-o.x,e.y-o.y));moveBody(this.level,e,(e.x-o.x)/distance*.65,(e.y-o.y)/distance*.65,.2);}}
    const first=targets[0],end=first?{x:first.entity.x,y:first.entity.y,height:first.height}:trace.impact;
    if(end){this.emit('beam',{from:{...o},to:{x:end.x,y:end.y,height:end.height},color:w.color,tracked:true});if(!targets.length&&this.weapon>0){this.emit('impact',{x:end.x,y:end.y,height:end.height,color:w.color});this.emit('sound',{name:'ricochet',position:{...end}});}}
    return true;
  }
  bassDrop(){if(this.gallery)return false;if(this.bassCharge<100){this.emit('toast',{text:'BASS DROP CHARGES BY LIBERATING HOSTS'});return false;}this.bassCharge=0;this.shake=.6;this.emit('bass');for(const e of this.level.enemies)if(!e.dead&&distance(e,this.player)<6&&lineOfSight(this.level,e,this.player))this.damageEnemy(e,70,3);this.portraitMood='BROOO';this.portraitTime=1.5;this.say('BROOOOO! Time to change the frequency!','WAVE',2);return true;}
  damagePlayer(amount,source=null){
    if(this.mode!=='playing'||!this.survival&&this.dodgeFlash>0)return;
    if(this.shieldTime>0&&this.shieldCharge>0){const shield=Math.min(amount,this.shieldCharge);this.shieldCharge-=shield;amount-=shield;this.emit('shieldHit',{absorbed:shield});if(amount<=0)return;}
    const absorbed=Math.min(this.player.armor,amount*.6);this.player.armor-=absorbed;this.player.health=Math.max(0,this.player.health-(amount-absorbed));this.stats.damageTaken+=amount-absorbed;this.hurt=.65;this.shake=.22;this.portraitMood='OUCH';this.portraitTime=.7;this.damageDirection=source?Math.atan2(source.y-this.player.y,source.x-this.player.x):null;this.emit('sound',{name:'hurt'});this.emit('playerHurt',{angle:this.damageDirection});
    if(this.player.health<=0){this.mode='dead';this.emit('dead');}
  }
  complete(){if(this.mode!=='playing'||!this.exitReady)return false;this.campaignTime+=this.time;this.mode=this.campaign==='pit'?(this.levelIndex===11?'ending':'complete'):this.levelIndex%3===2?'ending':'complete';if(this.campaign==='pit'){this.pitRecord.push({stage:this.levelIndex+1,name:this.definition.name,seconds:this.time,boss:this.definition.boss||null,charge:this.player.energy,reserve:this.player.reserve});this.saveCheckpoint();}this.portraitMood='GRIN';this.portraitTime=3;this.emit('complete');return true;}
  next(){if(this.mode!=='complete')return;this.loadLevel(this.levelIndex+1);this.say(this.definition.subtitle);}
  continueCampaign(){if(this.campaign==='pit'||this.mode!=='ending'||this.levelIndex!==2)return false;this.loadLevel(3);this.banter('aftershock',[['ORI','The core is down. But three more control signals just woke up.'],['WAVE','An encore? Bro, you should not have.']]);return true;}
  continueBeyond(){if(this.campaign==='pit'||this.mode!=='ending'||![5,8].includes(this.levelIndex))return false;this.loadLevel(this.levelIndex+1);this.banter('nightmare-entry',[['ORI',SECTORS[this.levelIndex].subtitle],['WAVE','Bro. They patched the easy mode.']]);return true;}
  startNightmare(options={}){this.start(options);this.loadLevel(6,false);this.say('Nightmare entry. All six weapons unlocked. No artifact upgrades earned yet.','ORI',2);}
  retry(){const deaths=(this.pitDeaths||0)+1,snap=this.checkpoint;if(snap){this.restore(snap);this.pitDeaths=deaths;this.mode='playing';this.player.health=Math.max(65,this.player.health);if(!this.survival)this.player.energy=100;this.hurt=0;this.projectiles=[];this.emit('checkpoint');}else this.loadLevel(this.levelIndex);}
  snapshot(){return {...(this.campaign==='pit'?{version:2,schema:'btm.pit/1',campaign:'pit',pitRecord:structuredClone(this.pitRecord||[]),pitDeaths:this.pitDeaths||0,pitCleared:['complete','ending'].includes(this.mode)}:{version:1}),energyMode:this.energyMode,release:'0.10.0-rc.1',levelIndex:this.levelIndex,level:structuredClone(this.level),player:{...this.player},time:this.time,totalFreed:this.totalFreed,totalArtifacts:this.totalArtifacts,totalSecrets:this.totalSecrets,campaignTime:this.campaignTime,unlocked:this.unlocked,weapon:this.weapon,levelFreed:this.levelFreed,levelKills:this.levelKills,shots:this.shots,hits:this.hits,bassCharge:this.bassCharge,rng:this.rng,v2:{chatterUsed:structuredClone(this.chatterUsed),stats:{...this.stats}}};}
  restore(s,{campaign:expected}={}){
    const campaign=s?.version===2&&s?.campaign==='pit'&&s?.schema==='btm.pit/1'?'pit':'original',defs=campaign==='pit'?PIT_STAGES:SECTORS;
    if(expected&&campaign!==expected)throw Error('Checkpoint belongs to a different campaign');
    if(!s||!(campaign==='pit'?s.version===2&&s.level?.campaign==='pit'&&s.energyMode==='survival'&&Array.isArray(s.pitRecord):s.version===1&&!s.campaign&&!s.level?.campaign)||!Number.isInteger(s.levelIndex)||!defs[s.levelIndex]||!s.player||!s.level||s.level.index!==s.levelIndex||!Array.isArray(s.level.cells)||s.level.cells.length!==25||s.level.cells.some(row=>!Array.isArray(row)||row.length!==29)||!Array.isArray(s.level.enemies)||!s.level.doors||!Array.isArray(s.level.relays)||!Array.isArray(s.level.items)||!Array.isArray(s.level.captives)||!Array.isArray(s.level.seen)||!s.level.key||!s.level.exit||![s.player.x,s.player.y,s.player.health,s.player.a].every(Number.isFinite)||s.player.health<=0||!canOccupy(s.level,s.player.x,s.player.y))throw Error('Checkpoint is not valid. Start a new transmission.');
    if(campaign==='pit'&&(!Array.isArray(s.level.hazards)||!Array.isArray(s.level.blasts)||typeof s.pitCleared!=='boolean'||s.pitRecord.length!==s.levelIndex+(s.pitCleared?1:0)||s.pitRecord.some((r,i)=>r.stage!==i+1)||![s.player.energy,s.player.reserve].every(Number.isFinite)||s.player.energy<0||s.player.energy>100||s.player.reserve<0||s.player.reserve>180))throw Error('Pit checkpoint resources or progression are invalid');
    const copy=structuredClone(s);this.campaign=campaign;Object.assign(this,copy);this.energyMode=s.energyMode==='survival'?'survival':'legacy';this.player.energy=clamp(Number.isFinite(s.player.energy)?s.player.energy:100,0,ENERGY_CAPACITY);this.player.reserve=this.survival?clamp(Number.isFinite(s.player.reserve)?s.player.reserve:0,0,RESERVE_CAPACITY):0;if(!this.level.regions)decorateLevel(this.level,this.definition,this.levelIndex);this.nav=null;this.navTime=0;this.ori={x:this.player.x+.3,y:this.player.y+.2,a:0};this.mode='playing';this.cooldown=0;this.recharge=0;this.vent=0;this.shotAnim=0;this.hurt=0;this.shake=0;this.shift=false;this.dodgeCooldown=0;this.dodgeFlash=0;this.shieldTime=0;this.shieldCharge=0;this.oriCooldown=0;this.oriAuto=3;this.warning=5;this.objectiveTime=0;this.effects=[];this.projectiles=[];this.events=[];this.resetFeel(copy.v2);if(campaign==='pit'&&s.pitCleared)this.mode=this.levelIndex===11?'ending':'complete';this.checkpoint=this.snapshot();return true;
  }
  update(dt,input={}){
    if(this.mode!=='playing')return;dt=clamp(dt,0,.05);this.time+=dt;
    this.updatePlayer(dt,input);this.updateShared(dt);this.collectPlayerItems();this.updateWorld(dt);if(this.gallery)advanceGallery(this);
  }
  // Split phases let an optional authoritative squad step each avatar, then one world.
  updatePlayer(dt,input={}){
    const p=this.player,l=this.level;
    for(const name of ['cooldown','recharge','shotAnim','hurt','shake','oriCooldown','dodgeCooldown','dodgeFlash','objectiveTime','hitPulse','assistTime','scanTime','equipAnim','portraitTime','speechCooldown','dangerCooldown','muzzle','shieldTime'])this[name]=Math.max(0,this[name]-dt*(name==='shotAnim'?5:name==='muzzle'?12:1));
    if(this.speechCooldown<=0&&this.speechQueue.length){const line=this.speechQueue.shift();this.say(line.text,line.speaker,line.priority);}
    if(this.portraitTime<=0)this.portraitMood=p.health<30?'DETERMINED':this.charge>.3?'CHARGING':input.fire?'FIRING':'FOCUSED';
    if(this.vent>0){this.vent-=dt;if(this.vent<=0){if(this.survival){const amount=Math.min(ENERGY_CAPACITY-p.energy,p.reserve);p.reserve-=amount;p.energy+=amount;this.emit('reloaded',{amount});}else p.energy=Math.min(100,p.energy+40);}}
    if(!this.survival)p.energy=Math.min(100,p.energy+dt*3.7);p.ori=Math.min(100,p.ori+dt*5.5);
    p.vision=clamp(p.vision+(this.shift?-13:9)*dt,0,100);if(p.vision<=0)this.shift=false;
    if(input.turn)p.a+=input.turn*dt*1.9;if(input.look)p.a+=input.look;
    let forward=Number.isFinite(input.moveForward)?clamp(input.moveForward,-1,1):(input.forward?1:0)-(input.back?1:0),strafe=Number.isFinite(input.moveStrafe)?clamp(input.moveStrafe,-1,1):(input.right?1:0)-(input.left?1:0);const norm=Math.max(1,Math.hypot(forward,strafe)),speed=(input.sprint?4.1:2.65)*dt;
    const previous={x:p.x,y:p.y};moveBody(l,p,(Math.cos(p.a)*forward-Math.sin(p.a)*strafe)/norm*speed,(Math.sin(p.a)*forward+Math.cos(p.a)*strafe)/norm*speed);
    this.playerMotion={x:(p.x-previous.x)/Math.max(.001,dt),y:(p.y-previous.y)/Math.max(.001,dt)};
    const travel=distance(previous,p);this.stats.distance+=travel;this.lessonDistance+=travel;this.footDistance+=travel;if(this.lessonDistance>.7)this.lesson=Math.max(1,this.lesson);
    if(this.footDistance>(input.sprint?.95:.7)){this.footDistance=0;this.emit('sound',{name:'step'});}
    p.a=angleDiff(p.a,0);this.moving=travel>.0005;this.sprinting=!!input.sprint;input.afterMovement?.();
    if(!input.deferFire)this.advanceCombat(dt,input.fire);
  }
  updateShared(dt){
    const p=this.player,l=this.level;
    const ox=p.x+Math.cos(p.a+.45)*.8,oy=p.y+Math.sin(p.a+.45)*.8;
    this.ori.x+=(ox-this.ori.x)*Math.min(1,dt*6);this.ori.y+=(oy-this.ori.y)*Math.min(1,dt*6);
    for(const d of Object.values(l.doors))d.open=clamp(d.open+(d.target-d.open)*dt*4,0,1);
  }
  collectPlayerItems(){
    const p=this.player,l=this.level;
    // Automap fog is discovery-based, never leaks the entire layout by default.
    for(let y=Math.floor(p.y)-3;y<=p.y+3;y++)for(let x=Math.floor(p.x)-3;x<=p.x+3;x++)if(x>=0&&y>=0&&x<l.w&&y<l.h&&lineOfSight(l,p,{x:x+.5,y:y+.5}))l.seen[y*l.w+x]=true;
    for(const item of l.items){if(!item.taken&&distance(p,item)<.6){if(item.type==='health'&&p.health>=100||item.type==='energy'&&(this.survival?p.reserve>=RESERVE_CAPACITY:p.energy>=99)||item.type==='armor'&&p.armor>=100)continue;item.taken=true;this.stats.pickups++;if(item.type==='health')p.health=Math.min(100,p.health+35);if(item.type==='energy'){if(this.survival){const available=item.remaining??45,amount=Math.min(available,RESERVE_CAPACITY-p.reserve);p.reserve+=amount;item.remaining=available-amount;item.taken=item.remaining<=0;}else p.energy=Math.min(100,p.energy+45);}if(item.type==='armor')p.armor=Math.min(100,p.armor+45);if(item.type==='artifact'){this.totalArtifacts++;this.banter('artifact',[['ORI',this.totalArtifacts%2===0?'Artifact resonance upgraded every weapon.':'Φ artifact recovered. Two of these upgrade every weapon.'],['WAVE','That belongs in a museum. A very loud museum.']]);this.saveCheckpoint();}this.emit('pickup',{item:item.type});this.emit('sound',{name:'pickup'});}}
    if(!l.key.taken&&distance(p,l.key)<.6){l.key.taken=true;p.key=true;this.stats.pickups++;this.banter('key',[['ORI','Gold access acquired. Extraction doors are yours.'],['WAVE','A key to reality? Finally, something I will not lose in the couch.']]);this.emit('pickup',{item:'GOLDEN ACCESS KEY'});this.emit('sound',{name:'pickup'});this.saveCheckpoint();}
  }
  updateEnvironment(dt){updatePitEnvironment(this,dt);}
  updateWorld(dt){
    const p=this.player,l=this.level;
    this.updateEnvironment(dt);if(this.mode!=='playing')return;
    if(this.gallery){this.updateProjectiles(dt);return;}
    for(const e of l.enemies){this.updateEnemy(e,dt);if(this.mode!=='playing')return;}
    this.updateProjectiles(dt);
    this.oriAuto-=dt;this.warning-=dt;
    const nearby=l.enemies.find(e=>!e.dead&&distance(p,e)<4&&lineOfSight(l,p,e));
    if(nearby&&this.oriAuto<=0&&p.ori>=16){p.ori-=16;this.oriAuto=6;this.assistTime=.7;this.stats.oriAssists++;this.ori.target={x:nearby.x,y:nearby.y};nearby.stun=Math.max(nearby.stun,nearby.pitBoss?.2:1);this.damageEnemy(nearby,10,0,'ori');this.emit('oriAssist',{x:nearby.x,y:nearby.y});this.emit('sound',{name:'oriBolt',position:{x:this.ori.x,y:this.ori.y,height:.75}});this.emit('beam',{from:{...this.ori},to:{x:nearby.x,y:nearby.y},color:'#5df6ec',ori:true});}
    if(nearby&&this.warning<=0){this.say(['Incoming control signal. Break the loop.','Independent thought detected. They seem upset.','You brought a bass cannon to a conformity fight. Excellent.'][Math.floor(this.random()*3)]);this.warning=17;}
    if(p.health<35&&p.health>0&&this.dangerCooldown<=0){this.say(p.health<18?'Michael! Critical health. Find cover. I am right here.':'Health is low. Break line of sight and find a medkit.','ORI',3);this.dangerCooldown=14;}
    if(nearby&&this.dangerCooldown<=0&&Math.abs(angleDiff(Math.atan2(nearby.y-p.y,nearby.x-p.x),this.combatPose?.head.angle??p.a))>1.9){this.say('Behind you, Michael! That one skipped the onboarding.','ORI',3);this.dangerCooldown=9;}
    const secret=Object.values(l.doors).find(d=>d.type===6&&d.open<.1&&distance(p,d)<3);if(secret)this.banter('secret-hint',[['ORI','That wall is transmitting on a different frequency. Try Resonance Vision.']]);
    const region=l.regions?.find(r=>p.x>=r.bounds[0]&&p.x<r.bounds[2]+1&&p.y>=r.bounds[1]&&p.y<r.bounds[3]+1)?.name||'ACCESS CORRIDOR';if(region!==this.region){this.region=region;this.emit('landmark',{name:region});}
    if(this.time>10&&this.stats.distance<3)this.banter('door-help',[['ORI','Head to the striped door. Get close, face it, and press E. Freedom has a surprisingly small button.']]);
    if(this.exitReady&&distance(p,l.exit)<.75)this.complete();
  }
  updateProjectiles(dt){
    const p=this.player,l=this.level;
    for(const b of this.projectiles){
      const steps=3;for(let i=0;i<steps&&!b.dead;i++){b.x+=Math.cos(b.a)*b.speed*dt/steps;b.y+=Math.sin(b.a)*b.speed*dt/steps;if(Number.isFinite(b.height))b.height+=(b.vh||0)*dt/steps;if(solidAt(l,b.x,b.y)||Number.isFinite(b.height)&&(b.height<0||b.height>WALL_HEIGHT)){b.dead=true;this.emit('burst',{x:b.x,y:b.y,color:b.color,count:5,...(Number.isFinite(b.height)?{height:clamp(b.height,.01,WALL_HEIGHT-.01)}:{})});break;}if(b.enemy){if(distance(p,b)<.26&&(!this.combatPose||!Number.isFinite(b.height)||b.height>=.08&&b.height<=this.combatPose.head.height+.08)){this.damagePlayer(b.damage,{x:b.x-Math.cos(b.a),y:b.y-Math.sin(b.a)});b.dead=true;}}else{const e=l.enemies.find(e=>!e.dead&&distance(b,e)<.4&&(!Number.isFinite(b.height)||b.height>=0&&b.height<=entityHeight(e.type)));if(e){this.damageEnemy(e,b.damage,.2);this.hits++;b.dead=true;}}}b.life-=dt;}
    this.projectiles=this.projectiles.filter(b=>!b.dead&&b.life>0);
  }
  updateEnemy(e,dt){
    if(e.dead)return;const p=this.player,l=this.level;e.walk+=dt*(e.state==='pursue'?7:3);e.flash=Math.max(0,e.flash-dt);e.pain=Math.max(0,(e.pain||0)-dt);e.recoil=Math.max(0,(e.recoil||0)-dt);e.stun=Math.max(0,e.stun-dt);e.cooldown-=dt;
    if(e.pitBoss){updatePitBoss(this,e,dt);return;}
    const d=distance(e,p),visible=d<12&&lineOfSight(l,e,p);if(visible)e.state='pursue';
    if(e.type==='warden'){const phase=e.hp<e.maxHp*.34?3:e.hp<e.maxHp*.67?2:1;if(phase!==e.phase){e.phase=phase;this.say(`Warden phase ${phase}. Its argument is getting louder.`);this.emit('sound',{name:'alarm'});}}
    if(e.stun>0)return;
    if(e.type==='crawler'&&!visible&&e.state==='pursue'&&this.time-(e.lastPhase??-6)>5){
      // Crawlers can phase across one thin wall, but never into a solid tile.
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=Math.floor(e.x)+.5,y=Math.floor(e.y)+.5,landing={x:x+dx*2,y:y+dy*2};if(solidAt(l,x+dx,y+dy)&&canOccupy(l,landing.x,landing.y,.24)&&distance(landing,p)<d-1){this.emit('burst',{x:e.x,y:e.y,color:'#bd8bff',count:8});e.x=landing.x;e.y=landing.y;e.lastPhase=this.time;e.stun=.35;this.emit('burst',{x:e.x,y:e.y,color:'#5df6ec',count:8});return;}}
    }
    if(e.tell>0){e.tell-=dt;if(e.tell<=0&&visible){if(e.range<2){if(d<1.45)this.damagePlayer(e.damage,e);}else{const def=this.definition,pressure=this.tactics,speed=def.shotSpeed||(e.type==='warden'?3.6:3),lead=Math.min(.7,d/speed)*pressure,aim={x:p.x+(this.playerMotion?.x||0)*lead,y:p.y+(this.playerMotion?.y||0)*lead},a=Math.atan2(aim.y-e.y,aim.x-e.x),count=e.type==='warden'?e.phase+(pressure>.6?2:pressure>0?1:0):pressure>.6&&e.type==='enforcer'?3:1;for(let i=0;i<count;i++)this.projectiles.push({x:e.x,y:e.y,a:a+(i-(count-1)/2)*.16,speed,life:5,damage:e.damage,enemy:true,color:e.type==='warden'?'#ffbd62':'#ff667d',r:.13,...(this.combatPose?{height:Math.min(1,entityHeight(e.type)*.8),vh:(Math.min(.8,this.combatPose.head.height*.65)-Math.min(1,entityHeight(e.type)*.8))/Math.max(.1,d/speed)}:{})});this.emit('sound',{name:'enemy',position:{x:e.x,y:e.y,height:.8}});}e.cooldown=e.delay/(e.type==='warden'?1+e.phase*.13:1)/(1+this.tactics*.55);}return;}
    if(e.state==='pursue'&&visible&&d<e.range&&e.cooldown<=0){e.tell=(e.type==='warden'?.95:.65)*(1-this.tactics*.22);this.emit('telegraph',{x:e.x,y:e.y});if(e.type==='warden')this.banter('warden-tell-'+e.phase,[['ORI','Warden charge! Strafe now. I will keep its signal busy.']],2);if(e.type==='repeater'&&this.time-(this.broadcastTime??-10)>9){this.broadcastTime=this.time;this.emit('toast',{text:['REPEATER: YOUR COMPLIANCE IS OUR PRIORITY.','REPEATER: PLEASE ACCEPT ALL REALITY COOKIES.','REPEATER: NOTHING TO THINK ABOUT HERE.'][e.id%3]});}return;}
    const pressure=this.tactics;if(pressure&&e.state==='pursue'&&visible&&d>2&&d<e.range){const side=e.id%2?1:-1,a=Math.atan2(p.y-e.y,p.x-e.x)+Math.PI/2*side;moveBody(l,e,Math.cos(a)*e.speed*pressure*dt,Math.sin(a)*e.speed*pressure*dt,.23);}
    if(e.state==='pursue'&&d>.8&&(d>e.range*.6||!visible)){
      // Local navigation via a shared breadth-first distance field.
      if(!this.nav||this.time-this.navTime>.45){this.nav=new Map();const q=[[Math.floor(p.x),Math.floor(p.y)]];this.nav.set(q[0].join(','),0);for(let i=0;i<q.length;i++){const [x,y]=q[i],n=this.nav.get(`${x},${y}`)+1;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=`${xx},${yy}`;if(this.nav.has(k)||solidAt(l,xx+.5,yy+.5))continue;this.nav.set(k,n);q.push([xx,yy]);}}this.navTime=this.time;}
      let tx=p.x,ty=p.y;if(!visible){let best=Infinity;for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const x=Math.floor(e.x)+dx,y=Math.floor(e.y)+dy,n=this.nav.get(`${x},${y}`)??Infinity;if(n<best){best=n;tx=x+.5;ty=y+.5;}}}
      const a=Math.atan2(ty-e.y,tx-e.x),speed=e.speed*(e.type==='warden'?1+e.phase*.16:1)*dt;moveBody(l,e,Math.cos(a)*speed,Math.sin(a)*speed,.23);
    }else if(e.state==='patrol'){const a=e.id*1.7+Math.floor(this.time/3)*Math.PI/2;moveBody(l,e,Math.cos(a)*e.speed*dt*.24,Math.sin(a)*e.speed*dt*.24,.23);}
  }
  interactionHint(){const p=this.player,l=this.level,aim=this.combatPose?.aim,close=o=>distance(o,p)<1.55&&lineOfSight(l,p,o)&&(!aim||rayEntityDistance(aim.origin,aim.direction,o,.1,2.2)!==null);if(l.captives.some(c=>!c.freed&&close(c)))return '[ E ] FREE CAPTIVE';if(l.relays.some(r=>!r.active&&close(r)))return '[ E ] BREAK CONTROL RELAY';if(distance(p,l.exit)<1.8)return this.exitReady?'[ E ] EXTRACT':'PORTAL LOCKED · '+this.objective;const hit=aim?traceEnvironment(l,aim.origin,aim.direction,1.8):null,ray=aim?(hit.cell?{...hit.cell,distance:hit.distance}:{x:-1,y:-1,distance:Infinity}):castRay(l,p.x,p.y,Math.cos(p.a),Math.sin(p.a),1.8),d=l.doors[`${ray.x},${ray.y}`];if(d&&d.open<.85&&ray.distance<1.8)return d.type===6?(this.shift?'[ E ] REVEAL SECRET WALL':''):d.type===5&&!p.key?'GOLD KEY REQUIRED':'[ E ] OPEN DOOR';if(ray.distance<1.8&&l.signs?.some(s=>s.x===ray.x&&s.y===ray.y))return '[ E ] READ ARCHIVE NOTE';return '';}
}
