-- Add Reimburse Fields to retur_requests table
ALTER TABLE public.retur_requests
ADD COLUMN shipping_receipt_url TEXT,
ADD COLUMN customer_bank_code TEXT,
ADD COLUMN customer_bank_account TEXT,
ADD COLUMN customer_bank_account_name TEXT,
ADD COLUMN reimburse_status TEXT DEFAULT 'pending_validation' CHECK (reimburse_status IN ('pending_validation', 'validated', 'transferred', 'rejected')),
ADD COLUMN reimburse_amount INTEGER;
