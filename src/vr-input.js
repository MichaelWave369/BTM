import {GamepadInput} from './gamepad.js';
const pressed=(pad,index)=>{const b=pad?.buttons?.[index];return !!b&&(b.pressed||b.value>.25);};
const quest=source=>source?.profiles?.some(p=>/^(oculus-touch|meta-quest-touch)/.test(p));
// xr-standard owns indices 0/1/3 and axes 2/3. Quest face buttons are optional.
export class TouchInput {
 constructor(){this.snapshot=[];this.input=new GamepadInput({read:()=>this.snapshot});this.rightTrigger=false;}
 reset(){this.input.reset();this.rightTrigger=false;}
 poll(sources,dt,settings={},visible=true){
  const supported=Array.from(sources||[]).filter(s=>s.gamepad?.mapping==='xr-standard'),left=supported.find(s=>s.handedness==='left'),right=supported.find(s=>s.handedness==='right');
  const l=left?.gamepad,r=right?.gamepad,buttons=Array(17).fill(false),face=(source,index)=>quest(source)&&pressed(source.gamepad,index);
  buttons[0]=pressed(r,1)||face(right,4);buttons[1]=face(right,5);buttons[8]=face(left,4);buttons[11]=face(left,5);buttons[3]=pressed(l,1);
  // Right-stick vertical is NOT a weapon shortcut. Diagonal turns must never cycle weapons.
  // Quest weapon changes use the deliberate wrist Arsenal buttons instead.
  buttons[6]=pressed(l,0);buttons[7]=pressed(r,0);buttons[9]=pressed(r,3);buttons[10]=pressed(l,3);
  this.snapshot=left||right?[{id:'XR '+(left?.profiles?.[0]||'no-left')+' / '+(right?.profiles?.[0]||'no-right'),index:0,connected:true,mapping:'standard',axes:[l?.axes?.[2]||0,l?.axes?.[3]||0,r?.axes?.[2]||0,0],buttons:buttons.map(pressed=>({pressed,value:pressed?1:0}))}]:[];
  const state=this.input.poll(dt,settings,visible),trigger=pressed(r,0);
  // Quest Y is an explicit jump, not the Xbox right-stick HELP shortcut.
  state.actions=state.actions.map(action=>action==='help'?'jump':action);state.pointerPressed=state.ready&&trigger&&!this.rightTrigger;state.menu.confirm=state.menu.confirm||state.pointerPressed;this.rightTrigger=trigger;return state;
 }
}
export const VR_CONTROLS=[['LEFT STICK','MOVE / STRAFE'],['RIGHT STICK','TURN ONLY · NO WEAPON CYCLING'],['RIGHT TRIGGER','FIRE / SELECT MENU'],['LEFT TRIGGER','HOLD / RELEASE CHARGE'],['RIGHT GRIP / A','INTERACT'],['LEFT GRIP','ORI SCAN / STUN'],['A / B / X / Y','USE / DASH / WRIST MAP / JUMP'],['LEFT STICK CLICK','HOLD SPRINT / AIR THRUST IN TWO-STORY'],['RIGHT STICK CLICK','PAUSE / RESUME'],['WRIST ARSENAL','SELECT WEAPONS · POINT + TRIGGER'],['WRIST TOOLS','RELOAD · VISION · BASS · OTHER TOOLS']];
