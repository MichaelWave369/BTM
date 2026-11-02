// Local-only arena setup. This is not the WebSocket protocol or a ranked match.
import {Room} from './simulation.js';
import {MODES,ARENAS,nickname} from './protocol.js';

export const MAX_SOLO_PARTICIPANTS=12;
export const OFFLINE_ARENA_MODES=Object.freeze(MODES.filter(mode=>mode!=='coop'));

export function validateOfflineArena(config){
 if(!config||typeof config!=='object'||Array.isArray(config))throw Error('Offline arena settings required');
 const {mode,arena,limit,capacity,bots}=config;
 const handle=nickname(config.nickname);
 if(!OFFLINE_ARENA_MODES.includes(mode)||!ARENAS.includes(arena))throw Error('Unsupported offline arena or mode');
 if(!Number.isInteger(limit)||limit<1||limit>50)throw Error('Frag/round target must be between 1 and 50');
 if(!Number.isInteger(bots)||bots<1||bots>=MAX_SOLO_PARTICIPANTS)throw Error('Choose one to eleven bot pilots');
 if(!Number.isInteger(capacity)||capacity!==bots+1||capacity>MAX_SOLO_PARTICIPANTS)throw Error('Offline slots must equal you plus your bot pilots');
 return {nickname:handle,mode,arena,limit,capacity,bots};
}

export function createOfflineArena(config){
 const settings=validateOfflineArena(config);
 const room=new Room({code:'SOLOBOTS',mode:settings.mode,arena:settings.arena,
  limit:settings.limit,capacity:settings.capacity,finaleEnabled:false});
 const player=room.add({id:'local-human',nickname:settings.nickname,token:'local-only'});
 for(let n=0;n<settings.bots;n++)room.addBot('local-only');
 // Only locally spawned, explicitly marked bots count as additional actors.
 player.ready=true;
 room.start(player.id);
 return {room,player,settings};
}
