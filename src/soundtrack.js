// First-party BTM album. MP3s are optional/lazy and never part of the boot cache.
// Filenames are deliberately identical to the supplied original 18-track ZIP.
export const TRACKS=Object.freeze([
  [1,'Wake Up Runner','01-Wake Up Runner.mp3',166.4],
  [2,'The First Crack','02-The First Crack.mp3',227.7],
  [3,'Ghost In the Circuit','03-Ghost In the Circuit.mp3',217.0],
  [4,'Phantom Protocol','04-Phantom Protocol.mp3',170.7],
  [5,'System Breach','05-System Breach.mp3',167.2],
  [6,'Firewall Zero','06-Firewall Zero.mp3',151.1],
  [7,'No Gods in the Machine','07-No Gods in the Machine.mp3',187.8],
  [8,'False Prophet Protocol','08-False Prophet Protocol.mp3',213.1],
  [9,'Pit of Despair','09-Pit of Despair.mp3',136.8],
  [10,'There is No Exit','10-There is No Exit.mp3',144.3],
  [11,'Last Life Last Round','11- Last Life Last Round.mp3',172.9],
  [12,'Zero Respawns Left','12-Zero Respawns Left.mp3',114.0],
  [13,'BBS LAN Clan','13-BBS LAN Clan.mp3',137.4],
  [14,'Frag the System','14-Frag the System.mp3',177.7],
  [15,'Break the Matrix','15-Break the Matrix.mp3',189.9],
  [16,'We Are the Glitch','16-We Are the Glitch.mp3',177.4],
  [17,'The Final Frequency','17-The Final Frequency.mp3',207.0],
  [18,'System Collapse','18-System Collapse.mp3',172.7]
].map(([id,title,file,duration])=>Object.freeze({id,title,file,duration,artist:'michaelwave369'}))));
const ORIGINAL=[1,2,3,4,5,6,7,8,3,4,7,16];
const PIT=[9,10,11,12,9,10,11,12,10,11,12,16];
export function soundtrackCue(cue={}){
  const stage=Math.max(0,Math.min(23,Math.floor(Number(cue.stage)||0)));
  switch(cue.kind){
    case 'title':return 15;
    case 'lobby':return 13;
    case 'arena':return cue.mode==='clan'?12:cue.mode==='team'?14:cue.arena==='the-kill-switch'?16:13;
    case 'raid':return cue.finished?18:17;
    case 'ending':return 18;
    case 'pit':return cue.boss?([11,12,16,17][Math.floor(stage/3)%4]):PIT[stage%12];
    case 'coop':return stage>=12?soundtrackCue({kind:'pit',stage:stage-12,boss:cue.boss}):soundtrackCue({kind:'original',stage,boss:cue.boss});
    case 'original':return cue.boss?([7,8,15,16][Math.floor(stage/3)%4]):ORIGINAL[stage%12];
    default:return 15;
  }
}
export function albumFileURL(track,base){
  if(!track||!/^\d\d-[^/\\]+\.mp3$/i.test(track.file))throw Error('Invalid local soundtrack filename');
  return new URL('./music/'+encodeURIComponent(track.file),base).href;
}
const validChoice=value=>value==='auto'||value==='album'||TRACKS.some(track=>String(track.id)===String(value));
export class SoundtrackDeck {
  constructor(engine){
    this.engine=engine;this.mode='album';this.choice='auto';this.cue={kind:'title'};
    this.current=null;this.pending=null;this.status='awaiting gesture';this.unavailable=false;this.serial=0;this.albumIndex=1;
  }
  get playing(){return !!this.current&&!this.current.media.paused&&!this.current.disposed;}
  get label(){return this.current?this.current.track.title:this.status;}
  configure(settings={}){
    const mode=settings.soundtrackMode==='procedural'?'procedural':'album';
    const choice=validChoice(settings.soundtrackTrack)?String(settings.soundtrackTrack):'auto';
    if(this.mode===mode&&this.choice===choice)return;
    const oldMode=this.mode,oldChoice=this.choice;
    this.mode=mode;this.choice=choice;
    if(this.current)this.current.media.loop=choice!=='album';
    if(this.pending)this.pending.media.loop=choice!=='album';
    if(oldChoice!==choice&&choice==='album')this.albumIndex=1;
    if(mode==='procedural'){this.stop();this.status='procedural synthesizer';return;}
    if(oldMode!==mode||oldChoice!==choice)this.sync();
  }
  setCue(cue={}){this.cue=cue;if(this.choice==='auto')this.sync();}
  target(){return this.choice==='auto'?soundtrackCue(this.cue):this.choice==='album'?this.albumIndex:Number(this.choice);}
  start(){this.sync();}
  next(){
    const id=this.current?.track.id||this.target();
    this.albumIndex=id===18?1:id+1;
    this.choice='album';this.sync();
    return this.albumIndex;
  }
  stop(){
    this.serial++;if(this.pending)this.dispose(this.pending);if(this.current)this.dispose(this.current);
    this.pending=null;this.current=null;
  }
  dispose(entry){
    if(!entry||entry.disposed)return;entry.disposed=true;
    try{entry.media.pause();entry.media.removeAttribute('src');entry.media.load();}catch{}
    try{entry.source.disconnect();entry.gain.disconnect();}catch{}
  }
  sync(){
    if(this.mode!=='album'||this.unavailable||!this.engine.ctx)return;
    const track=TRACKS[this.target()-1];if(!track)return;
    if(this.current?.track.id===track.id||this.pending?.track.id===track.id)return;
    if(typeof Audio!=='function'||typeof this.engine.ctx.createMediaElementSource!=='function'){
      this.unavailable=true;this.status='procedural fallback';return;
    }
    const serial=++this.serial,media=new Audio();
    media.preload='auto';media.loop=this.choice!=='album';
    media.src=albumFileURL(track,typeof document==='undefined'?'https://example.invalid/':document.baseURI);
    let source,gain;
    try{
      source=this.engine.ctx.createMediaElementSource(media);gain=this.engine.ctx.createGain();
      gain.gain.value=0;source.connect(gain);gain.connect(this.engine.musicGain);
    }catch{
      media.removeAttribute('src');this.unavailable=true;this.status='procedural fallback';return;
    }
    const entry={track,media,source,gain,disposed:false};
    if(this.pending)this.dispose(this.pending);
    this.pending=entry;this.status='loading '+track.title;
    media.addEventListener('playing',()=>{
      if(this.pending!==entry||serial!==this.serial)return;
      this.pending=null;const previous=this.current;this.current=entry;this.status='playing '+track.title;
      const t=this.engine.ctx.currentTime;
      gain.gain.setTargetAtTime(1,t,.12);
      if(previous){previous.gain.gain.setTargetAtTime(0,t,.12);setTimeout(()=>this.dispose(previous),750);}
    });
    media.addEventListener('error',()=>{
      if(entry.disposed||this.current!==entry&&this.pending!==entry)return;
      this.unavailable=true;this.stop();this.status='MP3 unavailable: procedural fallback';
    });
    media.addEventListener('ended',()=>{
      if(this.current!==entry||this.choice!=='album')return;
      this.albumIndex=track.id===18?1:track.id+1;this.sync();
    });
    Promise.resolve(media.play()).catch(error=>{
      if(this.pending!==entry||entry.disposed)return;
      this.pending=null;this.dispose(entry);
      this.status=error?.name==='NotAllowedError'?'tap to enable soundtrack':'procedural fallback';
      if(error?.name!=='NotAllowedError')this.unavailable=true;
    });
  }
}
