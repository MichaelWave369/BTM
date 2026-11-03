import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {OFFLINE_TEXTURE_STYLES,OFFLINE_TEXTURE_SURFACES,optionalTextureWorkerSource}
 from '../scripts/optional-texture-worker.mjs';
import {HD_CHANNEL,HD_SURFACE_COUNT,offlineTextureStyle,offlineTextureStatus,
 requestOfflineTextures} from '../src/texture-offline.js';

const scope='https://btm.example/game/';
function tile(){
 const bytes=Buffer.alloc(36);
 Buffer.from('89504e470d0a1a0a','hex').copy(bytes);
 bytes.writeUInt32BE(256,16);bytes.writeUInt32BE(256,20);
 return bytes;
}
function harness({failAt=-1,invalidAt=-1}={}){
 const buckets=new Map(),requests=[],handlers={};let failures=0;
 const cache=async name=>{
  if(!buckets.has(name))buckets.set(name,new Map());
  const bucket=buckets.get(name);
  return {
   match:async url=>bucket.get(url)?new Response(bucket.get(url)):undefined,
   put:async(url,response)=>{bucket.set(url,Buffer.from(await response.arrayBuffer()));},
   delete:async url=>bucket.delete(url)
  };
 };
 const self={location:{origin:'https://btm.example'},registration:{scope},
  addEventListener:(name,fn)=>handlers[name]=fn};
 const fetch=async url=>{
  requests.push(url);
  if(failAt>=0&&requests.length===failAt){failures++;throw Error('Disconnected');}
  const bytes=tile();
  if(invalidAt>=0&&requests.length===invalidAt)bytes.writeUInt32BE(512,16);
  return new Response(bytes,{status:200,headers:{'Content-Type':'image/png'}});
 };
 vm.runInNewContext(optionalTextureWorkerSource('abcdef0123'),
  {self,caches:{open:cache},fetch,Response,URL,Uint8Array},{filename:'optional-HD-worker.js'});
 async function send(style,action,channel=HD_CHANNEL){
  let reply,wait;
  handlers.message({data:{style,action,channel},
   ports:[{postMessage:value=>{reply=value;}}],
   waitUntil:promise=>{wait=promise;}});
  await wait;return reply;
 }
 return {send,buckets,requests,handlers,failures:()=>failures};
}
test('exact five original art styles and all eight surfaces are allowed, no external URL surface',()=>{
 assert.deepEqual([...OFFLINE_TEXTURE_STYLES],[
  'industrial','matrix-facility','cyberpunk','horror','corporate'
 ]);
 assert.equal(OFFLINE_TEXTURE_SURFACES.length,8);
 assert.equal(HD_SURFACE_COUNT,8);
 for(const style of OFFLINE_TEXTURE_STYLES)assert(offlineTextureStyle(style));
 for(const bad of ['auto','retro','../secrets','https://evil.example','Industrial','','__proto__',null])
  assert.equal(offlineTextureStyle(bad),false);
 assert.throws(()=>optionalTextureWorkerSource('../../oops'));
 const script=optionalTextureWorkerSource('abcdef0123');
 assert(script.includes("HD_CACHE=HD_PREFIX+'abcdef0123'"));
 assert(script.includes("cache:'no-store'"));
 assert(script.includes("redirect:'error'"));
 assert(script.includes("if(!validPNG(bytes))"));
 assert(script.includes("await cache.delete(url)"));
 assert(!script.includes('eval('));
});

test('checking cache status never downloads images; explicit save downloads only eight local known PNGs',async()=>{
 const h=harness();
 let res=await h.send('cyberpunk','status');
 assert.equal(res.ok,true);assert.equal(res.cached,0);assert.equal(res.ready,false);
 assert.equal(h.requests.length,0,'status cannot trigger network transfer');
 res=await h.send('cyberpunk','save');
 assert.equal(res.ok,true);assert.equal(res.total,8);assert.equal(res.cached,8);assert(res.ready);
 assert.equal(h.requests.length,8);
 for(const url of h.requests)assert.match(url,/^https:\/\/btm\.example\/game\/texture-packs\/cyberpunk\/(wall[1-6]|floor|ceiling)\.png$/);
 assert.equal(h.buckets.get('btm-hd-materials-abcdef0123').size,8);
 await h.send('cyberpunk','save');
 assert.equal(h.requests.length,8,'saving again is idempotent and avoids redownloads');
 assert.match(offlineTextureStatus(res),/8 OF 8 HD TILES SAVED/);
});

test('removing one style cannot delete another style or unrelated offline shell',async()=>{
 const h=harness();
 h.buckets.set('wave-ori-original-shell',new Map([['index','offline-shell']]));
 assert((await h.send('industrial','save')).ready);
 assert((await h.send('horror','save')).ready);
 assert.equal(h.buckets.get('btm-hd-materials-abcdef0123').size,16);
 const result=await h.send('industrial','remove');
 assert.equal(result.cached,0);
 assert((await h.send('horror','status')).ready);
 assert.equal(h.buckets.get('btm-hd-materials-abcdef0123').size,8);
 assert.equal(h.buckets.get('wave-ori-original-shell').get('index'),'offline-shell');
});

test('failed mid-pack download rolls back newly stored tiles, not already-saved styles',async()=>{
 const h=harness({failAt:11});
 assert((await h.send('corporate','save')).ready);
 const failed=await h.send('horror','save');
 assert.equal(failed.ok,false);
 assert.match(failed.error,/Disconnected/);
 assert.equal((await h.send('horror','status')).cached,0);
 assert.equal((await h.send('corporate','status')).cached,8);
});

test('invalid image dimensions and arbitrary style paths fail before storing a pack',async()=>{
 const h=harness({invalidAt:2});
 const response=await h.send('industrial','save');
 assert.equal(response.ok,false);
 assert.match(response.error,/Invalid or oversized/);
 assert.equal((await h.send('industrial','status')).cached,0);
 const before=h.requests.length;
 for(const value of ['../../admin','https://other.example','retro']){
  const denied=await h.send(value,'save');
  assert.equal(denied.ok,false);
 }
 assert.equal(h.requests.length,before);
 assert.equal((await h.send('corporate','malicious')).ok,false);
});

test('page client requires known style, explicit action and authenticated structured worker response',async()=>{
 const calls=[];
 const serviceWorker={ready:Promise.resolve({active:{
  postMessage(message,ports){
   calls.push(message);
   const answer={ok:true,style:message.style,action:message.action,
    cached:message.action==='save'?8:0,total:8,ready:message.action==='save'};
   queueMicrotask(()=>ports[0].onmessage?.({data:answer}));
  }
 }})};
 const factory=()=>{
  const port={onmessage:null,close(){},};
  return {port1:port,port2:port};
 };
 assert.equal((await requestOfflineTextures('save','horror',serviceWorker,factory)).ready,true);
 assert.equal(calls[0].channel,HD_CHANNEL);
 await assert.rejects(()=>requestOfflineTextures('save','../index.html',serviceWorker,factory),/Choose/);
 await assert.rejects(()=>requestOfflineTextures('erase','horror',serviceWorker,factory),/Invalid/);
 assert.equal(calls.length,1);
 assert.match(offlineTextureStatus(null),/Choose one/);
});

test('Picture settings and generated service-worker source preserve the original offline shell contract',()=>{
 const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const build=file('scripts/build.mjs'),ui=file('index.html'),main=file('src/main.js');
 assert(build.includes('optionalTextureWorkerSource(hdVersion)'));
 assert(build.includes("k.startsWith('btm-hd-materials-')"));
 assert(!build.includes("cacheFiles.push('./texture-packs/cyberpunk/"));
 assert(build.includes("'./src/texture-offline.js'"));
 assert(ui.includes('id="save-hd-style"')&&ui.includes('id="remove-hd-style"'));
 assert(ui.includes('id="hd-offline-status"')&&ui.includes('aria-live="polite"'));
 assert(main.includes('manageOfflineTextures('));
 assert(main.includes("requestOfflineTextures('status',style)"));
 assert(main.includes("$('textureStyle').addEventListener('input'"));
});
