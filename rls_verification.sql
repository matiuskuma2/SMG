-- ============================================================
-- SMG経営塾 RLS Migration - VERIFICATION SCRIPT
-- Date: 2026-02-27
-- Purpose: Run after STEP 1+2+3 to verify everything works
-- ============================================================

-- ============================================================
-- 1. Check RLS is enabled on all tables
-- ============================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================
-- 2. Count policies per table
-- ============================================================
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- 3. Verify is_admin_or_instructor() function exists
-- ============================================================
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin_or_instructor';

-- ============================================================
-- 4. Verify auto-enable RLS trigger exists
-- ============================================================
SELECT 
  evtname as trigger_name,
  evtevent as event,
  evtfoid::regproc as function
FROM pg_event_trigger 
WHERE evtname = 'auto_enable_rls_trigger';

-- ============================================================
-- 5. Check indexes created for performance
-- ============================================================
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================
-- 6. Tables WITHOUT any policies (potential issue)
-- ============================================================
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
AND p.policyname IS NULL
ORDER BY t.tablename;
