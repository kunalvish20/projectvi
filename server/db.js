const required = (name) => {const value=process.env[name]; if(!value) throw new Error(`Missing server configuration: ${name}`); return value;};
const base = () => required('SUPABASE_URL').replace(/\/$/,'');
export async function db(table,{method='GET',query='',body,prefer='return=representation'}={}) {
 const key = required('SUPABASE_SERVICE_ROLE_KEY');
 const res=await fetch(`${base()}/rest/v1/${table}${query}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:prefer},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const txt=await res.text(); let data;try {data=txt?JSON.parse(txt):null;}catch {data=txt;}
 if(!res.ok) throw new Error(data?.message || `Database error (${res.status})`);
 return data;
}
export const getOrder = async txnid => (await db('orders',{query:`?txnid=eq.${encodeURIComponent(txnid)}&select=*`}))?.[0] || null;
export const getProduct = async id => (await db('products',{query:`?id=eq.${encodeURIComponent(id)}&select=*`}))?.[0] || null;
