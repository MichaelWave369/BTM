// Input policy is testable without a browser. Success comes from pointerlockchange.
export function keyCode(event){
  if(event.code&&event.code!=='Unidentified')return event.code;
  const key=event.key||'';if(/^[a-z]$/i.test(key))return 'Key'+key.toUpperCase();if(/^[0-9]$/.test(key))return 'Digit'+key;
  return ({' ':'Space',Esc:'Escape',Control:'ControlLeft',Shift:'ShiftLeft'})[key]||key;
}
export class PointerCapture {
  constructor({request,onState=()=>{},onLost=()=>{},setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}){this.request=request;this.onState=onState;this.onLost=onLost;this.setTimer=setTimer;this.clearTimer=clearTimer;this.state='idle';this.timer=null;this.intentional=false;}
  change(state){this.state=state;this.onState(state);}
  clear(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;}
  async capture(){if(this.state==='pending'||this.state==='locked')return false;this.intentional=false;this.change('pending');this.timer=this.setTimer(()=>{if(this.state==='pending')this.denied();},1200);try{await this.request();return this.state!=='fallback';}catch{this.denied();return false;}}
  denied(){this.clear();if(this.state!=='locked')this.change('fallback');}
  lockChange(locked){const previous=this.state;this.clear();if(locked){this.change('locked');this.intentional=false;}else{this.change(previous==='pending'?'fallback':'idle');if(previous==='locked'&&!this.intentional)this.onLost();this.intentional=false;}}
  release(){this.intentional=true;this.clear();if(this.state!=='locked')this.change('idle');}
}
