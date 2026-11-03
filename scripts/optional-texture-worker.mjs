// Pure source generator for opt-in HD image caches in the existing static PWA.
// This is build tooling, not a runtime dependency. No third-party art or URLs.
export const OFFLINE_TEXTURE_STYLES=Object.freeze([
 'industrial','matrix-facility','cyberpunk','horror','corporate'
]);
export const OFFLINE_TEXTURE_SURFACES=Object.freeze([
 'wall1','wall2','wall3','wall4','wall5','wall6','floor','ceiling'
]);

export function optionalTextureWorkerSource(artVersion){
 if(!/^[0-9a-f]{10}$/.test(artVersion))throw Error('Invalid original texture asset version');
 return `
// Opt-in HD materials. Separate versioned cache; never part of installation.
const HD_PREFIX='btm-hd-materials-';
const HD_CACHE=HD_PREFIX+'${artVersion}';
const HD_STYLES=${JSON.stringify(OFFLINE_TEXTURE_STYLES)};
const HD_SURFACES=${JSON.stringify(OFFLINE_TEXTURE_SURFACES)};
const HD_CHANNEL='btm-hd-materials/1';
const HD_MAX_PNG_BYTES=1024*1024;
function hdPaths(style){
 if(!HD_STYLES.includes(style))throw Error('Select one authored HD style');
 return HD_SURFACES.map(surface=>new URL('./texture-packs/'+style+'/'+surface+'.png',self.registration.scope).href);
}
function validPNG(data){
 if(data.byteLength<32||data.byteLength>HD_MAX_PNG_BYTES)return false;
 const b=new Uint8Array(data);
 return b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&
  b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10&&
  b[16]===0&&b[17]===0&&b[18]===1&&b[19]===0&&
  b[20]===0&&b[21]===0&&b[22]===1&&b[23]===0;
}
let hdBusy=false;
self.addEventListener('message',event=>{
 const m=event.data,port=event.ports?.[0];
 if(!port||m?.channel!==HD_CHANNEL)return;
 const job=(async()=>{
  const style=m.style,action=m.action,urls=hdPaths(style);
  if(!['status','save','remove'].includes(action))throw Error('Unknown offline texture action');
  if(action!=='status'&&hdBusy)throw Error('Another texture operation is running');
  if(action!=='status')hdBusy=true;
  try{
   const cache=await caches.open(HD_CACHE);
   if(action==='save'){
    const added=[];
    try{
     for(const url of urls){
      if(await cache.match(url))continue;
      // Exact local path, no redirects, no external domains, no arbitrary URL input.
      const response=await fetch(url,{redirect:'error',cache:'no-store'});
      if(!response.ok)throw Error('A texture file could not be downloaded');
      const bytes=await response.arrayBuffer();
      if(!validPNG(bytes))throw Error('Invalid or oversized 256px texture image');
      await cache.put(url,new Response(bytes,{headers:{'Content-Type':'image/png'}}));
      added.push(url);
     }
    }catch(error){
     // A failed request or quota limit may not leave a misleading partial pack.
     for(const url of added)await cache.delete(url).catch(()=>{});
     throw error;
    }
   }
   if(action==='remove')for(const url of urls)await cache.delete(url);
   let cached=0;
   for(const url of urls)if(await cache.match(url))cached++;
   return {style,action,cached,total:urls.length,ready:cached===urls.length};
  }finally{
   if(action!=='status')hdBusy=false;
  }
 })();
 event.waitUntil(job.then(value=>port.postMessage({ok:true,...value}))
  .catch(error=>port.postMessage({ok:false,error:String(error?.message||'Offline texture request failed').slice(0,120)})));
});
`;
}
