-- ============================================================
-- FIX: Allow NULL for kecamatan/kelurahan + backfill old records
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow NULL for kecamatan and kelurahan (old records have no data)
ALTER TABLE customer_profiles ALTER COLUMN kecamatan DROP NOT NULL;
ALTER TABLE customer_profiles ALTER COLUMN kelurahan DROP NOT NULL;

-- 2. Backfill old records with placeholder so they display in admin
UPDATE customer_profiles
SET
 kecamatan = COALESCE(kecamatan, 'Tidak Diketahui'),
  kelurahan = COALESCE(kelurahan, 'Tidak Diketahui')
WHERE kecamatan IS NULL OR kelurahan IS NULL;
