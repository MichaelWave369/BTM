/** Optional presentation-only speech. Game dialogue order remains authoritative. */
export class Communications{
 constructor({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}){
  this.synth=synth;this.Utterance=Utterance;this.log=[];this.queue=[];this.unlocked=false;this.active=null;this.epoch=0;this.settings={};this.fallback='Speech off';
 }
 configure(settings={}){this.settings=settings;if(!settings.spokenDialogue||settings.muted)this.cancel();}
 unlock(){this.unlocked=true;}
 record(text,speaker='FIELD',priority=1){
  const entry={text:String(text),speaker,priority};this.log.push(entry);if(this.log.length>100)this.log.shift();
  if(!this.settings.spokenDialogue||this.settings.muted)return;
  if(!this.unlocked||!this.synth||!this.Utterance){this.fallback='Speech unavailable / read the communication log';return;}
  if(this.queue.length<6)this.queue.push(entry);this.pump();
 }
 pump(){
  if(this.active||!this.queue.length)return;
  // Prefer a device-local voice. Availability and offline support are browser dependent.
  let voices;try{voices=this.synth.getVoices();}catch{this.fail();return;}
  const voice=voices.find(v=>v.localService&&/^en\b/i.test(v.lang))||voices.find(v=>v.localService);
  if(!voice){this.fail();return;}
  const entry=this.queue.shift(),epoch=this.epoch;
  try{
   const utterance=new this.Utterance(entry.text);utterance.voice=voice;utterance.volume=Math.max(0,Math.min(1,this.settings.speechVolume??.7));utterance.rate=1;
   this.active=utterance;this.remaining=Math.min(45,3+entry.text.length*.09);this.fallback='Device voice';
   utterance.onend=()=>{if(this.epoch!==epoch)return;this.active=null;this.pump();};
   utterance.onerror=()=>{if(this.epoch===epoch)this.fail();};
   this.synth.speak(utterance);
  }catch{this.fail();}
 }
 tick(dt){if(this.active){this.remaining-=Math.max(0,dt);if(this.remaining<=0)this.fail();}}
 fail(){this.cancel();this.fallback='Speech unavailable / read the communication log';}
 cancel(){this.epoch++;this.queue.length=0;this.active=null;try{this.synth?.cancel();}catch{/* Captions/log remain available. */}}
 reset(){this.cancel();this.log.length=0;}
}

/** Brief safety-critical copy for the independent peripheral alert dock. */
export function criticalMessage(event,health=100){
 if(/warden charge/i.test(event.text||''))return 'WARDEN CHARGE / STRAFE NOW';
 if(event.priority<3)return '';
 if(health<20)return 'CRITICAL HP / FIND COVER';
 if(health<35)return 'LOW HEALTH / FIND COVER';
 if(/behind you/i.test(event.text||''))return 'BEHIND YOU / BREAK SIGHT';
 return 'ORI / CHECK COMMS LOG';
}
