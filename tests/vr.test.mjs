import test from 'node:test';import assert from 'node:assert/strict';import {vrChecks} from './vr-checks.js';
for(const r of (await vrChecks()).results)test(r.name,()=>assert.ok(r.pass,r.error));
