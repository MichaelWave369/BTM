// Deterministic fixed-step arena authority inside a dedicated local Web Worker.
// Never creates WebSockets, user accounts, localStorage saves or competitive receipts.
import {createOfflineArena} from './offline-bots.js';
import {PROTOCOL,TICK_RATE,SNAPSHOT_RATE,validateMessage} from './protocol.js';
let room=null,player=null,revision=-1,acc=0,last=performance.now(),snapshotTicks=0;
const post=message=>self.postMessage(message);
function publish(){
 if(!room||!player)return;
 if(room.revision!==revision){post(room.init());revision=room.revision;}
 post(room.snapshot(player));
}
function command(message){
 if(!message||typeof message!=='object')throw Error('Invalid local command');
 if(message.type==='create'){
  if(room)throw Error('Return to setup before starting another match');
  const started=createOfflineArena(message);
  room=started.room;player=started.player;revision=-1;acc=0;
  post({type:'welcome',protocol:PROTOCOL,id:player.id,code:room.code,token:null,seq:0});
  publish();return;
 }
 // A local arena can be discarded immediately. No remote room to abandon.
 if(message.type==='leave'||message.type==='lobby'){
  room=null;player=null;revision=-1;post({type:'left'});return;
 }
 validateMessage(JSON.stringify(message));
 if(message.type==='ping'){post({type:'pong',id:message.id});return;}
 if(!room||!player)throw Error('Start a solo bot arena first');
 if(message.type==='input'){room.input(player,message);return;}
 if(message.type==='ready'||message.type==='start'){
  // Offline matches are launched in a single click. Do not accept hidden
  // online-style re-ready or start operations during a live match.
  throw Error('Use Return to Setup to create a fresh offline match');
 }
 throw Error('Unsupported command for local arena');
}
self.onmessage=event=>{try{command(event.data);}catch(error){post({type:'error',message:String(error.message).slice(0,160)});}};
setInterval(()=>{
 const now=performance.now();acc+=Math.min(.25,Math.max(0,(now-last)/1000));last=now;
 if(!room){acc=0;return;}
 try{
  let steps=0;
  while(acc>=1/TICK_RATE&&steps++<6){
   room.step(1/TICK_RATE);room.advanceIntermission(1/TICK_RATE);
   acc-=1/TICK_RATE;
   if(++snapshotTicks>=TICK_RATE/SNAPSHOT_RATE){snapshotTicks=0;publish();}
  }
  // Bound catch-up after an inactive tab so the worker never stalls forever.
  acc=Math.min(acc,2/TICK_RATE);
 }catch(error){
  post({type:'error',message:'Local arena stopped: '+String(error.message).slice(0,120)});
  room=null;player=null;revision=-1;
 }
},1000/TICK_RATE/2);
post({type:'hello',protocol:PROTOCOL,tickRate:TICK_RATE,snapshotRate:SNAPSHOT_RATE,local:true});
