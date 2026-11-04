/** PayU is initialized and verified ONLY by /api server functions. No merchant salt in React. */
const STORAGE='projectvi_pending_payu';
const parseJson=async response => {const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Payment service unavailable.');return data;};
export const getPendingPayU=()=>{try{return JSON.parse(sessionStorage.getItem(STORAGE)||'null')}catch{return null}};
export const clearPendingPayU=()=>sessionStorage.removeItem(STORAGE);
export async function startPayUPayment({quantity,customer}){
 const resp=await fetch('/api/payu-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity,customer})});
 const payu=await parseJson(resp);
 if(!payu?.fields?.hash||!/^https:\/\/(test\.payu\.in|secure\.payu\.in)\/_payment$/.test(payu.gateway))throw new Error('Invalid gateway configuration.');
 sessionStorage.setItem(STORAGE,JSON.stringify({txnid:payu.txnid,accessToken:payu.accessToken}));
 const form=document.createElement('form');form.method='POST';form.action=payu.gateway;form.style.display='none';
 for(const [name,value] of Object.entries(payu.fields)){const field=document.createElement('input');field.type='hidden';field.name=name;field.value=String(value??'');form.appendChild(field)}
 document.body.appendChild(form);form.submit();
}
export async function checkPayUStatus(){
 const current=getPendingPayU();if(!current?.txnid||!current.accessToken)throw new Error('Payment session not found. Please contact support with your transaction reference.');
 const result=await fetch('/api/payu-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(current)});
 return parseJson(result);
}
