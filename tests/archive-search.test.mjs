import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARCHIVE_RECORDS,ARCHIVE_EVIDENCE_CASES,ARCHIVE_INTEL_CHALLENGES,
 ARCHIVE_SEARCH_FILTERS,ArchiveLedger,searchRecoveredArchive} from '../src/archive-ledger.js';

const ledger=()=>new ArchiveLedger(null);

test('the recovered archive search begins empty and never consults hidden master files',()=>{
 const local=ledger();
 assert.deepEqual(searchRecoveredArchive(local,''),[]);
 assert.deepEqual(searchRecoveredArchive(local,'Mara'),[]);
 assert.deepEqual(searchRecoveredArchive(null,'Mara'),[]);
 assert.deepEqual(searchRecoveredArchive({},'Mara'),[]);
 local.collect(ARCHIVE_RECORDS[0].id);
 const hidden=ARCHIVE_RECORDS.at(-1);
 assert(!searchRecoveredArchive(local,hidden.title).some(item=>item.id===hidden.id));
 assert.deepEqual(searchRecoveredArchive(local,''),local.list());
});

test('desktop title, subject, category and testimony searches ignore case and combine terms',()=>{
 const local=ledger();local.collect('intake-mara');local.collect('engineer-ivo');
 assert.deepEqual(searchRecoveredArchive(local,'woman beat','records').map(x=>x.id),['intake-mara']);
 assert.deepEqual(searchRecoveredArchive(local,'mArA vEnN','records').map(x=>x.id),['intake-mara']);
 assert.deepEqual(searchRecoveredArchive(local,'coolant rhythm','records').map(x=>x.id),['intake-mara']);
 assert.deepEqual(searchRecoveredArchive(local,'resistance engineer','records').map(x=>x.id),['engineer-ivo']);
 assert.deepEqual(searchRecoveredArchive(local,'  '),local.list());
});

test('category filters include only locally visible records, dossiers or investigations',()=>{
 const local=ledger();
 for(const record of ARCHIVE_RECORDS.slice(0,9))local.collect(record.id);
 assert.deepEqual(ARCHIVE_SEARCH_FILTERS,['all','records','dossiers','intel']);
 assert.equal(searchRecoveredArchive(local,'','records').length,9);
 assert.equal(searchRecoveredArchive(local,'','dossiers').length,3);
 assert.equal(searchRecoveredArchive(local,'','intel').length,0);
 assert.equal(searchRecoveredArchive(local,'').length,12);
 assert.equal(searchRecoveredArchive(local,'','unknown').length,12);
});

test('an evidence case remains unsearchable until all four real records are collected',()=>{
 const local=ledger(),c=ARCHIVE_EVIDENCE_CASES[0];
 for(const id of c.requires.slice(0,3))local.collect(id);
 assert(!searchRecoveredArchive(local,'','dossiers').some(item=>item.id===c.id));
 local.collect(c.requires[3]);
 assert(searchRecoveredArchive(local,'','dossiers').some(item=>item.id===c.id));
});

test('unsolved debriefs and correct-answer options are never indexed',()=>{
 const local=ledger(),challenge=ARCHIVE_INTEL_CHALLENGES[0],c=ARCHIVE_EVIDENCE_CASES.find(x=>x.id===challenge.caseId);
 for(const id of c.requires)local.collect(id);
 assert.equal(searchRecoveredArchive(local,'','intel').length,1);
 assert.equal(searchRecoveredArchive(local,'WITNESS VERIFIED','intel').length,0);
 assert.equal(searchRecoveredArchive(local,challenge.options[1],'intel').length,0);
 assert.equal(local.submitIntel(challenge.id,challenge.answer).correct,true);
 assert.deepEqual(searchRecoveredArchive(local,'WITNESS VERIFIED','intel').map(x=>x.id),[challenge.id]);
 assert.equal(searchRecoveredArchive(local,challenge.options[1],'intel').length,0);
});

test('the search accepts bounded or empty queries without mutating recovered progress',()=>{
 const local=ledger();local.collect('intake-mara');
 const original=JSON.stringify(local.list()),rev=local.revision;
 for(const query of [null,undefined,'','  ',('x'.repeat(5000))])
  assert.doesNotThrow(()=>searchRecoveredArchive(local,query));
 assert.equal(JSON.stringify(local.list()),original);
 assert.equal(local.revision,rev);
 assert.equal(local.count,1);
});

test('desktop and Quest use the shared offline capability boundary',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const main=read('src/main.js'),html=read('index.html'),wrist=read('src/world-ui.js'),css=read('src/style.css');
 assert(main.includes('searchRecoveredArchive(archiveLedger,query)'));
 assert(main.includes("$('archive-search').addEventListener('input',()=>renderArchiveScreen())"));
 assert(main.includes("'No matching recovered files. Try another search term.'"));
 assert(html.includes('id="archive-search" type="search"'));
 assert(html.includes('id="archive-search-status" role="status"'));
 assert(css.includes('.archive-search-controls input'));
 assert(wrist.includes("searchRecoveredArchive(ledger,'',this.archiveFilter)"));
 assert(wrist.includes('this.archiveFilter=ARCHIVE_SEARCH_FILTERS['));
 assert(wrist.includes('this.archivePage=0;this.archiveSelected=null;this.lastPaint=-Infinity;'));
 assert(!wrist.includes('new WebSocket('));
});
