import {readBody,redirect} from '../server/http.js';
import {processPayUNotification} from '../server/payuNotification.js';
import {createReturnToken} from '../server/payu.js';

export default async function handler(req,res){
 if(req.method!=='POST'){res.statusCode=405;return res.end('Method not allowed');}
 try{
  const result=await processPayUNotification(await readBody(req));
  if(!result.accepted){console.warn('PayU response rejected');return redirect(res,'/payment-result?payment=unverified')}
  const token=createReturnToken(result.txnid);
  return redirect(res,`/payment-result?payment=${encodeURIComponent(result.txnid)}#rt=${encodeURIComponent(token)}`);
 }catch(error){console.error('payu-callback',error.message);return redirect(res,'/payment-result?payment=unverified')}
}
