import test from 'node:test';
import assert from 'node:assert/strict';
import {SITE} from '../src/data/catalog.js';
import {buildWhatsAppOrderUrl} from '../src/lib/whatsappOrder.js';

test('checkout opens the requested WhatsApp number with complete order details', () => {
  const customer = {
    name: 'A Customer', email: 'customer@example.com', phone: '9876543210',
    address: '12 Market Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001'
  };
  const url = new URL(buildWhatsAppOrderUrl(SITE.orderWhatsApp, {
    customer, productName: "GTA VI Collector's Box", quantity: 2, amount: 14297
  }));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/919731202959');
  const message = url.searchParams.get('text');
  assert.match(message, /Hi Project VI, I'd like to order GTA VI Collector's Box\./);
  assert.match(message, /Qty: 2 \| Estimated total: ₹14,297 \(including handling\)/);
  assert.match(message, /Name: A Customer/);
  assert.match(message, /Phone: 9876543210/);
  assert.match(message, /Email: customer@example\.com/);
  assert.match(message, /Delivery: 12 Market Street, Mumbai, Maharashtra - 400001/);
  assert.match(message, /Please confirm availability and payment details\./);
});

test('invalid WhatsApp destinations are rejected', () => {
  assert.throws(() => buildWhatsAppOrderUrl('123', {customer: {}}), /temporarily unavailable/);
});
