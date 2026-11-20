-- =============================================================================
-- Phase 1: make the notifications table match the code that uses it
-- =============================================================================
-- 20260718_notifications.sql used CREATE TABLE IF NOT EXISTS, but an older
-- notifications table (from the community module) already existed, so that
-- statement did nothing. The table was left without the columns and types the
-- in-app notification bell needs:
--   * no `href` or `read_at` columns, so every notify() insert failed and
--     "mark as read" failed;
--   * a CHECK constraint listing only the community notification types, so the
--     LMS types (badge, announcement, cohort, completion, system) were
--     rejected.
-- Result: no in-app notification has ever been delivered.
--
-- This is additive. Existing rows and the community columns (entity_id,
-- entity_type, is_read) are untouched.
--
-- Rollback: 20261120_phase1_fix_notifications_table_rollback.sql
-- =============================================================================

begin;

alter table public.notifications
  add column if not exists href text,
  add column if not exists read_at timestamptz;

-- Carry the old read flag over so already-read rows stay read.
update public.notifications
   set read_at = coalesce(created_at, now())
 where is_read is true
   and read_at is null;

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check check (
  type = any (array[
    -- community
    'session_request', 'session_request_accepted', 'session_request_declined',
    'offer', 'offer_accepted', 'offer_declined',
    'session_scheduled', 'session_reminder', 'message', 'review_prompt',
    -- LMS (lib/notifications.ts)
    'badge', 'announcement', 'cohort', 'completion', 'system'
  ])
);

commit;
