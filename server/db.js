const required = (name) => {const value=process.env[name]; if(!value||/YOUR-|example|placeholder|paste_/i.test(value)) throw new Error(`Missing server configuration: ${name}`); return value;};
const base = () => required('SUPABASE_URL').replace(/\/$/,'');
export async function db(table,{method='GET',query='',body,prefer='return=representation'}={}) {
 const key = required('SUPABASE_SERVICE_ROLE_KEY');
 const headers={apikey:key,'Content-Type':'application/json',Prefer:prefer};
 if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
 const res=await fetch(`${base()}/rest/v1/${table}${query}`,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const txt=await res.text(); let data;try {data=txt?JSON.parse(txt):null;}catch {data=txt;}
 if(!res.ok) throw new Error(data?.message || `Database error (${res.status})`);
 return data;
}
export const getOrder = async txnid => (await db('orders',{query:`?txnid=eq.${encodeURIComponent(txnid)}&select=*`}))?.[0] || null;
export const getProduct = async id => (await db('products',{query:`?id=eq.${encodeURIComponent(id)}&select=*`}))?.[0] || null;
