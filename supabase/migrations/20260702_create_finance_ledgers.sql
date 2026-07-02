CREATE TABLE IF NOT EXISTS public.finance_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sales', 'refund', 'opex', 'cogs', 'tax', 'adjustment')),
    debit DECIMAL(12,2) DEFAULT 0 NOT NULL,
    credit DECIMAL(12,2) DEFAULT 0 NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0 NOT NULL,
    reference_id TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.finance_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated admins full access to finance_ledgers"
ON public.finance_ledgers FOR ALL
USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_finance_ledgers_type ON public.finance_ledgers(type);
CREATE INDEX IF NOT EXISTS idx_finance_ledgers_date ON public.finance_ledgers(transaction_date);

CREATE OR REPLACE FUNCTION public.calculate_finance_ledger_balance()
RETURNS TRIGGER AS $$
DECLARE
    prev_balance DECIMAL(12,2);
BEGIN
    -- Only calculate if it's a new insert without an explicitly set balance
    SELECT balance INTO prev_balance FROM public.finance_ledgers ORDER BY transaction_date DESC, created_at DESC LIMIT 1;
    IF prev_balance IS NULL THEN
        prev_balance := 0;
    END IF;
    NEW.balance := prev_balance + NEW.debit - NEW.credit;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_finance_ledger_balance ON public.finance_ledgers;
CREATE TRIGGER trg_calculate_finance_ledger_balance
BEFORE INSERT ON public.finance_ledgers
FOR EACH ROW
EXECUTE FUNCTION public.calculate_finance_ledger_balance();
