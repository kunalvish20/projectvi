import {db,getOrder} from './db.js';
import {verifyPaymentWithPayU,isVerifiedSuccess} from './payu.js';
import {clean} from './http.js';

export async function settleOrder(order){
 if(order.payment_status==='paid')return order;
 const transaction=await verifyPaymentWithPayU(order.txnid);
 if(!isVerifiedSuccess(transaction,order))return order;
 const updated=await db('orders',{
  method:'PATCH',
  query:`?txnid=eq.${encodeURIComponent(order.txnid)}&payment_status=neq.paid`,
  body:{payment_status:'paid',order_status:'confirmed',payu_payment_id:clean(transaction.mihpayid,100),updated_at:new Date().toISOString()}
 });
 return updated?.[0] || await getOrder(order.txnid);
}
