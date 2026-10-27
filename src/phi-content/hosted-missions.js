/**
 * First-party, static mission catalog loader for GitHub Pages.
 * Hosted JSON is treated as untrusted DATA, then validated and packed using
 * the exact same ΦPACK/ΦWAD contracts as a user-selected .phiwad file.
 * No remote JS, eval, network APIs beyond same-origin static asset retrieval.
 */
import {createMissionPack} from './phiwad/mission.js';

const MAX_HOSTED_BYTES=64*1024;
export const CODE_BROWN_URL='./missions/code-brown-signal-breakout.json';

export function buildHostedMissionPack(entry){
  if(!entry || typeof entry!=='object' || Array.isArray(entry) ||
      entry.schema!=='phi369.hosted-mission.v0.1' ||
      entry.profile!=='phi369.raycaster-level.v0.1' ||
      !/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(entry.id||'') ||
      !/^[a-z0-9][a-z0-9_-]{2,79}$/i.test(entry.levelId||'') ||
      typeof entry.title!=='string' || !entry.title.trim() || entry.title.length>160 ||
      entry.width!==29 || entry.height!==25 ||
      !Array.isArray(entry.rows) || entry.rows.length!==entry.height ||
      entry.rows.some(row=>typeof row!=='string'||row.length!==entry.width||!/^[01]+$/.test(row)) ||
      entry.rights?.redistributionAllowed!==true ||
      entry.rights?.license!=='MIT')
    throw Error('Unsupported or invalid hosted mission');
  const walls=entry.rows.flatMap(row=>[...row].map(Number));
  const level={
    format:entry.profile,
    id:entry.levelId,title:entry.title,
    width:entry.width,height:entry.height,walls,
    spawn:entry.spawn,exits:[],
    omittedFeatures:['No custom door, texture or script definitions']
  };
  return createMissionPack(level,entry.mission,{
    id:entry.id,title:entry.title,
    license:entry.rights.license,
    redistributionAllowed:entry.rights.redistributionAllowed
  });
}
export async function loadHostedMission(url=CODE_BROWN_URL,fetchAsset=fetch){
  if(url!==CODE_BROWN_URL)throw Error('Hosted mission URL not allowlisted');
  const response=await fetchAsset(url,{cache:'default'});
  if(!response.ok)throw Error('Hosted mission is unavailable ('+response.status+')');
  const contentType=response.headers?.get('content-type')||'';
  if(contentType&&!/application\/json|text\/plain|application\/octet-stream/i.test(contentType))
    throw Error('Hosted mission response is not JSON');
  const declaredLength=Number(response.headers?.get('content-length')||0);
  if(declaredLength>MAX_HOSTED_BYTES)throw Error('Hosted mission too large');
  const body=new Uint8Array(await response.arrayBuffer());
  if(body.length>MAX_HOSTED_BYTES)throw Error('Hosted mission too large');
  let raw;
  try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));}
  catch{throw Error('Hosted mission JSON invalid');}
  return buildHostedMissionPack(raw);
}
