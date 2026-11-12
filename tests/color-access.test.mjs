import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {ACCESS_COLORS,reachableWithAccess} from '../src/key-access.js';
import {doorKind,paintDoorSurface} from '../src/door-visibility.js';
import {MATERIALS} from '../src/level-geometry.js';

test('all twelve solo sectors have color keys reachable before their matching locks',()=>{
 for(let i=0;i<12;i++){
  const level=createLevel(i),items=level.items.filter(o=>o.type.startsWith('key:')),
   doors=Object.values(level.doors).filter(o=>o.lockColor);
  assert.equal(items.length,Math.min(3,1+Math.floor(i/3)),SECTORS[i].name);
  assert.equal(doors.length,items.length);
  const held=[];
  for(const item of [...items].sort((a,b)=>a.accessOrder-b.accessOrder)){
   const color=item.type.slice(4);
   assert(ACCESS_COLORS.includes(color)&&doors.some(d=>d.lockColor===color));
   const {seen}=reachableWithAccess(level,SECTORS[i].spawn,held);
   assert(seen.has(Math.floor(item.x)+','+Math.floor(item.y)),SECTORS[i].name+' '+color);
   held.push(color);
  }
 }
});
test('colored lock only opens after its matching card; gold gate stays separate',()=>{
 const game=new Game();game.start();const door=Object.values(game.level.doors).find(d=>d.lockColor);
 const near=[[0,1,-Math.PI/2],[0,-1,Math.PI/2],[1,0,Math.PI],[-1,0,0]]
  .map(([dx,dy,a])=>({x:door.x+dx+.5,y:door.y+dy+.5,a}))
  .find(p=>game.level.cells[Math.floor(p.y)]?.[Math.floor(p.x)]===0);
 assert(near);Object.assign(game.player,near);game.interact();assert.equal(door.target,0);
 game.player.keys[door.lockColor]=true;game.interact();assert.equal(door.target,1);
 assert.equal(game.player.key,false);
});
test('color cards persist in v1 saves and old saves without a keyring still restore',()=>{
 const game=new Game();game.start();const item=game.level.items.find(i=>i.type.startsWith('key:'));assert(item);
 game.player.x=item.x;game.player.y=item.y;game.update(.016);
 const color=item.type.slice(4);assert(game.player.keys[color]);assert(item.taken);
 const snapshot=JSON.parse(JSON.stringify(game.snapshot())),restored=new Game();restored.restore(snapshot);
 assert.equal(snapshot.version,1);assert(restored.player.keys[color]);
 assert(restored.level.items.find(i=>i.id===item.id).taken);
 const old=new Game();old.start();const legacy=old.snapshot();
 delete legacy.player.keys;for(const d of Object.values(legacy.level.doors))delete d.lockColor;
 legacy.level.items=legacy.level.items.filter(i=>!i.type.startsWith('key:'));
 assert.doesNotThrow(()=>old.restore(legacy));assert.deepEqual(old.player.keys,{});
});
test('color key sprites have atlas slots and classic door art accepts color kinds',()=>{
 for(const color of ACCESS_COLORS){
  assert(MATERIALS.includes('item:key:'+color));
  assert.equal(doorKind(4,false,color),'locked-'+color);
  const calls=[],g={fillStyle:'',strokeStyle:'',lineWidth:1,fillRect(){calls.push(this.fillStyle)},strokeRect(){calls.push(this.strokeStyle)}};
  assert.equal(paintDoorSurface(g,'locked-'+color,{index:0}),true);assert(calls.length>5);
 }
 assert.equal(doorKind(4),'standard');assert.equal(doorKind(5),'locked');
});
