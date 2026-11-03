// BTM optional high-resolution offline cache client. All image URLs are
// assembled only inside the trusted same-origin service worker. No gameplay,
// save, WebSocket, device identity, or analytics traffic is involved.
import {AUTHORED_TEXTURE_MANIFESTS} from './texture-packs.js';

export const HD_CHANNEL='btm-hd-materials/1';
export const HD_SURFACE_COUNT=8;
export function offlineTextureStyle(style){
 return typeof style==='string'&&Object.hasOwn(AUTHORED_TEXTURE_MANIFESTS,style);
}
export function offlineTextureStatus(result){
 if(!result||!offlineTextureStyle(result.style))return 'Choose one enhanced material style to manage its offline images.';
 if(result.ready)return result.style.toUpperCase().replaceAll('-',' ')+' / 8 OF 8 HD TILES SAVED OFFLINE';
 if(result.cached>0)return result.style.toUpperCase().replaceAll('-',' ')+' / '+result.cached+' OF 8 TILES SAVED';
 return result.style.toUpperCase().replaceAll('-',' ')+' / HD TILES NOT SAVED · PROCEDURAL FALLBACK AVAILABLE';
}
export async function requestOfflineTextures(action,style,sw=navigator.serviceWorker,channelFactory=()=>new MessageChannel()){
 if(!offlineTextureStyle(style))throw Error('Choose Industrial, Cyberpunk, Horror, Corporate, or Matrix Facility.');
 if(!['status','save','remove'].includes(action))throw Error('Invalid offline material action');
 if(!sw||!('ready'in sw))throw Error('Offline caching is unavailable in this browser');
 const registration=await sw.ready;
 const worker=registration?.active||sw.controller;
 if(!worker)throw Error('The offline service worker is not active');
 const channel=channelFactory();
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,value)=>{
   if(settled)return;
   settled=true;clearTimeout(timeout);
   channel.port1.close?.();channel.port2.close?.();
   if(error)reject(error);else resolve(value);
  };
  const timeout=setTimeout(()=>finish(new Error('Offline texture operation timed out')),25000);
  channel.port1.onmessage=event=>{
   const value=event.data;
   if(!value||value.ok!==true){
    finish(new Error(value?.error||'Offline texture request failed'));
    return;
   }
   if(value.style!==style||value.action!==action||value.total!==HD_SURFACE_COUNT||
    !Number.isInteger(value.cached)||value.cached<0||value.cached>HD_SURFACE_COUNT){
    finish(new Error('Invalid response from the texture cache worker'));return;
   }
   finish(null,value);
  };
  try{worker.postMessage({channel:HD_CHANNEL,action,style},[channel.port2]);}
  catch(error){finish(error);}
 });
}
