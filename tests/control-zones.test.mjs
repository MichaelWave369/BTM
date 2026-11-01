import test from 'node:test';
import assert from 'node:assert/strict';
import {createArena} from '../src/net/arenas.js';
import {Room} from '../src/net/simulation.js';
import {controlZones,controlZone,freshControlState,advanceControl,CONTROL_ROTATE_SECONDS} from '../src/net/control-zones.js';
import {neutralInput,validateMessage,MODES} from '../src/net/protocol.js';

function room(arena='no-carrier',limit=3){
 const r=new Room({code:'CONTROL7',mode:'control',arena,limit,capacity:4});
 const a=r.add({id:'a',nickname:'A',token:'a'.repeat(48)}),b=r.add({id:'b',nickname:'B',token:'b'.repeat(48)});
 a.ready=b.ready=true;r.start(a.id);
 for(const p of r.actors.values())p.invulnerable=0;
 return r;
}
function out(p){p.player.x=3.5;p.player.y=21.5;}
function at(p,z){p.player.x=z.x;p.player.y=z.y;}
test('every authored control zone is on genuine traversable arena floor',()=>{
 for(const id of ['no-carrier','sysops-revenge','kill-switch']){
  const a=createArena(id),zones=controlZones(id,a.level);assert.equal(zones.length,2);
  for(const z of zones)assert(a.level.cells[Math.floor(z.y)][Math.floor(z.x)]===0,id);
  assert.throws(()=>controlZones('invented',a.level));
 }
});
test('fixed-tick uncontested zones earn authoritative points without kill scoring',()=>{
 const r=room(),a=r.actors.get('a'),b=r.actors.get('b'),z=controlZone(r.control);
 assert(MODES.includes('control'));assert.notEqual(a.team,b.team);
 at(a,z);out(b);
 for(let i=0;i<31;i++)r.step();
 assert.equal(r.teamScore.cyan,1);assert.equal(r.teamScore.pink,0);
 assert.equal(r.snapshot(a).control.holder,'cyan');
 assert.equal(r.snapshot(a).control.zone.x,z.x);
 // PVP kills never count towards hill victory; scoring is spatial only.
 r.hurt(b,1000,a);assert.equal(r.teamScore.cyan,1);
 assert.equal(r.state,'playing');
 for(let i=0;i<65;i++)r.step();
 assert.equal(r.state,'results');assert.equal(r.result.winner,'cyan');
 assert.equal(r.result.reason,'control-limit');
});
test('enemy contest freezes capture and leaving zone cannot grant points',()=>{
 const r=room(),[a,b]=[...r.actors.values()],z=controlZone(r.control);
 at(a,z);at(b,{x:z.x+.5,y:z.y});
 for(let i=0;i<90;i++)r.step();
 assert.deepEqual(r.teamScore,{cyan:0,pink:0});
 assert(r.control.contested);assert.equal(r.control.holder,null);
 out(b);
 for(let i=0;i<32;i++)r.step();
 assert.equal(r.teamScore.cyan,1);
 out(a);for(let i=0;i<90;i++)r.step();
 assert.equal(r.teamScore.cyan,1);
});
test('dead, disconnected, invulnerable, and spoofed client positions never hold the hill',()=>{
 const r=room(),[a,b]=[...r.actors.values()],z=controlZone(r.control);
 at(a,z);out(b);a.invulnerable=r.game.time+10;
 for(let i=0;i<60;i++)r.step();assert.equal(r.teamScore.cyan,0);
 a.invulnerable=0;r.disconnect(a.id);
 for(let i=0;i<60;i++)r.step();assert.equal(r.teamScore.cyan,0);
 r.reconnect(a);a.status='dead';for(let i=0;i<60;i++)r.step();
 assert.equal(r.teamScore.cyan,0);
 assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),score:50})));
 assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),x:z.x,y:z.y})));
});
test('the zone rotates on fixed host time and does not carry old score credit',()=>{
 const level=createArena('kill-switch').level,s=freshControlState('kill-switch',level);
 const score={cyan:0,pink:0},first=controlZone(s);
 const a={team:'cyan',connected:true,status:'alive',invulnerable:0,player:{x:first.x,y:first.y}};
 for(let i=0;i<30*CONTROL_ROTATE_SECONDS-1;i++)advanceControl(s,[a],level,i/30,1/30,score,100);
 assert.equal(s.index,0);
 const result=advanceControl(s,[a],level,CONTROL_ROTATE_SECONDS,1/30,score,100);
 assert(result.rotated);assert.equal(s.index,1);assert.equal(s.holder,null);
 assert.equal(s.progress,0);
 // The old capture point no longer awards score even when occupied.
 const old=score.cyan;
 for(let i=0;i<45;i++)advanceControl(s,[a],level,CONTROL_ROTATE_SECONDS+(i+1)/30,1/30,score,100);
 assert.equal(score.cyan,old);
});
