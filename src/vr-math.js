// Column-major WebGL matrices and screen-plane hit testing. No engine dependency.
export const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function panelPlacement(head,distance=2.5,width=2.8){
 const f=[-head[8],0,-head[10]],n=Math.hypot(f[0],f[2]);if(n<.01){f[0]=0;f[2]=-1;}else{f[0]/=n;f[2]/=n;}
 return {center:[head[12]+f[0]*distance,head[13]-.08,head[14]+f[2]*distance],right:[-f[2],0,f[0]],up:[0,1,0],normal:[-f[0],0,-f[2]],width,height:width*.75};
}
export function modelMatrix(panel){const {right:r,up:u,normal:n,center:p,width:w,height:h}=panel;return new Float32Array([r[0]*w,r[1]*w,r[2]*w,0,u[0]*h,u[1]*h,u[2]*h,0,...n,0,...p,1]);}
export function hitPanel(ray,panel){
 const origin=[ray[12],ray[13],ray[14]],direction=[-ray[8],-ray[9],-ray[10]],denom=dot(direction,panel.normal);if(denom>=-.00001)return null;
 const diff=panel.center.map((v,i)=>v-origin[i]),t=dot(diff,panel.normal)/denom;if(t<=0||t>15)return null;
 const local=origin.map((v,i)=>v+direction[i]*t-panel.center[i]),u=dot(local,panel.right)/panel.width+.5,v=.5-dot(local,panel.up)/panel.height;
 return u>=0&&u<=1&&v>=0&&v<=1?{u,v,distance:t}:null;
}
export function perspective(fov,aspect,near=.05,far=100){const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
