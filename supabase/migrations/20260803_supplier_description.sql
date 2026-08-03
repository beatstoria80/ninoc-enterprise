-- Migration to add description field to suppliers
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS description TEXT;
