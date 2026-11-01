import {TouchInput} from './vr-input.js';import {panelPlacement,hitPanel} from './vr-math.js';import {VRPanel,ArcadeGL} from './vr-renderer.js';import {VRWorldRenderer} from './vr-world-renderer.js';import {ImmersiveRig} from './immersive-rig.js';import {QUALITY} from './world-scene.js';
// One lifecycle for both presentations; the app owns the only simulation clock.
export class VRArcade {
 constructor({onFrame=()=>{},onStart=()=>{},onEnd=()=>{},onPause=()=>{},onStatus=()=>{},data=()=>({}),settings=()=>({}),xr=()=>globalThis.navigator?.xr,presenter=()=>new ArcadeGL(document.createElement('canvas'),{defer:true}),worldPresenter=assets=>new VRWorldRenderer(document.createElement('canvas'),{defer:true,assets}),panel=()=>new VRPanel(),layer=(s,g,scale=.85)=>new globalThis.XRWebGLLayer(s,g,{antialias:false,framebufferScaleFactor:scale})}={}){
  Object.assign(this,{onFrame,onStart,onEnd,onPause,onStatus,data,settings,getXR:xr,makePresenter:presenter,makeWorldPresenter:worldPresenter,makePanel:panel,makeLayer:layer});this.session=null;this.ready=false;this.pending=false;this.supported=false;this.input=new TouchInput();this.last=0;this.placement=null;this.frameId=null;this.ended=false;this.mode='arcade';
 }
 get active(){return !!this.session;}
 get immersive(){return this.active&&this.mode==='immersive';}
 async probe(){try{this.supported=!!await this.getXR()?.isSessionSupported('immersive-vr');}catch{this.supported=false;}this.onStatus(this.supported?'VR HEADSET READY / CHOOSE ARCADE OR IMMERSIVE':'CLASSIC READY / VR NEEDS A WEBXR HEADSET');return this.supported;}
 async enter(mode='arcade'){
  if(this.pending||this.active)return false;this.mode=mode==='immersive'?'immersive':'arcade';this.pending=true;this.onStatus('OPENING VR…');this.ended=false;
  try{
   const xr=this.getXR();if(!xr?.requestSession)throw Error('WebXR unavailable. Open this HTTPS game in your Quest browser.');
   const session=await xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});this.session=session;
   session.addEventListener('end',()=>{if(this.session===session)this.cleanup();},{once:true});session.addEventListener('visibilitychange',()=>{if(this.session===session&&session.visibilityState!=='visible'){this.input.reset();this.onPause();}});
   session.addEventListener('inputsourceschange',e=>{if(this.session!==session)return;this.input.reset();if(e.removed?.length)this.onPause();});
   this.presenter=this.mode==='immersive'?this.makeWorldPresenter(this.data().assets):this.makePresenter();const gl=this.presenter.gl;await gl.makeXRCompatible?.();if(this.session!==session)return false;this.presenter.initialize?.();
   gl.canvas.addEventListener?.('webglcontextlost',this.contextLost=e=>{e.preventDefault();this.onStatus('VR GRAPHICS LOST / RETURNING TO CLASSIC');void this.exit();},{once:true});
   this.layer=this.makeLayer(session,gl,this.mode==='immersive'?(QUALITY[this.settings().vrQuality]||QUALITY.balanced).scale:.85);session.updateRenderState({baseLayer:this.layer,depthNear:.04,depthFar:65});
   this.space=await session.requestReferenceSpace('local-floor').catch(()=>session.requestReferenceSpace('local'));if(this.session!==session)return false;
   this.space.addEventListener?.('reset',()=>{if(this.session!==session)return;this.recenter();this.onPause();});this.panel=this.makePanel();this.rig=this.mode==='immersive'?new ImmersiveRig():null;this.placement=null;this.last=0;this.input.reset();this.ready=true;this.onStart(this.mode);this.onStatus(this.mode==='immersive'?'IMMERSIVE WORLD ACTIVE':'VR ARCADE ACTIVE');this.schedule(session);return true;
  }catch(error){this.onStatus((error.name==='NotAllowedError'||error.name==='SecurityError'?'VR PERMISSION / CLICK ENTER VR AGAIN: ':'VR UNAVAILABLE: ')+error.message);await this.exit();return false;}
  finally{this.pending=false;}
 }
 schedule(session){this.frameId=session.requestAnimationFrame((t,f)=>{if(this.session===session)this.frame(t,f);});}
 recenter(){this.placement=null;this.rig?.recenter();this.input.reset();}
 event(e,game){if(this.rig&&e.type==='sound'&&e.name==='dodge')this.rig.fade=.1;this.presenter?.event?.(e,game);if(!this.session||!this.settings().controllerRumble)return;const power=e.type==='bass'?.7:e.type==='sound'&&e.name==='fire'?.24:e.type==='hit'?.18:0;if(!power)return;for(const source of this.session.inputSources||[]){if(source.handedness!=='right'&&e.type!=='bass')continue;try{source.gamepad?.hapticActuators?.[0]?.pulse?.(power,e.type==='bass'?110:35)?.catch?.(()=>{});}catch{}}}
 frame(now,frame){
  const session=this.session;if(!session||!this.ready)return;
  try{
   const dt=this.last?Math.max(0,Math.min(.05,(now-this.last)/1000)):0;this.last=now;
   const pose=frame.getViewerPose(this.space),visible=session.visibilityState==='visible';
   if(!pose||!visible){this.input.reset();this.onPause();}
   else{
    const settings=this.settings(),sources=Array.from(session.inputSources),right=sources.find(s=>s.handedness==='right'&&s.targetRaySpace)||(this.mode==='arcade'?sources.find(s=>s.targetRaySpace):null),left=sources.find(s=>s.handedness==='left'),get=space=>space&&frame.getPose(space,this.space)?.transform.matrix,ray=get(right?.targetRaySpace),state=this.input.poll(sources,dt,settings,true),before=this.data();
    let cursor=null,target=null;
    if(this.mode==='arcade'||before.screen){if(!this.placement)this.placement=panelPlacement(pose.transform.matrix,Number(settings.vrDistance)||2.5,Number(settings.vrWidth)||2.8);cursor=ray?hitPanel(ray,this.placement):null;target=this.panel.targetAt(cursor);}
    if(target){state.fire=false;state.firePressed=false;state.alternate=null;state.menu.confirm=false;if(state.pointerPressed){target.action();this.input.reset();state.ready=false;state.active=false;}}
    if(this.session!==session)return;
    const spatial=this.mode==='immersive'?{rig:this.rig,pose:{head:pose.transform.matrix,rightRay:ray||null,rightGrip:get(right?.gripSpace)||ray||null,leftRay:get(left?.targetRaySpace)||null,leftGrip:get(left?.gripSpace)||get(left?.targetRaySpace)||null},pointerTarget:pad=>this.presenter.interfaceTarget?.(spatial.pose,this.rig,this.data().game,performance.now(),pad)}:null;
    if(spatial&&!ray&&before.game?.mode==='playing'){this.input.reset();this.onPause();state.ready=false;state.fire=false;}
    this.onFrame(now,state,spatial);if(this.session!==session)return;
    const data=this.data(),views=pose.views.map(v=>({projectionMatrix:v.projectionMatrix,transform:v.transform,viewport:this.layer.getViewport(v)}));
    if(spatial){this.presenter.renderWorld(views,data.game,this.rig,dt,data,this.layer.framebuffer);if(data.screen){if(!this.placement)this.placement=panelPlacement(pose.transform.matrix,Number(settings.vrDistance)||2.5,Number(settings.vrWidth)||2.8);this.presenter.renderMenu?.(views,this.placement,this.panel.paint(data,cursor),this.layer.framebuffer);}else this.placement=null;}
    else{if(!this.placement)this.placement=panelPlacement(pose.transform.matrix,Number(settings.vrDistance)||2.5,Number(settings.vrWidth)||2.8);this.presenter.upload(this.panel.paint(data,cursor));this.presenter.render(views,this.placement,this.layer.framebuffer);}
   }
   if(this.session===session)this.schedule(session);
  }catch(error){this.onStatus('VR FRAME ERROR: '+error.message);this.onPause();void this.exit();}
 }
 async exit(){const session=this.session;if(!session){this.cleanup();return;}try{await session.end();}catch{this.cleanup();}}
 cleanup(){if(this.ended)return;this.ended=true;const wasActive=!!this.session;this.ready=false;this.session=null;this.input.reset();this.placement=null;this.data().game?.clearCombatPose?.();if(this.presenter){this.presenter.gl.canvas.removeEventListener?.('webglcontextlost',this.contextLost);this.presenter.dispose();this.presenter=null;}this.panel=null;this.rig=null;this.layer=null;this.space=null;if(wasActive)this.onEnd();}
}
