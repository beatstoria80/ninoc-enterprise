-- ==============================================================================
-- AFFILIATE CALCULATION & PAYOUT SYSTEM
-- ==============================================================================

-- 1. Affiliate Profiles (Extended info after approval)
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.affiliate_applications(id),
    referral_code TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10% commission
    
    -- Payout Information
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    
    -- Verification Documents
    ktp_url TEXT,
    rekening_koran_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Affiliate Clicks (Tracking traffic)
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id), -- Nullable if they link to homepage
    ip_address TEXT,
    user_agent TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Affiliate Commissions (Calculated Earnings)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    order_id UUID, -- Reference to the transaction/order
    order_amount DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    available_at TIMESTAMP WITH TIME ZONE -- When it becomes available to withdraw (e.g., 7 days after order)
);

-- 4. Affiliate Payouts (Withdrawal Requests)
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'rejected')),
    proof_url TEXT, -- Admin uploads transfer receipt
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Storage Buckets for Verification Documents
-- Note: Assuming you have a Supabase storage instance, you can create a bucket named 'affiliate_documents'
-- INSERT INTO storage.buckets (id, name, public) VALUES ('affiliate_documents', 'affiliate_documents', false);

-- 6. Setup Row Level Security
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admin full access" ON public.affiliate_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.affiliate_clicks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.affiliate_commissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.affiliate_payouts FOR ALL USING (auth.role() = 'authenticated');
