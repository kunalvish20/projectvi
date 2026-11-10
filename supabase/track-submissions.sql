-- Run once in Supabase SQL Editor for an existing Project VI database.
-- Public forms use server functions; only the authorized admin can read the saved details.
create table if not exists public.checkout_submissions (
 id uuid primary key default gen_random_uuid(), reference text not null unique,
 product_id text not null references public.products(id), product_name text not null,
 quantity integer not null check(quantity between 1 and 10),
 amount numeric(12,2) not null check(amount > 0), handling_fee numeric(12,2) not null default 0,
 customer_name text not null, customer_email text not null, customer_phone text not null,
 address text not null, city text not null, state text not null, pincode text not null,
 created_at timestamptz not null default now()
);
create index if not exists checkout_submissions_created_at_idx on public.checkout_submissions(created_at desc);
create index if not exists checkout_submissions_email_idx on public.checkout_submissions(customer_email);

create table if not exists public.creator_applications (
 id uuid primary key default gen_random_uuid(), name text not null, email text not null,
 interest text not null, social_link text not null, second_link text not null default '',
 message text not null default '', status text not null default 'new'
  check(status in ('new','contacted','approved','declined')),
 notes text not null default '', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists creator_applications_created_at_idx on public.creator_applications(created_at desc);

alter table public.checkout_submissions enable row level security;
alter table public.creator_applications enable row level security;
drop policy if exists "projectvi admin read" on public.checkout_submissions;
drop policy if exists "projectvi admin read" on public.creator_applications;
drop policy if exists "projectvi admin update" on public.creator_applications;
create policy "projectvi admin read" on public.checkout_submissions for select to authenticated using ((select public.is_admin()));
create policy "projectvi admin read" on public.creator_applications for select to authenticated using ((select public.is_admin()));
create policy "projectvi admin update" on public.creator_applications for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
revoke all on public.checkout_submissions, public.creator_applications from anon, authenticated;
grant select on public.checkout_submissions to authenticated;
grant select, update(status,notes,updated_at) on public.creator_applications to authenticated;
grant all on public.checkout_submissions, public.creator_applications to service_role;
