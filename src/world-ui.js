import {WEAPONS} from './core.js';
import {FieldNavigator} from './genewrist-bridge.js';
import {paintGenEWristView} from './genewrist-ui.js';
import {UI,UI_FONT,drawPanel,drawWeaponIcon,drawOri,drawWave} from './arcade-ui.js';
import {equipmentSettings,WristComputer,equipmentPanel,placeComfortCaption,panelsOverlap} from './equipment-math.js';
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function linesFor(g,text,width){const lines=[];let row='';for(const word of String(text).split(/\s+/)){if(g.measureText(word).width>width){if(row){lines.push(row);row='';}let part='';for(const char of word){if(part&&g.measureText(part+char).width>width){lines.push(part);part='';}part+=char;}row=part;continue;}const next=row?row+' '+word:word;if(row&&g.measureText(next).width>width){lines.push(row);row=word;}else row=next;}if(row)lines.push(row);return lines;}
function accent(hex,brightness){const gain=Math.max(.5,Math.min(1.1,brightness));return '#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*gain)).toString(16).padStart(2,'0')).join('');}
export class WorldUI{
 constructor(){this.canvas=canvas(768,512);this.status=canvas(320,140);this.caption=canvas(1280,360);this.alert=canvas(768,128);this.alertG=this.alert.getContext('2d',{alpha:false});this.alertAnchor=equipmentPanel(.46,.075);this.alertPanel=null;this.alertChanged=false;this.logOpen=false;this.logPage=0;this.archiveOpen=false;this.archivePage=0;this.archiveSelected=null;this.archiveDetailPage=0;this.g=this.canvas.getContext('2d',{alpha:false});this.statusG=this.status.getContext('2d',{alpha:false});this.captionG=this.caption.getContext('2d',{alpha:false});this.wrist=new WristComputer();this.field=new FieldNavigator();this.targets=[];this.lastPaint=this.lastStatus=this.lastCaptionPaint=-Infinity;this.captionMessage='';this.captionKey='';this.captionSince=0;this.captionLeaving=-1;this.captionPanel=null;this.wristPanel=null;this.statusPanel=null;this.cursor=null;this.captionChanged=this.statusChanged=false;this.blocker={action:()=>{}};this.statusTarget={action:()=>{this.wrist.togglePin();this.lastPaint=-Infinity;}};this.captionAnchor=equipmentPanel(1.12,.28);this.link={from:new Float32Array(3),left:new Float32Array(3),right:new Float32Array(3)};}
 targetAt(hit){
  if(!hit)return null;
  const x=hit.u*this.canvas.width,y=hit.v*this.canvas.height;
  const inside=t=>x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h;
  const direct=this.targets.find(inside);
  if(direct)return direct;
  // A small pointer tolerance makes Quest 3/3S buttons easier to hit
  // without changing their visual layout or merging adjacent actions.
  const pad=9,near=this.targets.filter(t=>x>=t.x-pad&&x<=t.x+t.w+pad&&y>=t.y-pad&&y<=t.y+t.h+pad);
  return near.sort((a,b)=>{
   const da=(x-a.x-a.w/2)**2+(y-a.y-a.h/2)**2;
   const db=(x-b.x-b.w/2)**2+(y-b.y-b.h/2)**2;
   return da-db;
  })[0]||null;
 }
 placeWrist(rig,settings=rig.settings||{},now=performance.now()){if(this.epoch!==rig.equipmentEpoch){this.epoch=rig.equipmentEpoch;this.wrist.reset();this.field.reset();this.logOpen=false;this.logPage=0;this.archiveOpen=false;this.archivePage=0;this.archiveSelected=null;this.archiveDetailPage=0;}this.wrist.update(rig,settings,now);this.wristPanel=this.wrist.visible?this.wrist.panel:null;this.statusPanel=this.wrist.statusVisible?this.wrist.status:null;rig.equipmentLink=null;if(this.wristPanel){this.link.from.set(this.wrist.status.center);for(let i=0;i<3;i++){this.link.left[i]=this.wristPanel.center[i]-this.wristPanel.right[i]*this.wristPanel.width*.42-this.wristPanel.up[i]*this.wristPanel.height*.5;this.link.right[i]=this.wristPanel.center[i]+this.wristPanel.right[i]*this.wristPanel.width*.42-this.wristPanel.up[i]*this.wristPanel.height*.5;}rig.equipmentLink=this.link;}return this.wristPanel;}
 button(x,y,w,h,label,action,{enabled=true,selected=false,weapon=-1,icon=''}={}){
  const g=this.g,cursor=this.cursor,hover=cursor&&cursor.u*768>=x&&cursor.u*768<=x+w&&cursor.v*512>=y&&cursor.v*512<=y+h;
  drawPanel(g,x,y,w,h,!enabled?'#344156':hover?UI.gold:selected?UI.pink:'#3c617d',selected?'#25253e':hover?'#1b3449':'#0e1d2d');
  if(weapon>=0){drawWeaponIcon(g,weapon,x+8,y+8,58,h-16,enabled);g.fillStyle=enabled?UI.text:UI.muted;g.font='600 18px '+UI_FONT;g.fillText(label,x+74,y+25);g.font='13px '+UI_FONT;g.fillStyle=enabled?UI.cyan:UI.muted;g.fillText(enabled?(WEAPONS[weapon].cost||'FREE')+(WEAPONS[weapon].cost?' ENERGY':''):'LOCKED',x+74,y+43);}
  else{g.fillStyle=enabled?UI.text:UI.muted;g.font='600 20px '+UI_FONT;if(icon){g.fillStyle=UI.cyan;g.fillText(icon,x+12,y+h/2+7);}g.fillStyle=enabled?UI.text:UI.muted;g.fillText(label,x+(icon?43:14),y+h/2+7);}if(enabled)this.targets.push({x,y,w,h,action,label,weapon});
 }
 paintStatus(game,s,now){
  this.statusChanged=false;if(now-this.lastStatus<125)return;this.lastStatus=now;this.statusChanged=true;const g=this.statusG,p=game.player;
  g.fillStyle='#06111b';g.fillRect(0,0,320,140);g.strokeStyle=accent(UI.cyan,s.vrHologramBrightness);g.lineWidth=3;g.strokeRect(2,2,316,136);g.font='600 34px '+UI_FONT;g.fillStyle=p.health<30?UI.red:UI.text;g.fillText('HP '+Math.ceil(p.health),12,46);g.fillStyle=UI.cyan;g.fillText('E '+Math.floor(p.energy),181,46);g.fillStyle='#23364a';g.fillRect(12,60,296,11);g.fillStyle=p.health<30?UI.red:UI.cyan;g.fillRect(12,60,296*Math.max(0,Math.min(1,p.health/100)),11);g.font='19px '+UI_FONT;g.fillStyle=UI.muted;g.fillText(game.survival?'RES '+Math.floor(p.reserve)+' / 180':this.wrist.pinned?'GEN.E / PINNED':'GEN.E / RAISE TO LINK',12,98);g.font='16px '+UI_FONT;g.fillStyle=UI.gold;g.fillText(!game.survival?(game.dodgeCooldown>0?'DODGE '+game.dodgeCooldown.toFixed(1)+'s':'DODGE / READY'):game.shieldTime>0&&game.shieldCharge>0?'SHIELD '+Math.ceil(game.shieldCharge):game.dodgeCooldown>0?'DASH '+game.dodgeCooldown.toFixed(1)+'s':'DASH BASH / READY',12,126);g.fillStyle=accent(UI.pink,s.vrHologramBrightness);g.fillRect(12,121,50,3);
 }
 paintPanel(data,s,now){
  const {game,activate=()=>{},map=false}=data,p=game.player,g=this.g,key=[map,game.weapon,game.unlocked,this.wrist.pinned,s.vrHologramBrightness,this.field.open,this.field.page,this.field.ring,this.field.app,this.field.pending?.id,this.logOpen,this.logPage,this.archiveOpen,this.archivePage,this.archiveSelected,this.archiveDetailPage,data.archive?.revision,data.communications?.length].join(':');
  if(now-this.lastPaint<100&&key===this.panelKey)return;if(!this.wristPanel&&this.lastPaint!==-Infinity&&key===this.panelKey)return;this.lastPaint=now;this.panelKey=key;this.targets=[];
  g.fillStyle='#07121f';g.fillRect(0,0,768,512);drawPanel(g,3,3,762,506,accent(UI.cyan,s.vrHologramBrightness),'#0a1725');g.fillStyle=UI.cyan;g.font='600 17px '+UI_FONT;g.fillText('GEN.E.WRIST  /  FIELDLINK',20,30);g.fillStyle=UI.muted;g.font='14px '+UI_FONT;g.fillText(game.networkLabel|| (game.campaign==='pit'?'PIT / TRIAL '+(game.levelIndex+1):game.phiwadCustom?'CUSTOM SIGNAL':'SECTOR '+String(game.levelIndex+1).padStart(2,'0')+' / 12'),580,30);
  if(this.logOpen){this.paintLog(data);return;}
  if(this.archiveOpen){this.paintArchive(data);return;}
  if(this.field.open){paintGenEWristView(this,data);if(this.cursor){g.strokeStyle=UI.gold;g.lineWidth=2;g.beginPath();g.arc(this.cursor.u*768,this.cursor.v*512,7,0,Math.PI*2);g.stroke();}return;}
  this.button(365,6,195,34,'GEN.E',()=>{this.field.toggle();this.lastPaint=-Infinity;},{icon:'Φ'});
  for(const [i,label,value,color]of [[0,'HEALTH',p.health,UI.pink],[1,'ARMOR',p.armor,UI.cyan],[2,'ENERGY',p.energy,UI.gold],[3,'ORI LINK',p.ori,UI.violet]]){const x=20+i*185;g.font='14px '+UI_FONT;g.fillStyle=UI.muted;g.fillText(label,x,55);g.font='600 28px '+UI_FONT;g.fillStyle=color;g.fillText(String(Math.ceil(value)),x,85);if(i===2&&game.survival){g.font='12px '+UI_FONT;g.fillText('RES '+Math.floor(p.reserve)+'/180',x+72,83);}g.fillStyle='#20354a';g.fillRect(x,96,166,5);g.fillStyle=color;g.fillRect(x,96,166*Math.max(0,Math.min(1,value/100)),5);}
  g.font='600 20px '+UI_FONT;g.fillStyle=UI.text;g.fillText(WEAPONS[game.weapon].name,20,132);const progress=game.level.relays.filter(r=>r.active).length;g.font='14px '+UI_FONT;g.fillStyle=UI.muted;g.fillText('RELAYS '+progress+'/'+game.level.relays.length+'   '+(p.key?'KEY ACQUIRED':'KEY REQUIRED'),488,132);g.font='18px '+UI_FONT;g.fillStyle=UI.text;linesFor(g,game.objective,718).slice(0,2).forEach((line,i)=>g.fillText(line,20,158+i*22));
  if(map){
   const l=game.level,x0=24,y0=191,cell=Math.min(720/l.w,225/l.h),origin=(768-l.w*cell)/2;g.fillStyle='#050e18';g.fillRect(x0,y0,720,231);
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){if(!l.seen[y*l.w+x])continue;g.fillStyle=l.doors[x+','+y]?(l.doors[x+','+y].type===5?UI.gold:UI.violet):l.cells[y][x]?'#426077':'#142c3d';g.fillRect(origin+x*cell,y0+y*cell,Math.max(1,cell-1),Math.max(1,cell-1));}
   for(const [objects,color]of [[l.relays.filter(r=>!r.active),UI.pink],[l.captives.filter(c=>!c.freed),UI.cyan],[[l.exit],UI.violet]])for(const o of objects)if(l.seen[Math.floor(o.y)*l.w+Math.floor(o.x)]){g.fillStyle=color;g.fillRect(origin+o.x*cell-2,y0+o.y*cell-2,4,4);}
   g.save();g.translate(origin+p.x*cell,y0+p.y*cell);g.rotate(p.a);g.fillStyle=UI.text;g.beginPath();g.moveTo(6,0);g.lineTo(-4,-4);g.lineTo(-2,0);g.lineTo(-4,4);g.closePath();g.fill();g.restore();this.button(20,444,192,46,'CLOSE MAP',()=>activate('map'),{icon:'M'});
  }else{
   const labels=['SLAP','BLASTER','BASS','Φ PULSE','DISRUPT','UNPLUG'];for(let i=0;i<6;i++)this.button(20+i%3*246,192+Math.floor(i/3)*62,236,54,labels[i],()=>activate('weapon',i),{weapon:i,enabled:i<game.unlocked,selected:i===game.weapon});
   const tools=[['MAP','map','M'],['ORI','ori','O'],['BASS','bass','B'],[game.survival?'RELOAD':'VENT','reload','R'],[game.survival?'BASH / SHIELD':'DODGE','dodge','D'],['VISION','vision','Φ'],['PAUSE','pause','II'],['CENTER','recenter','C']];tools.forEach(([label,action,icon],i)=>this.button(20+i%4*185,326+Math.floor(i/4)*51,175,43,label,()=>activate(action),{icon,enabled:!(game.networkCompetitive&&['ori','bass'].includes(action))&&!(game.oriCorrupted&&action==='ori')}));
   g.font='15px '+UI_FONT;g.fillStyle=UI.muted;const hint=data.focus?data.focus.label:game.interactionHint().replace('[ E ]','[GRIP]');g.fillText(hint||'POINT + TRIGGER  /  LOWER WRIST TO CLOSE',20,434);const d=data.diagnostics;g.font='13px '+UI_FONT;g.fillStyle=UI.cyan;g.fillText(data.settings?.vrDiagnostics&&d?'WORLD '+d.drawCalls+' DRAWS / CPU '+d.frameMs.toFixed(1)+'ms':'LINK STABLE  /  '+game.portraitMood,395,474,185);
  }
  this.button(map?224:20,444,map?160:238,46,'COMMS LOG',()=>{this.logOpen=true;this.logPage=0;this.archiveOpen=false;this.lastPaint=-Infinity;});
  this.button(map?392:270,444,map?183:305,46,'HUMAN LEDGER',()=>{this.archiveOpen=true;this.archiveSelected=null;this.archivePage=0;this.logOpen=false;this.lastPaint=-Infinity;});
  this.button(594,444,150,46,this.wrist.pinned?'UNPIN':'PIN LINK',this.statusTarget.action);if(this.cursor){g.strokeStyle=UI.gold;g.lineWidth=2;g.beginPath();g.arc(this.cursor.u*768,this.cursor.v*512,7,0,Math.PI*2);g.stroke();}
 }
 paintCaption(data,rig,s,now){
  this.captionChanged=false;if(!s.captions){this.captionPanel=null;return;}const raw=data.dialogue||data.toast||'',motion=s.vrInterfaceMotion&&!data.settings?.reducedMotion;
  if(raw&&raw!==this.captionMessage){this.captionMessage=raw;this.captionSince=now;this.captionKey='';this.captionLeaving=-1;}if(raw)this.captionLeaving=-1;
  if(!raw&&this.captionMessage){if(this.captionLeaving<0)this.captionLeaving=now;if(!motion||now-this.captionLeaving>180){this.captionMessage='';this.captionKey='';}}if(!this.captionMessage||data.screen){this.captionPanel=null;return;}
  const message=this.captionMessage,colon=message.indexOf(':'),prefix=colon>0?message.slice(0,colon).trim():'',speaker=['ORI','WAVE','ARCHIVE'].includes(prefix)?prefix:'FIELD ALERT',text=speaker==='FIELD ALERT'?message:message.slice(colon+1).trim(),g=this.captionG,font=Math.round(52*s.vrSubtitleSize),lineHeight=Math.round(font*1.18),maxLines=Math.max(2,Math.floor(260/lineHeight));
  g.font='500 '+font+'px '+UI_FONT;const all=linesFor(g,text,1090);this.captionLines=all;const pages=Math.max(1,Math.ceil(all.length/maxLines)),period=Math.max(2400,Math.max(3600,text.length*40)*s.vrSubtitleDuration/pages),page=Math.min(pages-1,Math.floor((now-this.captionSince)/period)),rows=all.slice(page*maxLines,(page+1)*maxLines);this.captionPage=page;
  const key=[message,speaker,font,page,s.vrHologramBrightness].join(':');if(key!==this.captionKey||(motion&&now-this.lastCaptionPaint>125)){
   this.captionKey=key;this.lastCaptionPaint=now;this.captionChanged=true;g.fillStyle='#06101c';g.fillRect(0,0,1280,360);drawPanel(g,4,4,1272,352,accent(speaker==='ORI'?UI.cyan:UI.violet,s.vrHologramBrightness),'#0a1624');g.fillStyle='#122b3d';g.fillRect(16,16,112,328);
   if(speaker==='ORI')drawOri(g,22,91,100,motion?(now-this.captionSince)/1000:0,true);else{g.fillStyle=UI.cyan;g.font='600 52px '+UI_FONT;g.fillText(speaker==='WAVE'?'W':'!',49,175);}
   g.fillStyle=speaker==='ORI'?UI.cyan:UI.violet;g.font='600 28px '+UI_FONT;g.fillText(speaker+'  /  '+(speaker==='ORI'?'COMPANION LINK':speaker==='WAVE'?'MICHAEL WAVE':'SIGNAL CHANNEL'),151,48);g.font='500 '+font+'px '+UI_FONT;g.fillStyle=UI.text;rows.forEach((line,i)=>g.fillText(line,151,110+i*lineHeight));drawWave(g,24,301,94,20,motion?(now-this.captionSince)/1000:0,UI.cyan);if(pages>1){g.font='18px '+UI_FONT;g.fillStyle=UI.muted;g.fillText('PAGE '+(page+1)+' / '+pages,1090,337);}
  }
  placeComfortCaption(this.captionAnchor,rig,{...s,level:data.game.level,oriPosition:data.oriPosition,oriVisible:data.oriVisible},this.wristPanel,Math.min(4,rows.length));this.captionPanel=this.captionAnchor.hidden?null:this.captionAnchor;this.captionPlacementMode='comfort';
  if(motion&&this.captionPanel){const phase=this.captionLeaving>=0?Math.min(1,(now-this.captionLeaving)/180):1-Math.min(1,(now-this.captionSince)/180);this.captionPanel.center[1]-=phase*.018;}
 }
 paintLog(data){
  const g=this.g,entries=(data.communications||[]).slice().reverse();
  g.fillStyle=UI.cyan;g.font='600 26px '+UI_FONT;g.fillText('COMMUNICATION LOG',20,85);
  g.font='18px '+UI_FONT;const lines=entries.flatMap(e=>linesFor(g,e.speaker+': '+e.text,710).concat([''])),pages=Math.max(1,Math.ceil(lines.length/12));this.logPage=Math.min(this.logPage,pages-1);
  g.fillStyle=UI.text;(lines.length?lines:['No transmissions yet.']).slice(this.logPage*12,this.logPage*12+12).forEach((line,i)=>g.fillText(line,24,122+i*23));
  this.button(20,444,325,46,'BACK / COMBAT',()=>{this.logOpen=false;this.lastPaint=-Infinity;});
  this.button(365,444,175,46,'NEWER',()=>{this.logPage=Math.max(0,this.logPage-1);this.lastPaint=-Infinity;},{enabled:this.logPage>0});
  this.button(560,444,185,46,'OLDER',()=>{this.logPage=Math.min(pages-1,this.logPage+1);this.lastPaint=-Infinity;},{enabled:this.logPage<pages-1});
 }
 paintArchive(data){
  const g=this.g,ledger=data.archive,records=ledger?.list()||[];
  g.fillStyle=UI.cyan;g.font='600 27px '+UI_FONT;g.fillText('THE HUMAN LEDGER',20,78);
  g.font='16px '+UI_FONT;g.fillStyle=UI.muted;
  g.fillText((ledger?.count||0)+' / '+(ledger?.total||12)+' RECORDS   ·   '+(ledger?.unlocked?.length||0)+' / 3 SEALED DOSSIERS OPEN',20,103);
  const entry=this.archiveSelected?ledger?.find(this.archiveSelected):null;
  if(entry){
   g.fillStyle=UI.gold;g.font='600 22px '+UI_FONT;g.fillText(entry.title.slice(0,52),20,149);
   g.fillStyle=UI.cyan;g.font='14px '+UI_FONT;g.fillText(entry.kind+'  /  '+entry.subject,20,176);
   g.fillStyle=UI.text;g.font='18px '+UI_FONT;
   const lines=linesFor(g,entry.text,710),pages=Math.max(1,Math.ceil(lines.length/10));
   this.archiveDetailPage=Math.min(this.archiveDetailPage,pages-1);
   lines.slice(this.archiveDetailPage*10,(this.archiveDetailPage+1)*10).forEach((line,i)=>g.fillText(line,20,213+i*22));
   g.font='14px '+UI_FONT;g.fillStyle=UI.muted;g.fillText('RECORD PAGE '+(this.archiveDetailPage+1)+' / '+pages,20,432);
   this.button(20,444,210,46,'INDEX',()=>{this.archiveSelected=null;this.archiveDetailPage=0;this.lastPaint=-Infinity;});
   this.button(240,444,150,46,'PREV',()=>{this.archiveDetailPage--;this.lastPaint=-Infinity;},{enabled:this.archiveDetailPage>0});
   this.button(400,444,170,46,'NEXT',()=>{this.archiveDetailPage++;this.lastPaint=-Infinity;},{enabled:this.archiveDetailPage<pages-1});
  }else{
   if(!records.length){g.fillStyle=UI.text;g.font='18px '+UI_FONT;g.fillText('NO RECORDS YET / READ THE PLAQUES ON FACILITY WALLS',20,154);g.fillText('Point at a plaque and press USE. Each testimony is saved.',20,189);}
   const pages=Math.max(1,Math.ceil(records.length/5));this.archivePage=Math.min(this.archivePage,pages-1);
   records.slice(this.archivePage*5,(this.archivePage+1)*5).forEach((record,i)=>{
    const title=(record.type==='dossier'?'[UNSEALED] ':'')+record.title;
    this.button(20,119+i*62,724,53,title.slice(0,47),()=>{this.archiveSelected=record.id;this.archiveDetailPage=0;this.lastPaint=-Infinity;});
   });
   g.fillStyle=UI.muted;g.font='14px '+UI_FONT;g.fillText('INDEX PAGE '+(this.archivePage+1)+' / '+pages,20,431);
   this.button(20,444,210,46,'BACK / COMBAT',()=>{this.archiveOpen=false;this.lastPaint=-Infinity;});
   this.button(240,444,150,46,'PREV',()=>{this.archivePage--;this.lastPaint=-Infinity;},{enabled:this.archivePage>0});
   this.button(400,444,170,46,'NEXT',()=>{this.archivePage++;this.lastPaint=-Infinity;},{enabled:this.archivePage<pages-1});
  }
  this.button(594,444,150,46,this.wrist.pinned?'UNPIN':'PIN LINK',this.statusTarget.action);
 }
 paintAlert(data,rig,s){
  const text=data.alert||(data.game.player.health<20?'CRITICAL HP / FIND COVER':'');this.alertChanged=false;
  if(!text||data.screen){this.alertPanel=null;return;}
  if(text!==this.alertKey){this.alertKey=text;this.alertChanged=true;const g=this.alertG;g.fillStyle='#120f1b';g.fillRect(0,0,768,128);drawPanel(g,3,3,762,122,UI.gold,'#120f1b');g.font='600 32px '+UI_FONT;g.fillStyle=UI.gold;g.fillText(text.slice(0,35),22,77);}
  placeComfortCaption(this.alertAnchor,rig,{...s,alertDock:true,level:data.game.level},this.wristPanel);this.alertPanel=this.alertAnchor.hidden?null:this.alertAnchor;
  if(this.captionPanel&&this.alertPanel&&panelsOverlap(this.captionPanel,this.alertPanel,rig))this.captionPanel=null;
 }
 paint(data,rig,now){const settings={...(rig.settings||{}),...(data.settings||{})},s=equipmentSettings(settings);this.placeWrist(rig,settings,now);this.paintStatus(data.game,s,now);this.paintPanel(data,s,now);this.paintCaption(data,rig,s,now);this.paintAlert(data,rig,s);return this.canvas;}
}
