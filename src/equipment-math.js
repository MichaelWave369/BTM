import {WORLD_SCALE,entityHeight} from './spatial.js';
// Meter-based equipment layout and sanitized optional settings. No simulation writes.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const EQUIPMENT_DEFAULTS=Object.freeze({captions:true,spokenDialogue:false,speechVolume:.7,vrHandStyle:'combat',vrWristSize:.36,vrWristOffset:.065,vrWristActivation:'gaze',vrWristSensitivity:.4,vrHudVisible:true,vrHologramBrightness:.85,vrSubtitleSize:1,vrSubtitleMode:'comfort',vrSubtitleDuration:1,vrGripX:0,vrGripY:0,vrGripZ:0,vrLeftHandPitch:20,vrLeftHandYaw:0,vrLeftHandRoll:0,vrWristTopOffset:.03,vrOriScale:.65,vrOriPeripheral:true,vrInterfaceMotion:true});
export function equipmentSettings(s={}){
 const out={...EQUIPMENT_DEFAULTS};
 for(const [key,options]of Object.entries({vrHandStyle:['combat','neon','tactical'],vrWristActivation:['gaze','raised','manual'],vrSubtitleMode:['comfort','ori']}))if(options.includes(s[key]))out[key]=s[key];
 for(const [key,min,max]of [['speechVolume',0,1],['vrWristSize',.24,.38],['vrWristOffset',.035,.10],['vrWristSensitivity',.35,.8],['vrHologramBrightness',.4,1.1],['vrSubtitleSize',.8,1.3],['vrSubtitleDuration',.75,2],['vrGripX',-.04,.04],['vrGripY',-.04,.04],['vrGripZ',-.04,.04],['vrLeftHandPitch',-65,65],['vrLeftHandYaw',-65,65],['vrLeftHandRoll',-90,90],['vrWristTopOffset',0,.08],['vrOriScale',.4,1]])if(Number.isFinite(s[key]))out[key]=clamp(s[key],min,max);
 for(const key of ['captions','spokenDialogue','vrHudVisible','vrInterfaceMotion','vrOriPeripheral'])if(typeof s[key]==='boolean')out[key]=s[key];return out;
}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function normal(v){const n=Math.hypot(v[0],v[1],v[2])||1;for(let i=0;i<3;i++)v[i]/=n;return v;}
export function equipmentPanel(width=.32,height=width/1.5){return{center:[0,0,0],right:[1,0,0],up:[0,1,0],normal:[0,0,1],width,height};}
function at(out,m,x,y,z){for(let i=0;i<3;i++)out[i]=m[12+i]+m[i]*x+m[4+i]*y+m[8+i]*z;}
export class WristComputer{
 constructor(){
  this.status=equipmentPanel(.064,.028);this.panel=equipmentPanel();this.toEye=[0,0,0];
  this.open=0;this.pinned=false;this.last=-1;this.attentionSince=-1;this.lostSince=-1;
  this.guardUntil=0;this.requested=false;this.guard=false;this.visible=false;this.statusVisible=false;
  this.suppressAutoUntilLower=false;this.watchFacing=0;this.watchGaze=0;this.watchDistance=0;
  this.watchRaised=false;this.watchReady=false;
 }
 // A tap on the cuff, or a left grip with the wrist raised in front of the
 // headset, deliberately pins/unpins the expanded menu. Unpinning must not
 // immediately re-trigger a saved automatic-gaze preference.
 togglePin(){
  this.pinned=!this.pinned;
  this.suppressAutoUntilLower=!this.pinned;
  this.attentionSince=this.lostSince=-1;
  this.last=-1;
  return this.pinned;
 }
 canToggle(rig,settings={}){
  return !!(rig?.hasLeft&&equipmentSettings(settings).vrHudVisible&&
   (this.pinned||this.watchReady));
 }
 reset(){
  this.open=0;this.pinned=false;this.last=-1;
  this.attentionSince=this.lostSince=-1;this.guardUntil=0;
  this.requested=this.guard=this.visible=this.statusVisible=false;
  this.suppressAutoUntilLower=false;this.watchReady=this.watchRaised=false;
  this.watchFacing=this.watchGaze=this.watchDistance=0;
 }
 update(rig,settings={},now=0){
  const s=equipmentSettings(settings),dt=this.last<0?0:clamp((now-this.last)/1000,0,.05);
  this.last=now;
  const eye=rig.eye,head=rig.headWorld,tracked=rig.leftWorld;
  const visual=rig.hasVisualLeft?rig.leftVisualWorld:tracked;
  if(!rig.hasLeft||!tracked||!head||!s.vrHudVisible){
   this.reset();return this;
  }
  // Physical glove calibration is presentation-only. Detect watch rotation
  // from the REAL tracked left controller, never leftVisualWorld.
  const status=this.status;
  at(status.center,visual,0,.0415+s.vrWristTopOffset,.115);
  for(let i=0;i<3;i++){
   status.right[i]=visual[i];
   status.up[i]=-visual[8+i];
   status.normal[i]=visual[4+i];
   this.toEye[i]=eye[i]-status.center[i];
  }
  const d=Math.hypot(...this.toEye)||1;
  this.watchDistance=d;
  normal(this.toEye);
  this.statusVisible=d>.25&&d<1.15;
  const forward=[-head[8],-head[9],-head[10]];
  const toward=[status.center[0]-eye[0],status.center[1]-eye[1],status.center[2]-eye[2]];
  normal(toward);
  this.watchGaze=dot(forward,toward);
  // Wrist-facing measurement uses the tracked grip's local +Y, NOT the
  // cosmetic left-hand glove yaw/pitch/roll. A relaxed grip alone will not
  // activate the screen, even if the hand is near the headset.
  this.watchFacing=dot([tracked[4],tracked[5],tracked[6]],this.toEye);
  const wristY=tracked[13];
  this.watchRaised=wristY>=eye[1]-.33;
  const inRange=d>=.32&&d<=.98;
  this.watchReady=inRange&&wristY>=eye[1]-.39&&this.watchGaze>.57;
  if(wristY<eye[1]-.47)this.suppressAutoUntilLower=false;
  const aligned=this.watchFacing>Math.max(.57,s.vrWristSensitivity+.12);
  const eligible=!this.suppressAutoUntilLower&&s.vrWristActivation!=='manual'&&
   inRange&&this.watchRaised&&aligned&&
   (s.vrWristActivation==='raised'||this.watchGaze>.60);
  if(eligible){if(this.attentionSince<0)this.attentionSince=now;this.lostSince=-1;}
  else{this.attentionSince=-1;if(this.lostSince<0)this.lostSince=now;}
  const previous=this.requested;
  const auto=!this.suppressAutoUntilLower&&s.vrWristActivation!=='manual'&&
   (eligible&&now-this.attentionSince>=350||
   previous&&!this.pinned&&this.lostSince>=0&&now-this.lostSince<280);
  this.requested=this.pinned||auto;
  if(this.requested&&!previous)this.guardUntil=now+260;
  this.guard=this.requested&&now<this.guardUntil;
  const motion=s.vrInterfaceMotion&&!settings.reducedMotion;
  this.open=motion?this.open+((this.requested?1:0)-this.open)*(1-Math.exp(-dt*17)):(this.requested?1:0);
  this.visible=this.open>.11;
  const p=this.panel;
  // Screen faces the headset. Unlike grip-local up, headset up never flips
  // upside down when a Touch controller is rolled.
  for(let i=0;i<3;i++){
   p.right[i]=head[i];p.up[i]=head[4+i];p.normal[i]=head[8+i];
  }
  p.width=s.vrWristSize*(.96+.04*this.open);
  p.height=p.width/1.45;
  if(this.pinned){
   // Accessible fallback: a pinned menu remains comfortably in view even
   // after lowering the watch, rather than drifting outside the frustum.
   for(let i=0;i<3;i++)
    p.center[i]=eye[i]-head[8+i]*.78-head[i]*.18+head[4+i]*.13;
  }else{
   // The expanded hologram grows from above/in front of the left cuff.
   // Keep a predictable small wrist offset; never compute a huge "lift" that
   // ejects the display above the player's view on different Touch poses.
   for(let i=0;i<3;i++)
    p.center[i]=status.center[i]-head[8+i]*.065+
     head[4+i]*(.11+p.height*.5+s.vrWristTopOffset);
   // Fit the *whole* screen into binocular view by clamping angular offsets
   // rather than hiding it when a corner leaves one eye's frustum.
   const dx=[p.center[0]-eye[0],p.center[1]-eye[1],p.center[2]-eye[2]];
   const depth=Math.max(.68,-dot(dx,[head[8],head[9],head[10]]));
   const side=clamp(dot(dx,[head[0],head[1],head[2]]),-depth*.32,depth*.32);
   const vertical=clamp(dot(dx,[head[4],head[5],head[6]]),-depth*.25,depth*.23);
   for(let i=0;i<3;i++)
    p.center[i]=eye[i]-head[8+i]*depth+head[i]*side+head[4+i]*vertical;
  }
  return this;
 }
}
export function attachWeapon(out,ray,grip,settings={}){
 out.set(ray);const anchor=grip||ray,x=Number.isFinite(settings.vrGripX)?clamp(settings.vrGripX,-.04,.04):0,y=Number.isFinite(settings.vrGripY)?clamp(settings.vrGripY,-.04,.04):0,z=Number.isFinite(settings.vrGripZ)?clamp(settings.vrGripZ,-.04,.04):0;
 for(let i=0;i<3;i++)out[12+i]=anchor[12+i]+ray[i]*x+ray[4+i]*y+ray[8+i]*z;return out;
}
export function panelAngularBounds(panel,rig){
 const dx=panel.center[0]-rig.eye[0],dy=panel.center[1]-rig.eye[1],dz=panel.center[2]-rig.eye[2],a=Number.isFinite(rig.headAngle)?rig.headAngle:-Math.PI/2;
 const forward=dx*Math.cos(a)+dz*Math.sin(a),side=-dx*Math.sin(a)+dz*Math.cos(a),distance=Math.max(.1,Math.hypot(dx,dz));
 return{x:Math.atan2(side,forward),y:Math.atan2(dy,distance),w:Math.atan2(panel.width*.5,distance),h:Math.atan2(panel.height*.5,distance)};
}
export function panelsOverlap(a,b,rig,padding=.035){const x=panelAngularBounds(a,rig),y=panelAngularBounds(b,rig);return Math.abs(x.x-y.x)<x.w+y.w+padding&&Math.abs(x.y-y.y)<x.h+y.h+padding;}
export function placeComfortCaption(out,rig,settings={},wrist=null,rows=2){
 const a=Number.isFinite(rig.headAngle)?rig.headAngle:-Math.PI/2,fx=Math.cos(a),fz=Math.sin(a),rx=-fz,rz=fx;
 const alert=!!settings.alertDock;
 out.width=alert?.46:.52;out.height=alert?.075:.20+Math.max(0,rows-2)*.025;
 out.right.splice(0,3,rx,0,rz);out.up.splice(0,3,0,1,0);out.normal.splice(0,3,-fx,0,-fz);
 // Keep the original high-priority alert lane. Ordinary dialogue sits about
 // 25 degrees to the right, ~1.5 meters away and BELOW eye height. Its inner
 // edge stays out of the central aiming lane and Ori floats above it.
 const docks=alert
  ?[[1.55,.88,.50],[1.55,.88,-.52],[1.55,.88,-.82]]
  :[[1.42,.68,-.36],[1.54,.72,-.46],[1.34,.63,-.58],
    [1.55,.70,.28],[1.72,.79,-.50]];
 for(const [forward,right,height]of docks){
  out.center.splice(0,3,rig.eye[0]+fx*forward+rx*right,rig.eye[1]+height,rig.eye[2]+fz*forward+rz*right);
  let blocked=!!wrist&&panelsOverlap(out,wrist,rig,.07);
  if(rig.aim?.direction){
   const d=rig.aim.direction,b=panelAngularBounds(out,rig),yaw=Math.atan2(-d.x*fz+d.y*fx,d.x*fx+d.y*fz),pitch=Math.atan2(d.z||0,Math.hypot(d.x,d.y));
   blocked ||= Math.abs(yaw-b.x)<b.w+.09&&Math.abs(pitch-b.y)<b.h+.09;
  }
  // The original, bounded Ori body should never occupy the same binocular
  // caption area, even if the regular preferred dock becomes obstructed.
  if(!blocked&&settings.oriVisible&&settings.oriPosition?.length===3&&[...settings.oriPosition].every(Number.isFinite)){
   const [x,y,z]=settings.oriPosition,dx=x-rig.eye[0],dz=z-rig.eye[2],d=Math.hypot(dx,dz);
   if(d>.1){
    const b=panelAngularBounds(out,rig),yaw=Math.atan2(-dx*fz+dz*fx,dx*fx+dz*fz),pitch=Math.atan2(y-rig.eye[1],d),radius=Math.atan2(.15,d);
    blocked=Math.abs(yaw-b.x)<b.w+radius+.02&&Math.abs(pitch-b.y)<b.h+radius+.02;
   }
  }
  if(!blocked&&settings.level){
   const b=panelAngularBounds(out,rig),level=settings.level;
   for(const e of [...level.enemies.filter(e=>!e.dead),level.exit,...level.relays.filter(r=>!r.active),...level.captives.filter(c=>!c.freed)]){
    const dx=e.x*WORLD_SCALE-rig.eye[0],dz=e.y*WORLD_SCALE-rig.eye[2],d=Math.hypot(dx,dz),f=dx*fx+dz*fz;
    if(f<=0||d>10)continue;
    const yaw=Math.atan2(-dx*fz+dz*fx,f),h=(e.type?entityHeight(e.type):1.3)*WORLD_SCALE,pitch=Math.atan2(h*.5-rig.eye[1],d),radius=Math.atan2(.35*WORLD_SCALE,d),half=Math.atan2(h*.5,d);
    if(Math.abs(yaw-b.x)<b.w+radius&&Math.abs(pitch-b.y)<b.h+half){blocked=true;break;}
   }
  }
  if(!blocked){out.hidden=false;return out;}
 }
 // Never cover genuine enemies, firing rays, critical alerts or the left wrist.
 // The complete text remains available through COMMS LOG.
 out.hidden=true;return out;
}
