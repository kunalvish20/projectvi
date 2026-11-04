# Project VI — React storefront + Supabase Commerce Admin + PayU

A single Vite/React project. Storefront homepage and product page layouts are preserved from your uploaded project. Admin is at **`/admin`** and has a separate, light, responsive Commerce OS UI. Checkout uses PayU India Hosted Checkout with server-side hashes, payment verification, Supabase order storage and inventory updates.

## Quick setup (one-time)

Requirements: **Node.js 20.19+ / 22+**, npm, Supabase and PayU India credentials for checkout.

1. `npm install`
2. Copy `.env.example` to ignored `.env.local` and fill the Supabase and PayU values, `PUBLIC_SITE_URL`, and `ADMIN_INITIAL_PASSWORD`. Keep the file private. In Supabase: Project Settings → API → Project URL / anon key / **service_role** key. The service_role key is **server-only**, never set `VITE_` before it. Checkout creates an order only through the PayU server flow; missing configuration returns an error rather than a simulated success.
3. In **Supabase Dashboard → SQL Editor**, paste and run **`supabase/schema.sql` once**. This creates tables, seeds the initial collector box and enforces Row Level Security with a fixed allowlist. You must do this once: API keys cannot create SQL tables automatically.
4. Put a unique strong password in `ADMIN_INITIAL_PASSWORD` in the ignored `.env.local` file. Run **`npm run setup:admins`** once. It creates or updates only `workdndstores@gmail.com` in Supabase Auth and confirms that email. For an existing Supabase project, also run **`supabase/only-workdndstores-admin.sql`** in the SQL Editor to replace the old two-email database allowlist. The provisioning script cannot change SQL policies through a service-role API key.
5. `npm run dev` and open `http://localhost:5173` for store and `http://localhost:5173/admin` for admin. **Admin login accepts ONLY the one confirmed Supabase Auth identity in `public.is_admin()`; a UI-only email check is never considered sufficient.** No registration route exists. `npm run dev` runs the payment server routes locally using the Vite middleware.

> Admin login, data and PayU checkout require the SQL schema and server secrets. PayU redirects cannot call back to plain localhost. For testing a PayU transaction locally, expose Vite through a HTTPS tunnel (e.g. ngrok) and set `PUBLIC_SITE_URL` to the externally reachable HTTPS origin, or deploy the application on Vercel.

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
| `ADMIN_INITIAL_PASSWORD` | Local admin provisioning only | Strong password for the one authorized account; keep it only in ignored `.env.local` and remove after provisioning |

### Deploy to Vercel

Connect repository to Vercel. Set every required variable in **Vercel → Project Settings → Environment Variables**, except `ADMIN_INITIAL_PASSWORD` (only needed during local provisioning). Set `PUBLIC_SITE_URL=https://your-real-domain.com` and use `PAYU_ENV=production` only when live PayU credentials are issued and tested. `vercel.json` maps storefront routes to the SEO HTML files, and `/admin` to `index.html`. `/api/payu-*` use Vercel Node serverless functions. Ensure HTTPS and PayU account merchant/callback domain configuration as applicable.

### PayU flow and data integrity

The customer submits contact and address details. Delivery is free, and a fixed INR 299 handling charge is shown in the cart and checkout totals. `/api/payu-create` reads the **real current product price and inventory** from Supabase and adds the server-defined handling fee (not a browser-supplied amount), writes a pending order, generates SHA512 request hash server-side and returns the PayU POST fields. PayU returns to `/api/payu-callback`. Server verifies reverse response hash **and independently verifies payment through PayU's verify_payment API** before marking it paid. Customer browser can additionally check `/api/payu-status` using an unguessable order access token. A database trigger decrements stock only on first `paid` transition and stores customer profiles. No PayU salt or Supabase service key is shipped to the browser. An unverified redirect is **not** proof of payment.

**Production checklist**: use real authorized domain and PayU credentials; perform sandbox success, failed and pending transaction tests; check PayU's dashboard settlement/reconciliation; configure gateway webhooks or reconciliation monitoring for delayed/abandoned callbacks; verify CORS and rate limiting at your edge/CDN; add purchase notification provider (not shipped) and backups. Payment, tax, returns and shipping integration require operational review before production sales.

## Admin modules

Overview, Products, Collections, Inventory, Orders, Customers, Payments, Shipping, Returns, Discounts, Marketing drafts, Reviews, Customer Support, Analytics, Content drafts, Taxes, Notifications, Integrations, Staff Access, Settings. CRUD and data read/write are connected to the Supabase tables; orders and verified payment statuses use specialized controls. CSV download included. The visual design is confined to `src/admin/Admin.css`.

**Important feature boundaries**: The uploaded storefront currently sells the original **single Collector's Box**. Editing its title, description and price in Admin syncs back to its existing storefront content (layout unchanged); other products and collections are **admin data records** until new public listing pages are developed. Discounts, content blocks, marketing campaigns, reviews and tax rates are **admin-managed data**, not automatically wired to live checkout or static homepage. Marketing sending, courier label generation, automatic refunds, GST tax invoices, Google Analytics and third-party services **require separate live credentials and provider-specific integrations**. The UI describes these boundaries, rather than pretending they're implemented.

## Commands

- `npm run dev`: store, admin, local API
- `npm run build`: Vite production bundle + SEO snapshots
- `npm run preview`: preview built SPA (does **not** run API; use Vercel for integration test)
- `npm run setup:admins`: create/update the one Supabase Auth admin user from ignored `.env.local`
- `npm run check`: run local PayU hash and setup tests

## Search visibility

The production build writes route-specific HTML with titles, descriptions, canonical URLs, social previews, crawlable page copy, and structured data. Product pages include Product and BreadcrumbList data; cart, checkout, confirmation, and admin pages are marked `noindex`. The sitemap contains only indexable canonical URLs.

`SITE.origin` in `src/data/catalog.js` is the canonical domain (`https://dndstores.com`). Update it if the production domain changes, then rebuild and deploy. After deployment, submit `/sitemap.xml` in Google Search Console and check the live URLs there. Rebuild after changing the product name or price so static search metadata stays current. Search appearance and rankings depend on search engines and cannot be guaranteed by code alone.

## Security notes

Never commit `.env.local`, disclose PayU salt, the service-role key or passwords; the frontend must only get anon keys. The code permits only `workdndstores@gmail.com`. The existing database keeps its old allowlist until `supabase/only-workdndstores-admin.sql` is applied. After that, the old second Supabase Auth user can still exist but cannot access admin data. The password was shared in conversation, so rotate it to a new private value before launch, run `npm run setup:admins` again, and remove `ADMIN_INITIAL_PASSWORD` from `.env.local` afterward. The server function route should be protected by WAF/rate limiting in production.
