// Deterministic, genuine shot-blocking barricades for optional solo upper decks.
// Horizontal collision engages only for bodies at deck height; the ground floor
// underneath and all standard/Pit/BBS levels retain their original geometry.
export const UPPER_COVER_HEIGHT=.98;
export const UPPER_BODY_HEIGHT=1.1;
export function authoredSoloUpperCover(layout){
 if(!layout?.soloPreview||!layout.upper)return [];
 const u=layout.upper,midX=u.x0+Math.floor((u.x1-u.x0)/2)+.5;
 return [u.y0+.5,u.y1-.5].map((y,i)=>({
  id:'upper-cover-'+i,x:midX,y,width:.78,depth:.34,
  height:UPPER_COVER_HEIGHT,floorHeight:u.height
 }));
}
export function coverIntersectsBody(level,x,y,r=.2,body=null){
 if(!level?.vertical?.soloPreview||!body||!Number.isFinite(body.height))return false;
 const feet=body.height,head=feet+UPPER_BODY_HEIGHT;
 return (level.upperCover||[]).some(c=>
  head>c.floorHeight+.015&&feet<c.floorHeight+c.height-.015&&
  x+r>c.x-c.width/2&&x-r<c.x+c.width/2&&
  y+r>c.y-c.depth/2&&y-r<c.y+c.depth/2);
}
// Slab intersection on the same normalized 3D ray used for tracked VR shots,
// AI line-of-sight, headset aim safety and native projectiles.
export function traceUpperCover(level,origin,d,max=Infinity){
 if(!level?.vertical?.soloPreview||!Number.isFinite(origin?.height))return null;
 let closest=null;
 for(const c of level.upperCover||[]){
  const axes=[
   [origin.x,d.x,c.x-c.width/2,c.x+c.width/2],
   [origin.y,d.y,c.y-c.depth/2,c.y+c.depth/2],
   [origin.height,d.z,c.floorHeight,c.floorHeight+c.height]
  ];
  let enter=0,exit=max;
  for(const [v,s,min,maxAxis] of axes){
   if(Math.abs(s)<1e-9){if(v<min||v>maxAxis){exit=-1;break;}continue;}
   const a=(min-v)/s,b=(maxAxis-v)/s,lo=Math.min(a,b),hi=Math.max(a,b);
   enter=Math.max(enter,lo);exit=Math.min(exit,hi);
   if(enter>exit)break;
  }
  if(enter<=exit&&exit>=0&&enter<=max&&(!closest||enter<closest.distance))
   closest={distance:enter,cover:c};
 }
 return closest;
}
