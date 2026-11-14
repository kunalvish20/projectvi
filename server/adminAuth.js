const allowedEmail = 'workdndstores@gmail.com';

export async function verifyAdminRequest(req) {
  const jwt = /^Bearer\s+(.+)$/i.exec(String(req.headers?.authorization || ''))?.[1];
  if (!jwt) return false;
  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!base || !anonKey || /your-project|placeholder|paste_/i.test(`${base} ${anonKey}`)) throw new Error('Supabase admin verification is not configured.');
  const headers = {apikey: anonKey, Authorization: `Bearer ${jwt}`};
  const userResponse = await fetch(`${base}/auth/v1/user`, {headers, cache:'no-store'});
  if (!userResponse.ok) return false;
  const user = await userResponse.json();
  if (user.email?.toLowerCase() !== allowedEmail) return false;
  const roleResponse = await fetch(`${base}/rest/v1/rpc/is_admin`, {
    method:'POST', headers:{...headers, 'Content-Type':'application/json'}, body:'{}', cache:'no-store'
  });
  return roleResponse.ok && (await roleResponse.json()) === true;
}
