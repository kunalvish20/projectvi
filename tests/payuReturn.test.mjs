import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReturnToken} from '../server/payu.js';
import payuStatus from '../api/payu-status.js';

test('a signed PayU return retrieves only its paid order without session storage',async()=>{
 const originalFetch=globalThis.fetch;
 const originalEnv=Object.fromEntries(['PAYU_MERCHANT_SALT','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].map(key=>[key,process.env[key]]));
 Object.assign(process.env,{PAYU_MERCHANT_SALT:'unit-salt',SUPABASE_URL:'https://unit.supabase.test',SUPABASE_SERVICE_ROLE_KEY:'unit-service-key'});
 const order={txnid:'PVUNIT123',access_hash:'0'.repeat(64),payment_status:'paid',order_number:2,customer_name:'Sam',customer_email:'sam@example.com',quantity:1,amount:1};
 globalThis.fetch=async url=>{
  assert.match(String(url),/\/rest\/v1\/orders\?txnid=eq\./);
  return Response.json([order]);
 };
 const call=async(txnid,returnToken)=>{
  const req={method:'POST',body:{txnid,returnToken}};
  const res={statusCode:0,headers:{},setHeader(name,value){this.headers[name]=value},end(value){this.body=value}};
  await payuStatus(req,res);
  return {statusCode:res.statusCode,body:JSON.parse(res.body)};
 };
 try{
  const token=createReturnToken(order.txnid);
  const valid=await call(order.txnid,token);
  assert.equal(valid.statusCode,200);
  assert.equal(valid.body.status,'paid');
  assert.equal(valid.body.orderNumber,2);
  assert.equal((await call('PVOTHER',token)).statusCode,403);
  assert.equal((await call(order.txnid,'invalid')).statusCode,403);
 }finally{
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries(originalEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value}
 }
});
