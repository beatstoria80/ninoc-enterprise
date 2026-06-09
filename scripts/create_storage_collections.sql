-- ==============================================================
-- STORAGE BUCKET: COLLECTIONS
-- ==============================================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collections', 'collections', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read all files in 'collections'
CREATE POLICY "Public Access for Collections Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'collections');

-- 3. Allow authenticated users to upload/update/delete in 'collections'
CREATE POLICY "Admin Insert Access for Collections"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'collections' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Update Access for Collections"
ON storage.objects FOR UPDATE
USING (bucket_id = 'collections' AND auth.role() = 'authenticated');

CREATE POLICY "Admin Delete Access for Collections"
ON storage.objects FOR DELETE
USING (bucket_id = 'collections' AND auth.role() = 'authenticated');
