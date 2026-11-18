import {json,readBody,clean} from '../server/http.js';
import {getOrder} from '../server/db.js';
import {settleOrder} from '../server/settleOrder.js';
import {verifyAdminRequest} from '../server/adminAuth.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  if(!(await verifyAdminRequest(req)))return json(res,403,{error:'Admin access required'});
  const {txnid}=await readBody(req);
  const order=await getOrder(clean(txnid,32));
  if(!order)return json(res,404,{error:'Order not found'});
  const current=await settleOrder(order);
  return json(res,200,{status:current.payment_status,orderStatus:current.order_status,orderNumber:current.order_number});
 }catch(error){console.error('payu-reconcile',error.message);return json(res,503,{error:'Could not verify PayU status. Try again shortly.'});}
}
