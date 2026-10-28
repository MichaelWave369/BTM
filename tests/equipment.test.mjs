import test from 'node:test';
import {equipmentCases} from './equipment-checks.js';
for(const [name,run]of equipmentCases())test(name,run);
