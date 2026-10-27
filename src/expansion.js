// Act II reuses the original combat vocabulary, with denser encounters and new routes.
export const EXPANSION = [
  {name:'THE MEMORY FOUNDRY',tag:'ACT II / IDENTITY RECLAMATION',color:'#ffb36c',subtitle:'They melted the memories. We kept the masters.',wall:1,spawn:{x:4.5,y:21.5,a:-Math.PI/2},difficulty:1.1,
    rooms:[[1,18,8,23],[2,9,10,15],[1,2,8,6],[13,2,22,9],[13,13,20,22],[24,12,27,22],[24,2,27,7]],
    halls:[[5,14,5,20],[5,5,5,10],[7,4,15,4],[9,12,16,12],[16,8,16,15],[19,18,25,18],[25,6,25,14]],
    doors:[[5,16,4],[5,7,4],[11,4,4],[16,11,4],[22,18,5],[25,9,6]],
    pillars:[[3,11],[8,13],[16,5],[19,17]],relays:[[4.5,3.5],[19.5,4.5]],key:[18.5,7.5],exit:[26.5,20.5],
    enemies:[['enforcer',5.5,13.5],['crawler',8.5,10.5],['repeater',3.5,10.5],['enforcer',6.5,3.5],['repeater',15.5,3.5],['crawler',20.5,6.5],['enforcer',20.5,8.5],['plugged',15.5,19.5],['repeater',18.5,15.5],['enforcer',25.5,16.5],['crawler',26.5,13.5],['plugged',26.5,19.5]],
    items:[['armor',3.5,20.5],['energy',6.5,14.5],['health',2.5,3.5],['energy',7.5,5.5],['energy',14.5,8.5],['health',21.5,3.5],['health',14.5,20.5],['energy',19.5,21.5],['energy',26.5,17.5],['artifact',26.5,4.5],['health',25.5,6.5]],captives:[[4.5,11.5],[15.5,17.5]],secret:[25,9]},
  {name:'THE BLACKOUT STACK',tag:'ACT II / EMERGENCY BROADCAST',color:'#779eff',subtitle:'Emergency lighting. Mandatory optimism. Same old lies.',wall:3,spawn:{x:24.5,y:21.5,a:Math.PI},difficulty:1.23,
    rooms:[[21,17,27,23],[13,15,19,23],[22,7,27,13],[12,3,20,11],[1,2,8,9],[1,14,8,22],[23,2,27,4]],
    halls:[[18,20,23,20],[24,12,24,18],[18,9,24,9],[7,6,14,6],[5,8,5,16],[7,18,15,18],[25,3,25,8]],
    doors:[[20,20,4],[24,15,4],[21,9,4],[10,6,4],[5,11,5],[10,18,5],[25,5,6]],pillars:[[15,8],[17,17],[24,11],[4,6],[6,17]],
    relays:[[25.5,8.5],[16.5,5.5]],key:[3.5,4.5],exit:[3.5,19.5],
    enemies:[['enforcer',16.5,20.5],['crawler',18.5,16.5],['repeater',14.5,22.5],['enforcer',26.5,12.5],['repeater',23.5,8.5],['crawler',25.5,10.5],['enforcer',18.5,5.5],['enforcer',13.5,9.5],['repeater',19.5,10.5],['crawler',6.5,7.5],['enforcer',6.5,3.5],['plugged',2.5,7.5],['enforcer',4.5,17.5],['repeater',7.5,20.5],['crawler',2.5,20.5]],
    items:[['armor',26.5,21.5],['health',14.5,16.5],['energy',18.5,22.5],['energy',26.5,8.5],['health',22.5,12.5],['energy',13.5,4.5],['health',19.5,4.5],['energy',7.5,3.5],['health',2.5,3.5],['energy',7.5,21.5],['health',2.5,15.5],['artifact',26.5,2.5]],captives:[[18.5,18.5],[2.5,8.5],[6.5,15.5]],secret:[25,5]},
  {name:'THE NULL CROWN',tag:'ACT II / LAST CONTROL SIGNAL',color:'#ff788d',subtitle:'One final crown. One extremely impolite bassline.',wall:2,spawn:{x:4.5,y:21.5,a:-Math.PI/2},difficulty:1.38,
    rooms:[[1,18,6,23],[1,9,8,15],[2,2,9,6],[12,3,19,11],[10,15,18,23],[21,13,27,23],[22,2,27,9],[12,1,18,1]],
    halls:[[4,14,4,20],[5,5,5,10],[8,4,14,4],[15,9,15,17],[17,19,23,19],[18,7,24,7],[25,8,25,15],[15,1,15,4]],
    doors:[[4,17,4],[5,7,4],[11,4,4],[15,13,4],[20,19,5],[20,7,5],[25,11,4],[15,2,6]],pillars:[[3,12],[6,11],[6,4],[14,8],[17,17],[24,16],[25,21]],
    relays:[[4.5,3.5],[16.5,6.5]],key:[17.5,9.5],exit:[25.5,3.5],
    enemies:[['enforcer',5.5,14.5],['crawler',7.5,10.5],['repeater',2.5,10.5],['enforcer',7.5,3.5],['repeater',3.5,5.5],['crawler',13.5,6.5],['enforcer',17.5,4.5],['repeater',18.5,9.5],['crawler',16.5,10.5],['enforcer',12.5,18.5],['repeater',16.5,21.5],['crawler',11.5,22.5],['enforcer',22.5,16.5],['enforcer',26.5,21.5],['warden',24.5,19.5],['repeater',23.5,7.5],['enforcer',26.5,5.5],['crawler',25.5,8.5]],
    items:[['armor',2.5,20.5],['energy',7.5,14.5],['health',2.5,14.5],['energy',8.5,3.5],['health',3.5,2.5],['health',18.5,4.5],['energy',13.5,10.5],['armor',13.5,16.5],['energy',11.5,21.5],['health',17.5,22.5],['energy',26.5,14.5],['health',22.5,22.5],['energy',26.5,22.5],['health',26.5,3.5],['artifact',15.5,1.5]],captives:[[7.5,5.5],[16.5,19.5],[23.5,14.5]],secret:[15,2]}
];

const THEMES=[
  {rooms:['ARRIVALS / 369','CONTAINMENT WARD A','PROCESSING FLOOR','CONTROL VAULT B','EXTRACTION BAY','THE FORGOTTEN CUPBOARD'],signs:[[3,16,'WARD A ↑','CONTROL / NORTH','SUBJECT 369: refuses to stop making music.'],[4,2,'RELAY A','MANUAL OVERRIDE','Human override retained by an engineer who still cared.'],[17,1,'RELAY B','VAULT ACCESS','A scratched message: WE ARE STILL IN HERE.'],[19,16,'EXIT →','GOLD ACCESS','Extraction is a right. The lock is a design flaw.']],props:[['pod',2.5,9.5],['pod',8.5,11.5],['console',16.5,3.5],['lamp',6.5,22.5]]},
  {rooms:['THE VESTIBULE','STATIC NAVE','THE CHOIR ENGINE','BROADCAST ALTAR','THE SCREEN GALLERY','EXIT SACRISTY'],signs:[[4,16,'NAVE ↑','SIGNAL / LIVE','ALL VOICES MUST USE THE APPROVED FREQUENCY.'],[6,1,'RELAY A','BELIEF ENGINE','An unplugged microphone. Someone already started a rebellion.'],[17,6,'RELAY B','THE CHOIR','Audience participation is no longer optional.'],[22,7,'EXIT →','GOLD ACCESS','The door insists it is protecting you from outside.']],props:[['speaker',4.5,14.5],['speaker',9.5,9.5],['pod',20.5,9.5],['console',24.5,4.5]]},
  {rooms:['CORE AIRLOCK','COOLANT PROCESSING','THE REALITY ENGINE','WARDEN APPROACH','CORE EXIT','THE WARDEN CHAMBER','OLD MAINTENANCE'],signs:[[4,16,'CORE ↑','TWO RELAYS','THE ARCHITECT IS ALWAYS WATCHING. The camera is unplugged.'],[4,6,'NO ENTRY','MAINTENANCE 88','A maintenance note: try changing the frequency.'],[15,1,'RELAY B','CORE OVERRIDE','Control is not the same thing as care.'],[21,17,'WARDEN →','KEEP MOVING','The Warden tracks your position. Strafe its charge.']],props:[['console',2.5,13.5],['speaker',18.5,3.5],['pod',23.5,20.5],['lamp',26.5,15.5]]},
  {rooms:['FREIGHT ARRIVALS','IDENTITY INTAKE','THE FIRST FURNACE','MEMORY ARCHIVE','THE RECLAIM FLOOR','FOUNDRY EXIT','MASTER TAPE LOCKER'],signs:[[4,17,'INTAKE ↑','MEMORY FOUNDRY','Memories are not property of the company.'],[4,1,'RELAY A','FURNACE CONTROL','The furnace log ends with: I REMEMBER MY NAME.'],[19,1,'RELAY B','MASTER ARCHIVE','Archive 88: every terrible first demo, lovingly preserved.'],[22,17,'EXIT →','GOLD ACCESS','Reclaimed identities: please collect your own future.']],props:[['pod',3.5,14.5],['speaker',7.5,2.5],['console',21.5,7.5],['lamp',14.5,15.5]]},
  {rooms:['BACKUP POWER','SERVICE STACK','TRANSFORMER HALL','BLACKOUT NEXUS','EMERGENCY UPLINK','THE LAST STAIR','OFF-AIR BOOTH'],signs:[[20,21,'SERVICE ←','BACKUP POWER','The emergency budget bought one working light.'],[24,6,'RELAY A','TRANSFORMER','Power down the lie. Keep the people online.'],[16,2,'RELAY B','BLACKOUT NEXUS','A real human left a real map under the desk.'],[4,13,'EXIT ↓','GOLD ACCESS','In the dark, the quiet signal is easiest to hear.']],props:[['lamp',22.5,22.5],['console',17.5,16.5],['speaker',26.5,9.5],['pod',3.5,7.5]]},
  {rooms:['LAST AIRLOCK','THE CHARGING HALL','CROWN RELAY A','CROWN RELAY B','THE ASCENT','THE NULL THRONE','OPEN FREQUENCY','THE ORIGINAL MIX'],signs:[[3,17,'ASCEND ↑','NULL CROWN','NO GODS. NO ADMINS. PLEASE MIND THE CABLES.'],[4,1,'RELAY A','CROWN CONTROL','A throne is just a chair with a marketing department.'],[16,2,'RELAY B','FINAL SIGNAL','The master mix survived. So can you.'],[20,18,'THRONE →','FINAL WARDEN','That crown is running on borrowed electricity.']],props:[['speaker',2.5,11.5],['speaker',18.5,3.5],['console',12.5,22.5],['lamp',26.5,17.5]]}
];
export function decorateLevel(level,def,index){
  const theme=THEMES[index]||def.theme;
  level.regions=def.rooms.map((r,i)=>({bounds:r,name:theme.rooms[i]||'MAINTENANCE'}));
  level.signs=theme.signs.map(([x,y,title,subtitle,text],id)=>({id,x,y,title,subtitle,text,read:false})).filter(s=>level.cells[s.y]?.[s.x]>0);
  level.props=theme.props.map(([type,x,y])=>({type,x,y,height:type==='lamp'?1.35:type==='pod'?1.2:.85})).filter(p=>level.cells[Math.floor(p.y)]?.[Math.floor(p.x)]===0);
  level.relays.forEach((relay,i)=>relay.label='CONTROL RELAY '+String.fromCharCode(65+i));
}
