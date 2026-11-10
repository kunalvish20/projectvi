-- Run in Supabase SQL Editor on an existing Project VI database.
-- Update only the original seeded description; preserve descriptions edited in admin.
update public.products
set description = 'An 11-piece collection of Vice-inspired apparel, accessories, artwork, and display pieces in one Collector''s Box.',
    updated_at = now()
where id = 'gta-collector-box'
  and description = 'An 11-piece pre-' || 'order collection of Vice-inspired apparel, accessories, artwork, and display pieces in one Collector''s Box.';
