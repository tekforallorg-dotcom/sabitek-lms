-- =============================================================================
-- Rollback for 20261120_phase1_fix_notifications_table.sql
-- =============================================================================
-- Restores the original type constraint and drops the two added columns.
-- Any LMS notifications created since the fix must be removed first, because
-- the original constraint does not allow their types.
-- =============================================================================

begin;

delete from public.notifications
 where type in ('badge', 'announcement', 'cohort', 'completion', 'system');

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check check (
  type = any (array[
    'session_request', 'session_request_accepted', 'session_request_declined',
    'offer', 'offer_accepted', 'offer_declined',
    'session_scheduled', 'session_reminder', 'message', 'review_prompt'
  ])
);

alter table public.notifications
  drop column if exists href,
  drop column if exists read_at;

commit;
