-- Run this in Supabase SQL Editor on the existing Project VI database.
-- Existing sessions for any other email will immediately lose admin table access.
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
