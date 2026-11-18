// Run with: node --env-file=.env.local scripts/check-submissions.mjs
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {apikey:key};
if(key && !key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
if (!base || !key || /your-project|placeholder|paste_/i.test(`${base} ${key}`)) {
  console.error('Configure real Supabase server credentials before checking submission tables.');
  process.exit(1);
}
for (const table of ['products', 'orders', 'customers', 'creator_applications', 'checkout_submissions', 'checkout_drafts', 'contact_emails']) {
  try {
    const response = await fetch(`${base}/rest/v1/${table}?select=id&limit=0`, {
      headers
    });
    console.log(`${table}: ${response.ok ? 'ready' : `HTTP ${response.status}`}`);
    if (!response.ok) process.exitCode = 1;
  } catch {console.log(`${table}: connection failed`); process.exitCode = 1;}
}
