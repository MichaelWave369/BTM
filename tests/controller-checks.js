import {Game} from '../src/core.js';
import {GamepadInput,ControllerMenu,ControllerRumble,stick,controllerSettings,gameplayInput,controllerActions} from '../src/gamepad.js';
const expect=(condition,message='Assertion failed')=>{if(!condition)throw Error(message);};
const near=(a,b)=>Math.abs(a-b)<1e-7;
export function padFixture(){
  const pad={id:'Xbox Wireless Controller (simulated)',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  let pads=[pad];const input=new GamepadInput({read:()=>pads});
  const set=(...held)=>{pad.buttons=pad.buttons.map((_,i)=>({pressed:held.includes(i),value:held.includes(i)?1:0}));};
  const poll=(settings={},focused=true)=>input.poll(.025,settings,focused);
  const prime=()=>{set();pad.axes=[0,0,0,0];poll();poll();};prime();
  return {pad,input,set,poll,prime,setPads:value=>pads=value};
}
export function controllerChecks(){
 const cases=[
 ['Dead zone prevents resting-stick drift',()=>{const s=stick(.12,-.09,.18);expect(s.x===0&&s.y===0);} ],
 ['Radial stick preserves diagonals and caps full speed',()=>{const s=stick(1,-1,.18);expect(near(Math.hypot(s.x,s.y),1)&&near(s.x,-s.y));expect(stick(NaN,Infinity).x===0);} ],
 ['Controller settings sanitize old and invalid saves',()=>{const s=controllerSettings({controllerSensitivity:99,controllerDeadzone:-3,controllerRumble:'yes'});expect(s.controllerSensitivity===2.5&&s.controllerDeadzone===.08&&s.controllerRumble);expect(controllerSettings().controllerDeadzone===.18);} ],
 ['Analog movement keeps partial speed and legacy keyboard speed',()=>{const full=new Game(),partial=new Game(),keyboard=new Game();for(const g of [full,partial,keyboard])g.start();const p={...full.player};full.update(.05,{moveForward:1});partial.update(.05,{moveForward:.4});keyboard.update(.05,{forward:true});const distance=g=>Math.hypot(g.player.x-p.x,g.player.y-p.y);expect(near(distance(partial),distance(full)*.4));expect(near(distance(full),distance(keyboard)));} ],
 ['Diagonal analog movement cannot exceed full-stick speed',()=>{const g=new Game();g.start();const p={...g.player};g.update(.05,{moveForward:1,moveStrafe:1});expect(near(Math.hypot(g.player.x-p.x,g.player.y-p.y),2.65*.05));} ],
 ['Left and right sticks reach real movement and horizontal aiming',()=>{const f=padFixture(),g=new Game();g.start();const p={...g.player};f.pad.axes=[.6,-.8,.65,0];g.update(.05,gameplayInput(new Set(),f.poll()));expect(Math.hypot(g.player.x-p.x,g.player.y-p.y)>.1&&g.player.a>p.a);} ],
 ['Small movements still collide with map walls',()=>{const g=new Game();g.start();g.player.x=1.21;g.player.y=20.5;g.player.a=Math.PI;for(let i=0;i<30;i++)g.update(.025,{moveForward:.5});expect(g.player.x>=1.2);} ],
 ['Keyboard and gamepad input coexist without extra speed',()=>{const f=padFixture();f.pad.axes=[1,-1,1,0];const s=gameplayInput(new Set(['KeyW','KeyD','ArrowRight','KeyZ']),f.poll());expect(s.moveForward===1&&s.moveStrafe===1&&s.fire);expect(s.turn>1);} ],
 ['RT fires a real weapon and holding continues automatic fire',()=>{const f=padFixture(),g=new Game();g.start();f.set(7);let s=f.poll();controllerActions(g,s);g.update(.025,gameplayInput(new Set(),s));expect(g.shots===1);for(let i=0;i<50;i++){s=f.poll();controllerActions(g,s);g.update(.025,gameplayInput(new Set(),s));}expect(g.shots>1);f.set();expect(!f.poll().fire);} ],
 ['RT buffers a press near cooldown expiry',()=>{const f=padFixture(),g=new Game();g.start();g.cooldown=.06;f.set(7);controllerActions(g,f.poll());g.update(.04);g.update(.04);expect(g.shots===1);} ],
 ['LT charges and releases exactly one alternate shot',()=>{const f=padFixture(),g=new Game();g.start();f.set(6);let s;for(let i=0;i<50;i++)s=f.poll();expect(s.charge>.8);f.set();s=f.poll();expect(s.alternate>.8);controllerActions(g,s);expect(g.shots===1);expect(f.poll().alternate===null);} ],
 ['A opens a real door and interacts only once per press',()=>{const f=padFixture(),g=new Game();g.start();g.player.x=4.5;g.player.y=15.5;g.player.a=-Math.PI/2;f.set(0);controllerActions(g,f.poll());expect(g.level.doors['4,14'].target===1);expect(!f.poll().actions.includes('interact'));} ],
 ['A extracts through the real completion event before the next simulation tick',()=>{const f=padFixture(),g=new Game();g.start();for(const r of g.level.relays)r.active=true;g.player.key=true;g.player.x=g.level.exit.x;g.player.y=g.level.exit.y;g.events=[];f.set(0);controllerActions(g,f.poll());expect(g.mode==='complete'&&g.events.some(e=>e.type==='complete'));} ],
 ['All Xbox actions use the documented standard button layout',()=>{for(const [button,action] of [[0,'interact'],[1,'dodge'],[2,'reload'],[3,'ori'],[4,'previous'],[5,'next'],[8,'map'],[9,'pause'],[11,'help'],[12,'vision'],[13,'bass'],[14,'previous'],[15,'next']]){const f=padFixture();f.set(button);expect(f.poll().actions.includes(action),action);expect(!f.poll().actions.includes(action),'Held '+action+' repeated');}} ],
 ['Y, X, B, vision, weapon cycling and map reach real game actions',()=>{const f=padFixture(),g=new Game();g.start();let maps=0;const action=button=>{f.set();f.poll();f.set(button);controllerActions(g,f.poll(),{map:()=>maps++});};action(3);expect(g.player.ori===70);g.player.energy=50;action(2);expect(g.vent>0);action(1);expect(g.dodgeCooldown>0);action(12);expect(g.shift);action(5);expect(g.weapon===2);action(4);expect(g.weapon===1);action(8);expect(maps===1);} ],
 ['Holding L3 sprints and D-pad down spends a full bass charge',()=>{const f=padFixture(),g=new Game();g.start();f.set(10);expect(f.poll().sprint);f.set();f.poll();g.bassCharge=100;f.set(13);controllerActions(g,f.poll());expect(g.bassCharge===0);} ],
 ['D-pad menu movement repeats; A confirm never repeats while held',()=>{const f=padFixture();f.set(13,0);let s=f.poll();expect(s.menu.vertical===1&&s.menu.confirm);s=f.poll();expect(s.menu.vertical===0&&!s.menu.confirm);let repeats=0;for(let i=0;i<30;i++)if(f.poll().menu.vertical)repeats++;expect(repeats>=2&&repeats<8);} ],
 ['Pause or focus loss cancels held fire and charge until controls release',()=>{const f=padFixture();f.set(6,7);for(let i=0;i<20;i++)f.poll();f.input.reset();expect(!f.poll().fire&&f.poll().alternate===null);f.set();expect(f.poll().alternate===null);f.set(7);expect(f.poll().fire);f.poll({},false);expect(!f.poll().fire);f.set();f.poll();f.set(7);expect(f.poll().fire);} ],
 ['Disconnect clears all held input; reconnect waits for neutral',()=>{const f=padFixture();f.set(7);expect(f.poll().fire);f.setPads([]);let s=f.poll();expect(s.disconnected&&!s.fire&&!s.connected);f.setPads([f.pad]);s=f.poll();expect(s.connected&&!s.fire&&!s.ready);f.set();f.poll();f.set(7);expect(f.poll().fire);} ],
 ['Multiple and sparse gamepads retain the active standard device',()=>{const f=padFixture(),other={...f.pad,index:3,id:'Other pad'};f.setPads([null,other,null,f.pad]);expect(f.poll().connected&&f.input.pad===f.pad);f.setPads([null,other]);const s=f.poll();expect(s.disconnected&&f.input.pad===other&&!s.ready);} ],
 ['Unmapped and blocked controllers fail safely without guessing buttons',()=>{const f=padFixture();f.pad.mapping='';expect(f.poll().status==='unmapped'&&!f.poll().fire);const input=new GamepadInput({read:()=>{throw Object.assign(Error('Blocked'),{name:'SecurityError'});}});expect(input.poll(.025).status==='blocked');} ],
 ];
 const results=cases.map(([name,check])=>{try{check();return {name,pass:true};}catch(e){return {name,pass:false,error:e.message};}});
 return {passed:results.every(r=>r.pass),total:results.length,results,method:'Synthetic standard Xbox snapshots through the production input adapter and real game simulation; no physical controller or Bluetooth stack exercised.'};
}
export async function browserControllerChecks(){
 const data=controllerChecks(),fixture=document.createElement('section');fixture.style.cssText='position:fixed;top:12px;left:12px;background:#172b20;padding:15px;z-index:100';
 fixture.innerHTML='<button id="pad-a">Start</button><button disabled>Disabled</button><div hidden><button>Hidden</button></div><input aria-label="Speed" type="range" min=".4" max="2.5" step=".1" value="1"><select aria-label="Pixels"><option>Low</option><option>High</option></select><input aria-label="Rumble" type="checkbox"><button id="pad-b">Back</button>';
 document.body.append(fixture);const previous=document.activeElement;let clicks=0,backs=0,resumes=0,changes=0;
 fixture.querySelector('#pad-a').onclick=()=>clicks++;fixture.addEventListener('input',()=>changes++);
 const menu=new ControllerMenu({root:()=>fixture,back:()=>backs++,resume:()=>resumes++});
 const cases=[
 ['DOM menu skips disabled and hidden controls',()=>expect(menu.items().length===5)],
 ['A activates a real focused button',()=>{menu.focus(menu.items()[0]);menu.handle({confirm:true});expect(clicks===1);}],
 ['D-pad moves focus and left/right adjusts a real range',()=>{menu.handle({vertical:1});const range=fixture.querySelector('input[type=range]');expect(document.activeElement===range);menu.handle({horizontal:1});expect(range.value==='1.1'&&changes===1);}],
 ['Controller adjusts selects and toggles checkboxes',()=>{menu.handle({vertical:1});menu.handle({horizontal:1});expect(fixture.querySelector('select').selectedIndex===1);menu.handle({vertical:1});menu.handle({confirm:true});expect(fixture.querySelector('input[type=checkbox]').checked);}],
 ['B returns and Menu resumes through dedicated callbacks',()=>{menu.handle({back:true});menu.handle({start:true});expect(backs===1&&resumes===1);}],
 ['Optional vibration handles rejection and missing hardware',async()=>{const rumble=new ControllerRumble();let calls=0;rumble.play(null,'fire');rumble.play({vibrationActuator:{playEffect:()=>{calls++;return Promise.reject(Error('Not supported'));},reset:()=>Promise.resolve()}},'fire');await Promise.resolve();rumble.stop();expect(calls===1);}]
 ];
 for(const [name,check]of cases){try{await check();data.results.push({name,pass:true});}catch(e){data.results.push({name,pass:false,error:e.message});}}
 fixture.remove();previous?.focus();data.total=data.results.length;data.passed=data.results.every(r=>r.pass);return data;
}
