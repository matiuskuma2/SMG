-- ============================================================
-- SMG経営塾 RLS Migration Script
-- Date: 2026-02-27
-- Purpose: Enable RLS on all tables and create security policies
-- ============================================================

-- ============================================================
-- STEP 1: Helper function for admin/instructor check
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

-- ============================================================
-- STEP 2: Enable RLS on ALL tables
-- ============================================================

-- Master tables
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

-- Transaction tables
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

-- ============================================================
-- STEP 3: RLS Policies for each table
-- ============================================================

-- --------------------------------
-- mst_user: User profiles (CRITICAL)
-- --------------------------------
CREATE POLICY "authenticated_select_own_profile" ON mst_user
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "authenticated_select_public_profiles" ON mst_user
  FOR SELECT TO authenticated
  USING (is_profile_public = true);

CREATE POLICY "admin_select_all_users" ON mst_user
  FOR SELECT TO authenticated
  USING (is_admin_or_instructor());

CREATE POLICY "authenticated_update_own_profile" ON mst_user
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_update_all_users" ON mst_user
  FOR UPDATE TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_insert_users" ON mst_user
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_instructor() OR auth.uid() = user_id);

-- --------------------------------
-- trn_group_user: Group membership (CRITICAL - auth base)
-- --------------------------------
CREATE POLICY "authenticated_select_own_groups" ON trn_group_user
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_select_all_groups" ON trn_group_user
  FOR SELECT TO authenticated
  USING (is_admin_or_instructor());

CREATE POLICY "admin_manage_groups" ON trn_group_user
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- mst_group: Group definitions
-- --------------------------------
CREATE POLICY "authenticated_select_groups" ON mst_group
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_group_defs" ON mst_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- DM system (CRITICAL - private messages)
-- --------------------------------
CREATE POLICY "user_select_own_threads" ON mst_dm_thread
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_own_thread" ON mst_dm_thread
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_threads" ON mst_dm_thread
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_messages" ON trn_dm_message
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    thread_id IN (SELECT thread_id FROM mst_dm_thread WHERE user_id = auth.uid()) OR
    is_admin_or_instructor()
  );

CREATE POLICY "user_insert_own_messages" ON trn_dm_message
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      thread_id IN (SELECT thread_id FROM mst_dm_thread WHERE user_id = auth.uid()) OR
      is_admin_or_instructor()
    )
  );

CREATE POLICY "admin_manage_messages" ON trn_dm_message
  FOR UPDATE TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_msg_images" ON trn_dm_message_image
  FOR SELECT TO authenticated
  USING (
    message_id IN (
      SELECT message_id FROM trn_dm_message WHERE
        user_id = auth.uid() OR
        thread_id IN (SELECT thread_id FROM mst_dm_thread WHERE user_id = auth.uid())
    ) OR is_admin_or_instructor()
  );

CREATE POLICY "user_insert_msg_images" ON trn_dm_message_image
  FOR INSERT TO authenticated
  WITH CHECK (
    message_id IN (SELECT message_id FROM trn_dm_message WHERE user_id = auth.uid()) OR
    is_admin_or_instructor()
  );

CREATE POLICY "admin_select_dm_labels" ON mst_dm_label
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_dm_labels" ON mst_dm_label
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_select_dm_tags" ON mst_dm_tag
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_dm_tags" ON mst_dm_tag
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_dm_memo" ON trn_dm_memo
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_thread_labels" ON trn_dm_thread_label
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_thread_tags" ON trn_dm_thread_tag
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Payment / Receipts (CRITICAL)
-- --------------------------------
CREATE POLICY "user_select_own_gather" ON trn_gather_attendee
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_gather" ON trn_gather_attendee
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_gather" ON trn_gather_attendee
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_receipts" ON trn_receipt_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "admin_manage_receipts" ON trn_receipt_history
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Notices (public to authenticated)
-- --------------------------------
CREATE POLICY "authenticated_select_notices" ON mst_notice
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_notices" ON mst_notice
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_categories" ON mst_notice_category
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_notice_categories" ON mst_notice_category
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_files" ON trn_notice_file
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_notice_files" ON trn_notice_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_visible_groups" ON trn_notice_visible_group
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_notice_visible_groups" ON trn_notice_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Events
-- --------------------------------
CREATE POLICY "authenticated_select_events" ON mst_event
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_events" ON mst_event
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_event_types" ON mst_event_type
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_event_types" ON mst_event_type
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_event_files" ON mst_event_file
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_event_files" ON mst_event_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_event_attendees" ON trn_event_attendee
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_manage_own_event_attendance" ON trn_event_attendee
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_event_attendance" ON trn_event_attendee
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "admin_delete_event_attendee" ON trn_event_attendee
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "authenticated_select_event_questions" ON trn_event_question
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_event_questions" ON trn_event_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_own_event_answers" ON trn_event_question_answer
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_manage_own_event_answers" ON trn_event_question_answer
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_event_answers" ON trn_event_question_answer
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "authenticated_select_event_visible_groups" ON trn_event_visible_group
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_event_visible_groups" ON trn_event_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Event Archives
-- --------------------------------
CREATE POLICY "authenticated_select_event_archives" ON mst_event_archive
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_event_archives" ON mst_event_archive
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_files" ON trn_event_archive_file
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_archive_files" ON trn_event_archive_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_videos" ON trn_event_archive_video
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_archive_videos" ON trn_event_archive_video
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_visible_groups" ON trn_event_archive_visible_group
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_archive_visible_groups" ON trn_event_archive_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Consultations
-- --------------------------------
CREATE POLICY "authenticated_select_consultations" ON mst_consultation
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_consultations" ON mst_consultation
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_consultation_schedules" ON mst_consultation_schedule
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_consultation_schedules" ON mst_consultation_schedule
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_apps" ON trn_consultation_application
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_consultation_app" ON trn_consultation_application
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_consultation_apps" ON trn_consultation_application
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_attendee" ON trn_consultation_attendee
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "admin_manage_consultation_attendee" ON trn_consultation_attendee
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_consultation_questions" ON trn_consultation_question
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_consultation_questions" ON trn_consultation_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_answers" ON trn_consultation_question_answer
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT application_id FROM trn_consultation_application WHERE user_id = auth.uid()
    ) OR is_admin_or_instructor()
  );

CREATE POLICY "user_insert_consultation_answers" ON trn_consultation_question_answer
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin_manage_consultation_answers" ON trn_consultation_question_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT application_id FROM trn_consultation_application WHERE user_id = auth.uid()
    ) OR is_admin_or_instructor()
  );

CREATE POLICY "user_insert_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin_manage_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Questions & Answers
-- --------------------------------
CREATE POLICY "authenticated_select_questions" ON trn_question
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (is_hidden IS NOT TRUE AND deleted_at IS NULL) OR
    is_admin_or_instructor()
  );

CREATE POLICY "user_insert_questions" ON trn_question
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_questions" ON trn_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_answers" ON trn_answer
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL OR is_admin_or_instructor());

CREATE POLICY "admin_manage_answers" ON trn_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- FAQ / Beginner Guide / Radio / Other public content
-- --------------------------------
CREATE POLICY "authenticated_select_faq" ON mst_faq
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_faq" ON mst_faq
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_guide_items" ON mst_beginner_guide_item
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_guide_items" ON mst_beginner_guide_item
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_guide_files" ON mst_beginner_guide_file
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_guide_files" ON mst_beginner_guide_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_guide_videos" ON mst_beginner_guide_video
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_guide_videos" ON mst_beginner_guide_video
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_radio" ON mst_radio
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_radio" ON mst_radio
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_radio_visible_groups" ON trn_radio_visible_group
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_manage_radio_visible_groups" ON trn_radio_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Notifications
-- --------------------------------
CREATE POLICY "authenticated_select_notifications" ON mst_notification
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_notifications" ON mst_notification
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_notification_settings" ON mst_notification_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_manage_own_notification_settings" ON mst_notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_select_own_user_notifications" ON trn_user_notification
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_manage_own_user_notifications" ON trn_user_notification
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_user_notifications" ON trn_user_notification
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Surveys
-- --------------------------------
CREATE POLICY "authenticated_select_surveys" ON mst_survey
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_surveys" ON mst_survey
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_survey_details" ON mst_survey_detail
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_survey_details" ON mst_survey_detail
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_survey_answers" ON trn_survey_answer
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_survey_answers" ON trn_survey_answer
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_survey_answers" ON trn_survey_answer
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_manage_survey_answers" ON trn_survey_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Other reference tables
-- --------------------------------
CREATE POLICY "authenticated_select_archive_types" ON mst_archive_type
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_archive_types" ON mst_archive_type
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_industries" ON mst_industry
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "authenticated_select_themes" ON mst_theme
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_themes" ON mst_theme
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_question_manual" ON mst_question_manual
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_question_manual" ON mst_question_manual
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_select_meeting_links" ON mst_meeting_link
  FOR SELECT TO authenticated
  USING (is_admin_or_instructor());

CREATE POLICY "admin_manage_meeting_links" ON mst_meeting_link
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Inquiries
-- --------------------------------
CREATE POLICY "user_select_own_inquiries" ON mst_inquiry
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_inquiry" ON mst_inquiry
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_inquiries" ON mst_inquiry
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_inquiry_answers" ON trn_inquiry_answer
  FOR SELECT TO authenticated
  USING (
    inquiry_id IN (SELECT inquiry_id FROM mst_inquiry WHERE user_id = auth.uid()) OR
    is_admin_or_instructor()
  );

CREATE POLICY "admin_manage_inquiry_answers" ON trn_inquiry_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- Broadcast
-- --------------------------------
CREATE POLICY "admin_manage_broadcast_history" ON trn_broadcast_history
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_broadcast_targets" ON trn_broadcast_target_user
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- User Guide Progress
-- --------------------------------
CREATE POLICY "user_select_own_progress" ON trn_user_guide_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_manage_own_progress" ON trn_user_guide_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- --------------------------------
-- Invites / NFC
-- --------------------------------
CREATE POLICY "user_select_own_invites" ON trn_invite
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR recipient_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_invites" ON trn_invite
  FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "user_select_own_nfc" ON trn_nfc_exchange
  FOR SELECT TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_nfc" ON trn_nfc_exchange
  FOR INSERT TO authenticated
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- ============================================================
-- STEP 4: Auto-enable RLS trigger for future tables
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

