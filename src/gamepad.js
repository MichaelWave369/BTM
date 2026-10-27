// Standard browser gamepad layout: Xbox labels, Bluetooth or USB transport.
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=n=>Number.isFinite(n)?n:0;
export const CONTROLLER_DEFAULTS={controllerSensitivity:1,controllerDeadzone:.18,controllerRumble:true};
export function controllerSettings(stored={}){return {
  controllerSensitivity:Number.isFinite(stored.controllerSensitivity)?clamp(stored.controllerSensitivity,.4,2.5):1,
  controllerDeadzone:Number.isFinite(stored.controllerDeadzone)?clamp(stored.controllerDeadzone,.08,.4):.18,
  controllerRumble:typeof stored.controllerRumble==='boolean'?stored.controllerRumble:true
};}
export function stick(x=0,y=0,deadzone=.18){
  x=clamp(finite(x),-1,1);y=clamp(finite(y),-1,1);deadzone=clamp(finite(deadzone),.08,.4);
  const magnitude=Math.hypot(x,y);if(magnitude<=deadzone)return {x:0,y:0};
  const strength=(Math.min(1,magnitude)-deadzone)/(1-deadzone);
  return {x:x/magnitude*strength,y:y/magnitude*strength};
}
const idle=()=>({connected:false,ready:false,active:false,moveForward:0,moveStrafe:0,turn:0,fire:false,charge:0,alternate:null,sprint:false,actions:[],menu:{vertical:0,horizontal:0,confirm:false,back:false,start:false}});
export class GamepadInput {
  constructor({read=()=>{if(typeof globalThis.navigator?.getGamepads!=='function')throw Object.assign(Error('Gamepad API unavailable'),{name:'NotSupportedError'});return globalThis.navigator.getGamepads();}}={}){this.read=read;this.pad=null;this.identity=null;this.status='waiting';this.reset();}
  reset(){this.awaitingNeutral=true;this.previous=[];this.chargeTime=0;this.menuDirection='';this.repeatTime=0;}
  poll(dt,settings={},focused=true){
    dt=clamp(finite(dt),0,.05);let pads;this.error=null;
    try{pads=Array.from(this.read()||[]).filter(p=>p&&p.connected!==false);}
    catch(e){pads=[];this.error=e.name||'Unavailable';}
    const current=pads.find(p=>p.index===this.pad?.index&&p.id===this.pad?.id&&p.mapping==='standard');
    const pad=current||pads.find(p=>p.mapping==='standard');
    const identity=pad?pad.index+':'+pad.id:null,changed=identity!==this.identity,disconnected=!!this.identity&&changed;
    if(changed)this.reset();this.identity=identity;this.pad=pad||null;
    this.status=pad?'connected':this.error?'blocked':pads.length?'unmapped':'waiting';
    const result={...idle(),connected:!!pad,changed,disconnected,status:this.status};
    if(!pad||!focused){this.reset();return result;}
    const deadzone=controllerSettings(settings).controllerDeadzone;
    const move=stick(pad.axes?.[0],pad.axes?.[1],deadzone),look=stick(pad.axes?.[2],pad.axes?.[3],deadzone);
    const buttons=Array.from({length:17},(_,i)=>{const b=pad.buttons?.[i];return typeof b==='number'?b>.25:!!b&&(b.pressed||finite(b.value)>.25);});
    if(this.awaitingNeutral){if(!buttons.some(Boolean)&&!move.x&&!move.y&&!look.x&&!look.y)this.awaitingNeutral=false;return result;}
    const down=i=>buttons[i]&&!this.previous[i],up=i=>!buttons[i]&&this.previous[i];
    result.ready=true;result.active=buttons.some(Boolean)||!!(move.x||move.y||look.x||look.y);
    result.moveForward=-move.y;result.moveStrafe=move.x;result.turn=Math.sign(look.x)*Math.pow(Math.abs(look.x),1.5)*1.45;
    result.fire=buttons[7];result.firePressed=down(7);result.sprint=buttons[10];
    if(buttons[6])this.chargeTime=Math.min(1.5,this.chargeTime+dt);
    if(up(6)){result.alternate=this.chargeTime/1.5;this.chargeTime=0;}
    result.charge=buttons[6]?this.chargeTime/1.5:0;
    for(const [name,indexes] of Object.entries({interact:[0],dodge:[1],reload:[2],ori:[3],previous:[4,14],next:[5,15],map:[8],pause:[9],help:[11],vision:[12],bass:[13]}))if(indexes.some(down))result.actions.push(name);
    const vertical=buttons[12]?-1:buttons[13]?1:move.y<-.55?-1:move.y>.55?1:0;
    const horizontal=buttons[14]?-1:buttons[15]?1:move.x<-.55?-1:move.x>.55?1:0;
    const direction=vertical?'v'+vertical:horizontal?'h'+horizontal:'';let repeat=false;
    if(direction!==this.menuDirection){repeat=!!direction;this.repeatTime=.36;this.menuDirection=direction;}
    else if(direction){this.repeatTime-=dt;if(this.repeatTime<=0){repeat=true;this.repeatTime=.13;}}
    result.menu={vertical:repeat?vertical:0,horizontal:repeat&&!vertical?horizontal:0,confirm:down(0),back:down(1),start:down(9)};
    this.previous=buttons;return result;
  }
}
export function gameplayInput(keys,pad=idle(),fire=false,sensitivity=1){return {
  moveForward:clamp((keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+pad.moveForward,-1,1),
  moveStrafe:clamp((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+pad.moveStrafe,-1,1),
  turn:(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0)+pad.turn*controllerSettings({controllerSensitivity:sensitivity}).controllerSensitivity,
  sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||pad.sprint,
  fire:fire||keys.has('KeyZ')||keys.has('ControlLeft')||pad.fire
};}
export function controllerActions(game,pad,{map=()=>{},help=()=>{},fire=true,dodgeAngle}={}){
  for(const action of pad.actions){
    if(action==='interact')game.interact();if(action==='reload')game.reload();if(action==='ori')game.oriAbility();
    if(action==='vision')game.vision();if(action==='bass')game.bassDrop();
    if(action==='dodge')game.dodge({left:pad.moveStrafe<-.25,right:pad.moveStrafe>.25,back:pad.moveForward<-.25,...(Number.isFinite(dodgeAngle)?{angle:dodgeAngle}:{})});
    if(action==='previous'||action==='next')game.selectWeapon((game.weapon+(action==='next'?1:game.unlocked-1))%game.unlocked);
    if(action==='map')map();if(action==='help')help();
  }
  if(fire){if(pad.firePressed)game.requestFire();if(pad.alternate!==null)game.requestFire(true,pad.alternate);}
}
// Menus use the same native controls as mouse/keyboard. No synthetic key events.
export class ControllerMenu {
  constructor({root,back=()=>{},resume=()=>{}}){this.root=root;this.back=back;this.resume=resume;}
  items(){return [...this.root()?.querySelectorAll('button,input,select,a[href]')||[]].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length);}
  focus(el){if(!el)return;this.clear();el.classList.add('controller-focus');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'});}
  clear(){this.root()?.querySelectorAll('.controller-focus').forEach(el=>el.classList.remove('controller-focus'));}
  handle(menu){
    if(menu.back){this.back();return;}if(menu.start){this.resume();return;}
    const items=this.items();if(!items.length)return;let i=items.indexOf(globalThis.document.activeElement);
    if(menu.vertical){i=i<0?0:(i+menu.vertical+items.length)%items.length;this.focus(items[i]);}
    if(i<0&&(menu.confirm||menu.horizontal)){i=0;this.focus(items[0]);}
    const el=items[i];if(!el)return;
    if(menu.horizontal){
      if(el.matches('input[type=range]')){const step=Number(el.step)||1;el.value=String(clamp(Number(el.value)+step*menu.horizontal,Number(el.min),Number(el.max)));el.dispatchEvent(new Event('input',{bubbles:true}));}
      if(el.matches('select')){el.selectedIndex=clamp(el.selectedIndex+menu.horizontal,0,el.options.length-1);el.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    if(menu.confirm&&!el.matches('input[type=range],select'))el.click();
  }
}
export class ControllerRumble {
  constructor(){this.actuator=null;this.remaining=0;}
  tick(dt){this.remaining=Math.max(0,this.remaining-dt);}
  play(pad,kind,enabled=true){
    const actuator=pad?.vibrationActuator;if(!enabled||!actuator?.playEffect||this.remaining>0&&kind!=='hurt')return;
    const effect=kind==='hurt'?{duration:150,weakMagnitude:.35,strongMagnitude:.6}:kind==='bass'?{duration:220,weakMagnitude:.6,strongMagnitude:.8}:{duration:65,weakMagnitude:.32,strongMagnitude:.12};
    this.actuator=actuator;this.remaining=effect.duration/1000;
    try{Promise.resolve(actuator.playEffect('dual-rumble',effect)).catch(()=>{});}catch{/* Haptics are optional. */}
  }
  stop(){this.remaining=0;try{Promise.resolve(this.actuator?.reset?.()).catch(()=>{});}catch{}this.actuator=null;}
}
