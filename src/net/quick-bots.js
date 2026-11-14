// Optional zero-server solo-bot quickplay inside the EXISTING VRArcade session.
// The same NetworkView + offline worker that power bbs.html, but without a
// second document, WebXR session, audio engine, or persistent campaign save.
import {OfflineBotClient} from './offline-client.js';
import {NetworkView} from './client.js';

export const DEFAULT_QUICK_BOTS=Object.freeze({
 nickname:'WAVE',mode:'deathmatch',arena:'no-carrier',
 bots:3,capacity:4,limit:10
});

export class QuickBotArena {
 constructor({onReady=()=>{},onFinished=()=>{},onError=()=>{},onStatus=()=>{},makeClient=opts=>new OfflineBotClient(opts)}={}){
  this.onReady=onReady;this.onFinished=onFinished;this.onError=onError;this.onStatus=onStatus;
  this.net=makeClient({onMessage:m=>this.receive(m),onStatus});
  this.game=new NetworkView(this.net);
  this.config=null;this.ready=false;this.closed=false;this.matchEnded=false;
 }
 async start(config=DEFAULT_QUICK_BOTS){
  if(this.closed)throw Error('Arena is closed');
  this.config={...DEFAULT_QUICK_BOTS,...config};
  await this.net.connect();
  if(this.closed)return;
  // Do not allow bots to deal damage behind the loading screen. The worker
  // resumes on receipt of its first authoritative snapshot.
  this.net.hold(true);
  if(!this.net.send({type:'create',...this.config}))throw Error('Local bot match could not start');
 }
 receive(message){
  if(this.closed)return;
  if(message.type==='error'||message.type==='disconnected'){
   const detail=message.message||'Local bot worker disconnected';
   this.onError(Error(detail));return;
  }
  if(message.type==='left'){this.game.suspend();this.ready=false;return;}
  if(message.type==='world'||message.type==='snapshot'){
   this.game.accept(message);
   if(message.type!=='snapshot')return;
   if(message.state==='playing'&&!this.ready){
    this.ready=true;this.matchEnded=false;
    this.game.suspend();this.net.hold(true);this.onReady(this);
   }else if(message.state==='results'&&!this.matchEnded){
    this.matchEnded=true;this.pause();this.onFinished(this);
   }
  }
 }
 pause(){
  this.net.hold(true);this.game.suspend();
 }
 resume(){
  if(this.closed||!this.ready||this.game.netState?.state!=='playing')return false;
  this.game.resume();this.net.hold(false);return true;
 }
 replay(){
  if(this.closed||!this.ready||!this.config)return false;
  this.pause();this.ready=false;this.matchEnded=false;
  this.net.send({type:'leave'});
  this.net.hold(true);
  return this.net.send({type:'create',...this.config});
 }
 close(){
  if(this.closed)return;
  this.closed=true;this.ready=false;this.game.suspend();this.net.disconnect();
 }
}
