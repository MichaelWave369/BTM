// The Twelve Trials: authored layouts and deterministic, room-specific encounters.
// A separate registry: never appended to the original SECTORS or ΦWAD table.
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export const PIT_ACTS=[
 {name:'THE DESCENT',primary:'#ffb45e',accent:'#80e8d4',fog:[.027,.017,.01],hazard:'vent',difficulty:1,speed:1,damage:1,tactics:.16},
 {name:'THE SUFFERING',primary:'#64caff',accent:'#ff718e',fog:[.008,.019,.033],hazard:'arc',difficulty:1.25,speed:1.08,damage:1.18,tactics:.29},
 {name:'THE FRACTURE',primary:'#cd92ff',accent:'#7ef5ff',fog:[.024,.011,.036],hazard:'fracture',difficulty:1.5,speed:1.16,damage:1.4,tactics:.43},
 {name:'NO WAY OUT',primary:'#ff667d',accent:'#ffc96e',fog:[.025,.008,.016],hazard:'void',difficulty:1.75,speed:1.24,damage:1.62,tactics:.58}
].map((a,i)=>Object.freeze({...a,index:i,glow:Object.freeze([...rgb(a.primary),1]),secondary:Object.freeze([...rgb(a.accent),1])}));
export const PIT_BOSSES=Object.freeze({
 gatekeeper:{name:'GATEKEEPER',hp:390,color:'#ffb45e',tip:'Bash its brace. Strafe the ram. Shoot the exposed amber core.',weakness:'BASH BRACE / PUNISH RECOVERY'},
 tyrant:{name:'STATIC TYRANT',hp:490,color:'#64caff',tip:'Move off marked ground. Find gaps in the ring. Ori grounds its shield.',weakness:'ORI GROUNDS / SHOOT AFTER VOLLEY'},
 mirror:{name:'MIRROR ENGINE',hp:570,color:'#cd92ff',tip:'The bright core is real. Closed mirrors return a slow bolt. Slap or Ori shatters its guard.',weakness:'SLAP MIRROR / PUNISH DARK CORE'},
 abyss:{name:'THE PIT ITSELF',hp:700,color:'#ff667d',tip:'Leave the marked floor. Change rhythm for the charge. The core opens after every attack.',weakness:'BREAK CHANNEL / PUNISH OPEN CORE'}
});
// Each level has its own traversal graph, sight lines, refuge, and arena silhouette.
const layouts=[
 {name:'FIRST FALL',subtitle:'The first step is voluntary. The next one is yours to earn.',spawn:[4.5,21.5,-Math.PI/2],
  rooms:[[1,18,8,23],[1,9,9,15],[2,2,10,6],[13,3,21,11],[21,15,27,23],[24,3,27,10]],halls:[[4,14,5,20],[5,5,5,10],[9,4,15,4],[17,10,17,19],[17,18,23,19],[25,9,25,17]],pillars:[[3,11],[8,13],[16,6],[19,9]],relays:[[4.5,3.5],[18.5,5.5]],key:[18.5,9.5],exit:[25.5,20.5],hazards:[[5.5,12.5],[17.5,14.5]],groups:[[1,'pp'],[2,'pr'],[3,'re'],[4,'e']],identity:'FALL SHAFT / BRONZE INTAKE'},
 {name:'STARVING CIRCUIT',subtitle:'The magazine is a promise. Spend it carefully.',spawn:[25.5,21.5,Math.PI],
  rooms:[[22,18,27,23],[12,16,19,23],[21,7,27,14],[11,2,19,11],[1,2,8,8],[1,13,8,22]],halls:[[18,20,24,20],[24,12,24,20],[18,9,24,9],[7,5,13,5],[4,7,4,16],[7,18,14,18]],pillars:[[15,19],[24,10],[14,5],[6,16]],relays:[[25.5,8.5],[14.5,3.5]],key:[3.5,4.5],exit:[3.5,19.5],hazards:[[24.5,15.5],[9.5,5.5],[4.5,11.5]],groups:[[1,'pr'],[2,'rc'],[3,'re'],[4,'pe'],[5,'r']],identity:'DRY BUS / REDUNDANT FEED'},
 {name:'GATEKEEPER',boss:'gatekeeper',bossAt:[24.5,5.5],subtitle:'He guards the way down. Break his brace.',spawn:[4.5,21.5,-Math.PI/2],
  rooms:[[1,18,8,23],[1,8,9,15],[12,13,20,23],[12,2,19,9],[22,2,27,11],[1,2,7,5]],halls:[[4,13,5,20],[8,11,15,11],[15,8,15,16],[19,6,24,6],[6,4,14,4]],pillars:[[3,10],[7,13],[14,18],[18,20],[23,8],[26,4]],relays:[[3.5,3.5],[17.5,3.5]],key:[13.5,6.5],exit:[26.5,9.5],hazards:[[10.5,11.5],[16.5,16.5],[24.5,8.5]],groups:[[1,'pr'],[2,'ce'],[3,'rr']],identity:'BRACE GATE / RAM CHAMBER'},
 {name:'IRON LUNG',subtitle:'The vents breathe before they bite. Listen.',spawn:[14.5,21.5,-Math.PI/2],
  rooms:[[10,18,19,23],[1,14,7,22],[1,3,9,10],[12,2,20,10],[23,3,27,11],[23,15,27,23],[11,12,20,15]],halls:[[6,20,12,20],[4,9,4,16],[8,6,14,6],[19,6,25,6],[25,10,25,18],[16,9,16,20]],pillars:[[3,17],[7,6],[15,5],[18,8],[25,5],[14,13]],relays:[[3.5,4.5],[18.5,3.5]],key:[24.5,7.5],exit:[26.5,21.5],hazards:[[4.5,12.5],[10.5,6.5],[21.5,6.5],[25.5,13.5]],groups:[[1,'pc'],[2,'er'],[3,'rrc'],[4,'ee'],[5,'c']],identity:'PRESSURE BELLOWS / ION LUNG'},
 {name:'FALSE SANCTUARY',subtitle:'The quiet room has two exits. Keep both in mind.',spawn:[3.5,21.5,-Math.PI/2],
  rooms:[[1,18,7,23],[1,10,9,15],[1,2,9,7],[12,2,20,10],[12,14,20,23],[23,13,27,23],[23,2,27,9]],halls:[[4,14,4,20],[5,6,5,11],[8,4,14,4],[17,9,17,16],[19,18,25,18],[25,8,25,15],[19,6,25,6]],pillars:[[3,12],[7,13],[4,4],[15,5],[18,8],[15,17],[18,21],[25,16]],relays:[[3.5,3.5],[14.5,8.5]],key:[19.5,3.5],exit:[25.5,21.5],hazards:[[4.5,16.5],[10.5,4.5],[17.5,12.5],[25.5,11.5]],groups:[[1,'pc'],[2,'er'],[3,'err'],[4,'ecc'],[5,'e']],identity:'HUSH CHAPEL / FALSE REFUGE'},
 {name:'STATIC TYRANT',boss:'tyrant',bossAt:[24.5,18.5],subtitle:'Every pulse has a gap. Every tyrant has a ground.',spawn:[3.5,21.5,-Math.PI/2],
  rooms:[[1,18,7,23],[1,9,9,15],[2,2,10,6],[13,2,21,10],[13,14,19,23],[22,13,27,23],[24,2,27,9]],halls:[[4,14,5,20],[5,5,5,10],[9,4,15,4],[17,9,17,16],[18,19,24,19],[25,8,25,16]],pillars:[[3,11],[7,13],[16,5],[19,8],[15,17],[23,16],[26,21]],relays:[[3.5,3.5],[19.5,3.5]],key:[14.5,8.5],exit:[26.5,14.5],hazards:[[5.5,7.5],[17.5,12.5],[20.5,19.5],[25.5,17.5]],groups:[[1,'erc'],[2,'rr'],[3,'ecc'],[4,'r']],identity:'TESLA THRONE / GROUND ZERO'},
 {name:'SHATTERED CHOIR',subtitle:'The choir sings in crossed lanes. Answer from cover.',spawn:[25.5,21.5,-Math.PI/2],
  rooms:[[22,17,27,23],[12,16,19,23],[1,15,9,23],[1,3,9,11],[12,2,20,10],[23,2,27,10],[12,12,19,13]],halls:[[18,20,24,20],[8,19,15,19],[5,10,5,17],[8,6,14,6],[19,5,25,5],[25,9,25,18],[16,9,16,18]],pillars:[[24,20],[15,19],[3,18],[7,21],[3,6],[7,9],[15,4],[18,8]],relays:[[3.5,4.5],[18.5,3.5]],key:[13.5,8.5],exit:[26.5,3.5],hazards:[[10.5,19.5],[5.5,13.5],[10.5,6.5],[21.5,5.5]],groups:[[1,'erc'],[2,'ecc'],[3,'err'],[4,'er'],[5,'cc']],identity:'BROKEN PIPES / ANTIPHON'},
 {name:'BLOODLESS GRID',subtitle:'A clean floor. A dirty circuit. Follow the warning lines.',spawn:[14.5,21.5,-Math.PI/2],
  rooms:[[10,18,19,23],[1,14,7,22],[1,3,9,10],[12,2,19,9],[22,2,27,10],[22,14,27,23],[11,12,19,15]],halls:[[6,20,12,20],[4,9,4,16],[8,5,14,5],[18,5,24,5],[25,9,25,17],[18,20,24,20],[15,8,15,20]],pillars:[[3,17],[6,20],[4,6],[7,4],[14,6],[17,8],[24,4],[25,7],[24,18],[17,13]],relays:[[3.5,3.5],[24.5,3.5]],key:[17.5,3.5],exit:[26.5,21.5],hazards:[[4.5,12.5],[10.5,5.5],[20.5,5.5],[25.5,12.5],[15.5,16.5]],groups:[[1,'ecc'],[2,'err'],[3,'eer'],[4,'err'],[5,'ec']],identity:'SURGICAL ARRAY / COLD GRID'},
 {name:'MIRROR ENGINE',boss:'mirror',bossAt:[24.5,5.5],subtitle:'One bright core. Two convincing lies. Shatter the guard.',spawn:[4.5,21.5,-Math.PI/2],
  rooms:[[1,18,8,23],[1,9,9,15],[2,2,10,6],[13,2,20,10],[13,14,20,23],[22,2,27,11],[23,15,27,23]],halls:[[5,14,5,20],[5,5,5,10],[9,4,15,4],[17,9,17,16],[19,19,25,19],[25,10,25,17],[19,6,24,6]],pillars:[[3,12],[7,11],[6,4],[15,5],[18,8],[15,18],[18,21],[23,8],[26,3]],relays:[[3.5,3.5],[14.5,8.5]],key:[19.5,3.5],exit:[26.5,9.5],hazards:[[11.5,4.5],[17.5,12.5],[21.5,19.5],[25.5,13.5]],groups:[[1,'erc'],[2,'rrc'],[3,'ee'],[4,'ecc']],identity:'SILVER GALLERY / FALSE CORES'},
 {name:'UNLIT CORE',subtitle:'Dark does not mean unreadable. Trust the red edge.',spawn:[25.5,21.5,Math.PI],
  rooms:[[22,18,27,23],[12,15,19,23],[1,14,9,23],[1,3,9,10],[12,2,20,10],[23,2,27,10],[13,12,19,13]],halls:[[18,20,24,20],[8,19,15,19],[5,9,5,17],[8,6,15,6],[19,5,25,5],[25,9,25,19],[16,9,16,17]],pillars:[[24,20],[16,18],[14,21],[3,18],[7,20],[3,6],[7,8],[15,4],[18,8],[25,6]],relays:[[3.5,4.5],[18.5,3.5]],key:[13.5,8.5],exit:[26.5,3.5],hazards:[[10.5,19.5],[5.5,12.5],[10.5,6.5],[21.5,5.5],[25.5,14.5]],groups:[[1,'ecc'],[2,'eer'],[3,'ercc'],[4,'err'],[5,'ec']],identity:'BLACK REACTOR / SCARLET EDGE'},
 {name:'LAST RESERVOIR',subtitle:'The final cells are real. So is the way out.',spawn:[4.5,21.5,-Math.PI/2],
  rooms:[[1,18,8,23],[1,8,9,14],[2,2,10,5],[12,2,20,10],[12,14,20,23],[23,13,27,23],[23,2,27,9]],halls:[[5,13,5,20],[6,4,6,9],[9,3,14,3],[17,9,17,16],[19,18,25,18],[25,8,25,15],[19,6,25,6]],pillars:[[3,10],[7,12],[5,3],[15,5],[18,8],[15,17],[18,21],[25,16],[24,5]],relays:[[3.5,3.5],[14.5,8.5]],key:[19.5,3.5],exit:[26.5,21.5],hazards:[[5.5,16.5],[6.5,6.5],[11.5,3.5],[17.5,12.5],[21.5,18.5],[25.5,11.5]],groups:[[1,'ercc'],[2,'err'],[3,'eecc'],[4,'err'],[5,'ec']],identity:'EMPTY CISTERNS / LAST CELL'},
 {name:'THE PIT ITSELF',boss:'abyss',bossAt:[24.5,18.5],subtitle:'It learned the other eleven lessons. Show it what you learned.',spawn:[4.5,21.5,-Math.PI/2],
  rooms:[[1,18,8,23],[1,9,9,15],[2,2,10,6],[13,2,21,10],[12,14,19,23],[22,12,27,23],[24,2,27,9]],halls:[[5,14,5,20],[5,5,5,10],[9,4,15,4],[17,9,17,16],[18,19,24,19],[26,8,26,15],[20,6,25,6]],pillars:[[3,12],[7,11],[6,4],[15,5],[19,8],[14,17],[17,21],[23,15],[26,21]],relays:[[3.5,3.5],[20.5,3.5]],key:[14.5,9.5],exit:[26.5,13.5],hazards:[[11.5,4.5],[17.5,12.5],[20.5,19.5],[24.5,16.5],[26.5,10.5]],groups:[[1,'erc'],[2,'ecc'],[3,'eerr'],[4,'ecc']],identity:'LAST ARGUMENT / OPEN CORE'}
];
const types={p:'plugged',r:'repeater',e:'enforcer',c:'crawler'};
function author(d,index){
 const act=PIT_ACTS[Math.floor(index/3)],wall=1+act.index%3,cells=Array.from({length:25},()=>Array(29).fill(wall));
 for(const [x0,y0,x1,y1]of [...d.rooms,...d.halls])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=0;
 for(const [x,y]of d.pillars)cells[y][x]=wall;
 const used=new Set(),mark=p=>{used.add(p.join(','));return p;};
 for(const p of [d.spawn.slice(0,2),...d.relays,d.key,d.exit,...d.hazards,d.bossAt].filter(Boolean))mark(p);
 const take=(room,preferCenter=false)=>{const [x0,y0,x1,y1]=d.rooms[room],spots=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(!cells[y][x]&&!used.has([x+.5,y+.5].join(',')))spots.push([x+.5,y+.5]);spots.sort((a,b)=>preferCenter?Math.hypot(a[0]-(x0+x1+1)/2,a[1]-(y0+y1+1)/2)-Math.hypot(b[0]-(x0+x1+1)/2,b[1]-(y0+y1+1)/2):((a[0]*11+a[1]*19+index*7)%41)-((b[0]*11+b[1]*19+index*7)%41));if(!spots.length)throw Error('Pit room lacks a safe encounter position');return mark(spots[0]);};
 const enemies=[];for(const [room,formation]of d.groups)for(const t of formation)enemies.push([types[t],...take(room)]);
 if(d.boss)enemies.push(['warden',...d.bossAt,d.boss]);
 const items=[];for(const room of [0,1,2,3,d.rooms.length-1])items.push(['energy',...take(room,true)]);
 if(d.boss)for(let i=0;i<2;i++)items.push(['energy',...take(d.rooms.findIndex(r=>d.bossAt[0]>=r[0]&&d.bossAt[0]<r[2]+1&&d.bossAt[1]>=r[1]&&d.bossAt[1]<r[3]+1),true)]);
 for(const room of [0,2,3,d.rooms.length-1])items.push(['health',...take(room)]);
 items.push(['armor',...take(0)],['armor',...take(3)],['artifact',...take(d.rooms.length-1)]);
 const captives=[take(1),take(3)];const signs=[];
 for(const [i,label,text]of [[0,d.name,d.subtitle],[1,'SCAVENGE / RELOAD','Cells fill reserve. Reload manually. No free ammunition down here.'],[2,d.boss?PIT_BOSSES[d.boss].name:'READ THE FLOOR',d.boss?PIT_BOSSES[d.boss].tip:'Bright borders warn before a floor hazard fires. Wait, route around, or spend your shield.'],[3,'EXTRACTION','Break both relays, take the key, defeat any major guardian, then leave.']]){
  const target=i===0?d.spawn:i===1?d.relays[0]:i===2?(d.bossAt||d.relays[1]):d.exit,walls=[];
  for(let y=1;y<24;y++)for(let x=1;x<28;x++)if(cells[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>cells[y+dy]?.[x+dx]===0)&&!signs.some(s=>s[0]===x&&s[1]===y))walls.push([x,y]);
  walls.sort((a,b)=>Math.hypot(a[0]+.5-target[0],a[1]+.5-target[1])-Math.hypot(b[0]+.5-target[0],b[1]+.5-target[1]));signs.push([...walls[0],label,act.name,text]);
 }
 return {...d,campaign:'pit',act:act.index,palette:act,tag:'PIT / '+act.name+' / '+d.identity,color:act.primary,wall,spawn:{x:d.spawn[0],y:d.spawn[1],a:d.spawn[2]},doors:[],secret:null,difficulty:act.difficulty,speedScale:act.speed,damageScale:act.damage,tactics:act.tactics,shotSpeed:3.1+act.index*.28,enemies,items,captives,theme:{rooms:d.rooms.map((r,i)=>[d.identity,'RELAY APPROACH','CELL DEPOT','CROSSFEED','GUARDIAN BAY','LOWER CONDUIT','EXTRACTION SPUR','REFUGE'][i]),signs,props:[['speaker',...take(0)],['console',...take(2)],['lamp',...take(3)]]},hazards:d.hazards.map(([x,y],id)=>({id,x,y,radius:.63,kind:act.hazard,period:5.8-act.index*.35,offset:id*.83+index*.21,damage:8+act.index*2}))};
}
export const PIT_STAGES=layouts.map(author);
export const PIT_HOSTS=PIT_STAGES.reduce((n,d)=>n+d.captives.length+d.enemies.filter(e=>['plugged','repeater'].includes(e[0])).length,0);
