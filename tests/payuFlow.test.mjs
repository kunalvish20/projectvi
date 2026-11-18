import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settleOrder} from '../server/settleOrder.js';

test('settlement writes paid once only after matching PayU verification',async()=>{
 const originalFetch=globalThis.fetch;
 const originalEnv=Object.fromEntries(['PAYU_MERCHANT_KEY','PAYU_MERCHANT_SALT','PAYU_ENV','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].map(key=>[key,process.env[key]]));
 Object.assign(process.env,{PAYU_MERCHANT_KEY:'unit-key',PAYU_MERCHANT_SALT:'unit-salt',PAYU_ENV:'test',SUPABASE_URL:'https://unit.supabase.test',SUPABASE_SERVICE_ROLE_KEY:'unit-service-key'});
 const order={txnid:'PVUNIT123',amount:7298,payment_status:'pending',order_status:'pending_payment'};
 let amount='1.00';let writes=0;
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes('payu.in/merchant/postservice.php'))return Response.json({transaction_details:{PVUNIT123:{txnid:order.txnid,status:'success',amt:amount,mihpayid:'4039937155'}}});
  if(String(url).includes('/rest/v1/orders')&&options?.method==='PATCH'){
   writes++;
   assert.match(String(url),/payment_status=neq.paid/);
   return Response.json([{...order,...JSON.parse(options.body)}]);
  }
  throw new Error(`Unexpected request: ${url}`);
 };
 try{
  assert.equal((await settleOrder(order)).payment_status,'pending');
  assert.equal(writes,0);
  amount='7298.00';
  const paid=await settleOrder(order);
  assert.equal(paid.payment_status,'paid');
  assert.equal(writes,1);
  assert.equal((await settleOrder(paid)).payment_status,'paid');
  assert.equal(writes,1);
 }finally{
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries(originalEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value}
 }
});
