// ANTIΦ-ATOGEN OUTBREAK: optional offline endless wave survival.
// Fictional infected entities, not a biological simulation. The campaign,
// Pit, LAN, and ΦWAD progression are deliberately never written by this mode.
import {reachable,canOccupy,lineOfSight} from './collision.js';
export const OUTBREAK_NAME='ANTIΦ-ATOGEN OUTBREAK';
export const OUTBREAK_MAX_ACTIVE=14;
export const OUTBREAK_MAX_ROUND_ENEMIES=54;
export const OUTBREAK_REST_SECONDS=7;
export const OUTBREAK_FIRST_SECONDS=5;
export const outbreakRoundSize=round=>Math.min(OUTBREAK_MAX_ROUND_ENEMIES,6+Math.max(0,Math.floor(round)-1)*3);
export const outbreakSpawnInterval=round=>Math.max(.38,1.45-Math.max(0,round-1)*.055);
const ALARM='#c1ff68';
// Pure, deterministic mutation schedule: players learn which wave introduces
// each new threat, and tests can replay it without random timing surprises.
export const OUTBREAK_VARIANTS=Object.freeze({
 shambler:Object.freeze({label:'SHAMBLER',color:'#b9ff65',hp:1,speed:1,damage:1,delay:1}),
 runner:Object.freeze({label:'RUNNER',color:'#ff698c',hp:.72,speed:1.36,damage:.8,delay:.88}),
 brute:Object.freeze({label:'BRUTE',color:'#ffc36d',hp:1.8,speed:.72,damage:1.4,delay:1.3})
});
export function outbreakVariantFor(round,spawnIndex){
 const r=Math.max(1,Math.floor(Number.isFinite(round)?round:1));
 const i=Math.max(0,Math.floor(Number.isFinite(spawnIndex)?spawnIndex:0));
 if(r>=5&&i%7===6)return 'brute';
 if(r>=3&&i%4===3)return 'runner';
 return 'shambler';
}

export function initializeOutbreak(game){
 const level=game.level;
 // Original sector geometry makes a familiar containment labyrinth. Normal
 // doors start open so enemies can traverse the arena. Secrets remain secret.
 for(const door of Object.values(level.doors)){
  if(door.type===6)continue;
  door.open=1;door.target=1;delete door.lockColor;
 }
 level.enemies=[];
 level.relays=[];level.captives=[];level.items=[];
 level.key.taken=true;level.outbreak=true;
 game.player.key=false;game.player.keys={};game.player.health=100;
 game.player.armor=60;game.player.energy=100;game.player.reserve=140;
 game.unlocked=6;game.weapon=1;
 game.levelKills=0;game.totalArtifacts=0;game.bassCharge=0;
 game.outbreak={round:0,phase:'rest',timer:OUTBREAK_FIRST_SECONDS,
  remaining:0,spawned:0,kills:0,totalKills:0,nextId:1000,spawnClock:0,
  bestRound:0};
 game.checkpoint=null;
 game.emit('toast',{text:'ANTIΦ-ATOGEN OUTBREAK / CONTAINMENT LOST'});
 game.say('Infected signatures inbound. No extraction, no final round. Keep moving.','ORI',3);
}

// Deterministic spawn cells reachable through actual currently open doors.
// New enemies appear away from the player, preferably out of line of sight.
export function outbreakSpawnCells(game,minDistance=5){
 const l=game.level,p=game.player,visited=reachable(l,p,{doorsOpen:true});
 const choices=[];
 for(const key of visited){
  const [ix,iy]=key.split(',').map(Number),x=ix+.5,y=iy+.5;
  if(Math.hypot(x-p.x,y-p.y)<minDistance||!canOccupy(l,x,y,.25))continue;
  if(l.enemies.some(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<1.2))continue;
  choices.push({x,y,hidden:!lineOfSight(l,p,{x,y})});
 }
 return choices;
}

export function spawnOutbreakInfected(game){
 const state=game.outbreak;if(!state||state.remaining<=0)return null;
 const choices=outbreakSpawnCells(game,5);
 const pool=choices.filter(c=>c.hidden);
 const selection=pool.length?pool:choices;
 if(!selection.length)return null; // retry later: never spawn in a solid wall.
 const spot=selection[Math.floor(game.random()*selection.length)];
 const round=state.round,variant=outbreakVariantFor(round,state.spawned),
  profile=OUTBREAK_VARIANTS[variant],baseHp=Math.min(220,50+round*7),
  baseSpeed=Math.min(1.65,.71+round*.035),
  baseDamage=Math.min(21,7+round*.65),baseDelay=Math.max(.65,1.15-round*.014),
  maxHp=Math.min(360,Math.max(1,Math.round(baseHp*profile.hp)));
 const enemy={id:state.nextId++,type:'plugged',outbreak:true,outbreakVariant:variant,
  x:spot.x,y:spot.y,homeX:spot.x,homeY:spot.y,
  hp:maxHp,maxHp,speed:Math.min(1.9,baseSpeed*profile.speed),
  damage:Math.min(30,baseDamage*profile.damage),range:1.05,delay:baseDelay*profile.delay,
  human:false,state:'pursue',cooldown:.7,tell:0,stun:0,flash:0,
  dead:false,phase:1,walk:0,pathTimer:0};
 game.level.enemies.push(enemy);
 state.spawned++;state.remaining--;state.spawnClock=outbreakSpawnInterval(round);
 game.emit('burst',{x:enemy.x,y:enemy.y,height:.55,color:profile.color,count:9});
 return enemy;
}
export function beginOutbreakRound(game){
 const state=game.outbreak;if(!state)return;
 state.round++;state.bestRound=Math.max(state.bestRound,state.round);
 state.phase='active';state.remaining=outbreakRoundSize(state.round);
 state.spawned=0;state.spawnClock=0;state.timer=0;
 game.emit('toast',{text:'ANTIΦ-ATOGEN / ROUND '+state.round+' / '+state.remaining+' INBOUND'});
 game.emit('sound',{name:'alarm'});
 game.say(state.round===1?'Outbreak confirmed. Hold the line, but never stop moving.':
  state.round===3?'New mutation: runners are faster, but less durable. Keep strafing.':
  state.round===5?'Heavy mutation: brutes are tougher. Time your dodges.':
  'Round '+state.round+'. More infected signatures. Keep your route open.','ORI',2);
}
export function outbreakAlive(game){return game.level.enemies.filter(e=>e.outbreak&&!e.dead).length;}
export function outbreakRemaining(game){
 const s=game.outbreak;return s?s.remaining+outbreakAlive(game):0;
}
export function advanceOutbreak(game,dt){
 const state=game.outbreak;
 if(!state||game.mode!=='playing')return;
 if(state.phase==='rest'){
  state.timer=Math.max(0,state.timer-dt);
  if(state.timer<=0)beginOutbreakRound(game);
  return;
 }
 if(state.phase!=='active')return;
 state.spawnClock=Math.max(0,state.spawnClock-dt);
 if(state.remaining>0&&outbreakAlive(game)<OUTBREAK_MAX_ACTIVE&&state.spawnClock<=0)
  spawnOutbreakInfected(game);
 if(state.remaining===0&&outbreakAlive(game)===0){
  // Clear dead corpses at round boundaries: endless play must not grow the
  // enemy array forever or degrade Quest 3 performance after many rounds.
  game.level.enemies=game.level.enemies.filter(e=>!e.outbreak);
  state.phase='rest';state.timer=OUTBREAK_REST_SECONDS;
  const p=game.player;
  p.health=Math.min(100,p.health+Math.min(24,10+state.round));
  p.armor=Math.min(100,p.armor+14);
  p.energy=Math.min(100,p.energy+45);
  p.reserve=Math.min(180,p.reserve+Math.min(65,30+state.round*2));
  p.ori=Math.min(100,p.ori+25);
  game.emit('toast',{text:'ROUND '+state.round+' SURVIVED / SUPPLIES RESTORED / NEXT WAVE IN '+OUTBREAK_REST_SECONDS});
  game.emit('sound',{name:'relay'});
  game.say('Round '+state.round+' contained. Replenish. There is another wave coming.','ORI',2);
 }
}
export function outbreakObjective(game){
 const s=game.outbreak;if(!s)return '';
 return s.phase==='rest'
  ?'OUTBREAK · ROUND '+(s.round+1)+' IN '+Math.ceil(s.timer)+'s / '+s.totalKills+' ELIMINATED'
  :'OUTBREAK · ROUND '+s.round+' / '+outbreakRemaining(game)+' INFECTED LEFT';
}
