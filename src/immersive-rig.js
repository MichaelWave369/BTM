import {EQUIPMENT_DEFAULTS,equipmentSettings,attachWeapon} from './equipment-math.js';
import {visualLeftPose} from './left-hand-pose.js';
import {moveBody} from './collision.js';
import {WORLD_SCALE,WALL_HEIGHT,clamp,safeTrackedAim} from './spatial.js';
import {matIdentity,matMultiply,rigidY,inverseRigidY,transformPoint,directionAngle} from './immersive-math.js';
export const IMMERSIVE_DEFAULTS={...EQUIPMENT_DEFAULTS,vrTurnMode:'smooth',vrSnapAngle:30,vrMoveReference:'head',vrMoveSpeed:.6,vrTurnSpeed:1,vrVignetteStrength:.7,vrEyeHeight:1.65,vrPosture:'seated',vrVignette:true,vrQuality:'balanced',vrAimLine:true,vrDiagnostics:false};
export function immersiveSettings(s={}){
 const v={...IMMERSIVE_DEFAULTS};for(const [key,options]of Object.entries({vrTurnMode:['snap','smooth'],vrMoveReference:['head','controller'],vrPosture:['seated','standing'],vrQuality:['performance','balanced','high']}))if(options.includes(s[key]))v[key]=s[key];
 for(const [key,min,max]of [['vrMoveSpeed',.25,1],['vrTurnSpeed',.4,2],['vrVignetteStrength',.2,1],['vrEyeHeight',1.1,1.95]])if(Number.isFinite(s[key]))v[key]=clamp(s[key],min,max);
 if([15,30,45].includes(s.vrSnapAngle))v.vrSnapAngle=s.vrSnapAngle;for(const k of ['vrVignette','vrAimLine','vrDiagnostics'])if(typeof s[k]==='boolean')v[k]=s[k];Object.assign(v,equipmentSettings(s));v.reducedMotion=!!s.reducedMotion;return v;
}
export class ImmersiveRig {
 constructor(){
  this.root=matIdentity();this.inverse=matIdentity();this.rightWorld=matIdentity();this.weaponWorld=matIdentity();this.equipmentEpoch=0;this.rightGripWorld=matIdentity();this.leftWorld=matIdentity();this.leftVisualWorld=matIdentity();this.hasVisualLeft=false;this.headWorld=matIdentity();this.level=null;this.calibrated=false;this.snapReady=true;this.fade=0;this.blocked=false;this.eye=[0,0,0];this.menuPosition={x:0,y:0};
  this.input={moveForward:0,moveStrafe:0,sprint:false,fire:false,deferFire:true,afterMovement:()=>this.finish(this.game,this.pose,this.game.mode==='playing')};
 }
 recenter(){this.equipmentEpoch++;this.uiCaptured=false;this.calibrated=false;this.snapReady=false;this.fade=.18;}
 calibrate(game,pose){this.equipmentEpoch++;this.yaw=directionAngle(pose.head)-game.player.a;this.headBase=pose.head[13];this.lastX=pose.head[12];this.lastZ=pose.head[14];this.calibrated=true;this.level=game.level;this.menuActive=false;this.menuPosition={x:game.player.x,y:game.player.y};this.fade=.18;}
 prepare(game,pose,pad,settings={},dt=.014,playing=true,beforeInput=null){
  this.game=game;this.pose=pose;this.settings=immersiveSettings(settings);settings=this.settings;this.fade=Math.max(0,this.fade-dt);this.trackingJump=false;
  if(!this.calibrated||this.level!==game.level)this.calibrate(game,pose);
  const dx=pose.head[12]-this.lastX,dz=pose.head[14]-this.lastZ;this.lastX=pose.head[12];this.lastZ=pose.head[14];this.blocked=false;
  if(Math.hypot(dx,dz)>.75){this.trackingJump=true;this.fade=.25;this.finish(game,pose,playing);return this.zeroInput();}
  if(playing&&this.menuActive){this.menuActive=false;this.fade=.16;this.menuPosition={x:game.player.x,y:game.player.y};}
  if(!playing&&!this.menuActive){this.menuActive=true;this.menuPosition={x:game.player.x,y:game.player.y};}
  const c=Math.cos(this.yaw),s=Math.sin(this.yaw),wx=(c*dx+s*dz)/WORLD_SCALE,wy=(-s*dx+c*dz)/WORLD_SCALE,body=playing?game.player:this.menuPosition,oldX=body.x,oldY=body.y;
  if(playing){if(game.moveTrackedBody)game.moveTrackedBody(wx,wy);else moveBody(game.level,body,wx,wy);}
  else{const max=.6/WORLD_SCALE,px=body.x+wx-game.player.x,py=body.y+wy-game.player.y,n=Math.hypot(px,py),ratio=n>max?max/n:1;moveBody(game.level,body,game.player.x+px*ratio-body.x,game.player.y+py*ratio-body.y);}
  this.blocked=Math.hypot(body.x-oldX-wx,body.y-oldY-wy)*WORLD_SCALE>.015;
  if(playing){const travel=Math.hypot(body.x-oldX,body.y-oldY);game.stats.distance+=travel;game.lessonDistance+=travel;game.footDistance+=travel;}
  if(beforeInput){this.finish(game,pose,playing);if(beforeInput())pad=null;}
  const turn=pad?.ready?pad.turn||0:0;if(Math.abs(turn)<.25)this.snapReady=true;
  if(playing&&settings.vrTurnMode==='snap'&&Math.abs(turn)>.65&&this.snapReady){const delta=Math.sign(turn)*settings.vrSnapAngle*Math.PI/180;game.player.a+=delta;this.yaw-=delta;this.snapReady=false;this.fade=.045;}
  if(playing&&settings.vrTurnMode==='smooth'){const delta=turn*dt*1.9*settings.vrTurnSpeed;game.player.a+=delta;this.yaw-=delta;}
  const reference=settings.vrMoveReference==='controller'&&pose.leftRay?pose.leftRay:pose.head,a=directionAngle(reference,this.yaw)-game.player.a,f=playing&&pad?.ready?pad.moveForward||0:0,r=playing&&pad?.ready?pad.moveStrafe||0:0;
  this.moveAngle=game.player.a+a;this.input.moveForward=(Math.cos(a)*f-Math.sin(a)*r)*settings.vrMoveSpeed;this.input.moveStrafe=(Math.sin(a)*f+Math.cos(a)*r)*settings.vrMoveSpeed;this.input.sprint=playing&&!!pad?.sprint;this.input.fire=false;this.input.deferFire=true;
  this.finish(game,pose,playing);return this.input;
 }
 zeroInput(){this.input.moveForward=this.input.moveStrafe=0;this.input.sprint=this.input.fire=false;return this.input;}
 clipGrip(game,m){
  const safe=safeTrackedAim(game.level,this.head,{origin:{x:m[12]/WORLD_SCALE,y:m[14]/WORLD_SCALE,height:m[13]/WORLD_SCALE},direction:{x:0,y:1,z:0}});
  if(safe){m[12]=safe.origin.x*WORLD_SCALE;m[13]=safe.origin.height*WORLD_SCALE;m[14]=safe.origin.y*WORLD_SCALE;}
 }
 finish(game,pose,playing=true){
  if(!playing&&!this.menuActive){this.menuActive=true;this.menuPosition={x:game.player.x,y:game.player.y};}
  const settings=this.settings||IMMERSIVE_DEFAULTS,head=pose.head,body=playing?game.player:this.menuPosition,height=clamp(settings.vrEyeHeight+head[13]-this.headBase,.5,WALL_HEIGHT*WORLD_SCALE-.15),c=Math.cos(this.yaw),s=Math.sin(this.yaw);
  const x=body.x*WORLD_SCALE-(c*head[12]+s*head[14]),z=body.y*WORLD_SCALE-(-s*head[12]+c*head[14]),y=height-head[13];
  rigidY(this.root,this.yaw,x,y,z);inverseRigidY(this.inverse,this.yaw,x,y,z);transformPoint(this.eye,this.root,head[12],head[13],head[14]);matMultiply(this.headWorld,this.root,head);
  this.headAngle=directionAngle(head,this.yaw);this.head={x:body.x,y:body.y,height:height/WORLD_SCALE,angle:this.headAngle};this.aim=null;this.hasLeft=!!pose.leftGrip;this.hasVisualLeft=false;this.hasRightGrip=!!(pose.rightGrip||pose.rightRay);
  if(pose.leftGrip){
   matMultiply(this.leftWorld,this.root,pose.leftGrip);this.clipGrip(game,this.leftWorld);
   // Measure the WATCH turn from real tracking. The rest-palm model changes
   // only the rendered glove; no matrix for combat, Ori or UI input is moved.
   const wrist=this.leftWorld,dx=this.eye[0]-wrist[12],dy=this.eye[1]-wrist[13],dz=this.eye[2]-wrist[14];
   const near=Math.max(.001,Math.hypot(dx,dy,dz));
   const facing=(wrist[4]*dx+wrist[5]*dy+wrist[6]*dz)/near;
   const blend=wrist[13]>=this.eye[1]-.39?clamp((facing-.45)/.32,0,1):0;
   visualLeftPose(this.leftVisualWorld,wrist,settings,blend);this.hasVisualLeft=true;
  }
  if(this.hasRightGrip){matMultiply(this.rightGripWorld,this.root,pose.rightGrip||pose.rightRay);this.clipGrip(game,this.rightGripWorld);}
  if(pose.rightRay){
   matMultiply(this.rightWorld,this.root,pose.rightRay);
   // The handle follows the tracked grip; aim retains the preferred pointing ray.
   const m=attachWeapon(this.weaponWorld,this.rightWorld,pose.rightGrip?this.rightGripWorld:null,settings),direction={x:-m[8],y:-m[10],z:-m[9]},origin={x:(m[12]-m[8]*.34)/WORLD_SCALE,y:(m[14]-m[10]*.34)/WORLD_SCALE,height:(m[13]-m[9]*.34)/WORLD_SCALE};
   this.aim=safeTrackedAim(game.level,this.head,{origin,direction});if(this.aim){m[12]+=(this.aim.origin.x-origin.x)*WORLD_SCALE;m[13]+=(this.aim.origin.height-origin.height)*WORLD_SCALE;m[14]+=(this.aim.origin.y-origin.y)*WORLD_SCALE;}
  }
  if(playing&&this.aim)game.setCombatPose({head:this.head,aim:this.aim});else game.clearCombatPose();
 }
}
