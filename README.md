# Project VI — React storefront + Supabase Commerce Admin + PayU

A single Vite/React project. Storefront homepage and product page layouts are preserved from your uploaded project. Admin is at **`/admin`** and has a separate, light, responsive Commerce OS UI. Checkout uses PayU India Hosted Checkout with server-side hashes, payment verification, Supabase order storage and inventory updates.

## Quick setup (one-time)

Requirements: **Node.js 20.19+ / 22+**, npm, a Supabase project, PayU India test credentials.

1. `npm install`
2. Copy `.env.example` to `.env`, and fill the keys. Keep `.env` private. In Supabase: Project Settings → API → Project URL / anon key / **service_role** key. The service_role key is **server-only**, never set `VITE_` before it.
3. In **Supabase Dashboard → SQL Editor**, paste and run **`supabase/schema.sql` once**. This creates tables, seeds the initial collector box and enforces Row Level Security with a fixed allowlist. You must do this once: API keys cannot create SQL tables automatically.
4. Put a **fresh strong password** in `ADMIN_INITIAL_PASSWORD` (you posted a password in chat, so change it before going live). Run **`npm run setup:admins`** once. It creates or updates only `workdndstores@gmail.com` and `kunalvishwakarmaa20@gmail.com` in Supabase Auth, email-confirmed, with that shared password.
5. `npm run dev` and open `http://localhost:5173` for store and `http://localhost:5173/admin` for admin. **Admin login accepts ONLY the two confirmed Supabase Auth identities in `public.is_admin()`; a UI-only email check is never considered sufficient.** Both credentials work through Supabase Auth. No registration route exists. `npm run dev` runs the payment server routes locally using the Vite middleware.

> The app starts without configured credentials but live admin login, data and checkout require the SQL schema, server secrets and PayU keys. PayU redirects cannot call back to plain localhost. For testing a PayU transaction locally, expose Vite through a HTTPS tunnel (e.g. ngrok) and set `PUBLIC_SITE_URL` to the externally reachable HTTPS origin, or deploy the application on Vercel.

## Environment variables

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser | Public Project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Public anon/publishable key. RLS enabled. |
| `SUPABASE_URL` | Serverless functions & provisioning | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Secret; bypasses RLS; **never expose** |
| `PAYU_MERCHANT_KEY` | Server only | PayU India merchant key |
| `PAYU_MERCHANT_SALT` | Server only | **Secret** PayU Salt |
| `PAYU_ENV` | Server only | `test` or `production` |
| `PUBLIC_SITE_URL` | Server only | Public origin used for PayU callbacks |
| `ADMIN_INITIAL_PASSWORD` | Local admin provisioning only | Strong password for both allowlisted accounts; remove from deployment env after provisioning |

### Deploy to Vercel

Connect repository to Vercel. Set every required variable in **Vercel → Project Settings → Environment Variables**, except `ADMIN_INITIAL_PASSWORD` (only needed during local provisioning). Set `PUBLIC_SITE_URL=https://your-real-domain.com`, `PAYU_ENV=production` only when live PayU credentials are issued and tested. `vercel.json` maps storefront routes to the SEO HTML files, and `/admin` to `index.html`. `/api/payu-*` use Vercel Node serverless functions. Ensure HTTPS and PayU account merchant/callback domain configuration as applicable.

### PayU flow and data integrity

The customer submits contact and address details; `/api/payu-create` reads the **real current product price and inventory** from Supabase (not browser-supplied amounts), writes a pending order, generates SHA512 request hash server-side and returns the PayU POST fields. PayU returns to `/api/payu-callback`. Server verifies reverse response hash **and independently verifies payment through PayU's verify_payment API** before marking it paid. Customer browser can additionally check `/api/payu-status` using an unguessable order access token. A database trigger decrements stock only on first `paid` transition and stores customer profiles. No PayU salt or Supabase service key is shipped to the browser. An unverified redirect is **not** proof of payment.

**Production checklist**: use real authorized domain and PayU credentials; perform sandbox success, failed and pending transaction tests; check PayU's dashboard settlement/reconciliation; configure gateway webhooks or reconciliation monitoring for delayed/abandoned callbacks; verify CORS and rate limiting at your edge/CDN; add purchase notification provider (not shipped) and backups. Payment, tax, returns and shipping integration require operational review before production sales.

## Admin modules

Overview, Products, Collections, Inventory, Orders, Customers, Payments, Shipping, Returns, Discounts, Marketing drafts, Reviews, Customer Support, Analytics, Content drafts, Taxes, Notifications, Integrations, Staff Access, Settings. CRUD and data read/write are connected to the Supabase tables; orders and verified payment statuses use specialized controls. CSV download included. The visual design is confined to `src/admin/Admin.css`.

**Important feature boundaries**: The uploaded storefront currently sells the original **single Collector's Box**. Editing its title, description and price in Admin syncs back to its existing storefront content (layout unchanged); other products and collections are **admin data records** until new public listing pages are developed. Discounts, content blocks, marketing campaigns, reviews and tax rates are **admin-managed data**, not automatically wired to live checkout or static homepage. Marketing sending, courier label generation, automatic refunds, GST tax invoices, Google Analytics and third-party services **require separate live credentials and provider-specific integrations**. The UI describes these boundaries, rather than pretending they're implemented.

## Commands

- `npm run dev`: store, admin, local API
- `npm run build`: Vite production bundle + SEO snapshots
- `npm run preview`: preview built SPA (does **not** run API; use Vercel for integration test)
- `npm run setup:admins`: create/update the two Supabase Auth admin users after SQL schema setup
- `npm run check`: run local PayU hash and setup tests

## Security notes

Never commit `.env`, disclose PayU salt, the service-role key or passwords; the frontend must only get anon keys. **Both allowlisted emails are separate admin accounts**, each having full privileges; this is not one unique person's identity. If you want exactly one administrator, remove the second address from the SQL allowlist and re-run the `is_admin` function policy, and disable the second Supabase Auth user. Since the password was shared in conversation, use a **new** password before launch. The server function route should be protected by WAF/rate limiting in production.
