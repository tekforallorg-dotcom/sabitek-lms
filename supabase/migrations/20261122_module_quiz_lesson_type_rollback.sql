-- Rollback for 20261122_module_quiz_lesson_type.sql.
--
-- Fails on purpose if any module quiz exists: those lessons would break the
-- narrower rule. Delete or convert them first (their quizzes and attempts go
-- with them, by the existing ON DELETE CASCADE).

alter table public.lessons drop constraint if exists lessons_content_type_check;

alter table public.lessons
  add constraint lessons_content_type_check
  check (
    (content_type)::text = any (
      array['text', 'video', 'pdf', 'powerpoint', 'youtube']::text[]
    )
  );
