import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('free Windows host binds to loopback, uses existing BBS authority and saves outside public dist',()=>{
 const host=read('scripts/start-bbs-home.ps1');
 assert(host.includes("('127.0.0.1'")===false); // inspect explicit CLI args below
 assert(host.includes("'--host','127.0.0.1'"),'no public listener or router port forwarding');
 assert(host.includes("Join-Path ([Environment]::GetFolderPath('LocalApplicationData'))"),
  'private co-op checkpoints belong in user app data, not public repo');
 assert(host.includes("'BTM\\BBS-Saves'"));
 assert(host.includes('npm.cmd ci --prefix server --omit=dev --ignore-scripts'));
 assert(host.includes('npm.cmd run build'));
 assert(host.includes('& node @arguments'),'must start the real server with the same CLI as production');
 assert(host.includes("'https://michaelwave369.github.io'"));
 assert(host.includes("'https://www.enterthefield.org'"));
 assert(!host.includes("'--host','0.0.0.0'"));
 assert(!host.includes('New-NetFirewallRule'));
 assert(!host.includes('netsh interface portproxy'));
});

test('free tunnel playbook uses public HTTPS/secure WebSockets and explicit shutdown',()=>{
 const guide=read('docs/bbs-lan-clan/free-windows-home-server.md');
 assert(guide.includes('tailscale funnel --bg 8787'));
 assert(guide.includes('tailscale funnel --https=443 off'));
 assert(guide.includes('tailscale funnel status'));
 assert(guide.includes('wss://YOUR-ACTUAL-HOSTNAME.ts.net/ws'));
 assert(guide.includes('https://michaelwave369.github.io/BTM/'));
 assert(guide.includes('%LOCALAPPDATA%\\BTM\\BBS-Saves'));
 assert(guide.includes('127.0.0.1:8787/status'));
 assert(guide.includes('bandwidth limits'));
 assert(guide.includes('your PC')||guide.includes('Your PC'));
 assert(guide.includes('never')||guide.includes('Never'));
 assert(guide.includes('NO')||guide.includes('no'));
});
