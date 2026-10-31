import {WORLD_SCALE,entityHeight} from './spatial.js';
// Meter-based equipment layout and sanitized optional settings. No simulation writes.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const EQUIPMENT_DEFAULTS=Object.freeze({captions:true,spokenDialogue:false,speechVolume:.7,vrHandStyle:'combat',vrWristSize:.32,vrWristOffset:.065,vrWristActivation:'gaze',vrWristSensitivity:.4,vrHudVisible:true,vrHologramBrightness:.85,vrSubtitleSize:1,vrSubtitleMode:'comfort',vrSubtitleDuration:1,vrGripX:0,vrGripY:0,vrGripZ:0,vrLeftHandPitch:20,vrLeftHandYaw:0,vrLeftHandRoll:0,vrWristTopOffset:.03,vrOriScale:.65,vrOriPeripheral:true,vrInterfaceMotion:true});
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
 constructor(){this.status=equipmentPanel(.064,.028);this.panel=equipmentPanel();this.toEye=[0,0,0];this.open=0;this.pinned=false;this.last=-1;this.attentionSince=-1;this.lostSince=-1;this.guardUntil=0;this.requested=false;this.guard=false;this.visible=false;this.statusVisible=false;}
 togglePin(){this.pinned=!this.pinned;this.attentionSince=-1;}
 reset(){this.open=0;this.pinned=false;this.last=-1;this.attentionSince=this.lostSince=-1;this.requested=this.guard=this.visible=this.statusVisible=false;}
 update(rig,settings={},now=0){
  const s=equipmentSettings(settings),dt=this.last<0?0:clamp((now-this.last)/1000,0,.05);this.last=now;
  // Visual calibration never alters controller tracking, aim, or interaction rays.
  const m=rig.hasVisualLeft?rig.leftVisualWorld:rig.leftWorld,eye=rig.eye;
  if(!rig.hasLeft||!m||!s.vrHudVisible){this.open=0;this.visible=this.statusVisible=this.requested=this.guard=false;this.pinned=false;this.attentionSince=-1;return this;}
  const status=this.status;at(status.center,m,0,.0415+s.vrWristTopOffset,.115);
  for(let i=0;i<3;i++){status.right[i]=m[i];status.up[i]=-m[8+i];status.normal[i]=m[4+i];this.toEye[i]=eye[i]-status.center[i];}
  const distance=Math.hypot(...this.toEye);normal(this.toEye);this.statusVisible=distance>.28&&distance<1.05;
  const facing=dot(status.normal,this.toEye),head=rig.headWorld;
  const view=head?head[8]*this.toEye[0]+head[9]*this.toEye[1]+head[10]*this.toEye[2]:1;
  const inRange=distance>=.36&&distance<=.95,height=status.center[1]>=eye[1]-(this.requested?.50:.42),threshold=s.vrWristSensitivity-(this.requested?.16:0);
  const attentive=inRange&&height&&facing>threshold&&(s.vrWristActivation==='raised'||view>(this.requested?.42:.60)),eligible=s.vrWristActivation!=='manual'&&attentive;
  if(eligible){if(this.attentionSince<0)this.attentionSince=now;this.lostSince=-1;}else{this.attentionSince=-1;if(this.lostSince<0)this.lostSince=now;}
  let requested=inRange&&(this.pinned||eligible&&now-this.attentionSince>=160||this.requested&&now-this.lostSince<220);if(!inRange)requested=false;
  if(requested&&!this.requested)this.guardUntil=now+240;this.requested=requested;this.guard=requested&&now<this.guardUntil;
  const motion=s.vrInterfaceMotion&&!settings.reducedMotion;this.open=motion?this.open+((requested?1:0)-this.open)*(1-Math.exp(-dt*15)):(requested?1:0);this.visible=inRange&&this.open>.08;
  // The grip's local +Y can point DOWN after a real Touch wrist roll. Keep the
  // hardware on the calibrated cuff, but project the hologram from the glove's
  // upper silhouette in viewer-up space. Its entire lower edge clears the hand.
  const p=this.panel;for(let i=0;i<3;i++)p.normal[i]=this.toEye[i];normal(p.normal);
  for(let i=0;i<3;i++)p.right[i]=(head?head[i]:i===0?1:0)*.85+status.right[i]*.15;
  const project=dot(p.right,p.normal);for(let i=0;i<3;i++)p.right[i]-=p.normal[i]*project;normal(p.right);
  const n=p.normal,r=p.right;p.up[0]=n[1]*r[2]-n[2]*r[1];p.up[1]=n[2]*r[0]-n[0]*r[2];p.up[2]=n[0]*r[1]-n[1]*r[0];normal(p.up);
  // Prevent the panel from flipping upside down as the wrist rotates.
  const upward=head?[head[4],head[5],head[6]]:[0,1,0];if(dot(p.up,upward)<0){for(let i=0;i<3;i++){p.up[i]*=-1;p.right[i]*=-1;}}
  p.width=s.vrWristSize*(.92+.08*this.open);p.height=p.width/1.5;
  at(p.center,m,0,.015,.07);
  let top=-Infinity;
  // Conservative bounds of the existing glove, fingers and forearm, in meters.
  for(const x of [-.06,.06])for(const y of [-.06,.045])for(const z of [-.11,.16]){
   const corner=[m[12]+m[0]*x+m[4]*y+m[8]*z,m[13]+m[1]*x+m[5]*y+m[9]*z,m[14]+m[2]*x+m[6]*y+m[10]*z];
   top=Math.max(top,dot(corner,upward));
  }
  for(let i=0;i<3;i++)p.center[i]+=p.normal[i]*s.vrWristOffset;
  const lift=(top+s.vrWristTopOffset+.012+p.height*.5*Math.abs(dot(p.up,upward))+p.width*.5*Math.abs(dot(p.right,upward))-dot(p.center,upward))/Math.max(.25,dot(p.up,upward));
  for(let i=0;i<3;i++)p.center[i]+=p.up[i]*Math.max(0,lift);
  const px=p.center[0]-eye[0],py=p.center[1]-eye[1],pz=p.center[2]-eye[2],range=Math.hypot(px,py,pz)||1;if(range<.6){p.center[0]=eye[0]+px/range*.6;p.center[1]=eye[1]+py/range*.6;p.center[2]=eye[2]+pz/range*.6;}
  // Conservatively fit all four corners, including a 64mm binocular eye span.
  if(head){let depth=0;for(const x of [-.5,.5])for(const y of [-.5,.5]){const dx=p.center[0]-eye[0]+p.right[0]*p.width*x+p.up[0]*p.height*y,dy=p.center[1]-eye[1]+p.right[1]*p.width*x+p.up[1]*p.height*y,dz=p.center[2]-eye[2]+p.right[2]*p.width*x+p.up[2]*p.height*y,side=dx*head[0]+dy*head[1]+dz*head[2],up=dx*head[4]+dy*head[5]+dz*head[6],forward=-(dx*head[8]+dy*head[9]+dz*head[10]);depth=Math.max(depth,(Math.abs(side)+.032)/.82-forward,Math.abs(up)/.92-forward);}if(depth>.2){this.visible=false;this.guard=false;}else for(let i=0;i<3;i++)p.center[i]-=head[8+i]*depth;}return this;
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
 out.width=settings.alertDock?.46:.68;out.height=settings.alertDock?.075:.20+Math.max(0,rows-2)*.025;
 out.right.splice(0,3,rx,0,rz);out.up.splice(0,3,0,1,0);out.normal.splice(0,3,-fx,0,-fz);
 // Compact lower-right dock: its inner edge stays outside the central 15°.
 for(const height of settings.alertDock?[.5,-.52,-.82]:[-.52,.54,-.82]){
  out.center.splice(0,3,rig.eye[0]+fx*1.55+rx*.88,rig.eye[1]+height,rig.eye[2]+fz*1.55+rz*.88);
  let blocked=!!wrist&&panelsOverlap(out,wrist,rig,.07);
  if(rig.aim?.direction){const d=rig.aim.direction,b=panelAngularBounds(out,rig),yaw=Math.atan2(-d.x*fz+d.y*fx,d.x*fx+d.y*fz),pitch=Math.atan2(d.z||0,Math.hypot(d.x,d.y));blocked ||= Math.abs(yaw-b.x)<b.w+.09&&Math.abs(pitch-b.y)<b.h+.09;}
  if(!blocked&&settings.level){
   const b=panelAngularBounds(out,rig),level=settings.level;
   for(const e of [...level.enemies.filter(e=>!e.dead),level.exit,...level.relays.filter(r=>!r.active),...level.captives.filter(c=>!c.freed)]){
    const dx=e.x*WORLD_SCALE-rig.eye[0],dz=e.y*WORLD_SCALE-rig.eye[2],d=Math.hypot(dx,dz),f=dx*fx+dz*fz;
    if(f<=0||d>10)continue;
    const yaw=Math.atan2(-dx*fz+dz*fx,f),height=(e.type?entityHeight(e.type):1.3)*WORLD_SCALE,pitch=Math.atan2(height*.5-rig.eye[1],d),radius=Math.atan2(.35*WORLD_SCALE,d),half=Math.atan2(height*.5,d);
    if(Math.abs(yaw-b.x)<b.w+radius&&Math.abs(pitch-b.y)<b.h+half){blocked=true;break;}
   }
  }
  if(!blocked){out.hidden=false;return out;}
 }
 // Aim takes precedence. The communication log retains a temporarily hidden line.
 out.hidden=true;return out;
}
