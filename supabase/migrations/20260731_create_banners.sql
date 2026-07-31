-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    desktop_image_url TEXT,
    tablet_image_url TEXT,
    mobile_image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for banners table
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on banners"
ON public.banners FOR SELECT
USING (true);

CREATE POLICY "Enable all access for admin on banners"
ON public.banners FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.admin_roles ar
        WHERE ar.user_id = auth.uid()
    )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.banners;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create banners bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for banners bucket
CREATE POLICY "Public Access to Banners Bucket" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'banners' );

CREATE POLICY "Admin Upload Access to Banners Bucket" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
    bucket_id = 'banners' 
    AND EXISTS (
        SELECT 1
        FROM public.admin_roles ar
        WHERE ar.user_id = auth.uid()
    )
);

CREATE POLICY "Admin Update Access to Banners Bucket" 
ON storage.objects FOR UPDATE 
USING ( 
    bucket_id = 'banners' 
    AND EXISTS (
        SELECT 1
        FROM public.admin_roles ar
        WHERE ar.user_id = auth.uid()
    )
);

CREATE POLICY "Admin Delete Access to Banners Bucket" 
ON storage.objects FOR DELETE 
USING ( 
    bucket_id = 'banners' 
    AND EXISTS (
        SELECT 1
        FROM public.admin_roles ar
        WHERE ar.user_id = auth.uid()
    )
);
