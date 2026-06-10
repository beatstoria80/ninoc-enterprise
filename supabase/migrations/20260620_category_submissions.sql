-- Phase 6: Category Architecture & Supplier Product Submissions

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Sub-Categories Table
CREATE TABLE IF NOT EXISTS public.sub_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, slug)
);

-- 3. Supplier Product Submissions Table
CREATE TABLE IF NOT EXISTS public.supplier_product_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    sub_category_id UUID REFERENCES public.sub_categories(id),
    
    product_name TEXT NOT NULL,
    description TEXT,
    specifications JSONB,
    base_hpp DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    
    images TEXT[], -- array of image URLs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_submissions
    BEFORE UPDATE ON public.supplier_product_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Alter products table to link to Categories
-- Note: existing 'category' column is TEXT. We add category_id for relation.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE SET NULL;


-- RLS Security Policies

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_product_submissions ENABLE ROW LEVEL SECURITY;

-- Categories are readable by all (authenticated or not, as it's needed for the storefront)
CREATE POLICY "Public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin full access categories" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Public read access to sub_categories" ON public.sub_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access sub_categories" ON public.sub_categories FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Submissions Security
CREATE POLICY "Supplier users can read their own submissions" ON public.supplier_product_submissions FOR SELECT
USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

CREATE POLICY "Supplier users can insert their own submissions" ON public.supplier_product_submissions FOR INSERT
WITH CHECK (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()));

CREATE POLICY "Supplier users can update their own pending submissions" ON public.supplier_product_submissions FOR UPDATE
USING (supplier_id IN (SELECT supplier_id FROM public.supplier_users WHERE user_id = auth.uid()) AND status = 'pending');

CREATE POLICY "Admin full access submissions" ON public.supplier_product_submissions FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Initial seeding of some categories
INSERT INTO public.categories (name, slug, description) VALUES
('Apparel', 'apparel', 'Clothing and fashion items'),
('Accessories', 'accessories', 'Fashion accessories, bags, and jewelry'),
('Footwear', 'footwear', 'Shoes, boots, and sandals')
ON CONFLICT (slug) DO NOTHING;
