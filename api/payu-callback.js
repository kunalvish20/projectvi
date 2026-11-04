import {db,getOrder} from '../server/db.js';
import {readBody,redirect,clean} from '../server/http.js';
import {verifyResponseHash,verifyPaymentWithPayU} from '../server/payu.js';
export default async function handler(req,res){
 if(req.method!=='POST'){res.statusCode=405;return res.end('Method not allowed');}
 let txnid='';
 try{
  const body=await readBody(req);txnid=clean(body.txnid,32);
  const order=await getOrder(txnid);
  if(!order||!verifyResponseHash(body)||Number(body.amount)!==Number(order.amount)||body.email?.toLowerCase()!==order.customer_email||body.productinfo!==order.product_name){
   console.warn('PayU response rejected: invalid signature or order mismatch');
   return redirect(res,'/checkout?payment=unverified');
  }
  let paymentStatus='pending';let providerId=clean(body.mihpayid,100);
  if(body.status==='success'){
   try{
    const verified=await verifyPaymentWithPayU(txnid);
    if(String(verified.status).toLowerCase()==='success'&&Number(verified.amt||verified.amount)===Number(order.amount)){
      paymentStatus='paid';providerId=clean(verified.mihpayid||providerId,100);
    }
   }catch(e){console.warn('PayU verify pending',e.message);}
  } else if(['failure','failed'].includes(String(body.status).toLowerCase()))paymentStatus='failed';
  if(order.payment_status!=='paid'){
   await db('orders',{method:'PATCH',query:`?txnid=eq.${encodeURIComponent(txnid)}&payment_status=neq.paid`,body:{payment_status:paymentStatus,order_status:paymentStatus==='paid'?'confirmed':paymentStatus==='failed'?'payment_failed':'pending_payment',payu_payment_id:providerId||null}});
   if(paymentStatus==='paid'){
     // Inventory is decremented atomically by a database trigger on the first paid transition.
   }
  }
  return redirect(res,`/checkout?payment=${encodeURIComponent(txnid)}`);
 }catch(e){console.error('payu-callback',e.message);return redirect(res,`/checkout?payment=${encodeURIComponent(txnid||'unverified')}`);}
}
