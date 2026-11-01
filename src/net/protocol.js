// Shared wire contract. Clients submit intent; no transform, health, ammo or score writes.
export const PROTOCOL=1,TICK_RATE=30,SNAPSHOT_RATE=10,INPUT_RATE=20,MAX_MESSAGE=4096;
export const MODES=['deathmatch','coop','team','clan'];
export const ARENAS=['no-carrier','sysops-revenge','kill-switch'];
export const ACTIONS=['fire','alternate','reload','dash','ori','bass','vision'];
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function keys(v,allowed){if(!object(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unknown protocol field');}
export function nickname(value){if(typeof value!=='string')throw Error('A handle is required');const s=value.trim();if(!/^[A-Za-z0-9 _.-]{1,20}$/.test(s))throw Error('Handle: 1–20 letters, digits, spaces, dot, dash or underscore');return s;}
export function roomCode(value){if(typeof value!=='string'||!(/^[A-Z2-9]{8}$/).test(value.toUpperCase()))throw Error('Room code must have eight letters/digits');return value.toUpperCase();}
export function validateMessage(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_MESSAGE)throw Error('Message exceeds 4096 bytes');let m;try{m=JSON.parse(raw);}catch{throw Error('Invalid JSON');}if(!object(m)||typeof m.type!=='string')throw Error('Message type required');
 switch(m.type){
 case 'create':keys(m,['type','nickname','mode','arena','limit','capacity']);nickname(m.nickname);if(!MODES.includes(m.mode)||!ARENAS.includes(m.arena)||!Number.isInteger(m.limit)||!number(m.limit,1,50)||!Number.isInteger(m.capacity)||!number(m.capacity,2,m.mode==='coop'?4:8))throw Error('Invalid room settings');break;
 case 'join':keys(m,['type','nickname','code','token']);nickname(m.nickname);roomCode(m.code);if(m.token!==undefined&&!/^[a-f0-9]{48}$/.test(m.token))throw Error('Invalid reconnect token');break;
 case 'resume':keys(m,['type','nickname','code','token']);nickname(m.nickname);roomCode(m.code);if(!/^[a-f0-9]{48}$/.test(m.token))throw Error('Invalid host resume token');break;
 case 'input':{
  keys(m,['type','seq','move','strafe','angle','sprint','fire','charging','use','weapon','actions','aim','roomX','roomY','dashAngle']);
  if(!Number.isInteger(m.seq)||!number(m.seq,1,2147483647)||!number(m.move,-1,1)||!number(m.strafe,-1,1)||!number(m.angle,-Math.PI*4,Math.PI*4)||!number(m.weapon,0,5)||!Number.isInteger(m.weapon))throw Error('Invalid input');
  for(const k of ['sprint','fire','charging','use'])if(typeof m[k]!=='boolean')throw Error('Invalid button');
  if(!Array.isArray(m.actions)||m.actions.length>8||new Set(m.actions).size!==m.actions.length||m.actions.some(x=>!ACTIONS.includes(x)))throw Error('Invalid action');
  if(m.dashAngle!==undefined&&!number(m.dashAngle,-Math.PI*4,Math.PI*4))throw Error('Invalid dash direction');
  for(const k of ['roomX','roomY'])if(m[k]!==undefined&&!number(m[k],-1,1))throw Error('Invalid room movement');
  if(m.aim!==null){keys(m.aim,['x','y','height','dx','dy','dz','eye']);for(const k of ['x','y'])if(!number(m.aim[k],-.54,.54))throw Error('Grip outside reach');if(!number(m.aim.height,.08,1.6)||!number(m.aim.eye,.35,1.6)||!['dx','dy','dz'].every(k=>number(m.aim[k],-1,1))||Math.hypot(m.aim.dx,m.aim.dy,m.aim.dz)<.9||Math.hypot(m.aim.dx,m.aim.dy,m.aim.dz)>1.1)throw Error('Invalid tracked aim');}
  break;}
 case 'ready':keys(m,['type','ready']);if(typeof m.ready!=='boolean')throw Error('Invalid ready status');break;
 case 'start':case 'leave':case 'lobby':case 'next':case 'retry':case 'save':keys(m,['type']);break;
 case 'ping':keys(m,['type','id']);if(!Number.isInteger(m.id)||!number(m.id,0,2147483647))throw Error('Invalid ping');break;
 default:throw Error('Unknown message type');
 }return m;
}
export const neutralInput=()=>({move:0,strafe:0,angle:0,sprint:false,fire:false,charging:false,use:false,weapon:1,actions:[],aim:null,roomX:0,roomY:0});
export class TokenBucket{
 constructor(rate=50,burst=80){this.rate=rate;this.burst=burst;this.tokens=burst;this.time=0;}
 take(now,cost=1){this.tokens=Math.min(this.burst,this.tokens+Math.max(0,now-this.time)*this.rate);this.time=now;if(this.tokens<cost)return false;this.tokens-=cost;return true;}
}
export function endpoint(value,secure=false){const u=new URL(value);if(!['ws:','wss:'].includes(u.protocol)||u.username||u.password||u.hash||u.search)throw Error('Use ws://host:port/ws or trusted wss://host/ws');if(secure&&u.protocol!=='wss:')throw Error('HTTPS and Quest clients require a trusted WSS endpoint');return u.href;}
