-- Server-side quiz grading lockdown.
-- The app now delivers quizzes through /api/quizzes/for-lesson (answers
-- stripped) and grades through /api/quizzes/grade (service role writes
-- quiz_attempts). This migration closes the direct-table paths:
--   1. Learners can no longer SELECT quizzes (correct answers were readable)
--   2. Clients can no longer INSERT quiz_attempts (passed was self-asserted,
--      which could spoof lesson gating and certificate eligibility)

BEGIN;

-- 1. Drop every existing SELECT policy on quizzes, then allow only the
--    course instructor and super admins to read directly. Learners get
--    quizzes exclusively via the sanitized service-role API.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quizzes' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.quizzes', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "quizzes_select_instructor_or_admin" ON public.quizzes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = quizzes.lesson_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_super_admin = true
    )
  );

-- 2. Drop every INSERT policy on quiz_attempts. Only the grading API
--    (service role, bypasses RLS) writes attempts now. Learners keep
--    their own-row SELECT for history and gating reads.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quiz_attempts' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.quiz_attempts', r.policyname);
  END LOOP;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM anon, authenticated;

COMMIT;
