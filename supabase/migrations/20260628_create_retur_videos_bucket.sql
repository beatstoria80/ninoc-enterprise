-- ============================================================
-- NINOC STORAGE SETUP — Create retur-videos bucket & policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- Insert storage bucket for return videos (ignore if already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'retur-videos', 
  'retur-videos', 
  true, 
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Update bucket to ensure it is public if it already existed but was private
UPDATE storage.buckets SET public = true WHERE id = 'retur-videos';

-- ============================================================
-- Configure Storage Policies
-- ============================================================

-- Allow public uploads to retur-videos bucket
CREATE POLICY "Allow public uploads to retur-videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'retur-videos');

-- Allow public read on retur-videos bucket
CREATE POLICY "Allow public read on retur-videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'retur-videos');

-- Allow public update on retur-videos bucket
CREATE POLICY "Allow public update on retur-videos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'retur-videos');

-- Allow public delete on retur-videos bucket
CREATE POLICY "Allow public delete on retur-videos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'retur-videos');
