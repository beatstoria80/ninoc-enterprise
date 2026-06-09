-- ==============================================================================
-- PARTNER APPLICATIONS SCHEMA (Wholesale & Affiliate)
-- ==============================================================================

-- 1. Create enum for application status
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create Wholesale Applications Table
CREATE TABLE public.wholesale_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    social_link TEXT,
    address TEXT NOT NULL,
    npwp TEXT,
    status application_status DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create Affiliate Applications Table
CREATE TABLE public.affiliate_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    platform_type TEXT NOT NULL,
    social_link TEXT NOT NULL,
    address TEXT NOT NULL,
    npwp TEXT,
    status application_status DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Setup Row Level Security (RLS)
ALTER TABLE public.wholesale_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (submit application)
CREATE POLICY "Allow public insert to wholesale" 
ON public.wholesale_applications FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow public insert to affiliate" 
ON public.affiliate_applications FOR INSERT 
TO public 
WITH CHECK (true);

-- Only authenticated users (Admins) can view and update
CREATE POLICY "Allow authenticated full access to wholesale" 
ON public.wholesale_applications FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to affiliate" 
ON public.affiliate_applications FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Create Trigger for updated_at
CREATE OR REPLACE FUNCTION update_partner_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wholesale_updated_at
    BEFORE UPDATE ON public.wholesale_applications
    FOR EACH ROW
    EXECUTE PROCEDURE update_partner_updated_at_column();

CREATE TRIGGER update_affiliate_updated_at
    BEFORE UPDATE ON public.affiliate_applications
    FOR EACH ROW
    EXECUTE PROCEDURE update_partner_updated_at_column();
