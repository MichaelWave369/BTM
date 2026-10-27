import test from 'node:test';import assert from 'node:assert/strict';import {immersiveChecks}from'./immersive-checks.js';
for(const r of(await immersiveChecks()).results)test(r.name,()=>assert.ok(r.pass,r.error));
