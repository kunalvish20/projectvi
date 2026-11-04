/** Minimal Supabase Auth + PostgREST client. Uses the public anon key only in the browser.
 * Supabase RLS protects every privileged table and action; this file is not an authorization boundary.
 */
const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION = 'projectvi_admin_session';
export const isConfigured = Boolean(url && anonKey);
export const allowedEmails = ['workdndstores@gmail.com'];
const toQuery = query => Object.entries(query).map(([k,v])=> `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
const readSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION) || 'null'); } catch { return null; } };
export const clearAdminSession = () => { sessionStorage.removeItem(SESSION); window.dispatchEvent(new Event('pv:auth')); };
export const getSessionEmail = () => readSession()?.user?.email || '';
export const getCurrentUser = () => readSession()?.user || null;
async function authFetch(endpoint, body) {
  const response = await fetch(`${url}/auth/v1/${endpoint}`, {method:'POST',headers:{apikey:anonKey,'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const data = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Authentication failed.');
  return data;
}
async function token() {
  const session = readSession();
  if(!session) return null;
  if(Date.now() < session.expires_at - 60000) return session.access_token;
  try {
    const refreshed = await authFetch('token?grant_type=refresh_token', {refresh_token:session.refresh_token});
    save(refreshed);
    return refreshed.access_token;
  } catch {clearAdminSession(); return null;}
}
function save(payload) {
  const next = {...payload,expires_at: Date.now() + Math.max(60,(payload.expires_in||3600))*1000};
  sessionStorage.setItem(SESSION,JSON.stringify(next));
  window.dispatchEvent(new Event('pv:auth'));
}
export async function apiRequest(path, {method='GET', data, authenticated=false, prefer='', contentType='application/json'}={}) {
  if(!isConfigured) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  const bearer = authenticated ? await token() : anonKey;
  if(authenticated && !bearer) throw new Error('Please sign in again.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers:{apikey:anonKey, Authorization:`Bearer ${bearer}`, ...(data!==undefined?{'Content-Type':contentType}:{}), ...(prefer?{Prefer:prefer}:{})},
    ...(data!==undefined?{body:JSON.stringify(data)}:{})
  });
  const txt = await response.text();
  let output; try {output = txt ? JSON.parse(txt) : null;} catch {output = txt;}
  if(!response.ok) throw new Error(output?.message || output?.details || `Database request failed (${response.status}).`);
  return output;
}
export async function signInAdmin(email,password) {
  const cleanEmail = email.trim().toLowerCase();
  if(!allowedEmails.includes(cleanEmail)) throw new Error('This email is not permitted to access Project VI admin.');
  if(!isConfigured) throw new Error('Configure Supabase credentials in .env first.');
  const signedIn = await authFetch('token?grant_type=password', {email:cleanEmail,password});
  const response = await fetch(`${url}/rest/v1/rpc/is_admin`, {method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${signedIn.access_token}`,'Content-Type':'application/json'},body:'{}'});
  const isAdmin = response.ok ? await response.json() : false;
  if(isAdmin !== true || signedIn.user?.email?.toLowerCase()!==cleanEmail) throw new Error('Access denied. The email must be confirmed and explicitly authorized in the database.');
  save(signedIn);
  return signedIn.user;
}
export async function checkAdmin() {
  const jwt = await token(); if(!jwt) return false;
  try {
    const response = await fetch(`${url}/rest/v1/rpc/is_admin`, {method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${jwt}`,'Content-Type':'application/json'},body:'{}'});
    const allowed = response.ok && (await response.json())===true;
    if(!allowed) clearAdminSession();
    return allowed;
  } catch {return false;}
}
export const readPublicProduct = id => apiRequest(`products?${toQuery({id:`eq.${id}`,select:'id,name,short_name,price,compare_at_price,description,image_url,inventory,active'})}`).then(rows=> rows?.[0] || null);
export const adminList = (table, limit=300) => apiRequest(`${table}?${toQuery({select:'*',order:'created_at.desc',limit})}`,{authenticated:true});
export const adminInsert = (table, row) => apiRequest(table,{method:'POST',data:row,authenticated:true,prefer:'return=representation'});
export const adminUpdate = (table,id,row) => apiRequest(`${table}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',data:row,authenticated:true,prefer:'return=representation'});
export const adminDelete = (table,id) => apiRequest(`${table}?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',authenticated:true,prefer:'return=representation'});
export const toCurrency = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(amount)||0);
