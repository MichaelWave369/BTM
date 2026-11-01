import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,soundtrackCue,albumFileURL,SoundtrackDeck} from '../src/soundtrack.js';

test('The 18 supplied original MP3 tracks have unique stable IDs and paths',()=>{
  assert.equal(TRACKS.length,18);
  assert.deepEqual(TRACKS.map(t=>t.id),Array.from({length:18},(_,i)=>i+1));
  assert.equal(new Set(TRACKS.map(t=>t.file)).size,18);
  assert(TRACKS.every(t=>t.file.endsWith('.mp3')&&t.duration>100&&t.duration<240));
  assert.equal(TRACKS[10].file,'11- Last Life Last Round.mp3');
  assert.match(albumFileURL(TRACKS[10],'https://example.org/BTM/'),/^https:\/\/example.org\/BTM\/music\/11-%20Last%20Life%20Last%20Round.mp3$/);
});

test('Solo, Pit, BBS, co-op and final-raid cues all resolve to known tracks',()=>{
  const cues=[{kind:'title'},{kind:'lobby'},{kind:'ending'},{kind:'raid'},...Array.from({length:12},(_,stage)=>({kind:'original',stage})),...Array.from({length:12},(_,stage)=>({kind:'pit',stage})),...Array.from({length:24},(_,stage)=>({kind:'coop',stage})),...['deathmatch','team','clan'].map(mode=>({kind:'arena',mode}))];
  assert(cues.every(cue=>TRACKS.some(t=>t.id===soundtrackCue(cue))));
  assert.equal(soundtrackCue({kind:'title'}),15);
  assert.equal(soundtrackCue({kind:'pit',stage:0}),9);
  assert.equal(soundtrackCue({kind:'lobby'}),13);
  assert.equal(soundtrackCue({kind:'raid'}),17);
  assert.equal(soundtrackCue({kind:'raid',finished:true}),18);
});

test('The album is optional and never allocates a media element at import or in offline Node simulation',()=>{
  const engine={ctx:null};
  const deck=new SoundtrackDeck(engine);
  deck.setCue({kind:'pit',stage:9});
  deck.start();
  assert.equal(deck.current,null);
  assert.equal(deck.pending,null);
  deck.configure({soundtrackMode:'procedural'});
  assert.equal(deck.mode,'procedural');
  deck.setCue({kind:'raid'});
  assert.equal(deck.playing,false);
});
