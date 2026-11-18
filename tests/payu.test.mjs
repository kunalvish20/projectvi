import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {requestHash,verifyResponseHash,isVerifiedSuccess,payuVerificationUrl} from '../server/payu.js';
import {formatOrderId} from '../src/lib/orderId.js';
const hash=t=>crypto.createHash('sha512').update(t).digest('hex');
test('PayU v1 hash uses standard 11 separators after email',()=>{
 process.env.PAYU_MERCHANT_KEY='TESTKEY';process.env.PAYU_MERCHANT_SALT='TESTSALT';
 const fields={txnid:'ABC123',amount:'6499.00',productinfo:'Collector Box',firstname:'Sam',email:'sam@example.com'};
 assert.equal(requestHash(fields),hash('TESTKEY|ABC123|6499.00|Collector Box|Sam|sam@example.com|||||||||||TESTSALT'));
});
test('PayU response signature is required and tampering is rejected',()=>{
 process.env.PAYU_MERCHANT_KEY='TESTKEY';process.env.PAYU_MERCHANT_SALT='TESTSALT';
 const fields={key:'TESTKEY',txnid:'ABC123',amount:'6499.00',productinfo:'Collector Box',firstname:'Sam',email:'sam@example.com',status:'success'};
 const signed={...fields,hash:hash('TESTSALT|success|||||||||||sam@example.com|Sam|Collector Box|6499.00|ABC123|TESTKEY')};
 assert.equal(verifyResponseHash(signed),true);
 assert.equal(verifyResponseHash({...signed,amount:'1.00'}),false);
 assert.equal(verifyResponseHash({...signed,key:'EVIL'}),false);
});

test('only a matching successful PayU verification can confirm an order',()=>{
 const order={txnid:'PV123',amount:7298};
 const verified={txnid:'PV123',status:'success',amt:'7298.00',mihpayid:'4039937155'};
 assert.equal(isVerifiedSuccess(verified,order),true);
 assert.equal(isVerifiedSuccess({...verified,status:'pending'},order),false);
 assert.equal(isVerifiedSuccess({...verified,amt:'1.00'},order),false);
 assert.equal(isVerifiedSuccess({...verified,txnid:'OTHER'},order),false);
 assert.equal(isVerifiedSuccess({...verified,mihpayid:'Not Found'},order),false);
});

test('database order numbers have a consistent customer and dashboard ID',()=>{
 assert.equal(formatOrderId(1),'PV-01');
 assert.equal(formatOrderId(2),'PV-02');
 assert.equal(formatOrderId(100),'PV-100');
 assert.equal(formatOrderId(undefined),'');
});

test('PayU production verification uses the postservice host',()=>{
 const previous=process.env.PAYU_ENV;
 try{
  process.env.PAYU_ENV='production';
  assert.equal(payuVerificationUrl(),'https://info.payu.in/merchant/postservice.php?form=2');
  process.env.PAYU_ENV='test';
  assert.equal(payuVerificationUrl(),'https://test.payu.in/merchant/postservice.php?form=2');
 }finally{if(previous===undefined)delete process.env.PAYU_ENV;else process.env.PAYU_ENV=previous}
});
