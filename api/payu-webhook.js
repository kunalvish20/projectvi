import {json,readBody} from '../server/http.js';
import {processPayUNotification} from '../server/payuNotification.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const body=await readBody(req);
  const result=await processPayUNotification(body);
  if(!result.accepted)return json(res,400,{error:'Invalid PayU notification'});
  if(body.status==='success'&&result.order.payment_status!=='paid')return json(res,503,{error:'Payment is still being verified'});
  return json(res,200,{ok:true});
 }catch(error){console.error('payu-webhook',error.message);return json(res,503,{error:'Payment verification unavailable'});}
}
