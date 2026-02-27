-- ============================================================
-- SMG経営塾 RLS Migration - STEP 3: Auto-enable RLS Trigger
-- Date: 2026-02-27
-- Purpose: Automatically enable RLS on any new table created
-- ============================================================

-- ============================================================
-- Auto-enable RLS trigger for future tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_enable_rls()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
    AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
    RAISE NOTICE 'RLS auto-enabled on %', obj.object_identity;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS auto_enable_rls_trigger;
CREATE EVENT TRIGGER auto_enable_rls_trigger ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_enable_rls();

-- ============================================================
-- Performance indexes for RLS policy subqueries
-- ============================================================

-- Index for is_admin_or_instructor() function
CREATE INDEX IF NOT EXISTS idx_trn_group_user_user_id ON trn_group_user(user_id);
CREATE INDEX IF NOT EXISTS idx_trn_group_user_group_id ON trn_group_user(group_id);

-- Index for DM message thread lookups
CREATE INDEX IF NOT EXISTS idx_trn_dm_message_thread_id ON trn_dm_message(thread_id);
CREATE INDEX IF NOT EXISTS idx_trn_dm_message_user_id ON trn_dm_message(user_id);
CREATE INDEX IF NOT EXISTS idx_mst_dm_thread_user_id ON mst_dm_thread(user_id);

-- Index for consultation application lookups
CREATE INDEX IF NOT EXISTS idx_trn_consultation_application_user_id ON trn_consultation_application(user_id);

-- Index for event attendee lookups
CREATE INDEX IF NOT EXISTS idx_trn_event_attendee_user_id ON trn_event_attendee(user_id);

-- Index for inquiry lookups
CREATE INDEX IF NOT EXISTS idx_mst_inquiry_user_id ON mst_inquiry(user_id);

-- Index for gather attendee (payment) lookups
CREATE INDEX IF NOT EXISTS idx_trn_gather_attendee_user_id ON trn_gather_attendee(user_id);

-- Index for receipt history lookups
CREATE INDEX IF NOT EXISTS idx_trn_receipt_history_user_id ON trn_receipt_history(user_id);

-- Index for notification settings
CREATE INDEX IF NOT EXISTS idx_mst_notification_settings_user_id ON mst_notification_settings(user_id);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_trn_user_notification_user_id ON trn_user_notification(user_id);

-- Index for user guide progress
CREATE INDEX IF NOT EXISTS idx_trn_user_guide_progress_user_id ON trn_user_guide_progress(user_id);

-- Verify indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
