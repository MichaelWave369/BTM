// Lightweight WebXR callback cadence meter. No GPU readbacks, network calls,
// saves, or gameplay clock changes. "FPS" describes XR callbacks, not GPU FPS.
export class XRFrameMeter {
 constructor(capacity=90){
  if(!Number.isInteger(capacity)||capacity<3||capacity>360)throw Error('Invalid XR frame window');
  this.intervals=new Float32Array(capacity);
  this.reset();
 }
 reset(){
  this.last=null;this.count=0;this.next=0;this.sum=0;this.updated=null;
  this.reading={fps:0,avgMs:0,peakMs:0,spikes:0,samples:0};
 }
 record(now){
  if(!Number.isFinite(now))return;
  if(this.last!==null){
   const interval=now-this.last;
   if(interval>1000){this.reset();this.last=now;return;}
   if(interval>=1&&interval<=1000){
    if(this.count===this.intervals.length)this.sum-=this.intervals[this.next];
    else this.count++;
    this.intervals[this.next]=interval;this.sum+=interval;
    this.next=(this.next+1)%this.intervals.length;
   }
  }
  this.last=now;
  if(this.count>=3&&(this.updated===null||now-this.updated>=250)){
   const avg=this.sum/this.count;
   let peak=0,spikes=0;
   // 22ms comfortably exceeds the nominal 72/90Hz callback interval.
   const threshold=Math.max(22,avg*1.65);
   for(let i=0;i<this.count;i++){
    const n=this.intervals[i];if(n>peak)peak=n;if(n>threshold)spikes++;
   }
   this.reading={
    fps:Math.round(1000/avg),
    avgMs:Math.round(avg*10)/10,
    peakMs:Math.round(peak*10)/10,
    spikes,samples:this.count
   };
   this.updated=now;
  }
 }
 snapshot(){return this.reading;}
}
