// Render the received multiplayer world with production WebGL and synthetic stereo only.
// No host writes, simulation step or network input is performed by this capture.
import{VRWorldRenderer}from'../src/vr-world-renderer.js';import{ImmersiveRig}from'../src/immersive-rig.js';import{matIdentity}from'../src/immersive-math.js';import{perspective}from'../src/vr-math.js';
export function networkStereo(game,{wrist=false}={}){
 const canvas=document.createElement('canvas');canvas.id='network-stereo';canvas.width=1280;canvas.height=720;canvas.style.cssText='position:fixed;inset:0;width:1280px;height:720px;z-index:10000;background:#061116';document.body.append(canvas);
 const r=new VRWorldRenderer(canvas),rig=new ImmersiveRig(),head=matIdentity(),right=matIdentity(),left=matIdentity();head[13]=1.65;right[12]=.18;right[13]=1.38;right[14]=-.42;left[12]=-.22;left[13]=wrist?1.4:.96;left[14]=-.45;
 const settings={vrQuality:'balanced',vrEyeHeight:1.65,vrPosture:'seated',reducedMotion:true,vrWristActivation:wrist?'gaze':'manual',vrTurnMode:'snap'},pose={head,rightRay:right,rightGrip:right,leftGrip:left,leftRay:left},views=[-.032,.032].map((x,i)=>{const inv=matIdentity();inv[12]=-x;inv[13]=-1.65;return{viewport:{x:i*640,y:0,width:640,height:720},projectionMatrix:perspective(Math.PI/2,640/720),transform:{inverse:{matrix:inv}}};});
 let stats;for(let i=0;i<30;i++){rig.prepare(game,pose,null,settings,.016,false);stats=r.renderWorld(views,game,rig,.016,{game,settings,screen:'',activate:()=>{},dialogue:'ORI: The squad signal is live.'});}
 const gl=r.gl,d=new Uint8Array(1280*720*4);gl.readPixels(0,0,1280,720,gl.RGBA,gl.UNSIGNED_BYTE,d);let a=0,b=0,lit=0;for(let y=0;y<720;y+=4)for(let x=0;x<640;x+=4){const i=(y*1280+x)*4,j=i+2560;a=(Math.imul(a,31)+d[i]+d[i+1]*7+d[i+2]*13)|0;b=(Math.imul(b,31)+d[j]+d[j+1]*7+d[j+2]*13)|0;if(d[i]+d[i+1]+d[i+2]>35)lit++;}
 const report={glError:gl.getError(),leftHash:a,rightHash:b,lit,remotePlayers:game.remotePlayers.length,remotePoses:game.remotePlayers.filter(p=>p.pose).length,wristOpen:!!r.ui.wristPanel,stats:structuredClone(stats),method:'Live received multiplayer read model in native production WebGL; synthetic stereo/hand matrices, not physical Quest or headset frame-rate proof.'};
 window.disposeNetworkStereo=()=>{r.dispose();canvas.remove();};return report;
}
