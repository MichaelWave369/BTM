// NetworkView-compatible transport for the local worker. No socket or host.
import {INPUT_RATE,PROTOCOL,neutralInput,validateMessage} from './protocol.js';
import {validateOfflineArena} from './offline-bots.js';
export class OfflineBotClient{
 constructor({onMessage=()=>{},onStatus=()=>{}}={}){
  this.onMessage=onMessage;this.onStatus=onStatus;this.offlineBots=true;
  this.worker=null;this.timer=null;this.seq=0;this.id=null;this.code=null;
  this.token=null;this.address='local://bot-arena';this.bytesIn=0;this.bytesOut=0;
  this.lastSnapshot=0;this.intent=neutralInput();this.actions=new Set();
  this.connected=false;this.rtt=0;
 }
 connect(){
  this.disconnect();
  this.onStatus('BOOTING LOCAL BOT ENGINE');
  return new Promise((resolve,reject)=>{
   let worker;try{worker=new Worker(new URL('./offline-bots-worker.js',import.meta.url),{type:'module'});}
   catch(error){reject(error);return;}
   this.worker=worker;let ready=false;
   const deadline=setTimeout(()=>{if(!ready){this.disconnect();reject(Error('Local bot engine did not start'));}},10000);
   worker.onmessage=event=>{
    if(this.worker!==worker)return;
    const m=event.data;
    try{
     if(!m||typeof m.type!=='string')throw Error('Invalid local worker message');
     this.bytesIn+=JSON.stringify(m).length;
     if(m.type==='hello'){
      if(m.protocol!==PROTOCOL)throw Error('Local bot engine protocol mismatch');
      ready=true;clearTimeout(deadline);this.connected=true;
      this.onStatus('LOCAL ENGINE READY / NO SERVER REQUIRED');
      this.timer=setInterval(()=>this.flush(),1000/INPUT_RATE);
      resolve();return;
     }
     if(m.type==='welcome'){
      this.id=m.id;this.code=m.code;this.token=null;this.seq=m.seq;
      this.intent=neutralInput();this.actions.clear();
     }
     if(m.type==='left'){
      this.id=null;this.code=null;this.intent=neutralInput();this.actions.clear();
     }
     if(m.type==='snapshot')this.lastSnapshot=performance.now();
     this.onMessage(m);
    }catch(error){
     this.onStatus('LOCAL ENGINE ERROR / '+error.message);
     this.disconnect();
     if(!ready){clearTimeout(deadline);reject(error);}
    }
   };
   worker.onerror=event=>{
    const error=Error(event.message||'Local bot worker failed');
    this.onStatus('LOCAL ENGINE ERROR / '+error.message);
    this.disconnect();this.onMessage({type:'disconnected'});
    if(!ready){clearTimeout(deadline);reject(error);}
   };
  });
 }
 send(message){
  if(!this.worker||!this.connected)return false;
  try{
   if(message.type==='create')validateOfflineArena(message);
   else validateMessage(JSON.stringify(message));
   const data=JSON.stringify(message);
   if(data.length>4096)throw Error('Local command too large');
   this.bytesOut+=data.length;this.worker.postMessage(message);return true;
  }catch(error){this.onMessage({type:'error',message:error.message});return false;}
 }
 action(action){if(this.actions.size<8)this.actions.add(action);}
 flush(){
  if(!this.connected||!this.id)return;
  const message={type:'input',seq:++this.seq,...this.intent,actions:[...this.actions]};
  this.actions.clear();this.send(message);
 }
 neutral(){this.intent={...neutralInput(),angle:this.intent.angle,weapon:this.intent.weapon};this.actions.clear();this.flush();}
 disconnect(){
  clearInterval(this.timer);this.timer=null;
  this.worker?.terminate();this.worker=null;this.connected=false;this.id=null;this.code=null;
  this.actions.clear();this.intent=neutralInput();
 }
}
