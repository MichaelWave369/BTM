import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.js';
import {createRaidLevel,RAID_DEFINITION} from '../src/net/finale.js';
import {packWorld} from '../src/net/codec.js';
import {RaidPlanner} from './raid-playthrough.js';

function fixture({blast=false,phase=4,health=85}={}){
 const game=new Game();game.start();game.level=createRaidLevel(2);game.time=40;
 const players=[
  {id:'a',x:7.5,y:5.5,a:0,health,armor:80,energy:75,reserve:90,
   weapon:1,ori:100,status:'alive',dodgeCooldown:0,oriCooldown:0,vent:0,recharge:0},
  {id:'b',x:21.5,y:5.5,a:Math.PI,health:100,armor:80,energy:75,reserve:90,
   weapon:1,ori:100,status:'alive',dodgeCooldown:0,oriCooldown:0,vent:0,recharge:0}
 ];
 if(blast)game.level.blasts.push({x:players[0].x,y:players[0].y,radius:.72,
  damage:22,at:game.time+.5,hit:false});
 const init={level:structuredClone(game.level),definition:RAID_DEFINITION,revision:1};
 const state={players,world:packWorld(game),raid:{phase,state:'frequency',openUntil:0},
  time:game.time,state:'playing'};
 return {init,state,players};
}
test('the input-only browser raid planner dodges a real telegraphed floor strike',()=>{
 const f=fixture({blast:true});
 const input=new RaidPlanner().intent(f.init,f.state,'a');
 assert.equal(input.use,false,'must abandon the resonator long enough to evade');
 assert(Math.hypot(input.move,input.strafe)>.7,'must sprint away with real movement');
 assert(input.actions.includes('dash'),'must use normal finite-cooldown Dash');
 assert(!('health' in input)&&!('x' in input)&&!('complete' in input));
});
test('when no strike is telegraphed, the raid planner continues genuine dual-resonator objective',()=>{
 const f=fixture();
 const input=new RaidPlanner().intent(f.init,f.state,'a');
 assert.equal(input.use,true,'must channel the actual left resonator');
 assert(!input.actions.includes('dash'));
});
test('cooldown limits raid evasion and blast warnings never mutate the authoritative snapshot',()=>{
 const f=fixture({blast:true});
 f.players[0].dodgeCooldown=5;const before=JSON.stringify(f.state);
 const input=new RaidPlanner().intent(f.init,f.state,'a');
 assert.equal(input.use,false);
 assert(!input.actions.includes('dash'));
 assert(Math.hypot(input.move,input.strafe)>.7);
 assert.equal(JSON.stringify(f.state),before,'planner cannot modify world or players');
});
