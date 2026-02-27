-- ============================================================
-- SMG経営塾 RLS Migration - STEP 1: Enable RLS on ALL tables
-- Date: 2026-02-27
-- Purpose: Enable Row Level Security on all 61 public tables
-- 
-- ⚠️ WARNING: This will BLOCK all anonymous (anon) access immediately.
--    After running this, tables with no policies will be inaccessible
--    to ALL users including authenticated ones.
--    Run STEP 2 immediately after this to restore proper access.
--
-- 🔒 Service Role Key access is NOT affected by RLS.
--    Admin operations using service_role will continue to work.
-- ============================================================

-- ============================================================
-- STEP 1A: Helper function for admin/instructor check
-- This must be created BEFORE policies that reference it
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_instructor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trn_group_user tgu
    JOIN mst_group mg ON tgu.group_id = mg.group_id
    WHERE tgu.user_id = auth.uid()
    AND tgu.deleted_at IS NULL
    AND mg.deleted_at IS NULL
    AND mg.title IN ('講師', '運営')
  );
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.is_admin_or_instructor() TO authenticated;

-- ============================================================
-- STEP 1B: Enable RLS on ALL tables
-- ============================================================

-- Master tables (28)
ALTER TABLE mst_archive_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_beginner_guide_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_beginner_guide_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_beginner_guide_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_consultation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_dm_label ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_dm_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_dm_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_event_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_event_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_event_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_industry ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_inquiry ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_meeting_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_notice ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_notice_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_question_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_radio ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_survey_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE mst_user ENABLE ROW LEVEL SECURITY;

-- Transaction tables (33)
ALTER TABLE trn_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_broadcast_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_broadcast_target_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_consultation_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_consultation_attendee ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_consultation_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_consultation_question_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_consultation_schedule_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_dm_memo ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_dm_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_dm_message_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_dm_thread_label ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_dm_thread_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_archive_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_archive_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_archive_visible_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_attendee ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_question_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_event_visible_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_gather_attendee ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_group_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_inquiry_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_invite ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_nfc_exchange ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_notice_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_notice_visible_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_radio_visible_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_receipt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_survey_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_user_guide_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE trn_user_notification ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
