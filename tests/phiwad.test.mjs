import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,SECTORS,canOccupy} from '../src/core.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {encodePack,hexCRC} from '../src/phi-content/phipack/core.js';
import {loadMissionPack} from '../src/phi-content/phiwad/mission.js';
import {enterPhiWadMission,leavePhiWadMission} from '../src/phi-content/runtime.js';

function samplePack(){
  const width=9,height=9;
  const walls=Array.from({length:width*height},(_,i)=>i<width||i>=width*(height-1)||i%width===0||i%width===width-1?1:0);
  const level={
    format:'phi369.raycaster-level.v0.1',id:'code-brown-001',title:'CODE BROWN: Signal Breakout',
    width,height,walls,spawn:{x:2.5,y:2.5,angle:0},exits:[],
    mission:{
      profile:'michael-ori.relay-mission.v0.1',
      relays:[{x:4.5,y:2.5},{x:6.5,y:3.5}],
      key:{x:3.5,y:5.5},exit:{x:6.5,y:6.5},
      enemies:[{type:'repeater',x:5.5,y:5.5}],
      items:[{type:'health',x:3.5,y:3.5}],captives:[{x:5.5,y:3.5}]
    }
  };
  const bytes=new TextEncoder().encode(JSON.stringify(level));
  const entry='levels/main.raycaster.json';
  const manifest={
    format:'phipack',formatVersion:'0.1.0',id:'phi369.code-brown-001',
    title:level.title,kind:'level',profile:level.format,entry,
    assets:[{path:entry,mediaType:'application/json',size:bytes.length,crc32:hexCRC(bytes)}],
    rights:{license:'MIT',redistributionAllowed:true}
  };
  return encodePack(manifest,{[entry]:bytes});
}

test('PixelForge ΦWAD mission roundtrip and compatibility',()=>{
  const {manifest,mission,level}=loadMissionPack(samplePack());
  assert.equal(manifest.profile,'phi369.raycaster-level.v0.1');
  assert.equal(mission.relays.length,2);
  assert.equal(level.width,9);
});

test('temporary mission uses original Game and immersive geometry and restores all 12 campaign sectors',()=>{
  const originals=SECTORS.slice();
  const game=new Game();
  game.start();
  const mission=enterPhiWadMission(game,samplePack());
  assert.match(mission.title,/CODE BROWN/);
  assert.equal(game.levelIndex,12);
  assert.equal(SECTORS.length,13);
  assert.equal(game.level.cells.length,25);
  assert.equal(game.level.cells[0].length,29);
  assert.ok(canOccupy(game.level,game.player.x,game.player.y));
  assert.equal(game.level.relays.length,2);
  const vr=buildLevelGeometry(game.level);
  assert.ok(vr.chunks.length>0,'immersive renderer has actual geometry');
  const initial=game.level.cells.map(r=>r.slice());
  game.level.relays[0].active=true;
  game.retry();
  assert.equal(game.level.relays[0].active,false);
  assert.deepEqual(game.level.cells,initial);
  game.update(.016,{});
  assert.equal(game.mode,'playing');
  assert.equal(leavePhiWadMission(game),true);
  assert.equal(SECTORS.length,12);
  assert.deepEqual(SECTORS,originals);
  assert.equal(game.mode,'title');
  game.start();assert.equal(game.levelIndex,0);
});

test('custom victory uses original objectives but cannot progress to sector 14',()=>{
  const game=new Game();
  enterPhiWadMission(game,samplePack());
  game.level.relays.forEach(relay=>relay.active=true);
  game.player.key=true;
  assert.equal(game.exitReady,true);
  assert.equal(game.complete(),true);
  assert.equal(game.mode,'complete');
  leavePhiWadMission(game);
  assert.equal(SECTORS.length,12);
});

test('invalid or repeated pack never destroys campaign',()=>{
  const game=new Game(),originals=SECTORS.slice();
  assert.throws(()=>enterPhiWadMission(game,new Uint8Array([1,2,3])));
  assert.equal(SECTORS.length,12);
  enterPhiWadMission(game,samplePack());
  assert.throws(()=>enterPhiWadMission(game,samplePack()),/Finish or quit/);
  leavePhiWadMission(game);
  assert.deepEqual(SECTORS,originals);
});
