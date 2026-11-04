// BBS LAN CLAN / The Inversion, first asymmetric Hunters vs Crawler Beast rung.
// All role, HP, objective and cooldown state stays in the authoritative Room.
import {lineOfSight} from '../collision.js';

export const BEAST_ROUND_SECONDS=150;
export const BEAST_BASE_HEALTH=360;
export const BEAST_HEALTH_PER_EXTRA_HUNTER=100;
export const BEAST_MELEE_DAMAGE=42;
export const BEAST_MELEE_RANGE=1.65;
export const BEAST_MELEE_COOLDOWN=1.0;
export const BEAST_LUNGE_DISTANCE=1.3;
export const BEAST_LUNGE_COOLDOWN=3.5;
export const BEAST_RECONNECT_GRACE=15;

const round=n=>Math.round(Math.max(0,n)*10)/10;
const turnDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

export function freshBeastMatch(ownerId,actors){
 const participants=[...actors];
 if(!ownerId||!participants.some(a=>a.id===ownerId&&!a.bot)||participants.length<2||participants.length>5)
  throw Error('Beast match needs a human owner and one to four hunters');
 const hunterIds=participants.filter(a=>a.id!==ownerId).map(a=>a.id);
 if(hunterIds.length<1||hunterIds.length>4)throw Error('Invalid hunter roster');
 return {beastId:ownerId,hunterIds,remaining:BEAST_ROUND_SECONDS,
  health:BEAST_BASE_HEALTH+BEAST_HEALTH_PER_EXTRA_HUNTER*(hunterIds.length-1),
  strikeAt:0,lungeAt:0,complete:false};
}

// Return the closest physically reachable Hunter in the Beast's frontal claw arc.
// The controller can only transmit ordinary bounded angle/intent, not hit targets.
export function beastClawTarget(state,attacker,actors,level){
 if(!state||state.beastId!==attacker?.id||attacker.status!=='alive'||!attacker.connected)return null;
 const p=attacker.player;
 return [...actors].filter(a=>state.hunterIds.includes(a.id)&&a.connected&&a.status==='alive')
  .map(a=>({actor:a,dist:Math.hypot(a.player.x-p.x,a.player.y-p.y),
   dir:Math.atan2(a.player.y-p.y,a.player.x-p.x)}))
  .filter(t=>t.dist<=BEAST_MELEE_RANGE&&Math.abs(turnDiff(t.dir,p.a))<=.8&&lineOfSight(level,p,t.actor.player))
  .sort((a,b)=>a.dist-b.dist)[0]?.actor||null;
}

// A round ends only from host-known deaths and fixed host time.
// A disconnected role receives a short reconnection grace; abandoning a
// match voids the result rather than minting free verified online wins.
export function advanceBeast(state,actors,now,dt){
 if(!state||state.complete)return null;
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Invalid beast tick');
 const members=[...actors],beast=members.find(a=>a.id===state.beastId);
 const hunters=members.filter(a=>state.hunterIds.includes(a.id));
 if(!beast||hunters.length!==state.hunterIds.length){
  state.complete=true;return {winner:null,reason:'roster-abandoned'};
 }
 const departed=[beast,...hunters].filter(a=>!a.connected&&!a.bot&&
  now-(a.disconnectedAt??now)>=BEAST_RECONNECT_GRACE);
 if(departed.length){state.complete=true;return {winner:null,reason:'player-abandoned'};}
 // Death is decisive regardless of the connected field. Disconnect alone is not.
 if(beast.status==='dead'){state.complete=true;return {winner:'hunters',reason:'beast-defeated'};}
 if(hunters.every(a=>a.status==='dead')){state.complete=true;return {winner:'beast',reason:'hunters-eliminated'};}
 state.remaining=Math.max(0,state.remaining-dt);
 if(state.remaining<1e-7)state.remaining=0;
 if(state.remaining===0){state.complete=true;return {winner:'hunters',reason:'hunters-survived'};}
 return null;
}

export function beastSnapshot(state,now,actors){
 const beast=[...actors].find(a=>a.id===state.beastId);
 return {archetype:'crawler',beastId:state.beastId,remaining:round(state.remaining),
  hunters:state.hunterIds.length,beastHealth:Math.max(0,Math.ceil(beast?.player?.health||0)),
  beastMaxHealth:state.health,strikeIn:round(state.strikeAt-now),
  lungeIn:round(state.lungeAt-now),completed:state.complete};
}
