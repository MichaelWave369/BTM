import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {ArchiveLedger,ARCHIVE_RECORDS,ARCHIVE_EVIDENCE_CASES} from '../src/archive-ledger.js';
import {GALLERY_KEY,GALLERY_SCHEMA,storeGalleryResult} from '../src/shooting-gallery.js';
import {readGalleryCard,buildTrophyDossier,TROPHY_ROOM_SCHEMA} from '../src/trophy-room.js';
const storage=()=>{const map=new Map();return{
 getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),
 entries:()=>Object.fromEntries(map)};};

test('trophy room starts as an honest read-only local dossier, never an online award',()=>{
 const r=buildTrophyDossier();
 assert.equal(r.schema,TROPHY_ROOM_SCHEMA);
 assert.equal(r.verifiedMultiplayer,false);assert.equal(r.localOnly,true);
 assert.equal(r.earned,0);assert.equal(r.available,12);
 assert.equal(r.panels.length,4);assert.equal(r.panels[0].stats[0][1],'NO CHECKPOINT');
 assert.equal(r.panels[1].stats[0][1],'0 / 12');
 assert.equal(r.panels[2].stats[0][1],'0 / 48');
 assert.equal(r.panels[3].stats[0][1],'NOT PLAYED');
 assert(r.medals.every(m=>!m.earned&&m.current===0));
});
test('real campaign and Pit snapshots are read as saved checkpoints, not fabricated completed sectors',()=>{
 const g=new Game();g.start();
 const original=g.snapshot();
 const p=new Game();p.startPit();
 const pit=p.snapshot();
 const before=JSON.stringify({original,pit});
 const r=buildTrophyDossier({original,pit});
 assert.equal(r.panels[0].stats[0][1],'1 / 12');
 assert.equal(r.panels[1].stats[0][1],'0 / 12');
 assert.equal(r.earned,0);
 assert.equal(JSON.stringify({original,pit}),before,'render model never edits real save objects');
 original.levelIndex=11;
 const reached=buildTrophyDossier({original,pit});
 assert.equal(reached.medals.find(m=>m.id==='twelve-sector').earned,true);
 assert(reached.panels[0].subtitle.includes('checkpoint'));
});
test('genuine Human Ledger readings increment 3/6/9 milestones and linked case medals',()=>{
 const store=storage(),ledger=new ArchiveLedger(store);
 for(const rec of ARCHIVE_RECORDS.slice(0,2))ledger.collect(rec.id);
 let r=buildTrophyDossier({archive:ledger});
 assert.equal(r.medals.find(m=>m.id==='first-signal').earned,false);
 ledger.collect(ARCHIVE_RECORDS[2].id);
 r=buildTrophyDossier({archive:ledger});
 assert.equal(r.earned,1);
 for(const rec of ARCHIVE_RECORDS.slice(3,9))ledger.collect(rec.id);
 r=buildTrophyDossier({archive:ledger});
 assert.equal(r.panels[2].stats[1][1],'3 / 3');
 assert.equal(r.medals.find(m=>m.id==='nine-witnesses').earned,true);
 const c=ARCHIVE_EVIDENCE_CASES[0];
 for(const id of c.requires)ledger.collect(id);
 r=buildTrophyDossier({archive:ledger});
 assert.equal(r.panels[2].stats[2][1],'1 / 4');
 assert.equal(r.medals.find(m=>m.id==='link-the-evidence').earned,true);
 const before=JSON.stringify(store.entries());buildTrophyDossier({archive:ledger});
 assert.equal(JSON.stringify(store.entries()),before,'viewing the cabinet must not persist new reads');
});
test('scorecard reflects real offline gallery best and remains independent of LAN, campaign and Pit keys',()=>{
 const store=storage();
 storeGalleryResult(store,{score:900,shots:12,hits:9});
 const before=JSON.stringify(store.entries());
 const card=readGalleryCard(store);
 assert.equal(card.best.score,900);assert.equal(card.best.accuracy,75);
 const r=buildTrophyDossier({gallery:card});
 assert.equal(r.panels[3].stats[0][1],'900');
 assert.equal(r.panels[3].stats[1][1],'75%');
 assert(r.medals.find(m=>m.id==='vault-first-hit').earned);
 assert(r.medals.find(m=>m.id==='vault-nine-tags').earned);
 assert.equal(r.verifiedMultiplayer,false);
 assert.equal(JSON.stringify(store.entries()),before,'gallery history is read only');
 assert.deepEqual(Object.keys(store.entries()),[GALLERY_KEY]);
});
test('bad and unavailable gallery storage cannot crash the room or award hidden trophies',()=>{
 const store=storage();
 store.setItem(GALLERY_KEY,'{bad json');
 assert.equal(readGalleryCard(store),null);
 store.setItem(GALLERY_KEY,JSON.stringify({schema:'evil',best:{score:9999999}}));
 assert.equal(readGalleryCard(store),null);
 store.setItem(GALLERY_KEY,JSON.stringify({schema:GALLERY_SCHEMA,plays:1,totalShots:8,totalHits:99,
 best:{drill:'signal-60',shots:5,hits:999,score:1000,accuracy:999}}));
 const card=readGalleryCard(store);
 assert.equal(card.best.hits,5);assert.equal(card.best.accuracy,100);
 assert.equal(card.totalHits,8);
 assert.equal(readGalleryCard({getItem(){throw Error('private storage denied')}}),null);
 const noData=buildTrophyDossier({gallery:readGalleryCard({getItem(){throw Error('denied')}})});
 assert(!noData.medals.find(m=>m.id==='vault-first-hit').earned);
});
test('Trophy Room has keyboard, gamepad, Quest navigation and no gameplay/save writes',()=>{
 const app=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(app.includes("showScreen('trophy-screen')"));
 assert(app.includes("if(screen==='trophy-screen'){trophyBack();return;}"));
 assert(app.includes("if(screen==='trophy-screen'){showScreen(trophyReturnScreen);return;}"));
 assert(app.includes("trophyReturnScreen==='pause-screen'"));
 assert(app.includes("const dossier=buildTrophyDossier({original:saved,pit:pitSaved,archive:archiveLedger,gallery});"));
 assert(!readFileSync(new URL('../src/trophy-room.js',import.meta.url),'utf8').includes('setItem('));
 for(const id of ['trophy-btn','pause-trophy','trophy-back','trophy-medals','trophy-stat-panels','trophy-open-ledger','trophy-open-range'])assert(html.includes('id="'+id+'"'));
 assert(html.includes('VERIFIED MATCH RECORDS'));
});
