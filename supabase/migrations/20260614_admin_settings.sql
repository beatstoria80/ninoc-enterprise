-- Migration: Create atelier_settings table for admin configurations
-- This table stores flexible JSON configurations such as store info, schedules, delivery settings

CREATE TABLE IF NOT EXISTS public.atelier_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.atelier_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (since storefront needs to know some settings like decoration and store info)
CREATE POLICY "Allow public read access on atelier_settings" 
ON public.atelier_settings FOR SELECT USING (true);

-- The backend API (api/admin/settings) uses the Service Role key to bypass RLS for UPSERT,
-- so we don't strictly need an INSERT/UPDATE policy here for standard authenticated users,
-- but for robustness, if we want admins to write directly from frontend in the future:
-- CREATE POLICY "Allow authenticated users to manage settings" 
-- ON public.atelier_settings FOR ALL USING (auth.role() = 'authenticated');
