-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    seo_keywords TEXT[] DEFAULT '{}',
    seo_title_template TEXT DEFAULT '{name} | NINOC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on categories" 
ON public.categories FOR SELECT 
USING (true);

-- Allow authenticated users (admin) to manage categories
CREATE POLICY "Allow authenticated full access on categories" 
ON public.categories FOR ALL 
USING (auth.role() = 'authenticated');

-- Insert initial default categories so the system doesn't break
INSERT INTO public.categories (id, name, slug, seo_keywords, seo_title_template)
VALUES 
    (gen_random_uuid(), 'Pakaian Pria', 'pakaian-pria', ARRAY['kaos pria', 'baju cowok', 'oversize pria', 't-shirt pria'], 'Kaos Oversize Pria "{name}" | NINOC'),
    (gen_random_uuid(), 'Pakaian Wanita', 'pakaian-wanita', ARRAY['baju wanita', 'atasan wanita', 'dress', 'blouse'], 'Baju Atasan Wanita "{name}" | NINOC'),
    (gen_random_uuid(), 'Aksesoris', 'aksesoris', ARRAY['aksesoris keren', 'kalung', 'gelang', 'topi'], 'Aksesoris "{name}" | NINOC')
ON CONFLICT (slug) DO NOTHING;

-- If products table already exists, we might want to add category_id
-- We will just use the existing 'category' TEXT column for now, but ensure the categories table maps to it via slug.
