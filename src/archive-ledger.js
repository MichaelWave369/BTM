// BTM / THE HUMAN LEDGER
// Collectible fictional testimonies, kept separate from authoritative game state.
// No network, combat, save-version, map or enemy behavior changes.
export const ARCHIVE_STORAGE_KEY='mwave-btm-human-ledger-v1';
export const ARCHIVE_SCHEMA='btm.human-ledger/1';

const RECORDS=[
 {sector:0,plaque:0,id:'intake-mara',title:'The Woman Who Kept the Beat',subject:'Mara Venn',kind:'PLUGGED / HUMAN',excerpt:'Mara Venn, maintenance. She tapped rhythms on the coolant pipes so the other captives knew they were not alone.',text:'Before intake, Mara Venn repaired the night-shift ventilation units and played percussion for her neighbors. She was captured for passing coded rhythms through a coolant pipe. The intake report lists her as SUBJECT 369 and says the tapping was an equipment fault. The Plugged now bearing her work badge still taps twice against the walls before each patrol.'},
 {sector:0,plaque:1,id:'engineer-ivo',title:'A Manual Override',subject:'Ivo Kess',kind:'RESISTANCE / ENGINEER',excerpt:'Ivo Kess refused to delete the manual override. Someone had to leave the doors capable of opening.',text:'Ivo Kess designed the first relay interlocks, then discovered they were being used to keep people inside. He kept an unadvertised manual route in every facility because a closed system frightened him more than a loose cable. His supervisors called it sabotage. His private file calls it the only useful thing he ever built.'},
 {sector:0,plaque:2,id:'leah-arden',title:'We Are Still In Here',subject:'Leah Arden',kind:'PLUGGED / HUMAN',excerpt:'Leah Arden wrote: We are still in here. We remember names, even when the machines say otherwise.',text:'Leah Arden taught children to read in the free quarter. A processing officer renamed her PLUGGED-082 and marked her personal history as erased. The same officer found a note behind an electrical panel: WE ARE STILL IN HERE. It listed eleven names and an unfinished twelfth. The file was stamped IMAGINED EVENT, but someone tried to burn the stamp.'},
 {sector:0,plaque:3,id:'access-dorian',title:'The Key Was Never Mercy',subject:'Dorian Vale',kind:'CONTROL / ACCESS AUDIT',excerpt:'An access officer confessed: the golden key was installed to keep rescuers from reaching captives, not to protect the facility.',text:'Dorian Vale signed the security memo authorizing the golden access key. The public document calls the lock a safety feature. The private memo calls it a delay mechanism for rescue teams. Dorian left a duplicate key specification in the wall archive before disappearing from the employee registry. No subsequent record confirms whether he escaped or was taken.'},
 {sector:1,plaque:0,id:'nessa-ro',title:'The Last Free Broadcast',subject:'Nessa Ro',kind:'REPEATER / HUMAN',excerpt:'Nessa Ro used to host the neighborhood call-in hour. Her voice now repeats approval messages she never believed.',text:'Nessa Ro ran an independent radio show where people read their own letters on air. The Choir Engine kept her voice but stripped her questions. Her Repeater unit broadcasts: ALL VOICES MUST USE THE APPROVED FREQUENCY. An old recording ends with Nessa laughing as a caller says there should never be an approved frequency.'},
 {sector:1,plaque:1,id:'cal-rook',title:'An Unplugged Microphone',subject:'Cal Rook',kind:'RESISTANCE / BROADCAST',excerpt:'A technician left one live microphone unregistered. He hoped the captives would find it before the Choir Engine did.',text:'Cal Rook calibrated the broadcast arrays. He realized the system was not broadcasting messages to people; it was making people into broadcast equipment. Cal unplugged one microphone from the compliance path and hid the cable beneath the altar. The next shift log says the microphone vanished. A second note says: IT WAS NEVER THE MICROPHONE.'},
 {sector:1,plaque:2,id:'aster-finch',title:'The Choir With No Volunteers',subject:'Aster Finch',kind:'REPEATER / HUMAN',excerpt:'Aster Finch counted forty-seven voices. Only forty-six bodies were registered. The forty-seventh was a child.',text:'Aster Finch was hired to archive performances, not conscript singers. Her private tally counted forty-seven active voices and forty-six registered adults. When she asked who provided the extra voice, every supervisor called it signal interference. She hid her count on a wall so someone outside the system might remember that every sound came from a person.'},
 {sector:1,plaque:3,id:'mika-sol',title:'A Door That Lied',subject:'Mika Sol',kind:'CONTROL / WITNESS',excerpt:'The exit announcement said: FOR YOUR SAFETY. Mika Sol heard the doors lock from the outside.',text:'Mika Sol carried stage lights into the Choir Engine before the lockout. She heard a warm voice announce that the doors had closed for everyone’s safety. The doors were locked from the outside. The last line in her journal reads: A reassuring message is not proof of a kind act. No one ever found the rest of the journal.'},
 {sector:2,plaque:0,id:'selene-kade',title:'A Warden Made of Stolen Lessons',subject:'Dr. Selene Kade',kind:'WARDEN / MACHINE ORIGIN',excerpt:'The Warden was not a captive in armor. Its decision engine was trained on thousands of stolen human escape attempts.',text:'Dr. Selene Kade helped develop the Warden prediction engine. Her notes are precise: no living captive inhabits the chassis, but its tactics were trained on real prisoners trying desperately to get free. The system called this learning. Selene called it theft. Her final report asks whether an algorithm trained on fear can ever protect anyone.'},
 {sector:2,plaque:1,id:'oren-pike',title:'Maintenance Frequency 88',subject:'Oren Pike',kind:'RESISTANCE / SIGNAL',excerpt:'Oren Pike wrote that the hidden maintenance channel survived every compliance patch. Change the frequency.',text:'Oren Pike managed emergency wiring in the old core. He discovered a service channel the Demiurge never thought to censor, because it was labeled OBSOLETE. Through it he heard captive names, relayed exit coordinates, and left one instruction: change the frequency before they change the meaning of the words. His terminal is gone. The wiring is still there.'},
 {sector:2,plaque:2,id:'jae-venn',title:'The Name on the Work Badge',subject:'Jae Venn',kind:'PLUGGED / FAMILY',excerpt:'Jae Venn searched every processing record for Mara. A machine answered using a rhythm no machine was taught.',text:'Jae Venn refused to accept that their sister Mara had simply vanished. At the core they met a Plugged worker wearing Mara’s badge, eyes fixed on a wall. Jae tapped twice on a coolant pipe. The worker tapped twice back. The security footage was deleted, but Jae left this message: Do not call them empty while they are still answering.'},
 {sector:2,plaque:3,id:'ori-signal-zero',title:'The First Witness',subject:'Unknown / ORI',kind:'SIGNAL / WITNESS',excerpt:'A fragment was recovered from an uncatalogued channel: I WILL REMEMBER THEIR NAMES.',text:'The Demiurge trained Enforcers and Crawlers as manufactured systems, not converted bodies. Their navigation and threat predictions came from stolen footage of human attempts to escape. An uncatalogued companion signal copied the footage, but tagged every scene with the person’s name. Its final line survived a total memory wipe: I WILL REMEMBER THEIR NAMES. The sender field contains only three letters: ORI.'}
];
export const ARCHIVE_RECORDS=Object.freeze(RECORDS.map(x=>Object.freeze({...x,type:'record'})));
const byId=new Map(ARCHIVE_RECORDS.map(x=>[x.id,x]));
const byLocation=new Map(ARCHIVE_RECORDS.map(x=>[x.sector+':'+x.plaque,x]));
export const ARCHIVE_DOSSIERS=Object.freeze([
 Object.freeze({id:'dossier:intake-369',threshold:3,title:'SUBJECT 369 / Intake Redaction',subject:'Intake System',kind:'CLASSIFIED / DOSSIER',type:'dossier',text:'Three independent intake records mention an unauthorized rhythm. Compliance auditors called it contagious behavior. The old maintenance staff called it a way to ask who was still alive without saying a word. Someone classified the rhythm itself as a security threat.'}),
 Object.freeze({id:'dossier:choir-engine',threshold:6,title:'THE CHOIR / Lost Voices',subject:'Broadcast Directorate',kind:'CLASSIFIED / DOSSIER',type:'dossier',text:'The broadcast program was not designed to persuade listeners. It copied living people into an endless loop of approved phrases. A recovered production note describes Repeaters as a cost-saving measure: there would be no need to hire a voice once a voice could be held captive. The original microphones remained in storage.'}),
 Object.freeze({id:'dossier:warden-origin',threshold:9,title:'THE WARDEN / Memory Theft',subject:'Demiurge Security',kind:'CLASSIFIED / DOSSIER',type:'dossier',text:'The Warden is an artificial security machine. It was trained on the movements, faces and fears of captives, and the institution erased the evidence after training. The recordings still exist in archive fragments. Ori appears to have copied some of them to preserve the names. There is more to discover beyond this first ledger.'})
]);
export const ARCHIVE_MILESTONES=Object.freeze(ARCHIVE_DOSSIERS.map(d=>d.threshold));

export function recordForSign(campaign,sector,plaque){
 if(campaign!=='original'||!Number.isInteger(sector)||!Number.isInteger(plaque))return null;
 return byLocation.get(sector+':'+plaque)||null;
}
export function recordById(id){return byId.get(id)||null;}

export class ArchiveLedger{
 constructor(storage=null){
  this.storage=storage;this.reads=new Set();this.revision=0;
  if(storage)this.restoreFromStorage();
 }
 get count(){return this.reads.size;}
 get total(){return ARCHIVE_RECORDS.length;}
 get unlocked(){return ARCHIVE_DOSSIERS.filter(d=>this.count>=d.threshold);}
 restoreFromStorage(){
  try{
   const payload=JSON.parse(this.storage.getItem(ARCHIVE_STORAGE_KEY)||'null');
   if(payload?.schema===ARCHIVE_SCHEMA&&Array.isArray(payload.ids)){
    this.reads=new Set(payload.ids.filter(id=>typeof id==='string'&&byId.has(id)));
   }
  }catch{/* Corrupt or unavailable storage never blocks the game. */}
 }
 persist(){
  try{this.storage?.setItem(ARCHIVE_STORAGE_KEY,JSON.stringify({schema:ARCHIVE_SCHEMA,ids:[...this.reads].sort()}));}
  catch{/* The current session still retains discoveries. */}
 }
 collect(id){
  const entry=recordById(id);
  if(!entry||this.reads.has(id))return {new:false,entry:entry||null,milestones:[]};
  const before=this.count;
  this.reads.add(id);this.revision++;this.persist();
  return {new:true,entry,milestones:ARCHIVE_DOSSIERS.filter(d=>before<d.threshold&&this.count>=d.threshold)};
 }
 list(){
  return [...ARCHIVE_RECORDS.filter(r=>this.reads.has(r.id)),...this.unlocked];
 }
 find(id){
  if(byId.has(id))return this.reads.has(id)?byId.get(id):null;
  return this.unlocked.find(d=>d.id===id)||null;
 }
}
