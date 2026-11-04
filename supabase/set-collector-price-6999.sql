-- For an existing Project VI products table, run this in Supabase SQL Editor.
-- If public.products is missing, run schema.sql first; it seeds this price.
-- The storefront and PayU checkout both read this product row.
update public.products
set price = 6999,
    compare_at_price = 9999
where id = 'gta-collector-box';
