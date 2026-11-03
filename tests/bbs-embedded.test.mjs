import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('BBS and solo bot menu enter a same-page portal, never navigate the game away',()=>{
 const app=read('src/main.js'),html=read('index.html');
 for(const name of ['bbs-portal','bbs-portal-frame','bbs-portal-close','bbs-btn','solo-bots-btn'])
  assert(html.includes('id="'+name+'"'),name+' must exist');
 assert(html.includes('aria-modal="true"'),'portal must expose dialog semantics');
 assert(html.includes('allow="xr-spatial-tracking; fullscreen"'),
  'embedded multiplayer must request XR permissions explicitly');
 assert(app.includes("bbsFrame.src='./bbs.html?embedded=1'+(bots?'#solo-bots':'')"));
 assert(app.includes("if(game.mode==='playing')pause()"));
 assert(app.includes("if(vr.active)await vr.exit()"));
 assert(app.includes("if($('bbs-portal').hidden)tick(now);else lastFrame=now"),
  'background solo game must not consume multiplayer gamepad input');
 assert(app.includes("bbsFrame.src='about:blank'"),'closing must unload network session');
 assert(!app.includes("window.location.assign('./bbs.html"),
  'BBS must not navigate the browser away from the game');
});

test('embedded lobby provides its own return-to-game button with same-origin parent messaging',()=>{
 const html=read('public/bbs.html'),bbs=read('src/net/bbs.js'),
  app=read('src/main.js'),css=read('src/net/bbs.css');
 assert(html.includes('id="bbs-return"'));
 assert(bbs.includes("new URLSearchParams(location.search).get('embedded')==='1'"));
 assert(bbs.includes("window.parent.postMessage({type:'btm:bbs:close'},location.origin)"));
 assert(app.includes('event.origin!==location.origin'));
 assert(app.includes('event.source!==bbsFrame.contentWindow'));
 assert(css.includes('body.embedded-bbs'));
 assert(bbs.includes("const soloBots=location.hash==='#solo-bots'"),
  'offline bots must still be selectable through the embedded URL fragment');
 assert(html.includes('src="./src/net/bbs.js"'),'standalone BBS entrypoint must still work');
});

test('BBS production WSS suggestion does not replace a saved custom server or LAN dev',()=>{
 const bbs=read('src/net/bbs.js');
 assert(bbs.includes("if(pref.address)$('server-url').value=pref.address"));
 assert(bbs.includes("location.hostname.endsWith('.enterthefield.org')"));
 assert(bbs.includes("'wss://play.enterthefield.org/ws'"));
 assert(bbs.includes("location.hostname.endsWith('.app.github.dev')"));
 assert(bbs.includes("'//'+location.host+'/ws'"));
});

test('portable WSS host keeps authoritative Node server private and co-op saves durable',()=>{
 const compose=read('deploy/bbs/compose.yaml'),caddy=read('deploy/bbs/Caddyfile'),
  docker=read('deploy/bbs/Dockerfile'),ignore=read('.dockerignore');
 assert(compose.includes('https://www.enterthefield.org'));
 assert(compose.includes('https://michaelwave369.github.io'));
 assert(compose.includes('btm-saves:/saves'));
 assert(compose.includes('restart: unless-stopped'));
 assert(!compose.includes('8787:8787'),'only the TLS reverse proxy should be exposed');
 assert(caddy.includes('reverse_proxy @websocket btm:8787'));
 assert(caddy.includes('reverse_proxy @status btm:8787'));
 assert(docker.includes('npm ci --prefix server --omit=dev --ignore-scripts'));
 assert(docker.includes('USER node'));
 assert(ignore.includes('server/data/'),'private co-op checkpoints cannot enter build image');
});

test('existing browser-offline service worker still precaches embedded BBS entrypoints',()=>{
 const build=read('scripts/build.mjs'),check=read('scripts/verify-offline.mjs');
 for(const entry of ["'./bbs.html'","'./src/net/bbs.js'","'./src/net/bbs.css'"]){
  assert(build.includes(entry),entry+' must be in offline shell');
 }
 assert(check.includes("'./src/net/bbs.js'"));
});
