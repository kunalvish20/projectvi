import test from 'node:test';
import assert from 'node:assert/strict';
import {HANDLING_FEE, getOrderTotal} from '../src/data/handling.js';

test('fixed handling charge adds INR 299 once per order', () => {
  assert.equal(HANDLING_FEE, 299);
  assert.equal(getOrderTotal(6999, 1), 7298);
  assert.equal(getOrderTotal(6999, 2), 14297);
});
