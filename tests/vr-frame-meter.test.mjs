import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {XRFrameMeter} from '../src/vr-frame-meter.js';
import {QuickBotArena} from '../src/net/quick-bots.js';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('XR callback meter reports bounded rolling cadence, not assumed GPU FPS',()=>{
 const meter=new XRFrameMeter(90);
 assert.deepEqual(meter.snapshot(),{fps:0,avgMs:0,peakMs:0,spikes:0,samples:0});
 for(let i=0;i<60;i++)meter.record(i*1000/72);
 const healthy=meter.snapshot();
 assert(healthy.samples>20);
 assert(healthy.fps>=71&&healthy.fps<=73);
 assert(healthy.avgMs>=13.8&&healthy.avgMs<=14.0);
 assert(healthy.peakMs<15&&healthy.spikes===0);
 const t=59*1000/72;
 meter.record(t+125);
 for(let i=1;i<31;i++)meter.record(t+125+i*1000/72);
 const stalled=meter.snapshot();
 assert(stalled.peakMs>=125,'a delayed callback is visible rather than silently clamped away');
 assert(stalled.spikes>=1,'the frame window reports severe callback interruptions');
 assert(stalled.samples<=90,'the meter is a finite ring, not a growing log');
 meter.record(3500);
 assert.equal(meter.snapshot().samples,0,'long headset suspension resets stale history');
 assert.equal(meter.snapshot().fps,0);
 meter.record(Number.NaN);
 assert.equal(meter.snapshot().fps,0);
 meter.reset();assert.equal(meter.snapshot().samples,0);
 assert.throws(()=>new XRFrameMeter(0),/Invalid XR frame window/);
});

test('local bot snapshot diagnostics expose transport timing without mutating combat',()=>{
 const arena=new QuickBotArena();
 assert.deepEqual(arena.telemetry(1000),{gapMs:0,peakMs:0,ageMs:0});
 arena.recordSnapshot(1000);
 arena.recordSnapshot(1100);
 arena.recordSnapshot(1300);
 assert.deepEqual(arena.telemetry(1340),{gapMs:120,peakMs:200,ageMs:40});
 assert.equal(arena.game.mode,'paused','recording a snapshot time cannot start combat');
 assert.equal(arena.net.connected,false,'no server, worker or connection created by telemetry');
});

test('only opted-in VR diagnostics display XR and local bot delivery timing',()=>{
 const vr=source('src/vr.js'),ui=source('src/world-ui.js'),app=source('src/main.js');
 const build=source('scripts/build.mjs'),offline=source('scripts/verify-offline.mjs');
 assert(vr.includes('this.frameMeter=new XRFrameMeter()'));
 assert(vr.includes('this.frameMeter.record(now)'));
 assert(vr.includes('data.xrTiming=this.frameMeter.snapshot()'));
 assert(vr.includes('this.frameMeter.reset()'),'XR visibility, reentry, and exit reset stale samples');
 assert(ui.includes('data.settings?.vrDiagnostics&&data.quickBotsActive&&data.xrTiming'));
 assert(ui.includes('XR CALLBACK '));
 assert(ui.includes('BOT GAP '));
 assert(ui.includes('CPU '));
 assert(app.includes('botTiming:quickArena?.telemetry()'));
 assert(build.includes("'./src/vr-frame-meter.js'"));
 assert(offline.includes("'./src/vr-frame-meter.js'"));
 for(const banned of ['WebSocket','fetch(','localStorage','sessionStorage','postMessage'])
  assert(!source('src/vr-frame-meter.js').includes(banned),'telemetry must be offline and side-effect free: '+banned);
});
