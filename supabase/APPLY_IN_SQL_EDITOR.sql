-- ============================================================
-- SABITEK: ALL PENDING MIGRATIONS IN ONE PASTE
-- Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to run once; idempotent-ish (IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================

-- ============================================================
-- Amendment (same feature, applied later): completing a lesson
-- also requires passing ITS OWN quiz (when it has a real one).
-- can_complete_lesson = is_lesson_unlocked + own-quiz-passed,
-- with instructor/super-admin bypass. Write policies now use it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_complete_lesson(p_lesson_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
SELECT public.is_lesson_unlocked(p_lesson_id, p_user)
  AND (
    EXISTS (
      SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.id = p_lesson_id AND c.instructor_id = p_user
    )
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true)
    OR NOT EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.lesson_id = p_lesson_id
        AND jsonb_typeof(q.questions) = 'array'
        AND jsonb_array_length(q.questions) > 0
    )
    OR EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa.user_id = p_user AND qa.lesson_id = p_lesson_id AND qa.passed = true
    )
  );
$$;

DROP POLICY IF EXISTS "user_progress_insert_own_unlocked" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_own_unlocked" ON public.user_progress;

CREATE POLICY "user_progress_insert_own_unlocked" ON public.user_progress
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.can_complete_lesson(lesson_id, auth.uid())
  );

CREATE POLICY "user_progress_update_own_unlocked" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_complete_lesson(lesson_id, auth.uid())
  );

-- ──────────── 20260716_sabibot_ai_engine.sql ────────────
-- SabiBot AI engine: usage metering, lesson artifacts, Q&A reuse cache.
-- All three tables are written ONLY by service-role API routes; RLS is
-- enabled with no anon/authenticated write policies (service role bypasses).

BEGIN;

-- Per-request token metering (quota enforcement + admin cost visibility)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  feature text NOT NULL DEFAULT 'sabibot',
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_user_day_idx
  ON public.ai_usage (user_id, created_at);

-- One-time generated lesson artifacts (summary/key points/suggested questions)
CREATE TABLE IF NOT EXISTS public.lesson_ai_artifacts (
  lesson_id uuid PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  summary text,
  key_points jsonb,
  suggested_questions jsonb,
  model text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Repeated-question cache: the 40th learner asking the same thing pays zero tokens
CREATE TABLE IF NOT EXISTS public.qa_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  lang text NOT NULL DEFAULT 'english',
  question_hash text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, lang, question_hash)
);

ALTER TABLE public.ai_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_cache            ENABLE ROW LEVEL SECURITY;

-- Learners may read artifacts for lessons (rendered in the lesson viewer)
CREATE POLICY "lesson_artifacts_read" ON public.lesson_ai_artifacts
  FOR SELECT TO authenticated USING (true);

REVOKE ALL ON public.ai_usage, public.qa_cache FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_ai_artifacts FROM anon, authenticated;

COMMIT;

-- ──────────── 20260716_quiz_grading_lockdown.sql ────────────
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

-- ──────────── 20260716_xp_events.sql ────────────
-- XP engine for weekly leaderboards. Written ONLY by service-role API
-- routes (lazy sync from real user_progress / quiz_attempts rows), so XP
-- cannot be farmed or spoofed. The unique key makes every award idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source text NOT NULL,          -- lesson_complete | quiz_pass | quiz_perfect
  points integer NOT NULL,
  ref_id text NOT NULL,          -- lesson id the event derives from
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, ref_id)
);
CREATE INDEX IF NOT EXISTS xp_events_user_week_idx
  ON public.xp_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS xp_events_week_idx
  ON public.xp_events (created_at);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.xp_events FROM anon, authenticated;

COMMIT;
