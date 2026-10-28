import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogValid,RINGS,ringItems,TOOLKIT} from '../src/genewrist/catalog.js';
import {FIELD_WORLDS,FIELD_CONSOLE,destinationFor,FieldNavigator} from '../src/genewrist-bridge.js';
test('canonical GenEWrist ring contracts remain 3/6/9',()=>{
 assert.equal(catalogValid(),true);assert.deepEqual(RINGS.map(x=>ringItems(x.id).length),[3,6,9]);assert.equal(TOOLKIT.length,7);
});
test('GenEWrist accepts only trusted HTTPS destinations and requires confirmation',()=>{
 const d=destinationFor('field-console');assert(d.url.startsWith('https://'));assert(d.requiresConfirmation);assert(d.requiresSessionRestart);
 assert.equal(destinationFor('infinite-porch'),null);assert.equal(destinationFor('btm'),null);assert.equal(destinationFor('__proto__'),null);
 assert(FIELD_WORLDS.includes(FIELD_CONSOLE));
});
test('FieldNavigator remains dormant until explicitly opened',()=>{
 const nav=new FieldNavigator();assert.equal(nav.open,false);assert.equal(nav.page,'ring');nav.toggle();assert.equal(nav.open,true);
 assert.equal(nav.chooseRing('middle'),true);assert.equal(nav.modules().length,6);assert.equal(nav.chooseRing('unknown'),false);
});
test('world exits require a two-stage state transition and can be cancelled',()=>{
 const nav=new FieldNavigator();nav.toggle();nav.chooseApp('realm-atlas');assert.equal(nav.page,'worlds');
 assert.equal(nav.selectWorld('infinite-porch'),false);assert.equal(nav.page,'worlds');
 assert(nav.selectWorld('field-console'));assert.equal(nav.page,'confirm');assert(nav.pending?.url);
 nav.back();assert.equal(nav.pending,null);assert.equal(nav.page,'worlds');nav.back();assert.equal(nav.page,'ring');nav.back();assert.equal(nav.open,false);
});
test('ring selection and resets cleanly clear pending links',()=>{
 const nav=new FieldNavigator();nav.toggle();nav.chooseApp('realm-atlas');nav.selectWorld('lenz');nav.chooseRing('inner');
 assert.equal(nav.page,'ring');assert.equal(nav.pending,null);assert.equal(nav.modules().length,9);nav.reset();assert.equal(nav.open,false);
});
