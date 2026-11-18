import {db,getOrder} from './db.js';
import {clean} from './http.js';
import {verifyResponseHash} from './payu.js';
import {settleOrder} from './settleOrder.js';

export async function processPayUNotification(body){
 const txnid=clean(body.txnid,32);
 if(!txnid)return {accepted:false,txnid};
 const order=await getOrder(txnid);
 if(!order||!verifyResponseHash(body)||Number(body.amount)!==Number(order.amount)
   ||body.email?.toLowerCase()!==order.customer_email||body.productinfo!==order.product_name){
  return {accepted:false,txnid};
 }
 if(body.status==='success'){
  try{return {accepted:true,txnid,order:await settleOrder(order)}}
  catch(error){console.warn('PayU verification pending',error.message);return {accepted:true,txnid,order};}
 }
 if(['failure','failed'].includes(String(body.status).toLowerCase())&&order.payment_status!=='paid'){
  const updated=await db('orders',{method:'PATCH',query:`?txnid=eq.${encodeURIComponent(txnid)}&payment_status=neq.paid`,body:{payment_status:'failed',order_status:'payment_failed',payu_payment_id:clean(body.mihpayid,100)||null,updated_at:new Date().toISOString()}});
  return {accepted:true,txnid,order:updated?.[0]||order};
 }
 return {accepted:true,txnid,order};
}
