import test from 'node:test';
import assert from 'node:assert/strict';
import {contactEmailInput} from '../server/contactEmail.js';
import handler from '../api/contact-email.js';

function response() {
  return {statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(value) { this.body = JSON.parse(value); }};
}

test('contact email is normalized and invalid addresses are rejected', () => {
  assert.deepEqual(contactEmailInput({email: '  Customer@Example.com  '}), {email: 'customer@example.com'});
  for (const email of ['', 'not-an-email', 'name@example', 'name @example.com', `${'a'.repeat(181)}@example.com`]) {
    assert.throws(() => contactEmailInput({email}), /valid email/);
  }
});

test('contact email endpoint validates input before writing to Supabase', async () => {
  const invalid = response();
  await handler({method:'POST', body:{email:'invalid'}}, invalid);
  assert.equal(invalid.statusCode, 400);
  const bot = response();
  await handler({method:'POST', body:{email:'bot@example.com', website:'filled'}}, bot);
  assert.equal(bot.statusCode, 201);
});
