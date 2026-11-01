// Bounded dynamic snapshots; static geometry and descriptors travel once per revision.
const q=n=>Math.round((Number.isFinite(n)?n:0)*1000)/1000;
export function packSeen(seen){let out='';for(let i=0;i<seen.length;i+=8){let n=0;for(let k=0;k<8;k++)if(seen[i+k])n|=1<<k;out+=n.toString(16).padStart(2,'0');}return out;}
export function unpackSeen(value,size=725){const result=Array(size).fill(false);for(let i=0;i<size;i++)result[i]=!!(parseInt(value.slice(Math.floor(i/8)*2,Math.floor(i/8)*2+2),16)&1<<(i%8));return result;}
export function packWorld(g,recipient){const l=g.level;return{format:1,nodes:l.raidNodes||[],palette:l.campaign==='raid'?l.palette:null,
 enemies:l.enemies.map(e=>[e.id,e.type,q(e.x),q(e.y),q(e.hp),e.maxHp,e.dead?1:0,e.phase,q(e.stun),q(e.tell),q(e.walk),q(e.exposed),q(e.ramTime),q(e.lockedAngle),e.attack||'',e.pitBoss||'',e.targetId||'',q(e.pain),q(e.recoil),q(e.flash),e.raidRole||'']),
 items:l.items.map(i=>{const personal=i.claims&&recipient?Math.max(0,45-(i.claims[recipient]||0)):i.remaining??45;return[i.id,i.taken||personal<=0||i.ownerId&&recipient&&i.ownerId!==recipient?1:0,personal];}),doors:Object.values(l.doors).map(d=>[d.x+','+d.y,q(d.open),d.target,!!d.networkLocked]),relays:l.relays.map(r=>[r.id,r.active?1:0]),captives:l.captives.map(c=>[c.id,c.freed?1:0]),key:!!l.key.taken,seen:packSeen(l.seen),
 blasts:(l.blasts||[]).slice(0,8).map(b=>({...b})),projectiles:g.projectiles.slice(0,128).map(b=>({x:q(b.x),y:q(b.y),a:q(b.a),speed:b.speed,enemy:!!b.enemy,color:b.color,height:b.height,vh:b.vh,life:q(b.life)})),ori:g.ori,bassCharge:g.bassCharge,totalFreed:g.totalFreed,totalArtifacts:g.totalArtifacts,liberation:g.liberation,objective:g.objective,exitReady:g.exitReady};}
export function applyWorld(level,w){
 if(w.format!==1||!Array.isArray(w.enemies)||w.enemies.length>128||!Array.isArray(w.items)||w.items.length>128||!Array.isArray(w.projectiles)||w.projectiles.length>128||typeof w.seen!=='string'||w.seen.length!==182)throw Error('Invalid dynamic world');
 const old=new Map(level.enemies.map(e=>[e.id,e]));level.enemies=w.enemies.map(t=>{const e=old.get(t[0])||{};Object.assign(e,{id:t[0],type:t[1],x:t[2],y:t[3],hp:t[4],maxHp:t[5],dead:!!t[6],phase:t[7],stun:t[8],tell:t[9],walk:t[10],exposed:t[11],ramTime:t[12],lockedAngle:t[13],attack:t[14],pitBoss:t[15]||undefined,targetId:t[16],pain:t[17],recoil:t[18],flash:t[19],raidRole:t[20]||undefined});return e;});
 const items=new Map(level.items.map(i=>[i.id,i]));for(const [id,taken,remaining]of w.items){const i=items.get(id);if(i){i.taken=!!taken;i.remaining=remaining;}}
 for(const [id,open,target,networkLocked]of w.doors)if(level.doors[id])Object.assign(level.doors[id],{open,target,networkLocked:!!networkLocked});
 for(const [id,active]of w.relays){const r=level.relays.find(r=>r.id===id);if(r)r.active=!!active;}
 for(const [id,freed]of w.captives){const c=level.captives.find(c=>c.id===id);if(c)c.freed=!!freed;}
 level.key.taken=!!w.key;level.seen=unpackSeen(w.seen);level.blasts=w.blasts;level.raidNodes=w.nodes||[];if(level.campaign==='raid'&&w.palette)level.palette=w.palette;return level;
}

export function raidObjectiveTarget(level,player,raid){
 if(raid.state==='escape')return level.exit;
 if(raid.phase===4&&raid.openUntil>raid.time)return level.enemies.find(e=>e.raidRole==='core'&&!e.dead)||level.exit;
 const choices=raid.phase===1?level.enemies.filter(e=>e.raidRole==='pylon'&&!e.dead):level.raidNodes||[];
 return [...choices].sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||level.exit;
}
