-- Create enum for affiliate tiers
CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold');

-- Affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    application_id UUID, -- Reference to affiliate_applications
    code VARCHAR(50) UNIQUE NOT NULL,
    tier affiliate_tier DEFAULT 'bronze',
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate links table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add affiliate_id to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Affiliate commissions table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, available, paid, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at on affiliates
CREATE OR REPLACE FUNCTION update_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION update_affiliates_updated_at();

-- Trigger for updated_at on affiliate_commissions
CREATE OR REPLACE FUNCTION update_affiliate_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_commissions_updated_at
BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_commissions_updated_at();

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for affiliates
CREATE POLICY "Affiliates can view own profile" 
ON public.affiliates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all affiliates" 
ON public.affiliates FOR SELECT 
USING (auth.jwt()->>'role' = 'admin' OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can insert affiliates" 
ON public.affiliates FOR INSERT 
WITH CHECK (auth.jwt()->>'role' = 'admin' OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update affiliates" 
ON public.affiliates FOR UPDATE 
USING (auth.jwt()->>'role' = 'admin' OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for affiliate links
CREATE POLICY "Anyone can view affiliate links" 
ON public.affiliate_links FOR SELECT 
USING (true);

CREATE POLICY "Affiliates can create own links" 
ON public.affiliate_links FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

CREATE POLICY "Affiliates can update own links" 
ON public.affiliate_links FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

CREATE POLICY "Admin can manage all affiliate links" 
ON public.affiliate_links FOR ALL 
USING (auth.jwt()->>'role' = 'admin' OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Policies for affiliate commissions
CREATE POLICY "Affiliates can view own commissions" 
ON public.affiliate_commissions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

CREATE POLICY "Admin can manage all commissions" 
ON public.affiliate_commissions FOR ALL 
USING (auth.jwt()->>'role' = 'admin' OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
