/** Provisions the only allowed email-verified administrator identity in Supabase Auth.
 * Run locally after creating the schema. Requires service_role and ADMIN_INITIAL_PASSWORD.
 * No passwords are written to source files or stdout. Never run in the browser.
 */
const url=(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const password=process.env.ADMIN_INITIAL_PASSWORD;
const allowlist=['workdndstores@gmail.com'];
const isPlaceholder=value=>!value||/YOUR-PROJECT|PASTE_|SET_NEW_/i.test(value);
if (!url.startsWith('https://') || isPlaceholder(url) || isPlaceholder(key) || isPlaceholder(password)) {
 console.error('Add real SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_INITIAL_PASSWORD values to .env.local before running setup:admins.');process.exit(1);
}
if(password.length<12) {console.error('Use an admin password of at least 12 characters.');process.exit(1);}
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
async function call(path,method='GET',data){
 const response=await fetch(`${url}/auth/v1/admin/${path}`,{method,headers,...(data?{body:JSON.stringify(data)}:{})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(result.msg||result.message||result.error||`Supabase Auth error ${response.status}`);
 return result;
}
let all=[];
for(let page=1;page<=10;page++){
 const result=await call(`users?page=${page}&per_page=100`);
 const current=result.users||[];all.push(...current);if(current.length<100)break;
}
for(const email of allowlist){
 const existing=all.find(u=>u.email?.toLowerCase()===email);
 if(existing){await call(`users/${existing.id}`,'PUT',{password,email_confirm:true});console.log(`Updated authorized account: ${email}`);}
 else {await call('users','POST',{email,password,email_confirm:true,app_metadata:{role:'projectvi_admin'}});console.log(`Created authorized account: ${email}`);}
}
console.log('Done. The authorized account password was updated in Supabase Auth. Apply supabase/only-workdndstores-admin.sql to restrict the existing database allowlist.');
