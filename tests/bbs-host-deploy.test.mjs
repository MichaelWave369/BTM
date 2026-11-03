import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trustedHostOrigins} from '../server/host-config.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('public BBS browser origin allowlist uses exact HTTP(S) origin matching',()=>{
 assert.deepEqual(trustedHostOrigins('https://michaelwave369.github.io, https://www.enterthefield.org'),[
  'https://michaelwave369.github.io','https://www.enterthefield.org'
 ]);
 assert.deepEqual(trustedHostOrigins('https://www.enterthefield.org, https://www.enterthefield.org',[
  'https://enterthefield.org','http://localhost:5187'
 ]),['https://www.enterthefield.org','https://enterthefield.org','http://localhost:5187']);
 assert.deepEqual(trustedHostOrigins(),[]);
 for(const bad of ['*','*.enterthefield.org','wss://play.enterthefield.org',
  'https://www.enterthefield.org/games/btm','https://a.example?bad=1',
  'https://attacker:password@example.org','not a valid origin'])
  assert.throws(()=>trustedHostOrigins(bad),/origin/i,bad);
});

test('production BBS host accepts Railway dynamic port and site origins without weakening socket checks',()=>{
 const server=read('server/index.mjs');
 assert(server.includes("process.env.PORT||8787"),'must use platform-assigned port');
 assert(server.includes("process.env.BTM_ALLOWED_ORIGINS||''"));
 assert(server.includes('trustedHostOrigins('));
 assert(server.includes("req.url!=='/ws'||!originOK"),
  'only explicit websocket path and trusted origins may upgrade');
 assert(server.includes("u.pathname==='/status'"),'ready health endpoint for hosting provider');
 assert(server.includes("path.join(saveDir,room.code+'.json')"),
  'co-op checkpoints must remain on the mounted persistent volume');
});

test('Docker startup fixes mounted volume ownership and drops privileges, with Railway PORT support',()=>{
 const docker=read('deploy/bbs/Dockerfile'),entry=read('deploy/bbs/entrypoint.sh');
 const compose=read('deploy/bbs/compose.yaml');
 assert(docker.includes('apk add --no-cache su-exec'));
 assert(docker.includes('ENTRYPOINT ["/usr/local/bin/btm-entrypoint"]'));
 assert(!docker.includes(' "--port", "8787"'),'container default must not force fixed port');
 assert(entry.includes('chown node:node /saves'));
 assert(entry.includes('exec su-exec node "$@"'));
 assert(compose.includes('btm-saves:/saves'),'existing VPS persist volume still works');
 assert(compose.includes('caddy-data:/data'),'existing Caddy TLS state is still durable');
});
