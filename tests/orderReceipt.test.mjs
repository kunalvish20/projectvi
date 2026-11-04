import test from 'node:test';
import assert from 'node:assert/strict';
import {getOrderReceipt, saveOrderReceipt} from '../src/lib/orderReceipt.js';

test('confirmation ignores old browser-only receipts', () => {
  const entries = new Map();
  globalThis.sessionStorage = {
    setItem: (key, value) => entries.set(key, value),
    getItem: key => entries.get(key) ?? null
  };

  saveOrderReceipt({orderId: 'PV-OLD', demo: true, amount: 7298});
  assert.equal(getOrderReceipt('PV-OLD'), null);

  saveOrderReceipt({orderId: 'PV-REAL', transactionId: 'PVTX123', amount: 7298});
  assert.equal(getOrderReceipt('PV-REAL')?.transactionId, 'PVTX123');
  assert.equal(getOrderReceipt('PV-OTHER'), null);
});
