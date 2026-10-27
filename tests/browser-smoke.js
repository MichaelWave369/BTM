// Used by qa.html and Node. Exercises the production simulation without mocks.
import {Game,SECTORS,canOccupy,solidAt,lineOfSight} from '../src/core.js';
export function browserSmoke(report){
  const results=[];
  const check=(name,fn)=>{try{if(fn()===false)throw Error('Expectation failed');const r={name,pass:true};results.push(r);report?.(r);}catch(e){const r={name,pass:false,error:e.message};results.push(r);report?.(r);}};
  const g=new Game();g.start();
  check('Simulation starts in a valid first-sector spawn',()=>g.mode==='playing'&&canOccupy(g.level,g.player.x,g.player.y));
  const spawn={...g.player};
  check('WASD input changes the player position',()=>{for(let i=0;i<20;i++)g.update(.025,{forward:true});return Math.hypot(g.player.x-spawn.x,g.player.y-spawn.y)>.9;});
  check('Collision stops the player at the first closed door',()=>{for(let i=0;i<100;i++)g.update(.025,{forward:true});return g.player.y>15.1&&g.player.y<15.4&&canOccupy(g.level,g.player.x,g.player.y);});
  check('E opens the first door and movement passes through',()=>{g.interact();for(let i=0;i<60;i++)g.update(.025,{forward:true});return g.level.doors['4,14'].open>.84&&g.player.y<14;});
  check('Resonance blaster hits and liberates an approaching host',()=>{for(let i=0;i<240;i++){const e=g.level.enemies.find(e=>!e.dead&&e.human&&lineOfSight(g.level,g.player,e));if(e)g.player.a=Math.atan2(e.y-g.player.y,e.x-g.player.x);g.update(.025,{fire:!!e});}return g.totalFreed>0&&g.player.health>0;});
  check('Ori uses a scan or stun and spends companion energy',()=>{g.player.ori=100;g.oriCooldown=0;return g.oriAbility()&&g.player.ori===70;});
  check('Frequency shift toggles and drains its own energy',()=>{g.vision();g.update(.05);return g.shift&&g.player.vision<100;});
  check('Checkpoint serializes and restores into a new Game',()=>{const next=new Game();next.restore(JSON.parse(JSON.stringify(g.snapshot())));return next.totalFreed===g.totalFreed&&next.level.doors['4,14'].open>.84;});
  check('Lethal damage gives death, then retry returns to play',()=>{const h=new Game();h.start();h.damagePlayer(1000);if(h.mode!=='dead')return false;h.retry();return h.mode==='playing'&&h.player.health>0;});
  check('Three sectors progress through actual relay, key and boss gates',()=>{const h=new Game();h.start();for(let sector=0;sector<3;sector++){if(h.levelIndex!==sector)return false;for(const relay of h.level.relays){h.player.x=relay.x;h.player.y=relay.y+.65;h.interact();}h.player.x=h.level.key.x;h.player.y=h.level.key.y;h.update(.025);if(sector===2){const boss=h.level.enemies.find(e=>e.type==='warden');h.damageEnemy(boss,10000);}if(!h.complete())return false;if(sector<2)h.next();}return h.mode==='ending'&&h.unlocked===6;});
  return {results,game:g,passed:results.filter(r=>r.pass).length,total:results.length};
}
