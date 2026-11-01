import {pitFloorState} from './pit-presentation.js';
import {weaponMesh,appendEquipment} from './equipment-meshes.js';
import {SignalPresentation} from './signal-presentation.js';
import {SIGNAL_QUALITY} from './neon-signal.js';
import {WEAPONS,findRoute} from './core.js';import {materialUV,doorGeometry} from './level-geometry.js';import {WORLD_SCALE,entityHeight,traceEnvironment} from './spatial.js';import {transformPoint} from './immersive-math.js';
const ORDER=[0,1,2,0,2,3],FACES=[[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]],WHITE=[1,1,1,1],STUN=[.65,1.1,1.35,1],TELL=[1.5,.45,.18,1],CYAN=[.5,1.5,1.4,1],PURPLE=[1.3,.45,1.8,1];
const rgbCache=new Map();export function colorRGB(hex='#b9ff53'){if(!rgbCache.has(hex)){const v=hex.replace('#','');rgbCache.set(hex,[parseInt(v.slice(0,2),16)/255,parseInt(v.slice(2,4),16)/255,parseInt(v.slice(4,6),16)/255,1]);}return rgbCache.get(hex);}
export class VertexBatch {
 constructor(capacity=262144){this.data=new Float32Array(capacity);this.length=0;this.uvCache=new Map();this.points=new Float32Array(24);this.quadPoints=new Float32Array(12);this.tmp=new Float32Array(3);this.dropped=0;}
 reset(){this.length=this.dropped=0;}
 quad(points,material='white',color=WHITE){if(this.length+54>this.data.length){this.dropped++;return;}if(!this.uvCache.has(material))this.uvCache.set(material,materialUV(material));const uv=this.uvCache.get(material),d=this.data;let n=this.length;for(const i of ORDER){d[n++]=points[i*3];d[n++]=points[i*3+1];d[n++]=points[i*3+2];d[n++]=i===0||i===3?uv[0]:uv[2];d[n++]=i<2?uv[3]:uv[1];d[n++]=color[0];d[n++]=color[1];d[n++]=color[2];d[n++]=color[3]??1;}this.length=n;}
 billboard(x,y,z,w,h,material,eye,color=WHITE){const dx=eye[0]-x,dz=eye[2]-z,n=Math.hypot(dx,dz)||1,rx=dz/n*w/2,rz=-dx/n*w/2,q=this.quadPoints;q[0]=x-rx;q[1]=y;q[2]=z-rz;q[3]=x+rx;q[4]=y;q[5]=z+rz;q[6]=x+rx;q[7]=y+h;q[8]=z+rz;q[9]=x-rx;q[10]=y+h;q[11]=z-rz;this.quad(q,material,color);}
 floor(x,y,z,size,material,color=WHITE){const q=this.quadPoints,h=size/2;q[0]=x-h;q[1]=y;q[2]=z+h;q[3]=x+h;q[4]=y;q[5]=z+h;q[6]=x+h;q[7]=y;q[8]=z-h;q[9]=x-h;q[10]=y;q[11]=z-h;this.quad(q,material,color);}
 box(center,size,material,color=WHITE,matrix=null){const p=this.points,[x,y,z]=center,[w,h,d]=size;for(let i=0;i<8;i++){let px=x+((i===0||i===3||i===4||i===7)?-w:w)/2,py=y+(i===0||i===1||i===4||i===5?-h:h)/2,pz=z+(i<4?-d:d)/2;if(matrix){transformPoint(this.tmp,matrix,px,py,pz);px=this.tmp[0];py=this.tmp[1];pz=this.tmp[2];}p[i*3]=px;p[i*3+1]=py;p[i*3+2]=pz;}for(const face of FACES){for(let j=0;j<4;j++)for(let k=0;k<3;k++)this.quadPoints[j*3+k]=p[face[j]*3+k];this.quad(this.quadPoints,material,color);}}
 line(from,to,width,eye,color){const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2],vx=eye[0]-from[0],vy=eye[1]-from[1],vz=eye[2]-from[2];let x=dy*vz-dz*vy,y=dz*vx-dx*vz,z=dx*vy-dy*vx;const n=Math.hypot(x,y,z)||1;x=x/n*width;y=y/n*width;z=z/n*width;const q=this.quadPoints;q[0]=from[0]-x;q[1]=from[1]-y;q[2]=from[2]-z;q[3]=from[0]+x;q[4]=from[1]+y;q[5]=from[2]+z;q[6]=to[0]+x;q[7]=to[1]+y;q[8]=to[2]+z;q[9]=to[0]-x;q[10]=to[1]-y;q[11]=to[2]-z;this.quad(this.quadPoints,'white',color);}
}
export const QUALITY=SIGNAL_QUALITY;
export class WorldScene {
 constructor(){this.presentation=new SignalPresentation();this.batch=new VertexBatch();this.effects=[];this.beams=[];this.route=[];this.level=null;this.doors=[];this.from=new Float32Array(3);this.to=new Float32Array(3);this.weaponWorld=new Float32Array(16);this.counts={enemies:0,objects:0,particles:0,projectiles:0,vertices:0,dropped:0};this.clock=0;}
 ensureLevel(level){if(this.level===level)return;this.level=level;this.doors=Object.values(level.doors).map(door=>({door,shape:doorGeometry(level,door)}));this.effects.length=this.beams.length=0;this.route=[];}
 event(e,game){this.ensureLevel(game.level);this.presentation.event(e);if(['impact','hit','burst','liberation','oriAssist'].includes(e.type)){for(let i=0;i<Math.min(e.count||7,14)&&this.effects.length<96;i++){const a=i*2.399;this.effects.push({x:e.x*WORLD_SCALE,y:(e.height??.65)*WORLD_SCALE,z:e.y*WORLD_SCALE,vx:Math.cos(a)*.6,vy:.5+(i%3)*.3,vz:Math.sin(a)*.6,life:.45,color:colorRGB(e.color)});}}if(e.type==='beam'&&this.beams.length<64)this.beams.push({from:[e.from.x*WORLD_SCALE,(e.from.height??.75)*WORLD_SCALE,e.from.y*WORLD_SCALE],to:[e.to.x*WORLD_SCALE,(e.to.height??.7)*WORLD_SCALE,e.to.y*WORLD_SCALE],life:e.ori?.25:.12,color:colorRGB(e.color),ori:!!e.ori});if(e.type==='scan')this.route=findRoute(game.level,game.player,game.objectiveTarget,{allowLocked:game.player.key}).slice(0,30);}
 update(game,rig,dt,settings={}){
  this.ensureLevel(game.level);const b=this.batch,p=game.player,l=game.level,s=WORLD_SCALE,q=QUALITY[settings.vrQuality]||QUALITY.balanced,eye=rig.eye,visible=(x,y)=>Math.hypot(x*s-eye[0],y*s-eye[2])<q.distance;b.reset();this.clock+=dt;this.counts.enemies=this.counts.objects=this.counts.particles=this.counts.projectiles=this.counts.trails=0;
  for(const {door:d,shape:v}of this.doors){if(d.open>.995||!visible(d.x,d.y))continue;v.center[1]=v.size[1]*(.5+d.open);b.box(v.center,v.size,v.material,d.type===6&&game.shift?PURPLE:WHITE);}
  for(const e of l.enemies){if(e.dead||!visible(e.x,e.y))continue;const h=entityHeight(e.type)*s,frame=Math.floor(e.walk||0)%4;b.billboard(e.x*s,0,e.y*s,e.raidRole==='core'?6.4*s:h,h,e.raidRole?(e.raidRole==='core'?(e.exposed>0?'raid:open':'raid:core'):'raid:pylon'):e.pitBoss?'pitboss:'+e.pitBoss+(e.exposed>0?':open':''):(e.pain>0?'pain:':'enemy:')+e.type+':'+frame,eye,e.stun>0?STUN:WHITE);this.counts.enemies++;if(e.tell>0)b.floor(e.x*s,.025,e.y*s,.7,'marker',TELL);}
  for(const i of l.items)if(!i.taken&&visible(i.x,i.y)){b.billboard(i.x*s,.04,i.y*s,.85,.85,'item:'+i.type,eye);this.counts.objects++;}
  if(!l.key.taken){b.billboard(l.key.x*s,.12,l.key.y*s,.75,.75,'item:key',eye);this.counts.objects++;}
  for(const r of l.relays){b.billboard(r.x*s,0,r.y*s,.9,1.15,r.active?'relay:on':'relay:off',eye);this.counts.objects++;}
  for(const c of l.captives)if(!c.freed){b.billboard(c.x*s,0,c.y*s,1.3,1.65,'captive',eye);this.counts.objects++;}
  for(const prop of l.props||[])if(visible(prop.x,prop.y)){const h=prop.height*s;b.billboard(prop.x*s,0,prop.y*s,h*.8,h,'prop:'+prop.type,eye);this.counts.objects++;}
  if(!game.networkCompetitive)b.billboard(l.exit.x*s,.05,l.exit.y*s,1.55,2.15,'portal',eye,game.exitReady?WHITE:[.35,.45,.55,1]);
  for(const n of l.raidNodes||[])b.floor(n.x*s,.025,n.y*s,1.3*s,'hazard:arc',n.active?[.5,1.2,.9,1]:[1,.8,.35,1]);
  for(const a of game.remotePlayers||[]){
   const x=a.renderX??a.x,y=a.renderY??a.y;if(!['alive','downed'].includes(a.status)||!visible(x,y))continue;
   if(a.status==='downed'){b.billboard(x*s,0,y*s,.85*s,.4*s,'net:downed',eye);continue;}
   const color=a.team==='pink'?[1,.44,.56,1]:[.5,.91,.83,1],eyeHeight=a.pose?.eye||1.03,c=Math.cos(a.a),sn=Math.sin(a.a),right=a.pose?.right;
   const hand=right?[(x+right.x)*s,right.height*s,(y+right.y)*s]:[(x+c*.28-sn*.2)*s,eyeHeight*.65*s,(y+sn*.28+c*.2)*s];
   const left=[(x+c*.15+sn*.2)*s,eyeHeight*.6*s,(y+sn*.15-c*.2)*s],shoulder=[x*s,eyeHeight*.65*s,y*s];
   b.box([x*s,eyeHeight*.5*s,y*s],[.35*s,eyeHeight*.52*s,.25*s],'white',[.16,.24,.33,1]);
   b.box([x*s,(eyeHeight-.1)*s,y*s],[.22*s,.22*s,.22*s],'white',color);
   b.line(shoulder,hand,.055*s,eye,color);b.line(shoulder,left,.055*s,eye,color);
   for(const h of[hand,left])b.box(h,[.11*s,.11*s,.11*s],'white',color);
   const direction=right?[right.dx,right.dz,right.dy]:[c,0,sn],barrel=hand.map((v,i)=>v+direction[i]*.3*s);b.line(hand,barrel,.045*s,eye,[.58,.64,.7,1]);if(a.shotAnim>0)b.box(barrel,[.12*s,.12*s,.12*s],'white',colorRGB(WEAPONS[a.weapon].color));
   this.counts.objects++;
  }
  if(l.hazards){
   const primary=colorRGB(game.definition.color);
   for(const h of l.hazards){if(!visible(h.x,h.y))continue;const state=pitFloorState(h,game.time),gain=state==='active'?1:state==='warning'?.7:.18,color=state==='warning'?[1,.66,.23,1]:[primary[0]*gain,primary[1]*gain,primary[2]*gain,1];b.floor(h.x*s,.025,h.y*s,h.radius*2*s,'hazard:'+h.kind,color);}
   for(const blast of l.blasts)if(visible(blast.x,blast.y))b.floor(blast.x*s,.03,blast.y*s,blast.radius*2*s,'hazard:arc',blast.hit?[1,.25,.3,1]:[1,.7,.25,1]);
   for(const e of l.enemies)if(e.pitBoss==='mirror'&&!e.dead&&visible(e.x,e.y)){const h=entityHeight(e.type)*s;for(const side of [-1,1])b.billboard((e.x+side*.65)*s,.15,e.y*s,h*.6,h*.8,'pitboss:mirror',eye,[.18,.12,.25,1]);}
  }
  this.presentation.update(b,game,rig,dt,settings,q);this.counts.fixtures=this.presentation.fixtureCount;
  if(game.objectiveTime>0){const t=game.objectiveTarget;b.billboard(t.x*s,1.8,t.y*s,.3,.3,'marker',eye,CYAN);for(const n of this.route)b.floor(n.x*s,.025,n.y*s,.13,'marker',CYAN);}
  if(game.shift)for(const {door:d}of this.doors)if(d.type===6&&d.open<.84)b.billboard((d.x+.5)*s,.8,(d.y+.5)*s,.45,.45,'marker',eye,PURPLE);
  for(const projectile of game.projectiles){if(this.counts.projectiles>=128||!visible(projectile.x,projectile.y))continue;b.billboard(projectile.x*s,(projectile.height??.75)*s,projectile.y*s,.12,.12,'marker',eye,colorRGB(projectile.color));this.counts.projectiles++;if(this.counts.trails<q.particles/4){this.from.set([projectile.x*s,(projectile.height??.75)*s,projectile.y*s]);this.to.set([this.from[0]-Math.cos(projectile.a)*.18,this.from[1]-(projectile.vh||0)/Math.max(.01,projectile.speed)*.18,this.from[2]-Math.sin(projectile.a)*.18]);b.line(this.from,this.to,.01,eye,colorRGB(projectile.color));this.counts.trails++;}}
  const visualDt=game.mode==='playing'?dt:0;for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=visualDt;if(e.life<=0){this.effects.splice(i,1);continue;}e.x+=e.vx*visualDt;e.y+=e.vy*visualDt;e.z+=e.vz*visualDt;e.vy-=visualDt*1.5;if(this.counts.particles<q.particles){b.billboard(e.x,e.y,e.z,.035,.035,'white',eye,e.color);this.counts.particles++;}}
  for(let i=this.beams.length-1;i>=0;i--){const beam=this.beams[i];beam.life-=visualDt;if(beam.life<=0){this.beams.splice(i,1);continue;}if(!beam.ori||this.presentation.oriVisible)b.line(beam.ori?this.presentation.ori:beam.from,beam.to,.012,eye,beam.color);}
  if(game.mode==='playing'&&rig.equipmentLink){b.line(rig.equipmentLink.from,rig.equipmentLink.left,.0015,eye,CYAN);if(settings.vrQuality!=='performance')b.line(rig.equipmentLink.from,rig.equipmentLink.right,.0015,eye,CYAN);}
  if(game.mode==='playing'&&rig.uiPointer){b.line(rig.uiPointer.from,rig.uiPointer.to,.003,eye,CYAN);b.billboard(...rig.uiPointer.to,.015,.015,'marker',eye,CYAN);}
  if(rig.aim){const color=colorRGB(WEAPONS[game.weapon].color),hand=this.weaponWorld;hand.set(rig.weaponWorld||rig.rightWorld);const recoil=game.shotAnim*.008;for(let i=0;i<3;i++)hand[12+i]+=hand[8+i]*recoil;appendEquipment(b,weaponMesh(game.weapon,settings.vrQuality==='performance'?6:8),hand,settings.vrHologramBrightness??.85,game.charge*.3+game.muzzle*.2);
   const o=rig.aim.origin;this.from.set([o.x*s,o.height*s,o.y*s]);if(game.muzzle>.05)b.billboard(this.from[0],this.from[1],this.from[2],[.09,.055,.13,.055,.085,.11][game.weapon],[.09,.055,.13,.055,.085,.11][game.weapon],'marker',eye,color);if(game.charge>.1)b.billboard(this.from[0],this.from[1],this.from[2],.08+game.charge*.15,.08+game.charge*.15,'ori',eye,color);
   if(settings.vrAimLine&&!rig.uiCaptured){const hit=traceEnvironment(l,o,rig.aim.direction,1.7/s),d=hit.distance*s;this.to.set([this.from[0]+rig.aim.direction.x*d,this.from[1]+rig.aim.direction.z*d,this.from[2]+rig.aim.direction.y*d]);b.line(this.from,this.to,.0035,eye,CYAN);}
  }

  this.counts.vertices=b.length/9;this.counts.dropped=b.dropped;return b;
 }
}
