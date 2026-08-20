-- Add midtrans_fee and biteship_fee columns to public.product_costings table
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS midtrans_fee DECIMAL(12, 2) DEFAULT 0 NOT NULL;
ALTER TABLE public.product_costings ADD COLUMN IF NOT EXISTS biteship_fee DECIMAL(12, 2) DEFAULT 0 NOT NULL;
