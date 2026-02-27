-- ============================================================
-- SMG経営塾 RLS Migration - STEP 2: Create RLS Policies
-- Date: 2026-02-27
-- Purpose: Create comprehensive RLS policies for all tables
--
-- ⚠️ RUN THIS IMMEDIATELY AFTER STEP 1
-- 
-- Policy Design:
--   - anon role: NO access to any table (all blocked)
--   - authenticated role: Access based on user_id = auth.uid()
--   - Admins (講師/運営): Full access via is_admin_or_instructor()
--   - service_role: Bypasses RLS entirely (no changes needed)
--
-- Column Name Verification:
--   All column names have been verified against actual table schemas
--   via REST API queries on 2026-02-27.
-- ============================================================

-- ============================================================
-- CRITICAL TABLES (Personal Data / Auth / Messages / Payments)
-- ============================================================

-- --------------------------------
-- mst_user: User profiles (CRITICAL - PII)
-- Columns: user_id, username, email, phone_number, etc.
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_own_profile" ON mst_user;
DROP POLICY IF EXISTS "authenticated_select_public_profiles" ON mst_user;
DROP POLICY IF EXISTS "admin_select_all_users" ON mst_user;
DROP POLICY IF EXISTS "authenticated_update_own_profile" ON mst_user;
DROP POLICY IF EXISTS "admin_update_all_users" ON mst_user;
DROP POLICY IF EXISTS "admin_insert_users" ON mst_user;

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
-- Columns: user_id, group_id, created_at, deleted_at, updated_at
-- Used by middleware to check user's group (未決済/退会/講師/運営)
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_own_groups" ON trn_group_user;
DROP POLICY IF EXISTS "admin_select_all_groups" ON trn_group_user;
DROP POLICY IF EXISTS "admin_manage_groups" ON trn_group_user;

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
-- Columns: group_id, title, created_at, deleted_at, updated_at
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_groups" ON mst_group;
DROP POLICY IF EXISTS "admin_manage_group_defs" ON mst_group;

CREATE POLICY "authenticated_select_groups" ON mst_group
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_group_defs" ON mst_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor())
  WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- DM SYSTEM (CRITICAL - Private Messages)
-- ============================================================

-- --------------------------------
-- mst_dm_thread: DM threads
-- Columns: thread_id, user_id, is_admin_read, last_sent_at, created_at, deleted_at, updated_at
-- --------------------------------
DROP POLICY IF EXISTS "user_select_own_threads" ON mst_dm_thread;
DROP POLICY IF EXISTS "user_insert_own_thread" ON mst_dm_thread;
DROP POLICY IF EXISTS "admin_manage_threads" ON mst_dm_thread;

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

-- --------------------------------
-- trn_dm_message: DM messages (CRITICAL - private content)
-- Columns: message_id, thread_id, user_id, content, is_inquiry, is_read, is_sent
-- --------------------------------
DROP POLICY IF EXISTS "user_select_own_messages" ON trn_dm_message;
DROP POLICY IF EXISTS "user_insert_own_messages" ON trn_dm_message;
DROP POLICY IF EXISTS "admin_manage_messages" ON trn_dm_message;

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

-- --------------------------------
-- trn_dm_message_image: DM message images
-- --------------------------------
DROP POLICY IF EXISTS "user_select_own_msg_images" ON trn_dm_message_image;
DROP POLICY IF EXISTS "user_insert_msg_images" ON trn_dm_message_image;

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

-- --------------------------------
-- DM admin-only tables
-- --------------------------------
DROP POLICY IF EXISTS "admin_select_dm_labels" ON mst_dm_label;
DROP POLICY IF EXISTS "admin_manage_dm_labels" ON mst_dm_label;
DROP POLICY IF EXISTS "admin_select_dm_tags" ON mst_dm_tag;
DROP POLICY IF EXISTS "admin_manage_dm_tags" ON mst_dm_tag;
DROP POLICY IF EXISTS "admin_manage_dm_memo" ON trn_dm_memo;
DROP POLICY IF EXISTS "admin_manage_thread_labels" ON trn_dm_thread_label;
DROP POLICY IF EXISTS "admin_manage_thread_tags" ON trn_dm_thread_tag;

CREATE POLICY "admin_select_dm_labels" ON mst_dm_label
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_dm_labels" ON mst_dm_label
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_select_dm_tags" ON mst_dm_tag
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_dm_tags" ON mst_dm_tag
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_dm_memo" ON trn_dm_memo
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_thread_labels" ON trn_dm_thread_label
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_thread_tags" ON trn_dm_thread_tag
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- PAYMENT / RECEIPTS (CRITICAL - Financial Data)
-- ============================================================

-- --------------------------------
-- trn_gather_attendee: Payment records
-- Columns: user_id, event_id, payment_amount, stripe_payment_intent_id, etc.
-- --------------------------------
DROP POLICY IF EXISTS "user_select_own_gather" ON trn_gather_attendee;
DROP POLICY IF EXISTS "user_insert_gather" ON trn_gather_attendee;
DROP POLICY IF EXISTS "admin_manage_gather" ON trn_gather_attendee;

CREATE POLICY "user_select_own_gather" ON trn_gather_attendee
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_insert_gather" ON trn_gather_attendee
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_manage_gather" ON trn_gather_attendee
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- trn_receipt_history: Receipt records
-- Columns: receipt_id, user_id, name, amount, number, etc.
-- --------------------------------
DROP POLICY IF EXISTS "user_select_own_receipts" ON trn_receipt_history;
DROP POLICY IF EXISTS "admin_manage_receipts" ON trn_receipt_history;

CREATE POLICY "user_select_own_receipts" ON trn_receipt_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "admin_manage_receipts" ON trn_receipt_history
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- EVENTS
-- ============================================================

-- --------------------------------
-- mst_event: Event definitions
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_events" ON mst_event;
DROP POLICY IF EXISTS "admin_manage_events" ON mst_event;

CREATE POLICY "authenticated_select_events" ON mst_event
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_events" ON mst_event
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- mst_event_type: Event type definitions
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_event_types" ON mst_event_type;
DROP POLICY IF EXISTS "admin_manage_event_types" ON mst_event_type;

CREATE POLICY "authenticated_select_event_types" ON mst_event_type
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_event_types" ON mst_event_type
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- mst_event_file: Event files
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_event_files" ON mst_event_file;
DROP POLICY IF EXISTS "admin_manage_event_files" ON mst_event_file;

CREATE POLICY "authenticated_select_event_files" ON mst_event_file
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "admin_manage_event_files" ON mst_event_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- --------------------------------
-- trn_event_attendee: Event attendance
-- Columns: user_id, event_id, is_offline
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_event_attendees" ON trn_event_attendee;
DROP POLICY IF EXISTS "user_manage_own_event_attendance" ON trn_event_attendee;
DROP POLICY IF EXISTS "user_update_own_event_attendance" ON trn_event_attendee;
DROP POLICY IF EXISTS "admin_delete_event_attendee" ON trn_event_attendee;

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

-- --------------------------------
-- trn_event_question / trn_event_question_answer
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_event_questions" ON trn_event_question;
DROP POLICY IF EXISTS "admin_manage_event_questions" ON trn_event_question;
DROP POLICY IF EXISTS "authenticated_select_own_event_answers" ON trn_event_question_answer;
DROP POLICY IF EXISTS "user_manage_own_event_answers" ON trn_event_question_answer;
DROP POLICY IF EXISTS "user_update_own_event_answers" ON trn_event_question_answer;

CREATE POLICY "authenticated_select_event_questions" ON trn_event_question
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_event_questions" ON trn_event_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_own_event_answers" ON trn_event_question_answer
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

CREATE POLICY "user_manage_own_event_answers" ON trn_event_question_answer
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_event_answers" ON trn_event_question_answer
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());

-- --------------------------------
-- trn_event_visible_group: Event visibility
-- --------------------------------
DROP POLICY IF EXISTS "authenticated_select_event_visible_groups" ON trn_event_visible_group;
DROP POLICY IF EXISTS "admin_manage_event_visible_groups" ON trn_event_visible_group;

CREATE POLICY "authenticated_select_event_visible_groups" ON trn_event_visible_group
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_event_visible_groups" ON trn_event_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- EVENT ARCHIVES
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_event_archives" ON mst_event_archive;
DROP POLICY IF EXISTS "admin_manage_event_archives" ON mst_event_archive;
DROP POLICY IF EXISTS "authenticated_select_archive_files" ON trn_event_archive_file;
DROP POLICY IF EXISTS "admin_manage_archive_files" ON trn_event_archive_file;
DROP POLICY IF EXISTS "authenticated_select_archive_videos" ON trn_event_archive_video;
DROP POLICY IF EXISTS "admin_manage_archive_videos" ON trn_event_archive_video;
DROP POLICY IF EXISTS "authenticated_select_archive_visible_groups" ON trn_event_archive_visible_group;
DROP POLICY IF EXISTS "admin_manage_archive_visible_groups" ON trn_event_archive_visible_group;

CREATE POLICY "authenticated_select_event_archives" ON mst_event_archive
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_event_archives" ON mst_event_archive
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_files" ON trn_event_archive_file
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_archive_files" ON trn_event_archive_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_videos" ON trn_event_archive_video
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_archive_videos" ON trn_event_archive_video
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_archive_visible_groups" ON trn_event_archive_visible_group
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_archive_visible_groups" ON trn_event_archive_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- NOTICES
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_notices" ON mst_notice;
DROP POLICY IF EXISTS "admin_manage_notices" ON mst_notice;
DROP POLICY IF EXISTS "authenticated_select_notice_categories" ON mst_notice_category;
DROP POLICY IF EXISTS "admin_manage_notice_categories" ON mst_notice_category;
DROP POLICY IF EXISTS "authenticated_select_notice_files" ON trn_notice_file;
DROP POLICY IF EXISTS "admin_manage_notice_files" ON trn_notice_file;
DROP POLICY IF EXISTS "authenticated_select_notice_visible_groups" ON trn_notice_visible_group;
DROP POLICY IF EXISTS "admin_manage_notice_visible_groups" ON trn_notice_visible_group;

CREATE POLICY "authenticated_select_notices" ON mst_notice
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_notices" ON mst_notice
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_categories" ON mst_notice_category
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_notice_categories" ON mst_notice_category
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_files" ON trn_notice_file
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_notice_files" ON trn_notice_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_notice_visible_groups" ON trn_notice_visible_group
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_notice_visible_groups" ON trn_notice_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- CONSULTATIONS
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_consultations" ON mst_consultation;
DROP POLICY IF EXISTS "admin_manage_consultations" ON mst_consultation;
DROP POLICY IF EXISTS "authenticated_select_consultation_schedules" ON mst_consultation_schedule;
DROP POLICY IF EXISTS "admin_manage_consultation_schedules" ON mst_consultation_schedule;
DROP POLICY IF EXISTS "user_select_own_consultation_apps" ON trn_consultation_application;
DROP POLICY IF EXISTS "user_insert_consultation_app" ON trn_consultation_application;
DROP POLICY IF EXISTS "admin_manage_consultation_apps" ON trn_consultation_application;
DROP POLICY IF EXISTS "user_select_own_consultation_attendee" ON trn_consultation_attendee;
DROP POLICY IF EXISTS "admin_manage_consultation_attendee" ON trn_consultation_attendee;
DROP POLICY IF EXISTS "authenticated_select_consultation_questions" ON trn_consultation_question;
DROP POLICY IF EXISTS "admin_manage_consultation_questions" ON trn_consultation_question;
DROP POLICY IF EXISTS "user_select_own_consultation_answers" ON trn_consultation_question_answer;
DROP POLICY IF EXISTS "user_insert_consultation_answers" ON trn_consultation_question_answer;
DROP POLICY IF EXISTS "admin_manage_consultation_answers" ON trn_consultation_question_answer;
DROP POLICY IF EXISTS "user_select_own_schedule_candidates" ON trn_consultation_schedule_candidate;
DROP POLICY IF EXISTS "user_insert_schedule_candidates" ON trn_consultation_schedule_candidate;
DROP POLICY IF EXISTS "admin_manage_schedule_candidates" ON trn_consultation_schedule_candidate;

CREATE POLICY "authenticated_select_consultations" ON mst_consultation
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_consultations" ON mst_consultation
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_consultation_schedules" ON mst_consultation_schedule
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_consultation_schedules" ON mst_consultation_schedule
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_apps" ON trn_consultation_application
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "user_insert_consultation_app" ON trn_consultation_application
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_consultation_apps" ON trn_consultation_application
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_attendee" ON trn_consultation_attendee
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "admin_manage_consultation_attendee" ON trn_consultation_attendee
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_consultation_questions" ON trn_consultation_question
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_consultation_questions" ON trn_consultation_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_consultation_answers" ON trn_consultation_question_answer
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT application_id FROM trn_consultation_application WHERE user_id = auth.uid()
    ) OR is_admin_or_instructor()
  );
CREATE POLICY "user_insert_consultation_answers" ON trn_consultation_question_answer
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_manage_consultation_answers" ON trn_consultation_question_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT application_id FROM trn_consultation_application WHERE user_id = auth.uid()
    ) OR is_admin_or_instructor()
  );
CREATE POLICY "user_insert_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_manage_schedule_candidates" ON trn_consultation_schedule_candidate
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- QUESTIONS & ANSWERS
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_questions" ON trn_question;
DROP POLICY IF EXISTS "user_insert_questions" ON trn_question;
DROP POLICY IF EXISTS "admin_manage_questions" ON trn_question;
DROP POLICY IF EXISTS "authenticated_select_answers" ON trn_answer;
DROP POLICY IF EXISTS "admin_manage_answers" ON trn_answer;

CREATE POLICY "authenticated_select_questions" ON trn_question
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (is_hidden IS NOT TRUE AND deleted_at IS NULL) OR
    is_admin_or_instructor()
  );
CREATE POLICY "user_insert_questions" ON trn_question
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_questions" ON trn_question
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_answers" ON trn_answer
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL OR is_admin_or_instructor());
CREATE POLICY "admin_manage_answers" ON trn_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- FAQ / BEGINNER GUIDE / RADIO / REFERENCE DATA
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_faq" ON mst_faq;
DROP POLICY IF EXISTS "admin_manage_faq" ON mst_faq;

CREATE POLICY "authenticated_select_faq" ON mst_faq
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_faq" ON mst_faq
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- Beginner Guide
DROP POLICY IF EXISTS "authenticated_select_guide_items" ON mst_beginner_guide_item;
DROP POLICY IF EXISTS "admin_manage_guide_items" ON mst_beginner_guide_item;
DROP POLICY IF EXISTS "authenticated_select_guide_files" ON mst_beginner_guide_file;
DROP POLICY IF EXISTS "admin_manage_guide_files" ON mst_beginner_guide_file;
DROP POLICY IF EXISTS "authenticated_select_guide_videos" ON mst_beginner_guide_video;
DROP POLICY IF EXISTS "admin_manage_guide_videos" ON mst_beginner_guide_video;

CREATE POLICY "authenticated_select_guide_items" ON mst_beginner_guide_item
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_guide_items" ON mst_beginner_guide_item
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_guide_files" ON mst_beginner_guide_file
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_guide_files" ON mst_beginner_guide_file
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_guide_videos" ON mst_beginner_guide_video
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_guide_videos" ON mst_beginner_guide_video
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- Radio
DROP POLICY IF EXISTS "authenticated_select_radio" ON mst_radio;
DROP POLICY IF EXISTS "admin_manage_radio" ON mst_radio;
DROP POLICY IF EXISTS "authenticated_select_radio_visible_groups" ON trn_radio_visible_group;
DROP POLICY IF EXISTS "admin_manage_radio_visible_groups" ON trn_radio_visible_group;

CREATE POLICY "authenticated_select_radio" ON mst_radio
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_radio" ON mst_radio
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_radio_visible_groups" ON trn_radio_visible_group
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_radio_visible_groups" ON trn_radio_visible_group
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_notifications" ON mst_notification;
DROP POLICY IF EXISTS "admin_manage_notifications" ON mst_notification;
DROP POLICY IF EXISTS "user_select_own_notification_settings" ON mst_notification_settings;
DROP POLICY IF EXISTS "user_manage_own_notification_settings" ON mst_notification_settings;
DROP POLICY IF EXISTS "user_select_own_user_notifications" ON trn_user_notification;
DROP POLICY IF EXISTS "user_manage_own_user_notifications" ON trn_user_notification;
DROP POLICY IF EXISTS "admin_manage_user_notifications" ON trn_user_notification;

CREATE POLICY "authenticated_select_notifications" ON mst_notification
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_notifications" ON mst_notification
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_notification_settings" ON mst_notification_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_manage_own_notification_settings" ON mst_notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_select_own_user_notifications" ON trn_user_notification
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_manage_own_user_notifications" ON trn_user_notification
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_user_notifications" ON trn_user_notification
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- SURVEYS
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_surveys" ON mst_survey;
DROP POLICY IF EXISTS "admin_manage_surveys" ON mst_survey;
DROP POLICY IF EXISTS "authenticated_select_survey_details" ON mst_survey_detail;
DROP POLICY IF EXISTS "admin_manage_survey_details" ON mst_survey_detail;
DROP POLICY IF EXISTS "user_select_own_survey_answers" ON trn_survey_answer;
DROP POLICY IF EXISTS "user_insert_survey_answers" ON trn_survey_answer;
DROP POLICY IF EXISTS "user_update_survey_answers" ON trn_survey_answer;
DROP POLICY IF EXISTS "admin_manage_survey_answers" ON trn_survey_answer;

CREATE POLICY "authenticated_select_surveys" ON mst_survey
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_surveys" ON mst_survey
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_survey_details" ON mst_survey_detail
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_survey_details" ON mst_survey_detail
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_survey_answers" ON trn_survey_answer
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "user_insert_survey_answers" ON trn_survey_answer
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_update_survey_answers" ON trn_survey_answer
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage_survey_answers" ON trn_survey_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- OTHER REFERENCE TABLES
-- ============================================================

DROP POLICY IF EXISTS "authenticated_select_archive_types" ON mst_archive_type;
DROP POLICY IF EXISTS "admin_manage_archive_types" ON mst_archive_type;
DROP POLICY IF EXISTS "authenticated_select_industries" ON mst_industry;
DROP POLICY IF EXISTS "authenticated_select_themes" ON mst_theme;
DROP POLICY IF EXISTS "admin_manage_themes" ON mst_theme;
DROP POLICY IF EXISTS "authenticated_select_question_manual" ON mst_question_manual;
DROP POLICY IF EXISTS "admin_manage_question_manual" ON mst_question_manual;
DROP POLICY IF EXISTS "admin_select_meeting_links" ON mst_meeting_link;
DROP POLICY IF EXISTS "admin_manage_meeting_links" ON mst_meeting_link;

CREATE POLICY "authenticated_select_archive_types" ON mst_archive_type
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_archive_types" ON mst_archive_type
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_industries" ON mst_industry
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "authenticated_select_themes" ON mst_theme
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_themes" ON mst_theme
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "authenticated_select_question_manual" ON mst_question_manual
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "admin_manage_question_manual" ON mst_question_manual
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_select_meeting_links" ON mst_meeting_link
  FOR SELECT TO authenticated USING (is_admin_or_instructor());
CREATE POLICY "admin_manage_meeting_links" ON mst_meeting_link
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- INQUIRIES
-- ============================================================

DROP POLICY IF EXISTS "user_select_own_inquiries" ON mst_inquiry;
DROP POLICY IF EXISTS "user_insert_inquiry" ON mst_inquiry;
DROP POLICY IF EXISTS "admin_manage_inquiries" ON mst_inquiry;
DROP POLICY IF EXISTS "user_select_own_inquiry_answers" ON trn_inquiry_answer;
DROP POLICY IF EXISTS "admin_manage_inquiry_answers" ON trn_inquiry_answer;

CREATE POLICY "user_select_own_inquiries" ON mst_inquiry
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "user_insert_inquiry" ON mst_inquiry
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_inquiries" ON mst_inquiry
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "user_select_own_inquiry_answers" ON trn_inquiry_answer
  FOR SELECT TO authenticated
  USING (
    inquiry_id IN (SELECT inquiry_id FROM mst_inquiry WHERE user_id = auth.uid()) OR
    is_admin_or_instructor()
  );
CREATE POLICY "admin_manage_inquiry_answers" ON trn_inquiry_answer
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- BROADCAST
-- ============================================================

DROP POLICY IF EXISTS "admin_manage_broadcast_history" ON trn_broadcast_history;
DROP POLICY IF EXISTS "admin_manage_broadcast_targets" ON trn_broadcast_target_user;

CREATE POLICY "admin_manage_broadcast_history" ON trn_broadcast_history
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

CREATE POLICY "admin_manage_broadcast_targets" ON trn_broadcast_target_user
  FOR ALL TO authenticated
  USING (is_admin_or_instructor()) WITH CHECK (is_admin_or_instructor());

-- ============================================================
-- USER PROGRESS / INVITES / NFC
-- ============================================================

DROP POLICY IF EXISTS "user_select_own_progress" ON trn_user_guide_progress;
DROP POLICY IF EXISTS "user_manage_own_progress" ON trn_user_guide_progress;
DROP POLICY IF EXISTS "user_select_own_invites" ON trn_invite;
DROP POLICY IF EXISTS "user_insert_invites" ON trn_invite;
DROP POLICY IF EXISTS "user_select_own_nfc" ON trn_nfc_exchange;
DROP POLICY IF EXISTS "user_insert_nfc" ON trn_nfc_exchange;

CREATE POLICY "user_select_own_progress" ON trn_user_guide_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_manage_own_progress" ON trn_user_guide_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_select_own_invites" ON trn_invite
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR recipient_id = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "user_insert_invites" ON trn_invite
  FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "user_select_own_nfc" ON trn_nfc_exchange
  FOR SELECT TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR is_admin_or_instructor());
CREATE POLICY "user_insert_nfc" ON trn_nfc_exchange
  FOR INSERT TO authenticated
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- ============================================================
-- Verify all policies created
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
