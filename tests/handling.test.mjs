import test from 'node:test';
import assert from 'node:assert/strict';
import {getOrderTotal} from '../src/data/handling.js';
import {couponPrice} from '../server/coupon.js';

test('checkout has no handling charge and hidden Dax1 cannot lower the PayU amount', () => {
  assert.equal(getOrderTotal(6999, 1), 6999);
  assert.equal(getOrderTotal(6999, 2), 13998);
  assert.deepEqual(couponPrice('', 6999, 2), {amount: 13998, coupon: null});
  const previous = process.env.ENABLE_DAX1_COUPON;
  try {
    delete process.env.ENABLE_DAX1_COUPON;
    assert.throws(() => couponPrice('Dax1', 6999, 1), /currently unavailable/);
    process.env.ENABLE_DAX1_COUPON = 'true';
    assert.deepEqual(couponPrice('Dax1', 6999, 1), {amount: 1, coupon: 'Dax1'});
    assert.deepEqual(couponPrice(' dax1 ', 6999, 2), {amount: 1, coupon: 'Dax1'});
    assert.throws(() => couponPrice('WRONG', 6999, 1), /Invalid coupon/);
  } finally {
    if (previous === undefined) delete process.env.ENABLE_DAX1_COUPON;
    else process.env.ENABLE_DAX1_COUPON = previous;
  }
});
