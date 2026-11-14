import assert from 'node:assert/strict';
import test from 'node:test';
import {firstInvalidCheckoutField, isCheckoutFormComplete} from '../src/lib/checkoutForm.js';

const completeForm = {
  name: 'Asha Sharma',
  email: 'asha@example.com',
  phone: '9876543210',
  address: '12 Market Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001'
};

test('WhatsApp stays unavailable until all checkout details are valid', () => {
  assert.equal(isCheckoutFormComplete({}), false);
  assert.equal(isCheckoutFormComplete(completeForm), true);
  assert.equal(isCheckoutFormComplete({...completeForm, name: '  '}), false);
  assert.equal(isCheckoutFormComplete({...completeForm, email: 'asha@example'}), false);
  assert.equal(isCheckoutFormComplete({...completeForm, phone: '98765'}), false);
  assert.equal(isCheckoutFormComplete({...completeForm, address: '   '}), false);
  assert.equal(isCheckoutFormComplete({...completeForm, pincode: '1100'}), false);
});

test('the first incomplete field can receive focus on submit', () => {
  assert.equal(firstInvalidCheckoutField({...completeForm, city: ' ', pincode: ''}), 'city');
  assert.equal(firstInvalidCheckoutField(completeForm), null);
});
