import crypto from 'node:crypto';
const SHA = value => crypto.createHash('sha512').update(value,'utf8').digest('hex');
const required = name => {const value=process.env[name];if(!value||/YOUR-|example|placeholder|paste_/i.test(value))throw new Error(`Missing server configuration: ${name}`);return value;};
const key = () => required('PAYU_MERCHANT_KEY');
const salt = () => required('PAYU_MERCHANT_SALT');
export const payuBase = () => {
 const environment=required('PAYU_ENV');
 if(!['test','production'].includes(environment))throw new Error('Missing server configuration: PAYU_ENV');
 return environment==='production'?'https://secure.payu.in':'https://test.payu.in';
};
export const payuVerificationUrl = () => {
 const environment=required('PAYU_ENV');
 if(!['test','production'].includes(environment))throw new Error('Missing server configuration: PAYU_ENV');
 return `${environment==='production'?'https://info.payu.in':'https://test.payu.in'}/merchant/postservice.php?form=2`;
};
export function requestHash(fields){return SHA([key(),fields.txnid,fields.amount,fields.productinfo,fields.firstname,fields.email,'','','','','','','','','','',salt()].join('|'));}
function safeEquals(left,right) {
 if(typeof right!=='string'||!(/^[a-f0-9]{128}$/i).test(right))return false;
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
 const url=payuVerificationUrl();
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:key(),command,var1:txnid,hash}),signal:AbortSignal.timeout(12000)});
 if(!response.ok) throw new Error('PayU verification service unavailable.');
 const payload=await response.json();
 const transaction=payload?.transaction_details?.[txnid];
 if(!transaction) throw new Error('PayU has not confirmed this transaction yet.');
 return transaction;
}
export function isVerifiedSuccess(transaction,order){
 const amount=String(transaction?.amt??transaction?.amount??'');
 const expected=Number(order.amount).toFixed(2);
 return String(transaction?.status).toLowerCase()==='success'
  && (!transaction.txnid || transaction.txnid===order.txnid)
  && /^\d+\.\d{2}$/.test(amount)
  && amount===expected
  && Boolean(transaction.mihpayid && transaction.mihpayid!=='Not Found');
}
export const accessHash = value => crypto.createHash('sha256').update(value).digest('hex');

// PayU has already signed the browser callback before this token is issued.
// A short-lived token lets the return page verify the order even when UPI opens a new tab.
export function createReturnToken(txnid,now=Date.now()) {
 const expires=Math.floor(now/1000)+3600;
 const signature=crypto.createHmac('sha256',salt()).update(`payu-return|${txnid}|${expires}`).digest('hex');
 return `${expires}.${signature}`;
}

export function verifyReturnToken(txnid,token,now=Date.now()) {
 if(typeof token!=='string'||!/^\d{10}\.[a-f0-9]{64}$/i.test(token))return false;
 const [expiry,signature]=token.split('.');
 const expires=Number(expiry);
 const current=Math.floor(now/1000);
 if(!Number.isSafeInteger(expires)||expires<current||expires>current+3600)return false;
 const expected=crypto.createHmac('sha256',salt()).update(`payu-return|${txnid}|${expiry}`).digest('hex');
 return crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'));
}
