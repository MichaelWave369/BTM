// Original procedural soundtrack and effects. No samples or network requests.
export class AudioEngine {
  constructor(){this.music=.35;this.sfx=.65;this.muted=false;this.started=false;this.active=false;this.step=0;this.next=0;this.sector=0;}
  start(){
    if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.limiter=this.ctx.createDynamicsCompressor();this.limiter.threshold.value=-10;this.limiter.ratio.value=5;this.limiter.knee.value=12;this.master.connect(this.limiter);this.limiter.connect(this.ctx.destination);this.musicGain=this.ctx.createGain();this.musicGain.connect(this.master);this.sfxGain=this.ctx.createGain();this.sfxGain.connect(this.master);const b=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=b.getChannelData(0);let s=369;for(let i=0;i<data.length;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;data[i]=s/2147483648-1;}this.noiseBuffer=b;this.next=this.ctx.currentTime+.05;this.timer=setInterval(()=>this.schedule(),60);}
    this.ctx.resume().catch(()=>{});this.active=true;this.updateVolumes();
  }
  configure(settings){this.music=settings.music;this.sfx=settings.sfx;this.muted=settings.muted;this.updateVolumes();}
  updateVolumes(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.muted?0:.65,t,.03);this.musicGain.gain.setTargetAtTime(this.music*(this.active?1:.25),t,.05);this.sfxGain.gain.setTargetAtTime(this.sfx,t,.02);}
  pause(value){this.active=!value;this.updateVolumes();}
  tone(freq,duration,type='square',volume=.15,when=0,target=null,music=false){
    if(!this.ctx)return;const t=when||this.ctx.currentTime,o=this.ctx.createOscillator(),a=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(12,freq),t);if(target)o.frequency.exponentialRampToValueAtTime(Math.max(12,target),t+duration);a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(volume,t+.004);a.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(a);a.connect(music?this.musicGain:this.spatialBus||this.sfxGain);o.start(t);o.stop(t+duration+.02);
  }
  noise(duration,volume=.15,when=0,highpass=1000,music=false){
    if(!this.ctx)return;const t=when||this.ctx.currentTime,s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),a=this.ctx.createGain();s.buffer=this.noiseBuffer;f.type='highpass';f.frequency.value=highpass;a.gain.setValueAtTime(volume,t);a.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(a);a.connect(music?this.musicGain:this.spatialBus||this.sfxGain);s.start(t);s.stop(t+duration+.01);
  }
  listener(rig){
    if(!this.ctx||!rig?.headWorld)return;const l=this.ctx.listener,m=rig.headWorld,p=rig.eye,t=this.ctx.currentTime;
    if(l.positionX){for(const [key,value]of [['positionX',p[0]],['positionY',p[1]],['positionZ',p[2]],['forwardX',-m[8]],['forwardY',-m[9]],['forwardZ',-m[10]],['upX',m[4]],['upY',m[5]],['upZ',m[6]]])l[key].setTargetAtTime(value,t,.015);}
    else{l.setPosition?.(...p);l.setOrientation?.(-m[8],-m[9],-m[10],m[4],m[5],m[6]);}
  }
  playAt(name,weapon,position){
    if(!this.ctx||!this.ctx.createPanner||!position||this.spatialVoices>=16){this.play(name,weapon);return;}
    const p=this.ctx.createPanner(),t=this.ctx.currentTime;p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=2;p.maxDistance=40;p.rolloffFactor=.7;const x=position.x*1.6,y=(position.height??.7)*1.6,z=position.y*1.6;
    if(p.positionX){p.positionX.setValueAtTime(x,t);p.positionY.setValueAtTime(y,t);p.positionZ.setValueAtTime(z,t);}else p.setPosition(x,y,z);
    p.connect(this.sfxGain);this.spatialVoices=(this.spatialVoices||0)+1;this.spatialBus=p;try{this.play(name,weapon);}finally{this.spatialBus=null;setTimeout(()=>{p.disconnect();this.spatialVoices--;},2200);}
  }
  schedule(){if(!this.ctx)return;const now=this.ctx.currentTime;if(this.next<now-.2)this.next=now+.03;while(this.next<now+.15){const t=this.next,s=this.step%32,b=s%16;if(this.active){if([0,6,10,16,19,26,30].includes(s))this.tone(135,.19,'sine',.7,t,38,true);if([4,12,20,28,31].includes(s)){this.noise(.13,.22,t,1300,true);this.tone(165,.08,'triangle',.17,t,70,true);}this.noise(b%2?.027:.05,b%2?.04:.08,t,6000,true);const bass=[36,36,48,39,36,43,41,34];if([0,3,6,8,10,14].includes(b)){const note=bass[Math.floor(s/4)%8],hz=440*2**((note-69)/12);this.tone(hz,.16,'sawtooth',.07,t,hz*.98,true);this.tone(hz/2,.19,'sine',.19,t,null,true);}if(s===0||s===16){this.tone(146.83,.8,'triangle',.04,t,null,true);this.tone(220,.7,'triangle',.025,t,null,true);}}this.step++;this.next+=60/138/4;}}
  play(name,weapon=1){if(!this.ctx)return;const now=this.ctx.currentTime;switch(name){
    case 'hit':this.noise(.035,.11,0,1800);this.tone(290,.045,'triangle',.15,0,130);break;
    case 'ricochet':this.tone(1700,.045,'triangle',.035,0,550);break;
    case 'equip':this.noise(.035,.08,0,1900);this.tone(165,.055,'triangle',.09,0,230);break;
    case 'step':this.noise(.045,.045,0,220);this.tone(48,.055,'sine',.045);break;
    case 'oriBolt':this.tone(930,.13,'sine',.14,0,440);this.tone(1400,.06,'triangle',.05);break;
    case 'ambient':this.tone(28+this.sector*3,.9,'sine',.07);this.noise(.45,.025,0,180);break;
    case 'fire': if(weapon===0){this.noise(.09,.3,0,500);this.tone(120,.09,'triangle',.5,0,50);}if(weapon===1){this.tone(630,.1,'sawtooth',.15,0,110);this.tone(130,.06,'sine',.22,0,48);this.noise(.04,.15,0,2200);}if(weapon===2){this.tone(116,.32,'sine',.8,0,29);this.tone(58,.45,'sine',.4,now+.02,26);this.tone(62,.25,'sawtooth',.13,0,26);this.noise(.14,.16,0,200);}if(weapon===3){this.tone(850,.25,'triangle',.25,0,180);this.tone(570,.18,'square',.08,0,120);}if(weapon===4){this.tone(340,.4,'sawtooth',.2,0,32);this.noise(.25,.18,0,900);}if(weapon===5){this.tone(110,.7,'sawtooth',.22,0,880);this.tone(55,.7,'sine',.5);this.noise(.4,.1,0,2000);}break;
    case 'hurt':this.noise(.1,.3,0,400);this.tone(85,.15,'triangle',.25,0,35);break;
    case 'free':for(let i=0;i<4;i++)this.tone([330,440,550,880][i],.2,'triangle',.12,now+i*.055);break;
    case 'pickup':this.tone(700,.09,'square',.1);this.tone(1100,.12,'square',.1,now+.07);break;
    case 'door':this.noise(.5,.14,0,250);this.tone(70,.4,'sawtooth',.1,0,40);break;
    case 'ori':this.tone(500,.35,'sine',.2,0,1400);this.tone(760,.4,'triangle',.1,now+.1,250);break;
    case 'reload':this.noise(.5,.15,0,4000);this.tone(180,.7,'sine',.15,0,500);break;
    case 'vision':this.tone(160,.5,'sine',.3,0,650);break;
    case 'relay':for(let i=0;i<6;i++)this.tone(220+i*110,.15,'triangle',.13,now+i*.05);break;
    case 'destroy':this.noise(.18,.25,0,300);this.tone(140,.2,'sawtooth',.15,0,25);break;
    case 'enemy':this.tone(310,.14,'square',.07,0,80);break;
    case 'alarm':this.tone(440,.6,'square',.1,0,800);break;
    case 'dodge':this.noise(.15,.14,0,3000);break;
    case 'complete':for(let i=0;i<6;i++)this.tone([261,329,392,523,659,784][i],.35,'triangle',.14,now+i*.12);break;
  }}
}
