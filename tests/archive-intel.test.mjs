import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {ARCHIVE_RECORDS,ARCHIVE_EVIDENCE_CASES,ARCHIVE_INTEL_CHALLENGES,
 ARCHIVE_STORAGE_KEY,ARCHIVE_SCHEMA,ArchiveLedger} from '../src/archive-ledger.js';

function storage(initial){
 const values=new Map();
 if(initial!==undefined)values.set(ARCHIVE_STORAGE_KEY,initial);
 return{getItem:key=>values.get(key)||null,setItem:(key,v)=>values.set(key,v)};
}
const caseFor=id=>ARCHIVE_EVIDENCE_CASES.find(c=>c.id===id);

test('every optional intel case requires four discovered records and remains completely hidden beforehand',()=>{
 const ledger=new ArchiveLedger(storage());
 assert.equal(ARCHIVE_INTEL_CHALLENGES.length,4);
 assert.deepEqual(ledger.intelChallenges,[]);
 assert.equal(ledger.solvedIntelCount,0);
 for(const intel of ARCHIVE_INTEL_CHALLENGES){
  const witness=caseFor(intel.caseId);
  assert(witness,'investigation must reference a real linked evidence case');
  assert.equal(new Set(intel.options).size,3);
  assert(intel.question.length>25&&intel.debrief.length>80);
  assert(Number.isInteger(intel.answer)&&intel.answer>=0&&intel.answer<3);
  assert(!ledger.list().some(item=>item.id===intel.id));
  assert.equal(ledger.find(intel.id),null);
  assert.deepEqual(ledger.submitIntel(intel.id,intel.answer),{accepted:false,correct:false,new:false});
  for(const id of witness.requires.slice(0,-1))ledger.collect(id);
  assert.equal(ledger.find(intel.id),null);
  ledger.collect(witness.requires.at(-1));
  assert.equal(ledger.find(intel.id)?.title,intel.title);
  assert(ledger.list().some(item=>item.id===intel.id));
 }
});

test('wrong options never award an intel case and a right option awards once with persistence',()=>{
 const store=storage(),ledger=new ArchiveLedger(store);
 const c=ARCHIVE_INTEL_CHALLENGES[0];
 for(const id of caseFor(c.caseId).requires)ledger.collect(id);
 const wrong=(c.answer+1)%3;
 assert.deepEqual(ledger.submitIntel(c.id,wrong),{accepted:true,correct:false,new:false});
 assert.equal(ledger.solvedIntelCount,0);
 assert.equal(ledger.find(c.id)?.solved,false);
 assert.deepEqual(ledger.submitIntel(c.id,99),{accepted:false,correct:false,new:false});
 assert.deepEqual(ledger.submitIntel(c.id,'0'),{accepted:false,correct:false,new:false});
 assert.deepEqual(ledger.submitIntel(c.id,c.answer),{accepted:true,correct:true,new:true});
 assert.deepEqual(ledger.submitIntel(c.id,c.answer),{accepted:true,correct:true,new:false});
 assert.equal(ledger.solvedIntelCount,1);
 assert.equal(ledger.find(c.id)?.solved,true);
 const reload=new ArchiveLedger(store);
 assert.equal(reload.solvedIntelCount,1);
 assert.equal(reload.find(c.id)?.debrief,c.debrief);
 assert.deepEqual(JSON.parse(store.getItem(ARCHIVE_STORAGE_KEY)).intelSolved,[c.id]);
});

test('v1 old saves still work, invalid or orphaned solved cases are ignored',()=>{
 const old=storage(JSON.stringify({schema:ARCHIVE_SCHEMA,ids:['intake-mara']}));
 assert.equal(new ArchiveLedger(old).count,1);
 assert.equal(new ArchiveLedger(old).solvedIntelCount,0);
 const c=ARCHIVE_INTEL_CHALLENGES[0];
 const stored=storage(JSON.stringify({schema:ARCHIVE_SCHEMA,ids:['intake-mara'],
  intelSolved:[c.id,'intel:does-not-exist',23]}));
 const ledger=new ArchiveLedger(stored);
 assert.equal(ledger.solvedIntelCount,0,'unearned local solve receipts must not appear');
 assert.equal(ledger.find(c.id),null);
 const badlyEncoded=storage('{invalid}');
 assert.equal(new ArchiveLedger(badlyEncoded).count,0);
 assert.equal(new ArchiveLedger(badlyEncoded).solvedIntelCount,0);
 const blocked={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 const fallback=new ArchiveLedger(blocked);
 assert.equal(fallback.collect('intake-mara').new,true);
 assert.equal(fallback.solvedIntelCount,0);
});

test('solving all optional intel challenges never mutates either campaign state or gameplay stats',()=>{
 const store=storage(),ledger=new ArchiveLedger(store),g=new Game();
 g.start();
 const before=JSON.stringify(g.snapshot()),stats=JSON.stringify(g.stats);
 for(const id of ARCHIVE_RECORDS.map(x=>x.id))ledger.collect(id);
 assert.equal(ledger.intelChallenges.length,4);
 for(const challenge of ARCHIVE_INTEL_CHALLENGES)
  assert.equal(ledger.submitIntel(challenge.id,challenge.answer).new,true);
 assert.equal(ledger.solvedIntelCount,4);
 assert.equal(new ArchiveLedger(store).solvedIntelCount,4);
 assert.equal(JSON.stringify(g.snapshot()),before);
 assert.equal(JSON.stringify(g.stats),stats);
 assert(!('intelSolved' in g.snapshot()),'the original campaign schema must remain unchanged');
 g.startPit();
 assert.equal(g.campaign,'pit');
 assert.equal(new ArchiveLedger(store).solvedIntelCount,4);
});

test('desktop and wrist render the same locally earned exercises with no mandatory network',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const main=read('src/main.js'),wrist=read('src/world-ui.js'),css=read('src/style.css'),
  renderer=read('src/archive-ledger.js');
 assert(main.includes('archiveLedger.submitIntel(selected.id,i)'));
 assert(main.includes("selected.type==='challenge'"));
 assert(main.includes("result.correct"));
 assert(main.includes('role\',\'status'));
 assert(wrist.includes("if(entry.type==='challenge')"));
 assert(wrist.includes('ledger.submitIntel(entry.id,i)'));
 assert(wrist.includes("this.archiveFeedback=result.correct?"));
 assert(css.includes('.archive-intel-options button:focus-visible'));
 assert(!renderer.includes('fetch('));
 assert(!renderer.includes('WebSocket('));
});
