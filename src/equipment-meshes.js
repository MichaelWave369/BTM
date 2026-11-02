import {materialUV} from './level-geometry.js';
import {WEAPONS} from './core.js';
// Original low-poly industrial design. Dimensions are meters; models share the atlas.
export const EQUIPMENT_COLORS=Object.freeze({composite:'#111d2b',rubber:'#070c13',metal:'#566b80',edge:'#9db6c8',cyan:'#48e9ff',magenta:'#ff59c4',amber:'#ffca76',text:'#edf8ff'});
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),C=Object.fromEntries(Object.entries(EQUIPMENT_COLORS).map(([k,v])=>[k,rgb(v)])),whiteUV=materialUV('white'),cache=new Map();
const normal=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
class MeshBuilder{
 constructor(){this.vertices=[];this.lights=[];}
 triangle(a,b,c,color,light=false,shade=1){for(const p of [a,b,c]){this.vertices.push(...p,(whiteUV[0]+whiteUV[2])/2,(whiteUV[1]+whiteUV[3])/2,color[0]*shade,color[1]*shade,color[2]*shade,1);this.lights.push(light?1:0);}}
 quad(a,b,c,d,color,light=false,shade=1){this.triangle(a,b,c,color,light,shade);this.triangle(a,c,d,color,light,shade);}
 box(center,size,color=C.composite,light=false,bevel=.16){
  const [x,y,z]=center,[w,h,d]=size.map(n=>n/2),k=Math.min(w,h)*bevel,xy=[[-w+k,-h],[w-k,-h],[w,-h+k],[w,h-k],[w-k,h],[-w+k,h],[-w,h-k],[-w,-h+k]],a=xy.map(([u,v])=>[x+u,y+v,z-d]),b=xy.map(([u,v])=>[x+u,y+v,z+d]);
  for(let i=0;i<8;i++){const j=(i+1)%8;this.quad(a[i],b[i],b[j],a[j],color,light,[.55,.65,.8,.95,1,.9,.7,.6][i]);this.triangle([x,y,z-d],a[j],a[i],color,light,.84);this.triangle([x,y,z+d],b[i],b[j],color,light,.72);}
 }
 tube(from,to,radius,inner=0,color=C.metal,light=false,sides=8){
  const axis=normal(to.map((v,i)=>v-from[i])),u=normal(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u),point=(p,r,a)=>{const ra=Array.isArray(r)?r[0]:r,rb=Array.isArray(r)?r[1]:r;return p.map((n,i)=>n+u[i]*Math.cos(a)*ra+v[i]*Math.sin(a)*rb);};
  for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides,p=point(from,radius,a),q=point(from,radius,b),r=point(to,radius,b),s=point(to,radius,a);this.quad(p,q,r,s,color,light,.72+.28*Math.max(0,Math.sin(a)));
   if(inner){const pa=point(from,inner,a),pb=point(from,inner,b),pc=point(to,inner,b),pd=point(to,inner,a);this.quad(pa,pd,pc,pb,C.rubber);this.quad(pa,pb,q,p,color,light);this.quad(pd,s,r,pc,color,light);}else{this.triangle(from,q,p,color,light,.7);this.triangle(to,s,r,color,light);}}
 }
 segment(from,to,width,depth,color=C.composite){const axis=normal(to.map((v,i)=>v-from[i])),u=[1,0,0],v=normal(cross(u,axis)),corners=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>p.map((n,i)=>n+u[i]*a*width/2+v[i]*b*depth/2)),a=corners(from),b=corners(to);for(let i=0;i<4;i++){const j=(i+1)%4;this.quad(a[i],a[j],b[j],b[i],color,false,[.55,.8,1,.7][i]);}this.quad(...a,color);this.quad(...b,color);}
 finish(label){return Object.freeze({label,data:new Float32Array(this.vertices),lights:new Uint8Array(this.lights),vertexCount:this.lights.length});}
}
function styleColors(style){return style==='neon'?{body:rgb('#192038'),trim:C.edge,accent:C.magenta,second:C.cyan}:style==='tactical'?{body:rgb('#141b20'),trim:rgb('#52616b'),accent:rgb('#71bfc5'),second:C.metal}:{body:C.composite,trim:C.metal,accent:C.cyan,second:C.magenta};}
export function handMesh(side='left',style='combat',pose='relaxed',detail=8){
 const key='hand:'+side+':'+style+':'+pose+':'+detail;if(cache.has(key))return cache.get(key);const b=new MeshBuilder(),s=side==='left'?1:-1,p=styleColors(style),curl=pose==='grip'?.85:pose==='point'?.18:pose==='palm'?.055:.4;
 // Palm and overlapping sleeve connect every finger to the forearm coupling.
 b.box([0,-.002,.002],[.076,.031,.087],C.rubber);b.box([0,.012,.005],[.066,.021,.071],p.body);b.box([0,.025,.008],[.043,.008,.049],pose==='palm'?C.rubber:p.trim);
 // The left watch hand has real palm-side pads and open, near-straight
 // fingers. Unlike the weapon hand it is not a clenched trigger grip.
 if(side==='left'&&pose==='palm'){
  b.box([0,.031,-.004],[.053,.004,.056],p.trim,false,.35);
  for(let i=0;i<4;i++)b.box([-.027+i*.018,.028,-.046],[.013,.004,.017],p.second,false,.3);
 }
 b.box([0,-.002,.064],[.071,.043,.055],C.rubber,false,.6);b.box([0,0,.108],[.079,.048,.077],p.body,false,.6);b.tube([0,0,.139],[0,0,.158],[.0425,.0265],[.033,.0185],p.trim,false,detail);b.box([0,.029,.097],[.071,.014,.057],p.trim);b.box([0,.037,.097],[.061,.006,.045],C.rubber);
 for(const x of [-.032,.032])b.box([x,.024,.102],[.004,.005,.057],p.accent,true);for(let i=0;i<3;i++)b.box([-.012+i*.012,.028,.018],[.005,.003,.023],p.second,true);
 const lengths=[[.026,.023,.017],[.029,.025,.018],[.027,.023,.017],[.022,.02,.015]];
 for(let i=0;i<4;i++){const x=-.027+i*.018;let at=[x,-.001,-.039];b.box([x,.018,-.038],[.017,.012,.023],p.trim);
  for(let j=0;j<3;j++){const angle=curl*(j+1)*.65,len=lengths[side==='left'?3-i:i][j],next=[x,at[1]-Math.sin(angle)*len,at[2]-Math.cos(angle)*len];b.segment(at,next,j===0?.016:.014,j===2?.014:.018,j===1?C.rubber:p.body);b.tube([x-.008,at[1],at[2]],[x+.008,at[1],at[2]],.009,0,p.trim,false,detail);if(j===0&&style!=='tactical')b.box([x,at[1]+.009,at[2]-.008],[.009,.003,.009],p.accent,true);at=next;}}
 const thumb=[[s*.033,-.004,-.009],[s*.053,-.012,-.027],[s*.052,-.028,-.045],[s*.038,-.039,-.053]];for(let i=0;i<3;i++){b.segment(thumb[i],thumb[i+1],.022-i*.002,.019,p.body);b.tube(thumb[i],thumb[i+1],.008,0,C.rubber,false,detail);}b.box([s*.034,.009,-.012],[.022,.014,.026],p.trim);
 return cache.set(key,b.finish(key)).get(key);
}
export const WEAPON_PRESENTATION=Object.freeze([{name:'WAKE-UP SLAP',role:'Palm impulse gauntlet',width:.10,length:.14},{name:'RESONANCE BLASTER',role:'Compact resonance sidearm',width:.074,length:.34},{name:'BASS CANNON',role:'Wide acoustic emitter',width:.15,length:.34},{name:'Φ PULSE RIFLE',role:'Linear pulse accelerator',width:.084,length:.34},{name:'ALTERMATH DISRUPTOR',role:'Forked field disruptor',width:.14,length:.34},{name:'THE UNPLUGGER',role:'Heavy liberation lance',width:.138,length:.34}]);
export function weaponMesh(id,detail=8){
 const key='weapon:'+id+':'+detail;if(cache.has(key))return cache.get(key);const b=new MeshBuilder(),accent=rgb(WEAPONS[id].color),metal=C.metal;
 if(id===0){b.box([0,.03,-.043],[.091,.018,.045],metal);for(let i=0;i<4;i++)b.box([-.031+i*.021,.043,-.053],[.015,.009,.024],accent,true);b.box([0,.025,.035],[.055,.018,.027],C.composite);b.tube([0,.032,-.035],[0,.048,-.035],.019,.012,accent,true,detail);}
 else{
  b.box([0,-.026,.014],[.044,.081,.052],C.rubber);b.box([0,-.022,.012],[.047,.062,.04],metal);b.box([0,-.055,-.014],[.058,.012,.057],C.composite);b.box([0,-.043,-.042],[.063,.007,.036],metal);
  if(id===1){b.box([0,.018,-.112],[.069,.064,.19],C.composite);b.box([0,.054,-.102],[.051,.012,.17],metal);b.tube([0,.006,-.18],[0,0,-.329],.019,.010,metal,false,detail);b.tube([0,0,-.326],[0,0,-.34],.023,.013,accent,true,detail);for(const x of [-.036,.036])b.box([x,.022,-.11],[.004,.01,.102],accent,true);b.box([0,.065,-.063],[.009,.012,.025],C.edge);}
  else if(id===2){b.box([0,.017,-.132],[.126,.083,.205],C.composite);b.box([0,.064,-.12],[.077,.016,.155],metal);b.tube([0,.005,-.19],[0,0,-.32],.068,.05,metal,false,detail);b.tube([0,0,-.318],[0,0,-.34],.075,.055,accent,true,detail);b.tube([0,0,-.308],[0,0,-.314],.046,0,C.rubber,false,detail);for(let i=0;i<3;i++)b.box([0,.058,-.065-i*.053],[.11,.009,.016],accent,true);}
  else if(id===3){b.box([0,.017,-.135],[.057,.061,.244],C.composite);b.box([0,.055,-.15],[.051,.01,.225],metal);b.tube([0,.005,-.2],[0,0,-.34],.017,.01,metal,false,detail);for(const x of [-.034,.034])for(let i=0;i<3;i++){b.box([x,.022,-.085-i*.065],[.017,.04,.035],metal);b.box([x,.025,-.085-i*.065],[.019,.012,.023],accent,true);}b.tube([0,0,-.333],[0,0,-.34],.021,.01,accent,true,detail);}
  else if(id===4){b.box([0,.017,-.105],[.101,.066,.16],C.composite);for(const side of [-1,1]){b.box([side*.052,.006,-.234],[.025,.041,.211],metal);b.box([side*.052,.027,-.231],[.014,.006,.19],accent,true);b.box([side*.052,0,-.326],[.036,.054,.026],C.composite);}b.tube([-.039,.022,-.148],[.039,.022,-.148],.019,.01,accent,true,detail);b.box([0,.058,-.08],[.067,.012,.061],metal);}
  else{b.box([0,.026,-.13],[.123,.088,.23],C.composite);b.box([0,.076,-.125],[.085,.016,.195],metal);for(const side of [-1,1]){b.box([side*.058,.021,-.216],[.021,.05,.234],metal);b.box([side*.058,.051,-.21],[.008,.006,.21],accent,true);for(let i=0;i<4;i++)b.box([side*.065,.013,-.063-i*.035],[.008,.046,.014],C.rubber);}b.tube([0,0,-.23],[0,0,-.34],.043,.027,metal,false,detail);b.tube([0,0,-.329],[0,0,-.34],.048,.031,accent,true,detail);b.box([0,.03,-.076],[.059,.051,.063],accent,true);b.box([0,.062,-.073],[.049,.006,.043],C.rubber);}
 }
 return cache.set(key,b.finish(key)).get(key);
}
// Original Φ369 pocket drone. Cached mesh; the entire silhouette is <25cm.
export function oriMesh(state='idle',detail=8){
 const key='ori:'+state+':'+detail;if(cache.has(key))return cache.get(key);
 const b=new MeshBuilder(),eye=state==='low'?C.amber:state==='assist'?C.magenta:C.cyan;
 b.tube([0,0,-.05],[0,0,.045],.082,0,C.composite,false,detail);
 b.tube([0,0,.042],[0,0,.053],.065,.052,C.edge,false,detail);
 b.tube([0,0,.049],[0,0,.056],.049,0,C.rubber,false,detail);
 b.tube([0,.008,.056],[0,.008,.059],.033,.025,eye,true,detail);
 b.box([0,.008,.061],[.008,.081,.004],eye,true);
 for(const side of [-1,1]){
  b.box([side*.092,-.006,0],[.034,.065,.07],C.metal);
  b.tube([side*.092,-.039,0],[side*.092,-.05,0],.012,0,eye,true,6);
  b.box([side*.092,.003,.039],[.019,.009,.004],eye,true);
 }
 for(let i=0;i<4;i++)b.box([-.018+i*.012,-.046,.064],[.005,.012,.004],C.edge);
 b.box([.035,.09,-.012],[.004,.045,.004],C.metal);
 b.box([.035,.115,-.012],[.011,.009,.011],eye,true);
 // Three-six-nine identity ticks, no borrowed logos or textures.
 for(let i=0;i<3;i++)b.box([-.026+i*.026,.058,.049],[.007,.006,.006],C.amber,true);
 if(state==='scan')b.box([0,.03,.063],[.073,.004,.003],C.magenta,true);
 return cache.set(key,b.finish(key)).get(key);
}
// No per-frame geometry allocation: append cached vertices to the existing batch.
export function appendEquipment(batch,mesh,matrix,brightness=.85,pulse=0){
 const d=batch.data,source=mesh.data;if(batch.length+source.length>d.length){batch.dropped++;return false;}let n=batch.length;
 for(let i=0;i<source.length;i+=9){const x=source[i],y=source[i+1],z=source[i+2],gain=mesh.lights[i/9]?brightness*(1+Math.min(.3,pulse)*.6):1;d[n++]=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];d[n++]=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];d[n++]=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];d[n++]=source[i+3];d[n++]=source[i+4];d[n++]=source[i+5]*gain;d[n++]=source[i+6]*gain;d[n++]=source[i+7]*gain;d[n++]=1;}batch.length=n;return true;
}
