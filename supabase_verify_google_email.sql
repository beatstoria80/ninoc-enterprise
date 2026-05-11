-- ============================================================
-- NINOC ENTERPRISE - ENFORCE GOOGLE EMAIL VERIFICATION
-- Google OAuth hanya menerima email yang sudah di-verifikasi Google
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- TAMBAHKAN CONSTRAINT UNTUK EMAIL VERIFICATION
-- ============================================================

-- Buat function untuk validasi email dari Google
CREATE OR REPLACE FUNCTION public.handle_new_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Cek apakah email sudah verified oleh Google
  -- Google hanya memberikan email yang sudah diverifikasi
  -- Jika email tidak verified, block signup
  IF NEW.raw_app_meta_data->>'verified' = 'false' THEN
    RAISE EXCEPTION 'Email must be verified by Google to sign up';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama kalau ada
DROP TRIGGER IF EXISTS on_auth_user_created_metadata_check ON auth.users;

-- Buat trigger baru yang cek email verification
CREATE TRIGGER on_auth_user_created_metadata_check
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_metadata();

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================
-- CATATAN:
-- Google OAuth sudah secara default memverifikasi email sebelum memberikan akses.
-- Trigger ini sebagai tambahan keamanan untuk block email yang tidak verified.
-- ============================================================
