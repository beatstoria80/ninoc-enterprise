-- ==============================================================
-- MIGRATION: COLLECTIONS
-- ==============================================================

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    banner_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- 'active', 'scheduled', 'draft'
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    collection_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'smart'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create collection_products table (Many-to-Many relation)
CREATE TABLE IF NOT EXISTS public.collection_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active collections
CREATE POLICY "Public read access for collections" 
ON public.collections FOR SELECT USING (true);

CREATE POLICY "Public read access for collection_products" 
ON public.collection_products FOR SELECT USING (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Admin full access collections" 
ON public.collections FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access collection_products" 
ON public.collection_products FOR ALL 
USING (auth.role() = 'authenticated');

-- 4. Enable real-time
alter publication supabase_realtime add table public.collections;
alter publication supabase_realtime add table public.collection_products;
