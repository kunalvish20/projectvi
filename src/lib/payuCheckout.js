/** PayU is initialized and verified ONLY by /api server functions. No merchant salt in React. */
const STORAGE='projectvi_pending_payu';
const RETRY_CUSTOMER='projectvi_retry_customer';
const parseJson=async response => {const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Payment service unavailable.');return data;};
export const getPendingPayU=()=>{try{return JSON.parse(sessionStorage.getItem(STORAGE)||'null')}catch{return null}};
export const clearPendingPayU=()=>sessionStorage.removeItem(STORAGE);
export const saveRetryPayUCustomer=customer=>sessionStorage.setItem(RETRY_CUSTOMER,JSON.stringify(customer));
export const consumeRetryPayUCustomer=()=>{try{const customer=JSON.parse(sessionStorage.getItem(RETRY_CUSTOMER)||'null');sessionStorage.removeItem(RETRY_CUSTOMER);return customer&&typeof customer==='object'?customer:null}catch{return null}};
export async function startPayUPayment({quantity,customer,couponCode}){
 const resp=await fetch('/api/payu-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity,customer,couponCode})});
 const payu=await parseJson(resp);
 if(!payu?.fields?.hash||!/^https:\/\/(test\.payu\.in|secure\.payu\.in)\/_payment$/.test(payu.gateway))throw new Error('Invalid gateway configuration.');
 sessionStorage.setItem(STORAGE,JSON.stringify({txnid:payu.txnid,accessToken:payu.accessToken,customer,quantity,amount:Number(payu.fields.amount)}));
 const form=document.createElement('form');form.method='POST';form.action=payu.gateway;form.style.display='none';
 for(const [name,value] of Object.entries(payu.fields)){const field=document.createElement('input');field.type='hidden';field.name=name;field.value=String(value??'');form.appendChild(field)}
 document.body.appendChild(form);
 try{form.submit()}catch(error){clearPendingPayU();form.remove();throw error}
}
export async function checkPayUStatus({txnid,returnToken}={}){
 const current=getPendingPayU();
 const matchingSession=current?.txnid&&(!txnid||current.txnid===txnid);
 const request=returnToken&&txnid?{txnid,returnToken,...(matchingSession?{accessToken:current.accessToken}:{})}:current;
 if(!request?.txnid||(!request.accessToken&&!request.returnToken))throw new Error('Payment session not found. Please contact support with your transaction reference.');
 const result=await fetch('/api/payu-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
 return parseJson(result);
}
