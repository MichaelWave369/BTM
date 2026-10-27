// Original code-native interface art. No gameplay state or external services.
export const UI=Object.freeze({bg:'#080b21',panel:'#10132e',line:'#394b80',cyan:'#45e7ff',pink:'#ff43b5',violet:'#b389ff',gold:'#ffcd75',text:'#eff4ff',muted:'#a5b4d6',red:'#ff6c82'});
export const UI_FONT='Oxanium, sans-serif';
export const WEAPON_UI=Object.freeze(['#c3c8ee','#45e7ff','#ff43b5','#ffcd75','#b389ff','#fff1d1']);
export function panelPath(g,x,y,w,h,cut=10){g.beginPath();g.moveTo(x+cut,y);g.lineTo(x+w,y);g.lineTo(x+w,y+h-cut);g.lineTo(x+w-cut,y+h);g.lineTo(x,y+h);g.lineTo(x,y+cut);g.closePath();}
export function drawPanel(g,x,y,w,h,color=UI.cyan,fill=UI.panel){panelPath(g,x,y,w,h);g.fillStyle=fill;g.fill();g.strokeStyle=color;g.lineWidth=1;g.stroke();g.fillStyle=color;g.fillRect(x+13,y+3,25,2);}
export function drawOri(g,x=0,y=0,size=100,time=0,active=false){
 g.save();g.translate(x,y);g.scale(size/100,size/100);
 const shell=g.createLinearGradient(10,10,85,88);shell.addColorStop(0,'#f4edff');shell.addColorStop(.28,'#7db8dc');shell.addColorStop(.55,'#3d497b');shell.addColorStop(1,'#d348a2');
 g.fillStyle='#090b23';g.beginPath();g.ellipse(51,92,28,4,0,0,Math.PI*2);g.fill();
 g.strokeStyle=active?UI.pink:UI.cyan;g.lineWidth=2;g.beginPath();g.moveTo(18,40);g.lineTo(8,46);g.lineTo(7,62);g.moveTo(82,40);g.lineTo(93,46);g.lineTo(93,61);g.stroke();
 panelPath(g,20,11,62,60,12);g.fillStyle=shell;g.fill();g.strokeStyle=UI.cyan;g.stroke();
 panelPath(g,27,18,48,43,9);g.fillStyle='#060c26';g.fill();g.strokeStyle='#5e77b5';g.stroke();
 g.fillStyle=active?UI.pink:UI.cyan;g.shadowColor=g.fillStyle;g.shadowBlur=active?8:4;
 const blink=Math.floor(time*2)%17===16;g.beginPath();g.ellipse(41,37,4,blink?1:8,0,0,Math.PI*2);g.ellipse(61,37,4,blink?1:8,0,0,Math.PI*2);g.fill();g.shadowBlur=0;
 g.strokeStyle=UI.cyan;g.lineWidth=2;g.beginPath();g.moveTo(45,51);g.quadraticCurveTo(51,55,58,50);g.stroke();
 g.fillStyle=shell;panelPath(g,33,70,37,15,5);g.fill();g.fillStyle=UI.gold;g.fillRect(48,73,6,6);
 g.fillStyle=UI.cyan;g.beginPath();g.moveTo(38,85);g.lineTo(43,96);g.lineTo(48,85);g.moveTo(58,85);g.lineTo(63,96);g.lineTo(67,85);g.fill();g.restore();
}
export function drawWeaponIcon(g,id,x,y,w=64,h=36,unlocked=true){
 g.save();g.translate(x,y);g.scale(w/80,h/44);g.globalAlpha=unlocked?1:.36;
 const c=WEAPON_UI[id];g.fillStyle='#2a3058';g.strokeStyle=c;g.lineWidth=1.4;
 if(id===0){g.fillStyle='#d5a17d';g.beginPath();g.moveTo(28,39);g.lineTo(23,22);g.lineTo(22,8);g.lineTo(27,5);g.lineTo(32,21);g.lineTo(32,3);g.lineTo(37,2);g.lineTo(40,21);g.lineTo(43,5);g.lineTo(48,7);g.lineTo(47,25);g.lineTo(54,15);g.lineTo(58,18);g.lineTo(50,39);g.closePath();g.fill();g.stroke();g.fillStyle='#8d64ba';g.fillRect(27,35,25,7);}
 else{
  g.beginPath();g.moveTo(8,16);g.lineTo(23,8);g.lineTo(60,8);g.lineTo(64,13);g.lineTo(75,13);g.lineTo(75,20);g.lineTo(45,22);g.lineTo(36,39);g.lineTo(26,36);g.lineTo(28,23);g.lineTo(8,24);g.closePath();g.fill();g.stroke();
  g.fillStyle='#8592ba';g.fillRect(14,12,41,3);g.fillStyle=c;g.fillRect(18,18,15,3);g.fillRect(58,12,5,8);
  if(id===2){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(66,16,8,11,0,0,Math.PI*2);g.stroke();}
  if(id===3){g.fillStyle=c;g.fillRect(42,4,24,3);g.fillRect(42,23,24,3);}
  if(id===4){for(let i=0;i<4;i++)g.fillRect(35+i*6,4,3,7+i%2*3);}
  if(id===5){g.strokeStyle=c;g.beginPath();g.ellipse(64,16,10,8,0,0,Math.PI*2);g.stroke();g.fillStyle=c;g.fillRect(16,5,28,3);}
 }g.restore();
}
export function drawWave(g,x,y,w,h,time=0,color=UI.cyan){g.strokeStyle=color;g.lineWidth=2;g.beginPath();for(let i=0;i<=40;i++){const xx=x+i*w/40,yy=y+h/2+Math.sin(i*2.2+time*3)*Math.sin(i*.42)*h*.42;if(!i)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.stroke();}
export function wrapText(g,text,x,y,width,line=24){let row='';for(const word of String(text).split(' ')){if(row&&g.measureText(row+word).width>width){g.fillText(row.trim(),x,y);y+=line;row='';}row+=word+' ';}if(row)g.fillText(row.trim(),x,y);return y;}
