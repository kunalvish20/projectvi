import test from 'node:test';
import assert from 'node:assert/strict';
import {ORDER_CONFIRMATION_SUBJECT, orderConfirmationInput, orderConfirmationMessage} from '../src/lib/orderConfirmationEmail.js';
import handler from '../api/send-order-confirmation.js';

function response() {
  return {statusCode:200, headers:{}, setHeader(name,value){this.headers[name]=value;}, end(value){this.body=JSON.parse(value);}};
}

test('confirmation template validates recipient and requires verified payment', () => {
  assert.deepEqual(orderConfirmationInput({to:' Customer@Example.com ', name:'Asha', reference:'PV-123', paymentConfirmed:true}),
    {to:'customer@example.com', name:'Asha', reference:'PV-123'});
  assert.throws(() => orderConfirmationInput({to:'bad', paymentConfirmed:true}), /valid customer email/);
  assert.throws(() => orderConfirmationInput({to:'a@example.com'}), /Confirm that payment/);
  assert.equal(ORDER_CONFIRMATION_SUBJECT, 'Your Project VI order is confirmed');
  assert.match(orderConfirmationMessage({name:'Asha', reference:'PV-123'}), /Hi Asha,[\s\S]*PV-123[\s\S]*received your payment/);
});

test('email API blocks non-admin callers and reports missing sender setup', async () => {
  const denied = response();
  await handler({method:'POST', headers:{}, body:{to:'customer@example.com', paymentConfirmed:true}}, denied);
  assert.equal(denied.statusCode, 403);

  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.VITE_SUPABASE_ANON_KEY;
  const oldFrom = process.env.ORDER_EMAIL_FROM;
  const oldPassword = process.env.GMAIL_APP_PASSWORD;
  try {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'public-test-key';
    delete process.env.ORDER_EMAIL_FROM;
    delete process.env.GMAIL_APP_PASSWORD;
    global.fetch = async url => url.endsWith('/auth/v1/user')
      ? Response.json({email:'workdndstores@gmail.com'}) : Response.json(true);

    const status = response();
    await handler({method:'GET', headers:{authorization:'Bearer test-jwt'}}, status);
    assert.equal(status.statusCode, 200);
    assert.equal(status.body.configured, false);

    const missing = response();
    await handler({method:'POST', headers:{authorization:'Bearer test-jwt'}, body:{to:'customer@example.com', paymentConfirmed:true}}, missing);
    assert.equal(missing.statusCode, 503);
    assert.match(missing.body.error, /not configured/);
  } finally {
    global.fetch = oldFetch;
    for (const [name,value] of [['SUPABASE_URL',oldUrl],['VITE_SUPABASE_ANON_KEY',oldKey],['ORDER_EMAIL_FROM',oldFrom],['GMAIL_APP_PASSWORD',oldPassword]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
