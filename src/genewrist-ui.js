/** GEN.E.WRIST 3–6–9 host presentation.
 * Buttons are wired through WorldUI's existing guarded wrist pointer system.
 * This is not an independent WebXR session or a replacement for BTM's HUD.
 */
import {UI,UI_FONT} from './arcade-ui.js';
import {RINGS,TOOLKIT} from './genewrist/catalog.js';
import {FIELD_WORLDS} from './genewrist-bridge.js';
export function paintGenEWristView(ui,data){
 const g=ui.g,p=data.game.player,nav=ui.field;
 const label=(str,max=18)=>String(str).length>max?String(str).slice(0,max-1)+'…':String(str);
 const write=(value,x,y,size=17,color=UI.text)=>{
  g.fillStyle=color;g.font=(size>=19?'600 ':'')+size+'px '+UI_FONT;g.fillText(value,x,y);
 };
 const button=(x,y,w,h,name,action,options={})=>ui.button(x,y,w,h,name,()=>{action();ui.lastPaint=-Infinity;},options);
 const footer=()=>{
  button(20,444,300,46,'BACK / COMBAT',()=>nav.back(),{icon:'<'});
  ui.button(594,444,150,46,ui.wrist.pinned?'UNPIN':'PIN LINK',ui.statusTarget.action);
 };
 write('BTM LIVE / HP '+Math.ceil(p.health)+'  ARMOR '+Math.ceil(p.armor)+'  ENERGY '+Math.floor(p.energy),20,65,17,UI.cyan);
 write('GEN.E.WRIST  ·  THE BUILDER’S COMPANION  ·  3 / 6 / 9',20,91,14,UI.muted);
 if(nav.page==='ring'){
  RINGS.forEach((ring,i)=>button(20+i*246,108,236,43,ring.count+' / '+ring.label,()=>nav.chooseRing(ring.id),{selected:nav.ring===ring.id}));
  write('SELECT A MODULE / '+nav.ring.toUpperCase(),20,171,15,UI.muted);
  nav.modules().forEach((app,i)=>{
   button(20+i%3*246,190+Math.floor(i/3)*74,236,62,label(app.title,15),()=>nav.chooseApp(app.id),{selected:nav.app===app.id,icon:String(i+1)});
  });
  footer();return;
 }
 if(nav.page==='worlds'){
  write('REALM ATLAS / VERIFIED DESTINATIONS',20,126,19,UI.gold);
  write('External travel exits XR and leaves this game. Confirm before going.',20,149,14,UI.muted);
  FIELD_WORLDS.forEach((world,i)=>{
   const enabled=Boolean(world.url);
   button(20+i%3*246,173+Math.floor(i/3)*85,236,68,label(world.title,17),()=>nav.selectWorld(world.id),{enabled,icon:enabled?'→':'×'});
   if(!enabled)write('PLANNED',35+i%3*246,230+Math.floor(i/3)*85,12,UI.muted);
  });
  footer();return;
 }
 if(nav.page==='confirm'){
  const dest=nav.pending;
  write('CONFIRM EXTERNAL WORLD HANDOFF',20,139,25,UI.gold);
  write(dest?.title||'No destination selected',20,190,22,UI.text);
  const lines=[
   'This action ends immersive VR and leaves BTM.',
   data.game.phiwadCustom?'CUSTOM ΦWAD PROGRESS WILL NOT BE SAVED.':'A campaign checkpoint will be saved before exit.',
   'The destination uses a separate website and XR session.'
  ];
  lines.forEach((line,i)=>write(line,20,235+i*33,17,i===1?UI.gold:UI.muted));
  if(dest)button(20,356,454,55,'CONFIRM EXIT / TRAVEL',()=>data.activate('genewrist-travel',dest.id),{icon:'→'});
  button(490,356,254,55,'CANCEL',()=>nav.back());
  footer();return;
 }
 const app=nav.selected();
 write(label(app?.title||'MODULE',38).toUpperCase(),20,137,25,UI.gold);
 if(app?.id==='loom-market'){
  write('LOOM MARKET / LOCAL APP CATALOG',20,182,17,UI.cyan);
  write('The original 18 modules live in the shared GenEWrist repository.',20,223,17,UI.muted);
  write('This BTM view is informational, not a remote app installer.',20,255,16,UI.muted);
  write('Creation  ·  Navigation  ·  Lore  ·  Community',20,300,17,UI.text);
  write('Play / Well-Being  ·  Fusion',20,333,17,UI.text);
 }else if(app?.id==='snake-toolkit'){
  write('MACHINIST TOOLS / SYMBOLIC MODULES',20,180,17,UI.cyan);
  TOOLKIT.forEach((name,i)=>write('• '+label(name,33),20+i%2*370,217+Math.floor(i/2)*42,15,UI.text));
 }else{
  write(label(app?.description||'App not yet implemented.',70),20,195,18,UI.text);
  write(app?.status==='interactive-demo'?'Available in the standalone GenEWrist console.':'Historical / planned module, not implemented in BTM.',20,247,17,UI.muted);
 }
 button(20,365,450,55,'OPEN REALM ATLAS',()=>{nav.chooseRing('middle');nav.chooseApp('realm-atlas');},{icon:'◎'});
 footer();
}
