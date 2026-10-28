import {RINGS,CATALOG,ringItems,appById} from './genewrist/catalog.js';
import {WORLDS,safeWorldUrl} from './genewrist/worlds.js';

// A pinned, offline snapshot of GenEWrist v0.2's canonical module/world registry.
// The consumer (BTM) still controls all gameplay and immersive XR lifecycle.
export const FIELD_CONSOLE=Object.freeze({id:'field-console',title:'Gen.E.Wrist Console',category:'HOME',subtitle:'Universal Field Interface',url:'https://michaelwave369.github.io/GenEWrist/'});
export const FIELD_WORLDS=Object.freeze([FIELD_CONSOLE,...WORLDS.filter(world=>world.id!=='btm')]);
export function destinationFor(id){
 const world=FIELD_WORLDS.find(item=>item.id===id);
 const url=world&&safeWorldUrl(world.url);
 return url?Object.freeze({id:world.id,title:world.title,url,requiresConfirmation:true,requiresSessionRestart:true}):null;
}
export class FieldNavigator {
 constructor(){this.reset();}
 reset(){this.open=false;this.ring='middle';this.page='ring';this.app=null;this.pending=null;}
 toggle(){this.open=!this.open;if(!this.open)this.pending=null;return this.open;}
 close(){this.open=false;this.pending=null;}
 chooseRing(ring){if(!RINGS.some(entry=>entry.id===ring))return false;this.ring=ring;this.app=null;this.pending=null;this.page='ring';return true;}
 chooseApp(id){
  const entry=appById(id);if(!entry||entry.ring!==this.ring)return false;
  this.app=id;this.pending=null;this.page=id==='realm-atlas'?'worlds':'app';return true;
 }
 selectWorld(id){const dest=destinationFor(id);if(!dest)return false;this.pending=dest;this.page='confirm';return true;}
 back(){if(this.page==='confirm'){this.pending=null;this.page='worlds';}else if(this.page!=='ring'){this.app=null;this.page='ring';}else this.close();}
 modules(){return ringItems(this.ring);}
 selected(){return CATALOG.find(x=>x.id===this.app)||null;}
}
