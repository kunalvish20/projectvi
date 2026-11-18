import crypto from 'node:crypto';
import {getOrder} from '../server/db.js';
import {json,readBody,clean} from '../server/http.js';
import {accessHash,verifyReturnToken} from '../server/payu.js';
import {settleOrder} from '../server/settleOrder.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const body=await readBody(req);const txnid=clean(body.txnid,32);const accessToken=clean(body.accessToken,100);
  const order=await getOrder(txnid);
  const browserTokenValid=Boolean(order&&accessToken&&/^[a-f0-9]{64}$/i.test(order.access_hash)&&crypto.timingSafeEqual(Buffer.from(accessHash(accessToken),'hex'),Buffer.from(order.access_hash,'hex')));
  const returnTokenValid=Boolean(order&&verifyReturnToken(txnid,body.returnToken));
  if(!browserTokenValid&&!returnTokenValid)return json(res,403,{error:'Invalid order verification token.'});
  let current=order;
  if(current.payment_status!=='paid'){
   try{current=await settleOrder(order)}catch(e){console.warn('PayU status verification pending',e.message)}
  }
  return json(res,200,{status:current.payment_status,txnid,orderNumber:current.order_number,...(current.payment_status==='paid'?{customerName:current.customer_name,email:current.customer_email,quantity:current.quantity,amount:Number(current.amount)}:{})});
 }catch(e){console.error('payu-status',e.message);return json(res,503,{error:'Could not verify payment yet. Retry in a moment.'});}
}
