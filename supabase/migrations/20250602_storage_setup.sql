-- ============================================================
-- NINOC STORAGE SETUP — Create products bucket & policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- NOTE: Creating storage buckets via SQL requires Supabase CLI or Dashboard.
-- If this script fails, create the bucket manually:
--   Supabase Dashboard → Storage → New Bucket → "products" → Public: ON

-- ============================================================
-- METHOD 1: Via SQL (if allowed in your project)
-- ============================================================

-- Insert storage bucket (ignore if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- METHOD 2: Configure Storage Policies
-- ============================================================

-- Allow public uploads to products bucket
CREATE POLICY "Allow public uploads to products"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'products');

-- Allow public read on products bucket
CREATE POLICY "Allow public read on products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Allow public delete on products bucket (for cleanup)
CREATE POLICY "Allow public delete on products"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products');

-- Allow public update on products bucket
CREATE POLICY "Allow public update on products"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products');

-- ============================================================
-- METHOD 3: Alternative — Allow authenticated users only
-- ============================================================

-- Uncomment if you want only authenticated users to upload:
/*
DROP POLICY IF EXISTS "Allow public uploads to products" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to products"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Allow public read on products" ON storage.objects;

CREATE POLICY "Allow authenticated read on products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public delete on products" ON storage.objects;

CREATE POLICY "Allow authenticated delete on products"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public update on products" ON storage.objects;

CREATE POLICY "Allow authenticated update on products"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');
*/

-- ============================================================
-- VERIFY STORAGE CONFIGURATION
-- ============================================================

-- Check existing buckets
SELECT id, name, public FROM storage.buckets;

-- Check existing policies on storage.objects
SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================================
-- TEST UPLOAD (run in SQL to verify permission)
-- ============================================================

-- Test: Check if we can select from storage.objects
-- If this returns rows, storage is accessible
SELECT * FROM storage.objects LIMIT 1;

-- ============================================================
-- MANUAL SETUP (if SQL method fails)
-- ============================================================
-- If this SQL fails, setup manually:
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: products
-- 4. Check "Public bucket"
-- 5. Save
--
-- Then add policies manually:
-- 1. Click on "products" bucket
-- 2. Go to "Policies" tab
-- 3. Add policies for: SELECT, INSERT, UPDATE, DELETE
-- 4. Set USING/BCHECK to: bucket_id = 'products'
-- ============================================================

-- ============================================================
-- DONE
-- ============================================================