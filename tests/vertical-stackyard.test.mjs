import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createArena} from '../src/net/arenas.js';
import {Room} from '../src/net/simulation.js';
import {NetworkView} from '../src/net/client.js';
import {controllerActions} from '../src/gamepad.js';
import {validateMessage,neutralInput,ARENAS} from '../src/net/protocol.js';
import {traceEnvironment,traceTrackedShot} from '../src/spatial.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {STACK_HEIGHT,STACK_CEILING,JUMP_IMPULSE,isVertical,
 initVerticalBody,requestVerticalJump,advanceVerticalBody,supportHeight,upperAt,verticalSight} from '../src/net/vertical-arena.js';

const stack=()=>createArena('stackyard').level;
const body=(x,y,height=0)=>initVerticalBody({x,y,a:0,health:100},height);
const tick=(level,player,count=1,dt=1/60)=>{let landed=false;for(let i=0;i<count;i++)landed=advanceVerticalBody(level,player,dt)||landed;return landed;};
function server(){
 const r=new Room({code:'STACK369',mode:'deathmatch',arena:'stackyard',capacity:2,limit:10});
 const a=r.add({id:'wave',nickname:'WAVE',token:'a'.repeat(48)}),b=r.add({id:'hunter',nickname:'HUNTER',token:'b'.repeat(48)});
 a.ready=b.ready=true;r.start(a.id);a.invulnerable=b.invulnerable=0;
 return {r,a,b};
}

test('Stackyard adds an optional playable upper footprint, ramp and upper loot without modifying legacy maps',()=>{
 assert(ARENAS.includes('stackyard'));
 const base=createArena('no-carrier').level,level=stack();
 assert.equal(base.vertical,undefined);
 assert(isVertical(level));
 assert.equal(level.vertical.schema,'btm.vertical-prototype/1');
 assert.equal(level.vertical.ceiling,STACK_CEILING);
 const upper=level.vertical.upper;
 assert((upper.x1-upper.x0)*(upper.y1-upper.y0)>=250,'upper deck must add substantial walkable area');
 assert.equal(supportHeight(level,14.5,12.5,STACK_HEIGHT),STACK_HEIGHT);
 assert.equal(supportHeight(level,14.5,12.5,0),0,'lower story still traversable at same x/y');
 assert.equal(supportHeight(level,4.0,9.5,0),0);
 assert(Math.abs(supportHeight(level,7.0,9.5,.85)-STACK_HEIGHT*.5)<.001);
 assert(level.items.some(i=>i.floorHeight===STACK_HEIGHT));
 assert.equal(base.cells.length,level.cells.length);
 const flat=buildLevelGeometry(base),vertical=buildLevelGeometry(level);
 assert(vertical.vertexCount>flat.vertexCount,'native geometry includes upper and underside tiles');
 assert.equal(flat.wallHeight,1.7*1.6);
 assert.equal(vertical.wallHeight,STACK_CEILING*1.6);
});

test('jump is a distinct, buffered finite arc with stable variable-step landing',()=>{
 const level=stack(),p=body(6.5,15.5);
 assert(requestVerticalJump(level,p));
 let apex=0,landed=false;
 for(let i=0;i<125;i++){
  landed=advanceVerticalBody(level,p,i%2?1/120:1/60)||landed;
  assert(Number.isFinite(p.height)&&Number.isFinite(p.vz));
  assert(p.height>=0&&p.height<STACK_CEILING);
  apex=Math.max(apex,p.height);
 }
 assert(apex>1.5&&apex<2.4,'strong readable Halo-like jump arc');
 assert(landed);
 assert.equal(p.height,0);assert.equal(p.grounded,true);
 assert.equal(p.supportSurface,'ground');
 assert.equal(requestVerticalJump(baseOrNull(),p),false,'flat levels do not activate this control');
});
const baseOrNull=()=>createArena('no-carrier').level;

test('ascending beneath upper deck hits the solid underside, never phases through it',()=>{
 const level=stack(),p=body(14.5,12.5);
 assert(upperAt(level,p.x,p.y));
 requestVerticalJump(level,p);
 let apex=0;for(let i=0;i<90;i++){tick(level,p);apex=Math.max(apex,p.height);}
 assert(apex<STACK_HEIGHT-1,'upper underside stops the player head');
 assert.equal(p.height,0);assert(p.grounded);
});

test('continuous authored ramp reaches upper deck, and stepping off falls without teleporting',()=>{
 const level=stack(),p=body(4.1,9.5);
 for(let x=4.2;x<10.55;x+=.1){const oldX=p.x,oldY=p.y;p.x=x;
  tick(level,p,1,1/60);
  assert(p.height>=0&&p.height<=STACK_HEIGHT+.001);
  assert(p.x>=oldX-.01,'walkable ramp must not trap forward movement');
 }
 assert(Math.abs(p.height-STACK_HEIGHT)<.05,'ramp joins true upper surface');
 assert.equal(p.supportSurface,'upper');
 const oldX=p.x,oldY=p.y;p.x=26.3;p.y=14.5;
 const before=p.height;tick(level,p);
 assert(p.height>STACK_HEIGHT-.2,'drop begins a real fall, not a one-tick teleport');
 assert.equal(p.grounded,false);
 tick(level,p,120);
 assert.equal(p.height,0);assert(p.grounded);
 // A mid-height sideways entry must not phase through the upper deck edge.
 const collision=body(9.8,14.5);collision.height=1.2;collision.grounded=false;
 const cx=collision.x;collision.x=10.1;
 advanceVerticalBody(level,collision,1/60,{oldX:cx,oldY:14.5});
 assert.equal(collision.x,cx,'upper platform side collides before feet clear the deck');
});

test('cross-floor aim sees an actual solid deck, but an exposed edge permits high-ground fire',()=>{
 const l=stack(),upper={x:14.5,y:12.5,height:STACK_HEIGHT},lower={x:14.5,y:12.5,height:0};
 assert.equal(verticalSight(l,upper,lower),false);
 assert.equal(verticalSight(l,lower,upper),false);
 const top=traceEnvironment(l,{x:14.5,y:12.5,height:STACK_HEIGHT+1},{x:0,y:0,z:-1},3);
 assert.equal(top.type,'platform');assert(Math.abs(top.height-STACK_HEIGHT)<.01);
 const under=traceEnvironment(l,{x:14.5,y:12.5,height:.7},{x:0,y:0,z:1},3);
 assert.equal(under.type,'platform');
 const shooter={x:10.3,y:15.5,height:STACK_HEIGHT},target={x:8.0,y:15.5,height:0};
 assert.equal(verticalSight(l,shooter,target),true,'clear exposed edge allows high-ground fire');
 const bad={...l,enemies:[{x:14.5,y:12.5,type:'plugged',floorHeight:0,hp:100,dead:false}]};
 const aim={origin:{x:14.5,y:12.5,height:STACK_HEIGHT+.9},direction:{x:0,y:0,z:-1}};
 assert.equal(traceTrackedShot(bad,aim,{range:5,spread:.1}).targets.length,0);
});

test('server accepts jump intent only, owns feet state, and filters shots by floor',()=>{
 const base={type:'create',nickname:'WAVE',mode:'deathmatch',arena:'stackyard',limit:10,capacity:2,bots:0};
 assert.doesNotThrow(()=>validateMessage(JSON.stringify(base)));
 for(const mode of ['coop','beast','control','extraction'])assert.throws(()=>
  validateMessage(JSON.stringify({...base,mode})));
 assert.doesNotThrow(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),actions:['jump']})));
 for(const extra of [{height:STACK_HEIGHT},{vz:999},{grounded:true},{floor:2},{supportSurface:'upper'}])
  assert.throws(()=>validateMessage(JSON.stringify({type:'input',seq:1,...neutralInput(),...extra})));
 const {r,a,b}=server();r.spawn(a,7);r.spawn(b,0);
 assert.equal(a.player.height,STACK_HEIGHT);assert.equal(b.player.height,0);
 Object.assign(a.player,{x:14.5,y:12.5,height:STACK_HEIGHT});
 Object.assign(b.player,{x:14.5,y:12.5,height:0});
 assert.equal(r.targets(a).length,0);
 assert.equal(r.targets(b).length,0);
 Object.assign(a.player,{x:10.3,y:15.5});Object.assign(b.player,{x:8,y:15.5});
 assert(r.targets(a).some(p=>p.networkId===b.id));
 assert(r.targets(b).some(p=>p.networkId===a.id));
 const world=r.snapshot(a),me=world.players.find(p=>p.id===a.id);
 assert.equal(me.height,STACK_HEIGHT);
 assert.equal(me.supportSurface,'upper');
 assert.equal(r.init().level.vertical?.schema,'btm.vertical-prototype/1');
 r.input(a,{type:'input',seq:1,...neutralInput(),actions:['jump'],angle:0});
 r.step();
 assert(a.player.height>STACK_HEIGHT,'jump progresses from the actual upper surface');
 assert.equal(r.checkpoint(),null,'no campaign saves from competitive vertical arena');
});

test('client predicts jump only in Stackyard and keeps Dash Bash / gamepad help intact elsewhere',()=>{
 const net={intent:{},actions:new Set(),action(v){this.actions.add(v);}};
 const view=new NetworkView(net);
 view.level=stack();view.mode='playing';view.inputEnabled=true;view.status='alive';
 view.player={...view.player,x:6.5,y:15.5,a:0,height:0,vz:0,grounded:true,supportSurface:'ground'};
 assert.equal(view.jump(),true);assert(net.actions.has('jump'));
 view.update(1/30,{});
 assert(view.player.height>0);
 let help=0,jumps=0;
 controllerActions({level:stack(),jump(){jumps++;}}, {actions:['help'],moveStrafe:0,moveForward:0},{help:()=>help++,fire:false});
 assert.equal(jumps,1);assert.equal(help,0);
 controllerActions({level:baseOrNull(),jump(){jumps++;}}, {actions:['help'],moveStrafe:0,moveForward:0},{help:()=>help++,fire:false});
 assert.equal(jumps,1);assert.equal(help,1);
});

test('all Stackyard interfaces are gated and share the native upper-floor geometry',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('public/bbs.html').includes('value="stackyard"'));
 assert(read('public/bbs.html').includes('id="jump-btn"'));
 assert(read('src/net/bbs.js').includes('KeyJ:()=>game.jump()'));
 assert(read('src/net/bbs.js').includes("s?.arena==='stackyard'"));
 assert(read('src/immersive-rig.js').includes('elevation'));
 assert(read('src/world-scene.js').includes('i.floorHeight'));
 assert(read('src/renderer.js').includes('paintVerticalDeck'));
 assert(read('src/level-geometry.js').includes('level.vertical'));
});
