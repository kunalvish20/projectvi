-- Run in the same Supabase SQL Editor project as the storefront.
-- Contact page email submissions stay private to the authorized admin.
create table if not exists public.contact_emails (
 id uuid primary key default gen_random_uuid(),
 email text not null check (char_length(email) <= 180),
 created_at timestamptz not null default now()
);
create index if not exists contact_emails_created_at_idx on public.contact_emails(created_at desc);
alter table public.contact_emails enable row level security;
drop policy if exists "projectvi admin read" on public.contact_emails;
create policy "projectvi admin read" on public.contact_emails
 for select to authenticated using ((select public.is_admin()));
revoke all on public.contact_emails from anon, authenticated;
grant select on public.contact_emails to authenticated;
grant all on public.contact_emails to service_role;
