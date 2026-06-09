-- ==============================================================================
-- DEMO SEED: CREATE A SAMPLE COLLECTION
-- ==============================================================================

-- 1. Insert a demo collection named "Summer Eclipse 2026"
WITH new_collection AS (
  INSERT INTO public.collections (name, slug, description, banner_url, status, collection_type)
  VALUES (
    'Summer Eclipse 2026', 
    'summer-eclipse', 
    'A breathtaking collection blending lightweight fabrics with avant-garde dark aesthetic. Designed specifically for mobility and statement.',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
    'active',
    'manual'
  )
  RETURNING id
)
-- 2. Link this collection to the first 5 existing products in your database
INSERT INTO public.collection_products (collection_id, product_id)
SELECT (SELECT id FROM new_collection), id
FROM public.products
LIMIT 5;
