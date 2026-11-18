# Project VI — React storefront + Supabase Commerce Admin + PayU

Checkout uses PayU Hosted Checkout for the Collector's Box. A pending order is created server-side, payment is verified against PayU, and the customer sees a thank-you page only after confirmation. Admin is at **`/admin`**.

## Quick setup (one-time)

Requirements: **Node.js 20.19+ / 22+**, npm, Supabase schema, and PayU India merchant credentials.

1. `npm install`
2. Copy `.env.example` to ignored `.env.local`. Fill the Supabase URL, public anon key, server-only service role key, PayU merchant key and salt, `PAYU_ENV`, and the HTTPS `PUBLIC_SITE_URL`. Keep the file private. The service role key and PayU salt must never have a `VITE_` prefix.
3. In **Supabase Dashboard > SQL Editor**, run **`supabase/schema.sql`** for a new database. For an existing Project VI database, confirm that `products`, `orders`, `customers`, and the `order_paid` trigger from that schema exist, then run `supabase/payu-orders.sql` for payment status and order triggers and apply any other missing schema changes. API keys cannot create SQL tables automatically.
4. Put a unique strong password in `ADMIN_INITIAL_PASSWORD` in the ignored `.env.local` file. Run **`npm run setup:admins`** once. It creates or updates only `workdndstores@gmail.com` in Supabase Auth and confirms that email. For an existing Supabase project, also run **`supabase/only-workdndstores-admin.sql`** in the SQL Editor to replace the old two-email database allowlist. The provisioning script cannot change SQL policies through a service-role API key.
5. `npm run dev` and open `http://localhost:5173` for store and `http://localhost:5173/admin` for admin. **Admin login accepts ONLY the one confirmed Supabase Auth identity in `public.is_admin()`; a UI-only email check is never considered sufficient.** No registration route exists. `npm run dev` runs the payment server routes locally using the Vite middleware.

After configuring Supabase, verify the `orders` and `products` tables are reachable and that `products` contains the seeded `gta-collector-box` item with the intended price and stock. Test one PayU sandbox success, failure, and delayed payment; check the matching transaction, payment status, stock change, and `PV-01` style order ID in `/admin/orders`. Order numbers are assigned when an attempt starts, so failed or abandoned attempts also consume numbers.

> PayU callbacks require a publicly reachable HTTPS origin. For local payment tests, expose Vite through an HTTPS tunnel and set `PUBLIC_SITE_URL` to that origin, or deploy on Vercel. The current `.env.local` may still contain sample placeholders; replace every one before testing.

## Environment variables

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser | Public Project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Public anon/publishable key. RLS enabled. |
| `SUPABASE_URL` | Serverless functions & provisioning | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Secret; bypasses RLS; **never expose** |
| `ORDER_EMAIL_FROM` | Server only | Gmail address used for manual order confirmation emails |
| `GMAIL_APP_PASSWORD` | Server only | Gmail App Password for that address; requires Google 2-Step Verification. Never expose or commit |
| `PAYU_MERCHANT_KEY` | Server and signed PayU form | Public merchant identifier; the salt stays server-only |
| `PAYU_MERCHANT_SALT` | Server only | **Secret** PayU Salt |
| `PAYU_ENV` | Server only | `test` or `production` |
| `PUBLIC_SITE_URL` | Server only | Public origin used for PayU callbacks |
| `ADMIN_INITIAL_PASSWORD` | Local admin provisioning only | Strong password for the one authorized account; keep it only in ignored `.env.local` and remove after provisioning |

### Deploy to Vercel

Connect the GitHub repository to Vercel. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_ENV`, and `PUBLIC_SITE_URL=https://your-real-domain.com` in **Vercel > Project Settings > Environment Variables**, then redeploy. Use `PAYU_ENV=production` only with live credentials; `live` is not a supported value. `PUBLIC_SITE_URL` must be the exact deployed HTTPS origin, without a trailing slash. `/api/*` routes use Vercel Node serverless functions.

To send manual order confirmations, set `ORDER_EMAIL_FROM` to the exact Gmail sender address and `GMAIL_APP_PASSWORD` to its Gmail App Password in the server environment, then redeploy. In Admin → **Send order email**, enter the customer's address and optionally their name/reference. The server verifies the signed-in admin and requires the payment-confirmed checkbox before sending the fixed template. Sending an email does not mark an order as paid in Supabase; verify payment separately. The admin screen shows success when Gmail accepts the message, which does not guarantee inbox delivery. Gmail may limit or block production SMTP traffic, so test delivery from the deployed site before relying on this for customers.

### PayU flow and data integrity

The customer enters delivery details and sees the product total with free standard delivery. Entering `Dax1` in checkout and pressing Apply changes the entire order total to INR 1. `/api/payu-quote` checks the code for display; `/api/payu-create` independently validates it and calculates the signed PayU amount from the current Supabase product price. The coupon is currently coded for this checkout and is not controlled by the admin Discounts table. A pending order is created server-side. The PayU return and webhook validate the reverse hash; success is confirmed again through PayU `verify_payment` with matching transaction, amount, and PayU ID before the order becomes paid. The callback redirects to `/payment-result`, where `/api/payu-status` checks the originating browser's private token. Verified paid orders move straight to `/thank-you`; failed payments show a retry screen with delivery details preserved. Unconfirmed payments remain pending and can be rechecked without paying again. The database trigger decrements stock on the first paid transition, and the admin can recheck any order through **Verify with PayU**.

In PayU Dashboard > Developers > Webhooks, create **Payments / Successful** and **Payments / Failed** webhooks pointing to `https://your-real-domain.com/api/payu-webhook`. The signed webhook helps settle payments when the browser does not return; the normal `surl`/`furl` callback and Verify Payment API also work without it. Test the webhook and browser return in PayU sandbox before switching to live credentials. Confirm dashboard settlement and keep an eye on unresolved pending orders. Courier labels, refunds, and automated customer email need separate integrations.

## Admin modules

Overview, Orders, Payments, Shipping, Inventory, Customers, and the other admin modules remain available. Orders display `PV-01`, `PV-02`, etc. for both paid and pending attempts. Payment status can only be confirmed by server-side PayU verification; use **Verify with PayU** on an order to reconcile a delayed result.

**Important feature boundaries**: The uploaded storefront currently sells the original **single Collector's Box**. Editing its title, description and price in Admin syncs back to its existing storefront content (layout unchanged); other products and collections are **admin data records** until new public listing pages are developed. Except for the coded `Dax1` offer, admin Discounts records do not change live checkout. Content blocks, marketing campaigns, reviews and tax rates are **admin-managed data**, not automatically wired to live checkout or static homepage. Marketing sending, courier label generation, automatic refunds, GST tax invoices, Google Analytics and third-party services **require separate live credentials and provider-specific integrations**. The UI describes these boundaries, rather than pretending they're implemented.

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
