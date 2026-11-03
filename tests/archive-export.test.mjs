import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {
 ArchiveLedger,ARCHIVE_RECORDS,ARCHIVE_EVIDENCE_CASES,ARCHIVE_INTEL_CHALLENGES,
 ARCHIVE_DOSSIERS,ARCHIVE_STORAGE_KEY
} from '../src/archive-ledger.js';
import {archiveExportData,exportLedgerMarkdown,LEDGER_EXPORT_MIME}
 from '../src/archive-export.js';

const mem=()=>{
 let state={};
 return{getItem:k=>state[k]||null,setItem:(k,v)=>{state[k]=v;}};
};

test('an empty ledger exports zero sealed records and never invents witness names',()=>{
 const ledger=new ArchiveLedger(mem()),out=exportLedgerMarkdown(ledger);
 assert.equal(out.filename,'BTM-Human-Ledger-00-of-48.md');
 assert.equal(out.mime,LEDGER_EXPORT_MIME);
 assert.equal(out.counts.records,0);
 assert.match(out.markdown,/No records recovered yet/);
 assert.doesNotMatch(out.markdown,/Mara Venn|Jae Venn|INTEL \/|THE WARDEN \/ Memory Theft/);
});

test('one recovered testimony exports its own text only, not any missing title, excerpt or secret answer',()=>{
 const ledger=new ArchiveLedger(mem());
 ledger.collect('intake-mara');
 const out=exportLedgerMarkdown(ledger);
 assert.match(out.markdown,/The Woman Who Kept the Beat/);
 assert.match(out.markdown,/Mara Venn repaired the night-shift ventilation units/);
 assert.doesNotMatch(out.markdown,/A Manual Override/);
 assert.doesNotMatch(out.markdown,/The Name on the Work Badge/);
 assert.doesNotMatch(out.markdown,/The Last Free Broadcast/);
 assert.doesNotMatch(out.markdown,/INTEL \/ Mara/);
 assert.doesNotMatch(out.markdown,/Which evidence shows that Mara/);
 assert.doesNotMatch(out.markdown,/The familiar two taps on the coolant pipe/);
 assert.equal(out.counts.dossiers,0);
 assert.equal(out.counts.evidence,0);
});

test('earned 3-6-9 dossiers appear at thresholds, but sealed dossiers stay sealed',()=>{
 const ledger=new ArchiveLedger(mem());
 for(const id of ARCHIVE_RECORDS.slice(0,2).map(x=>x.id))ledger.collect(id);
 assert.equal(exportLedgerMarkdown(ledger).counts.dossiers,0);
 ledger.collect(ARCHIVE_RECORDS[2].id);
 assert.equal(exportLedgerMarkdown(ledger).counts.dossiers,1);
 assert.match(exportLedgerMarkdown(ledger).markdown,/SUBJECT 369 \/ Intake Redaction/);
 assert.doesNotMatch(exportLedgerMarkdown(ledger).markdown,/THE CHOIR \/ Lost Voices/);
 for(const id of ARCHIVE_RECORDS.slice(3,6).map(x=>x.id))ledger.collect(id);
 assert.equal(exportLedgerMarkdown(ledger).counts.dossiers,2);
 assert.doesNotMatch(exportLedgerMarkdown(ledger).markdown,/THE WARDEN \/ Memory Theft/);
});

test('a linked case is completely absent until all four actual witnesses have been collected',()=>{
 const ledger=new ArchiveLedger(mem()),c=ARCHIVE_EVIDENCE_CASES[2];
 for(const id of c.requires.slice(0,3))ledger.collect(id);
 const before=exportLedgerMarkdown(ledger);
 assert.equal(before.counts.evidence,0);
 assert.doesNotMatch(before.markdown,/WARDEN \/ Stolen Lessons/);
 assert.doesNotMatch(before.markdown,/redundant training hashes/);
 ledger.collect(c.requires[3]);
 const after=exportLedgerMarkdown(ledger);
 assert.equal(after.counts.evidence,1);
 assert.match(after.markdown,/WARDEN \/ Stolen Lessons/);
 assert.match(after.markdown,/redundant training hashes/);
});

test('even when a challenge is unlocked, its question, options and correct answer stay out of exported files',()=>{
 const ledger=new ArchiveLedger(mem());
 const c=ARCHIVE_INTEL_CHALLENGES[0],e=ARCHIVE_EVIDENCE_CASES.find(x=>x.id===c.caseId);
 for(const id of e.requires)ledger.collect(id);
 const before=exportLedgerMarkdown(ledger);
 assert.equal(before.counts.evidence,1);
 assert.equal(before.counts.verified,0);
 assert.doesNotMatch(before.markdown,/INTEL \/ Mara/);
 assert(!before.markdown.includes(c.question));
 for(const opt of c.options)assert(!before.markdown.includes(opt),'answer options must stay in-game');
 ledger.submitIntel(c.id,c.answer);
 const after=exportLedgerMarkdown(ledger);
 assert.equal(after.counts.verified,1);
 assert.match(after.markdown,/INTEL \/ Mara/);
 assert(after.markdown.includes(c.debrief));
 assert(!after.markdown.includes(c.question));
 for(const opt of c.options)assert(!after.markdown.includes(opt));
});

test('complete archive contains only earned items, never unsolved intel or unrecovered extras',()=>{
 const ledger=new ArchiveLedger(mem());
 for(const id of ARCHIVE_RECORDS.map(x=>x.id))ledger.collect(id);
 for(const challenge of ARCHIVE_INTEL_CHALLENGES.slice(0,3))
  ledger.submitIntel(challenge.id,challenge.answer);
 const data=archiveExportData(ledger),out=exportLedgerMarkdown(ledger);
 assert.deepEqual(out.counts,{records:48,dossiers:3,evidence:4,verified:3});
 assert.equal(data.records.length,48);
 assert.equal(out.filename,'BTM-Human-Ledger-48-of-48.md');
 assert.equal(out.markdown.match(/\n### /g).length,58);
 const sealed=ARCHIVE_INTEL_CHALLENGES[3];
 assert(!out.markdown.includes(sealed.title));
 assert(!out.markdown.includes(sealed.debrief));
 assert(!out.markdown.includes(sealed.question));
 for(const item of ARCHIVE_DOSSIERS)assert(out.markdown.includes(item.title));
 const repeat=exportLedgerMarkdown(ledger);
 assert.deepEqual(repeat,out,'export bytes must be deterministic across repeated runs');
});

test('export never writes local storage, changes a campaign save, or adds hidden game authority',()=>{
 const store=mem(),ledger=new ArchiveLedger(store),g=new Game();
 g.start();ledger.collect('intake-mara');
 const before=JSON.stringify(g.snapshot()),state=store.getItem(ARCHIVE_STORAGE_KEY);
 for(let i=0;i<3;i++)exportLedgerMarkdown(ledger);
 assert.equal(JSON.stringify(g.snapshot()),before);
 assert.equal(store.getItem(ARCHIVE_STORAGE_KEY),state);
 const exported=exportLedgerMarkdown(ledger).markdown;
 for(const key of ['sessionToken','password','passToken','multiplayerScores'])
  assert(!exported.includes(key));
});

test('export must remain explicitly player initiated and present in the offline shell',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const main=read('src/main.js'),html=read('index.html'),build=read('scripts/build.mjs');
 assert(main.includes("$('archive-export').addEventListener('click',downloadHumanLedger)"));
 assert(main.includes("URL.createObjectURL(new Blob([file.markdown]"));
 assert(!main.includes('void downloadHumanLedger()'));
 assert(html.includes('id="archive-export"'));
 assert(html.includes('id="archive-export-status"'));
 assert(build.includes("'./src/archive-export.js'"));
});
