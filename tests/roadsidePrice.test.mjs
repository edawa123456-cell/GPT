import test from 'node:test';
import assert from 'node:assert/strict';
import { roadsidePrice, roadsideQuote } from '../app/lib/roadsidePrice.js';

test('correct base prices including one gallon fuel delivery', () => {
  assert.equal(roadsidePrice('jump_start', 'sedan_suv'), 65);
  assert.equal(roadsidePrice('jump_start', 'pickup'), 85);
  assert.equal(roadsidePrice('jump_start', 'box_van'), 95);
  assert.equal(roadsidePrice('jump_start', 'semi'), 145);
  assert.equal(roadsidePrice('tire_change', 'sedan'), 95);
  assert.equal(roadsidePrice('tire_change', 'suv'), 165);
  assert.equal(roadsidePrice('tire_change', 'pickup'), 165);
  assert.equal(roadsidePrice('lockout'), 65);
  assert.equal(roadsidePrice('fuel_delivery'), 75);
  assert.equal(roadsidePrice('jump_start', 'invalid'), null);
  assert.equal(roadsidePrice('unknown'), null);
});

test('mileage fees use actual unrounded distance', () => {
  assert.deepEqual(roadsideQuote('lockout', '', 10), { base:65, miles:10, travel:0, total:65 });
  assert.deepEqual(roadsideQuote('lockout', '', 10.04), { base:65, miles:10.1, travel:15, total:80 });
  assert.deepEqual(roadsideQuote('lockout', '', 20), { base:65, miles:20, travel:15, total:80 });
  assert.deepEqual(roadsideQuote('lockout', '', 20.04), { base:65, miles:20.1, travel:50, total:115 });
  assert.deepEqual(roadsideQuote('fuel_delivery', '', 30), { base:75, miles:30, travel:50, total:125 });
  assert.deepEqual(roadsideQuote('jump_start', 'pickup', 12), { base:85, miles:12, travel:15, total:100 });
});

test('reject out-of-area, invalid distance, and invalid service', () => {
  assert.deepEqual(roadsideQuote('lockout', '', 30.01), { outsideServiceArea: true });
  assert.equal(roadsideQuote('lockout', '', -1), null);
  assert.equal(roadsideQuote('lockout', '', Number.NaN), null);
  assert.equal(roadsideQuote('unknown', '', 5), null);
});
