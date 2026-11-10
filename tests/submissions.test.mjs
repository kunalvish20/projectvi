import assert from 'node:assert/strict';
import test from 'node:test';
import {checkoutDetails, creatorApplication} from '../server/submissions.js';

test('creator applications keep valid form data and reject unrelated links', () => {
  const application = creatorApplication({name:'A Creator', email:'HELLO@example.com', interest:'Create content', socialLink:'https://www.instagram.com/creator', secondLink:'https://youtube.com/@creator', message:'A short pitch'});
  assert.equal(application.email, 'hello@example.com');
  assert.equal(application.social_link, 'https://www.instagram.com/creator');
  assert.throws(() => creatorApplication({...application, socialLink:'https://instagram.com.evil.example/user'}));
});

test('checkout submissions require complete delivery details', () => {
  const input = {quantity:2, customer:{name:'A Customer', email:'customer@example.com', phone:'9876543210', address:'12 Market Street', city:'Mumbai', state:'Maharashtra', pincode:'400001'}};
  assert.equal(checkoutDetails(input).quantity, 2);
  assert.throws(() => checkoutDetails({...input, customer:{...input.customer, pincode:'40001'}}));
  assert.throws(() => checkoutDetails({...input, quantity:11}));
});
