import {db,getOrder} from '../server/db.js';
import {json,readBody,clean} from '../server/http.js';
import {accessHash,verifyPaymentWithPayU} from '../server/payu.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const body=await readBody(req);const txnid=clean(body.txnid,32);const accessToken=clean(body.accessToken,100);
  const order=await getOrder(txnid);
  if(!order||accessHash(accessToken)!==order.access_hash)return json(res,403,{error:'Invalid order verification token.'});
  let status=order.payment_status;
  if(status==='pending'){
   try{
    const verified=await verifyPaymentWithPayU(txnid);
    if(String(verified.status).toLowerCase()==='success'&&Number(verified.amt||verified.amount)===Number(order.amount)){
      await db('orders',{method:'PATCH',query:`?txnid=eq.${encodeURIComponent(txnid)}&payment_status=neq.paid`,body:{payment_status:'paid',order_status:'confirmed',payu_payment_id:clean(verified.mihpayid,100)}});
      status='paid';
    }
   }catch{/* gateway may still be processing; never falsely mark paid */}
  }
  return json(res,200,{status,txnid,orderNumber:order.order_number});
 }catch(e){console.error('payu-status',e.message);return json(res,503,{error:'Could not verify payment yet. Retry in a moment.'});}
}
