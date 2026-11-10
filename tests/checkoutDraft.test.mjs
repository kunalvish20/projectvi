import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutDraftInput} from '../api/checkout-draft.js';

const id = '5a0aab50-cc19-4f88-a32c-c77988c9e202';

test('partial checkout details are accepted without a completed delivery form', () => {
  const draft = checkoutDraftInput({id, quantity: 1, customer: {name: 'A Customer', phone: '9876543210'}});
  assert.equal(draft.customer_name, 'A Customer');
  assert.equal(draft.customer_phone, '9876543210');
  assert.equal(draft.address, '');
  assert.equal(draft.status, 'editing');
});

test('WhatsApp click status and draft identity are validated', () => {
  assert.equal(checkoutDraftInput({id, quantity: 2, customer: {email: 'A@EXAMPLE.COM'}, status: 'whatsapp_opened'}).customer_email, 'a@example.com');
  assert.equal(checkoutDraftInput({id, quantity: 2, customer: {email: 'a@example.com'}, status: 'whatsapp_opened'}).status, 'whatsapp_opened');
  assert.throws(() => checkoutDraftInput({id: 'bad-id', quantity: 1, customer: {name: 'A'}}));
  assert.throws(() => checkoutDraftInput({id, quantity: 1, customer: {}}));
});
