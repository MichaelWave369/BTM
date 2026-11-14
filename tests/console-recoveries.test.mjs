import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,createLevel,SECTORS} from '../src/core.js';
import {ARCHIVE_RECORDS,recordForSign} from '../src/archive-ledger.js';
import {CONSOLE_REPORTS,consoleReport,recoverConsole} from '../src/console-recoveries.js';

test('12 curated PC reports do not modify the original 48 wall-readable witness records',()=>{
 assert.equal(CONSOLE_REPORTS.length,12);
 assert.equal(new Set(CONSOLE_REPORTS.map(x=>x.title)).size,12);
 assert.equal(ARCHIVE_RECORDS.length,48);
 for(let i=0;i<12;i++){
  const level=createLevel(i);
  assert(consoleReport(level).title.length>5);
  assert(consoleReport(level).text.length>90);
  assert(level.props.some(p=>p.type==='console'),SECTORS[i].name+' has at least one usable floor PC');
  for(let plaque=0;plaque<4;plaque++)assert(recordForSign('original',i,plaque));
 }
 assert.equal(consoleReport({index:99}),null);
});

test('each floor PC marks an optional secret route and recharges once without touching doors',()=>{
 for(let index=0;index<12;index++){
  const level=createLevel(index),console=level.props.find(p=>p.type==='console');
  const before=Object.values(level.doors).map(d=>({...d})),seen=level.seen.slice();
  const first=recoverConsole(level,console);
  assert(first&&first.fresh&&first.report===CONSOLE_REPORTS[index]);
  assert.equal(console.terminalUsed,true);
  assert(first.secretMarked,'the authored sector should have a maintenance secret');
  const secret=Object.values(level.doors).find(d=>d.type===6);
  assert(level.seen[secret.y*level.w+secret.x],SECTORS[index].name+' marks the secret location');
  assert.equal(level.secretFound,false,'terminals do not claim the secret or open a door');
  assert.deepEqual(Object.values(level.doors),before,'all locked and secret doors unchanged');
  assert(level.seen.some((value,i)=>value&&!seen[i]),'real map discovery, not a fake toast');
  assert.deepEqual(recoverConsole(level,console),{report:CONSOLE_REPORTS[index],fresh:false,secretMarked:false});
  assert.deepEqual(Object.values(level.doors),before);
 }
});

test('actual Game.INTERACT uses facing/height, gives exactly one Ori boost and emits rereadable dialogue',()=>{
 const g=new Game();g.start({verticalPreview:true});g.level.enemies.forEach(e=>e.stun=999);
 const terminal=g.level.props.find(p=>p.type==='console');
 assert(terminal);
 Object.assign(g.player,{x:terminal.x+.2,y:terminal.y,a:Math.PI,ori:40,height:0,grounded:true,supportSurface:'ground'});
 g.events=[];
 g.interact();
 assert.equal(terminal.terminalUsed,true);
 assert.equal(g.player.ori,55);
 assert(g.events.some(e=>e.type==='toast'&&e.text.includes('TERMINAL RECOVERED')));
 assert(g.events.some(e=>e.type==='dialogue'&&e.speaker==='ARCHIVE'&&e.text.includes(CONSOLE_REPORTS[0].title)));
 const count=g.events.filter(e=>e.type==='burst').length;
 g.interact();
 assert.equal(g.player.ori,55,'second press must never duplicate reward');
 assert.equal(g.events.filter(e=>e.type==='burst').length,count);
 const save=g.snapshot(),reloaded=new Game();
 assert.equal(reloaded.restore(save),true);
 const copy=reloaded.level.props.find(p=>p.type==='console');
 assert.equal(copy.terminalUsed,true,'ordinary old v1 snapshot carries optional recovered flag');
 assert.equal(reloaded.snapshot().version,1);
 assert.equal(recoverConsole(reloaded.level,copy).fresh,false);
});

test('terminals are floor-limited and cannot be collected without pointing at the PC',()=>{
 const g=new Game();g.start({verticalPreview:true});g.level.enemies.forEach(e=>e.stun=999);
 const terminal=g.level.props.find(p=>p.type==='console');
 Object.assign(g.player,{x:terminal.x+.2,y:terminal.y,a:0,height:0,grounded:true,supportSurface:'ground'});
 g.interact();assert(!terminal.terminalUsed,'facing away cannot interact with a console');
 g.player.a=Math.PI;g.player.height=g.level.vertical.upper.height;g.player.supportSurface='upper';
 g.interact();assert(!terminal.terminalUsed,'standing over a console upstairs must not activate one below');
 g.player.height=0;g.player.supportSurface='ground';g.interact();
 assert(terminal.terminalUsed);
});

test('original campaign console feature is not active in Pit or competitive modes',()=>{
 const pit=new Game();pit.startPit();const before=JSON.stringify(pit.snapshot());
 const console=pit.level.props?.find(p=>p.type==='console');
 if(console){
  Object.assign(pit.player,{x:console.x+.2,y:console.y,a:Math.PI});
  pit.interact();
  assert(!console.terminalUsed);
 }
 const ordinary=new Game();ordinary.start();
 const old=ordinary.snapshot();old.level.props.forEach(prop=>delete prop.terminalUsed);
 const restored=new Game();assert.equal(restored.restore(old),true);
 const p=restored.level.props.find(x=>x.type==='console');
 assert(!p.terminalUsed,'old v1 saves without a terminal flag remain valid');
 assert.equal(pit.snapshot().version,2);
 assert(!('terminalUsed' in pit.snapshot().player));
});

test('native VR, Classic HUD, COMMS log and offline cache share the real interaction',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert(read('src/core.js').includes('recoverConsole(l,terminal)'));
 assert(read('src/core.js').includes("'REREAD TERMINAL':'RECOVER TERMINAL'"));
 assert(read('src/core.js').includes("this.say(found.report.title+': '+found.report.text,'ARCHIVE',2)"));
 assert(read('src/world-scene.js').includes("prop.terminalUsed?[.65,.85,.94,1]"));
 assert(read('src/world-ui.js').includes('paintLog(data)'));
 assert(read('scripts/build.mjs').includes("'./src/console-recoveries.js'"));
 assert(read('scripts/verify-offline.mjs').includes("'./src/console-recoveries.js'"));
});
