-- Add Unisex clothing categories to public.categories
INSERT INTO public.categories (id, name, slug, seo_keywords, seo_title_template)
VALUES 
    (gen_random_uuid(), 'Pakaian Unisex', 'pakaian-unisex', ARRAY['kaos unisex', 'oversize unisex', 'baju pria wanita', 't-shirt unisex', 'streetwear unisex'], 'Kaos Oversize Unisex "{name}" | NINOC'),
    (gen_random_uuid(), 'Unisex', 'unisex', ARRAY['fashion unisex', 'apparel unisex', 'baju pria wanita', 'oversize unisex'], 'Fashion Unisex "{name}" | NINOC')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    seo_keywords = EXCLUDED.seo_keywords,
    seo_title_template = EXCLUDED.seo_title_template;
