import {EQUIPMENT_DEFAULTS,equipmentSettings} from './equipment-math.js';
import {destinationFor} from './genewrist-bridge.js';
import {Game,SECTORS,WEAPONS,CAMPAIGN_HOSTS,clamp,angleDiff} from './core.js';
import {Renderer} from './renderer.js';
import {enterPhiWadMission,leavePhiWadMission} from './phi-content/runtime.js';
import {loadHostedMission} from './phi-content/hosted-missions.js';
import {UI,WEAPON_UI,drawOri,drawWeaponIcon} from './arcade-ui.js';
import {Communications,criticalMessage} from './communications.js';
import {AudioEngine} from './audio.js';
import {drawPortrait} from './assets.js';
import {VRArcade} from './vr.js';
import {IMMERSIVE_DEFAULTS,immersiveSettings} from './immersive-rig.js';
import {stepImmersive} from './immersive-play.js';
import {PointerCapture,keyCode} from './controls.js';
import {GamepadInput,ControllerMenu,ControllerRumble,CONTROLLER_DEFAULTS,controllerSettings,gameplayInput,controllerActions} from './gamepad.js';
const $=id=>document.getElementById(id),canvas=$('game'),game=new Game(),renderer=new Renderer(canvas),audio=new AudioEngine(),communications=new Communications();
const SAVE_KEY='mwave-ori-checkpoint-v1',SETTINGS_KEY='mwave-ori-settings-v1';
const defaults={...IMMERSIVE_DEFAULTS,vrDistance:2.5,vrWidth:2.8,...CONTROLLER_DEFAULTS,sensitivity:1,music:.35,sfx:.65,muted:false,resolution:640,crt:true,controlMode:'auto',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const controller=new GamepadInput(),rumble=new ControllerRumble();let inputMode='keyboard',desktopFrame=0,alertText='',alertTimer=0;
let settings={...defaults,energyMode:'survival'},saved=null,screen='title-screen',returnScreen='title-screen',keys=new Set(),fire=false,mapOpen=false,dragging=false,lastMouseX=0,toastTimer=0,dialogueTimer=0,lastFrame=performance.now(),hudTime=0,fpsTime=0,fpsFrames=0,ambientTimer=8,touch=matchMedia('(pointer:coarse)').matches,altStart=0;
try{
  const stored=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
  if(stored&&typeof stored==='object'){
    if(['legacy','survival'].includes(stored.energyMode))settings.energyMode=stored.energyMode;
    Object.assign(settings,controllerSettings(stored),immersiveSettings(stored));
    for(const k of ['sensitivity','music','sfx'])if(Number.isFinite(stored[k]))settings[k]=clamp(stored[k],k==='sensitivity'?.3:0,k==='sensitivity'?3:1);
    for(const k of ['muted','crt','reducedMotion'])if(typeof stored[k]==='boolean')settings[k]=stored[k];
    if([480,640,960].includes(stored.resolution))settings.resolution=stored.resolution;
    if(['auto','drag','keyboard'].includes(stored.controlMode))settings.controlMode=stored.controlMode;
    if([2,2.5,3.2].includes(stored.vrDistance))settings.vrDistance=stored.vrDistance;if([2.4,2.8,3.4].includes(stored.vrWidth))settings.vrWidth=stored.vrWidth;
  }
  const raw=localStorage.getItem(SAVE_KEY);if(raw){const candidate=JSON.parse(raw),check=new Game();check.restore(candidate);saved=candidate;}
}catch{$('storage-warning').hidden=false;}
game.events=[];
const capture=new PointerCapture({request:()=>{if(!canvas.requestPointerLock)throw Error('Unavailable');return canvas.requestPointerLock();},onState:()=>updateCapture(),onLost:()=>{if(game.mode==='playing')pause();}});
function controllerBack(){if(screen==='settings-screen'||screen==='help-screen')showScreen(returnScreen);else if(screen==='pause-screen')play();else if(screen==='result-screen')home();}
const controllerMenu=new ControllerMenu({root:()=>screen?$(screen):null,back:controllerBack,resume:()=>{if(screen==='pause-screen')play();else controllerBack();}});
const vr=new VRArcade({settings:()=>settings,onStatus:message=>{$('vr-status').textContent=message;for(const id of ['vr-btn','immersive-btn'])$(id).disabled=vr.pending||vr.active;},onStart:()=>{if(desktopFrame)cancelAnimationFrame(desktopFrame);desktopFrame=0;clearInput();if(game.mode==='playing')pause();setInputMode('vr');$('vr-session-tools').hidden=false;showScreen(screen||'pause-screen');},onPause:()=>{clearInput();pause();},onEnd:()=>{clearInput();pause();$('vr-session-tools').hidden=true;setInputMode('keyboard');lastFrame=performance.now();if(!desktopFrame)desktopFrame=requestAnimationFrame(frame);audio.pause(true);for(const id of ['vr-btn','immersive-btn'])$(id).disabled=false;showToast('VR SESSION ENDED / GAME PRESERVED');},onFrame:(now,pad,spatial)=>tick(now,pad,spatial),data:()=>({game,scene:canvas,screen,assets:renderer.assets,settings,map:mapOpen,immersive:vr.immersive,items:screen?controllerMenu.items():[],focused:document.activeElement,communications:communications.log,alert:alertTimer>0?alertText:'',dialogue:dialogueTimer<=0?'':$('dialogue-name').textContent+': '+$('dialogue-text').textContent,toast:toastTimer>0?$('toast').textContent:'',activate:vrAction})});
function vrAction(action,element){
 if(action==='genewrist-travel'){
  const destination=destinationFor(element);
  if(!destination){showToast('GEN.E / DESTINATION UNAVAILABLE');return;}
  if(game.mode==='playing'&&!game.phiwadCustom){game.saveCheckpoint();saveCheckpoint();}
  clearInput();
  void vr.exit().then(()=>window.location.assign(destination.url)).catch(()=>showToast('GEN.E / TRAVEL FAILED'));
  return;
 }

 if(action==='focus'){controllerMenu.focus(element);return;}if(action==='recenter'){vr.recenter();return;}if(action==='pause'){pause();return;}
 if(game.mode!=='playing')return;
 if(action==='weapon')game.selectWeapon(element);if(action==='reload')game.reload();if(action==='ori')game.oriAbility();if(action==='dodge')game.dodge();if(action==='vision')game.vision();if(action==='map')mapOpen=!mapOpen;if(action==='bass')game.bassDrop();processEvents();updateHUD();
}
function setInputMode(mode){
  if(mode===inputMode)return;inputMode=mode;document.body.dataset.input=mode;
  if(mode!=='keyboard'){capture.release();if(document.pointerLockElement)document.exitPointerLock();if(screen)controllerMenu.focus(controllerMenu.items()[0]);}
  else controllerMenu.clear();
  $('touch-controls').hidden=!!screen||!touch||mode!=='keyboard';updateCapture();
}
function pollController(dt,externalPad,immersive=false){
  const desktop=vr.immersive?null:controller.poll(dt,settings,vr.active||document.hasFocus()&&!document.hidden),pad=vr.immersive?(externalPad||{ready:false,actions:[],menu:{}}):externalPad?.connected&&(externalPad.active||inputMode==='vr')?externalPad:desktop;rumble.tick(dt);
  if(externalPad?.disconnected&&inputMode==='vr'){clearInput();pause();showToast('VR CONTROLLER DISCONNECTED / GAME PAUSED');}
  if(pad.disconnected&&inputMode==='controller'){const wasPlaying=game.mode==='playing';setInputMode('keyboard');pause();showToast(wasPlaying?'CONTROLLER DISCONNECTED / GAME PAUSED':'CONTROLLER DISCONNECTED');}
  if(pad.active)setInputMode(pad===externalPad?'vr':'controller');
  if(!pad.ready)return null;
  if(screen){controllerMenu.handle(pad.menu);return null;}
  if(game.mode!=='playing')return null;
  if(pad.actions.includes('pause')){pause();return null;}
  if(pad.actions.includes('help')){openHelp();return null;}
  if(!immersive){controllerActions(game,pad,{map:()=>{mapOpen=!mapOpen;}});processEvents();}return pad;
}
function updateCapture(){
  $('capture-hint').hidden=!!screen||touch||inputMode!=='keyboard'||capture.state==='locked';$('capture-btn').hidden=settings.controlMode!=='auto';
  $('capture-btn').textContent=capture.state==='pending'?'CAPTURING…':capture.state==='fallback'?'RETRY MOUSE CAPTURE':'CAPTURE MOUSE';$('capture-btn').disabled=capture.state==='pending';
  $('capture-copy').textContent=settings.controlMode==='keyboard'?'ARROWS TURN · Z FIRES · E INTERACTS':settings.controlMode==='drag'?'DRAG TO AIM · ARROWS ALWAYS WORK':capture.state==='fallback'?'CAPTURE BLOCKED · DRAG TO AIM OR USE ← →':'CLICK TO LOOK · ARROWS ALWAYS WORK';
}
function clearInput(){game.clearCombatPose();keys.clear();fire=false;dragging=false;altStart=0;game.charge=0;game.bufferedFire=null;controller.reset();vr.input.reset();rumble.stop();}
function storeSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{$('storage-warning').hidden=false;}}
function saveCheckpoint(){if(game.phiwadCustom)return;if(game.player.health<=0)return;try{const data=game.checkpoint||game.snapshot();localStorage.setItem(SAVE_KEY,JSON.stringify(data));saved=data;$('continue-btn').hidden=false;}catch{$('storage-warning').hidden=false;}}
function showToast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=2.7;}
function showDialogue(text,speaker='ORI',priority=1){communications.record(text,speaker,priority);refreshCommunications();if(speaker==='WAVE'&&!game.hurt){game.portraitMood='GRIN';game.portraitTime=1.1;}$('dialogue-text').textContent=text;$('dialogue-name').textContent=speaker;$('dialogue-channel').textContent=speaker==='WAVE'?'MICHAEL WAVE':speaker==='ARCHIVE'?'RECOVERED LOG':'COMPANION LINK';$('dialogue').dataset.speaker=speaker;$('dialogue').classList.toggle('urgent',priority>=3);$('dialogue').hidden=!settings.captions;dialogueTimer=Math.max(3.6,text.length*.04)*(vr.immersive?settings.vrSubtitleDuration:1);}
function showScreen(id){
  communications.cancel();controllerMenu.clear();clearInput();
  screen=id;if(id&&vr.active)$(id).append($('vr-session-tools'));$('overlay').hidden=!id;$('overlay').classList.toggle('title-overlay',id==='title-screen');
  for(const n of ['title-screen','pause-screen','result-screen','settings-screen','help-screen'])$(n).hidden=n!==id;
  $('view-top').hidden=!!id;$('touch-controls').hidden=!!id||!touch||inputMode!=='keyboard';$('onboarding').hidden=!!id||game.levelIndex!==0||game.lesson>=3;
  document.body.classList.toggle('playing',!id);$('app').dataset.screen=id||'playing';
  if(id){capture.release();if(document.pointerLockElement)document.exitPointerLock();if(inputMode!=='keyboard')controllerMenu.focus(controllerMenu.items()[0]);}
  if(id==='title-screen'){$('dialogue').hidden=true;$('boss-bar').hidden=true;$('vision-tag').hidden=true;$('interaction').textContent='';$('header-sector').textContent='SIMULATION ONLINE';}updateCapture();
}
function lockMouse(){if(touch||vr.active||inputMode!=='keyboard'||settings.controlMode!=='auto')return;canvas.focus({preventScroll:true});void capture.capture();}
function play(fresh=false){if(fresh){communications.reset();game.start({energyMode:settings.energyMode});mapOpen=false;}else game.mode='playing';showScreen('');audio.start();audio.pause(false);canvas.focus({preventScroll:true});lockMouse();processEvents();updateHUD();}
function pause(){if(game.mode!=='playing')return;game.mode='paused';audio.pause(true);showScreen('pause-screen');}
function home(){if(game.phiwadCustom)leavePhiWadMission(game);else if(game.mode==='playing'||game.mode==='paused'){game.saveCheckpoint();saveCheckpoint();}game.mode='title';audio.pause(true);showScreen('title-screen');$('continue-btn').hidden=!saved;}
function openSettings(){returnScreen=screen||'pause-screen';if(game.mode==='playing')pause();showScreen('settings-screen');}
function openHelp(){returnScreen=screen||'pause-screen';if(game.mode==='playing')pause();showScreen('help-screen');}
function applySettings(){
  for(const [id,value]of Object.entries(EQUIPMENT_DEFAULTS)){const element=$(id);if(typeof value==='boolean')element.checked=settings[id];else element.value=settings[id];}
  communications.configure(settings);$('energyMode').value=settings.energyMode;$('dialogue').hidden=!settings.captions||dialogueTimer<=0;
  if(canvas.width!==settings.resolution)renderer.setResolution(settings.resolution);audio.configure(settings);$('scanlines').hidden=!settings.crt;document.body.classList.toggle('reduced-motion',settings.reducedMotion);
  $('mute-btn').setAttribute('aria-pressed',String(settings.muted));$('mute-btn').setAttribute('aria-label',settings.muted?'Unmute audio':'Mute audio');$('mute-btn').title=settings.muted?'Unmute [M]':'Mute [M]';
  for(const id of ['sensitivity','music','sfx','resolution','controlMode','controllerSensitivity','controllerDeadzone','vrDistance','vrWidth','vrTurnMode','vrSnapAngle','vrMoveReference','vrMoveSpeed','vrTurnSpeed','vrVignetteStrength','vrEyeHeight','vrPosture','vrQuality'])$(id).value=settings[id];$('crt').checked=settings.crt;$('reducedMotion').checked=settings.reducedMotion;$('controllerRumble').checked=settings.controllerRumble;for(const id of ['vrVignette','vrAimLine','vrDiagnostics'])$(id).checked=settings[id];
  $('controllerSensitivity-output').value=settings.controllerSensitivity.toFixed(1);$('controllerDeadzone-output').value=Math.round(settings.controllerDeadzone*100)+'%';
  $('sensitivity-output').value=settings.sensitivity.toFixed(1);$('music-output').value=Math.round(settings.music*100)+'%';$('sfx-output').value=Math.round(settings.sfx*100)+'%';updateCapture();
}
for(const [id,value]of Object.entries(EQUIPMENT_DEFAULTS))$(id).addEventListener('input',()=>{settings[id]=typeof value==='boolean'?$(id).checked:typeof value==='number'?Number($(id).value):$(id).value;Object.assign(settings,equipmentSettings(settings));applySettings();storeSettings();});

function toggleMute(){settings.muted=!settings.muted;applySettings();storeSettings();showToast(settings.muted?'AUDIO MUTED':'AUDIO ON');}
const minutes=n=>Math.floor(n/60).toString().padStart(2,'0')+':'+Math.floor(n%60).toString().padStart(2,'0');
function result(){
  if(game.phiwadCustom){
    const dead=game.mode==='dead';
    audio.pause(true);audio.play(dead?'hurt':'complete');
    $('result-screen').classList.toggle('dead',dead);
    $('result-eyebrow').textContent=dead?'ΦWAD / CONNECTION INTERRUPTED':'ΦWAD / CUSTOM MISSION COMPLETE';
    $('result-title').innerHTML=dead?'SIGNAL<br><em>LOST.</em>':'MISSION<br><em>CLEARED.</em>';
    $('result-copy').textContent=dead?'Retry your custom mission. The original campaign checkpoint is still safe.':'Custom signal liberated. Return to the arcade to play another mission.';
    const stats=[['MISSION',game.phiwadCustom.title],['MINDS FREED',String(game.levelFreed)],['TIME',minutes(game.time)],['ORIGINAL SAVES','PRESERVED']];
    $('result-stats').replaceChildren(...stats.map(([label,value])=>{const d=document.createElement('div');d.textContent=label;const b=document.createElement('b');b.textContent=value;d.append(b);return d;}));
    $('result-btn').textContent=dead?'RETRY CUSTOM MISSION':'RETURN TO ARCADE';
    showScreen('result-screen');return;
  }
  const dead=game.mode==='dead',ending=game.mode==='ending',continuation=ending&&game.levelIndex<SECTORS.length-1,act=['I','II','III','IV'][Math.floor(game.levelIndex/3)];
  audio.pause(true);audio.play(dead?'hurt':'complete');$('result-screen').classList.toggle('dead',dead);
  $('result-eyebrow').textContent=dead?'CONNECTION INTERRUPTED':continuation?'ACT '+act+' COMPLETE / THE SIGNAL CONTINUES':ending?'FOUR ACTS COMPLETE / TWELVE SECTORS LIBERATED':'SECTOR '+String(game.levelIndex+1).padStart(2,'0')+' LIBERATED';
  $('result-title').innerHTML=dead?'SIGNAL<br><em>LOST.</em>':ending?'YOU ARE<br><em>UNPLUGGED.</em>':'SIGNAL<br><em>RECLAIMED.</em>';
  $('result-copy').textContent=dead?'Ori kept your checkpoint. Break your movement rhythm, use Ori to stun, and reload from reserve, and scavenge energy cells. Slap and Dash Bash still work when empty. Your frequency is still yours.':continuation?(game.levelIndex===2?'The original Warden falls. Follow Ori into Act II.':game.levelIndex===5?'The Null Crown breaks. Six nightmare sectors are listening. Predictive fire punishes constant circles. Take cover, change direction, and keep Ori close.':'The backup Warden falls. The last three sectors are the hardest. “Bro. They have run out of polite warnings.” — Michael Wave'):ending?'Twelve sectors liberated. Four acts unplugged. “Ledger above ego. Frequency above fear. Turn it UP.” — Michael Wave':SECTORS[game.levelIndex].name+' is offline. One less system deciding who people get to be.';
  const stats=dead?[['CHECKPOINT','PRESERVED'],['MINDS FREED',String(game.levelFreed)],['TIME IN SECTOR',minutes(game.time)],['FREQUENCY','STILL YOURS']]:[['MINDS FREED',ending?game.totalFreed+' / '+CAMPAIGN_HOSTS:String(game.levelFreed)],['SECTOR TIME',minutes(game.time)],['SECRETS',ending?game.totalSecrets+' / '+SECTORS.length:(game.level.secretFound?1:0)+' / 1'],['LIBERATION',game.liberation+'%']];
  $('result-stats').replaceChildren(...stats.map(([label,value])=>{const d=document.createElement('div');d.textContent=label;const b=document.createElement('b');b.textContent=value;d.append(b);return d;}));
  $('result-btn').innerHTML=(dead?'RETRY CHECKPOINT':continuation?(game.levelIndex===2?'FOLLOW THE ECHO / ACT II':game.levelIndex===5?'ENTER NIGHTMARE / ACT III':'ENTER THE IMPOSSIBLE / ACT IV'):ending?'PLAY AGAIN':'ENTER SECTOR '+String(game.levelIndex+2).padStart(2,'0'))+' <b>→</b>';showScreen('result-screen');
}
function processEvents(){
  for(const e of game.events.splice(0)){
    if(inputMode==='controller'&&game.mode==='playing'){if(e.type==='sound'&&['fire','hurt'].includes(e.name))rumble.play(controller.pad,e.name,settings.controllerRumble);if(e.type==='bass')rumble.play(controller.pad,'bass',settings.controllerRumble);}
    renderer.event(e);vr.event(e,game);if(e.type==='sound'){if(vr.immersive&&e.position)audio.playAt(e.name,e.weapon,e.position);else audio.play(e.name,e.weapon);}if(e.type==='hit'&&e.source!=='ori')audio.play('hit');
    if(e.type==='dryFire'){alertText='DRY / RELOAD OR SLAP';alertTimer=2;}if(e.type==='shield'){alertText='DASH SHIELD / 18';alertTimer=.3;}if(e.type==='bash'){alertText='DASH BASH';alertTimer=.8;}
    if(e.type==='dialogue'){const critical=criticalMessage(e,game.player.health);if(critical){alertText=critical;alertTimer=3;}showDialogue(e.text,e.speaker,e.priority);}if(e.type==='toast'){communications.log.push({text:e.text,speaker:'FIELD',priority:1});if(communications.log.length>100)communications.log.shift();refreshCommunications();showToast(e.text);}if(e.type==='checkpoint')saveCheckpoint();
    if(e.type==='pickup')showToast((e.item==='artifact'?'Φ ARTIFACT / ':'')+e.item.toUpperCase()+' ACQUIRED');
    if(e.type==='secret'){showToast('SECRET FOUND / CODE BROWN SUPPLY CLOSET');audio.play('free');}
    if(e.type==='sector'){audio.sector=e.index;showToast('SECTOR '+String(e.index+1).padStart(2,'0')+' / '+e.name);}
    if(e.type==='bass')audio.play('fire',2);if(e.type==='complete'||e.type==='dead')result();
  }
}
function updateHUD(){
  const padMode=inputMode!=='keyboard',vrMode=vr.active;
  const controllerCopy=vrMode?'QUEST TOUCH / VR ARCADE ACTIVE':controller.status==='connected'?(controller.awaitingNeutral?'CONTROLLER CONNECTED / RELEASE STICKS + BUTTONS':'CONTROLLER READY / A SELECT · B BACK'):controller.status==='unmapped'?'CONTROLLER FOUND / NO STANDARD LAYOUT. RECONNECT OR TRY ANOTHER BROWSER.':controller.status==='blocked'?'CONTROLLER ACCESS UNAVAILABLE IN THIS BROWSER. OPEN THE GAME DIRECTLY.':'XBOX / BLUETOOTH OR USB · PAIR WITH YOUR DEVICE, THEN PRESS A';
  $('controller-status').textContent=controllerCopy;$('controller-title').textContent=controllerCopy;
  $('controller-readout').textContent=controller.pad?controller.pad.id:'Click the page once for audio. The browser detects your controller after a button press.';
  $('controller-menu-hint').hidden=!padMode;
  document.querySelector('.recharge-hint').textContent=padMode?'X ↻':'R ↻';document.querySelector('.ori-panel kbd').textContent=vrMode?'GRIP':padMode?'Y':'Q';
  $('onboarding-extra').textContent=vrMode?'R STICK CLICK: PAUSE · TOOLBAR: MAP / BASS':padMode?'R3: MANUAL · VIEW: MAP · MENU: PAUSE':'H: MANUAL · TAB: MAP · ESC: PAUSE';
  $('bottom-controls').textContent=vrMode?'LS MOVE · RS AIM · R TRIGGER FIRE · R GRIP USE':padMode?'LS MOVE · RS AIM · RT FIRE · A USE · MENU PAUSE':'WASD MOVE · MOUSE AIM · E INTERACT · ESC PAUSE';
  const p=game.player,w=WEAPONS[game.weapon],alive=game.level.enemies.find(e=>e.type==='warden'&&!e.dead),playing=game.mode==='playing';
  $('health').textContent=Math.ceil(p.health);$('armor').textContent=Math.ceil(p.armor);$('health-meter').style.width=p.health+'%';$('health-meter').style.background=p.health<30?UI.red:UI.pink;$('armor-meter').style.width=clamp(p.armor,0,100)+'%';$('hud').classList.toggle('critical',p.health<30);
  $('weapon-name').textContent=w.name;$('weapon-index').textContent=String(game.weapon+1).padStart(2,'0')+' / 06';$('weapon-name').style.color=WEAPON_UI[game.weapon];$('energy').textContent=Math.floor(p.energy);$('reserve').textContent=game.survival?'RES '+Math.floor(p.reserve)+'/180':'LEGACY RECHARGE';$('dash-status').textContent=!game.survival?(game.dodgeCooldown>0?'DODGE '+game.dodgeCooldown.toFixed(1)+'s':'DODGE READY'):game.shieldTime>0&&game.shieldCharge>0?'SHIELD '+Math.ceil(game.shieldCharge):game.dodgeCooldown>0?'DASH '+game.dodgeCooldown.toFixed(1)+'s':'BASH / SHIELD READY';$('energy-meter').style.width=p.energy+'%';$('energy-meter').style.background=WEAPON_UI[game.weapon];
  $('ori-energy').innerHTML=Math.floor(p.ori)+'<small>%</small>';$('ori-meter').style.width=p.ori+'%';$('ori-status').textContent=game.assistTime>0?'ASSISTING MICHAEL':p.ori>=30?'COMPANION ONLINE':'RECHARGING';
  const liberation=game.phiwadCustom?Math.min(100,Math.round(game.levelFreed/Math.max(1,game.level.captives.length+game.level.enemies.filter(e=>e.human).length)*100)):game.liberation;
  $('liberation').textContent=liberation;$('liberation-meter').style.width=liberation+'%';$('freed-count').textContent=String(game.totalFreed).padStart(2,'0')+' MINDS FREED';$('key-icon').classList.toggle('acquired',p.key);$('key-label').textContent=p.key?'GOLD KEY':'NO KEY';$('artifacts').textContent=String(game.totalArtifacts).padStart(2,'0')+' ARTIFACTS';
  $('bass-meter').style.width=game.bassCharge+'%';$('bass-label').innerHTML=(game.bassCharge>=100?'DROP THE BASS':'BASS DROP')+' <kbd>'+(vrMode?'BAR':padMode?'D↓':'B')+'</kbd>';$('secret-counter').textContent='SECRETS '+(game.level.secretFound?'01':'00')+' / 01';$('bottom-level').textContent=SECTORS[game.levelIndex].name;$('objective').textContent=game.objective;$('room-label').textContent=game.region||SECTORS[game.levelIndex].tag;
  const t=game.objectiveTarget,a=angleDiff(Math.atan2(t.y-p.y,t.x-p.x),p.a);$('objective-bearing').textContent=(a<-1?'←':a>1?'→':a<-.25?'↖':a>.25?'↗':'↑')+' '+(t.label||'WARDEN')+' / '+Math.round(Math.hypot(t.x-p.x,t.y-p.y))+'m';
  if(game.mode!=='title')$('header-sector').textContent=game.phiwadCustom?'ΦWAD / CUSTOM MISSION':'ACT '+['I','II','III','IV'][Math.floor(game.levelIndex/3)]+' / SECTOR '+String(game.levelIndex+1).padStart(2,'0')+' OF 12';
  $('interaction').textContent=playing?game.interactionHint().replace('[ E ]',vrMode?'[ R GRIP ]':padMode?'[ A ]':'[ E ]'):'';$('vision-tag').hidden=!playing||!game.shift;$('vision-value').textContent=Math.floor(p.vision);
  const bossVisible=playing&&alive&&Math.hypot(alive.x-p.x,alive.y-p.y)<11;$('boss-bar').hidden=!bossVisible;if(bossVisible){$('boss-hp').style.width=alive.hp/alive.maxHp*100+'%';$('boss-phase').textContent='PHASE '+alive.phase;}
  for(const b of $('weapon-slots').children){const n=Number(b.dataset.weapon);b.classList.toggle('active',n===game.weapon);b.disabled=n>=game.unlocked;b.setAttribute('aria-pressed',String(n===game.weapon));const enabled=n<game.unlocked;if(b.dataset.enabled!==String(enabled)){const iconContext=b.querySelector('canvas').getContext('2d');iconContext.clearRect(0,0,80,44);drawWeaponIcon(iconContext,n,0,0,80,44,enabled);b.querySelector('.weapon-lock').hidden=enabled;b.dataset.enabled=enabled;}b.title=(n>=game.unlocked?'LOCKED / ':'')+WEAPONS[n].name;}
  $('portrait-mood').textContent=game.portraitMood;$('onboarding').hidden=!!screen||game.levelIndex!==0||game.lesson>=3;
  $('onboarding-text').textContent=(vrMode?['LEFT STICK TO MOVE / RIGHT STICK TO TURN','FACE THE STRIPED DOOR / RIGHT GRIP TO OPEN','R TRIGGER FIRE / L GRIP ORI / X OR WRIST RELOAD']:padMode?['LEFT STICK TO MOVE / RIGHT STICK TO TURN','FACE THE STRIPED DOOR / A TO OPEN','RT TO FIRE / Y FOR ORI / X TO RELOAD']:['WASD TO MOVE / MOUSE OR ← → TO TURN','FACE THE STRIPED DOOR / E TO OPEN','CLICK OR Z TO FIRE / Q FOR ORI / R TO RELOAD'])[Math.min(2,game.lesson)];
  $('hud-sector').textContent=game.phiwadCustom?'ΦWAD / CUSTOM':'SECTOR '+String(game.levelIndex+1).padStart(2,'0')+' / 12';$('hud-sector-name').textContent=SECTORS[game.levelIndex].name;
  const relays=game.level.relays.filter(r=>r.active).length,rescues=game.level.captives.filter(c=>c.freed).length;
  const summary=[['RELAYS '+relays+'/'+game.level.relays.length,relays===game.level.relays.length],['RESCUES '+rescues+'/'+game.level.captives.length,rescues===game.level.captives.length],['KEY '+(p.key?'ACQUIRED':'NEEDED'),p.key]];
  const objectiveKey=summary.map(r=>r.join(':')).join('|');if($('objective-list').dataset.value!==objectiveKey){$('objective-list').replaceChildren(...summary.map(([text,done])=>{const item=document.createElement('span');item.textContent=text;item.classList.toggle('done',done);return item;}));$('objective-list').dataset.value=objectiveKey;}
  $('radar-panel').hidden=!!screen||mapOpen;$('map-key').textContent=vrMode?'WRIST':padMode?'VIEW':'TAB';if(!screen&&!mapOpen)renderer.drawMap(game,false,$('radar').getContext('2d'),256,220);
  const uiTime=settings.reducedMotion?0:performance.now()/1000,assisting=game.assistTime>0;document.querySelector('.ori-panel').dataset.assisting=assisting;
  for(const id of ['title-ori','hud-ori','dialogue-ori']){const c=$(id),g=c.getContext('2d');if(id==='title-ori'&&screen!=='title-screen'||id==='dialogue-ori'&&c.parentElement.hidden)continue;g.clearRect(0,0,c.width,c.height);if(id==='dialogue-ori'&&$('dialogue').dataset.speaker==='WAVE'){g.save();g.scale(c.width/64,c.height/64);drawPortrait(g,game.hurt>0,settings.reducedMotion?0:game.time,{mood:game.portraitMood,health:p.health});g.restore();}else drawOri(g,0,0,c.width,uiTime,assisting);}
  drawPortrait($('portrait').getContext('2d'),game.hurt>0,settings.reducedMotion?0:game.time,{mood:game.portraitMood,health:p.health});
}
for(let i=0;i<6;i++){const b=document.createElement('button');b.dataset.weapon=i;b.setAttribute('aria-label','Equip '+WEAPONS[i].name);b.setAttribute('aria-pressed',String(i===game.weapon));const art=document.createElement('canvas');art.width=80;art.height=44;art.setAttribute('aria-hidden','true');const number=document.createElement('span');number.className='weapon-number';number.textContent=i+1;const locked=document.createElement('span');locked.className='weapon-lock';locked.textContent='LOCK';b.append(art,number,locked);b.addEventListener('click',()=>{if(game.mode==='playing'||game.mode==='paused'){game.selectWeapon(i);processEvents();updateHUD();}});$('weapon-slots').append(b);}
for(let i=0;i<47;i++){const bar=document.createElement('i');bar.style.height=(3+((i*17+i*i*7)%17))+'px';$('title-screen').querySelector('.waveform').append(bar);}
$('codebrown-btn').addEventListener('click',async()=>{
  const button=$('codebrown-btn');
  if(button.disabled)return;
  button.disabled=true;
  const caption=button.querySelector('small');
  const previous=caption?.textContent;
  if(caption)caption.textContent='LOADING COMMUNITY SIGNAL…';
  try{
    const bytes=await loadHostedMission();
    const mission=enterPhiWadMission(game,bytes);
    mapOpen=false;
    play(false);
    showToast('CUSTOM MISSION / '+mission.title);
  }catch(error){
    showToast('CODE BROWN UNAVAILABLE / '+error.message);
  }finally{
    button.disabled=false;
    if(caption)caption.textContent=previous;
  }
});
$('phiwad-btn').addEventListener('click',()=>$('phiwad-input').click());
$('phiwad-input').addEventListener('change',async event=>{
  const input=event.currentTarget,file=input.files?.[0];
  try{
    if(!file)return;
    if(file.size>16*1024*1024)throw Error('ΦWAD EXCEEDS 16 MiB');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const mission=enterPhiWadMission(game,bytes);
    mapOpen=false;play(false);
    showToast('ΦWAD LOADED / '+mission.title);
  }catch(error){showToast('ΦWAD IMPORT FAILED / '+error.message);}
  finally{input.value='';}
});
$('start-btn').addEventListener('click',()=>play(true));$('nightmare-btn').addEventListener('click',()=>{communications.reset();game.startNightmare({energyMode:settings.energyMode});mapOpen=false;play();});$('continue-btn').hidden=!saved;
$('continue-btn').addEventListener('click',()=>{try{game.restore(saved);play();showDialogue('Welcome back, Michael. I saved your place in the rebellion.');}catch(e){showToast(e.message);saved=null;$('continue-btn').hidden=true;}});
function refreshCommunications(){const entries=communications.log.slice(-30);$('communication-log').textContent=entries.map(e=>e.speaker+': '+e.text).join('\n')||'No transmissions yet.';}
$('energyMode').addEventListener('input',()=>{settings.energyMode=$('energyMode').value;storeSettings();});
$('resume-btn').addEventListener('click',()=>play());$('save-btn').addEventListener('click',()=>{game.saveCheckpoint();saveCheckpoint();showToast('CHECKPOINT SAVED / YOUR SIGNAL IS YOURS');});$('quit-btn').addEventListener('click',home);$('result-home').addEventListener('click',home);
$('result-btn').addEventListener('click',()=>{if(game.phiwadCustom){if(game.mode==='dead'){game.retry();play();}else home();return;}if(game.mode==='dead'){game.retry();play();}else if(game.mode==='ending'&&game.levelIndex<SECTORS.length-1){game.continueCampaign()||game.continueBeyond();play();}else if(game.mode==='ending')play(true);else{game.next();play();}});
$('title-settings').addEventListener('click',openSettings);$('map-toggle').addEventListener('click',()=>{if(game.mode==='playing'){mapOpen=!mapOpen;updateHUD();}});$('settings-btn').addEventListener('click',openSettings);$('pause-settings').addEventListener('click',openSettings);$('settings-back').addEventListener('click',()=>showScreen(returnScreen));$('howto-btn').addEventListener('click',openHelp);$('help-back').addEventListener('click',()=>showScreen(returnScreen));
$('controller-setup').addEventListener('click',()=>{openSettings();if(inputMode!=='keyboard')controllerMenu.focus($('controllerSensitivity'));else $('controller-section').scrollIntoView({block:'nearest'});});
for(const [id,mode]of [['vr-btn','arcade'],['immersive-btn','immersive']])$(id).addEventListener('click',()=>{audio.start();void vr.enter(mode).finally(()=>{for(const button of ['vr-btn','immersive-btn'])$(button).disabled=vr.active;});});$('vr-recenter').addEventListener('click',()=>vr.recenter());$('vr-exit').addEventListener('click',()=>void vr.exit());
$('mute-btn').addEventListener('click',toggleMute);$('capture-btn').addEventListener('click',lockMouse);
$('fullscreen-btn').addEventListener('click',()=>{const promise=document.fullscreenElement?document.exitFullscreen?.():$('app').requestFullscreen?.();promise?.catch(()=>showToast('FULLSCREEN UNAVAILABLE IN THIS BROWSER'));});
for(const id of ['sensitivity','music','sfx','resolution','crt','reducedMotion','controlMode','controllerSensitivity','controllerDeadzone','controllerRumble','vrDistance','vrWidth','vrTurnMode','vrSnapAngle','vrMoveReference','vrMoveSpeed','vrTurnSpeed','vrVignetteStrength','vrEyeHeight','vrPosture','vrQuality','vrVignette','vrAimLine','vrDiagnostics'])$(id).addEventListener('input',()=>{settings[id]=['crt','reducedMotion','controllerRumble','vrVignette','vrAimLine','vrDiagnostics'].includes(id)?$(id).checked:['controlMode','vrTurnMode','vrMoveReference','vrPosture','vrQuality'].includes(id)?$(id).value:Number($(id).value);if(id==='vrPosture')settings.vrEyeHeight=settings.vrPosture==='standing'?1.75:1.65;applySettings();if(['vrDistance','vrWidth','vrEyeHeight','vrPosture'].includes(id))vr.recenter();if(id==='vrQuality'&&vr.active)showToast('QUALITY SCALE APPLIES NEXT VR SESSION / DETAIL CHANGED NOW');if(id==='controllerRumble'&&!settings.controllerRumble)rumble.stop();storeSettings();});
const pressedActions={KeyE:()=>game.interact(),KeyQ:()=>game.oriAbility(),KeyF:()=>game.vision(),KeyR:()=>game.reload(),KeyB:()=>game.bassDrop(),Space:()=>game.dodge({left:keys.has('KeyA'),right:keys.has('KeyD'),back:keys.has('KeyS')})};
document.addEventListener('keydown',e=>{
  if(e.isTrusted)communications.unlock();
  if(vr.immersive&&game.mode==='playing')return;setInputMode('keyboard');
  if(e.target.matches('input,select'))return;const code=keyCode(e);
  if(code==='KeyM'&&!e.repeat){toggleMute();return;}
  if(code==='Escape'&&!e.repeat){e.preventDefault();if(screen==='settings-screen'||screen==='help-screen'){showScreen(returnScreen);return;}if(game.mode==='playing')pause();else if(screen==='pause-screen')play();return;}
  if(code==='Enter'&&!e.repeat&&e.target===canvas){if(game.mode==='paused')play();else if(game.mode==='dead')$('result-btn').click();return;}
  if(game.mode!=='playing')return;if(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyZ'].includes(code))e.preventDefault();
  keys.add(code);if(e.repeat)return;if(code==='KeyH'){openHelp();return;}if(pressedActions[code])pressedActions[code]();if(/^Digit[1-6]$/.test(code))game.selectWeapon(Number(code.slice(-1))-1);if(code==='Tab')mapOpen=!mapOpen;
  if(code==='KeyZ'||code==='ControlLeft')game.requestFire();processEvents();updateHUD();
});
document.addEventListener('keyup',e=>keys.delete(keyCode(e)));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(vr.immersive||game.mode!=='playing'||screen)return;setInputMode('keyboard');e.preventDefault();audio.start();if(e.pointerType==='touch')return;if(e.button===2){altStart=performance.now();return;}if(e.button!==0)return;dragging=true;lastMouseX=e.clientX;canvas.setPointerCapture?.(e.pointerId);if(capture.state==='idle')lockMouse();fire=true;game.requestFire();processEvents();});
function releasePointer(e){if(e.button===0||e.type==='pointercancel'){fire=false;dragging=false;}if(e.button===2&&altStart&&game.mode==='playing'){game.requestFire(true,clamp((performance.now()-altStart)/1500,0,1));altStart=0;game.charge=0;processEvents();}}
document.addEventListener('pointerup',releasePointer);document.addEventListener('pointercancel',()=>clearInput());
document.addEventListener('pointermove',e=>{if(vr.immersive||game.mode!=='playing'||mapOpen||settings.controlMode==='keyboard')return;if(document.pointerLockElement===canvas)game.player.a+=clamp(e.movementX,-150,150)*.0022*settings.sensitivity;else if(dragging){game.player.a+=clamp(e.clientX-lastMouseX,-150,150)*.005*settings.sensitivity;lastMouseX=e.clientX;}});
canvas.addEventListener('wheel',e=>{if(vr.immersive||game.mode!=='playing')return;e.preventDefault();game.selectWeapon((game.weapon+(e.deltaY>0?1:game.unlocked-1))%game.unlocked);processEvents();updateHUD();},{passive:false});
document.addEventListener('pointerdown',e=>{if(e.isTrusted)communications.unlock();if(vr.immersive){audio.start();return;}setInputMode('keyboard');audio.start();audio.pause(game.mode!=='playing');},{capture:true});
document.addEventListener('pointerlockchange',()=>capture.lockChange(document.pointerLockElement===canvas));document.addEventListener('pointerlockerror',()=>capture.denied());
window.addEventListener('blur',()=>{communications.cancel();if(vr.active)return;clearInput();if(game.mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)communications.cancel();if(!vr.active&&document.hidden&&game.mode==='playing')pause();});
window.addEventListener('pagehide',()=>{communications.cancel();if(game.mode==='playing'||game.mode==='paused'){game.saveCheckpoint();saveCheckpoint();}});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));}
$('touch-fire').addEventListener('pointerdown',e=>{e.preventDefault();fire=true;game.requestFire();e.target.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-fire').addEventListener(event,()=>fire=false);
$('touch-use').addEventListener('click',()=>game.interact());$('touch-ori').addEventListener('click',()=>game.oriAbility());$('touch-turn').addEventListener('pointerdown',e=>{keys.add('ArrowRight');e.target.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('touch-turn').addEventListener(event,()=>keys.delete('ArrowRight'));$('touch-pause').addEventListener('click',pause);
function tick(now,externalPad,spatial){
  if(alertTimer>0)alertTimer-=Math.min(.05,(now-lastFrame)/1000);
  const realDt=Math.max(.001,(now-lastFrame)/1000),dt=Math.min(.05,realDt);lastFrame=now;communications.tick(realDt);
  const pad=pollController(dt,externalPad,!!spatial);
  if(spatial){const r=stepImmersive(game,spatial,pad,settings,dt,{map:()=>{mapOpen=!mapOpen;},reset:()=>vr.input.reset()});if(r.trackingLost)pause();audio.listener(spatial.rig);processEvents();}
  else if(game.mode==='playing'){
    game.charge=altStart?clamp((now-altStart)/1500,0,1):pad?.charge||0;
    game.update(dt,gameplayInput(keys,pad||undefined,fire,settings.controllerSensitivity));processEvents();
    ambientTimer-=dt;if(ambientTimer<=0){ambientTimer=12;audio.play('ambient');}
  }
  if(!spatial)renderer.draw(game,dt,vr.active?{...settings,reducedMotion:true}:{...settings,externalMap:true},{demo:game.mode==='title',map:mapOpen});
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');}if(dialogueTimer>0){dialogueTimer-=dt;if(dialogueTimer<=0)$('dialogue').hidden=true;}
  if(!vr.active&&!settings.reducedMotion&&game.shake>0){const magnitude=game.shake*8;canvas.style.transform='translate('+Math.sin(now*.09)*magnitude+'px,'+Math.cos(now*.11)*magnitude+'px)';}else canvas.style.transform='';
  hudTime+=dt;if(hudTime>.08){hudTime=0;updateHUD();}fpsFrames++;fpsTime+=realDt;if(fpsTime>=1){$('fps').textContent=Math.round(fpsFrames/fpsTime);fpsFrames=0;fpsTime=0;}
}
function frame(now){desktopFrame=0;if(vr.active)return;tick(now);desktopFrame=requestAnimationFrame(frame);}
void vr.probe();navigator.xr?.addEventListener?.('devicechange',()=>void vr.probe());
applySettings();showScreen('title-screen');updateHUD();desktopFrame=requestAnimationFrame(frame);
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('offline-status').textContent='OFFLINE READY';}).catch(()=>{$('offline-status').textContent='ONLINE';$('offline-status').title='Offline caching unavailable here. Keep the source download for local play.';});else $('offline-status').textContent='LOCAL BUILD';
