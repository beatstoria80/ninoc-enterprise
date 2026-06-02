-- ============================================================
-- NINOC STORAGE PERMISSIONS FIX v2
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Check current bucket status
-- ============================================================

SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'products';

-- ============================================================
-- STEP 2: If bucket doesn't exist, create it
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Drop ALL existing policies
-- ============================================================

DROP POLICY IF EXISTS "Allow public read on products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read on products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to products" ON storage.objects;
DROP POLICY IF EXISTS "Allow read products by path" ON storage.objects;
DROP POLICY IF EXISTS "service_upload_products" ON storage.objects;
DROP POLICY IF EXISTS "service_select_products" ON storage.objects;
DROP POLICY IF EXISTS "service_update_products" ON storage.objects;
DROP POLICY IF EXISTS "service_delete_products" ON storage.objects;
DROP POLICY IF EXISTS "public_read_products" ON storage.objects;
DROP POLICY IF EXISTS "upload_products_public" ON storage.objects;
DROP POLICY IF EXISTS "read_products_public" ON storage.objects;
DROP POLICY IF EXISTS "update_products_public" ON storage.objects;
DROP POLICY IF EXISTS "delete_products_public" ON storage.objects;

-- ============================================================
-- STEP 4: Create PUBLIC policies (no auth needed)
-- ============================================================

-- Allow anyone to INSERT (upload files) to products bucket
CREATE POLICY "upload_products_public"
ON storage.objects
FOR INSERT
TO "public"
WITH CHECK (bucket_id = 'products');

-- Allow anyone to SELECT (read/download files) from products bucket
CREATE POLICY "read_products_public"
ON storage.objects
FOR SELECT
TO "public"
USING (bucket_id = 'products');

-- Allow anyone to UPDATE files in products bucket
CREATE POLICY "update_products_public"
ON storage.objects
FOR UPDATE
TO "public"
USING (bucket_id = 'products');

-- Allow anyone to DELETE files in products bucket
CREATE POLICY "delete_products_public"
ON storage.objects
FOR DELETE
TO "public"
USING (bucket_id = 'products');

-- ============================================================
-- STEP 5: Set bucket to public
-- ============================================================

UPDATE storage.buckets
SET public = true
WHERE name = 'products';

-- ============================================================
-- STEP 6: Verify
-- ============================================================

-- Check bucket is public
SELECT id, name, public FROM storage.buckets WHERE name = 'products';

-- Check all policies
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================
-- STEP 7: Manual fix (if SQL fails)
-- ============================================================
-- Go to: Supabase Dashboard → Storage → products → Policies
-- Delete all policies, then create:
--
-- Policy 1:
--   Name: upload_products
--   Command: INSERT
--   Target roles: public
--   USING/BCHECK: bucket_id = 'products'
--
-- Policy 2:
--   Name: read_products
--   Command: SELECT
--   Target roles: public
--   USING: bucket_id = 'products'
--
-- Policy 3:
--   Name: update_products
--   Command: UPDATE
--   Target roles: public
--   USING: bucket_id = 'products'
--
-- Policy 4:
--   Name: delete_products
--   Command: DELETE
--   Target roles: public
--   USING: bucket_id = 'products'
-- ============================================================

-- ============================================================
-- DONE
-- ============================================================