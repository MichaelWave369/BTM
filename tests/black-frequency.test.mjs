import test from 'node:test';
import assert from 'node:assert/strict';
import {EPISODES} from '../src/episodes/index.js';
import {decodeEpisodeMap, episodeSaveKey} from '../src/episodes/registry.js';
import {buildLevelGeometry} from '../src/level-geometry.js';
import {textureStyleFor} from '../src/texture-packs.js';
import {createEpisodeGame, runEpisode} from './episode-playthrough.js';

const ID='black-frequency';
test('The Black Frequency registers nine distinct themed maps without modifying other episode saves', () => {
  const episode=EPISODES.get(ID);
  assert(episode, 'Episode must be in installed registry');
  assert.equal(EPISODES.list.length,3);
  assert.equal(episode.stages.length,9);
  assert.equal(episode.secretCount,9);
  assert.equal(new Set(episode.stages.map(s=>s.map.join('\n'))).size,9);
  assert(new Set(episode.stages.map(s=>s.material)).size>=5);
  assert.equal(episode.stages.filter(s=>s.vertical).length,3);
  assert.equal(episode.stages.at(-1).enemies.filter(([type])=>type==='warden').length,1);
  assert.notEqual(episodeSaveKey(ID),episodeSaveKey('buried-network'));
  assert.notEqual(episodeSaveKey(ID),episodeSaveKey('synthetic-city'));
  const g=createEpisodeGame(false);g.startEpisode(ID);
  assert.equal(g.stageCount,9);
  for(const [i,stage] of episode.stages.entries()){
    const grid=decodeEpisodeMap(stage.map);
    assert.equal(grid.w,37);assert.equal(grid.h,30);
    assert.equal(Object.values(grid.doors).filter(d=>d.type===5).length,1);
    assert.equal(Object.values(grid.doors).filter(d=>d.type===6).length,1);
    assert(stage.items.some(([type])=>type==='artifact')||stage.vertical?.items.some(([type])=>type==='artifact'));
    g.loadLevel(i,false);
    const mesh=buildLevelGeometry(g.level);
    assert(mesh.vertexCount>0,'Every stage must render');
    assert.equal(textureStyleFor(g.level,{textureStyle:'auto'}),stage.material);
    assert.equal(g.level.campaign,'episode');
    assert.equal(g.level.episodeId,ID);
    assert.equal(g.level.stageId,stage.id);
    assert.equal(!!g.level.vertical,!!stage.vertical);
    assert.equal(g.level.signs.length,2);
  }
});
for(const immersive of [false,true]){
 test(`Black Frequency: all nine stages clear with ${immersive?'simulated tracked VR':'Classic'} controls and save isolation`,()=>{
   const report=runEpisode({episodeId:ID,immersive});
   assert(report.passed,report.error||'Episode incomplete');
   assert.equal(report.results.length,9);
   for(const [i,result] of report.results.entries()){
     const stage=EPISODES.get(ID).stages[i];
     assert.equal(result.stageId,stage.id);
     assert.equal(result.mode,i===8?'ending':'complete');
     assert.equal(result.secret,true);
     assert.equal(result.goldKey,true);
     assert.equal(result.relays,stage.relays.length);
     assert.equal(result.deckArtifact,stage.vertical?true:null);
     assert(result.shots>0&&result.defeated>0);
   }
   assert.deepEqual(report.results[8].bossPhases,[1,2,3]);
   assert.equal(report.results[8].bossDead,true);
 });
}
