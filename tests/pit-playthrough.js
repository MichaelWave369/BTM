// Verification driver: map knowledge and exact aim, all actions through Game/rig.
// Never writes HP, coordinates, objective flags, enemy state, ammo, or completion.
import {Game,angleDiff,canOccupy,distance,lineOfSight} from '../src/core.js';
import {PIT_STAGES} from '../src/pit.js';
import {hazardState} from '../src/pit-combat.js';
import {writeCampaignCheckpoint,PIT_SAVE_KEY,ORIGINAL_SAVE_KEY} from '../src/campaign-storage.js';
import {CampaignDriver} from './playthrough.js';
import {TrackedGame} from './immersive-playthrough.js';
export function pitTacticalInput(g,input={}){
 const p=g.player,aim=p.a+(input.look||0),target=g.level.enemies.filter(e=>!e.dead&&distance(p,e)<10&&lineOfSight(g.level,p,e)).sort((a,b)=>Math.abs(angleDiff(Math.atan2(a.y-p.y,a.x-p.x),aim))-Math.abs(angleDiff(Math.atan2(b.y-p.y,b.x-p.x),aim)))[0];
 input={...input};if(target?.pitBoss&&g.weapon>0&&target.exposed<=0)input.fire=false;
 const boss=g.level.enemies.find(e=>e.pitBoss&&!e.dead&&distance(p,e)<10&&lineOfSight(g.level,p,e));
 if(boss&&distance(p,boss)<1.2){const a=Math.atan2(p.y-boss.y,p.x-boss.x),f=Math.cos(aim)*Math.cos(a)+Math.sin(aim)*Math.sin(a),r=-Math.sin(aim)*Math.cos(a)+Math.cos(aim)*Math.sin(a);Object.assign(input,{forward:f>.25,back:f<-.25,right:r>.25,left:r<-.25,sprint:true});}
 if(boss?.attack==='ram'&&boss.tell>0){const side=Math.floor(g.time/3)%2?1:-1,a=boss.lockedAngle+Math.PI/2*side,dx=Math.cos(a),dy=Math.sin(a);if(canOccupy(g.level,p.x+dx*.3,p.y+dy*.3)){const f=Math.cos(aim)*dx+Math.sin(aim)*dy,r=-Math.sin(aim)*dx+Math.cos(aim)*dy;Object.assign(input,{forward:f>.25,back:f<-.25,right:r>.25,left:r<-.25,sprint:true});}}
 const dangers=g.level.hazards.filter(h=>{const s=hazardState(h,g.time);return(s.warning||s.active)&&distance(p,h)<h.radius+.48;}).concat(g.level.blasts.filter(b=>!b.hit&&distance(p,b)<b.radius+.48));
 if(dangers.length){
  let best=null;
  for(let i=0;i<16;i++){const a=i*Math.PI/8,dx=Math.cos(a),dy=Math.sin(a),x=p.x+dx*.4,y=p.y+dy*.4;if(!canOccupy(g.level,x,y))continue;const score=Math.min(...dangers.map(h=>Math.hypot(x-h.x,y-h.y)-h.radius));if(!best||score>best.score)best={dx,dy,score};}
  if(best){const f=Math.cos(aim)*best.dx+Math.sin(aim)*best.dy,r=-Math.sin(aim)*best.dx+Math.cos(aim)*best.dy;Object.assign(input,{forward:f>.25,back:f<-.25,right:r>.25,left:r<-.25,sprint:true});}
 }
 return input;
}
export class PitDriver extends CampaignDriver{
 constructor({immersive=false,stages=12,onEvent=()=>{}}={}){
  const game=immersive?new TrackedGame():new Game();game.startPit();super({game,resume:true,sectors:stages,onEvent:(e,g)=>{this.capture(e,g);onEvent(e,g);}});
  this.immersive=immersive;this.storage=new Map([[ORIGINAL_SAVE_KEY,'untouched-original-save']]);this.ledger=[];this.attacks={};this.weaknessHits={};this.reloads=0;this.hazardHits=0;this.bashes=0;this.shields=0;this.totalShots=0;this.installInput();
 }
 installInput(){const g=this.game,update=g.update.bind(g);g.update=(dt,input={})=>update(dt,g._stepping?input:pitTacticalInput(g,input));}
 capture(e,g){if(e.type==='bossAttack')this.attacks[e.boss+':'+e.attack]=(this.attacks[e.boss+':'+e.attack]||0)+1;if(e.type==='reloaded')this.reloads++;if(e.type==='hazardHit')this.hazardHits++;if(e.type==='bash')this.bashes++;if(e.type==='shield')this.shields++;if(e.type==='shot')this.totalShots++;}
 finishSector(){
  const g=this.game,boss=g.level.enemies.find(e=>e.pitBoss);if(!g.exitReady||g.mode!==(g.levelIndex===11?'ending':'complete'))throw Error('Pit extraction did not produce real progress');
  this.results.push({stage:g.levelIndex+1,name:g.definition.name,seconds:+this.elapsed.toFixed(2),distance:+this.measuredDistance.toFixed(2),shots:this.shots,pickups:this.pickups,freed:this.hosts,defeated:this.defeated,deaths:this.deaths,health:+g.player.health.toFixed(2),charge:g.player.energy,reserve:g.player.reserve,boss:boss?.pitBoss||null,bossDead:boss?boss.dead:null,bossPhases:[...this.bossPhases],relays:g.level.relays.every(r=>r.active),key:g.player.key,captives:g.level.captives.every(c=>c.freed)});
  const storage={setItem:(k,v)=>this.storage.set(k,v)};writeCampaignCheckpoint(storage,g);if(this.storage.get(ORIGINAL_SAVE_KEY)!=='untouched-original-save')throw Error('Original save overwritten');
  const snap=JSON.parse(this.storage.get(PIT_SAVE_KEY)),restored=this.immersive?new TrackedGame():new Game();restored.restore(snap,{campaign:'pit'});if(restored.player.energy!==g.player.energy||restored.player.reserve!==g.player.reserve||restored.mode!==g.mode||restored.pitRecord.length!==this.results.length)throw Error('Pit progress/save conservation failed');
  this.ledger.push({stage:g.levelIndex+1,schema:snap.schema,version:snap.version,originalUnchanged:true,restoredMode:restored.mode,charge:restored.player.energy,reserve:restored.player.reserve});
  if(this.results.length>=this.limit){this.done=true;return;}
  this.game=restored;this.installInput();this.game.next();this.enterSector();
 }
 report(){return{passed:this.done&&!this.error&&this.results.length===this.limit,error:this.error,steps:this.steps,results:this.results,saves:this.ledger,attacks:this.attacks,reloads:this.reloads,hazardHits:this.hazardHits,bashes:this.bashes,shields:this.shields,totalShots:this.totalShots,method:'Production Game movement/fire/Ori/reload/bash/shield, live enemies, timed hazards, objective interactions and exit proximity. Pit snapshots saved/restored between trials with an untouched original slot. Exact aim and map knowledge; synthetic tracked rig when immersive. No position/HP/ammo/objective/enemy writes or direct damage/complete calls. Not human difficulty or physical Quest acceptance.'};}
}
export function runPit(options={}){const d=new PitDriver(options);while(!d.done)d.tick();return d.report();}
