// Browser-only review workflow. Port forwarding remains private until the human changes it.
import{createServer}from'../server/index.mjs';
const name=process.env.CODESPACE_NAME,domain=process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN,origins=name&&domain?['https://'+name+'-8787.'+domain]:[];
const server=await createServer({host:'0.0.0.0',port:8787,origins});
console.log('BTM browser review ready on port 8787. Open /bbs.html in two separate browser profiles.');
if(origins[0])console.log('Server address: '+origins[0].replace('https:','wss:')+'/ws');
for(const signal of['SIGINT','SIGTERM'])process.once(signal,()=>void server.close().then(()=>process.exit(0)));
