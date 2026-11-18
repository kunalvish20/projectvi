-- Run once on an existing Project VI database after reviewing existing order states.
-- Prevent a pending/failed payment from being labelled confirmed or fulfilled.
do $$ begin
 if not exists (select 1 from pg_constraint where conname='orders_paid_before_fulfillment' and conrelid='public.orders'::regclass) then
  alter table public.orders add constraint orders_paid_before_fulfillment
   check (payment_status in ('paid','refunded') or (order_status not in ('confirmed','processing','shipped','delivered') and fulfillment_status='unfulfilled')) not valid;
 end if;
end $$;

-- Ensure stock changes exactly once when PayU verification first marks an order paid.
create or replace function public.order_paid_hook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.payment_status='paid' and old.payment_status is distinct from 'paid' then
  update public.products
   set inventory=greatest(0,inventory-new.quantity),updated_at=now()
   where id=new.product_id;
 end if;
 return new;
end;$$;
drop trigger if exists order_paid on public.orders;
create trigger order_paid after update on public.orders
for each row execute function public.order_paid_hook();

-- Keep the admin customer list in sync with server-created orders.
create or replace function public.order_created_hook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.customers(email,name,phone)
 values(lower(new.customer_email),new.customer_name,new.customer_phone)
 on conflict(email) do update
  set name=excluded.name,phone=excluded.phone,updated_at=now();
 return new;
end;$$;
drop trigger if exists order_created on public.orders;
create trigger order_created after insert on public.orders
for each row execute function public.order_created_hook();
