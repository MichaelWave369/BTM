// THE TROPHY ROOM / read-only, local-first presentation of existing BTM progress.
// This file never modifies a campaign, Pit, Human Ledger, gallery or LAN record.
// A local record is NOT a server-verified competitive achievement.
import {GALLERY_KEY,GALLERY_SCHEMA} from './shooting-gallery.js';
const asCount=(n,max=1e8)=>Number.isSafeInteger(n)&&n>=0&&n<=max?n:0;
const bounded=(n,max)=>Math.min(max,asCount(n));
const fmt=(n)=>asCount(n).toLocaleString('en-US');
export const TROPHY_ROOM_SCHEMA='btm.trophy-room/view-1';

export function readGalleryCard(storage){
 try{
  const raw=storage?.getItem(GALLERY_KEY);
  if(!raw||raw.length>8192)return null;
  const card=JSON.parse(raw);
  if(card?.schema!==GALLERY_SCHEMA)return null;
  const best=card.best;
  if(!best||best.drill!=='signal-60')return {
   plays:bounded(card.plays,1000000),totalHits:Math.min(bounded(card.totalHits,1e8),bounded(card.totalShots,1e8)),
   totalShots:bounded(card.totalShots,1e8),best:null
  };
  const shots=bounded(best.shots,1e8),hits=Math.min(shots,bounded(best.hits,1e8));
  return {plays:bounded(card.plays,1000000),totalHits:Math.min(bounded(card.totalHits,1e8),bounded(card.totalShots,1e8)),
   totalShots:bounded(card.totalShots,1e8),best:{
    score:bounded(best.score,1e8),shots,hits,
    accuracy:shots?Math.round(hits/shots*100):0
   }};
 }catch{return null;}
}
function medal(id,title,description,current,target){
 return Object.freeze({id,title,description,current:bounded(current,target),target,
  earned:asCount(current)>=target});
}
export function buildTrophyDossier({original=null,pit=null,archive=null,gallery=null}={}){
 const originalReady=original?.version===1&&Number.isInteger(original.levelIndex)&&
  original.levelIndex>=0&&original.levelIndex<12;
 const pitReady=pit?.version===2&&pit?.schema==='btm.pit/1'&&
  Array.isArray(pit.pitRecord)&&pit.pitRecord.length<=12;
 // Sector is a saved checkpoint reached, not proof that sector was cleared.
 const sector=originalReady?original.levelIndex+1:0;
 const rescued=originalReady?bounded(original.totalFreed,10000):0;
 const artifacts=originalReady?bounded(original.totalArtifacts,10000):0;
 const pitTrials=pitReady?pit.pitRecord.length:0;
 const archiveRecords=bounded(archive?.count,48),dossiers=bounded(archive?.unlocked?.length,3),
  cases=bounded(archive?.evidence?.length,4);
 const best=gallery?.best||null,shots=bounded(gallery?.totalShots,1e8),
  hits=Math.min(shots,bounded(gallery?.totalHits,1e8));
 const achievements=[
  medal('first-signal','FIRST SIGNAL','Recover 3 Human Ledger accounts',archiveRecords,3),
  medal('six-frequencies','SIX FREQUENCIES','Recover 6 Human Ledger accounts',archiveRecords,6),
  medal('nine-witnesses','NINE WITNESSES','Recover 9 Human Ledger accounts',archiveRecords,9),
  medal('archive-keeper','THE ARCHIVIST','Recover all 48 testimonies',archiveRecords,48),
  medal('link-the-evidence','FOLLOW THE EVIDENCE','Reconstruct a cross-sector evidence case',cases,1),
  medal('the-four-threads','FOUR THREADS','Reconstruct all four cross-sector cases',cases,4),
  medal('vault-first-hit','SIGHTS ONLINE','Land one Calibration Vault target hit',best?.hits||0,1),
  medal('vault-nine-tags','NINE CLEAN TAGS','Land 9 hits in one Calibration Vault drill',best?.hits||0,9),
  medal('pit-first','FIRST DESCENT','Complete your first Pit trial',pitTrials,1),
  medal('pit-six','THE SIXTH GATE','Complete six Pit trials',pitTrials,6),
  medal('pit-twelve','SURVIVED THE PIT','Complete all twelve Pit trials',pitTrials,12),
  medal('twelve-sector','THE FINAL SECTOR','Reach a checkpoint in Sector 12',sector,12)
 ];
 const sectorStats=originalReady?original.v2?.stats||{}:{};
 const checkpointShots=originalReady?bounded(sectorStats.shots,1e8):0,
  checkpointDamage=originalReady?bounded(Math.floor(sectorStats.damageDealt||0),1e8):0;
 return {
  schema:TROPHY_ROOM_SCHEMA,
  localOnly:true,
  verifiedMultiplayer:false,
  earned:achievements.filter(a=>a.earned).length,
  available:achievements.length,
  medals:achievements,
  panels:[
   {id:'campaign',title:'CAMPAIGN SIGNAL',subtitle:'Last saved original checkpoint',
    stats:[['SECTOR REACHED',sector?String(sector)+' / 12':'NO CHECKPOINT'],
     ['MINDS FREED',fmt(rescued)],['ARTIFACTS',fmt(artifacts)],
     ['SECTOR SHOTS AT SAVE',fmt(checkpointShots)],
     ['SECTOR DAMAGE AT SAVE',fmt(checkpointDamage)]]},
   {id:'pit',title:'PIT OF DESPAIR',subtitle:'Saved Pit trial receipts',
    stats:[['TRIALS CLEARED',pitTrials+' / 12'],
     ['LAST PIT CHECKPOINT',pitReady?String(pit.levelIndex+1)+' / 12':'NO CHECKPOINT']]},
   {id:'ledger',title:'THE HUMAN LEDGER',subtitle:'Recovered names and reconstructed testimony',
    stats:[['WITNESS ACCOUNTS',archiveRecords+' / 48'],
     ['3 / 6 / 9 DOSSIERS',dossiers+' / 3'],
     ['LINKED EVIDENCE',cases+' / 4']]},
   {id:'range',title:'CALIBRATION VAULT',subtitle:'Practice results recorded on this device',
    stats:[['BEST SCORE',best?fmt(best.score):'NOT PLAYED'],
     ['BEST ACCURACY',best?best.accuracy+'%':'—'],
     ['BEST HITS',best?fmt(best.hits):'—'],
     ['ALL LOCAL HITS',fmt(hits)+' / '+fmt(shots)],
     ['DRILLS RECORDED',fmt(bounded(gallery?.plays,1000000))]]}
  ]
 };
}
