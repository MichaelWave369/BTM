import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {QuickBotArena,DEFAULT_QUICK_BOTS} from '../src/net/quick-bots.js';
import {createOfflineArena} from '../src/net/offline-bots.js';
import {neutralInput} from '../src/net/protocol.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

function mockClient({onMessage}){
 return {
  connected:false,id:null,offlineBots:true,actions:new Set(),intent:neutralInput(),
  holds:[],commands:[],room:null,player:null,
  async connect(){this.connected=true;},
  hold(enabled){this.holds.push(enabled);return true;},
  neutral(){this.intent=neutralInput();},
  send(message){
   this.commands.push(message.type);
   if(message.type==='create'){
    const {room,player}=createOfflineArena(message);
    this.room=room;this.player=player;this.id=player.id;
    onMessage({type:'welcome',id:player.id,code:room.code,seq:0});
    onMessage(room.init());onMessage(room.snapshot(player));
   }else if(message.type==='leave'){this.id=null;onMessage({type:'left'});}
   return true;
  },
  disconnect(){this.connected=false;this.actions.clear();}
 };
}

test('quickplay uses existing real offline arena authority and freezes bots before first player input',async()=>{
 let ready=0,failed=0;
 const arena=new QuickBotArena({makeClient:mockClient,onReady:()=>ready++,onError:()=>failed++});
 const original=new Game();original.start({verticalPreview:true});
 const prior=JSON.stringify(original.snapshot());
 await arena.start();
 assert.equal(ready,1);assert.equal(failed,0);
 assert.equal(arena.net.offlineBots,true);
 assert.equal(arena.net.room.roster().length,4,'one human and three starter bots');
 assert.equal(arena.net.room.roster().filter(p=>p.bot).length,3);
 assert.equal(arena.game.netState?.state,'playing');
 assert.equal(arena.game.inputEnabled,false,'press ENTER first, no surprise bot deaths');
 assert.equal(arena.net.holds.at(-1),true,'local worker is held during VR setup');
 assert.equal(arena.net.address,undefined,'no server endpoint necessary');
 assert.equal(JSON.stringify(original.snapshot()),prior,'solo progress stays untouched');
 assert.deepEqual(DEFAULT_QUICK_BOTS,{nickname:'WAVE',mode:'deathmatch',arena:'no-carrier',bots:3,capacity:4,limit:10});
 assert.deepEqual(arena.net.commands,['create']);
 assert.equal(arena.resume(),true);
 assert.equal(arena.game.inputEnabled,true);
 assert.equal(arena.net.holds.at(-1),false);
 arena.pause();
 assert.equal(arena.net.holds.at(-1),true);
 assert.equal(arena.game.inputEnabled,false);
 arena.close();
 assert.equal(arena.net.connected,false);
 assert.equal(arena.resume(),false,'closed arena cannot restart');
});

test('offline bot rematch is deliberate, never creates a new XR or network connection',async()=>{
 let ready=0,finished=0;
 const arena=new QuickBotArena({makeClient:mockClient,onReady:()=>ready++,onFinished:()=>finished++});
 await arena.start();arena.resume();
 const ended={...arena.net.room.snapshot(arena.net.player),state:'results'};
 arena.receive(ended);
 assert.equal(finished,1);assert.equal(arena.game.inputEnabled,false);
 assert(arena.matchEnded);
 assert.equal(arena.replay(),true);
 assert.equal(ready,2,'new match creates fresh room on same offline client');
 assert.equal(arena.net.connected,true);
 assert.equal(arena.game.inputEnabled,false,'rematch still waits for player to press enter');
 assert.deepEqual(arena.net.commands,['create','leave','create']);
 arena.close();
});

test('active Quest bot quickplay reuses the original XR renderer instead of mounting another BBS document',()=>{
 const app=read('src/main.js'),world=read('src/world-ui.js'),
  html=read('index.html'),worker=read('src/net/offline-bots-worker.js'),client=read('src/net/offline-client.js');
 assert(app.includes("if(bots&&vr.active){void startQuickBots();return;}"));
 assert(app.includes('game:quickArena?.game||game'),'XR data must render arena or solo through same renderer');
 assert(app.includes('if(quickArena){tickQuickBots(now,externalPad,spatial);return;}'));
 assert(app.includes('stepImmersive(bot,spatial,pad,settings,dt'));
 assert(app.includes('function clearQuickWrist()'),'handoff clears wrist UI capture');
 assert(app.includes('ui.wrist.reset();ui.field.close()'));
 assert(app.includes('arena.close();mapOpen=false;clearQuickWrist();'));

 assert(app.includes('onEnd:()=>{if(quickArena){quickArena.close()'));
 const start=app.slice(app.indexOf('async function startQuickBots()'),app.indexOf('function tickQuickBots('));
 assert(start.includes('new QuickBotArena('));
 assert(!start.includes('vr.exit()')&&!start.includes('location.assign('));
 assert(world.includes("data.quickBotsActive?'RETURN SOLO':'SOLO BOTS'"));
 assert(world.includes("data.quickBotsActive?'returnSolo':'bots'"));
 for(const id of ['bot-pause-screen','bot-resume-btn','bot-return-btn','bot-status'])
  assert(html.includes('id="'+id+'"'),id);
 assert(worker.includes("message.type==='local-hold'"));
 assert(worker.includes('if(!room||held){acc=0;return;}'));
 assert(client.includes('hold(enabled){'));
 assert(read('src/net/bbs.js').includes('if(soloBots)net.hold(true)'),
  'the original standalone offline BBS must pause its bots too');
 for(const path of ['scripts/build.mjs','scripts/verify-offline.mjs'])
  assert(read(path).includes("'./src/net/quick-bots.js'"),path+' must cache offline quickplay');
});
