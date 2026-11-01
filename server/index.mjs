// Optional Node host only. Browser/solo bundles never import ws or node:*.
import http from 'node:http';
import {readFile,writeFile,mkdir,rename,stat,readdir} from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {Room} from '../src/net/simulation.js';
import {PROTOCOL,TICK_RATE,SNAPSHOT_RATE,MAX_MESSAGE,TokenBucket,validateMessage,roomCode,nickname} from '../src/net/protocol.js';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url))),secret=()=>randomBytes(24).toString('hex');
const DEFAULT_SAVE_DIR=fileURLToPath(new URL('./data/',import.meta.url));
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=()=>[...randomBytes(8)].map(b=>alphabet[b%alphabet.length]).join('');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf','.png':'image/png','.webmanifest':'application/manifest+json'};
export async function createServer({host='127.0.0.1',port=8787,origins=[],saveDir=DEFAULT_SAVE_DIR,manual=false,finaleEnabled=true,maxRooms=32,maxClients=128}={}){
 const rooms=new Map(),clients=new Set(),ipLimits=new Map(),pendingSaves=new Map(),pendingResumes=new Map();let simClock=0,closing=false,diskTail=Promise.resolve();
 if(path.resolve(saveDir).startsWith(root+path.sep))throw Error('Private cooperative saves must live outside dist');
 await mkdir(saveDir,{recursive:true});
 const httpServer=http.createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/status'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({service:'BTM BBS LAN CLAN',protocol:PROTOCOL,tickRate:TICK_RATE}));return;}
   const pathname=decodeURIComponent(u.pathname),file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep))throw Error('Forbidden');const info=await stat(file);if(!info.isFile())throw Error('Not a file');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; worker-src 'self'; frame-src 'self'"});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Not found. Run npm run build to serve the browser client.');}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:MAX_MESSAGE,perMessageDeflate:false,clientTracking:true});
 httpServer.on('upgrade',(req,socket,head)=>{
  const now=performance.now()/1000,ip=req.socket.remoteAddress||'unknown';if(!ipLimits.has(ip)){if(ipLimits.size>1024){socket.destroy();return;}ipLimits.set(ip,{bucket:new TokenBucket(.5,12),last:now});}const limit=ipLimits.get(ip);limit.last=now;
  let originOK=!req.headers.origin;try{const o=new URL(req.headers.origin);originOK=origins.includes(o.origin)||o.host===req.headers.host;}catch{}
  if(clients.size>=maxClients||req.url!=='/ws'||!originOK||!limit.bucket.take(now)){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 function send(c,message){if(c.ws.readyState!==WebSocket.OPEN)return;if(c.ws.bufferedAmount>262144){c.ws.close(1013,'Slow connection; reconnect');return;}const bytes=JSON.stringify(message);if(Buffer.byteLength(bytes)>262144){c.ws.close(1011,'Snapshot budget exceeded');return;}c.ws.send(bytes);}
 function world(c){if(c.room){send(c,c.room.init());c.revision=c.room.revision;}}
 function welcome(c,a,reconnected=false){send(c,{type:'welcome',protocol:PROTOCOL,id:a.id,code:c.room.code,token:a.token,seq:a.lastSeq,reconnected});world(c);send(c,c.room.snapshot(a));}
 function attach(c,room,a,reconnected=false){for(const other of clients)if(other!==c&&other.room===room&&other.actor===a){other.room=null;other.actor=null;other.ws.close(4001,'Session resumed elsewhere');}c.room=room;c.actor=a;welcome(c,a,reconnected);}
 function detach(c,explicit=false){if(!c.room)return;const room=c.room,a=c.actor;if(explicit&&room.state==='lobby')room.remove(a.id);else room.disconnect(a.id);c.room=c.actor=null;}
 async function resume(c,m){const code=roomCode(m.code);let room=rooms.get(code);if(room){const a=[...room.actors.values()].find(a=>!a.bot&&equal(a.token,m.token));if(!a)throw Error('Invalid resume token');attach(c,room,room.reconnect(a),true);return;}
  if(pendingResumes.has(code)){await pendingResumes.get(code);return resume(c,m);}
  let finish;const gate=new Promise(resolve=>finish=resolve);pendingResumes.set(code,gate);
  try{
  const savedFile=path.join(saveDir,code+'.json');if((await stat(savedFile)).size>2*1024*1024)throw Error('Save too large');const bytes=await readFile(savedFile,'utf8');if(bytes.length>2*1024*1024)throw Error('Save too large');const s=JSON.parse(bytes),a=s.actors?.find(a=>!a.bot&&equal(a.token,m.token));if(!a)throw Error('Saved squad pass required');if(rooms.size>=maxRooms)throw Error('Server room capacity reached');room=new Room({code,mode:'coop',arena:'no-carrier',limit:10,capacity:4,finaleEnabled});room.restore(s);room.owner=a.id;rooms.set(code,room);const actor=room.actors.get(a.id);actor.nickname=nickname(m.nickname);attach(c,room,room.reconnect(actor),true);
  }finally{pendingResumes.delete(code);finish();}
 }
 wss.on('connection',ws=>{
  const c={ws,room:null,actor:null,bucket:new TokenBucket(40,60),bad:0,alive:true,revision:-1,busy:false};clients.add(c);ws.on('pong',()=>c.alive=true);send(c,{type:'hello',protocol:PROTOCOL,tickRate:TICK_RATE,snapshotRate:SNAPSHOT_RATE});
  ws.on('message',async(bytes,binary)=>{
   if(c.busy){ws.close(1008,'Command already pending');return;}const now=manual?simClock+performance.now()/1000:performance.now()/1000;
   if(binary||!c.bucket.take(now)){ws.close(1008,'Message rate exceeded');return;}
   try{const m=validateMessage(bytes.toString('utf8'));
    if(m.type==='ping'){send(c,{type:'pong',id:m.id});return;}
    if(m.type==='leave'){detach(c,true);send(c,{type:'left'});return;}
    if(m.type==='create'){if(c.room)throw Error('Leave the current room first');if(rooms.size>=maxRooms)throw Error('Server room capacity reached');let code;do{code=newCode();}while(rooms.has(code));const room=new Room({...m,code,finaleEnabled});rooms.set(code,room);const owner=room.add({id:secret().slice(0,12),nickname:nickname(m.nickname),token:secret()});for(let i=0;i<(m.bots||0);i++)room.addBot(secret());attach(c,room,owner);return;}
    if(m.type==='join'){if(c.room)throw Error('Leave the current room first');const room=rooms.get(roomCode(m.code));if(!room)throw Error('Room not found');const a=m.token?[...room.actors.values()].find(a=>!a.bot&&equal(a.token,m.token)):null;if(m.token&&!a)throw Error('Reconnect token not recognized');attach(c,room,a?room.reconnect(a):room.add({id:secret().slice(0,12),nickname:nickname(m.nickname),token:secret()}),!!a);return;}
    if(m.type==='resume'){if(c.room)throw Error('Leave the current room first');c.busy=true;try{await resume(c,m);}finally{c.busy=false;}return;}
    if(!c.room||!c.actor)throw Error('Join a room first');if(m.type==='input'){if(!c.room.input(c.actor,m)){c.lastReject={seq:m.seq,last:c.actor.lastSeq,queue:c.actor.actions.length,status:c.actor.status};c.bad++;if(c.bad>12)ws.close(1008,'Stale/overflow input');}else c.bad=Math.max(0,c.bad-.25);return;}
    if(m.type==='lobby'&&!c.room.competitive)await saveRoom(c.room);
    if(m.type==='save'){if(c.room.competitive)throw Error('Only co-op campaigns have host saves');if(!await saveRoom(c.room))throw Error('No living campaign checkpoint can be saved in this state');send(c,{type:'saved'});return;}
    c.room.command(c.actor,m);
   }catch(e){send(c,{type:'error',message:e.code==='ENOENT'?'Saved campaign not found':String(e.message).slice(0,160)});if(++c.bad>16)ws.close(1008,'Protocol errors');}
  });
  ws.on('close',()=>{clients.delete(c);detach(c);});ws.on('error',()=>{});
 });
 async function saveRoom(room){
  if(room.competitive||room.state==='lobby'||room.state==='wipe')return false;
  if(pendingSaves.has(room.code)){await pendingSaves.get(room.code);return saveRoom(room);}
  const checkpoint=room.checkpoint();if(!checkpoint)return false;
  const bytes=JSON.stringify(checkpoint),file=path.join(saveDir,room.code+'.json'),temp=file+'.tmp';
  if(Buffer.byteLength(bytes)>2*1024*1024)throw Error('Host checkpoint exceeds 2 MiB');
  const promise=diskTail.catch(()=>{}).then(async()=>{
   const names=(await readdir(saveDir)).filter(n=>/^[A-Z2-9]{8}\.json$/.test(n));
   if(!names.includes(room.code+'.json')&&names.length>=128)throw Error('Host checkpoint capacity reached');
   const sizes=await Promise.all(names.filter(n=>n!==room.code+'.json').map(async n=>(await stat(path.join(saveDir,n))).size));
   if(sizes.reduce((a,b)=>a+b,0)+Buffer.byteLength(bytes)>32*1024*1024)throw Error('Host checkpoint storage budget reached');
   await writeFile(temp,bytes,{mode:0o600});await rename(temp,file);return true;
  }).finally(()=>pendingSaves.delete(room.code));diskTail=promise;
  pendingSaves.set(room.code,promise);return promise;
 }
 function autosave(room){void saveRoom(room).catch(()=>{room.dirty=true;room.event('saveError',{text:'Host checkpoint could not be written; session remains live'});});}
 function broadcast(){for(const c of clients)if(c.room){if(c.revision!==c.room.revision)world(c);send(c,c.room.snapshot(c.actor));}}
 let last=performance.now(),acc=0,lastSnapshot=0,saveClock=0;
 function step(){simClock+=1/TICK_RATE;for(const room of rooms.values()){room.step(1/TICK_RATE);room.advanceIntermission(1/TICK_RATE);}if(++lastSnapshot>=TICK_RATE/SNAPSHOT_RATE){lastSnapshot=0;broadcast();}
  if(++saveClock>=TICK_RATE*5){saveClock=0;for(const room of rooms.values())if(room.dirty){room.dirty=false;autosave(room);}}
  for(const [code,room]of rooms)if(![...room.actors.values()].some(a=>a.connected&&!a.bot)&&room.elapsed-Math.max(0,...[...room.actors.values()].map(a=>a.disconnectedAt||0))>120){autosave(room);rooms.delete(code);}
 }
 const timer=manual?null:setInterval(()=>{const now=performance.now();acc+=Math.min(.25,(now-last)/1000);last=now;let n=0;while(acc>=1/TICK_RATE&&n++<8){step();acc-=1/TICK_RATE;}},1000/TICK_RATE/2);
 const heartbeat=setInterval(()=>{for(const c of clients){if(!c.alive){c.ws.terminate();continue;}c.alive=false;c.ws.ping();}const now=performance.now()/1000;for(const [ip,v]of ipLimits)if(now-v.last>180)ipLimits.delete(ip);},15000);heartbeat.unref();
 await new Promise((resolve,reject)=>{httpServer.once('error',reject);httpServer.listen(port,host,resolve);});
 return{httpServer,wss,rooms,clients,step,broadcast,saveRoom,address:httpServer.address(),async close(){if(closing)return;closing=true;clearInterval(timer);clearInterval(heartbeat);await Promise.allSettled([...rooms.values()].map(room=>saveRoom(room)));await Promise.allSettled([...pendingSaves.values()]);for(const c of clients)c.ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>httpServer.close(r));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),value=(key,fallback)=>{const i=args.indexOf(key);return i>=0?args[i+1]:fallback;};
 const host=value('--host','127.0.0.1'),port=Number(value('--port',process.env.PORT||8787)),origins=args.flatMap((v,i)=>v==='--origin'?[args[i+1]]:[]);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
 const server=await createServer({host,port,origins,saveDir:path.resolve(value('--save-dir',DEFAULT_SAVE_DIR))});console.log('BTM BBS LAN CLAN listening on http://'+host+':'+server.address.port+' / ws endpoint /ws');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void server.close().then(()=>process.exit(0)));
}
