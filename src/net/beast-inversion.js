// BBS LAN CLAN / The Inversion, four server-owned original Beast forms.
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
export const BEAST_ARCHETYPES=Object.freeze({
 crawler:Object.freeze({name:'CRAWLER',health:BEAST_BASE_HEALTH,perHunter:BEAST_HEALTH_PER_EXTRA_HUNTER,damage:BEAST_MELEE_DAMAGE,range:BEAST_MELEE_RANGE,cone:.8,cooldown:BEAST_MELEE_COOLDOWN,lunge:BEAST_LUNGE_DISTANCE,lungeCooldown:BEAST_LUNGE_COOLDOWN,walk:3.3,sprint:4.7}),
 repeater:Object.freeze({name:'REPEATER',health:260,perHunter:75,damage:18,range:8,cone:.23,cooldown:1.35,lunge:.85,lungeCooldown:4.5,walk:2.7,sprint:3.7}),
 plugged:Object.freeze({name:'PLUGGED',health:410,perHunter:85,damage:28,chainDamage:14,chainRange:2.4,range:3.4,cone:.72,cooldown:1.6,lunge:0,lungeCooldown:8,guardDuration:2.4,guardFactor:.5,walk:2.35,sprint:3.2}),
 warden:Object.freeze({name:'WARDEN',health:520,perHunter:110,damage:34,range:2.1,cone:.75,cooldown:1.5,lunge:0,lungeCooldown:12,fieldRadius:2.6,fieldWindup:1.0,fieldDuration:4.0,fieldTick:1,fieldDamage:11,walk:2.1,sprint:2.85})
});

const round=n=>Math.round(Math.max(0,n)*10)/10;
const turnDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

export function freshBeastMatch(ownerId,actors,archetype='crawler'){
 if(!Object.hasOwn(BEAST_ARCHETYPES,archetype))throw Error('Unsupported Beast archetype');
 const profile=BEAST_ARCHETYPES[archetype];
 const participants=[...actors];
 if(!ownerId||!participants.some(a=>a.id===ownerId&&!a.bot)||participants.length<2||participants.length>5)
  throw Error('Beast match needs a human owner and one to four hunters');
 const hunterIds=participants.filter(a=>a.id!==ownerId).map(a=>a.id);
 if(hunterIds.length<1||hunterIds.length>4)throw Error('Invalid hunter roster');
 return {beastId:ownerId,hunterIds,archetype,remaining:BEAST_ROUND_SECONDS,
  health:profile.health+profile.perHunter*(hunterIds.length-1),
  strikeAt:0,lungeAt:0,groundedUntil:0,field:null,complete:false};
}

// Return the closest physically reachable Hunter in the Beast's frontal claw arc.
// The controller can only transmit ordinary bounded angle/intent, not hit targets.
function selectBeastTarget(state,attacker,actors,level,profile){
 if(!state||state.beastId!==attacker?.id||attacker.status!=='alive'||!attacker.connected)return null;
 const p=attacker.player;
 return [...actors].filter(a=>state.hunterIds.includes(a.id)&&a.connected&&a.status==='alive')
  .map(a=>({actor:a,dist:Math.hypot(a.player.x-p.x,a.player.y-p.y),
   dir:Math.atan2(a.player.y-p.y,a.player.x-p.x)}))
  .filter(t=>t.dist<=profile.range&&Math.abs(turnDiff(t.dir,p.a))<=profile.cone&&lineOfSight(level,p,t.actor.player))
  .sort((a,b)=>a.dist-b.dist)[0]?.actor||null;
}
export function beastClawTarget(state,attacker,actors,level){
 return state?.archetype==='crawler'?selectBeastTarget(state,attacker,actors,level,BEAST_ARCHETYPES.crawler):null;
}
export function beastPulseTarget(state,attacker,actors,level){
 return state?.archetype==='repeater'?selectBeastTarget(state,attacker,actors,level,BEAST_ARCHETYPES.repeater):null;
}
export function beastWardenTarget(state,attacker,actors,level){
 return state?.archetype==='warden'?selectBeastTarget(state,attacker,actors,level,BEAST_ARCHETYPES.warden):null;
}
// A single fixed emplacement, created from a server-owned Beast position.
// Never home toward a moving opponent or relocate from client aim input.
export function deployWardenField(state,attacker,now){
 if(state?.archetype!=='warden'||state.beastId!==attacker?.id||
  attacker.status!=='alive'||!attacker.connected)return false;
 const p=BEAST_ARCHETYPES.warden,point=attacker.player;
 const armedAt=now+p.fieldWindup;
 state.field={x:point.x,y:point.y,armedAt,expiresAt:armedAt+p.fieldDuration,nextPulseAt:armedAt};
 return true;
}
// The warned field does no damage during charge-up. Once active, exactly one
// host-paced pulse can hit each alive, connected, LOS-visible Hunter per tick.
export function wardenFieldTargets(state,actors,level,now){
 if(state?.archetype!=='warden'||state.complete||!state.field)return [];
 const members=[...actors],owner=members.find(a=>a.id===state.beastId);
 if(!owner||owner.status!=='alive'||!owner.connected){state.field=null;return [];}
 const field=state.field,p=BEAST_ARCHETYPES.warden;
 if(now>=field.expiresAt){state.field=null;return [];}
 if(now<field.armedAt||now+1e-7<field.nextPulseAt)return [];
 field.nextPulseAt=now+p.fieldTick; // never catch up with stacked lag-spike hits
 const origin={x:field.x,y:field.y};
 return members.filter(a=>state.hunterIds.includes(a.id)&&a.status==='alive'&&a.connected&&
  Math.hypot(a.player.x-field.x,a.player.y-field.y)<=p.fieldRadius&&
  lineOfSight(level,origin,a.player));
}

// Plugged can fork a close frontal electric arc to one nearby second Hunter.
// Each target must be independently within the forward arc and visible from
// the Beast. Never trust a client target list, body, coordinates or claimed HP.
export function beastArcTargets(state,attacker,actors,level){
 if(state?.archetype!=='plugged'||state.beastId!==attacker?.id||attacker.status!=='alive'||!attacker.connected)return [];
 const p=attacker.player,profile=BEAST_ARCHETYPES.plugged;
 const eligible=[...actors].filter(a=>state.hunterIds.includes(a.id)&&a.connected&&a.status==='alive')
  .map(actor=>({actor,distance:Math.hypot(actor.player.x-p.x,actor.player.y-p.y)}))
  .filter(({actor,distance})=>distance<=profile.range&&
   Math.abs(turnDiff(Math.atan2(actor.player.y-p.y,actor.player.x-p.x),p.a))<=profile.cone&&
   lineOfSight(level,p,actor.player))
  .sort((a,b)=>a.distance-b.distance||a.actor.id.localeCompare(b.actor.id));
 if(!eligible.length)return [];
 const first=eligible[0].actor,other=eligible.slice(1).find(({actor})=>
  Math.hypot(actor.player.x-first.player.x,actor.player.y-first.player.y)<=profile.chainRange)?.actor;
 return other?[first,other]:[first];
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
 return {archetype:state.archetype,beastId:state.beastId,remaining:round(state.remaining),
  hunters:state.hunterIds.length,beastHealth:Math.max(0,Math.ceil(beast?.player?.health||0)),
  beastMaxHealth:state.health,strikeIn:round(state.strikeAt-now),
  lungeIn:round(state.lungeAt-now),guardRemaining:state.archetype==='plugged'?round(state.groundedUntil-now):0,
  field:state.archetype==='warden'&&state.field&&now<state.field.expiresAt?
   {x:round(state.field.x),y:round(state.field.y),radius:BEAST_ARCHETYPES.warden.fieldRadius,
    phase:now<state.field.armedAt?'warning':'active',
    armIn:round(state.field.armedAt-now),remaining:round(state.field.expiresAt-now)}:null,
  completed:state.complete};
}
