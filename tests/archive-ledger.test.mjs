import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game,createLevel} from '../src/core.js';
import {ARCHIVE_RECORDS,ARCHIVE_DOSSIERS,ARCHIVE_SCHEMA,ARCHIVE_STORAGE_KEY,ArchiveLedger,recordForSign,recordById,ARCHIVE_EVIDENCE_CASES} from '../src/archive-ledger.js';

function storage(){
 const values=new Map();
 return {values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
}
test('all 48 Human Ledger records are unique, authored, tied to 12 original-sector wall plaques',()=>{
 assert.equal(ARCHIVE_RECORDS.length,48);
 assert.deepEqual(ARCHIVE_DOSSIERS.map(d=>d.threshold),[3,6,9]);
 assert.equal(new Set(ARCHIVE_RECORDS.map(r=>r.id)).size,48);
 assert.ok(ARCHIVE_RECORDS.some(r=>r.kind.includes('PLUGGED')));
 assert.ok(ARCHIVE_RECORDS.some(r=>r.kind.includes('REPEATER')));
 assert.ok(ARCHIVE_RECORDS.some(r=>r.kind.includes('WARDEN')));
 for(let sector=0;sector<12;sector++){
  const level=createLevel(sector);
  assert.equal(level.signs.length,4);
  for(let plaque=0;plaque<4;plaque++){
   const record=recordForSign('original',sector,plaque);
   assert.ok(record&&record.id,sector+':'+plaque);
   assert.ok(level.signs.some(s=>s.id===plaque));
   assert.ok(record.text.length>150&&record.excerpt.length>30);
   assert.ok(recordById(record.id)===record);
  }
 }
 assert.equal(recordForSign('pit',0,0),null);
 assert.equal(recordForSign('original',12,0),null);
 assert.equal(recordById('unknown'),null);
});
test('3/6/9 dossiers unlock once from unique readings; no unrecovered content leaks',()=>{
 const store=storage(),ledger=new ArchiveLedger(store);
 assert.equal(ledger.count,0);
 assert.deepEqual(ledger.list(),[]);
 assert.equal(ledger.find('intake-mara'),null);
 assert.equal(ledger.find(ARCHIVE_DOSSIERS[0].id),null);
 const steps=[];
 for(let i=0;i<9;i++){
  const found=ledger.collect(ARCHIVE_RECORDS[i].id);
  assert.equal(found.new,true);
  steps.push(...found.milestones.map(d=>d.threshold));
  assert.equal(ledger.collect(ARCHIVE_RECORDS[i].id).new,false);
 }
 assert.deepEqual(steps,[3,6,9]);
 assert.equal(ledger.count,9);
 assert.equal(ledger.unlocked.length,3);
 assert.equal(ledger.list().length,12);
 assert.equal(ledger.find(ARCHIVE_DOSSIERS[2].id)?.title,'THE WARDEN / Memory Theft');
 assert.equal(ledger.find(ARCHIVE_RECORDS[11].id),null);
 assert.equal(ledger.collect('not-a-record').new,false);
 assert.equal(ledger.count,9);
 assert.equal(JSON.parse(store.getItem(ARCHIVE_STORAGE_KEY)).schema,ARCHIVE_SCHEMA);
});
test('discovered archive persists independently across new runs, retries and reloading',()=>{
 const store=storage(),g=new Game();g.start();
 const before=JSON.stringify(g.snapshot()),ledger=new ArchiveLedger(store);
 ledger.collect(ARCHIVE_RECORDS[0].id);
 g.loadLevel(1);
 g.retry();
 g.start();
 assert.equal(new ArchiveLedger(store).find(ARCHIVE_RECORDS[0].id)?.subject,'Mara Venn');
 assert.equal(JSON.stringify(g.snapshot()),before,'restarting a new campaign must preserve its original deterministic initial state');
 const g2=new Game();g2.restore(JSON.parse(before));
 assert.equal(g2.levelIndex,0);
 assert.equal(g2.snapshot().version,1);
 assert.equal(new ArchiveLedger(store).count,1);
 assert.ok(!('archiveReads' in g2.snapshot()),'no save format mutation');
});
test('bad storage and invalid ids are ignored safely, and unavailable storage does not prevent play',()=>{
 const store=storage();
 store.setItem(ARCHIVE_STORAGE_KEY,JSON.stringify({schema:ARCHIVE_SCHEMA,ids:['intake-mara','unknown',2,'intake-mara']}));
 assert.equal(new ArchiveLedger(store).count,1);
 store.setItem(ARCHIVE_STORAGE_KEY,'broken json');
 assert.equal(new ArchiveLedger(store).count,0);
 store.setItem(ARCHIVE_STORAGE_KEY,JSON.stringify({schema:'bad',ids:['intake-mara']}));
 assert.equal(new ArchiveLedger(store).count,0);
 const denied={getItem(){throw Error('storage denied');},setItem(){throw Error('storage denied');}};
 const ledger=new ArchiveLedger(denied);
 assert.equal(ledger.collect('intake-mara').new,true);
 assert.equal(ledger.count,1);
});
test('the wall interact action continues normal targeting and yields a collectible original archive id',()=>{
 const g=new Game();g.start();
 const sign=g.level.signs.find(s=>s.id===0);
 assert.ok(sign);
 g.player.x=sign.x+.5;g.player.y=sign.y+1.4;g.player.a=-Math.PI/2;
 g.events.length=0;
 g.interact();
 const events=g.events.filter(e=>e.type==='story');
 assert.equal(events.length,1);
 assert.equal(events[0].archiveId,'intake-mara');
 assert.equal(events[0].campaign,'original');
 assert.equal(events[0].sector,0);
 assert.equal(sign.read,true);
 g.interact();
 assert.equal(g.events.filter(e=>e.type==='story').length,2);
});
test('the readable archive UI works offline in Classic and Quest, while gameplay state stays unchanged',async()=>{
 const file=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const [main,ui,index,build,core]=await Promise.all(['src/main.js','src/world-ui.js','index.html','scripts/build.mjs','src/core.js'].map(file));
 assert.match(index,/id="archive-screen"/);
 assert.match(index,/id="title-archive"/);
 assert.match(index,/id="pause-archive"/);
 assert.match(main,/archiveLedger\.collect\(e\.archiveId\)/);
 assert.match(main,/archive:archiveLedger/);
 assert.match(ui,/paintArchive\(data\)/);
 assert.match(ui,/HUMAN LEDGER/);
 assert.match(core,/recordForSign\(this\.campaign,this\.levelIndex,sign\.id\)/);
 assert.match(build,/src\/archive-ledger\.js/);
});


test('four cross-sector evidence cases unlock only from their complete distinct witness chains',()=>{
 assert.equal(ARCHIVE_EVIDENCE_CASES.length,4);
 const allIds=new Set(ARCHIVE_RECORDS.map(r=>r.id));
 for(const c of ARCHIVE_EVIDENCE_CASES){
  assert(c.requires.length>=3);
  assert(c.requires.every(id=>allIds.has(id)));
  assert.equal(new Set(c.requires).size,c.requires.length);
  const store=storage(),ledger=new ArchiveLedger(store);
  assert.equal(ledger.find(c.id),null,'unearned evidence must not leak '+c.id);
  for(const id of c.requires.slice(0,-1))ledger.collect(id);
  assert.equal(ledger.find(c.id),null,'partial evidence must remain secret '+c.id);
  assert(!ledger.list().some(item=>item.id===c.id));
  const last=c.requires.at(-1),awarded=ledger.collect(last);
  assert(awarded.new);
  assert.equal(ledger.find(c.id)?.title,c.title);
  assert.equal(ledger.list().filter(item=>item.id===c.id).length,1);
  assert.equal(ledger.collect(last).new,false);
  assert.equal(new ArchiveLedger(store).find(c.id)?.id,c.id,'case must reconstruct after reload');
 }
});
test('the full 48-record archive remains optional and safe to import through existing browser saves',()=>{
 const store=storage(),ledger=new ArchiveLedger(store),before=JSON.stringify(new Game().snapshot());
 for(const record of ARCHIVE_RECORDS){
  assert(record.text.length>150&&record.excerpt.length>30,record.id);
  assert.equal(ledger.collect(record.id).new,true);
 }
 assert.equal(ledger.count,48);
 assert.equal(ledger.total,48);
 assert.equal(ledger.unlocked.length,3,'the original 3/6/9 dossiers remain in place');
 assert.equal(ledger.evidence.length,4);
 assert.equal(ledger.list().length,55,'48 records, 3 original dossiers and 4 evidence cases');
 assert.equal(new ArchiveLedger(store).count,48);
 assert.equal(JSON.stringify(new Game().snapshot()),before,'collectibles cannot mutate campaign state');
 assert.equal(recordForSign('pit',8,2),null,'Pit campaign keeps a separate story mapping');
});
