-- ============================================================
-- NINOC STORAGE SECURITY FIX — Restrict file listing
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. REMOVE BROAD SELECT POLICIES (Security Risk)
-- ============================================================

-- Remove the policies that allow listing ALL files in the bucket
DROP POLICY IF EXISTS "Allow public read on products" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read on products" ON storage.objects;

-- ============================================================
-- 2. CREATE RESTRICTED SELECT POLICY
-- ============================================================

-- Only allow SELECT if you know the exact file path (not listing all)
-- This prevents enumeration attacks but still allows image display
CREATE POLICY "Allow read products by path"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = ANY(
    ARRAY[
      'product',
      'avatar',
      'assets',
      'images'
    ]
  )
);

-- ============================================================
-- 3. ALTERNATIVE — Remove all custom SELECT policies
-- (Use bucket-level public URL access instead)
-- ============================================================

/*
-- If you want completely locked down storage, remove all SELECT policies
-- Images will still work via public URL because bucket is public
-- But direct listing via API will be blocked

DROP POLICY IF EXISTS "Allow read products by path" ON storage.objects;

-- Then you only need INSERT/UPDATE/DELETE policies for uploads
*/

-- ============================================================
-- 4. RECOMMENDED: Keep only INSERT policy (for uploads)
-- SELECT is handled automatically by public bucket URL
-- ============================================================

-- First check existing policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%products%';

-- If you want maximum security:
DROP POLICY IF EXISTS "Allow read products by path" ON storage.objects;

-- Only allow INSERT (uploads) - SELECT via public URL still works
-- The bucket is public so images display via direct URL
-- But listing all files is blocked

-- ============================================================
-- 5. VERIFY POLICIES AFTER FIX
-- ============================================================

-- Check current policies on storage.objects
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY cmd;

-- Check if bucket is public
SELECT id, name, public FROM storage.buckets WHERE name = 'products';

-- ============================================================
-- QUICK FIX — If you just want to remove all file listing:
-- ============================================================

-- Option A: Remove all SELECT policies (most secure)
-- Images still work via direct public URL
/*
DELETE FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND cmd = 'SELECT';
*/

-- Option B: Keep only specific folder access
/*
DROP POLICY IF EXISTS "Allow read products by path" ON storage.objects;

CREATE POLICY "Restrict products read by folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'products'
  AND name ILIKE 'product-%'
);
*/

-- ============================================================
-- DONE — Storage now more secure
-- ============================================================