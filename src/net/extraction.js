// BBS LAN CLAN / isolated server-authoritative extraction mission.
// Players supply bounded movement + USE intent; custody, clocks, alarms and
// exfil success come only from the host simulation's accepted actor positions.
import {canOccupy,lineOfSight} from '../collision.js';

export const EXTRACTION_SECONDS=240;
export const EXTRACTION_HOLD_SECONDS=3;
export const EXTRACTION_MAX_RETRIES=2;
export const EXTRACTION_VAULT=Object.freeze({x:4.5,y:5.5});
export const EXTRACTION_PAD=Object.freeze({x:4.5,y:20.5});
const RANGE=1.6;
const near=(level,a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<RANGE&&lineOfSight(level,a,b);
const rounded=n=>Math.max(0,Math.round(n*10)/10);

export function freshExtraction(level,retries=0){
 if(!canOccupy(level,EXTRACTION_VAULT.x,EXTRACTION_VAULT.y)||
    !canOccupy(level,EXTRACTION_PAD.x,EXTRACTION_PAD.y))throw Error('Extraction objective inside a solid wall');
 if(!Number.isInteger(retries)||retries<0||retries>EXTRACTION_MAX_RETRIES)throw Error('Invalid extraction retry count');
 return {vault:{...EXTRACTION_VAULT},pad:{...EXTRACTION_PAD},
  holderId:null,dropped:null,remaining:EXTRACTION_SECONDS,channel:0,alarms:0,
  nextAlarm:45,retries,completed:false};
}

export function extractionPickup(state,actor,level){
 if(state.completed||state.remaining<=0||state.holderId||actor.status!=='alive'||!actor.connected)return false;
 const target=state.dropped||state.vault;
 if(!near(level,actor.player,target))return false;
 state.holderId=actor.id;state.dropped=null;state.channel=0;
 return true;
}

export function extractionDrop(state,actor,level){
 if(!state||state.holderId!==actor?.id||state.completed)return false;
 const point=actor.player;
 state.holderId=null;state.channel=0;
 state.dropped=canOccupy(level,point.x,point.y)?{x:point.x,y:point.y}:{...state.vault};
 return true;
}

// Fixed-step host tick. Never reads client-declared coordinates, item state,
// score, victory, time, or an independent browser clock.
export function advanceExtraction(state,actors,level,dt){
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Invalid extraction tick');
 if(state.completed)return {success:false,failed:false,alarm:false};
 state.remaining=Math.max(0,state.remaining-dt);
 if(state.remaining<1e-7)state.remaining=0; // Float subtraction must not extend a timed mission.
 const humans=[...actors].filter(a=>a.connected&&a.status==='alive');
 const carrier=humans.find(a=>a.id===state.holderId);
 if(state.holderId&&!carrier){
  // Drop is also called on defeat/disconnect, but remain safe against a race.
  state.holderId=null;state.channel=0;state.dropped??={...state.vault};
 }
 let alarm=false;
 if(state.remaining>0&&EXTRACTION_SECONDS-state.remaining+1e-7>=state.nextAlarm&&state.alarms<4){
  state.alarms++;state.nextAlarm+=45;alarm=true;
 }
 if(carrier&&state.remaining>0&&near(level,carrier.player,state.pad)&&carrier.input?.use){
  state.channel=Math.min(EXTRACTION_HOLD_SECONDS,state.channel+dt);
 }else state.channel=0;
 if(state.remaining>0&&state.channel>=EXTRACTION_HOLD_SECONDS-1e-7){
  state.completed=true;
  return {success:true,failed:false,alarm};
 }
 return {success:false,failed:state.remaining<=0,alarm};
}
export function extractionSnapshot(state){
 return {vault:{...state.vault},pad:{...state.pad},dropped:state.dropped?{...state.dropped}:null,
  carrier:state.holderId,remaining:rounded(state.remaining),
  channel:rounded(state.channel),channelSeconds:EXTRACTION_HOLD_SECONDS,
  alarms:state.alarms,retries:state.retries,maxRetries:EXTRACTION_MAX_RETRIES,
  completed:state.completed};
}
