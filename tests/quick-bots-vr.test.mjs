import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/core.js';
import {QuickBotArena,DEFAULT_QUICK_BOTS} from '../src/net/quick-bots.js';
import {createOfflineArena,localFrameAllowed,LOCAL_FRAME_STALE_MS,LOCAL_FRAME_PULSE_MS} from '../src/net/offline-bots.js';
import {neutralInput,TICK_RATE,INPUT_RATE} from '../src/net/protocol.js';
import {OfflineBotClient} from '../src/net/offline-client.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

function mockClient({onMessage,inputRate=INPUT_RATE}){
 return {
  connected:false,id:null,offlineBots:true,actions:new Set(),intent:neutralInput(),inputRate,guardEnabled:false,pulseTimes:[],
  holds:[],commands:[],room:null,player:null,
  async connect(){this.connected=true;},
  hold(enabled){this.holds.push(enabled);return true;},
  enableFrameGuard(enabled){this.guardEnabled=enabled;return true;},
  framePulse(at=0){this.pulseTimes.push(at);return true;},
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
 assert.equal(arena.net.inputRate,TICK_RATE,'native quickplay uses local 30Hz input');
 assert.equal(arena.net.guardEnabled,true,'only host quickplay enables XR stall guard');
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
 assert(arena.net.pulseTimes.length>0,'entering a match rearms the guard');
 assert.equal(arena.framePulse(1200),true);
 assert.equal(arena.net.holds.at(-1),false);
 arena.pause();
 assert.equal(arena.net.holds.at(-1),true);
 assert.equal(arena.game.inputEnabled,false);
 assert.equal(arena.framePulse(1300),false,'paused menus cannot feed playable frame pulses');
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
 assert(worker.includes('!localFrameAllowed(frameGuard,lastFramePulse,now)'));
 assert(app.includes('if(!screen&&vr.active&&arena.ready)arena.framePulse(now);'), 'both immersive and VR Arcade send heartbeats');
 assert(client.includes('hold(enabled){'));
 assert(read('src/net/bbs.js').includes('if(soloBots)net.hold(true)'),
  'the original standalone offline BBS must pause its bots too');
 for(const path of ['scripts/build.mjs','scripts/verify-offline.mjs'])
  assert(read(path).includes("'./src/net/quick-bots.js'"),path+' must cache offline quickplay');
});

test('XR frame freshness is bounded and standalone BBS remains autonomous',()=>{
 assert.equal(LOCAL_FRAME_PULSE_MS,100);
 assert.equal(LOCAL_FRAME_STALE_MS,300);
 assert.equal(localFrameAllowed(false,-Infinity,999999),true,'default BBS never needs a frame pulse');
 assert.equal(localFrameAllowed(true,1000,1000),true);
 assert.equal(localFrameAllowed(true,1000,1299),true);
 assert.equal(localFrameAllowed(true,1000,1300),true);
 assert.equal(localFrameAllowed(true,1000,1301),false,'headset stalled: freeze AI instead of silently attacking');
 assert.equal(localFrameAllowed(true,1000,999),false,'clock regressions are not healthy frames');
 assert.equal(localFrameAllowed(true,-Infinity,1500),false,'no pulse means no simulated combat');
});

test('actual offline client throttles optional pulses, improves native input cadence, and resets on close',()=>{
 const sent=[];
 const client=new OfflineBotClient({inputRate:TICK_RATE});
 assert.equal(client.inputRate,TICK_RATE);
 assert.equal(new OfflineBotClient().inputRate,INPUT_RATE,'normal offline BBS keeps standard input rate');
 client.connected=true;client.worker={postMessage:m=>sent.push(m),terminate:()=>{}};
 assert.equal(client.framePulse(1000),false,'standalone BBS has no XR frame guard');
 assert.equal(client.enableFrameGuard(true),true);
 assert.equal(client.framePulse(1000),true);
 assert.equal(client.framePulse(1040),false,'avoid posting every 72/90Hz XR frame');
 assert.equal(client.framePulse(1100),true);
 assert.deepEqual(sent.map(m=>m.type),['local-frame-guard','local-frame-pulse','local-frame-pulse']);
 client.hold(true);client.hold(false);
 assert.deepEqual(sent.slice(-2).map(m=>m.hold),[true,false]);
 client.disconnect();
 assert.equal(client.frameGuardEnabled,false);
 assert.equal(client.framePulse(1400),false);
});

test('headset stall guard never touches bot rules, LAN protocol, or campaign clocks',()=>{
 const worker=read('src/net/offline-bots-worker.js'),
  quick=read('src/net/quick-bots.js'),renderer=read('src/vr-world-renderer.js');
 assert(worker.includes("message.type==='local-frame-guard'"));
 assert(worker.includes("message.type==='local-frame-pulse'"));
 assert(worker.includes("if(!room||held||!localFrameAllowed(frameGuard,lastFramePulse,now))"));
 assert(worker.includes('acc=0;return;'),'missed frames must never trigger queued catch-up attacks');
 assert(quick.includes('this.net.enableFrameGuard?.(true)'));
 assert(quick.includes('inputRate:TICK_RATE'));
 assert(renderer.includes('this.maxTextureSize=('),'cache the WebGL driver capability query');
 assert(!renderer.includes('g.getParameter?g.getParameter(g.MAX_TEXTURE_SIZE):2048'));
});
