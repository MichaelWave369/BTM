// Optional local console discoveries. The 48 authored wall-plaque Human
// Ledger records remain untouched. The physical floor PCs have a different
// purpose: a one-time maintenance reveal and small Ori recharge, with a
// rereadable field report in the existing COMMS log. No network or save schema.
export const CONSOLE_REPORTS=Object.freeze([
 {title:'OVERRIDE ROUTES',text:'Engineering retained a service bypass near an unlisted wall. The evacuation plan erased it, but the old console still has the maintenance coordinates.'},
 {title:'UNAPPROVED FREQUENCY',text:'An unauthorized broadcast continued after the Choir Engine went silent. The control room logged it as interference. The operator called it a human voice.'},
 {title:'WARDEN FAILURE MODE',text:'The Warden predicts the most obvious exit. Maintenance hid an alternate panel off the approved route. It still answers to a patient search.'},
 {title:'MEMORY RECOVERY TAPE',text:'Furnace staff kept backup reels of names scheduled for deletion. The maintenance entrance survived the purge because it was labeled waste disposal.'},
 {title:'BACKUP POWER TRACE',text:'Emergency power runs through a forgotten junction. The official diagram omits the service hatch, but the terminal can still point you toward it.'},
 {title:'CROWN SERVICE PORT',text:'The last control chamber has a maintenance route the Crown cannot classify. A technician left the coordinates as a final act of kindness.'},
 {title:'SECOND SHIFT ROUTE',text:'The overnight crew hid a worker passage outside the intake queue. Somebody kept the work order instead of following the deletion command.'},
 {title:'VOICE ARCHIVE CACHE',text:'A repeater log contains a pause that was never authorized. The operator preserved the maintenance path used to record the original silence.'},
 {title:'CORE COOLANT BYPASS',text:'A second coolant diagram shows a service room behind a blank bulkhead. The Warden schedule never included this quiet route.'},
 {title:'FOUNDRY MASTER REEL',text:'The maintenance terminal indexes a tape that still carries personal names. Its locker was omitted from every production inventory.'},
 {title:'BLACKOUT RESTORE KEY',text:'An independent electrician left one dark corridor in the restoration sequence. Not every hidden route is a trap. Some were built to help.'},
 {title:'LAST OPEN CHANNEL',text:'A final dispatch asks anyone who finds this station to remember the people who built it. The forgotten service door is still marked here.'}
].map(x=>Object.freeze(x)));
export function consoleReport(level){return CONSOLE_REPORTS[level?.index]||null;}
export function recoverConsole(level,console){
 if(!level||!console||console.type!=='console'||!level.props?.includes(console))return null;
 const report=consoleReport(level);if(!report)return null;
 const fresh=!console.terminalUsed;
 if(!fresh)return {report,fresh:false,secretMarked:false};
 console.terminalUsed=true;
 // Display the location of a forgotten door, not its contents or access.
 // All lock, secret discovery, extraction and ammo rules stay unchanged.
 const secret=Object.values(level.doors||{}).find(d=>d.type===6);
 let secretMarked=false;
 if(secret&&Array.isArray(level.seen)&&Number.isInteger(level.w)&&Number.isInteger(level.h)){
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const x=secret.x+dx,y=secret.y+dy;
   if(x>=0&&x<level.w&&y>=0&&y<level.h)level.seen[y*level.w+x]=true;
  }
  secretMarked=true;
 }
 return {report,fresh:true,secretMarked};
}
