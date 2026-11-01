// Unnumbered post-24 encounter. Only authoritative room state can unlock it.
import{PIT_ACTS}from'../pit.js';import{createLevel,distance,lineOfSight,canOccupy}from'../core.js';
export const RAID_DEFINITION={name:'THE FINAL FREQUENCY',tag:'DEMIURGE PRIME / THE LAST TRANSMISSION',subtitle:'Four phases. One shared signal. Hold the line together.',color:'#f8d67a',act:3,spawn:{x:7.5,y:21.5,a:-Math.PI/2}};
const NODES={fracture:[{id:'west',x:6.5,y:13.5},{id:'east',x:22.5,y:13.5}],link:[{id:'west-link',x:8.5,y:8.5},{id:'east-link',x:20.5,y:8.5}],frequency:[{id:'low',x:7.5,y:5.5},{id:'high',x:21.5,y:5.5}]};
export function createRaidLevel(partySize=2){
 const w=29,h=25,cells=Array.from({length:h},()=>Array(w).fill(3));for(const [x0,y0,x1,y1]of[[1,1,27,6],[1,4,12,23],[16,4,27,23],[1,21,27,23],[12,13,16,13]])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=0;
 for(const[x,y]of[[4,9],[10,16],[18,16],[24,9],[3,18],[25,18]])cells[y][x]=3;
 cells[13][14]=4;const doors={'14,13':{x:14,y:13,type:4,open:1,target:1}},base=createLevel(0).enemies.find(e=>e.type==='enforcer'),enemies=[];
 enemies.push({...base,id:0,type:'warden',x:14.5,y:3.5,hp:4800+1600*(partySize-2),maxHp:4800+1600*(partySize-2),dead:false,phase:1,raidRole:'core',human:false});
 for(const[x,y]of[[5.5,5.5],[23.5,5.5],[5.5,16.5],[23.5,16.5]])enemies.push({...base,id:enemies.length,x,y,hp:420+120*(partySize-2),maxHp:420+120*(partySize-2),dead:false,phase:1,raidRole:'pylon',human:false});
 const items=[];for(const[x,y]of[[3.5,21.5],[10.5,21.5],[18.5,21.5],[25.5,21.5],[3.5,12.5],[25.5,12.5],[10.5,5.5],[18.5,5.5]])items.push({id:items.length,type:'energy',x,y,taken:false,remaining:45*partySize});
 for(const[type,x,y]of[['health',4.5,20.5],['health',24.5,20.5],['health',6.5,10.5],['health',22.5,10.5],['armor',9.5,19.5],['armor',19.5,19.5],['armor',6.5,3.5],['armor',22.5,3.5]])items.push({id:items.length,type,x,y,taken:false});
 return{index:0,campaign:'raid',w,h,cells,doors,enemies,items,captives:[],relays:[],key:{x:14.5,y:22.5,taken:true},exit:{x:14.5,y:22.5},seen:Array(w*h).fill(false),secretFound:false,palette:{...PIT_ACTS[3],name:'THE FINAL FREQUENCY',primary:'#f8d67a',accent:'#bb8dff',glow:[.97,.84,.48,1],secondary:[.73,.55,1,1]},regions:[{bounds:[1,1,27,6],name:'THE AWAKENING'},{bounds:[1,7,12,23],name:'LOW FREQUENCY'},{bounds:[16,7,27,23],name:'HIGH FREQUENCY'}],props:[],signs:[],hazards:[],blasts:[],raidNodes:[]};
}
export class Finale{
 constructor(room){this.room=room;this.phase=1;this.state='awakening';this.progress=0;this.openUntil=0;this.nextOpen=0;this.attackAt=2;this.waveAt=.5;this.wave=0;this.sequence=0;this.held=new Map();this.phaseTimes=[room.game.time];this.completed=false;this.partitionPending=false;}
 get core(){return this.room.game.level.enemies.find(e=>e.raidRole==='core');}
 get corrupted(){return this.phase===3&&this.state!=='escape';}
 get nodes(){return this.phase===2?NODES.fracture:this.phase===3?NODES.link:this.phase===4&&this.state!=='escape'?NODES.frequency:[];}
 tell(text){this.room.event('pitTell',{text});this.room.event('dialogue',{speaker:'ORI',text,priority:2});}
 use(a){if(this.phase===2&&distance(a.player,{x:14.5,y:13.5})<1.8)return true;const node=this.nodes.find(n=>distance(a.player,n)<1.25&&lineOfSight(this.room.game.level,a.player,n));if(!node)return false;this.held.set(node.id,{id:a.id,at:this.room.game.time});return true;}
 transition(phase){const colors=[null,null,['#bb8dff','#80e8d4'],['#ff718e','#bb8dff'],['#80e8d4','#f8d67a']][phase];if(colors){const p=this.room.game.level.palette;p.primary=colors[0];p.accent=colors[1];p.glow=[1,3,5].map(i=>parseInt(colors[0].slice(i,i+2),16)/255).concat(1);p.secondary=[1,3,5].map(i=>parseInt(colors[1].slice(i,i+2),16)/255).concat(1);p.fog=p.glow.slice(0,3).map(v=>v*.025);}this.phase=phase;this.progress=0;this.held.clear();this.phaseTimes.push(this.room.game.time);this.core.phase=phase;this.partitionPending=phase===2;this.room.game.level.doors['14,13'].networkLocked=phase===2;this.state=['','awakening','fracture','possession','frequency'][phase];this.room.game.level.doors['14,13'].target=phase===2?0:1;
 this.tell(phase===2?'THE FRACTURE / hold both distant consoles with different teammates.':phase===3?'ORI LINK CORRUPTED / two repair dishes restore our signal.':'FINAL FREQUENCY / two resonators together. Shoot the exposed core.');this.room.event('raidPhase',{phase});this.room.dirty=true;}
 hit(e,damage,stun,source){
  const r=this.room,g=r.game;if(e.raidRole==='core'&&(this.phase!==4||g.time>=this.openUntil||this.state==='escape')){if(g.time-(this.lastGuardTell||-5)>3){this.lastGuardTell=g.time;this.tell('PRIME SHIELDED / '+(this.phase===1?'DESTROY THE FOUR PYLONS':this.phase===4?'SYNCHRONIZE THE RESONATORS':'COMPLETE THE SQUAD LINK'));}return false;}return true;
 }
 defeated(e){if(e.raidRole==='core'){this.state='escape';this.escapeAt=this.room.game.time;this.deadline=this.escapeAt+45;this.room.game.level.doors['14,13'].target=1;this.room.game.level.raidNodes=[];this.tell('CORE DOWN / SQUAD EXTRACT. South bridge. Forty-five seconds.');this.room.event('raidEscape');this.room.dirty=true;}}
 spawnWave(){const r=this.room,g=r.game,l=g.level;if(l.enemies.filter(e=>!e.dead&&!e.raidRole).length>=6)return;
 const base=createLevel(0).enemies.find(e=>e.type===(this.wave%2?'repeater':'plugged'));for(const[x,y]of[[3.5,3.5],[25.5,3.5]]){const id=100+this.wave*2+(x>10?1:0);if(canOccupy(l,x,y))l.enemies.push({...base,id,x,y,homeX:x,homeY:y,hp:base.maxHp*(1+.3*(r.partySize-1)),maxHp:base.maxHp*(1+.3*(r.partySize-1)),dead:false,human:false,cooldown:1,state:'pursue',phase:1,walk:0,stun:0});}this.wave++;if(l.enemies.length>64)l.enemies=l.enemies.filter(e=>!e.dead||e.raidRole);}
 attack(){const r=this.room,g=r.game,l=g.level,live=r.live().filter(a=>a.connected);if(!live.length)return;const target=live[this.sequence%live.length],a=Math.atan2(target.player.y-this.core.y,target.player.x-this.core.x),phase=this.phase;
 if(this.sequence%2===0){for(const p of live)if(l.blasts.length<8)l.blasts.push({x:p.player.x,y:p.player.y,radius:.72,damage:14+phase*2,at:g.time+1.05,hit:false});this.tell('PRIME MARK / MOVE OFF THE BRIGHT FLOOR');}
 else{for(let i=0;i<3+phase&&g.projectiles.length<128;i++){const angle=a+(i-(2+phase)/2)*.18;g.projectiles.push({x:this.core.x,y:this.core.y,a:angle,speed:3.1+phase*.12,life:7,damage:12+phase*2,enemy:true,color:'#f8d67a',height:.9,vh:((target.input.aim?.eye||1.03)*.65-.9)/Math.max(.1,distance(this.core,target.player)/(3.1+phase*.12))});}this.tell('PRIME VOLLEY / BREAK THE LINE');}
 this.sequence++;this.core.tell=0;r.event('raidAttack',{phase,kind:this.sequence%2?'marked-floor':'volley'});}
 update(dt){const r=this.room,g=r.game,l=g.level;
 if(this.state==='escape'){if(g.time>=this.deadline){r.state='wipe';this.tell('SIGNAL COLLAPSE / RETRY THE RAID CHECKPOINT');}return;}
 if(this.phase===1&&l.enemies.filter(e=>e.raidRole==='pylon').every(e=>e.dead))this.transition(2);
 const door=l.doors['14,13'];if(this.phase===2){if(this.partitionPending&&r.live().some(a=>Math.hypot(a.player.x-14.5,a.player.y-13.5)<1.15))door.target=1;else{this.partitionPending=false;door.target=0;}}
 if(g.time>=this.waveAt){this.spawnWave();this.waveAt=g.time+14;}
 if(g.time>=this.attackAt){if(!this.pendingAttack){this.pendingAttack=g.time+1;this.core.tell=1;this.tell('DEMIURGE PRIME / ATTACK CHARGING');}else if(g.time>=this.pendingAttack){this.attack();this.pendingAttack=0;this.attackAt=g.time+2.8;}}
 if(this.phase>1&&r.live().filter(a=>a.connected).length>=2){const holders=this.nodes.map(n=>{const h=this.held.get(n.id),a=h&&r.actors.get(h.id);return a?.status==='alive'&&a.connected&&a.input.use&&g.time-h.at<.12&&distance(a.player,n)<1.25?a:null;});
  const together=holders.length===2&&holders.every(Boolean)&&holders[0].id!==holders[1].id;if(together&&(this.phase!==4||g.time>=this.nextOpen))this.progress+=dt;else this.progress=Math.max(0,this.progress-dt*2);
  const threshold=this.phase===3?2.5:1.5;if(this.progress>=threshold){if(this.phase<4)this.transition(this.phase+1);else{this.openUntil=g.time+5.5;this.nextOpen=g.time+9;this.progress=0;this.held.clear();this.tell('SQUAD IN SYNC / PRIME CORE OPEN');r.event('raidExposed');}}
 }
 l.raidNodes=this.nodes.map(n=>{const h=this.held.get(n.id),a=h&&r.actors.get(h.id);return{...n,active:!!(a?.status==='alive'&&a.connected&&a.input.use&&g.time-h.at<.12&&distance(a.player,n)<1.25)};});if(this.phase===4)this.core.exposed=Math.max(0,this.openUntil-g.time);
 }
 extract(){if(this.state!=='escape'||this.completed||this.room.state!=='playing'||this.room.game.time>=this.deadline)return false;const r=this.room,live=r.live().filter(a=>a.connected);if(live.length<2||live.some(a=>distance(a.player,r.game.level.exit)>1.8))return false;this.completed=true;r.state='ending';r.result={winner:'SQUAD',ending:'THE SIGNAL IS FREE',phases:4,escapeSeconds:r.game.time-this.escapeAt};r.event('raidComplete',{text:'The Final Frequency / all voices accounted for.'});r.dirty=true;return true;}
 snapshot(){return{phase:this.phase,state:this.state,partitionPending:this.partitionPending,progress:this.progress,openUntil:this.openUntil,nextOpen:this.nextOpen,attackAt:this.attackAt,waveAt:this.waveAt,wave:this.wave,sequence:this.sequence,phaseTimes:this.phaseTimes,completed:this.completed,escapeAt:this.escapeAt,deadline:this.deadline,pendingAttack:this.pendingAttack||0};}
 restore(s){if(!s||!Number.isInteger(s.phase)||s.phase<1||s.phase>4||!['awakening','fracture','possession','frequency','escape'].includes(s.state)||!Number.isFinite(s.progress)||s.progress<0||!Array.isArray(s.phaseTimes)||s.phaseTimes.length>4)throw Error('Invalid finale checkpoint');Object.assign(this,s);this.held=new Map();this.progress=0;}
}
