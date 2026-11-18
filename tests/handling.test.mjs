import test from 'node:test';
import assert from 'node:assert/strict';
import {getOrderTotal} from '../src/data/handling.js';
import {couponPrice} from '../server/coupon.js';

test('checkout has no handling charge and a hidden coupon cannot lower the PayU amount', () => {
  assert.equal(getOrderTotal(6999, 1), 6999);
  assert.equal(getOrderTotal(6999, 2), 13998);
  assert.deepEqual(couponPrice('', 6999, 2), {amount: 13998, coupon: null});
  const previousEnabled = process.env.ENABLE_PAYU_COUPON;
  const previousCode = process.env.PAYU_COUPON_CODE;
  try {
    delete process.env.ENABLE_PAYU_COUPON;
    delete process.env.PAYU_COUPON_CODE;
    assert.throws(() => couponPrice('Dax1', 6999, 1), /currently unavailable/);
    process.env.ENABLE_PAYU_COUPON = 'true';
    assert.throws(() => couponPrice('Dax1', 6999, 1), /currently unavailable/);
    process.env.PAYU_COUPON_CODE = 'NewPrivateCode';
    assert.deepEqual(couponPrice('NewPrivateCode', 6999, 1), {amount: 1, coupon: 'NewPrivateCode'});
    assert.deepEqual(couponPrice(' newprivatecode ', 6999, 2), {amount: 1, coupon: 'NewPrivateCode'});
    assert.throws(() => couponPrice('WRONG', 6999, 1), /Invalid coupon/);
  } finally {
    if (previousEnabled === undefined) delete process.env.ENABLE_PAYU_COUPON;
    else process.env.ENABLE_PAYU_COUPON = previousEnabled;
    if (previousCode === undefined) delete process.env.PAYU_COUPON_CODE;
    else process.env.PAYU_COUPON_CODE = previousCode;
  }
});
