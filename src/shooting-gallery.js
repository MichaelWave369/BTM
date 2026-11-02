// THE CALIBRATION VAULT / local-first, time-limited original BTM shooting range.
// Uses the existing Game, weapon hit testing, WebXR tracked aim and world renderer.
// Never writes original/Pit checkpoints or multiplayer rewards.
export const GALLERY_KEY='mwave-btm-gallery-best-v1';
export const GALLERY_SCHEMA='btm.gallery/1';
export const GALLERY_DURATION=60;
const LANES=Object.freeze([
 [10.5,10.5],[14.5,9.5],[18.5,10.5],
 [12.5,13.5],[16.5,13.5],[14.5,7.5]
]);
const cleanInt=(x,max=1e8)=>Number.isSafeInteger(x)&&x>=0&&x<=max?x:0;
const pct=(hits,shots)=>shots>0?Math.round(hits/shots*100):0;
export function galleryResult(gallery){
 const shots=cleanInt(gallery?.shots),hits=cleanInt(gallery?.hits);
 return {drill:'signal-60',seconds:GALLERY_DURATION,shots,hits,
  accuracy:pct(hits,shots),score:cleanInt(gallery?.score)};
}
export function storeGalleryResult(storage,result){
 const entry={drill:'signal-60',seconds:GALLERY_DURATION,
  shots:cleanInt(result?.shots),hits:cleanInt(result?.hits),
  accuracy:pct(cleanInt(result?.hits),cleanInt(result?.shots)),
  score:cleanInt(result?.score)};
 let previous={schema:GALLERY_SCHEMA,plays:0,totalShots:0,totalHits:0,best:null};
 try{
  const obj=JSON.parse(storage.getItem(GALLERY_KEY)||'null');
  if(obj?.schema===GALLERY_SCHEMA&&Number.isSafeInteger(obj.plays)&&obj.plays>=0){
   previous={schema:GALLERY_SCHEMA,plays:cleanInt(obj.plays,1000000),
    totalShots:cleanInt(obj.totalShots),totalHits:cleanInt(obj.totalHits),
    best:obj.best?.drill==='signal-60'&&cleanInt(obj.best.score)===obj.best.score
     ?{drill:'signal-60',seconds:GALLERY_DURATION,shots:cleanInt(obj.best.shots),
        hits:cleanInt(obj.best.hits),accuracy:cleanInt(obj.best.accuracy,100),
        score:cleanInt(obj.best.score)}:null};
  }
 }catch{/* Private browsing and corrupt records begin a fresh local card. */}
 const best=!previous.best||entry.score>previous.best.score||
  entry.score===previous.best.score&&entry.accuracy>previous.best.accuracy?entry:previous.best;
 const updated={schema:GALLERY_SCHEMA,plays:Math.min(1000000,previous.plays+1),
  totalShots:Math.min(1e8,previous.totalShots+entry.shots),
  totalHits:Math.min(1e8,previous.totalHits+entry.hits),best};
 try{storage.setItem(GALLERY_KEY,JSON.stringify(updated));}catch{/* no persistence available */}
 return updated;
}
function target(slot){
 const [x,y]=LANES[slot];
 return {id:'gallery-'+slot,galleryTarget:true,gallerySlot:slot,label:'PRACTICE UNIT',
  type:'enforcer',human:false,x,y,homeX:x,homeY:y,
  hp:1,maxHp:1,dead:false,state:'patrol',speed:0,damage:0,
  range:0,delay:999,cooldown:999,tell:0,stun:0,flash:0,
  pain:0,recoil:0,walk:0,pathTimer:0,phase:1};
}
export function enterGallery(game){
 // Start the real engine and then substitute a special training level.
 // Discard the ordinary level-start checkpoint event before the app sees it.
 game.start({energyMode:'legacy'});
 const level=game.level;
 for(let y=0;y<level.h;y++)for(let x=0;x<level.w;x++)
  level.cells[y][x]=x===0||y===0||x===level.w-1||y===level.h-1?1:0;
 level.doors={};level.items=[];level.captives=[];level.relays=[];
 level.key={x:14.5,y:2.5,taken:true};level.exit={x:14.5,y:2.5};
 level.props=[];level.signs=[];level.secretFound=false;level.seen.fill(true);
 level.regions=[{name:'CALIBRATION VAULT',bounds:[1,1,27,23]}];
 level.enemies=[target(0),target(1),target(2)];
 game.player.x=14.5;game.player.y=21.5;game.player.a=-Math.PI/2;
 game.player.health=100;game.player.armor=100;game.player.energy=100;
 game.player.key=true;game.weapon=1;game.unlocked=2;game.oriAuto=Infinity;
 game.levelKills=0;game.hits=0;game.shots=0;game.time=0;
 game.gallery={drill:'signal-60',duration:GALLERY_DURATION,
  score:0,shots:0,hits:0,ended:false};
 game.checkpoint=null;game.events=[];
 game.say('Calibration Vault online. Sixty seconds. Center your sights and tag the practice units. No people in those targets.','ORI',2);
 return game.gallery;
}
export function galleryShot(game){
 if(game.gallery&&!game.gallery.ended)game.gallery.shots++;
}
export function galleryHit(game,enemy,source='weapon'){
 if(!game.gallery||!enemy.galleryTarget||enemy.dead||source!=='weapon')return false;
 enemy.dead=true;enemy.respawnAt=game.time+.7;enemy.flash=.3;
 const state=game.gallery;
 state.hits++;state.score+=100;
 game.hitPulse=.16;
 game.emit('hit',{x:enemy.x,y:enemy.y,color:'#5df6ec',source:'weapon',
  damage:100,finisher:true});
 game.emit('galleryHit',{x:enemy.x,y:enemy.y,hits:state.hits,score:state.score});
 game.emit('burst',{x:enemy.x,y:enemy.y,color:'#5df6ec',count:12});
 return true;
}
export function advanceGallery(game){
 const state=game.gallery;
 if(!state||state.ended)return;
 for(const enemy of game.level.enemies){
  if(!enemy.galleryTarget||!enemy.dead||game.time<enemy.respawnAt)continue;
  const lane=(enemy.gallerySlot+3+state.hits)%LANES.length;
  const [x,y]=LANES[lane];
  enemy.x=x;enemy.y=y;enemy.homeX=x;enemy.homeY=y;
  enemy.dead=false;enemy.hp=enemy.maxHp=1;
 }
 if(game.time>=state.duration){
  state.ended=true;game.mode='complete';
  game.emit('galleryComplete',{result:galleryResult(state)});
 }
}
