-- Module quizzes: allow a lesson whose only content is a quiz.
--
-- A module quiz is stored as a lesson with content_type 'quiz', placed last in
-- its module, with its questions in the existing quizzes row for that lesson.
-- Nothing else changes: quizzes, quiz_attempts, user_progress and
-- is_lesson_unlocked() already work per lesson, so a quiz-only lesson is
-- graded, recorded and gated exactly like a quiz attached to a video lesson.
--
-- This only widens the list of allowed values. No existing row is read,
-- changed or re-validated against a narrower rule.

alter table public.lessons drop constraint if exists lessons_content_type_check;

alter table public.lessons
  add constraint lessons_content_type_check
  check (
    (content_type)::text = any (
      array['text', 'video', 'pdf', 'powerpoint', 'youtube', 'quiz']::text[]
    )
  );
