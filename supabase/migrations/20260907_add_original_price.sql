-- Migration to add original_price to products for "Harga Coret" feature
ALTER TABLE public.products ADD COLUMN original_price integer;
