-- ==============================================================================
-- MIGRATION: 20260715_seed_pantry_fnb_taxonomy.sql
-- PURPOSE: Seeding canonical, mutually exclusive industry-standard taxonomy for
-- Pantry & Café (F&B) into public.categories with complete SEO metadata and
-- anti-duplication conflict resolution.
-- ==============================================================================

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

INSERT INTO public.categories (id, name, slug, seo_keywords, seo_title_template)
VALUES 
    (gen_random_uuid(), 'Biji Kopi / Roasted Beans', 'coffee', ARRAY['kopi arabika', 'roasted coffee beans', 'single origin coffee', 'espresso blend', 'biji kopi pilihan', 'roastery bandung'], 'Biji Kopi & Roasted Beans "{name}" | NINOC Roastery'),
    (gen_random_uuid(), 'Pastry & Bakery', 'pastry', ARRAY['artisan pastry', 'fresh baked croissant', 'cookies gourmet', 'sourdough bread', 'daily baked goods'], 'Pastry & Bakery "{name}" | NINOC Café'),
    (gen_random_uuid(), 'Minuman RTD / Beverages', 'rtd', ARRAY['cold brew coffee', 'ready to drink tea', 'kombucha organik', 'signature bottled drinks', 'minuman siap saji'], 'Minuman RTD & Beverages "{name}" | NINOC Café'),
    (gen_random_uuid(), 'Camilan / Gourmet Snacks', 'snack', ARRAY['gourmet chips', 'kacang mete panggang', 'camilan sehat gluten free', 'artisan chocolate', 'dry snacks'], 'Camilan & Gourmet Snacks "{name}" | NINOC Pantry')

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    seo_keywords = EXCLUDED.seo_keywords,
    seo_title_template = EXCLUDED.seo_title_template,
    updated_at = timezone('utc'::text, now());
