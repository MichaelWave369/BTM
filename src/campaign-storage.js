// Stable independent slots. Pit must never occupy the original v1 save key.
export const ORIGINAL_SAVE_KEY='mwave-ori-checkpoint-v1';
export const PIT_SAVE_KEY='mwave-ori-pit-checkpoint-v1';
export const saveKeyFor=game=>game.campaign==='pit'?PIT_SAVE_KEY:ORIGINAL_SAVE_KEY;
export function writeCampaignCheckpoint(storage,game){
 if(game.phiwadCustom||game.player.health<=0)return null;
 const snapshot=game.checkpoint||game.snapshot(),pit=game.campaign==='pit';
 if(pit? snapshot.version!==2||snapshot.campaign!=='pit'||snapshot.schema!=='btm.pit/1':snapshot.version!==1||snapshot.campaign)throw Error('Campaign checkpoint namespace mismatch');
 storage.setItem(saveKeyFor(game),JSON.stringify(snapshot));return snapshot;
}
