// In-place, column-major transforms; out must not alias a or b in multiply.
export function matIdentity(out=new Float32Array(16)){out.fill(0);out[0]=out[5]=out[10]=out[15]=1;return out;}
export function matMultiply(out,a,b){for(let c=0;c<4;c++)for(let r=0;r<4;r++)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return out;}
export function rigidY(out,yaw,x,y,z){const c=Math.cos(yaw),s=Math.sin(yaw);out.set([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]);return out;}
export function inverseRigidY(out,yaw,x,y,z){const c=Math.cos(yaw),s=Math.sin(yaw);return rigidY(out,-yaw,-c*x+s*z,-y,-s*x-c*z);}
export function transformPoint(out,m,x,y,z){out[0]=m[0]*x+m[4]*y+m[8]*z+m[12];out[1]=m[1]*x+m[5]*y+m[9]*z+m[13];out[2]=m[2]*x+m[6]*y+m[10]*z+m[14];return out;}
export const directionAngle=(m,yaw=0)=>Math.atan2(-m[10],-m[8])-yaw;
export function frustumPlanes(out,m){for(let i=0;i<6;i++){const row=i>>1,sign=i%2?-1:1;for(let j=0;j<4;j++)out[i*4+j]=m[j*4+3]+sign*m[j*4+row];}return out;}
export function inFrustum(bounds,planes){for(let i=0;i<24;i+=4){const x=planes[i]>=0?bounds.max[0]:bounds.min[0],y=planes[i+1]>=0?bounds.max[1]:bounds.min[1],z=planes[i+2]>=0?bounds.max[2]:bounds.min[2];if(planes[i]*x+planes[i+1]*y+planes[i+2]*z+planes[i+3]<0)return false;}return true;}
