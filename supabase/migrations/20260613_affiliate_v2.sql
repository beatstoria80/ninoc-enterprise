-- 20260613_affiliate_v2.sql

-- 1. Add Customer Discount feature to Affiliates
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS customer_discount_type TEXT CHECK (customer_discount_type IN ('percentage', 'fixed_amount')),
ADD COLUMN IF NOT EXISTS customer_discount_value DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_approve_withdrawals BOOLEAN DEFAULT false;

-- 2. Create Affiliate Withdrawals table (Redeem system)
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status public.withdrawal_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID -- Admin who processed the withdrawal
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);

-- Enable RLS
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_withdrawals
CREATE POLICY "Affiliates can view their own withdrawals"
ON public.affiliate_withdrawals FOR SELECT
USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Affiliates can insert their own withdrawals"
ON public.affiliate_withdrawals FOR INSERT
WITH CHECK (
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow service role full access on withdrawals"
ON public.affiliate_withdrawals USING (true) WITH CHECK (true);

-- 3. Function to safely request withdrawal
CREATE OR REPLACE FUNCTION request_affiliate_withdrawal(
    p_affiliate_id UUID,
    p_amount DECIMAL,
    p_bank_name TEXT,
    p_account_number TEXT,
    p_account_name TEXT
) RETURNS UUID AS $$
DECLARE
    v_current_balance DECIMAL;
    v_withdrawal_id UUID;
BEGIN
    -- Lock the affiliate row to prevent double spending
    SELECT balance INTO v_current_balance
    FROM public.affiliates
    WHERE id = p_affiliate_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'Affiliate not found.';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal.';
    END IF;

    -- Deduct balance
    UPDATE public.affiliates
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_affiliate_id;

    -- Create withdrawal record
    INSERT INTO public.affiliate_withdrawals (
        affiliate_id, amount, bank_name, account_number, account_name, status
    ) VALUES (
        p_affiliate_id, p_amount, p_bank_name, p_account_number, p_account_name, 'pending'
    ) RETURNING id INTO v_withdrawal_id;

    RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
