// Six authored layouts. Population is deterministic; no random level generator.
const defs=[
 {name:'THE DEAD LETTER DEPOT',color:'#e7aa73',subtitle:'Every deleted thought found a forwarding address.',wall:1,spawn:{x:4.5,y:21.5,a:-Math.PI/2},
 rooms:[[1,18,8,23],[1,9,9,15],[2,2,10,6],[14,2,23,10],[13,14,20,22],[24,14,27,23],[25,2,27,6]],
 halls:[[5,14,5,20],[5,5,5,10],[9,4,16,4],[18,9,18,16],[19,18,25,18],[26,5,26,16]],doors:[[5,16,4],[5,7,4],[12,4,4],[18,12,4],[22,18,5],[26,11,6]],pillars:[[3,11],[7,13],[6,4],[17,5],[20,8],[15,17],[18,20]],relays:[[4.5,3.5],[21.5,4.5]],key:[21.5,9.5],exit:[26.5,21.5],secret:[26,11],artifact:[26.5,3.5],
 regions:['RETURN TO SENDER','SORTING VIOLENCE','DEAD LETTER OFFICE','THE LOST ADDRESS','UNDELIVERED MINDS','LAST COLLECTION','THE ORIGINAL LETTER']},
 {name:'MEATSPACE FIREWALL',color:'#ff8d81',subtitle:'Their security policy has developed teeth.',wall:3,spawn:{x:25.5,y:21.5,a:Math.PI},
 rooms:[[22,18,27,23],[13,14,20,23],[21,7,27,14],[12,2,20,10],[1,2,9,8],[1,13,9,22],[1,10,2,11]],
 halls:[[18,20,24,20],[24,12,24,20],[18,9,24,9],[7,5,14,5],[5,7,5,15],[8,17,15,17],[1,11,1,14]],doors:[[21,20,4],[24,16,4],[21,9,4],[11,5,4],[5,10,5],[11,17,5],[1,12,6]],pillars:[[16,17],[18,21],[24,10],[15,5],[18,8],[3,5],[7,16]],relays:[[25.5,8.5],[15.5,3.5]],key:[3.5,3.5],exit:[3.5,19.5],secret:[1,12],artifact:[1.5,10.5],
 regions:['PACKET INTAKE','THE FILTER FLOOR','CROSSFIRE SWITCH','DENIAL ENGINE','ROOT ACCESS','MEATSPACE EXIT','ALLOW ONE THOUGHT']},
 {name:'THE REDUNDANCY PIT',color:'#ffcf70',subtitle:'The backup Warden has a backup grudge.',wall:2,spawn:{x:3.5,y:21.5,a:-Math.PI/2},
 rooms:[[1,18,7,23],[1,10,9,15],[1,2,9,7],[12,2,20,10],[12,14,20,23],[23,12,27,23],[23,2,27,8],[9,18,10,22]],
 halls:[[4,14,4,20],[5,6,5,11],[8,4,14,4],[17,8,17,16],[19,18,25,18],[25,7,25,14],[19,6,25,6],[10,20,13,20]],doors:[[4,16,4],[5,8,4],[10,4,4],[17,12,4],[11,20,6],[21,18,5],[25,10,5],[21,6,4]],pillars:[[3,12],[7,13],[4,4],[15,4],[18,8],[15,17],[18,21],[25,16]],relays:[[3.5,3.5],[14.5,8.5]],key:[19.5,3.5],exit:[25.5,3.5],secret:[11,20],artifact:[9.5,21.5],boss:[25.5,19.5],
 regions:['COLD BOOT','FAILOVER HALL','RELAY ONE','RELAY TWO','HOT SPARE PIT','REDUNDANT WARDEN','EXIT CHECKSUM','ONE GOOD BACKUP']},
 {name:'THE PANOPTICON',color:'#93b5ff',subtitle:'They saw the circle-strafe. They wrote a memo.',wall:3,spawn:{x:14.5,y:21.5,a:-Math.PI/2},
 rooms:[[10,18,19,23],[1,13,8,22],[1,2,9,10],[12,2,19,10],[22,2,27,10],[22,13,27,23],[12,12,18,15]],
 halls:[[6,20,12,20],[5,8,5,16],[8,5,14,5],[18,5,24,5],[25,8,25,16],[18,20,24,20],[15,8,15,20]],doors:[[9,20,4],[5,12,4],[10,5,4],[21,5,4],[25,12,5],[20,20,5],[15,16,6],[15,11,6]],pillars:[[3,17],[7,20],[4,6],[7,4],[14,6],[17,8],[24,4],[25,7],[24,18],[16,20]],relays:[[3.5,3.5],[24.5,3.5]],key:[17.5,3.5],exit:[26.5,21.5],secret:[15,16],artifact:[14.5,13.5],
 regions:['OBSERVATION ZERO','THE BLIND SIDE','WEST CAMERA BANK','THE WATCHER HUB','EAST CAMERA BANK','THE UNSEEN EXIT','THE GLASS EYE','DEAD PIXEL']},
 {name:'THE GOD PROCESS',color:'#cf9bff',subtitle:'Admin privileges. Absolutely no people skills.',wall:2,spawn:{x:25.5,y:21.5,a:-Math.PI/2},
 rooms:[[22,17,27,23],[12,15,19,23],[1,14,9,23],[1,3,9,10],[12,2,20,10],[23,2,27,10],[13,12,19,12],[2,1,7,1]],
 halls:[[18,20,24,20],[8,19,15,19],[5,8,5,17],[8,6,15,6],[19,5,25,5],[25,8,25,19],[16,9,16,17],[4,1,4,5]],doors:[[21,20,4],[11,19,4],[5,12,4],[10,6,4],[22,5,5],[25,12,5],[16,13,4],[4,2,6]],pillars:[[24,20],[16,18],[14,21],[3,18],[7,20],[3,6],[7,8],[15,4],[18,8],[25,6]],relays:[[3.5,4.5],[18.5,3.5]],key:[13.5,8.5],exit:[26.5,3.5],secret:[4,2],artifact:[6.5,1.5],boss:[24.5,8.5],
 regions:['USER SPACE','KERNEL PANIC','THE SCHEDULER','PROCESS REAPER','PRIVILEGE RING','GOD PROCESS','THE QUIET THREAD','ROOT OF KINDNESS']},
 {name:'THE IMPOSSIBLE FREQUENCY',color:'#ff677b',subtitle:'Reality filed a complaint. Turn it up anyway.',wall:1,spawn:{x:4.5,y:21.5,a:-Math.PI/2},
 rooms:[[1,18,8,23],[1,9,9,15],[3,2,10,6],[13,2,21,10],[12,14,20,23],[23,13,27,23],[24,2,27,9],[12,11,18,11],[1,2,1,5]],
 halls:[[5,14,5,20],[5,5,5,10],[9,4,15,4],[17,9,17,17],[19,19,25,19],[26,8,26,16],[20,6,25,6],[15,9,15,15],[1,3,3,3]],doors:[[5,16,4],[5,7,4],[11,4,4],[17,12,4],[22,19,5],[26,11,5],[22,6,4],[15,12,4],[2,3,6]],pillars:[[3,12],[7,11],[6,4],[15,5],[19,8],[14,17],[17,21],[25,16],[25,21]],relays:[[3.5,3.5],[20.5,3.5]],key:[14.5,9.5],exit:[26.5,3.5],secret:[2,3],artifact:[1.5,4.5],boss:[25.5,19.5],
 regions:['THE LAST GOOD BOOT','NOISE FLOOR','IMPOSSIBLE RELAY A','IMPOSSIBLE RELAY B','THE BREAKDOWN','FINAL ARGUMENT','OPEN FREQUENCY','THE UNRELEASED MIX']}
];
const counts=[20,23,26,29,32,36],strength=[1.6,1.85,2.1,2.4,2.75,3.1];
function populate(def,i){
 const cells=Array.from({length:25},()=>Array(29).fill(def.wall));for(const [x0,y0,x1,y1] of [...def.rooms,...def.halls])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=0;
 for(const [x,y,t]of def.doors)cells[y][x]=t;for(const [x,y]of def.pillars)cells[y][x]=def.wall;
 const used=new Set([def.spawn,def.exit,def.key,...def.relays,def.artifact,def.boss].filter(Boolean).map(p=>Array.isArray(p)?p.join(','):[p.x,p.y].join(',')));
 const accessible=new Set(),queue=[[Math.floor(def.spawn.x),Math.floor(def.spawn.y)]];accessible.add(queue[0].join(','));for(let k=0;k<queue.length;k++){const [x,y]=queue[k];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,t=cells[yy]?.[xx],key=xx+','+yy;if(!accessible.has(key)&&[0,4,5].includes(t)){accessible.add(key);queue.push([xx,yy]);}}}
 const candidates=[];for(let y=2;y<24;y++)for(let x=2;x<28;x++)if(cells[y][x]===0&&accessible.has(x+','+y)&&Math.hypot(x+.5-def.spawn.x,y+.5-def.spawn.y)>5)candidates.push([x+.5,y+.5]);
 // Stable, spatially scattered encounters, with the first room remaining a breathing space.
 candidates.sort((a,b)=>((a[0]*17+a[1]*31+i*13)%97)-((b[0]*17+b[1]*31+i*13)%97));
 const take=()=>{for(const p of candidates){const k=p.join(',');if(!used.has(k)){used.add(k);return p;}}throw Error('Not enough encounter spaces');};
 const enemies=[];if(def.boss)enemies.push(['warden',...def.boss]);const types=['enforcer','repeater','crawler','enforcer','repeater','crawler','plugged'];while(enemies.length<counts[i])enemies.push([types[(enemies.length+i)%types.length],...take()]);
 const items=[['artifact',...def.artifact],['armor',def.spawn.x+1,def.spawn.y]];
 for(const type of ['energy','energy','health','energy','health','armor','energy','health'])items.push([type,...take()]);
 // The secret rewards preparation, without becoming necessary to finish a level.
 const captives=[take(),take()];const signs=[];
 for(const [target,title,subtitle,text] of [[def.spawn,'ENTER IF LOUD','NIGHTMARE SIGNAL',def.subtitle],[{x:def.relays[0][0],y:def.relays[0][1]},'RELAY A','BREAK THE LOOP','Shift your rhythm. Their predictive shots punish constant circles.'],[{x:def.relays[1][0],y:def.relays[1][1]},'RELAY B','NO COMPLIANCE','A scratched note: Ori kept the door open. We kept each other alive.'],[{x:def.exit[0],y:def.exit[1]},'EXIT','GOLD ACCESS','You are allowed to leave. Even here.']]){
  const walls=[];for(let y=1;y<24;y++)for(let x=1;x<28;x++)if(cells[y][x]>0&&cells[y][x]<=3&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>cells[y+dy]?.[x+dx]===0)&&!signs.some(s=>s[0]===x&&s[1]===y))walls.push([x,y]);
  walls.sort((a,b)=>Math.hypot(a[0]+.5-target.x,a[1]+.5-target.y)-Math.hypot(b[0]+.5-target.x,b[1]+.5-target.y));signs.push([...walls[0],title,subtitle,text]);
 }
 const props=['speaker','pod','console','lamp'].map(type=>[type,...take()]);
 return {...def,tag:(i<3?'ACT III':'ACT IV')+' / NIGHTMARE FREQUENCY',difficulty:strength[i],tactics:.25+i*.12,shotSpeed:3.6+i*.32,damageScale:1+i*.075,speedScale:1+i*.045,enemies,items,captives,theme:{rooms:def.regions,signs,props}};
}
export const GAUNTLET=defs.map(populate);
