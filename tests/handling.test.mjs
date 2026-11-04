import test from 'node:test';
import assert from 'node:assert/strict';
import {getHandlingOption, getOrderTotal} from '../src/data/handling.js';

test('premium handling adds INR 500 once per order', () => {
  assert.equal(getOrderTotal(6999, 1, 'standard'), 6999);
  assert.equal(getOrderTotal(6999, 1, 'premium'), 7499);
  assert.equal(getOrderTotal(6999, 2, 'premium'), 14498);
});

test('unknown handling options cannot be priced', () => {
  assert.equal(getHandlingOption('__proto__'), null);
  assert.throws(() => getOrderTotal(6999, 1, 'priority'), /Invalid handling option/);
});
