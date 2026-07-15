-- ==============================================================================
-- MIGRATION: 20260715_seed_objects_taxonomy.sql
-- PURPOSE: Seeding canonical, mutually exclusive industry-standard taxonomy for
-- Objects & Consumer Goods into public.categories with complete SEO metadata and
-- anti-duplication conflict resolution.
-- ==============================================================================

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

INSERT INTO public.categories (id, name, slug, seo_keywords, seo_title_template)
VALUES 
    (gen_random_uuid(), 'Utilities & Alat Tulis', 'utilities', ARRAY['alat tulis premium', 'stationery kit', 'organizer meja', 'notebook kulit minimalis', 'edc essentials'], 'Utilities & Stationery "{name}" | NINOC Objects'),
    (gen_random_uuid(), 'Peralatan Rumah / Home Goods', 'home', ARRAY['home decor minimalis', 'pengharum ruangan diffuser', 'lampu meja estetis', 'koleksi dekorasi rumah', 'living essentials'], 'Peralatan Rumah & Home Goods "{name}" | NINOC Living'),
    (gen_random_uuid(), 'Kitchen & Dining', 'kitchen', ARRAY['cutlery stainless', 'cangkir keramik kopi', 'peralatan makan kayu jati', 'koleksi dapur estetik', 'tableware premium'], 'Kitchen & Dining Collection "{name}" | NINOC Tableware'),
    (gen_random_uuid(), 'Seni / Collectibles', 'collectibles', ARRAY['studio art print', 'patung keramik koleksi', 'limited edition collectibles', 'objek seni interior', 'arsip studio mfg'], 'Seni & Studio Collectibles "{name}" | NINOC Studio')

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    seo_keywords = EXCLUDED.seo_keywords,
    seo_title_template = EXCLUDED.seo_title_template,
    updated_at = timezone('utc'::text, now());
