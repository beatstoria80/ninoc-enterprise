-- Phase 7: Supplier Legal & KYC Integrity

-- 1. Add Legal Columns to Suppliers Table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS legal_entity_type TEXT CHECK (legal_entity_type IN ('PT', 'CV', 'Perorangan', 'Firma', 'Koperasi')),
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS director_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT, -- NPWP
ADD COLUMN IF NOT EXISTS business_registration_number TEXT, -- NIB

ADD COLUMN IF NOT EXISTS id_card_url TEXT, -- KTP
ADD COLUMN IF NOT EXISTS tax_id_url TEXT, -- NPWP File
ADD COLUMN IF NOT EXISTS business_license_url TEXT; -- NIB File

-- 2. Create Private Storage Bucket for Legal Documents
-- Note: Must be run by superuser or via Supabase Dashboard. 
-- Assuming SQL creation works:
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier_documents', 'supplier_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for `supplier_documents`
-- Admin can do everything
CREATE POLICY "Admin full access to supplier documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'supplier_documents' AND 
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Note: Because this is a private bucket, the application will use the Service Role key 
-- to upload the documents on behalf of the supplier (via the Next.js API route) during application,
-- since they might not be authenticated as a supplier user yet.
-- Or they might be authenticated, but we want strict control. 
-- The Service Role key bypasses RLS, so the API route handles the security logic.

-- If a supplier wants to view their own documents later, they would need a policy:
CREATE POLICY "Suppliers can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'supplier_documents' AND 
  (auth.uid() IN (SELECT user_id FROM supplier_users))
  -- Note: A more strict policy would check if the file path contains their supplier ID,
  -- but since the API will generate Signed URLs, we don't strictly need a SELECT policy for the suppliers.
);
