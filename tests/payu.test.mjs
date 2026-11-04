import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {requestHash,verifyResponseHash} from '../server/payu.js';
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
