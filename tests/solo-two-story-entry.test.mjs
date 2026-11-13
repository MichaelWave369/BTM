import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {writeCampaignCheckpoint} from '../src/campaign-storage.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('the two-story field test has a visible, controller-selectable opt-in menu action',()=>{
 assert.match(html,/<button id="two-story-btn" class="arcade-choice secondary-button">/);
 assert.match(html,/<b>TWO-STORY FIELD TEST<\/b>/);
 assert.match(html,/12 upper decks · experimental · no disk saves/);
 assert.match(main,/\$\('two-story-btn'\)\.addEventListener\('click',\(\)=>\{play\(true,true\)/);
 assert.match(main,/function play\(fresh=false,verticalPreview=SOLO_MEZZANINE_PREVIEW\)/);
 assert.match(main,/\$\('start-btn'\)\.addEventListener\('click',\(\)=>play\(true\)\)/);
});
test('explicit two-story preview is isolated from standard saves and original geometry',()=>{
 const normal=new Game();normal.start();
 const preview=new Game();preview.start({verticalPreview:true});
 assert.equal(normal.verticalPreview,false);
 assert.equal(normal.level.vertical,undefined);
 assert.equal(preview.verticalPreview,true);
 assert.equal(preview.level.vertical.soloPreview,true);
 const storage={writes:0,setItem(){this.writes++;}};
 assert.throws(()=>writeCampaignCheckpoint(storage,preview),/Preview/i);
 assert.equal(storage.writes,0);
 const ordinary=normal.snapshot();
 assert.equal('totalUplinks' in ordinary,false);
});
test('preview-only pause navigation samples later floors without creating canonical saves',()=>{
 assert.match(html,/<button id="two-story-next-btn" class="secondary-button" hidden>/);
 assert.match(main,/\$\('two-story-next-btn'\)\.hidden=!game\.verticalPreview\|\|game\.levelIndex>=SECTORS\.length-1/);
 assert.match(main,/game\.loadLevel\(next,false\);mapOpen=false;play\(\)/);
 const g=new Game();g.start({verticalPreview:true});
 for(let i=1;i<12;i++){
  g.loadLevel(i,false);
  assert.equal(g.levelIndex,i);
  assert.equal(g.level.vertical.soloPreview,true);
  assert(g.level.upperUplink);
  assert.equal(g.player.health,100,'test sector should begin with fresh health');
 }
 const storage={writes:0,setItem(){this.writes++;}};
 assert.throws(()=>writeCampaignCheckpoint(storage,g),/Preview/i);
 assert.equal(storage.writes,0);
});
test('preview HUD identifies the current story without changing game state',()=>{
 assert.match(main,/p\.supportSurface==='upper'\?'UPPER DECK'/);
 assert.match(main,/p\.supportSurface==='ramp'\?'RAMP':'GROUND FLOOR'/);
 assert.match(main,/game\.verticalPreview\?' \/ TWO-STORY PREVIEW'/);
});
