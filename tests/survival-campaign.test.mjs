import test from 'node:test';import assert from 'node:assert/strict';
import {runCampaign} from './playthrough.js';import {runImmersiveCampaign} from './immersive-playthrough.js';
for(const [name,run]of [['Classic',runCampaign],['synthetic immersive',runImmersiveCampaign]])test(`${name} Survival clears the opening act with finite reserves and live boss combat`,()=>{const r=run({sectors:3,secrets:true,energyMode:'survival'});assert(r.passed,r.error);assert.equal(r.results.length,3);assert(r.results.every(s=>s.shots>0&&s.pickups>0&&s.distance>40));assert(r.results[2].bossPhases.includes(3));});
