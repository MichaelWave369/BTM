import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,WEAPONS} from '../src/core.js';
import {enterGallery} from '../src/shooting-gallery.js';
import {previewTrackedShot} from '../src/aim-diagnostics.js';
import {stepImmersive} from '../src/immersive-play.js';
import {transformPoint} from '../src/immersive-math.js';
import {WORLD_SCALE} from '../src/spatial.js';
import {NetworkClient,NetworkView} from '../src/net/client.js';
import {fixture} from './immersive-checks.js';

function vault(){
 const g=new Game();enterGallery(g);
 return {g,aim:{origin:{x:14.5,y:21.5,height:.8},direction:{x:0,y:-1,z:0}}};
}
test('VR diagnostic ray agrees with a real tracked blaster hit in the Calibration Vault',()=>{
 const {g,aim}=vault(),before=JSON.stringify(g.level.enemies);
 const preview=previewTrackedShot(g.level,aim,WEAPONS[1]);
 assert(preview&&preview.target&&preview.kind==='target');
 assert(preview.rayEnd.every(Number.isFinite));
 assert(preview.targetMarker.every(Number.isFinite));
 assert(Math.abs(preview.from[0]-14.5*1.6)<.00001);
 assert.equal(JSON.stringify(g.level.enemies),before,'preview cannot deal damage');
 assert(g.setCombatPose({head:{x:14.5,y:21.5,height:1.7},aim}));
 assert.equal(g.shoot(),true);
 assert.equal(g.gallery.hits,1,'existing gameplay must actually hit the predicted target');
});
test('solid wall occludes predicted targets without changing real combat state',()=>{
 const {g,aim}=vault();g.level.cells[15][14]=1;
 const before=JSON.stringify(g.level.enemies),p=previewTrackedShot(g.level,aim,WEAPONS[1]);
 assert(p&&!p.target);assert.equal(p.kind,'wall');assert.equal(p.targetMarker,null);
 assert.equal(JSON.stringify(g.level.enemies),before);
 assert(g.setCombatPose({head:{x:14.5,y:21.5,height:1.7},aim}));
 g.shoot();assert.equal(g.gallery.hits,0);
});
test('vertical miss, zero ray and missing inputs never produce a false target',()=>{
 const {g,aim}=vault();const tilted={...aim,direction:{x:0,y:-1,z:.55}};
 const miss=previewTrackedShot(g.level,tilted,WEAPONS[1]);assert(miss&&!miss.target);
 assert.equal(previewTrackedShot(g.level,{...aim,direction:{x:0,y:0,z:0}},WEAPONS[1]),null);
 assert.equal(previewTrackedShot(null,aim,WEAPONS[1]),null);
 assert.equal(previewTrackedShot(g.level,aim,null),null);
});
test('preview honors aim clipping metadata and does not move the tracked origin',()=>{
 const {g,aim}=vault(),clipped={...aim,clipped:true},copy=JSON.stringify(clipped);
 assert.equal(previewTrackedShot(g.level,clipped,WEAPONS[1]).clipped,true);
 assert.equal(JSON.stringify(clipped),copy);
});

test('the actual tracked beam stays on the guide when weapon spread accepts an off-axis target',()=>{
 const {g,aim}=vault();
 g.level.enemies=[{...g.level.enemies[0],x:aim.origin.x+.45,y:aim.origin.y-8}];
 const preview=previewTrackedShot(g.level,aim,WEAPONS[1]);
 assert(preview?.target);
 assert(g.setCombatPose({head:{x:14.5,y:21.5,height:1.1},aim}));
 assert(g.shoot());
 assert.equal(g.gallery.hits,1);
 const {to}=g.events.find(e=>e.type==='beam');
 assert.deepEqual([to.x,to.height,to.y].map(n=>n*WORLD_SCALE),preview.rayEnd);
 assert.notDeepEqual(preview.rayEnd,preview.targetMarker);
 assert(Math.abs(preview.targetOffsetMeters-.72)<1e-6);
});

test('Wake-Up Slap fires from the modeled palm emitter',()=>{
 const {g,rig,pose,pad}=fixture();
 g.selectWeapon(0);
 rig.prepare(g,pose,pad,{},.025);
 const {origin}=rig.aim;
 const emitter=transformPoint([],rig.weaponWorld,0,.048,-.035);
 assert(Math.hypot(emitter[0]-origin.x*WORLD_SCALE,emitter[1]-origin.height*WORLD_SCALE,
  emitter[2]-origin.y*WORLD_SCALE)<1e-5);
});

test('BBS sends the same tracked muzzle offset that it presents after moving',()=>{
 const {rig,pose,pad}=fixture();
 const net=new NetworkClient(),game=new NetworkView(net);
 game.start();game.resume();game.status='alive';pad.moveForward=1;
 const oldY=game.player.y;
 stepImmersive(game,{rig,pose},pad,{},.05);
 assert(game.player.y<oldY);
 const {origin}=rig.aim;
 assert(Math.abs(net.intent.aim.x-(origin.x-game.player.x))<1e-5);
 assert(Math.abs(net.intent.aim.y-(origin.y-game.player.y))<1e-5);
 assert(Math.abs(net.intent.aim.height-origin.height)<1e-5);
});

for(const [band,tiles] of [['near',1],['mid',5],['far',12]]){
 test(`tracked ${band} calibration at ${(tiles*WORLD_SCALE).toFixed(1)} m checks all six weapons`,()=>{
  for(const [weapon,definition] of WEAPONS.entries()){
   // Use the open Vault floor with ordinary weapon and damage rules.
   const {g,rig,pose,pad}=fixture();enterGallery(g);g.gallery=null;g.unlocked=6;
   assert(g.selectWeapon(weapon),definition.name);
   rig.prepare(g,pose,pad,{},.025);
   const {origin,direction}=rig.aim;
   const target={...g.level.enemies[0],hp:500,maxHp:500,x:origin.x+direction.x*tiles,y:origin.y+direction.y*tiles};
   g.level.enemies=[target];
   const preview=weapon===3?null:previewTrackedShot(g.level,rig.aim,definition);
   assert(g.shoot(),definition.name);
   if(weapon===3){
    const projectile=g.projectiles[0];
    assert.deepEqual([projectile.x,projectile.y,projectile.height],[origin.x,origin.y,origin.height]);
    assert.equal(g.hits,0,'pulse rifle takes time to reach the target');
    for(let elapsed=0;elapsed<2;elapsed+=.025)g.updateProjectiles(.025);
   }else{
    assert.equal(preview.target,tiles<=definition.range,definition.name);
   }
   assert.equal(g.hits,Number(tiles<=definition.range),definition.name);
   assert.equal(target.hp<500,tiles<=definition.range,definition.name);
  }
 });
}

test('visual hit preview is gated by VR Diagnostics and does not predict projectile weapon hits',()=>{
 const renderer=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 assert(renderer.includes("settings.vrDiagnostics&&game.mode==='playing'&&game.weapon!==3&&!rig.uiCaptured"));
 assert(renderer.includes('previewTrackedShot(l,rig.aim,WEAPONS[game.weapon])'));
 assert(renderer.includes('settings.vrAimLine&&!rig.uiCaptured'));
});
