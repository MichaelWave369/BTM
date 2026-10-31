import {Game,WEAPONS} from '../src/core.js';
import {VRPanel} from '../src/vr-renderer.js';
import {WorldUI} from '../src/world-ui.js';
import {ImmersiveRig} from '../src/immersive-rig.js';
import {UI,UI_FONT,drawOri,drawWeaponIcon} from '../src/arcade-ui.js';
const expect=(ok,message='Assertion failed')=>{if(!ok)throw Error(message);};
const painted=c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=64)if(p[i]+p[i+1]+p[i+2]>110)n++;return n;};
export async function uiChecks(frame,onProgress=()=>{}){
 const results=[];const run=async(name,fn)=>{try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}onProgress(results);};
 for(const [w,h] of [[1920,1080],[1280,720],[960,640],[390,844]]){
  frame.style.width=w+'px';frame.style.height=h+'px';frame.style.transform='scale('+Math.min(1,1100/w)+')';
  await new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(Error('Game iframe failed'));frame.src='./index.html?ui-qa='+w;});
  const win=frame.contentWindow,doc=frame.contentDocument,$=id=>doc.getElementById(id),style=el=>win.getComputedStyle(el),tick=()=>new Promise(r=>win.requestAnimationFrame(()=>win.requestAnimationFrame(r)));
  await doc.fonts.ready;await tick();
  await run(`${w}×${h}: local typefaces load and title navigation is usable`,()=>{
   expect(doc.fonts.check('600 16px Oxanium')&&doc.fonts.check('16px "Racing Sans One"'),'Bundled fonts not loaded');
   for(const id of ['start-btn','nightmare-btn','vr-btn','immersive-btn','title-settings','howto-btn','controller-setup']){const el=$(id),r=el.getBoundingClientRect();expect(r.width>40&&r.height>=30,id+' target missing or too small');expect(r.left>=0&&r.right<=w+1,id+' outside screen');}
   const actions=doc.querySelector('.title-actions').getBoundingClientRect(),lower=doc.querySelector('.title-lower').getBoundingClientRect();expect(actions.bottom<lower.top,'Launch choices overlap title footer');expect(doc.documentElement.scrollWidth<=w+1,'Horizontal overflow');
  });
  await run(`${w}×${h}: settings preserve all controls and return to title`,async()=>{
   $('title-settings').click();await tick();expect(!$('settings-screen').hidden,'Settings not open');
   for(const id of ['sensitivity','music','sfx','controlMode','resolution','crt','reducedMotion','controllerSensitivity','controllerDeadzone','controllerRumble','vrDistance','vrWidth','vrTurnMode','vrSnapAngle','vrMoveReference','vrMoveSpeed','vrEyeHeight','vrPosture','vrQuality','vrVignette','vrAimLine','vrDiagnostics'])expect($('settings-screen').contains($(id)),'Lost setting '+id);
   const resolution=$('resolution'),old=resolution.value;resolution.value='480';resolution.dispatchEvent(new Event('input',{bubbles:true}));expect($('game').width===480,'Resolution control disconnected');resolution.value=old;resolution.dispatchEvent(new Event('input',{bubbles:true}));
   const mode=$('controlMode');mode.value='keyboard';mode.dispatchEvent(new Event('input',{bubbles:true}));$('settings-back').click();await tick();expect(!$('title-screen').hidden,'Settings back did not return');
  });
  await run(`${w}×${h}: real gameplay HUD fits with six functional weapon slots`,async()=>{
   $('start-btn').click();await tick();expect(doc.body.classList.contains('playing'),'Classic did not start');
   const hud=$('hud').getBoundingClientRect();expect(hud.width>0&&hud.left>=0&&hud.right<=w+1,'HUD overflow');
   const panels=[...$('hud').children].map(el=>el.getBoundingClientRect());for(let a=0;a<panels.length;a++)for(let b=a+1;b<panels.length;b++){const x=Math.min(panels[a].right,panels[b].right)-Math.max(panels[a].left,panels[b].left),y=Math.min(panels[a].bottom,panels[b].bottom)-Math.max(panels[a].top,panels[b].top);expect(x<=1||y<=1,'HUD panels overlap');}
   for(const id of ['health','armor','energy','ori-energy']){expect($(id).textContent.trim(),'Missing '+id);expect(parseFloat(style($(id)).fontSize)>=14,'Essential '+id+' text too small');}
   expect($('weapon-slots').children.length===6,'Missing weapons');$('weapon-slots').children[2].click();await tick();expect($('weapon-name').textContent===WEAPONS[2].name,'Weapon click disconnected');expect($('weapon-slots').children[2].getAttribute('aria-pressed')==='true','Weapon selection not announced');
   expect($('weapon-slots').children[5].disabled,'Locked weapon selectable');expect(painted($('portrait'))>10&&painted($('hud-ori'))>10&&painted($('radar'))>10,'Canvas instrument blank');
  });
  await run(`${w}×${h}: map, pause, manual and resume still work`,async()=>{
   $('map-toggle').click();await tick();expect($('radar-panel').hidden,'Map did not open');$('game').dispatchEvent(new KeyboardEvent('keydown',{code:'Tab',key:'Tab',bubbles:true}));$('game').dispatchEvent(new KeyboardEvent('keyup',{code:'Tab',key:'Tab',bubbles:true}));await tick();expect(!$('radar-panel').hidden,'Map did not close');
   $('game').dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape',bubbles:true}));await tick();expect(!$('pause-screen').hidden,'Pause not reachable');$('pause-settings').click();await tick();expect(!$('settings-screen').hidden,'Pause settings not reachable');$('settings-back').click();$('resume-btn').click();await tick();expect(doc.body.classList.contains('playing'),'Resume failed');
   $('game').dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH',key:'h',bubbles:true}));await tick();expect(!$('help-screen').hidden,'Field manual not reachable');$('help-back').click();await tick();expect(!$('pause-screen').hidden,'Manual did not return to pause');
  });
 }
 await run('All canvas UI art renders using original vector paths',()=>{const c=document.createElement('canvas');c.width=600;c.height=130;const g=c.getContext('2d');drawOri(g,0,0,100,1,true);for(let i=0;i<6;i++)drawWeaponIcon(g,i,100+i*80,30,70,44,true);expect(painted(c)>80,'Interface illustration blank');});
 await run('VR Arcade menu and utility controls retain live hit targets',()=>{const game=new Game();game.start();const scene=document.createElement('canvas');scene.width=640;scene.height=360;const panel=new VRPanel();let action='';panel.paint({game,scene,screen:'',activate:a=>action=a,dialogue:'ORI: Your signal is looking good.'});expect(panel.targets.length===8,'Missing Arcade utilities');panel.targetAt({u:60/1024,v:728/768}).action();expect(action==='pause','Arcade pointer target disconnected');expect(painted(panel.canvas)>500,'Arcade panel blank');const item=frame.contentDocument.getElementById('start-btn'),labels=[],paint=panel.g.fillText.bind(panel.g);panel.g.fillText=(label,...rest)=>{labels.push(label);paint(label,...rest);};panel.paint({game,scene,screen:'title-screen',items:[item],focused:item,activate:()=>{}});expect(labels.includes('ENTER THE MATRIX'),'Arcade title labels merged with subtitles or icons');});
 await run('Immersive wrist weapons, utilities, map and captions retain hit targets',()=>{const game=new Game();game.start();const ui=new WorldUI(),rig=new ImmersiveRig();let action='';ui.paint({game,activate:a=>action=a,dialogue:'ORI: Behind you, Michael!'},rig,100);expect(ui.targets.length===14&&ui.targets.some(t=>t.label==='GEN.E'),'Unlocked wrist targets changed');ui.targetAt({u:72/512,v:347/512}).action();expect(action==='map','Wrist map target disconnected');expect(painted(ui.canvas)>400&&painted(ui.caption)>100,'Wrist/caption blank');ui.paint({game,activate:()=>{},map:true},rig,200);expect(ui.targets.length===4&&ui.targets.some(t=>t.label==='CLOSE MAP'),'Wrist map close missing');});
 return {passed:results.every(r=>r.pass),total:results.length,results,method:'Production HTML/CSS in real iframe viewports; native Canvas painting and synthetic UI events. No physical XR or controller hardware.'};
}
