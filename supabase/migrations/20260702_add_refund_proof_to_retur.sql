ALTER TABLE public.retur_requests
ADD COLUMN IF NOT EXISTS refund_proof_url TEXT;
