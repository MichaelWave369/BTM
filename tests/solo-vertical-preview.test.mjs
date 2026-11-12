import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,moveBody,SECTORS} from '../src/core.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {traceEnvironment} from '../src/spatial.js';
import {initVerticalBody,advanceVerticalBody,requestVerticalJump,STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {isSoloPreview,SOLO_MEZZANINE,validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

test('Sector 01 mezzanine is opt-in; other eleven stages, Pit and canonical levels remain flat',()=>{
 const baseline=createLevel(0);
 assert.equal(baseline.vertical,undefined);
 for(let i=1;i<12;i++)assert.equal(createLevel(i,'original',{verticalPreview:true}).vertical,undefined);
 assert.equal(createLevel(0,'pit',{verticalPreview:true}).vertical,undefined);
 const live=createLevel(0,'original',{verticalPreview:true});
 assert(isSoloPreview(live));assert.equal(live.vertical.ceiling,3.9);
 assert.deepEqual(live.cells,baseline.cells,'preview adds geometry without destroying the original ground layout');
 assert.deepEqual(live.doors,baseline.doors);
 assert.equal(live.relays.length,baseline.relays.length);
 assert.deepEqual(live.key,baseline.key);assert.deepEqual(live.exit,baseline.exit);
 assert.equal(live.items.length,baseline.items.length+1);
 const upstairs=live.items.find(item=>item.bonusUpper);
 assert(upstairs&&upstairs.floorHeight===STACK_HEIGHT);
 assert.equal(SECTORS[0].spawn.x,4.5);
});
test('physical ramp and upper deck support real movement, underside blocks below-deck bullets',()=>{
 const level=createLevel(0,'original',{verticalPreview:true});
 const p=initVerticalBody({x:9.5,y:21.5},0);
 for(let i=0;i<120;i++){
  const oldX=p.x,oldY=p.y;moveBody(level,p,.05,0);
  advanceVerticalBody(level,p,1/60,{oldX,oldY});
 }
 assert(p.x>14.5&&p.x<17.5,`ramp traverse x=${p.x.toFixed(3)} feet=${p.height.toFixed(3)} grounded=${p.grounded} surface=${p.supportSurface}`);
 assert(Math.abs(p.height-STACK_HEIGHT)<.05, 'a real continuous ramp reaches the upper floor');
 assert.equal(p.supportSurface,'upper');
 const above=traceEnvironment(level,{x:16.5,y:20.5,height:3.0},{x:0,y:0,z:-1},3);
 assert.equal(above.type,'platform');
 const below=traceEnvironment(level,{x:16.5,y:20.5,height:.8},{x:0,y:0,z:1},3);
 assert.equal(below.type,'platform');
 const native=buildLevelGeometry(level),flat=buildLevelGeometry(createLevel(0));
 assert(native.vertexCount>flat.vertexCount);
 assert.equal(native.wallHeight,SOLO_MEZZANINE.ceiling*1.6);
});
test('solo Game can jump in the preview and collect only floor-matching pickups',()=>{
 const g=new Game();g.start({verticalPreview:true});assert(g.level.vertical?.soloPreview);
 assert(g.jump());
 g.update(1/60,{});assert(g.player.height>0);
 const upstairs=g.level.items.find(i=>i.bonusUpper);
 g.player.x=upstairs.x;g.player.y=upstairs.y;g.player.height=0;
 g.player.vz=0;g.player.grounded=true;g.player.reserve=0;
 g.update(1/60,{});assert.equal(upstairs.taken,false,'no collecting through the deck');
 g.player.height=STACK_HEIGHT;g.player.supportSurface='upper';
 g.update(1/60,{});assert.equal(upstairs.taken,true);assert(g.player.reserve>0);
});
test('solo vertical shots cannot phase through the platform from either story',()=>{
 const g=new Game();g.start({verticalPreview:true});
 const make=(x,height,vh)=>({x,y:20.5,height,vh,a:0,speed:0,life:2,
  damage:12,enemy:false,color:'#5df6ec',r:.12});
 g.level.enemies=[];g.projectiles=[make(16.5,2.4,-9)];
 g.updateProjectiles(.2);assert.equal(g.projectiles.length,0,'downward shot strikes upper deck');
 g.projectiles=[make(16.5,.8,9)];
 g.updateProjectiles(.2);assert.equal(g.projectiles.length,0,'upward shot strikes deck underside');
 g.projectiles=[make(10.5,2.4,-9)];
 g.updateProjectiles(.2);assert.equal(g.projectiles.length,1,'clear uncovered lane remains free');
});
test('normal saves are untouched by preview; in-memory retry supports validated vertical state',()=>{
 const g=new Game();g.start({verticalPreview:true});
 const saved=[];const storage={setItem:(k,v)=>saved.push([k,v])};
 assert.throws(()=>writeCampaignCheckpoint(storage,g),/Preview/i);
 assert.equal(saved.length,0);
 g.player.x=15.5;g.player.y=21.5;g.player.height=STACK_HEIGHT;
 g.player.grounded=true;g.player.supportSurface='upper';g.saveCheckpoint();
 const snap=g.snapshot(),next=new Game();
 assert(validSoloPreviewCheckpoint(snap.level,snap.player));
 next.restore(snap);assert(isSoloPreview(next.level));
 assert.equal(next.player.height,STACK_HEIGHT);
 snap.player.vz=999;
 assert.throws(()=>new Game().restore(snap),/checkpoint/i);
 const flat=new Game();flat.start();assert.equal(flat.verticalPreview,false);
 assert.doesNotThrow(()=>writeCampaignCheckpoint(storage,flat));assert.equal(saved.length,1);
});
