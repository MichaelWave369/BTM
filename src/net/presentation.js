const cache=new Map();
export function playerSprite(team='cyan',downed=false){const key=team+downed;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),color=downed?'#ffcc70':team==='pink'?'#ff718e':'#80e8d4';
 const box=(x,y,w,h,v)=>{g.fillStyle=v;g.fillRect(x,y,w,h);};
 box(19,47,10,16,'#52627c');box(35,47,10,16,'#52627c');box(14,22,36,29,'#283b54');box(7,25,10,24,'#637a92');box(47,25,10,24,'#637a92');box(15,29,34,5,color);box(27,27,10,22,color);box(22,4,22,20,'#637a92');box(25,8,16,10,'#0a1426');box(27,10,12,5,color);box(43,37,18,8,'#121e34');box(55,38,8,4,color);if(downed){box(22,25,22,7,'#ffe7ac');box(29,18,7,22,'#ffe7ac');}cache.set(key,c);return c;}
export function finaleSprite(role='core',open=false){const key='raid:'+role+open;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=role==='core'?256:64;c.height=128;const g=c.getContext('2d');const box=(x,y,w,h,v)=>{g.fillStyle=v;g.fillRect(x,y,w,h);};
 if(role==='pylon'){box(15,9,34,111,'#2c334c');box(20,13,24,98,'#a98ec4');box(24,18,16,88,open?'#80e8d4':'#f8d67a');for(let y=20;y<110;y+=18)box(10,y,44,5,'#5e516e');box(5,116,54,10,'#75688c');}
 else{box(12,35,232,69,'#30253e');for(let i=0;i<8;i++){const x=8+i*32,h=70+Math.abs(3.5-i)*10;box(x,126-h,16,h,'#75617c');box(x+4,130-h,8,h-10,'#f8d67a');box(x-3,123-h,22,7,'#bb8dff');}box(82,29,92,77,'#141525');box(91,38,74,60,'#5c496d');box(98,43,60,49,open?'#fff4c8':'#382a4b');box(106,48,44,39,open?'#f8d67a':'#bb8dff');box(121,43,14,50,open?'#fff8e0':'#1b2134');box(104,59,48,14,open?'#fff8e0':'#1b2134');box(44,16,168,8,'#a98ec4');box(110,6,36,15,'#f8d67a');box(39,40,38,6,'#80e8d4');box(180,40,38,6,'#80e8d4');box(85,108,88,10,'#bb8dff');}
 cache.set(key,c);return c;}

// Original Crawler Inversion silhouette: intentionally distinct from a human
// player. No borrowed art, texture downloads, or special rendering dependency.
export function crawlerBeastSprite(){
 const key='inversion:crawler';if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=80;c.height=64;
 const g=c.getContext('2d'),box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 // Broad hunched back, low head, four clawed limbs and unmistakable violet eyes.
 box(18,18,44,29,'#221b33');box(23,13,34,9,'#653c86');
 box(9,28,62,23,'#48305f');box(13,32,54,9,'#8a5cab');
 box(29,9,22,27,'#24192e');box(31,15,18,16,'#6d477f');
 box(32,20,5,5,'#ffcf74');box(43,20,5,5,'#ffcf74');
 box(35,31,10,5,'#1d1422');
 for(const x of [7,61]){
  box(x,33,12,22,'#6b4979');box(x+2,49,8,11,'#282136');
  for(let i=0;i<3;i++){box(x+i*4,57,3,7,'#bfc6ed');}
 }
 box(21,46,11,13,'#322540');box(48,46,11,13,'#322540');
 box(21,56,5,8,'#a187bc');box(54,56,5,8,'#a187bc');
 box(34,35,4,5,'#f1e2a6');box(42,35,4,5,'#f1e2a6');
 cache.set(key,c);return c;
}

// A tall, antenna-crowned original Repeater, visually distinct from the squat
// Crawler. All pixels are generated locally, with no external image assets.
export function repeaterBeastSprite(){
 const key='inversion:repeater';if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=80;c.height=80;
 const g=c.getContext('2d'),box=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 const steel='#172e3b',cyan='#4edbd8',light='#d9fff5',shadow='#102332';
 box(27,55,11,22,steel);box(42,55,11,22,steel);
 box(23,22,34,37,steel);box(28,26,24,25,'#315166');
 box(32,30,16,8,cyan);box(37,32,6,4,light);
 box(28,9,24,17,shadow);box(31,13,18,7,'#315166');
 box(33,15,14,3,light);box(25,4,4,13,cyan);box(51,4,4,13,cyan);
 box(21,8,8,5,light);box(51,8,8,5,light);
 box(13,26,11,28,'#315166');box(56,26,11,28,'#315166');
 box(8,46,18,10,steel);box(54,46,18,10,steel);
 box(5,43,12,6,cyan);box(63,43,12,6,cyan);
 box(9,38,4,6,light);box(67,38,4,6,light);
 box(33,60,5,13,cyan);box(42,60,5,13,cyan);
 box(26,76,16,4,shadow);box(42,76,16,4,shadow);
 cache.set(key,c);return c;
}
