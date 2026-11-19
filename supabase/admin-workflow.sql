-- Run in the connected Supabase SQL Editor before using the new dashboard actions.
-- Archiving changes only admin visibility; it never changes a PayU payment result.
alter table public.orders add column if not exists archived_at timestamptz;
create index if not exists orders_archived_at_idx on public.orders(archived_at);
grant update(archived_at) on public.orders to authenticated;

-- Draft review is a follow-up workflow, not a payment or placed order.
alter table public.checkout_drafts
 add column if not exists review_status text not null default 'pending',
 add column if not exists review_note text not null default '';
do $$ begin
 if not exists (select 1 from pg_constraint where conname = 'checkout_drafts_review_status_check' and conrelid = 'public.checkout_drafts'::regclass) then
  alter table public.checkout_drafts add constraint checkout_drafts_review_status_check
   check (review_status in ('pending','confirmed','archived'));
 end if;
end $$;
drop policy if exists "projectvi admin update" on public.checkout_drafts;
create policy "projectvi admin update" on public.checkout_drafts for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
grant update(review_status,review_note) on public.checkout_drafts to authenticated;

-- A later storefront autosave must not erase the admin's follow-up decision.
create or replace function public.checkout_draft_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 new.created_at := old.created_at;
 if (select auth.role()) = 'authenticated' then
  new.updated_at := old.updated_at;
 else
  new.updated_at := now();
 end if;
 if (select auth.role()) = 'service_role' then
  new.review_status := old.review_status;
  new.review_note := old.review_note;
 end if;
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
