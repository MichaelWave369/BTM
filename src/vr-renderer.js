import {identity,multiply,modelMatrix,perspective,panelPlacement} from './vr-math.js';
import {VR_CONTROLS} from './vr-input.js';
import {UI,UI_FONT,drawPanel,drawOri,wrapText} from './arcade-ui.js';
const W=1024,H=768;
function text(ctx,value,x,y,max=82){ctx.fillText(String(value).slice(0,max),x,y);}
export class VRPanel {
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=W;this.canvas.height=H;this.g=this.canvas.getContext('2d',{alpha:false});this.targets=[];}
 targetAt(hit){return hit&&this.targets.find(t=>hit.u*W>=t.x&&hit.u*W<=t.x+t.w&&hit.v*H>=t.y&&hit.v*H<=t.y+t.h);}
 paint({game,scene,screen,items=[],focused,activate,dialogue='',toast='',immersive=false,settings={}},cursor){
  const g=this.g;g.fillStyle=UI.bg;g.fillRect(0,0,W,H);g.imageSmoothingEnabled=false;g.drawImage(scene,0,0,W,576);this.targets=[];
  const button=(x,y,w,h,label,action,selected=false)=>{drawPanel(g,x,y,w,h,selected?UI.pink:'#62729d',selected?'#602051':'#18233e');g.fillStyle=selected?'#fff1fb':UI.text;g.font=`600 19px ${UI_FONT}`;text(g,label,x+14,y+h/2+6,75);this.targets.push({x,y,w,h,action});};
  g.fillStyle=UI.bg;g.fillRect(0,576,W,H-576);g.fillStyle=UI.pink;g.fillRect(0,576,400,2);g.fillStyle=UI.cyan;g.fillRect(400,576,624,2);
  drawPanel(g,12,590,293,47,UI.pink);drawPanel(g,315,590,293,47,UI.cyan);drawPanel(g,618,590,394,47,UI.violet);
  g.font=`600 22px ${UI_FONT}`;g.fillStyle=UI.pink;text(g,'HEALTH '+Math.ceil(game.player.health),26,621);g.fillStyle=UI.cyan;text(g,'ARMOR '+Math.ceil(game.player.armor),329,621);g.fillStyle=UI.violet;text(g,'E '+Math.floor(game.player.energy)+(game.survival?' / RES '+Math.floor(game.player.reserve):' / ORI '+Math.floor(game.player.ori)),632,621);
  g.fillStyle=UI.cyan;g.font=`600 18px ${UI_FONT}`;text(g,(game.networkLabel|| (game.campaign==='pit'?'PIT / TRIAL ':'SECTOR ')+String(game.levelIndex+1).padStart(2,'0')+'/12')+'   /   '+game.objective,24,659,86);
  g.fillStyle=UI.text;g.font=`18px ${UI_FONT}`;text(g,(settings.captions===false?'':dialogue)||toast||game.interactionHint().replace('[ E ]','[ R GRIP ]'),24,687,92);
  if(!screen){const actions=[['PAUSE','pause'],[game.survival?'RELOAD':'VENT','reload'],['ORI','ori'],[game.survival?'DASH':'DODGE','dodge'],['VISION','vision'],['MAP','map'],['BASS','bass'],['CENTER','recenter']];actions.filter(([,action])=>!(game.networkCompetitive&&['ori','bass'].includes(action))&&!(game.oriCorrupted&&action==='ori')).forEach(([label,action],i)=>button(12+i*126,704,118,49,label,()=>activate(action)));}
  else{
   drawPanel(g,16,15,992,550,UI.cyan,'#0e122bf9');g.fillStyle=UI.cyan;g.font=`600 18px ${UI_FONT}`;text(g,'MICHAEL WAVE & ORI / '+(immersive?'IMMERSIVE WORLD':'VR ARCADE'),40,48);
   g.fillStyle=UI.pink;g.font=`600 31px ${UI_FONT}`;const titles={'title-screen':'BREAK THE MATRIX / 12 SECTORS','pause-screen':'SIGNAL PAUSED','result-screen':game.mode==='dead'?'SIGNAL LOST / RETRY':game.campaign==='pit'?'PIT / '+(game.mode==='ending'?'TWELVE TRIALS CLEARED':'TRIAL CLEARED'):game.levelIndex===11?'THE FREQUENCY IS YOURS':'SECTOR LIBERATED','settings-screen':'TUNE YOUR FREQUENCY','help-screen':'QUEST / VR FIELD MANUAL'};text(g,game.netState?(game.netState.state==='ending'?'THE SIGNAL IS FREE / SQUAD ESCAPED':'BBS LAN CLAN / '+game.netState.state.toUpperCase()):titles[screen]||screen,40,92,52);
   if(game.netState?.state==='ending'){g.fillStyle=UI.gold;g.font=`16px ${UI_FONT}`;text(g,'24 STAGES / FOUR PHASES / THE LINK IS OURS AGAIN. EVERY VOICE STILL ITS OWN.',40,116,100);}
   if(screen==='help-screen'){g.font=`18px ${UI_FONT}`;VR_CONTROLS.slice(0,9).forEach(([a,b],i)=>{g.fillStyle=i%2?UI.muted:UI.text;text(g,a+'  /  '+b,40,128+i*25,86);});}
   if(game.netState){g.fillStyle=UI.gold;g.font=`15px ${UI_FONT}`;text(g,game.netState.code+' / '+game.netState.roster.map(a=>a.nickname+':'+(a.connected?(a.ready?'READY':a.status):'HELD')).join(' / '),40,522,110);}
   let selected=items.indexOf(focused);if(selected<0)selected=0;const capacity=screen==='help-screen'?3:6,start=Math.floor(selected/capacity)*capacity,y0=screen==='help-screen'?377:125;
   items.slice(start,start+capacity).forEach((el,i)=>{let label=(el.classList.contains('arcade-choice')?el.querySelector('b')?.textContent:el.textContent).trim().replace(/\s+/g,' ');if(el.matches('input,select')){label=(el.closest('label')?.childNodes[0]?.textContent||el.getAttribute('aria-label')||el.id).trim()+': '+(el.type==='checkbox'?(el.checked?'ON':'OFF'):el.matches('select')?el.selectedOptions[0]?.textContent:el.value);}button(40,y0+i*61,944,51,label,()=>{activate('focus',el);if(!el.matches('input[type=range],select'))el.click();},items.indexOf(el)===selected);});
   g.fillStyle=UI.muted;g.font=`16px ${UI_FONT}`;text(g,'LS: SELECT / ADJUST · R TRIGGER: CONFIRM · R STICK CLICK: PAUSE',40,544,95);
  }
  if(cursor){g.strokeStyle=UI.gold;g.lineWidth=3;g.beginPath();g.arc(cursor.u*W,cursor.v*H,9,0,Math.PI*2);g.stroke();g.lineWidth=1;}
  return this.canvas;
 }
}
export class ArcadeGL {
 constructor(canvas=document.createElement('canvas'),{defer=false}={}){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false});if(!this.gl)throw Error('WebGL is unavailable.');if(!defer)this.initialize();}
 initialize(){
  const gl=this.gl,shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'VR shader failed');return s;};
  const vs=shader(gl.VERTEX_SHADER,'attribute vec3 p;attribute vec2 uv;uniform mat4 m;varying vec2 t;void main(){t=uv;gl_Position=m*vec4(p,1.0);}'),fs=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 t;uniform sampler2D image;uniform vec4 color;uniform float textured;void main(){gl_FragColor=mix(color,texture2D(image,t),textured);}');
  this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('VR shader link failed');gl.deleteShader(vs);gl.deleteShader(fs);
  this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,0,0,1,.5,-.5,0,1,1,-.5,.5,0,0,0,-.5,.5,0,0,0,.5,-.5,0,1,1,.5,.5,0,1,0]),gl.STATIC_DRAW);
  this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  this.p=gl.getAttribLocation(this.program,'p');this.uv=gl.getAttribLocation(this.program,'uv');this.m=gl.getUniformLocation(this.program,'m');this.color=gl.getUniformLocation(this.program,'color');this.textured=gl.getUniformLocation(this.program,'textured');this.sampler=gl.getUniformLocation(this.program,'image');
 }
 upload(canvas){const gl=this.gl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);}
 drawQuad(vp,model,color,texture=false){const gl=this.gl;gl.uniformMatrix4fv(this.m,false,multiply(vp,model));gl.uniform4fv(this.color,color);gl.uniform1f(this.textured,texture?1:0);gl.drawArrays(gl.TRIANGLES,0,6);}
 render(views,panel,framebuffer=null,{clear=true,floor=true,frame=true,depth=true}={}){
  const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.disable(gl.SCISSOR_TEST);if(depth)gl.enable(gl.DEPTH_TEST);else gl.disable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.025,.025,.075,1);if(clear)gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.p);gl.vertexAttribPointer(this.p,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(this.uv);gl.vertexAttribPointer(this.uv,2,gl.FLOAT,false,20,12);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.sampler,0);
  for(const view of views){gl.viewport(view.viewport.x,view.viewport.y,view.viewport.width,view.viewport.height);const vp=multiply(view.projectionMatrix,view.transform.inverse.matrix);
   if(floor)for(let i=-5;i<=5;i++){const floor={right:[1,0,0],up:[0,0,1],normal:[0,1,0],center:[panel.center[0]+i*.7,panel.center[1]-1.35,panel.center[2]],width:.012,height:12};this.drawQuad(vp,modelMatrix(floor),[.12,.07,.24,1]);floor.right=[0,0,1];floor.up=[1,0,0];floor.center=[panel.center[0],panel.center[1]-1.35,panel.center[2]+i*.7];this.drawQuad(vp,modelMatrix(floor),[.12,.07,.24,1]);}
   const border={...panel,center:panel.center.map((v,i)=>v-panel.normal[i]*.015),width:panel.width+.07,height:panel.height+.07};if(frame)this.drawQuad(vp,modelMatrix(border),[.3,.73,.9,1]);this.drawQuad(vp,modelMatrix(panel),[1,1,1,1],true);
  }
 }
 preview(canvas){this.upload(canvas);const head=identity();head[13]=1.6;this.render([{viewport:{x:0,y:0,width:this.canvas.width,height:this.canvas.height},projectionMatrix:perspective(Math.PI/2,this.canvas.width/this.canvas.height),transform:{inverse:{matrix:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,-1.6,0,1])}}}],panelPlacement(head,2.5,2.8));return this.gl.getError()===this.gl.NO_ERROR;}
 dispose(){const g=this.gl;g.deleteTexture(this.texture);g.deleteBuffer(this.buffer);g.deleteProgram(this.program);}
}
