import test from 'node:test';
import assert from 'node:assert/strict';
import {getOrderTotal} from '../src/data/handling.js';
import {couponPrice} from '../server/coupon.js';

test('checkout has no handling charge and Dax1 makes the entire order INR 1', () => {
  assert.equal(getOrderTotal(6999, 1), 6999);
  assert.equal(getOrderTotal(6999, 2), 13998);
  assert.deepEqual(couponPrice('Dax1', 6999, 1), {amount: 1, coupon: 'Dax1'});
  assert.deepEqual(couponPrice(' dax1 ', 6999, 2), {amount: 1, coupon: 'Dax1'});
  assert.deepEqual(couponPrice('', 6999, 2), {amount: 13998, coupon: null});
  assert.throws(() => couponPrice('WRONG', 6999, 1), /Invalid coupon/);
});
