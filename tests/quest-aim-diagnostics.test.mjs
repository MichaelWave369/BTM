import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,WEAPONS} from '../src/core.js';
import {enterGallery} from '../src/shooting-gallery.js';
import {previewTrackedShot} from '../src/aim-diagnostics.js';

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
test('visual hit preview is gated by VR Diagnostics and does not predict projectile weapon hits',()=>{
 const renderer=readFileSync(new URL('../src/world-scene.js',import.meta.url),'utf8');
 assert(renderer.includes("settings.vrDiagnostics&&game.mode==='playing'&&game.weapon!==3&&!rig.uiCaptured"));
 assert(renderer.includes('previewTrackedShot(l,rig.aim,WEAPONS[game.weapon])'));
 assert(renderer.includes('settings.vrAimLine&&!rig.uiCaptured'));
});
