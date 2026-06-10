-- 20260612_voucher_system.sql

-- Enum for voucher types
DO $$ BEGIN
    CREATE TYPE public.voucher_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Create Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type public.voucher_type NOT NULL,
    value DECIMAL(12, 2) NOT NULL, -- e.g. 20 for 20%, or 50000 for Rp50.000
    max_discount DECIMAL(12, 2), -- Cap for percentage discounts
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    usage_limit_total INT, -- Total number of times this voucher can be used by anyone
    usage_limit_per_user INT DEFAULT 1, -- Total number of times a single user can use it
    current_usage_count INT DEFAULT 0, -- Track total global usage
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    applicable_product_ids UUID[], -- Array of product IDs if restricted
    allow_affiliate_stacking BOOLEAN DEFAULT false, -- Whether it can be used alongside affiliate referral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);

-- 2. Create Voucher Usages table (Audit Log)
CREATE TABLE IF NOT EXISTS public.voucher_usages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID, -- If authenticated, reference auth.users or customers table (nullable for guests)
    customer_email TEXT NOT NULL, -- Keep track of email for guest checkout limits
    discount_applied DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for checking usage limit per user
CREATE INDEX IF NOT EXISTS idx_voucher_usages_email ON public.voucher_usages(voucher_id, customer_email);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usages ENABLE ROW LEVEL SECURITY;

-- Policies for vouchers
CREATE POLICY "Allow public read access to active vouchers"
ON public.vouchers FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

CREATE POLICY "Allow service role full access on vouchers"
ON public.vouchers USING (true) WITH CHECK (true);

-- Policies for voucher_usages
CREATE POLICY "Allow service role full access on voucher_usages"
ON public.voucher_usages USING (true) WITH CHECK (true);

-- Create a function to safely use a voucher (prevent race conditions)
CREATE OR REPLACE FUNCTION use_voucher(
    p_voucher_code TEXT,
    p_order_id UUID,
    p_customer_email TEXT,
    p_discount_applied DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_voucher_id UUID;
    v_current_usage INT;
    v_limit_total INT;
    v_limit_per_user INT;
    v_user_usage_count INT;
BEGIN
    -- Get voucher info with row lock
    SELECT id, current_usage_count, usage_limit_total, usage_limit_per_user
    INTO v_voucher_id, v_current_usage, v_limit_total, v_limit_per_user
    FROM public.vouchers
    WHERE code = p_voucher_code AND is_active = true 
      AND (valid_until IS NULL OR valid_until > NOW())
    FOR UPDATE;

    IF v_voucher_id IS NULL THEN
        RAISE EXCEPTION 'Voucher is invalid or expired.';
    END IF;

    -- Check global limit
    IF v_limit_total IS NOT NULL AND v_current_usage >= v_limit_total THEN
        RAISE EXCEPTION 'Voucher usage limit has been reached.';
    END IF;

    -- Check per user limit
    SELECT count(*) INTO v_user_usage_count
    FROM public.voucher_usages
    WHERE voucher_id = v_voucher_id AND customer_email = p_customer_email;

    IF v_user_usage_count >= v_limit_per_user THEN
        RAISE EXCEPTION 'You have reached the usage limit for this voucher.';
    END IF;

    -- Record usage
    INSERT INTO public.voucher_usages (voucher_id, order_id, customer_email, discount_applied)
    VALUES (v_voucher_id, p_order_id, p_customer_email, p_discount_applied);

    -- Update global count
    UPDATE public.vouchers
    SET current_usage_count = current_usage_count + 1,
        updated_at = NOW()
    WHERE id = v_voucher_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
