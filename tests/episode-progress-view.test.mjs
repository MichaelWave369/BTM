import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.js';
import {EPISODES} from '../src/episodes/index.js';
import {episodeProgress} from '../src/episodes/progress-view.js';

const checkpoint = (episodeId, stage=0) => {
  const game=new Game({episodes:EPISODES});
  game.startEpisode(episodeId);
  if(stage)game.loadLevel(stage,false);
  return game.snapshot();
};

test('progress atlas reads all four installed episodes without claiming unseen stages',()=>{
  assert.equal(EPISODES.list.length,4);
  for(const episode of EPISODES.list){
    const fresh=episodeProgress(episode,null);
    assert.equal(fresh.completed,0);
    assert.equal(fresh.total,9);
    assert.equal(fresh.valid,false);
    assert.equal(fresh.status,'NEW EPISODE');
    assert.deepEqual(fresh.markers.map(m=>m.state),['current',...Array(8).fill('locked')]);
    const started=episodeProgress(episode,checkpoint(episode.id));
    assert.equal(started.completed,0);
    assert.equal(started.valid,true);
    assert.equal(started.status,'STAGE 01 IN PROGRESS');
    assert.equal(started.next,'Resume: '+episode.stages[0].name);
  }
});

test('stage markers match valid active and cleared checkpoints, including the finale',()=>{
  for(const episode of EPISODES.list){
    const midway=checkpoint(episode.id,2);
    const inProgress=episodeProgress(episode,midway);
    assert.equal(inProgress.completed,2);
    assert.equal(inProgress.markers[1].state,'complete');
    assert.equal(inProgress.markers[2].state,'current');
    assert.equal(inProgress.next,'Resume: '+episode.stages[2].name);

    // A cleared snapshot must satisfy the real restore validator. No invented
    // progression value or separate list of completed stages is persisted.
    const cleared=structuredClone(midway);
    cleared.player.key=true;
    cleared.level.key.taken=true;
    for(const relay of cleared.level.relays)relay.active=true;
    cleared.episodeCleared=true;
    const after=episodeProgress(episode,cleared);
    assert.equal(after.valid,true);
    assert.equal(after.completed,3);
    assert.equal(after.markers[2].state,'complete');
    assert.equal(after.markers[3].state,'current');
    assert.equal(after.next,'Next: '+episode.stages[3].name);

    const finale=checkpoint(episode.id,8);
    finale.player.key=true;
    finale.level.key.taken=true;
    for(const relay of finale.level.relays)relay.active=true;
    for(const enemy of finale.level.enemies)if(enemy.type==='warden')enemy.dead=true;
    finale.episodeCleared=true;
    const finished=episodeProgress(episode,finale);
    assert.equal(finished.valid,true);
    assert.equal(finished.completed,9);
    assert.equal(finished.status,'EPISODE CLEARED');
    assert(finished.markers.every(m=>m.state==='complete'));
  }
});

test('progress atlas rejects corrupted/cross-episode saves without mutating anything',()=>{
  const episode=EPISODES.list[0];
  const valid=checkpoint(episode.id,1);
  const raw=JSON.stringify(valid);
  assert.equal(episodeProgress(episode,valid).completed,1);
  assert.equal(JSON.stringify(valid),raw);
  for(const bad of [
    {...valid,episodeId:EPISODES.list[1].id},
    {...valid,stageId:'not-a-stage'},
    {...valid,levelIndex:999},
    {...valid,episodeRevision:999},
    {player:{x:10},stageId:'malformed'},
    '{"malformed":"as text"}'
  ]){
    const copy=JSON.stringify(bad);
    const view=episodeProgress(episode,bad);
    assert.equal(view.valid,false);
    assert.equal(view.completed,0);
    assert.equal(view.status,'CHECKPOINT UNAVAILABLE');
    assert.equal(JSON.stringify(bad),copy);
  }
});
