-- PROJECT VI — Run once in Supabase SQL Editor. Run in a new project or review existing objects first.
-- Admin identity: only the verified email address below; passwords are stored ONLY in Supabase Auth.
create extension if not exists pgcrypto;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (
  select 1 from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null
    and lower(u.email) = 'workdndstores@gmail.com'
 );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.products (
 id text primary key, name text not null, short_name text, description text default '',
 category text default 'Collectibles', sku text default '', image_url text default '',
 price numeric(12,2) not null default 0 check (price >= 0),
 compare_at_price numeric(12,2) not null default 0,
 inventory integer not null default 0 check(inventory >= 0),
 active boolean not null default true, featured boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
insert into public.products(id,name,short_name,description,category,sku,image_url,price,compare_at_price,inventory,active,featured)
values ('gta-collector-box', 'GTA VI Collector''s Box', 'Collector''s Box', 'An 11-piece pre-order collection of Vice-inspired apparel, accessories, artwork, and display pieces in one Collector''s Box.', 'Collector''s Edition', 'PROJECTVI-BOX', '/assets/collector-box.webp', 6499,9999,100,true,true)
on conflict(id) do nothing;

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number bigint generated always as identity unique,
 txnid text not null unique, access_hash text not null,
 product_id text not null references public.products(id), product_name text not null,
 quantity integer not null check(quantity between 1 and 10), amount numeric(12,2) not null check(amount > 0),
 customer_name text not null,customer_email text not null, customer_phone text not null,
 address text not null, city text not null, state text not null, pincode text not null,
 order_status text not null default 'pending_payment',
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
 payment_provider text not null default 'payu', payu_payment_id text,
 fulfillment_status text not null default 'unfulfilled',
 carrier text default '', tracking_number text default '', notes text default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_email_idx on public.orders(customer_email);

create table if not exists public.customers (
 id uuid primary key default gen_random_uuid(),email text not null unique,name text default '',phone text default '',
 tags text default '', notes text default '', created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.collections (
 id uuid primary key default gen_random_uuid(),name text not null,slug text not null unique,description text default '',active boolean default true,created_at timestamptz not null default now()
);
create table if not exists public.inventory_movements (
 id uuid primary key default gen_random_uuid(),product_id text references public.products(id),quantity_change integer not null,
 reason text default '',created_at timestamptz not null default now()
);
create table if not exists public.returns (
 id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id),type text default 'return',reason text default '',status text default 'requested',refund_amount numeric(12,2) default 0,notes text default '',created_at timestamptz not null default now()
);
create table if not exists public.discounts (
 id uuid primary key default gen_random_uuid(),code text not null unique,kind text default 'percent',value numeric(12,2) not null default 0,minimum_amount numeric(12,2) default 0,usage_limit integer default 0,active boolean default true,starts_at timestamptz,ends_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(),name text not null,channel text default 'email',status text default 'draft',audience text default '',content text default '',created_at timestamptz not null default now()
);
create table if not exists public.content_blocks (
 id uuid primary key default gen_random_uuid(),key text not null unique,title text not null,body text default '',image_url text default '',status text default 'draft',created_at timestamptz not null default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),product_id text references public.products(id),author text not null,rating integer not null default 5 check(rating between 1 and 5),body text default '',status text default 'pending',created_at timestamptz not null default now()
);
create table if not exists public.tax_rates (
 id uuid primary key default gen_random_uuid(),name text not null,rate numeric(5,2) default 0,hsn text default '',active boolean default true,created_at timestamptz not null default now()
);
create table if not exists public.tickets (
 id uuid primary key default gen_random_uuid(),subject text not null,customer_email text default '',priority text default 'normal',status text default 'open',message text default '',created_at timestamptz not null default now()
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),title text not null,body text default '',severity text default 'info',read boolean default false,created_at timestamptz not null default now()
);
create table if not exists public.settings (
 id uuid primary key default gen_random_uuid(),key text not null unique,value text default '',description text default '',created_at timestamptz not null default now()
);

-- Automatically maintain customers after a server-created order.
create or replace function public.order_created_hook() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.customers(email,name,phone)
 values(lower(new.customer_email),new.customer_name,new.customer_phone)
 on conflict(email) do update set name=excluded.name,phone=excluded.phone,updated_at=now();
 return new;
end;$$;
drop trigger if exists order_created on public.orders;
create trigger order_created after insert on public.orders for each row execute function public.order_created_hook();

-- Decrement stock only once on a pending/failed -> paid transition.
create or replace function public.order_paid_hook() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.payment_status='paid' and old.payment_status is distinct from 'paid' then
   update public.products set inventory=greatest(0,inventory-new.quantity),updated_at=now() where id=new.product_id;
 end if;
 return new;
end;$$;
drop trigger if exists order_paid on public.orders;
create trigger order_paid after update on public.orders for each row execute function public.order_paid_hook();

-- RLS: nobody can view customers/orders or mutate admin records without a verified admin identity.
do $$ declare tbl text;begin
 foreach tbl in array array['products','orders','customers','collections','inventory_movements','returns','discounts','campaigns','content_blocks','reviews','tax_rates','tickets','notifications','settings'] loop
   execute format('alter table public.%I enable row level security',tbl);
   execute format('drop policy if exists "projectvi admin read" on public.%I',tbl);
   execute format('drop policy if exists "projectvi admin insert" on public.%I',tbl);
   execute format('drop policy if exists "projectvi admin update" on public.%I',tbl);
   execute format('drop policy if exists "projectvi admin delete" on public.%I',tbl);
   execute format('create policy "projectvi admin read" on public.%I for select to authenticated using ((select public.is_admin()))',tbl);
   execute format('create policy "projectvi admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))',tbl);
   execute format('create policy "projectvi admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',tbl);
   execute format('create policy "projectvi admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))',tbl);
 end loop;
end $$;
drop policy if exists "projectvi public visible products" on public.products;
create policy "projectvi public visible products" on public.products for select to anon using (active=true);
-- Enforce server-only payment/order creation. Admins can edit only fulfillment/order-service columns.
revoke insert,delete,update on public.orders from anon,authenticated;
grant select on public.orders to authenticated;
grant update(order_status,fulfillment_status,carrier,tracking_number,notes,updated_at) on public.orders to authenticated;
-- Orders should be written by service_role from authenticated serverless functions.
-- Ensure service_role maintains full access after the above revokes.
grant all on public.orders to service_role;
grant usage,select on sequence public.orders_order_number_seq to service_role;
-- Public product catalog read access
 grant select on public.products to anon,authenticated;
-- Other admin-owned tables are available to authenticated users only when RLS allows it.
do $$ declare tbl text;begin
 foreach tbl in array array['customers','collections','inventory_movements','returns','discounts','campaigns','content_blocks','reviews','tax_rates','tickets','notifications','settings'] loop
 execute format('grant select,insert,update,delete on public.%I to authenticated',tbl);
 end loop;
end $$;
 grant insert,update,delete on public.products to authenticated;
-- No direct access to private admin data for unauthenticated visitors.
