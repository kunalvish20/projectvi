-- Run once in the same Supabase SQL Editor project as the storefront.
-- Saves partial checkout details privately for admin review.
create table if not exists public.checkout_drafts (
 id uuid primary key,
 product_id text not null references public.products(id),
 product_name text not null,
 quantity integer not null check (quantity between 1 and 10),
 amount numeric(12,2) not null check (amount > 0),
 customer_name text not null default '',
 customer_email text not null default '',
 customer_phone text not null default '',
 address text not null default '',
 city text not null default '',
 state text not null default '',
 pincode text not null default '',
 status text not null default 'editing' check (status in ('editing','whatsapp_opened')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 whatsapp_opened_at timestamptz
);
create index if not exists checkout_drafts_updated_at_idx on public.checkout_drafts(updated_at desc);
alter table public.checkout_drafts enable row level security;
drop policy if exists "projectvi admin read" on public.checkout_drafts;
create policy "projectvi admin read" on public.checkout_drafts for select to authenticated using ((select public.is_admin()));
revoke all on public.checkout_drafts from anon, authenticated;
grant select on public.checkout_drafts to authenticated;
grant all on public.checkout_drafts to service_role;

-- A delayed autosave must never turn a WhatsApp click back into an abandoned checkout.
create or replace function public.checkout_draft_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 new.created_at := old.created_at;
 new.updated_at := now();
 if old.status = 'whatsapp_opened' then
   new.status := 'whatsapp_opened';
   new.whatsapp_opened_at := old.whatsapp_opened_at;
 elsif new.status = 'whatsapp_opened' then
   new.whatsapp_opened_at := now();
 end if;
 return new;
end;$$;
drop trigger if exists checkout_draft_update on public.checkout_drafts;
create trigger checkout_draft_update before update on public.checkout_drafts
for each row execute function public.checkout_draft_before_update();
