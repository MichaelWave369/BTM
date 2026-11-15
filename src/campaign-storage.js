import {episodeSaveKey, EPISODE_SCHEMA} from './episodes/registry.js';

// Stable independent slots for the original, Pit, and each registered episode.
export const ORIGINAL_SAVE_KEY='mwave-ori-checkpoint-v1';
export const PIT_SAVE_KEY='mwave-ori-pit-checkpoint-v1';
export const saveKeyFor=game=>game.campaign==='episode'?episodeSaveKey(game.episode.id):game.campaign==='pit'?PIT_SAVE_KEY:ORIGINAL_SAVE_KEY;
export function writeCampaignCheckpoint(storage,game){
 if(game.gallery||game.outbreak||game.phiwadCustom||game.player.health<=0)return null;
 const snapshot=game.checkpoint||game.snapshot(),pit=game.campaign==='pit';
 if(game.level?.vertical?.soloPreview||snapshot.level?.vertical?.soloPreview)throw Error('Preview checkpoint must not overwrite the canonical save');
 if(game.campaign==='episode'){
  if(snapshot.version!==3||snapshot.campaign!=='episode'||snapshot.schema!==EPISODE_SCHEMA||
      snapshot.episodeId!==game.episode.id||snapshot.episodeRevision!==game.episode.revision||
      snapshot.stageId!==game.definition.id||snapshot.levelIndex!==game.levelIndex)
   throw Error('Episode checkpoint namespace mismatch');
 }else if(pit? snapshot.version!==2||snapshot.campaign!=='pit'||snapshot.schema!=='btm.pit/1':snapshot.version!==1||snapshot.campaign)
  throw Error('Campaign checkpoint namespace mismatch');
 storage.setItem(saveKeyFor(game),JSON.stringify(snapshot));return snapshot;
}
