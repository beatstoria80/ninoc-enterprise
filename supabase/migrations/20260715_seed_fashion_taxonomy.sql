-- ==============================================================================
-- MIGRATION: 20260715_seed_fashion_taxonomy.sql
-- PURPOSE: Seeding canonical, mutually exclusive industry-standard fashion taxonomy
-- into public.categories with SEO metadata and anti-duplication conflict resolution.
-- ==============================================================================

INSERT INTO public.categories (id, name, slug, seo_keywords, seo_title_template)
VALUES 
    -- TOPS (ATASAN)
    (gen_random_uuid(), 'Kaos / T-Shirt', 'kaos', ARRAY['kaos pria', 't-shirt wanita', 'kaos cotton heavyweight', 'kaos oversize', 'pocket tee'], 'Kaos T-Shirt Premium "{name}" | NINOC'),
    (gen_random_uuid(), 'Hoodie / Pullover', 'hoodie', ARRAY['hoodie fleece', 'pullover hoodie', 'hoodie tebal', 'jaket hoodie oversize'], 'Hoodie Pullover "{name}" | NINOC'),
    (gen_random_uuid(), 'Sweater / Crewneck', 'sweater', ARRAY['crewneck fleece', 'sweater knitwear', 'cardigan', 'crewneck tebal'], 'Sweater Crewneck "{name}" | NINOC'),
    (gen_random_uuid(), 'Kemeja / Flannel', 'kemeja', ARRAY['flannel shirt', 'kemeja lengan panjang', 'kemeja katun', 'oxford shirt'], 'Kemeja Flannel "{name}" | NINOC'),
    (gen_random_uuid(), 'Jaket & Outerwear', 'jaket', ARRAY['coach jacket', 'windbreaker', 'work coat', 'varsity jacket', 'outerwear'], 'Jaket Outerwear "{name}" | NINOC'),

    -- BOTTOMS (BAWAHAN)
    (gen_random_uuid(), 'Celana Panjang / Cargo', 'celana-panjang', ARRAY['celana cargo', 'trousers pria', 'celana jeans', 'chinos', 'celana panjang oversize'], 'Celana Panjang Cargo "{name}" | NINOC'),
    (gen_random_uuid(), 'Celana Pendek / Shorts', 'celana-pendek', ARRAY['boardshorts', 'sweat shorts', 'boxer utility', 'celana pendek santai'], 'Celana Pendek Shorts "{name}" | NINOC'),
    (gen_random_uuid(), 'Rok & Dress', 'rok-dress', ARRAY['rok lipit', 'pleated skirt', 'a-line skirt', 'dress wanita'], 'Rok & Dress "{name}" | NINOC'),

    -- ACCESSORIES & SPECIAL EDITIONS
    (gen_random_uuid(), 'Aksesoris / Headwear & Bags', 'aksesoris', ARRAY['topi baseball', 'beanie', 'totebag kanvas', 'kaos kaki', 'gelang'], 'Aksesoris "{name}" | NINOC'),
    (gen_random_uuid(), 'Unisex / Couple Set', 'unisex', ARRAY['baju couple', 'setelan unisex', 'streetwear co-ord set', 'sarimbit fashion'], 'Fashion Set Unisex "{name}" | NINOC'),
    (gen_random_uuid(), 'Arsip / Studio Edition', 'archive', ARRAY['studio edition', 'koleksi terbatas', 'archive mfg', 'limited release'], 'Studio Edition Archive "{name}" | NINOC')

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    seo_keywords = EXCLUDED.seo_keywords,
    seo_title_template = EXCLUDED.seo_title_template,
    updated_at = timezone('utc'::text, now());
