-- ============================================================
-- Supabase Data API Access Grants & Default Privileges
-- Date: 2026-10-21
-- Purpose: Comply with Supabase Data API update (effective Oct 30, 2026).
--          Ensures anon, authenticated, and service_role have appropriate
--          grants on existing and newly created tables, sequences, and routines.
-- ============================================================

-- 1. Ensure schema usage is granted
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Explicit grants on ALL existing tables in schema public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. Explicit grants on ALL existing sequences (IDs / serials)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Explicit grants on ALL existing routines / functions
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Set default privileges for all FUTURE tables created in schema public
--    This acts as a safety net so future migrations won't get "permission denied"
--    even if explicit GRANT statements are missed.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- 6. Set default privileges for all FUTURE sequences in schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 7. Set default privileges for all FUTURE routines in schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
