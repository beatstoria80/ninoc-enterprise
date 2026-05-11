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
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================================
-- STEP 2: Lihat fungsi yang terkait customer_profiles
-- ============================================================
SELECT
  proname,
  prosrc
FROM pg_proc
WHERE proname LIKE '%customer%'
   OR proname LIKE '%profile%'
   OR proname LIKE '%auth%'
   OR prosrc LIKE '%customer_profiles%';

-- ============================================================
-- STEP 3: Lihat semua triggers di auth.users
-- ============================================================
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================
-- STEP 4: DROP TRIGGER yang auto-create customer_profiles
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_customer_profile ON auth.users;
DROP TRIGGER IF EXISTS auth_users_insert_trigger ON auth.users;
DROP TRIGGER IF EXISTS public_handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS "on_auth_user_created" ON auth.users;

-- ============================================================
-- STEP 5: DROP FUNCTION yang auto-create profiles
-- ============================================================
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_customer_profile_on_signup();
DROP FUNCTION IF EXISTS public.create_customer_profile_on_signup();

-- ============================================================
-- STEP 6: CEK APAKAH SUDAH DIHAPUS
-- ============================================================
SELECT
  tgname AS remaining_triggers
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- ============================================================
-- VERIFIKASI
-- Jika hasil kosong, berarti SEMUA trigger sudah dihapus
-- ============================================================