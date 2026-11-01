/**
 * ΦWAD runtime bridge for Neon Signal v0.4.1.
 * A validated package becomes a temporary 13th level in the existing Game.
 * No downloaded scripts, runtime engine replacement, or campaign save writes.
 */
import {SECTORS,canOccupy} from '../core.js';
import {loadMissionPack,toMichaelOriHandoff} from './phiwad/mission.js';

const ORIGINAL_SECTORS=12;
function sectorFromHandoff(layout,title){
  const point=p=>[p.x,p.y];
  return {
    name:String(title||'CUSTOM SIGNAL').slice(0,90).toUpperCase(),
    tag:'ΦWAD / COMMUNITY MISSION',subtitle:'A new signal. Same rebellion.',
    color:'#41d9f5',wall:1,spawn:{...layout.spawn},
    rooms:[[1,1,27,23]],halls:[],doors:[],pillars:[],
    relays:layout.relays.map(point),key:point(layout.key),exit:point(layout.exit),
    enemies:layout.enemies.map(e=>[e.type,e.x,e.y]),
    items:layout.items.map(i=>[i.type,i.x,i.y]),
    captives:layout.captives.map(point),secret:[1,1],
    theme:{rooms:['CUSTOM SIGNAL'],signs:[],props:[]},
    difficulty:1,speedScale:1,damageScale:1,tactics:0
  };
}
export function enterPhiWadMission(game,bytes){
  if(game.phiwadCustom)throw Error('Finish or quit the current ΦWAD mission first');
  if(SECTORS.length!==ORIGINAL_SECTORS)throw Error('Campaign sectors changed; custom mission disabled');
  if(!(bytes instanceof Uint8Array)||bytes.length>16*1024*1024)
    throw Error('ΦWAD must be a file of at most 16 MiB');
  const {manifest,level,mission}=loadMissionPack(bytes);
  const {level:layout}=toMichaelOriHandoff(level,mission);
  if(!layout||layout.w!==29||layout.h!==25||
      !Array.isArray(layout.cells)||layout.cells.length!==25||
      layout.cells.some(row=>!Array.isArray(row)||row.length!==29||row.some(cell=>cell!==0&&cell!==1)))
    throw Error('Unsupported ΦWAD layout');
  const sector=sectorFromHandoff(layout,manifest.title);
  const previousEnergyMode=game.energyMode,previousCampaign=game.campaign;game.campaign='original';game.energyMode='legacy';
  SECTORS.push(sector);
  try{
    game.totalFreed=0;game.totalArtifacts=0;game.totalSecrets=0;
    game.campaignTime=0;game.rng=369;
    game.loadLevel(ORIGINAL_SECTORS,false);
    game.level.cells=layout.cells.map(row=>row.slice());
    game.level.seen=Array(29*25).fill(false);
    game.level.doors={};
    game.level.regions=[{bounds:[1,1,27,23],name:'CUSTOM SIGNAL'}];
    game.level.signs=[];game.level.props=[];
    game.level.secretFound=false;
    game.player.x=layout.spawn.x;game.player.y=layout.spawn.y;game.player.a=layout.spawn.a;
    if(!canOccupy(game.level,game.player.x,game.player.y))throw Error('Unsafe custom spawn');
    game.unlocked=6;game.weapon=1;
    game.phiwadCustom=Object.freeze({id:manifest.id,title:sector.name,baseCount:ORIGINAL_SECTORS,previousEnergyMode,previousCampaign});
    game.checkpoint=game.snapshot();
    game.events.length=0;
    return game.phiwadCustom;
  }catch(error){
    game.campaign=previousCampaign;if(game.campaign==='pit')game.pitRecord=[];game.energyMode=previousEnergyMode;game.phiwadCustom=null;SECTORS.pop();
    game.loadLevel(0,false);game.mode='title';game.events.length=0;
    throw error;
  }
}
export function leavePhiWadMission(game){
  if(!game.phiwadCustom)return false;
  if(SECTORS.length!==ORIGINAL_SECTORS+1||game.levelIndex!==ORIGINAL_SECTORS)
    throw Error('Cannot safely detach custom sector: campaign state changed');
  game.campaign=game.phiwadCustom.previousCampaign;if(game.campaign==='pit')game.pitRecord=[];game.energyMode=game.phiwadCustom.previousEnergyMode;game.phiwadCustom=null;
  SECTORS.pop();
  game.loadLevel(0,false);game.mode='title';game.events.length=0;
  return true;
}
