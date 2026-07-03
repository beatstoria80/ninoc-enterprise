-- Add customer contact columns to orders table if they don't exist
-- These are used by the checkout API to store customer contact info directly on the order

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS snap_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_url TEXT;
