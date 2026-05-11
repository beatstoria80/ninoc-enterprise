-- ============================================================
-- NINOC ENTERPRISE - FIX AUTO SIGNUP TRIGGER
-- Hapus trigger yang auto-create customer_profiles saat signup Google
-- Run di Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Lihat semua trigger yang ada di public schema
-- ============================================================
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  event_object_schema,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================================
-- STEP 2: Lihat fungsi yang terkait customer_profiles
-- ============================================================
SELECT
  proname,
  prosrc,
  pronargs,
  oidregclass AS function_name
FROM pg_proc
WHERE proname LIKE '%customer%'
   OR proname LIKE '%profile%'
   OR proname LIKE '%auth%'
   OR prosrc LIKE '%customer_profiles%';

-- ============================================================
-- STEP 3: Hapus trigger handler function (kalau ada)
-- ============================================================

-- Contoh: Kalau ada function handle_new_user()
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();

-- ============================================================
-- STEP 4: Lihat semua triggers di auth.users
-- ============================================================
SELECT
  tgname AS trigger_name,
  proname AS function_name,
  tgtype
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================
-- STEP 5: DROP TRIGGER yang auto-create customer_profiles
-- ============================================================

-- Hapus trigger utama yang biasanya auto-create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_customer_profile ON auth.users;
DROP TRIGGER IF EXISTS auth_users_insert_trigger ON auth.users;
DROP TRIGGER IF EXISTS public_handle_new_user_trigger ON auth.users;

-- ============================================================
-- STEP 6: DROP FUNCTION yang auto-create profiles
-- ============================================================

DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_customer_profile_on_signup();
DROP FUNCTION IF EXISTS public.create_customer_profile_on_signup();

-- ============================================================
-- STEP 7: CEK APAKAH SUDAH DIHAPUS
-- ============================================================
SELECT
  tgname AS remaining_triggers
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================
-- HASIL:
-- Setelah run SQL ini, customer_profiles TIDAK akan auto-create
-- Profile baru akan dibuat hanya saat user SELESAI onboarding
--
-- Workflow yang baru:
-- 1. User login Google
-- 2. Auth user dibuat di auth.users (ini normal, wajib)
-- 3. User DIREKTIKAN ke /onboarding
-- 4. User ISI data diri di onboarding form
-- 5. User SUBMIT → customer_profiles baru dibuat
-- 6. User SELESAI onboarding → bisa akses fitur lengkap
-- ============================================================

COMMENT ON FUNCTION handle_new_user() IS 'DISABLED - profiles now created only after onboarding';
