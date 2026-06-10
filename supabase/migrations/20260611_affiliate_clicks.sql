-- 20260611_affiliate_clicks.sql

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast counts
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);

-- Enable RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon/authenticated (if tracked via API route with anon key)
-- or allow all if using service role. We will use service role to insert.
CREATE POLICY "Allow service role full access on affiliate_clicks"
ON public.affiliate_clicks
USING (true)
WITH CHECK (true);
