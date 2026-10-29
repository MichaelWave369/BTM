/** Keep Ori near his *real* simulation location while preserving the player's aim lane.
 * Returns a strictly visual position; gameplay, hit tests, AI and audio are unchanged.
 * Head orientation is the tracked view, not a guessed player yaw.
 */
export function oriVisualTarget({eye,head,x,z,aim=null,peripheral=true}){
 if(!Number.isFinite(x)||!Number.isFinite(z)||!eye||!head||!peripheral)return{x,z};
 const fx=-head[8],fz=-head[10],rx=head[0],rz=head[2];
 const dx=x-eye[0],dz=z-eye[2],forward=dx*fx+dz*fz,side=dx*rx+dz*rz;
 // Only intervene when Ori would fill the central field directly ahead.
 if(forward>.12&&forward<3.2&&Math.abs(side)<forward*.76+.29){
  const sign=side<-.01?-1:side>.01?1:-1;
  const needed=sign*(forward*.79+.43);
  const shift=needed-side;
  x+=rx*shift;z+=rz*shift;
 }
 // Keep Ori from floating right on the player's visor.
 const n=Math.hypot(x-eye[0],z-eye[2]);
 if(forward>0&&n<1.5&&n>.001){const push=1.5/n-1;x+=(x-eye[0])*push;z+=(z-eye[2])*push;}
 // If the right-hand aim would still intersect the visual core, nudge
 // perpendicular to it. This does NOT change Ori gameplay/hitbox location.
 if(aim?.direction){
  const d=aim.direction,ax=x-eye[0],az=z-eye[2],dist=Math.hypot(ax,az)||1;
  if((ax*d.x+az*d.y)/dist>.9&&dist<2.8){x-=d.y*.45;z+=d.x*.45;}
 }
 return{x,z};
}
