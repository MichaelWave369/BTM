// THE PIT HAZARD VAULT: optional offline-only, 90-second movement/shield lab.
// Reuses the real Pit trap authority + BTM projectile collisions, but borrows
// the Calibration Vault's gallery guard to isolate ALL campaign checkpoint IO.
export const HAZARD_VAULT_DURATION=90;

const electric=(id,pattern,x,y,mx,my,muzzleX,muzzleY,extra={})=>({
 id,kind:'electric-orb',...(pattern?{pattern}:{}),x,y,radius:.44,
 mountX:mx,mountY:my,muzzleX,muzzleY,warning:pattern==='crossfire'?1.15:.9,
 cooldown:pattern==='crossfire'?7.5:pattern==='double'?6.5:5.5,
 speed:2.35,damage:pattern?9:12,...(pattern?{burst:2,interval:pattern==='crossfire'?.65:.46}:{}),
 ...extra
});

export function enterHazardVault(game){
 // Pit mode is deliberately needed for updatePitEnvironment, and gallery
 // is deliberately needed for the existing no-save/pause/result contracts.
 // No arena state is written to Pit or original localStorage slots.
 game.startPit();
 game.loadLevel(3,false); // Use the existing Pit palette and world materials.
 const l=game.level;
 for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)
  l.cells[y][x]=x===0||y===0||x===l.w-1||y===l.h-1?1:0;
 // Three real wall mounts divide the firing lanes without sealing any room.
 l.cells[12][9]=1;l.cells[12][19]=1;
 l.doors={};l.enemies=[];l.items=[];l.relays=[];l.captives=[];
 l.key={x:14.5,y:2.5,taken:true};l.exit={x:14.5,y:2.5};
 l.props=[];l.signs=[];l.seen.fill(true);l.blasts=[];l.hazards=[];
 l.regions=[{name:'PIT HAZARD VAULT',bounds:[1,1,27,23]}];
 l.traps=[
  electric('lab-single',null,23.5,12.5,19.5,12.5,20.12,12.5),
  electric('lab-double','double',5.5,12.5,9.5,12.5,8.88,12.5),
  electric('lab-crossfire','crossfire',14.5,12.5,9.5,12.5,10.12,12.5,{
   secondMountX:19.5,secondMountY:12.5,
   secondMuzzleX:18.88,secondMuzzleY:12.5
  })
 ];
 l.floorTraps=[
  {id:'lab-charge',kind:'charge-tile',x:5.5,y:6.5,radius:.52,
   period:5.6,offset:0,warningStart:1,activeStart:1.9,activeEnd:2.45,damage:10},
  {id:'lab-arc',kind:'arc-lane',x:12.5,y:19.5,toX:16.5,toY:19.5,radius:.43,
   period:6.2,offset:.2,warningStart:1.1,activeStart:2,activeEnd:2.65,damage:11},
  {id:'lab-pulse',kind:'pressure-pulse',x:23.5,y:19.5,triggerRadius:.4,
   radius:1.08,warning:.8,cooldown:5,damage:11}
 ];
 game.player.x=14.5;game.player.y=5.5;game.player.a=Math.PI/2;
 game.player.health=100;game.player.armor=40;game.player.energy=100;
 game.player.reserve=100;game.player.key=true;
 game.weapon=1;game.unlocked=2;game.oriAuto=Infinity;
 game.projectiles=[];game.time=0;game.pitAmbient=Infinity;
 game.stats.damageTaken=0;
 game.gallery={drill:'hazard-gauntlet',duration:HAZARD_VAULT_DURATION,
  activations:0,shielded:0,healthDamage:0,damageStart:0,
  shots:0,hits:0,score:0,ended:false,survived:false};
 game.checkpoint=null;game.events=[];
 game.say('Hazard Vault online. Ninety seconds, six live mechanisms. Move when the warning sounds. Dash Bash shields absorb real impacts. No campaign progress is at risk.','ORI',2);
 return game.gallery;
}
