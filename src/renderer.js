import {playerSprite,finaleSprite} from './net/presentation.js';
import {castRay,distance,angleDiff,findRoute,SECTORS,WEAPONS,clamp} from './core.js';
import {pitBossSprite,pitFloorState} from './pit-presentation.js';
import {paintSignalSurface} from './neon-signal.js';
import {UI,UI_FONT} from './arcade-ui.js';
import {makeAssets,makeSign} from './assets.js';
export class Renderer {
  constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});this.assets=makeAssets();this.setResolution(640);this.particles=[];this.beams=[];this.ghosts=[];this.hitMarker=0;this.finisher=0;this.bassFlash=0;this.damageFlash=0;this.lastTime=0;this.signTextures=new Map();}
  setResolution(width){this.canvas.width=width;this.canvas.height=Math.round(width*9/16);this.depth=new Float32Array(width);this.g.imageSmoothingEnabled=false;}
  event(e){if(['burst','liberation','hit','telegraph','impact','oriAssist'].includes(e.type)){const n=e.count??(e.type==='liberation'?30:e.type==='oriAssist'?18:10),color=e.color??(e.type==='liberation'?'#b9ff53':e.type==='oriAssist'?'#5df6ec':'#ffbc82');for(let i=0;i<n;i++){const a=i/n*Math.PI*2;this.particles.push({x:e.x,y:e.y,z:.25+(i%5)*.11,vx:Math.cos(a)*.8,vy:Math.sin(a)*.8,vz:.4+(i%3)*.5,life:e.type==='liberation'?1.1:.45,max:e.type==='liberation'?1.1:.45,color});}}if(e.type==='hit'&&e.source!=='ori'){this.hitMarker=.17;this.finisher=e.finisher?.3:0;}if(e.type==='liberation')this.ghosts.push({...e,life:.85});if(e.type==='beam')this.beams.push({...e,life:e.ori?.24:.12});if(e.type==='bass')this.bassFlash=.7;this.particles=this.particles.slice(-500);this.beams=this.beams.slice(-24);}
  draw(game,dt,settings,{demo=false,map=false}={}){
    const g=this.g,w=this.canvas.width,h=this.canvas.height,p=game.player,l=game.level;this.lastTime+=dt;this.finisher=Math.max(0,this.finisher-dt);this.reducedMotion=settings.reducedMotion;
    if(this.drawLevel!==l){this.drawLevel=l;this.levelTextures=this.assets.textures;if(l.palette)this.levelTextures=Object.fromEntries(Object.entries(this.assets.textures).map(([key,tex])=>{const i=Number(key);if(i<1||i>3)return [key,tex];const c=document.createElement('canvas');c.width=c.height=64;paintSignalSurface(c.getContext('2d'),'wall',l.palette,tex);return [key,c];}));this.signTextures=new Map((l.signs||[]).map(sign=>[`${sign.x},${sign.y}`,makeSign(sign,this.levelTextures[l.cells[sign.y][sign.x]]||this.levelTextures[1])]));this.particles=[];this.beams=[];this.ghosts=[];}
    if(demo){p.a=-Math.PI/2+Math.sin(this.lastTime*.12)*.15;}
    const bob=!settings.reducedMotion&&game.moving&&game.mode==='playing'?Math.sin(game.time*(game.sprinting?15:10))*h*.008:0,horizon=Math.floor(h*.46+bob),theme=game.definition.color;
    g.fillStyle=game.shift?'#0e1126':'#090f10';g.fillRect(0,0,w,horizon);g.fillStyle=game.shift?'#171323':'#19201e';g.fillRect(0,horizon,w,h-horizon);
    // Perspective floor grid, rendered as horizontal scan bands and converging seams.
    const grad=g.createLinearGradient(0,horizon,0,h);grad.addColorStop(0,'#090e0e');grad.addColorStop(1,game.levelIndex===1?'#29232e':'#29312a');g.fillStyle=grad;g.fillRect(0,horizon,w,h-horizon);
    const dirX=Math.cos(p.a),dirY=Math.sin(p.a),planeX=-dirY*.70,planeY=dirX*.70;
    g.strokeStyle=game.shift?'#3c2b50':'#354139';g.lineWidth=1;
    for(let j=1;j<11;j++){const yy=horizon+(h-horizon)/(j*.62+1);g.globalAlpha=.22;g.beginPath();g.moveTo(0,Math.floor(yy));g.lineTo(w,Math.floor(yy));g.stroke();}g.globalAlpha=1;
    for(let j=-5;j<=5;j++){g.globalAlpha=.12;g.beginPath();g.moveTo(w/2+j*10,horizon);g.lineTo(w/2+j*w*.27,h);g.stroke();}g.globalAlpha=1;
    const textures=this.levelTextures||this.assets.textures;
    const stripe=w>=640?2:1;
    for(let x=0;x<w;x+=stripe){
      const camera=2*x/w-1,dx=dirX+planeX*camera,dy=dirY+planeY*camera,hit=castRay(l,p.x,p.y,dx,dy,32),d=Math.max(.08,hit.distance);
      for(let xx=x;xx<Math.min(w,x+stripe);xx++)this.depth[xx]=d;const wallH=Math.min(h*20,h/d),y=Math.round(horizon-wallH*.5),tex=this.signTextures.get(`${hit.x},${hit.y}`)||textures[hit.type]||textures[1];
      let tx=Math.floor(hit.u*64);if(hit.side===0&&dx>0||hit.side===1&&dy<0)tx=63-tx;
      const door=l.doors[`${hit.x},${hit.y}`],opening=door?.open||0,visibleH=wallH*(1-opening);
      if(opening>.01){const behind=castRay(l,p.x,p.y,dx,dy,32,hit),bh=h/Math.max(.08,behind.distance),bt=textures[behind.type]||textures[1];g.drawImage(bt,Math.floor(behind.u*63),0,1,64,x,horizon-bh*.5,stripe,bh);g.fillStyle=`rgba(3,9,10,${clamp(behind.distance/19,0,.9)})`;g.fillRect(x,horizon-bh*.5,stripe,bh);g.drawImage(tex,tx,opening*64,1,64*(1-opening),x,y,stripe,visibleH);}else g.drawImage(tex,tx,0,1,64,x,y,stripe,Math.ceil(wallH));
      const shade=clamp(d/(game.levelIndex===4?15:19)+(hit.side?.12:0),0,.92);g.fillStyle=`rgba(3,9,10,${shade})`;g.fillRect(x,y,stripe,visibleH+1);
      if(game.levelIndex>=3){g.fillStyle=game.levelIndex===3?'rgba(90,35,4,.065)':game.levelIndex===5?'rgba(80,6,37,.075)':'rgba(13,24,75,.09)';g.fillRect(x,y,stripe,wallH);}
      if(hit.type===6&&game.shift){g.fillStyle=`rgba(187,127,255,${.28+Math.sin(this.lastTime*5)*.12})`;g.fillRect(x,y,stripe,wallH);}
      if(game.shift&&hit.type!==6){g.fillStyle='rgba(71,24,114,.12)';g.fillRect(x,y,stripe,wallH);}
      // Ceiling trim reinforces the industrial corridor silhouette.
      if(d<14){g.fillStyle=game.levelIndex===1?'#786181':theme;g.globalAlpha=Math.max(0,.42-d*.025);g.fillRect(x,y+wallH*.035,stripe,Math.max(1,wallH*.008));g.globalAlpha=1;}
    }
    const things=[];
    for(const prop of l.props||[])things.push(prop);
    for(const e of l.enemies)if(!e.dead)things.push({x:e.x,y:e.y,type:e.type,height:e.type==='warden'?1.65:1,frame:Math.floor(e.walk)%4,e});
    for(const item of l.items)if(!item.taken)things.push({...item,height:.5,bob:true});
    for(const captive of l.captives)if(!captive.freed)things.push({...captive,type:'captive',height:1});
    for(const relay of l.relays)things.push({...relay,type:relay.active?'relayOn':'relay',height:1});
    if(!l.key.taken)things.push({...l.key,type:'key',height:.48,bob:true});
    if(!game.networkCompetitive)things.push({...l.exit,type:'portal',height:1.6});
    for(const a of game.remotePlayers||[])if(['alive','downed'].includes(a.status))things.push({x:a.renderX??a.x,y:a.renderY??a.y,type:'remote',remote:a,height:a.status==='downed'?.4:1.03});
    for(const b of game.projectiles)things.push({...b,type:'projectile',height:.18});
    things.sort((a,b)=>distance(b,p)-distance(a,p));
    if(l.hazards){for(const hazard of l.hazards)this.pitFloor(hazard,game,horizon,pitFloorState(hazard,game.time));for(const b of l.blasts)this.pitFloor(b,game,horizon,b.hit?'active':'warning');}
    for(const node of l.raidNodes||[])this.pitFloor({...node,radius:.65},game,horizon,'warning');
    for(const o of things)this.sprite(o,game,horizon);
    for(const ghost of this.ghosts){ghost.life-=dt;const pos=this.project(ghost,p);if(pos&&pos.depth<this.depth[clamp(Math.floor(pos.x),0,w-1)]){const height=h/pos.depth,width=height*.5;g.globalAlpha=Math.max(0,ghost.life)*.65;g.drawImage(this.assets.sprites.captive,pos.x-width/2,horizon-height*.55-(.85-ghost.life)*height*.5,width,height);g.globalAlpha=1;}}this.ghosts=this.ghosts.filter(s=>s.life>0);
    // World-space tracer endpoints and liberated-mind particles.
    for(const beam of this.beams){beam.life-=dt;const to=this.project(beam.to,p);if(to&&to.depth<this.depth[clamp(Math.floor(to.x),0,w-1)]+.4){g.strokeStyle=beam.color;g.globalAlpha=Math.min(1,beam.life/.12);g.lineWidth=beam.ori?2:game.weapon===5?4:1;g.beginPath();const oriPosition=this.project(game.ori,p),from=beam.ori?{x:clamp(oriPosition?.x||w*.8,w*.35,w*.9),y:h*.42}:distance(beam.from,p)<.9?{x:w*.55,y:h*.73}:this.project(beam.from,p);if(from){g.moveTo(from.x,from.y??horizon);g.lineTo(to.x,horizon);g.stroke();}g.globalAlpha=1;}}
    this.beams=this.beams.filter(b=>b.life>0);
    for(const pt of this.particles){pt.life-=dt;pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.z+=pt.vz*dt;pt.vz-=dt*.7;const s=this.project(pt,p);if(s&&s.depth<this.depth[clamp(Math.floor(s.x),0,w-1)]+.2){g.fillStyle=pt.color;g.globalAlpha=clamp(pt.life/pt.max,0,1);const size=Math.max(1,3/s.depth);g.fillRect(s.x,horizon+(0.5-pt.z)*h/s.depth,size,size);g.globalAlpha=1;}}this.particles=this.particles.filter(p=>p.life>0);
    if(!demo){
      this.weapon(game,settings,bob);
      // Ori lives in the player's near field; the floating eye is always visible.
      const orb=this.assets.sprites.ori,os=w*(game.assistTime>0?.078:.063),projected=this.project(game.ori,p),ox=(game.netState?w*.84:clamp(projected?.x||w*.82,w*.35,w*.89))-os/2,oy=h*.43+(settings.reducedMotion?0:Math.sin(this.lastTime*2.4)*h*.018);g.globalAlpha=game.player.ori<30?.5:1;g.drawImage(orb,ox,oy,os,os);g.globalAlpha=1;
      g.fillStyle='#7ae6df';g.font=`${Math.max(6,w/100)}px monospace`;g.fillText(game.assistTime>0?'ORI / ASSIST':'ORI',ox,oy-4);
      if((game.assistTime>0||game.scanTime>0)&&!settings.reducedMotion){g.strokeStyle='#7af5da';g.globalAlpha=.6;g.beginPath();g.arc(ox+os/2,oy+os/2,os*(.5+(1-game.assistTime)*.4),0,Math.PI*2);g.stroke();g.globalAlpha=1;}
      // Precision crosshair.
      const cx=w/2,cy=horizon,gap=3+game.shotAnim*4;g.strokeStyle=game.shift?'#c59aff':'#d7eec5';g.lineWidth=1;g.globalAlpha=.85;g.beginPath();g.moveTo(cx-gap-5,cy);g.lineTo(cx-gap,cy);g.moveTo(cx+gap,cy);g.lineTo(cx+gap+5,cy);g.moveTo(cx,cy-gap-5);g.lineTo(cx,cy-gap);g.moveTo(cx,cy+gap);g.lineTo(cx,cy+gap+5);g.stroke();g.globalAlpha=1;
      if(this.hitMarker>0){this.hitMarker-=dt;g.strokeStyle=this.finisher?'#fff1ad':'#b9ff53';g.lineWidth=this.finisher?3:2;g.beginPath();for(const [dx,dy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){g.moveTo(cx+dx*5,cy+dy*5);g.lineTo(cx+dx*11,cy+dy*11);}g.stroke();if(this.finisher){g.fillStyle='#fff1ad';g.font='7px monospace';g.textAlign='center';g.fillText('LINK BROKEN',cx,cy+23);g.textAlign='left';}}
      if(game.objectiveTime>0){const target=game.objectiveTarget,offset=angleDiff(Math.atan2(target.y-p.y,target.x-p.x),p.a),xx=clamp(w/2+offset*w*.33,w*.24,w*.76);g.fillStyle='#5df6ec';g.font=`bold ${Math.max(7,w/80)}px monospace`;g.textAlign='center';g.fillText((offset<-.8?'◀ ':offset>.8?'▶ ':'◈ ')+(target.label||'THE WARDEN')+' / '+Math.round(distance(p,target))+'m',xx,h*.23);g.textAlign='left';}
      if(game.charge>.02){g.fillStyle='#16281d';g.fillRect(w*.44,h*.68,w*.12,3);g.fillStyle=WEAPONS[game.weapon].color;g.fillRect(w*.44,h*.68,w*.12*game.charge,3);g.font='6px monospace';g.textAlign='center';g.fillText('CHARGE / RELEASE',w*.5,h*.68-4);g.textAlign='left';}
    }
    if(game.hurt>0&&!demo){g.fillStyle=`rgba(192,38,53,${Math.min(.25,game.hurt*.28)})`;g.fillRect(0,0,w,h);}
    if(game.hurt>0&&game.damageDirection!==null&&!demo){const a=angleDiff(game.damageDirection,p.a),cx=w/2+Math.sin(a)*w*.24,cy=h*.46-Math.cos(a)*h*.25;g.fillStyle='#ff927b';g.beginPath();g.moveTo(cx,cy-5);g.lineTo(cx-5,cy+4);g.lineTo(cx+5,cy+4);g.fill();}
    if(this.bassFlash>0){this.bassFlash-=dt;if(!settings.reducedMotion){g.strokeStyle=`rgba(189,139,255,${this.bassFlash*.8})`;g.lineWidth=8;g.beginPath();g.arc(w/2,horizon,(.75-this.bassFlash)*w,0,Math.PI*2);g.stroke();}}
    if(game.shift){g.fillStyle='rgba(134,76,220,.055)';g.fillRect(0,0,w,h);g.strokeStyle='#ad7ce2';g.lineWidth=2;g.strokeRect(6,6,w-12,h-12);}
    // In-canvas vignette keeps the scene readable under every UI overlay.
    const vignette=g.createRadialGradient(w/2,h/2,w*.1,w/2,h/2,w*.63);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.58)');g.fillStyle=vignette;g.fillRect(0,0,w,h);
    if(map)this.drawMap(game,true);
    else if(!demo&&!settings.externalMap)this.drawMap(game,false);
  }
  pitFloor(o,game,horizon,state){const p=this.project(o,game.player),g=this.g,w=this.canvas.width,h=this.canvas.height;if(!p||p.depth>=this.depth[clamp(Math.floor(p.x),0,w-1)]||p.x<0||p.x>w)return;const r=Math.min(w*.5,o.radius*w/(p.depth*1.4)),y=horizon+h/(2*p.depth),ry=Math.max(2,r*.22);g.strokeStyle=state==='warning'?'#ffce73':game.definition.color;g.fillStyle=state==='active'?game.definition.color:'#10131e';g.globalAlpha=state==='active'?.65:state==='warning'?.8:.3;g.beginPath();g.moveTo(p.x-r,y);g.lineTo(p.x,y-ry);g.lineTo(p.x+r,y);g.lineTo(p.x,y+ry);g.closePath();g.fill();g.stroke();g.globalAlpha=1;}
  project(o,p){const dx=o.x-p.x,dy=o.y-p.y,forward=dx*Math.cos(p.a)+dy*Math.sin(p.a);if(forward<=.12)return null;const side=-dx*Math.sin(p.a)+dy*Math.cos(p.a);return {x:this.canvas.width/2*(1+side/(forward*.70)),depth:forward,y:this.canvas.height*.46};}
  sprite(o,game,horizon){
    const g=this.g,w=this.canvas.width,h=this.canvas.height,p=game.player,s=this.project(o,p);if(!s||s.x< -w||s.x>w*2)return;const height=Math.min(h*5,h/s.depth*o.height),width=o.e?.raidRole==='core'?height*4:o.type==='warden'?height:height*(o.type==='relay'||o.type==='relayOn'?.8:1),x=Math.floor(s.x-width/2),y=Math.floor(horizon+h/(2*s.depth)-height+(o.bob?Math.sin(this.lastTime*3+o.x)*h*.04/s.depth:0));
    if(o.type==='portal'){
      for(let xx=Math.max(0,x);xx<Math.min(w,x+width);xx++){if(s.depth>=this.depth[xx])continue;const f=(xx-x)/width-.5,curve=Math.sqrt(Math.max(0,1-4*f*f)),yy=height/2*curve;g.fillStyle=game.exitReady?'#64e8cd':'#614279';g.globalAlpha=.75;g.fillRect(xx,y+height/2-yy,1,yy*2);g.fillStyle='#091d25';g.globalAlpha=.8;g.fillRect(xx,y+height/2-yy*.82,1,yy*1.64);g.fillStyle=game.exitReady?'#b9ff53':'#bc89e8';g.globalAlpha=.4;for(let k=0;k<6;k++){const py=y+height/2-yy+((this.lastTime*.2+k/6)%1)*yy*2;g.fillRect(xx,py,1,1);}}g.globalAlpha=1;return;
    }
    if(o.type==='projectile'){if(s.depth<this.depth[clamp(Math.floor(s.x),0,w-1)]){g.fillStyle=o.color;g.fillRect(s.x-width/2,horizon-height/2,width,height);g.fillStyle='#fff9d5';g.fillRect(s.x-width/6,horizon-height/6,width/3,height/3);}return;}
    let sprite=o.e?.raidRole?finaleSprite(o.e.raidRole,o.e.exposed>0):o.remote?playerSprite(o.remote.team,o.remote.status==='downed'):o.e?.pitBoss?pitBossSprite(o.e.pitBoss,o.e.exposed>0):o.e?.pain>0?this.assets.pain[o.type]:this.assets.sprites[o.type];if(Array.isArray(sprite))sprite=sprite[o.frame??0];if(!sprite)return;
    const recoil=this.reducedMotion?0:o.e?.recoil||0,lean=recoil*height*.3,tell=!this.reducedMotion&&o.e?.tell>0?Math.sin(this.lastTime*20)*height*.015:0;
    for(let xx=Math.max(0,x);xx<Math.min(w,x+width);xx++)if(s.depth<this.depth[xx]){const tx=clamp(Math.floor((xx-x)/width*sprite.width),0,sprite.width-1);g.drawImage(sprite,tx,0,1,sprite.height,xx+tell,y+lean,1,height-lean);}
    // Telegraphs and health bars are drawn only when their world position is visible.
    const center=clamp(Math.floor(s.x),0,w-1);if(o.remote&&s.depth<this.depth[center]){g.fillStyle=o.remote.team==='pink'?'#ff718e':'#80e8d4';g.font=`${clamp(height*.12,7,12)}px monospace`;g.textAlign='center';g.fillText(o.remote.nickname.slice(0,20)+' / '+Math.ceil(o.remote.health),s.x,y-8);g.textAlign='left';if(o.remote.shotAnim>0){const size=clamp(height*.1,2,9);g.fillStyle=WEAPONS[o.remote.weapon].color;g.fillRect(s.x+width*.37,y+height*.61,size,size);}}if(o.e&&s.depth<this.depth[center]+.4){if(o.e.tell>0){g.fillStyle='#ffac7b';g.font=`bold ${clamp(height*.18,8,38)}px monospace`;g.textAlign='center';g.fillText('!',s.x,y-4);g.textAlign='left';}if(o.e.stun>0){g.fillStyle='#5df6ec';g.fillRect(s.x-7,y-6,14,2);}if(o.e.hp<o.e.maxHp&&s.depth<10){const bw=Math.min(40,height*.7);g.fillStyle='#17171a';g.fillRect(s.x-bw/2,y-12,bw,3);g.fillStyle=o.type==='warden'?'#ffb86b':'#b9ff53';g.fillRect(s.x-bw/2,y-12,bw*o.e.hp/o.e.maxHp,3);}if(o.e.flash>0){g.globalAlpha=.15;g.fillStyle='#e9ffc7';g.fillRect(s.x-width*.2,y+height*.2,width*.4,height*.5);g.globalAlpha=1;}}
  }
  weapon(game,settings,bob){
    const g=this.g,w=this.canvas.width,h=this.canvas.height,k=w/640,id=game.weapon,fire=game.shotAnim,color=WEAPONS[id].color;
    g.save();const recoil=settings.reducedMotion?0:Math.sin(fire*Math.PI*.65)*[10,13,31,16,24,35][id]*k,equip=Math.max(0,game.equipAnim||0)/.24;
    g.translate(w*.55+(settings.reducedMotion?0:Math.sin(game.time*6)*bob*1.6),h+recoil+(Math.max(0,game.vent)*45+equip*55)*k);g.scale(k,k);if(!settings.reducedMotion)g.rotate((id===2?-.035:id===4?.025:-.012)*fire);
    if(id===0){const slap=settings.reducedMotion?fire*14:Math.sin(fire*Math.PI*.8)*66;g.rotate(-slap*.003);g.fillStyle='#402d25';g.fillRect(15-slap,-72-slap,65,90);g.fillStyle='#a87e57';g.fillRect(4-slap,-106-slap,54,55);g.fillStyle='#d7ad78';g.fillRect(3-slap,-115-slap,38,50);for(let i=0;i<4;i++)g.fillRect(4+i*10-slap,-144+i*3-slap,8,45);g.fillStyle='#eccb9a';g.fillRect(4-slap,-137-slap,4,57);g.fillStyle='#8b66b4';g.fillRect(14-slap,-69-slap,55,12);}
    else{
      // Hand-built, layered original weapon silhouettes.
      g.fillStyle='#182222';g.beginPath();g.moveTo(-68,7);g.lineTo(-53,-60);g.lineTo(-27,-100);g.lineTo(25,-104);g.lineTo(60,-60);g.lineTo(79,7);g.closePath();g.fill();
      g.fillStyle='#565e57';g.beginPath();g.moveTo(-52,8);g.lineTo(-41,-62);g.lineTo(-21,-92);g.lineTo(22,-92);g.lineTo(46,-58);g.lineTo(59,8);g.fill();
      g.fillStyle='#87917a';g.beginPath();g.moveTo(-38,-54);g.lineTo(-18,-83);g.lineTo(20,-83);g.lineTo(39,-52);g.fill();g.fillStyle='#293b34';g.fillRect(-37,-48,75,48);g.fillStyle='#111c1a';g.fillRect(-16,-80,34,72);g.fillStyle='#5b6b5b';g.fillRect(-14,-78,5,60);
      if(id===1){g.fillStyle='#202b29';g.fillRect(-20,-131,40,62);g.fillStyle='#71806b';g.fillRect(-16,-127,32,44);g.fillStyle='#0b1a18';g.fillRect(-10,-133,20,22);g.fillStyle=color;g.fillRect(-7,-130,14,12);g.fillStyle='#b8d891';g.fillRect(-13,-104,3,21);g.fillRect(10,-104,3,21);}
      if(id===2){g.fillStyle='#342b46';g.fillRect(-49,-119,98,58);g.fillStyle='#9f90b2';g.fillRect(-44,-116,88,11);g.fillStyle='#141e24';g.beginPath();g.ellipse(0,-113,36,23,0,0,Math.PI*2);g.fill();g.strokeStyle=color;g.lineWidth=5;g.stroke();g.lineWidth=3;g.beginPath();g.ellipse(0,-113,19,12,0,0,Math.PI*2);g.stroke();g.fillStyle='#c89cff';g.fillRect(-3,-118,6,10);g.fillStyle=color;g.fillRect(-43,-85,9,20);g.fillRect(34,-85,9,20);}
      if(id===3){g.fillStyle='#796b44';g.fillRect(-26,-136,52,62);g.fillStyle='#2b302b';g.fillRect(-18,-130,36,42);g.fillStyle=color;g.fillRect(-3,-145,6,56);g.fillRect(-24,-137,5,48);g.fillRect(19,-137,5,48);g.font='bold 24px serif';g.fillText('Φ',-8,-37);}
      if(id===4){g.fillStyle='#31454d';g.fillRect(-38,-115,76,46);g.fillStyle='#192a33';g.fillRect(-31,-137,62,35);g.fillStyle=color;for(let i=0;i<5;i++){g.fillRect(-27+i*12,-132+(i%2)*10,5,33);}g.fillRect(-36,-88,72,5);}
      if(id===5){g.fillStyle='#424351';g.fillRect(-47,-118,94,55);g.fillStyle='#c6c8a8';g.fillRect(-40,-123,80,10);g.fillStyle='#111c26';g.fillRect(-31,-112,62,40);g.strokeStyle='#ffe4a3';g.lineWidth=4;g.beginPath();g.ellipse(0,-112,24,13,0,0,Math.PI*2);g.stroke();g.fillStyle='#f9f8cf';g.fillRect(-5,-118,10,12);}
      g.fillStyle=color;g.fillRect(-28,-42,8,21);g.fillRect(23,-42,8,21);g.fillStyle='#a2b48e';g.fillRect(-34,-9,70,4);g.fillStyle='#d4aa77';g.fillRect(40,-41,18,34);g.fillRect(-51,-41,16,34);g.fillStyle='#262d2d';g.fillRect(42,-10,26,20);g.fillRect(-61,-10,24,20);
      if(game.charge>0){g.strokeStyle=color;g.lineWidth=2;for(let i=0;i<3;i++){g.globalAlpha=game.charge*.7;g.beginPath();g.ellipse(0,-125-i*9,8+game.charge*(12+i*4),4+game.charge*5,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;}
      if(fire>.25){g.fillStyle=color;g.globalAlpha=fire*(settings.reducedMotion?.35:1);if(id===2){g.strokeStyle=color;g.lineWidth=4;g.beginPath();g.ellipse(0,-132-fire*32,30+(1-fire)*55,12+(1-fire)*23,0,0,Math.PI*2);g.stroke();}else if(id===3){g.strokeStyle=color;g.lineWidth=3;g.beginPath();for(let i=0;i<18;i++){const y=-132-i*4,x=Math.sin(i*.7+this.lastTime*10)*(7+i*.3);if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();}else{g.beginPath();g.moveTo(-9,-145);g.lineTo(-26,-163-fire*25);g.lineTo(-9,-158);g.lineTo(0,-187-fire*30);g.lineTo(9,-158);g.lineTo(28,-173-fire*19);g.lineTo(10,-142);g.closePath();g.fill();g.fillStyle='#ffffd5';g.fillRect(-4,-167,8,26);}g.globalAlpha=1;}
    }
    g.restore();
  }
  drawMap(game,full,target=this.g,viewWidth=this.canvas.width,viewHeight=this.canvas.height){
    const g=target,w=viewWidth,h=viewHeight,l=game.level,p=game.player,external=target!==this.g;
    const size=external?Math.min((w-24)/Math.min(16,l.w),(h-24)/Math.min(14,l.h)):full?Math.min(h*.68/l.h,w*.66/l.w):Math.max(1.7,w/290),mw=l.w*size,mh=l.h*size;
    const x0=external?clamp(w/2-p.x*size,w-12-mw,12):full?(w-mw)/2:w-mw-14,y0=external?clamp(h/2-p.y*size,h-12-mh,12):full?(h-mh)/2:24;
    if(external){g.clearRect(0,0,w,h);g.fillStyle=UI.bg;g.fillRect(0,0,w,h);g.save();g.beginPath();g.rect(10,10,w-20,h-20);g.clip();}
    else{g.fillStyle=full?'rgba(8,11,33,.97)':'rgba(8,11,33,.88)';g.fillRect(x0-9,y0-19,mw+18,mh+28);g.strokeStyle=UI.line;g.strokeRect(x0-9,y0-19,mw+18,mh+28);}
    const gap=external?1:.35;
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      if(!l.seen[y*l.w+x])continue;const t=l.cells[y][x];g.fillStyle=t===0?'#142c49':t===6&&game.shift?UI.violet:t===5?UI.gold:t===4?'#65719c':'#41648b';g.fillRect(x0+x*size,y0+y*size,size-gap,size-gap);
    }
    const dot=(o,color,scale=1)=>{if(!l.seen[Math.floor(o.y)*l.w+Math.floor(o.x)]&&!game.objectiveTime)return;g.fillStyle=color;g.fillRect(x0+o.x*size-size*scale/2,y0+o.y*size-size*scale/2,size*scale,size*scale);};
    if(game.objectiveTime>0){const target=game.objectiveTarget,key=`${Math.floor(p.x)},${Math.floor(p.y)}:${target.x},${target.y}:${p.key}:${l.secretFound}`;if(this.routeKey!==key){this.routeKey=key;this.route=findRoute(l,p,target,{allowLocked:p.key});}g.fillStyle=UI.cyan;g.globalAlpha=.7;for(const point of this.route||[])g.fillRect(x0+point.x*size-1,y0+point.y*size-1,2,2);g.globalAlpha=1;}
    l.relays.filter(r=>!r.active).forEach(r=>dot(r,UI.pink,1.4));l.captives.filter(c=>!c.freed).forEach(c=>dot(c,UI.cyan));if(!p.key)dot(l.key,UI.gold);dot(l.exit,game.exitReady?UI.cyan:UI.violet,1.5);if(game.shift)l.enemies.filter(e=>!e.dead).forEach(e=>dot(e,UI.red));
    g.save();g.translate(x0+p.x*size,y0+p.y*size);g.rotate(p.a);g.fillStyle=UI.cyan;g.strokeStyle=UI.text;g.lineWidth=.8;g.beginPath();g.moveTo(size*1.3,0);g.lineTo(-size,-size*.75);g.lineTo(-size*.5,0);g.lineTo(-size,size*.75);g.closePath();g.fill();g.stroke();g.restore();
    if(!external){g.font=`600 ${full?Math.max(9,w/64):6}px ${UI_FONT}`;g.textAlign=full?'center':'left';g.fillStyle=UI.cyan;g.fillText(full?'SECTOR SCAN / '+game.objective:'MAP / TAB',full?w/2:x0,y0-8);if(full){g.fillStyle=UI.muted;g.font=`${Math.max(8,w/80)}px ${UI_FONT}`;g.fillText('CYAN: CAPTIVES   PINK: RELAYS   GOLD: KEY   [ TAB ] CLOSE',w/2,y0+mh+23);}g.textAlign='left';}if(external)g.restore();
  }
}
