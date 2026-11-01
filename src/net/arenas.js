// Original authored arenas. Neither solo registry is extended or modified.
import {PIT_ACTS} from '../pit.js';
const maps=[
 {id:'no-carrier',name:'NO CARRIER',tag:'INDUSTRIAL COMMUNICATIONS EXCHANGE',color:'#80e8d4',act:0,rooms:[[1,1,27,23]],walls:[[8,5,9,9],[19,15,20,19],[13,4,15,6],[13,18,15,20],[6,12,10,12],[18,12,22,12],[13,10,15,14]],hazards:[[14.5,8.5],[14.5,16.5]]},
 {id:'sysops-revenge',name:"SYSOP’S REVENGE",tag:'ROTATING ACCESS / FOUR SERVER VAULTS',color:'#64caff',act:1,rooms:[[1,1,11,10],[17,1,27,10],[1,14,11,23],[17,14,27,23],[10,9,18,15]],halls:[[5,8,6,16],[22,8,23,16],[9,5,19,6],[9,18,19,19]],walls:[[4,4,5,5],[23,4,24,5],[4,19,5,20],[23,19,24,20],[13,11,15,13]],hazards:[[6.5,12.5],[22.5,12.5],[14.5,5.5]]},
 {id:'kill-switch',name:'THE KILL SWITCH',tag:'CROSSED RELAYS / SIGNAL DISPOSAL',color:'#ff667d',act:3,rooms:[[1,1,27,7],[1,17,27,23],[1,7,7,17],[21,7,27,17],[10,9,18,15]],halls:[[6,11,12,12],[17,11,23,12],[13,6,15,10],[13,14,15,18]],walls:[[5,4,8,4],[20,20,23,20],[12,3,16,4],[12,20,16,21],[3,10,4,14],[24,10,25,14]],hazards:[[14.5,8.5],[14.5,16.5],[9.5,12.5],[19.5,12.5]]}
];
export const ARENA_DEFS=maps.map(m=>({...m,subtitle:m.tag,palette:PIT_ACTS[m.act],spawn:{x:3.5,y:21.5,a:-Math.PI/2}}));
export function createArena(id='no-carrier'){
 const d=ARENA_DEFS.find(d=>d.id===id);if(!d)throw Error('Unknown arena');const w=29,h=25,cells=Array.from({length:h},()=>Array(w).fill(1));
 for(const [x0,y0,x1,y1]of [...d.rooms,...(d.halls||[])])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=0;
 for(const [x0,y0,x1,y1]of d.walls)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)cells[y][x]=1;
 const spawns=[[3.5,21.5,-Math.PI/2],[25.5,3.5,Math.PI/2],[3.5,3.5,0],[25.5,21.5,Math.PI],[10.5,3.5,Math.PI/2],[18.5,21.5,-Math.PI/2],[3.5,16.5,0],[25.5,8.5,Math.PI]].filter(([x,y])=>!cells[Math.floor(y)][Math.floor(x)]);
 const items=[];for(const [x,y]of [[5.5,8.5],[23.5,16.5],[11.5,5.5],[17.5,19.5],[6.5,18.5],[22.5,6.5],[11.5,12.5],[17.5,12.5]])if(!cells[Math.floor(y)][Math.floor(x)])items.push({id:items.length,type:'energy',x,y,taken:false});
 for(const [type,x,y]of [['health',3.5,12.5],['health',25.5,12.5],['armor',14.5,2.5],['armor',14.5,22.5]])if(!cells[Math.floor(y)][Math.floor(x)])items.push({id:items.length,type,x,y,taken:false});
 const level={index:0,campaign:'arena',w,h,cells,doors:{},enemies:[],items,captives:[],relays:[],key:{x:14.5,y:12.5,taken:true},exit:{x:14.5,y:12.5},seen:Array(w*h).fill(true),secretFound:false,regions:d.rooms.map(bounds=>({bounds,name:d.tag})),props:[],signs:[],palette:d.palette,hazards:d.hazards.map(([x,y],id)=>({id,x,y,kind:d.act===0?'vent':d.act===1?'arc':'void',radius:.62,period:6,offset:id*1.3,damage:10})),blasts:[]};
 return{definition:d,level,spawns};
}
