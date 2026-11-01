import {canOccupy,lineOfSight,moveBody} from './collision.js';
import {WORLD_SCALE,WALL_HEIGHT} from './spatial.js';

// Ori is a presentation-only companion. Its authoritative position, assist
// targeting, damage and networking remain owned by the original Game.
const PERIPHERAL_DOCKS=Object.freeze([
 [1.62,.70], // ~23 degrees right, the preferred glanceable dock
 [1.45,.64], // closer in a cramped room
 [1.78,.76], // a little farther around geometry
 [1.45,.79], // wider fallback when a target occupies the near-right lane
 [1.26,.57],
 [1.90,.63]  // narrower fallback, still outside the central aiming lane
]);
export function oriVisualTarget({eye,head,x,z,peripheral=true}){
 if(!eye||!head||!peripheral)return{x,z};
 const [forward,right]=PERIPHERAL_DOCKS[0];
 return{x:eye[0]-head[8]*forward+head[0]*right,z:eye[2]-head[10]*forward+head[2]*right};
}
export class OriFlight{
 constructor(){this.position=[0,0,0];this.initialized=false;this.visible=false;this.reason='not-initialized';}
 reset(){this.initialized=false;this.visible=false;this.reason='reset';}
 update(game,rig,dt,settings={}){
  const eye=rig.eye,h=rig.headWorld,l=game.level,s=WORLD_SCALE,origin={x:eye[0]/s,y:eye[2]/s};
  const clear=(x,z)=>canOccupy(l,x/s,z/s,.13/s)&&lineOfSight(l,origin,{x:x/s,y:z/s});
  const safe=(x,z)=>{
   const dx=x-eye[0],dz=z-eye[2],f=-h[8]*dx-h[10]*dz,r=h[0]*dx+h[2]*dz,d=Math.hypot(dx,dz);
   // The 15-29 degree right-hand area keeps Ori within a natural glance,
   // while never placing it in the central firing or left wrist lanes.
   if(f<.9||r<.49||r/f<.26||r/f>.56||d<1.2||d>2.4||!clear(x,z))return false;
   if(rig.aim?.direction){const a=rig.aim.direction;if((dx*a.x+dz*a.y)/d>.97&&Math.abs(a.z||0)<.26)return false;}
   // A companion must not drift in front of real enemies, exits or rescues.
   return ![...l.enemies.filter(e=>!e.dead),l.exit,...l.relays,...l.captives.filter(c=>!c.freed)].some(e=>{
    const ex=e.x*s-eye[0],ez=e.y*s-eye[2],n=Math.hypot(ex,ez);
    return n>.1&&n<7&&(dx*ex+dz*ez)/d/n>.991;
   });
  };
  let target=null;
  if(settings.vrOriPeripheral===false){const x=game.ori.x*s,z=game.ori.y*s;if(clear(x,z))target={x,z};}
  else for(const [forward,right]of PERIPHERAL_DOCKS){
   const x=eye[0]-h[8]*forward+h[0]*right,z=eye[2]-h[10]*forward+h[2]*right;
   if(safe(x,z)){target={x,z};break;}
  }
  if(!target){this.visible=false;this.reason='no-clear-right-dock';return this;}
  const height=Math.min(eye[1]+.17,WALL_HEIGHT*s-.16);
  if(!this.initialized){this.position.splice(0,3,target.x,height,target.z);this.initialized=true;}
  const body={x:this.position[0]/s,y:this.position[2]/s},follow=1-Math.exp(-Math.min(.05,dt)*5);
  moveBody(l,body,(target.x-this.position[0])*follow/s,(target.z-this.position[2])*follow/s,.13/s);
  this.position[0]=body.x*s;this.position[2]=body.y*s;this.position[1]+=(height-this.position[1])*follow;
  this.visible=settings.vrOriPeripheral===false?clear(this.position[0],this.position[2]):safe(this.position[0],this.position[2]);
  this.reason=this.visible?'visible':'occluded-while-moving';
  return this;
 }
}
