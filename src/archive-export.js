// Spoiler-safe local Markdown publishing. The catalog is a capability boundary:
// ledger.list() returns only actually collected records, unlocked dossiers and
// completed evidence cases. Unsolved challenge prompts and solution keys never
// enter an export. Nothing leaves the browser except by explicit user download.
export const LEDGER_EXPORT_MIME='text/markdown;charset=utf-8';
export const LEDGER_EXPORT_SCHEMA='btm.human-ledger-export/1';

function inline(text){
 // All story text is first-party fiction. Escape Markdown control characters in
 // headings so even future editable names cannot create extra export sections.
 return String(text||'').replace(/[\\`*_[\]<>]/g,'\\$&').replace(/[\r\n]+/g,' ').slice(0,220);
}
function paragraph(text){
 return String(text||'').replace(/\r\n?/g,'\n').trim().slice(0,3500);
}
export function archiveExportData(ledger){
 if(!ledger||typeof ledger.list!=='function'||!Number.isInteger(ledger.count)||ledger.count<0)
  throw Error('Invalid Human Ledger');
 const entries=ledger.list(),records=[],dossiers=[],cases=[],verified=[];
 if(!Array.isArray(entries)||entries.length>72)throw Error('Invalid recovered archive');
 for(const item of entries){
  if(!item||typeof item.id!=='string'||typeof item.title!=='string')continue;
  if(item.type==='record'){
   // Keep each record separate from story progression and any raw local data.
   records.push({id:item.id,title:item.title,subject:item.subject,kind:item.kind,
    sector:item.sector,plaque:item.plaque,text:item.text});
  }else if(item.type==='dossier'){
   (item.id.startsWith('case:')?cases:dossiers).push({
    title:item.title,subject:item.subject,kind:item.kind,text:item.text
   });
  }else if(item.type==='challenge'&&item.solved===true){
   verified.push({title:item.title,subject:item.subject,debrief:item.debrief});
  }
 }
 if(records.length!==ledger.count)throw Error('Inconsistent recovered archive');
 return {records,dossiers,cases,verified,total:ledger.total};
}
export function exportLedgerMarkdown(ledger){
 const data=archiveExportData(ledger),lines=[
  '# BREAK THE MATRIX · THE HUMAN LEDGER',
  '',
  '*Recovered witness archive · local, player-authorized export*',
  '',
  '**Recovered records:** '+data.records.length+' / '+data.total,
  '**Unsealed dossiers:** '+data.dossiers.length,
  '**Linked evidence cases:** '+data.cases.length,
  '**Verified intelligence:** '+data.verified.length,
  '',
  '> This document contains only testimony and conclusions you have unlocked.',
  '> Unfound records, sealed cases, unanswered investigations and answer keys are excluded.',
  ''
 ];
 const section=(name,items,write)=>{
  if(!items.length)return;
  lines.push('## '+name,'');
  for(const item of items){write(item);lines.push('');}
 };
 section('Recovered testimonies',data.records,item=>{
  lines.push('### '+inline(item.title),'',
   '**Witness:** '+inline(item.subject)+'  ',
   '**Archive category:** '+inline(item.kind)+'  ',
   '**Found in sector:** '+(Number.isInteger(item.sector)?String(item.sector+1).padStart(2,'0'):'unknown')+'  ',
   '',
   paragraph(item.text));
 });
 section('Unsealed dossiers',data.dossiers,item=>{
  lines.push('### '+inline(item.title),'','**Subject:** '+inline(item.subject),'',paragraph(item.text));
 });
 section('Linked evidence',data.cases,item=>{
  lines.push('### '+inline(item.title),'','**Subject:** '+inline(item.subject),'',paragraph(item.text));
 });
 section('Verified investigations',data.verified,item=>{
  lines.push('### '+inline(item.title),'','**Subject:** '+inline(item.subject),'',paragraph(item.debrief));
 });
 if(data.records.length===0)lines.push('No records recovered yet. Find a wall plaque in the campaign and press USE.','');
 lines.push('---','','*A fictional archive from BREAK THE MATRIX. This file was created on your device; it contains no personal account data, room tokens, multiplayer stats, or hidden storyline records.*','');
 const markdown=lines.join('\n');
 if(markdown.length>140000)throw Error('Archive export exceeds local size limit');
 return {
  filename:'BTM-Human-Ledger-'+String(data.records.length).padStart(2,'0')+'-of-'+data.total+'.md',
  mime:LEDGER_EXPORT_MIME,markdown,
  counts:{records:data.records.length,dossiers:data.dossiers.length,
   evidence:data.cases.length,verified:data.verified.length}
 };
}
