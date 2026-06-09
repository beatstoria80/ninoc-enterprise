-- 1. Ensure bucket 'collections' allows large files (50MB) and all types
UPDATE storage.buckets 
SET allowed_mime_types = NULL, file_size_limit = 52428800
WHERE id = 'collections';

-- 2. Drop existing restricted insert policies if any
DROP POLICY IF EXISTS "Allow public uploads to collections" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from collections" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on collections" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on collections" ON storage.objects;

-- 3. Create new policies that allow media uploads (images/videos) to 'collections'
CREATE POLICY "Allow public uploads to collections"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'collections');

CREATE POLICY "Allow public read from collections"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'collections');

CREATE POLICY "Allow public update on collections"
ON storage.objects FOR UPDATE TO public
WITH CHECK (bucket_id = 'collections');

CREATE POLICY "Allow public delete on collections"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'collections');
