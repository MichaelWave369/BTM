// Original code-native pixel artwork. Replace these factories to use external atlases.
const C=(w=64,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g];};
function seedRandom(seed){let n=seed;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function makeAssets(){
  const textures={};
  for(let type=1;type<=6;type++){
    const [c,g]=C(),r=seedRandom(type*369),base=type===2?'#24202f':type===3?'#13262c':'#242c2b',glow=type===2?'#b17ae7':type===3?'#58e1dc':'#9dde57';
    g.fillStyle=base;g.fillRect(0,0,64,64);
    for(let i=0;i<500;i++){const n=Math.floor(r()*45);g.fillStyle=`rgba(${n+100},${n+115},${n+100},${r()*.1})`;g.fillRect(Math.floor(r()*64),Math.floor(r()*64),1,1);}
    if(type===2){for(let y=0;y<64;y+=16){for(let x=-16;x<64;x+=32){const xx=x+(y%32?16:0);g.fillStyle='#100f19';g.fillRect(xx,y,32,2);g.fillRect(xx,y,2,16);g.fillStyle='#3b3044';g.fillRect(xx+3,y+3,27,1);}}g.fillStyle='#7b5279';g.fillRect(27,20,10,25);g.fillStyle='#171321';g.fillRect(30,22,4,19);g.fillStyle='#c498e6';g.fillRect(31,27,2,8);}
    else if(type===3){g.fillStyle='#071416';for(let y=0;y<64;y+=16)g.fillRect(0,y,64,2);for(let i=0;i<8;i++){const x=5+i*8,y=Math.floor(r()*40);g.strokeStyle=i%2?glow:'#2c5c60';g.beginPath();g.moveTo(x,64);g.lineTo(x,y+8);g.lineTo(x+4,y+4);g.lineTo(x+4,0);g.stroke();g.fillStyle=glow;g.fillRect(x-1,y+10,3,3);}g.fillStyle='#0a171a';g.fillRect(18,20,28,26);g.strokeStyle='#4b7977';g.strokeRect(18,20,28,26);g.fillStyle='#66d9ca';g.font='24px serif';g.fillText('Φ',22,41);}
    else if(type===4||type===5){g.fillStyle='#111a1c';g.fillRect(3,0,58,64);for(let y=0;y<64;y+=8){g.fillStyle=y%16?'#3b4643':'#303936';g.fillRect(6,y+1,52,6);}g.fillStyle='#0b1111';g.fillRect(29,0,6,64);g.fillStyle=type===5?'#ffd26b':'#b9ff53';g.fillRect(25,24,3,16);g.fillRect(36,24,3,16);g.fillStyle='#141717';g.fillRect(2,55,60,8);for(let x=-8;x<64;x+=12){g.fillStyle=type===5?'#c5a052':'#7f8f62';g.beginPath();g.moveTo(x,63);g.lineTo(x+8,55);g.lineTo(x+13,55);g.lineTo(x+5,63);g.fill();}}
    else{g.fillStyle='#0e1818';g.fillRect(0,0,64,3);g.fillRect(0,61,64,3);g.fillRect(0,0,3,64);g.fillRect(61,0,3,64);g.fillStyle='#47534d';g.fillRect(4,4,56,1);g.fillRect(4,4,1,55);g.fillStyle='#111c1c';g.fillRect(9,12,46,35);for(let y=16;y<45;y+=5){g.fillStyle='#283832';g.fillRect(12,y,38,2);}g.fillStyle='#5f7460';for(const [x,y] of [[5,6],[57,6],[5,56],[57,56]])g.fillRect(x,y,2,2);g.fillStyle='#80b548';g.fillRect(2,52,60,2);g.fillStyle='#263c29';g.fillRect(13,16,36,27);g.fillStyle=glow;for(let i=0;i<25;i++)g.fillRect(16+Math.floor(r()*11)*3,19+Math.floor(r()*7)*3,1,2);g.fillStyle='#c6de92';g.font='8px monospace';g.fillText('Φ / 369',13,59);}
    textures[type]=c;
  }
  const sprites={};
  for(const type of ['plugged','repeater','enforcer','crawler','warden']){
    sprites[type]=[];
    for(let frame=0;frame<4;frame++){
      const [c,g]=C(type==='warden'?96:64,type==='warden'?96:64),step=frame%2?2:0;
      if(type==='warden'){
        g.fillStyle='#381e4a';g.beginPath();g.moveTo(48,0);g.lineTo(91,28);g.lineTo(83,79);g.lineTo(48,94);g.lineTo(13,79);g.lineTo(5,28);g.closePath();g.fill();
        g.strokeStyle='#ab6bcb';g.lineWidth=3;g.beginPath();g.moveTo(48,3);g.lineTo(86,29);g.lineTo(78,76);g.lineTo(48,91);g.lineTo(18,76);g.lineTo(10,29);g.closePath();g.stroke();
        g.fillStyle='#1a1a29';g.fillRect(23,20,50,49);g.fillStyle='#897ba0';g.fillRect(28,23,40,8);g.fillRect(23,28,9,28);g.fillRect(64,28,9,28);g.fillRect(32,56,32,13);
        g.fillStyle='#ffd573';g.fillRect(29,36,14,5);g.fillRect(53,36,14,5);g.fillStyle='#ff687f';g.fillRect(35,37,6,3);g.fillRect(55,37,6,3);g.fillStyle='#16141f';g.fillRect(44,40,9,12);g.fillRect(34,60,28,4);g.fillStyle='#b9ff53';g.fillRect(39,76,18,3);
        g.strokeStyle=frame%2?'#ffd573':'#b17ae7';g.lineWidth=2;g.beginPath();g.moveTo(48,8);g.lineTo(48,19);g.moveTo(8,48);g.lineTo(20,48);g.moveTo(76,48);g.lineTo(88,48);g.stroke();
      }else if(type==='crawler'){
        g.strokeStyle='#5c4c89';g.lineWidth=5;for(let i=0;i<3;i++){g.beginPath();g.moveTo(27,39+i*3);g.lineTo(12-i*3,31+i*7+(frame%2?4:0));g.lineTo(5+i*2,57);g.moveTo(37,39+i*3);g.lineTo(52+i*3,31+i*7-(frame%2?4:0));g.lineTo(59-i*2,57);g.stroke();}g.fillStyle='#302c48';g.fillRect(20,29,24,22);g.fillStyle='#a68bc1';g.fillRect(25,24,17,16);g.fillStyle='#5df6ec';g.fillRect(25,29,7,3);g.fillRect(36,29,7,3);g.fillStyle='#111622';g.fillRect(30,39,8,6);
      }else{
        const armored=type==='enforcer',repeater=type==='repeater',s=step;
        g.fillStyle=armored?'#262435':'#1b2422';g.fillRect(22,43,8,17-s);g.fillRect(35,43,8,15+s);g.fillStyle='#11151a';g.fillRect(19,57-s,12,5);g.fillRect(34,56+s,13,5);
        g.fillStyle=armored?'#525567':repeater?'#675071':'#526054';g.fillRect(20,21,25,26);g.fillRect(14,24+s,8,24-s);g.fillRect(44,23-s,8,22+s);
        g.fillStyle=armored?'#858b98':'#a89b7c';g.fillRect(14,45,7,8);g.fillRect(45,42,7,8);g.fillRect(24,4+s,18,18);g.fillRect(21,8+s,4,10);g.fillRect(40,9+s,4,9);
        g.fillStyle=armored?'#272e3b':'#3e3d3b';g.fillRect(23,3+s,20,6);g.fillRect(21,7+s,5,7);g.fillStyle=armored?'#b984ca':'#b9ff53';g.fillRect(25,11+s,6,3);g.fillRect(35,11+s,6,3);g.fillStyle='#1c2021';g.fillRect(29,18+s,9,3);
        g.fillStyle=armored?'#9690a0':'#273b31';g.fillRect(22,24,20,3);g.fillRect(24,29,16,13);g.fillStyle=armored?'#ff6b94':'#8cdd66';g.fillRect(29,31,7,4);g.fillStyle='#1c2224';g.fillRect(21,44,24,4);
        if(armored){g.fillStyle='#787684';g.fillRect(12,21,10,8);g.fillRect(44,21,10,8);g.fillStyle='#292936';g.fillRect(42,40,13,7);g.fillRect(48,35,5,9);g.fillStyle='#ed789f';g.fillRect(52,39,3,3);}
        if(repeater){g.fillStyle='#26332e';g.fillRect(17,1+s,31,22);g.fillStyle='#769f6c';g.fillRect(20,4+s,25,15);g.fillStyle='#111d16';g.fillRect(22,6+s,21,11);g.fillStyle='#b9ff53';g.fillRect(25,8+s,14,2);g.fillRect(25,12+s,9+frame,2);g.fillStyle='#64746b';g.fillRect(30,21+s,6,4);}
        g.strokeStyle='#799d5c';g.lineWidth=2;g.beginPath();g.moveTo(43,11+s);g.lineTo(49,17);g.lineTo(47,31);g.stroke();
      }
      sprites[type].push(c);
    }
  }
  const item=(type)=>{
    const [c,g]=C();g.fillStyle='rgba(0,0,0,.4)';g.fillRect(17,55,30,3);
    if(type==='health'){g.fillStyle='#33403b';g.fillRect(17,27,30,25);g.fillStyle='#bdd0b5';g.fillRect(20,29,24,20);g.fillStyle='#87d8a1';g.fillRect(29,32,6,14);g.fillRect(25,36,14,6);g.fillStyle='#6e8f79';g.fillRect(24,24,16,4);}
    if(type==='energy'){g.fillStyle='#223e43';g.fillRect(23,22,18,30);g.fillStyle='#5df6ec';g.fillRect(27,26,10,20);g.fillStyle='#d1fff1';g.fillRect(29,26,3,20);g.fillStyle='#879e9d';g.fillRect(28,19,8,4);g.fillRect(23,48,18,4);}
    if(type==='armor'){g.fillStyle='#4c536f';g.beginPath();g.moveTo(17,25);g.lineTo(30,29);g.lineTo(47,25);g.lineTo(45,45);g.lineTo(32,55);g.lineTo(19,45);g.fill();g.strokeStyle='#bd9dff';g.lineWidth=3;g.stroke();g.fillStyle='#c3adf0';g.fillRect(30,33,4,13);g.fillRect(26,37,12,4);}
    if(type==='artifact'){g.strokeStyle='#ffd870';g.lineWidth=3;g.beginPath();g.moveTo(32,14);g.lineTo(47,34);g.lineTo(32,54);g.lineTo(17,34);g.closePath();g.stroke();g.fillStyle='#201d2d';g.fill();g.fillStyle='#ffd870';g.font='25px serif';g.fillText('Φ',22,43);}
    if(type==='key'){g.strokeStyle='#ffd870';g.lineWidth=5;g.beginPath();g.arc(25,28,7,0,Math.PI*2);g.moveTo(31,33);g.lineTo(45,47);g.lineTo(50,42);g.moveTo(39,41);g.lineTo(44,36);g.stroke();}
    return c;
  };
  for(const t of ['health','energy','armor','artifact','key'])sprites[t]=item(t);
  for(const active of [false,true]){const [c,g]=C(64,80);g.fillStyle='#1c2d2e';g.fillRect(12,12,40,62);g.fillStyle='#516961';g.fillRect(13,12,38,4);g.fillRect(13,12,3,62);g.fillStyle='#0c1d1a';g.fillRect(19,22,26,30);g.fillStyle=active?'#b9ff53':'#ff8269';g.fillRect(22,26,20,2);g.fillRect(22,32,12,2);g.fillRect(22,38,17,2);g.fillRect(22,44,9,2);g.fillStyle=active?'#b9ff53':'#ffc178';g.fillRect(26,59,13,7);g.fillStyle='#283b35';g.fillRect(8,74,48,5);sprites[active?'relayOn':'relay']=c;}
  {const [c,g]=C();g.fillStyle='#35666c';g.fillRect(21,22,24,28);g.fillStyle='#bcad8a';g.fillRect(26,9,15,15);g.fillStyle='#203436';g.fillRect(25,7,17,7);g.fillStyle='#89e6e1';g.fillRect(28,16,4,2);g.fillRect(36,16,4,2);g.fillStyle='#445653';g.fillRect(24,48,8,13);g.fillRect(36,48,8,13);g.fillStyle='#c3ac8a';g.fillRect(16,19,6,17);g.fillRect(45,19,6,17);g.fillStyle='#5df6ec';g.fillRect(12,3,2,55);g.fillRect(52,3,2,55);g.fillRect(12,3,42,2);g.fillRect(12,57,42,2);sprites.captive=c;}
  {const [c,g]=C();g.strokeStyle='#5df6ec';g.lineWidth=2;g.beginPath();g.moveTo(32,4);g.lineTo(57,32);g.lineTo(32,60);g.lineTo(7,32);g.closePath();g.stroke();g.strokeStyle='#7e9edc';g.beginPath();g.arc(32,32,18,0,Math.PI*2);g.stroke();g.fillStyle='#071b26';g.fillRect(19,25,26,14);g.fillStyle='#dbfff6';g.fillRect(22,29,20,6);g.fillStyle='#5df6ec';g.fillRect(29,25,7,14);g.fillStyle='#041b29';g.fillRect(31,29,3,7);sprites.ori=c;}
  for(const type of ['pod','console','speaker','lamp']){const [c,g]=C(64,80);g.fillStyle='#101b1c';if(type==='pod'){g.fillRect(14,3,36,74);g.fillStyle='#536f63';g.fillRect(11,6,42,6);g.fillRect(11,69,42,7);g.fillStyle='#1c4d3c';g.fillRect(18,15,28,49);g.fillStyle='#56916e';g.fillRect(26,21,13,12);g.fillRect(24,34,17,22);g.fillStyle='#a6ee9a';g.fillRect(20,17,2,45);g.fillRect(43,17,2,45);g.fillStyle='#91c87a';g.fillRect(26,72,12,2);}if(type==='console'){g.fillRect(10,31,45,45);g.fillStyle='#4d6460';g.fillRect(10,29,45,7);g.fillStyle='#071714';g.fillRect(16,5,33,26);g.strokeStyle='#57756a';g.strokeRect(16,5,33,26);g.fillStyle='#9ce472';for(let y=10;y<27;y+=5)g.fillRect(20,y,8+y%13,2);g.fillStyle='#79917c';g.fillRect(14,40,36,9);g.fillStyle='#0f2420';for(let i=0;i<5;i++)g.fillRect(17+i*6,42,3,3);g.fillStyle='#cc986a';g.fillRect(39,57,6,4);}if(type==='speaker'){g.fillStyle='#373846';g.fillRect(12,4,40,73);g.fillStyle='#64616b';g.fillRect(14,6,36,3);g.fillStyle='#111b21';g.beginPath();g.arc(32,27,13,0,Math.PI*2);g.arc(32,58,15,0,Math.PI*2);g.fill();g.strokeStyle='#726080';g.lineWidth=3;g.stroke();g.fillStyle='#bda2d0';g.fillRect(30,25,4,4);g.fillRect(29,55,6,6);}if(type==='lamp'){g.fillStyle='#435854';g.fillRect(29,7,6,65);g.fillRect(18,73,28,5);g.fillStyle='#142522';g.fillRect(21,5,22,12);g.fillStyle='#b8f4bd';g.fillRect(24,8,16,7);g.fillStyle='#628573';g.fillRect(27,18,11,3);}sprites[type]=c;}
  const pain={};for(const type of ['plugged','repeater','enforcer','crawler','warden'])pain[type]=sprites[type].map(source=>{const [c,g]=C(source.width,source.height);g.drawImage(source,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=type==='warden'?'rgba(255,218,161,.65)':'rgba(213,255,185,.72)';g.fillRect(0,0,c.width,c.height);return c;});
  return {textures,sprites,pain};
}
export function makeSign(sign,base){
  const [c,g]=C();g.drawImage(base,0,0);g.fillStyle='#0c1918';g.fillRect(5,9,54,45);g.strokeStyle='#6d8b69';g.strokeRect(5,9,54,45);g.fillStyle='#d0b775';g.fillRect(8,12,48,2);g.font='bold 7px monospace';g.fillStyle='#d5edc4';let y=26;const words=sign.title.split(' ');let line='';for(const word of words){if(g.measureText(line+word).width>49){g.fillText(line.trim(),8,y);line='';y+=8;}line+=word+' ';}g.fillText(line.trim(),8,y);g.font='5px monospace';g.fillStyle='#8aa881';g.fillText(sign.subtitle.slice(0,17),8,46);g.fillStyle='#b9ff53';g.fillRect(8,49,3,2);g.fillStyle='#60845b';g.fillRect(14,49,39,1);return c;
}
export function drawPortrait(g,hurt=false,time=0,state={}){
  const mood=state.mood||(hurt?'OUCH':'FOCUSED'),critical=(state.health??100)<30,look=Math.round(Math.sin(time*.45)*1.3),mouth=mood==='BROOO'?8:mood==='GRIN'?4:mood==='FIRING'?3:2;
  g.clearRect(0,0,64,64);g.fillStyle=critical?'#37152f':'#141531';g.fillRect(0,0,64,64);g.fillStyle='#272444';g.fillRect(5,53,54,12);g.fillStyle='#e37ec5';g.fillRect(10,57,8,2);g.fillRect(48,57,6,2);g.fillStyle='#835b43';g.fillRect(26,42,15,15);g.fillStyle='#bf9066';g.fillRect(18+look,13,30,32);g.fillRect(15+look,24,5,13);g.fillRect(48+look,24,4,13);g.fillStyle='#dfb887';g.fillRect(23+look,18,19,21);
  g.fillStyle='#4b3329';g.fillRect(18,4,29,10);g.fillRect(12,10,40,9);g.fillRect(13,16,8,18);g.fillRect(45,16,8,19);g.fillRect(11,23,5,16);g.fillRect(50,25,4,16);g.fillStyle='#80513a';g.fillRect(17,9,7,3);g.fillRect(30,5,9,3);g.fillRect(44,12,4,6);
  g.fillStyle='#8f74d9';g.fillRect(16,17,34,5);g.fillStyle='#8deaff';g.fillRect(31,17,3,5);g.fillStyle='#422e28';g.fillRect(21+look,24,10,2);g.fillRect(36+look,24+(mood==='GRIN'?-2:0),9,2);
  g.fillStyle='#101832';g.fillRect(19+look,27,13,7);g.fillRect(34+look,27,13,7);g.fillRect(31+look,29,4,2);g.fillStyle=mood==='CHARGING'?'#ffe4a3':critical?'#e8a47d':'#f671ce';g.fillRect(22+look,28,8,3);g.fillRect(36+look,28,8,3);g.fillStyle='#623866';g.fillRect(26+look,28,2,3);g.fillRect(39+look,28,2,3);
  if(mood==='OUCH'||Math.floor(time*4)%23===0){g.fillStyle='#101832';g.fillRect(20+look,28,26,3);}g.fillStyle='#966a4b';g.fillRect(32+look,31,4,9);g.fillStyle='#573d2d';g.fillRect(21+look,38,25,9);g.fillRect(25+look,46,17,5);g.fillStyle='#342622';g.fillRect(26+look,40,15,mouth);g.fillStyle='#ecdbaf';g.fillRect(27+look,40,13,mood==='BROOO'?2:mouth);if(mood==='BROOO'){g.fillStyle='#b67861';g.fillRect(30+look,46,7,2);}if(mood==='GRIN'){g.fillStyle='#c39765';g.fillRect(24+look,38,3,2);g.fillRect(40+look,37,3,2);}if(critical){g.fillStyle='#8e5450';g.fillRect(19+look,35,5,2);g.fillRect(45+look,32,3,6);}if(hurt){g.fillStyle='rgba(255,80,90,.16)';g.fillRect(0,0,64,64);}g.fillStyle='#13132c';g.fillRect(25,53,17,6);g.fillStyle='#45e7ff';g.font='9px serif';g.fillText('Φ',30,60);
}
