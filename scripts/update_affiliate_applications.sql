-- ==============================================================================
-- UPDATE AFFILIATE APPLICATIONS SCHEMA
-- ==============================================================================

-- Remove old single-platform fields
ALTER TABLE public.affiliate_applications DROP COLUMN IF EXISTS platform_type;
ALTER TABLE public.affiliate_applications DROP COLUMN IF EXISTS social_link;

-- Add required multi-platform fields
ALTER TABLE public.affiliate_applications ADD COLUMN IF NOT EXISTS instagram_link TEXT NOT NULL DEFAULT '';
ALTER TABLE public.affiliate_applications ADD COLUMN IF NOT EXISTS tiktok_link TEXT NOT NULL DEFAULT '';
ALTER TABLE public.affiliate_applications ADD COLUMN IF NOT EXISTS youtube_link TEXT NOT NULL DEFAULT '';
