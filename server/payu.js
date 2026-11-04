import crypto from 'node:crypto';
const SHA = value => crypto.createHash('sha512').update(value,'utf8').digest('hex');
const required = name => {if(!process.env[name])throw new Error(`Missing server configuration: ${name}`);return process.env[name];};
const key = () => required('PAYU_MERCHANT_KEY');
const salt = () => required('PAYU_MERCHANT_SALT');
export const payuBase = () => process.env.PAYU_ENV==='production'?'https://secure.payu.in':'https://test.payu.in';
export function requestHash(fields){return SHA([key(),fields.txnid,fields.amount,fields.productinfo,fields.firstname,fields.email,'','','','','','','','','','',salt()].join('|'));}
function safeEquals(left,right) {
 if(typeof right!=='string'||!/[a-f0-9]{128}/i.test(right))return false;
 const a=Buffer.from(left,'hex'), b=Buffer.from(right,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
export function verifyResponseHash(fields){
 if(fields.key!==key()||!fields.txnid||!fields.hash)return false;
 const base=[salt(),fields.status,'','','','','',fields.udf5||'',fields.udf4||'',fields.udf3||'',fields.udf2||'',fields.udf1||'',fields.email||'',fields.firstname||'',fields.productinfo||'',fields.amount||'',fields.txnid||'',fields.key||''];
 const additional=fields.additionalCharges||fields.additional_charges;
 const check=SHA((additional?[additional,...base]:base).join('|'));
 return safeEquals(check,String(fields.hash));
}
export async function verifyPaymentWithPayU(txnid){
 const command='verify_payment';
 const hash=SHA(`${key()}|${command}|${txnid}|${salt()}`);
 const url=`${payuBase()}/merchant/postservice.php?form=2`;
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:key(),command,var1:txnid,hash}),signal:AbortSignal.timeout(12000)});
 if(!response.ok) throw new Error('PayU verification service unavailable.');
 const payload=await response.json();
 const transaction=payload?.transaction_details?.[txnid];
 if(!transaction) throw new Error('PayU has not confirmed this transaction yet.');
 return transaction;
}
export const accessHash = value => crypto.createHash('sha256').update(value).digest('hex');
