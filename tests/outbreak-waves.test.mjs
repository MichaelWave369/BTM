import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,canOccupy,reachable} from '../src/core.js';
import {initializeOutbreak,advanceOutbreak,beginOutbreakRound,spawnOutbreakInfected,
 outbreakAlive,outbreakRemaining,outbreakSpawnCells,outbreakRoundSize,outbreakSpawnInterval,OUTBREAK_VARIANTS,outbreakVariantFor,
 OUTBREAK_NAME,OUTBREAK_FIRST_SECONDS,OUTBREAK_REST_SECONDS,OUTBREAK_MAX_ACTIVE,
 OUTBREAK_MAX_ROUND_ENEMIES} from '../src/outbreak.js';

const outbreak=()=>{const game=new Game();game.startOutbreak();return game;};
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('ANTIΦ-ATOGEN is a separate, genuine offline survival run with no extraction or campaign save',()=>{
 const game=outbreak(),p=game.player,state=game.outbreak;
 assert.equal(OUTBREAK_NAME,'ANTIΦ-ATOGEN OUTBREAK');
 assert.equal(game.mode,'playing');assert.equal(game.campaign,'original');
 assert.equal(game.verticalPreview,false);
 assert.equal(game.level.outbreak,true);
 assert.equal(game.levelIndex,0);
 assert.equal(state.round,0);assert.equal(state.phase,'rest');
 assert.equal(state.timer,OUTBREAK_FIRST_SECONDS);
 assert.equal(game.level.enemies.length,0);
 assert.equal(game.level.relays.length,0);
 assert.equal(game.level.captives.length,0);
 assert.equal(game.level.items.length,0);
 assert.equal(p.health,100);assert.equal(p.armor,60);
 assert.equal(game.unlocked,6);
 assert.equal(game.exitReady,false);
 assert.equal(game.complete(),false,'there is no extraction win condition');
 assert.equal(game.checkpoint,null);
 assert.equal(game.saveCheckpoint(),false,'no disk or memory checkpoint from an outbreak');
 assert.match(game.objective,/ROUND 1 IN/);
 assert(!game.objectiveTarget.label?.includes('EXTRACTION'));
 assert.equal(game.snapshot().level.outbreak,true,'mode flag is identifiable to restore validator');
 assert.throws(()=>new Game().restore(game.snapshot()),/Outbreak.*memory-only/);
});

test('normal campaign, two-story, and Pit stay completely unaffected after playing Outbreak',()=>{
 const game=outbreak();
 game.start();
 assert.equal(game.outbreak,null);assert.equal(game.level.outbreak,undefined);
 assert.equal(game.level.enemies.length,8);
 assert(game.saveCheckpoint());
 assert.equal(game.snapshot().version,1);
 const saved=game.snapshot(),loaded=new Game();
 assert.equal(loaded.restore(saved),true);
 assert.equal(loaded.outbreak,null);
 game.startPit();
 assert.equal(game.outbreak,null);assert.equal(game.campaign,'pit');
 assert.equal(game.snapshot().version,2);
 const two=new Game();two.start({verticalPreview:true});
 assert.equal(two.outbreak,null);assert.equal(two.verticalPreview,true);
});

test('all infected spawn in reachable, non-solid cells away from the player, even with doors',()=>{
 const game=outbreak(),cells=outbreakSpawnCells(game);
 assert(cells.length>8,'some actual safe containment floor must be available');
 const visited=reachable(game.level,game.player,{doorsOpen:true});
 for(const c of cells){
  assert(visited.has(Math.floor(c.x)+','+Math.floor(c.y)));
  assert(canOccupy(game.level,c.x,c.y,.25));
  assert(Math.hypot(c.x-game.player.x,c.y-game.player.y)>=5);
 }
 beginOutbreakRound(game);
 const enemy=spawnOutbreakInfected(game);
 assert(enemy&&enemy.outbreak&&enemy.type==='plugged'&&!enemy.human);
 assert.equal(enemy.state,'pursue');
 assert.equal(enemy.range,1.05,'infected are melee pursuers, never gunmen');
 assert(enemy.hp>0&&enemy.maxHp===enemy.hp);
 assert(game.level.enemies.includes(enemy));
 assert.equal(game.outbreak.remaining,outbreakRoundSize(1)-1);
 assert.equal(outbreakRemaining(game),outbreakRoundSize(1));
 assert(game.objective.includes('INFECTED LEFT'));
});

test('infected actually chase, attack via original melee rules, and count only real kills once',()=>{
 const game=outbreak();beginOutbreakRound(game);
 const e=spawnOutbreakInfected(game),p=game.player;
 const before=game.outbreak.totalKills;
 e.state='patrol';
 game.updateEnemy(e,.01);
 assert.equal(e.state,'pursue','outbreak creatures never go back to idle patrol');
 // Drive a real hit through the existing Game.damageEnemy rules.
 game.damageEnemy(e,e.maxHp+10,0,'weapon');
 assert.equal(e.dead,true);
 assert.equal(game.outbreak.totalKills,before+1);
 game.damageEnemy(e,100,0,'weapon');
 assert.equal(game.outbreak.totalKills,before+1,'no double scoring');
 assert.equal(game.totalFreed,0,'infected should not count as freed human captives');
 assert.equal(p.health,100);
});

test('rounds use increasing waves, cap active enemies for Quest, and always advance after clearance',()=>{
 const game=outbreak();
 const rounds=[1,2,3,10,100];
 for(const round of rounds){
  const s=game.outbreak;
  game.level.enemies=[];
  s.round=round-1;s.phase='rest';s.timer=0;
  beginOutbreakRound(game);
  assert.equal(s.round,round);
  assert.equal(s.remaining,outbreakRoundSize(round));
  assert(outbreakRoundSize(round)<=OUTBREAK_MAX_ROUND_ENEMIES);
  assert(outbreakSpawnInterval(round)>=.38);
  let max=0;
  // Pretend enough game time has elapsed for the next spawn each step;
  // this is the real spawn scheduler, not a fake new-enemy count.
  for(let i=0;i<300&&s.remaining;i++){
   s.spawnClock=0;
   advanceOutbreak(game,.05);
   max=Math.max(max,outbreakAlive(game));
   assert(outbreakAlive(game)<=OUTBREAK_MAX_ACTIVE);
   if(outbreakAlive(game)>=OUTBREAK_MAX_ACTIVE)
    for(const e of game.level.enemies.filter(e=>!e.dead).slice(0,7))e.dead=true;
  }
  assert.equal(s.remaining,0,'every round can emit its full original enemy budget');
  for(const e of game.level.enemies)e.dead=true;
  game.player.health=65;game.player.armor=10;game.player.reserve=0;game.player.energy=20;
  advanceOutbreak(game,.05);
  assert.equal(s.phase,'rest');assert.equal(s.timer,OUTBREAK_REST_SECONDS);
  assert.equal(game.level.enemies.length,0,'clear corpses so endless rounds cannot leak enemy arrays');
  assert(game.player.health>65&&game.player.armor>10&&game.player.reserve>0&&game.player.energy>20);
  assert(game.objective.includes('ROUND '+(round+1)+' IN'));
 }
 assert(game.outbreak.bestRound>=100,'no hard final wave');
});

test('timer and zombies freeze during normal pause and stop after defeat',()=>{
 const game=outbreak(),state=game.outbreak;
 game.update(.05,{});
 const timer=state.timer;
 game.mode='paused';for(let i=0;i<100;i++)game.update(.05,{fire:true});
 assert.equal(state.timer,timer);
 assert.equal(game.level.enemies.length,0);
 game.mode='playing';game.update(.05,{});
 assert(state.timer<timer);
 beginOutbreakRound(game);spawnOutbreakInfected(game);
 const live=outbreakAlive(game);state.spawnClock=0;state.remaining=4;
 game.damagePlayer(1000,{x:game.player.x+1,y:game.player.y});
 assert.equal(game.mode,'dead');
 game.update(.05,{});
 assert.equal(outbreakAlive(game),live);
 assert.equal(state.remaining,4,'no new zombies after death');
 game.retry();
 assert.equal(game.outbreak.round,0);
 assert.equal(game.outbreak.totalKills,0);
 assert.equal(game.mode,'playing');
});

test('VR and Classic interfaces announce Outbreak; no networking or disk persistence',()=>{
 const main=source('src/main.js'),html=source('index.html'),world=source('src/world-scene.js'),
  classic=source('src/renderer.js'),wrist=source('src/world-ui.js');
 assert(html.includes('id="outbreak-btn"'));
 assert(main.includes("game.startOutbreak();mapOpen=false;play();"));
 assert(main.includes('if(game.outbreak){game.startOutbreak();play();return;}'));
 assert(main.includes('function saveCheckpoint(){if(game.outbreak)return;'));
 assert(main.includes('if(game.gallery||game.phiwadCustom||game.player.health<=0)return'));
 assert(main.includes("if(!game.gallery&&(game.mode==='playing'||game.mode==='paused')){if(!game.outbreak)"));
 assert(main.includes("game.outbreak?'ANTIΦ-ATOGEN / ROUND"));
 assert(wrist.includes("game.outbreak.phase==='rest'?'NEXT ROUND '"));
 assert(world.includes("OUTBREAK_TINT[e.outbreakVariant]"));
 assert(classic.includes("if(o.e?.outbreak)"));
 for(const p of ['scripts/build.mjs','scripts/verify-offline.mjs'])assert(source(p).includes("'./src/outbreak.js'"));
 const module=source('src/outbreak.js');
 assert(!/WebSocket|fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(module));
});

test('Outbreak presentation hides campaign UI and preserves transparent sprite pixels',()=>{
 const main=source('src/main.js'),html=source('index.html'),classic=source('src/renderer.js'),
  wrist=source('src/world-ui.js'),core=source('src/core.js');
 assert(main.includes("outbreak?'WAVE CLEARED':'LIBERATION'"),'outbreak should get wave progress, not liberation');
 assert(main.includes("'CONTAINMENT ZONE / ENDLESS'"),'the round header must not say Sector 01');
 assert(main.includes("!!outbreak||game.campaign==='pit'"),'campaign quick-start must never reappear in Outbreak');
 assert(main.includes("'NEAREST INFECTED / '"),'objective bearing should never fall back to WARDEN in Outbreak');
 assert(main.includes("'INFECTED '+infectedLeft+' LEFT'"),'wave status should replace empty relay/rescue/key tasks');
 assert(html.includes('id="radar-legend-objective"')&&html.includes('id="radar-legend-key"'));
 assert(classic.includes("const infectedSpriteCache=new WeakMap()"),'cache alpha-correct sprites once');
 assert(classic.includes("g.globalCompositeOperation='source-atop'"),'tint opaque pixels only');
 assert(classic.includes('if(o.e?.outbreak)sprite=tintedInfectedSprite(sprite,o.e.outbreakVariant)'));
 assert(!classic.includes("g.fillRect(xx+tell,y+lean,1,height-lean)"),'no full-height green rectangles around zombies');
 assert(classic.includes("if(game.outbreak){"),'radar has outbreak-specific markers');
 assert(wrist.includes("for(const mark of (game.outbreak?[]:soloWayfinder(game)))"),'do not show campaign routes on wrist');
 assert(wrist.includes("if(game.outbreak)for(const e of l.enemies.filter"),'show discovered infected on wrist map');
 assert(core.includes("if(!this.outbreak&&distance(p,l.exit)<1.8"),'no extraction interaction or hint in endless mode');
});

test('mutations unlock predictably in later rounds without altering first-round enemies',()=>{
 for(let i=0;i<54;i++)assert.equal(outbreakVariantFor(1,i),'shambler');
 for(let i=0;i<54;i++)assert.equal(outbreakVariantFor(2,i),'shambler');
 assert.equal(outbreakVariantFor(3,0),'shambler');
 assert.equal(outbreakVariantFor(3,3),'runner');
 assert.equal(outbreakVariantFor(4,6),'shambler');
 assert.equal(outbreakVariantFor(5,3),'runner');
 assert.equal(outbreakVariantFor(5,6),'brute');
 assert.deepEqual(Object.keys(OUTBREAK_VARIANTS),['shambler','runner','brute']);
 for(let round=1;round<=100;round++){
  const available=new Set(Array.from({length:outbreakRoundSize(round)},(_,i)=>outbreakVariantFor(round,i)));
  assert(available.has('shambler'));
  assert.equal(available.has('runner'),round>=3);
  assert.equal(available.has('brute'),round>=5);
 }
});

test('runner trades armor for speed; brute trades speed for health and damage',()=>{
 const game=outbreak(),state=game.outbreak;
 state.round=5;state.phase='active';state.remaining=outbreakRoundSize(5);
 const wave=Array.from({length:7},()=>spawnOutbreakInfected(game));
 assert(wave.every(Boolean),'seven real reachable spawn cells exist');
 const shambler=wave[0],runner=wave[3],brute=wave[6];
 assert.equal(shambler.outbreakVariant,'shambler');
 assert.equal(runner.outbreakVariant,'runner');
 assert.equal(brute.outbreakVariant,'brute');
 assert(shambler.speed<runner.speed&&brute.speed<shambler.speed);
 assert(runner.hp<shambler.hp&&brute.hp>shambler.hp);
 assert(runner.damage<shambler.damage&&brute.damage>shambler.damage);
 assert(brute.delay>shambler.delay,'brute still telegraphs rather than instantly hitting');
 assert(wave.every(e=>e.type==='plugged'&&e.range===1.05&&!e.human));
 assert.equal(state.remaining,outbreakRoundSize(5)-7);
 assert(outbreakAlive(game)<=OUTBREAK_MAX_ACTIVE);
 for(const e of wave)game.damageEnemy(e,e.maxHp+10,0,'weapon');
 assert.equal(state.totalKills,7,'mutations count as ordinary outbreak kills');
});

test('all three infected visual classes remain offline-only and distinct across Classic and Quest',()=>{
 const classic=source('src/renderer.js'),immersive=source('src/world-scene.js'),outbreak=source('src/outbreak.js');
 assert(classic.includes("variant==='runner'")&&classic.includes("variant==='brute'"));
 assert(classic.includes("g.globalCompositeOperation='source-atop'"));
 assert(classic.includes('cache.set(variant,tinted)'));
 assert(immersive.includes('shambler:[.52,1.27,.48,1]'));
 assert(immersive.includes('runner:[1.45,.52,.69,1]'));
 assert(immersive.includes('brute:[1.48,1.03,.48,1]'));
 assert(immersive.includes("e.outbreakVariant!=='shambler'"));
 assert(!/WebSocket|fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(outbreak));
});
