import {WEAPONS} from './core.js';
import {drawPortrait} from './assets.js';
import {UI,UI_FONT,WEAPON_UI,drawPanel,drawWeaponIcon,wrapText} from './arcade-ui.js';
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export class WorldUI {
 constructor(){this.canvas=makeCanvas(512,512);this.caption=makeCanvas(1024,160);this.g=this.canvas.getContext('2d',{alpha:false});this.captionG=this.caption.getContext('2d',{alpha:false});this.targets=[];this.lastPaint=-Infinity;this.lastCaption='';this.captionPanel=null;this.wristPanel=null;this.captionChanged=false;this.cursor=null;this.blocker={action:()=>{}};}
 targetAt(hit){return hit&&this.targets.find(t=>hit.u*512>=t.x&&hit.u*512<=t.x+t.w&&hit.v*512>=t.y&&hit.v*512<=t.y+t.h);}
 placeWrist(rig){
  this.wristPanel=null;
  if(rig.hasLeft){const m=rig.leftWorld,center=[m[12],m[13]+.06,m[14]],dx=rig.eye[0]-center[0],dz=rig.eye[2]-center[2],n=Math.hypot(dx,dz)||1;if(Math.hypot(dx,rig.eye[1]-center[1],dz)<1.3&&center[1]>rig.eye[1]-.78)this.wristPanel={center,right:[dz/n,0,-dx/n],up:[0,1,0],normal:[dx/n,0,dz/n],width:.48,height:.48};}
  return this.wristPanel;
 }
 paint(data,rig,now){
  const {game,activate,map=false}=data,g=this.g,p=game.player;this.captionChanged=false;
  if(now-this.lastPaint>75||this.lastScreen!==data.screen){
   this.lastPaint=now;this.lastScreen=data.screen;g.fillStyle=UI.bg;g.fillRect(0,0,512,512);drawPanel(g,2,2,508,508,UI.violet,UI.bg);
   g.save();g.translate(14,12);drawPortrait(g,game.hurt>0,data.settings?.reducedMotion?0:game.time,{mood:game.portraitMood,health:p.health});g.restore();
   g.font=`600 22px ${UI_FONT}`;g.fillStyle=UI.pink;g.fillText('HP '+Math.ceil(p.health),92,30);g.fillStyle=UI.cyan;g.fillText('ARMOR '+Math.ceil(p.armor),258,30);
   g.font=`600 19px ${UI_FONT}`;g.fillStyle=UI.cyan;g.fillText('ENERGY '+Math.floor(p.energy),92,58);g.fillStyle=UI.violet;g.fillText('ORI '+Math.floor(p.ori)+'%',298,58);
   g.fillStyle=WEAPON_UI[game.weapon];g.font=`600 19px ${UI_FONT}`;g.fillText(WEAPONS[game.weapon].name,14,94);g.fillStyle=UI.text;g.font=`17px ${UI_FONT}`;wrapText(g,game.objective,14,121,484,22);this.targets=[];
   for(const [x,y,w,value,color]of [[92,35,130,p.health,UI.pink],[258,35,232,p.armor,UI.cyan],[92,65,180,p.energy,UI.cyan],[298,65,192,p.ori,UI.violet]]){g.fillStyle='#101a32';g.fillRect(x,y,w,4);g.fillStyle=color;g.fillRect(x,y,w*Math.max(0,Math.min(1,value/100)),4);}
   const button=(x,y,w,h,label,action,enabled=true,selected=false,weapon=-1)=>{
    const hover=this.cursor&&this.cursor.u*512>=x&&this.cursor.u*512<=x+w&&this.cursor.v*512>=y&&this.cursor.v*512<=y+h;
    drawPanel(g,x,y,w,h,enabled?(hover?UI.gold:selected?UI.pink:UI.line):'#283354',hover&&enabled?'#29395a':selected?'#43204b':enabled?'#19233f':'#0f162d');
    g.fillStyle=enabled?UI.text:'#7e91b6';g.font=`600 17px ${UI_FONT}`;
    if(weapon>=0){drawWeaponIcon(g,weapon,x+6,y+4,60,h-8,enabled);g.fillText(label,x+72,y+h/2+6);}else g.fillText(label,x+8,y+h/2+6);
    if(enabled)this.targets.push({x,y,w,h,action});
   };
   if(map){
    const l=game.level,cell=Math.min(484/l.w,306/l.h),x0=(512-l.w*cell)/2,y0=158;g.fillStyle='#060b20';g.fillRect(12,150,488,322);
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){if(!l.seen[y*l.w+x])continue;g.fillStyle=l.cells[y][x]?'#487299':'#152d4a';if(l.doors[x+','+y])g.fillStyle=l.doors[x+','+y].type===5?UI.gold:UI.violet;g.fillRect(x0+x*cell,y0+y*cell,cell-1,cell-1);}
    for(const [items,color]of [[l.relays.filter(r=>!r.active),UI.pink],[l.captives.filter(c=>!c.freed),UI.cyan],[[l.exit],UI.violet]])for(const o of items)if(l.seen[Math.floor(o.y)*l.w+Math.floor(o.x)]){g.fillStyle=color;g.fillRect(x0+o.x*cell-2,y0+o.y*cell-2,4,4);}
    g.save();g.translate(x0+p.x*cell,y0+p.y*cell);g.rotate(p.a);g.fillStyle=UI.cyan;g.beginPath();g.moveTo(7,0);g.lineTo(-5,-5);g.lineTo(-3,0);g.lineTo(-5,5);g.closePath();g.fill();g.restore();button(14,480,484,24,'CLOSE MAP',()=>activate('map'));
   }else{
    const labels=['1 SLAP','2 BLASTER','3 BASS','4 PULSE','5 DISRUPT','6 UNPLUG'];for(let i=0;i<6;i++)button(14+i%2*246,158+Math.floor(i/2)*49,238,41,labels[i],()=>activate('weapon',i),i<game.unlocked,i===game.weapon,i);
    const actions=[['MAP','map'],['ORI','ori'],['BASS','bass'],['VENT','reload'],['DODGE','dodge'],['VISION','vision'],['PAUSE','pause'],['CENTER','recenter']];actions.forEach(([label,action],i)=>button(14+i%4*124,326+Math.floor(i/4)*51,116,43,label,()=>activate(action)));
    g.fillStyle=UI.muted;g.font=`15px ${UI_FONT}`;wrapText(g,(data.focus?'[GRIP] '+data.focus.label:game.interactionHint().replace('[ E ]','[GRIP]'))||'RAISE WRIST / POINT + TRIGGER',14,447,484,20);
    const d=data.diagnostics;g.fillStyle=UI.violet;g.fillText(data.settings?.vrDiagnostics&&d?'WORLD '+d.drawCalls+' DRAWS / CPU '+d.frameMs.toFixed(1)+'ms':(game.phiwadCustom?'CUSTOM SIGNAL':'SECTOR '+(game.levelIndex+1)+'/12')+'   '+game.portraitMood,14,488);
   }
   if(this.cursor){g.strokeStyle=UI.gold;g.lineWidth=2;g.beginPath();g.arc(this.cursor.u*512,this.cursor.v*512,6,0,Math.PI*2);g.stroke();g.lineWidth=1;}
  }
  this.placeWrist(rig);
  const dialogue=data.dialogue||data.toast||'';
  if(dialogue!==this.lastCaption){this.lastCaption=dialogue;const c=this.captionG;c.fillStyle=UI.bg;c.fillRect(0,0,1024,160);c.fillStyle=UI.cyan;c.fillRect(0,0,5,160);c.fillStyle=UI.text;c.font=`500 27px ${UI_FONT}`;wrapText(c,dialogue,24,41,975,36);this.captionChanged=true;this.captionPanel=null;}
  if(dialogue&&!data.screen){const a=rig.headAngle,fx=Math.cos(a),fz=Math.sin(a);if(!this.captionPanel||Math.hypot(this.captionPanel.center[0]-rig.eye[0],this.captionPanel.center[2]-rig.eye[2])>2.3)this.captionPanel={center:[rig.eye[0]+fx*1.3,rig.eye[1]-.32,rig.eye[2]+fz*1.3],right:[-fz,0,fx],up:[0,1,0],normal:[-fx,0,-fz],width:1.2,height:.1875};}else this.captionPanel=null;
  return this.canvas;
 }
}
