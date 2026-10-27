import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Game,SECTORS} from '../src/core.js';
import {enterPhiWadMission,leavePhiWadMission} from '../src/phi-content/runtime.js';
import {loadMissionPack} from '../src/phi-content/phiwad/mission.js';
import {buildHostedMissionPack,loadHostedMission,CODE_BROWN_URL} from '../src/phi-content/hosted-missions.js';

const fixture=JSON.parse(readFileSync(new URL('../public/missions/code-brown-signal-breakout.json',import.meta.url),'utf8'));
const digest=s=>createHash('sha256').update(s).digest('hex');

test('hosted CODE BROWN is the exact original authored collision grid and mission',()=>{
  assert.equal(fixture.title,'CODE BROWN: Signal Breakout');
  assert.equal(fixture.width,29);assert.equal(fixture.height,25);
  assert.equal(digest(fixture.rows.join('')),
    '745a9f41cb2749bcbe33b61b4f0589dc039d0785da1bbdd7261c4b78b809f794');
  assert.equal(digest(JSON.stringify(fixture.mission)),
    '09725cc6438451c6c2ba90b39f045af01cc381ab84d2e7e744421ef7fede90cb');
  assert.equal(fixture.mission.enemies.length,9);
  assert.equal(fixture.mission.items.length,5);
  assert.equal(fixture.mission.captives.length,2);
  assert.ok(fixture.mission.enemies.some(e=>e.type==='warden'));
});
test('hosted mission is validated and packed as a normal ΦWAD, with author rights',()=>{
  const bytes=buildHostedMissionPack(fixture);
  assert.ok(bytes instanceof Uint8Array);
  const parsed=loadMissionPack(bytes);
  assert.equal(parsed.manifest.id,'phi369.code-brown-001');
  assert.equal(parsed.manifest.rights.license,'MIT');
  assert.equal(parsed.manifest.rights.redistributionAllowed,true);
  assert.equal(parsed.level.walls.length,29*25);
  assert.equal(parsed.mission.relays.length,2);
});
test('one-click flow loads existing BTM game and leaves campaign untouched',()=>{
  const originals=SECTORS.slice();
  const game=new Game();
  game.start();
  const info=enterPhiWadMission(game,buildHostedMissionPack(fixture));
  assert.match(info.title,/CODE BROWN/);
  assert.equal(SECTORS.length,13);
  assert.equal(game.levelIndex,12);
  assert.equal(game.level.enemies.length,9);
  assert.equal(game.level.items.length,5);
  assert.equal(game.level.captives.length,2);
  assert.ok(game.level.enemies.some(e=>e.type==='warden'));
  assert.equal(leavePhiWadMission(game),true);
  assert.equal(SECTORS.length,12);
  assert.deepEqual(SECTORS,originals);
  assert.equal(game.mode,'title');
});
test('loads only allowlisted same-origin hosted JSON and rejects corrupt data',async()=>{
  const response=new Response(JSON.stringify(fixture),{status:200,headers:{'content-type':'application/json'}});
  const bytes=await loadHostedMission(CODE_BROWN_URL,async url=>{
    assert.equal(url,'./missions/code-brown-signal-breakout.json');
    return response;
  });
  assert.equal(loadMissionPack(bytes).mission.enemies.length,9);
  await assert.rejects(()=>loadHostedMission('https://example.com/evil.json',async()=>response),/allowlisted/);
  await assert.rejects(()=>loadHostedMission(CODE_BROWN_URL,async()=>new Response('bad',{status:200})),/JSON invalid/);
  await assert.rejects(()=>loadHostedMission(CODE_BROWN_URL,async()=>new Response('not found',{status:404})),/unavailable/);
  await assert.rejects(()=>loadHostedMission(CODE_BROWN_URL,async()=>new Response('a'.repeat(65537),{status:200})),/too large/);
  assert.throws(()=>buildHostedMissionPack({...fixture,rows:['0']}),/invalid hosted mission/);
  assert.throws(()=>buildHostedMissionPack({...fixture,rights:{license:'CC0',redistributionAllowed:false}}),/invalid hosted mission/);
});
