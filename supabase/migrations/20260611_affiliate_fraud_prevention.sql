-- Add affiliate_eligible flag to products table to allow granular commission control
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS affiliate_eligible BOOLEAN DEFAULT false;

-- Optional: Create an index for faster filtering of eligible products
CREATE INDEX IF NOT EXISTS idx_products_affiliate_eligible ON public.products(affiliate_eligible);

-- Note: In a production environment, you would manually update specific products to true.
-- Example: UPDATE public.products SET affiliate_eligible = true WHERE category = 'pakaian';
