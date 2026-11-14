import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,moveBody,SECTORS} from '../src/core.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {traceEnvironment} from '../src/spatial.js';
import {initVerticalBody,advanceVerticalBody,requestVerticalJump,STACK_HEIGHT} from '../src/net/vertical-arena.js';
import {isSoloPreview,SOLO_MEZZANINE,chooseSoloMezzanine,validSoloPreviewCheckpoint} from '../src/solo-vertical.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

test('all 12 standard stages have a real optional two-story layout with ground mission geometry intact',()=>{
 for(let index=0;index<12;index++){
  const original=createLevel(index),l=createLevel(index,'original',{verticalPreview:true});
  assert.equal(original.vertical,undefined,SECTORS[index].name);
  assert(isSoloPreview(l),SECTORS[index].name);
  assert.equal(l.vertical.ceiling,3.9);
  assert.deepEqual(l.cells,original.cells,SECTORS[index].name+' grid');
  assert.deepEqual(l.doors,original.doors,SECTORS[index].name+' door states');
  assert.deepEqual(l.key,original.key,SECTORS[index].name+' gold key');
  assert.deepEqual(l.exit,original.exit,SECTORS[index].name+' exit');
  assert.deepEqual(l.relays,original.relays,SECTORS[index].name+' relay');
  assert.deepEqual(l.captives,original.captives,SECTORS[index].name+' captives');
  const {upper,ramp}=l.vertical;
  assert((upper.x1-upper.x0)*(upper.y1-upper.y0)>=9);
  assert(ramp.x1===upper.x0&&ramp.y0>=upper.y0&&ramp.y1<=upper.y1);
  assert((ramp.x1-ramp.x0)===3&&ramp.y1-ramp.y0===1,'compact single-lane three-tile ramp');
  for(const area of [upper,ramp])for(let y=area.y0;y<area.y1;y++)
   for(let x=area.x0;x<area.x1;x++)assert.equal(l.cells[y][x],0,SECTORS[index].name+' blocked at '+x+','+y);
  assert(l.items.some(i=>i.bonusUpper&&i.floorHeight===STACK_HEIGHT));
  if(index>0)assert(l.items.some(i=>i.type.startsWith('key:')&&i.floorHeight===STACK_HEIGHT),'upper key for '+SECTORS[index].name);
  assert.equal(createLevel(index,'pit',{verticalPreview:true}).vertical,undefined);
  assert(validSoloPreviewCheckpoint(l,initVerticalBody({height:0,vz:0,x:SECTORS[index].spawn.x,y:SECTORS[index].spawn.y})));
  const geometry=buildLevelGeometry(l),flat=buildLevelGeometry(original);
  assert(geometry.vertexCount>flat.vertexCount,'native two-story meshes '+SECTORS[index].name);
 }
});
test('a continuous walk from the ramp foot reaches each of the twelve upper decks',()=>{
 for(let index=0;index<12;index++){
  const level=createLevel(index,'original',{verticalPreview:true}),r=level.vertical.ramp,u=level.vertical.upper;
  const p=initVerticalBody({x:r.x0+.5,y:r.y0+.5},0);
  for(let step=0;step<260&&p.x<u.x0+.45;step++){
   const oldX=p.x,oldY=p.y;moveBody(level,p,.035,0);
   advanceVerticalBody(level,p,1/60,{oldX,oldY});
  }
  assert(p.x>=u.x0+.4,SECTORS[index].name+' ramp stopped at '+p.x.toFixed(2));
  assert(Math.abs(p.height-STACK_HEIGHT)<.06,SECTORS[index].name+' feet '+p.height.toFixed(2));
  assert.equal(p.supportSurface,'upper');
 }
});
test('upstairs rewards and optional color cards cannot be collected from below',()=>{
 for(let index=0;index<12;index++){
  const g=new Game();g.start({verticalPreview:true});if(index>0)g.loadLevel(index,false);
  const item=g.level.items.find(o=>o.bonusUpper&&o.floorHeight===STACK_HEIGHT);
  assert(item);Object.assign(g.player,{x:item.x,y:item.y,height:0,vz:0,grounded:true});
  g.collectPlayerItems();assert.equal(item.taken,false);
  Object.assign(g.player,{height:STACK_HEIGHT,vz:0,grounded:true,supportSurface:'upper'});
  g.collectPlayerItems();assert.equal(item.taken,true);
 }
});
test('platform and jump physics block shots and heads through either side',()=>{
 const l=createLevel(0,'original',{verticalPreview:true}),p=initVerticalBody({x:16.5,y:20.5},0);
 requestVerticalJump(l,p);let highest=0;
 for(let i=0;i<90;i++){advanceVerticalBody(l,p,1/60);highest=Math.max(highest,p.height);}
 assert(highest<STACK_HEIGHT-1);assert.equal(p.height,0);
 for(const [origin,direction] of [[{x:16.5,y:20.5,height:3.0},{x:0,y:0,z:-1}],
  [{x:16.5,y:20.5,height:.8},{x:0,y:0,z:1}]]){
  const hit=traceEnvironment(l,origin,direction,3);assert.equal(hit.type,'platform');
 }
 const g=new Game();g.start({verticalPreview:true});g.level.enemies=[];
 const bullet=(height,vh)=>({x:16.5,y:20.5,height,vh,a:0,speed:0,life:2,damage:12,enemy:false,color:'#5df6ec',r:.12});
 for(const [h,vh] of [[2.4,-9],[.8,9]]){g.projectiles=[bullet(h,vh)];g.updateProjectiles(.2);assert.equal(g.projectiles.length,0);}
});
test('preview state survives in-memory stage progression but never overwrites v1 disk checkpoints',()=>{
 const g=new Game();g.start({verticalPreview:true});
 const storage={items:[],setItem(k,v){this.items.push([k,v]);}};
 assert.throws(()=>writeCampaignCheckpoint(storage,g),/Preview/i);
 const saved=g.snapshot();const restored=new Game();restored.restore(saved);
 assert(restored.verticalPreview);restored.loadLevel(1);
 assert(restored.verticalPreview&&restored.level.index===1&&restored.level.vertical);
 assert.throws(()=>writeCampaignCheckpoint(storage,restored),/Preview/i);
 assert.equal(storage.items.length,0);
 const wrong=restored.snapshot();wrong.player.vz=1000;
 assert.throws(()=>new Game().restore(wrong),/checkpoint/i);
 const flat=new Game();flat.start();assert.doesNotThrow(()=>writeCampaignCheckpoint(storage,flat));
 assert.equal(storage.items.length,1);
 assert.equal(createLevel(0).vertical,undefined);
});
