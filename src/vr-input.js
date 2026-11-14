import {GamepadInput} from './gamepad.js';
const pressed=(pad,index)=>{const b=pad?.buttons?.[index];return !!b&&(b.pressed||b.value>.25);};
const quest=source=>source?.profiles?.some(p=>/^(oculus-touch|meta-quest-touch)/.test(p));
// xr-standard owns indices 0/1/3 and axes 2/3. Quest face buttons are optional.
export class TouchInput {
 constructor(){this.snapshot=[];this.input=new GamepadInput({read:()=>this.snapshot});this.rightTrigger=false;this.rightStickDuration=0;this.rightStickLast=false;}
 reset(){this.input.reset();this.rightTrigger=false;this.rightStickDuration=0;this.rightStickLast=false;}
 poll(sources,dt,settings={},visible=true){
  const supported=Array.from(sources||[]).filter(s=>s.gamepad?.mapping==='xr-standard'),left=supported.find(s=>s.handedness==='left'),right=supported.find(s=>s.handedness==='right');
  const l=left?.gamepad,r=right?.gamepad,buttons=Array(17).fill(false),face=(source,index)=>quest(source)&&pressed(source.gamepad,index);
  // Left thumb stays on locomotion while right B handles airborne jump.
  // Y restores reload; right A is DASH and the right grip alone is USE.
  buttons[0]=pressed(r,1);buttons[1]=face(right,4);buttons[2]=face(left,5);
  buttons[8]=face(left,4);buttons[11]=face(right,5);buttons[3]=pressed(l,1);
  buttons[6]=pressed(l,0);buttons[7]=pressed(r,0);buttons[10]=pressed(l,3);
  // Deliberate right-stick click: short tap cycles weapons, long hold pauses.
  // Right-stick turning alone can never change the equipped weapon.
  const stick=pressed(r,3);
  if(stick)this.rightStickDuration=Math.min(2,this.rightStickDuration+Math.max(0,Math.min(.05,dt||0)));
  const long=stick&&this.rightStickDuration>=.48;
  const tap=!stick&&this.rightStickLast&&this.rightStickDuration>0&&this.rightStickDuration<.48;
  buttons[5]=tap;buttons[9]=long;
  this.snapshot=left||right?[{id:'XR '+(left?.profiles?.[0]||'no-left')+' / '+(right?.profiles?.[0]||'no-right'),index:0,connected:true,mapping:'standard',axes:[l?.axes?.[2]||0,l?.axes?.[3]||0,r?.axes?.[2]||0,0],buttons:buttons.map(pressed=>({pressed,value:pressed?1:0}))}]:[];
  const state=this.input.poll(dt,settings,visible),trigger=pressed(r,0);
  // The standard HELP button index represents Quest B jump only.
  state.actions=state.actions.map(action=>action==='help'?'jump':action);
  state.pointerPressed=state.ready&&trigger&&!this.rightTrigger;state.menu.confirm=state.menu.confirm||state.pointerPressed;
  this.rightTrigger=trigger;this.rightStickLast=stick;if(!stick)this.rightStickDuration=0;return state;
 }
}
export const VR_CONTROLS=[['LEFT STICK','MOVE / STRAFE'],['RIGHT STICK','TURN · CLICK TO CYCLE'],['RIGHT TRIGGER','FIRE / SELECT MENU'],['LEFT TRIGGER','HOLD / RELEASE CHARGE'],['RIGHT GRIP','INTERACT'],['LEFT GRIP','ORI SCAN / STUN'],['A / B / X / Y','DASH / JUMP / WRIST MAP / RELOAD'],['LEFT STICK CLICK','HOLD SPRINT / AIR THRUST IN TWO-STORY'],['RIGHT STICK CLICK','TAP NEXT WEAPON · HOLD PAUSE'],['WRIST ARSENAL','DIRECT SELECT · POINT + TRIGGER'],['WRIST TOOLS','VISION · BASS · OTHER TOOLS']];
