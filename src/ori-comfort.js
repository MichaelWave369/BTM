import {canOccupy,lineOfSight,moveBody} from './collision.js';
import {WORLD_SCALE} from './spatial.js';

/** Presentation only. The canonical Ori AI, hit tests and assist origin stay intact. */
export function oriVisualTarget({eye,head,x,z,peripheral=true}){
 if(!eye||!head||!peripheral)return{x,z};
 const forward=1.65,right=1.12;
 return{x:eye[0]-head[8]*forward+head[0]*right,z:eye[2]-head[10]*forward+head[2]*right};
}
export class OriFlight{
 constructor(){this.position=[0,0,0];this.initialized=false;this.visible=false;}
 reset(){this.initialized=false;this.visible=false;}
 update(game,rig,dt,settings={}){
  const eye=rig.eye,h=rig.headWorld,l=game.level,s=WORLD_SCALE,origin={x:eye[0]/s,y:eye[2]/s};
  const clear=(x,z)=>canOccupy(l,x/s,z/s,.13/s)&&lineOfSight(l,origin,{x:x/s,y:z/s});
  const safe=(x,z)=>{
   const dx=x-eye[0],dz=z-eye[2],f=-h[8]*dx-h[10]*dz,r=h[0]*dx+h[2]*dz,d=Math.hypot(dx,dz);
   if(f<.4||r<.65||r/f<.63||d<1.3||d>2.35||!clear(x,z))return false;
   if(rig.aim?.direction){const a=rig.aim.direction;if((dx*a.x+dz*a.y)/d>.97&&Math.abs(a.z||0)<.26)return false;}
   // Keep the small body clear of enemies, exits and nearby interactions.
   return ![...l.enemies.filter(e=>!e.dead),l.exit,...l.relays,...l.captives.filter(c=>!c.freed)].some(e=>{
    const ex=e.x*s-eye[0],ez=e.y*s-eye[2],n=Math.hypot(ex,ez);
    return n>.1&&n<7&&(dx*ex+dz*ez)/d/n>.991;
   });
  };
  let target=null;
  if(settings.vrOriPeripheral===false){const x=game.ori.x*s,z=game.ori.y*s;if(clear(x,z))target={x,z};}
  else for(const [f,r]of [[1.65,1.12],[1.5,1.25],[1.25,1.45],[1.7,1.15]]){
   const x=eye[0]-h[8]*f+h[0]*r,z=eye[2]-h[10]*f+h[2]*r;
   if(safe(x,z)){target={x,z};break;}
  }
  if(!target){this.visible=false;return this;}
  if(!this.initialized){this.position.splice(0,3,target.x,eye[1]-.15,target.z);this.initialized=true;}
  const body={x:this.position[0]/s,y:this.position[2]/s},follow=1-Math.exp(-Math.min(.05,dt)*5);
  moveBody(l,body,(target.x-this.position[0])*follow/s,(target.z-this.position[2])*follow/s,.13/s);
  this.position[0]=body.x*s;this.position[2]=body.y*s;this.position[1]+=(eye[1]-.15-this.position[1])*follow;
  this.visible=settings.vrOriPeripheral===false?clear(this.position[0],this.position[2]):safe(this.position[0],this.position[2]);
  return this;
 }
}
