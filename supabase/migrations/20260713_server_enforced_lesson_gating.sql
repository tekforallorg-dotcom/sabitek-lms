-- ============================================================
-- Server-enforced sequential lesson gating.
--
-- The client already locks lessons (lib/lesson-gating.ts); this
-- makes the sequence tamper-proof at the data layer: a learner
-- cannot mark a lesson complete unless every preceding lesson in
-- the course sequence is completed and any preceding instructor
-- quiz is passed. Sequence = modules by order_index, lessons by
-- lesson_order within, unassigned lessons last (mirrors the lib).
--
-- Also consolidates user_progress's six overlapping policies
-- into one per command.
--
-- Known follow-up (not covered here): quiz_attempts.passed is
-- still client-asserted; honest grading needs a server route.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_lesson_unlocked(p_lesson_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
WITH target AS (
  SELECT l.id, l.course_id,
         COALESCE(m.order_index, 2147483647) AS m_ord,
         l.lesson_order
  FROM lessons l
  LEFT JOIN modules m ON m.id = l.module_id
  WHERE l.id = p_lesson_id
),
prior AS (
  SELECT l.id
  FROM lessons l
  LEFT JOIN modules m ON m.id = l.module_id
  CROSS JOIN target t
  WHERE l.course_id = t.course_id
    AND (COALESCE(m.order_index, 2147483647), l.lesson_order, l.id)
      < (t.m_ord, t.lesson_order, t.id)
)
SELECT
  -- Course instructors and platform admins bypass gating.
  EXISTS (
    SELECT 1 FROM courses c JOIN target t ON c.id = t.course_id
    WHERE c.instructor_id = p_user
  )
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true
  )
  OR NOT EXISTS (
    SELECT 1 FROM prior p
    WHERE
      -- a preceding lesson is not completed…
      NOT EXISTS (
        SELECT 1 FROM user_progress up
        WHERE up.user_id = p_user
          AND up.lesson_id = p.id
          AND up.completed_at IS NOT NULL
      )
      -- …or it has a real quiz the learner has not passed
      OR EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.lesson_id = p.id
          AND jsonb_typeof(q.questions) = 'array'
          AND jsonb_array_length(q.questions) > 0
          AND NOT EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.user_id = p_user
              AND qa.lesson_id = p.id
              AND qa.passed = true
          )
      )
  );
$$;

-- Consolidate user_progress policies: one per command, writes gated.
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;

-- (SELECT policies stay: own rows + instructors of the course.)

CREATE POLICY "user_progress_insert_own_unlocked" ON public.user_progress
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_lesson_unlocked(lesson_id, auth.uid())
  );

CREATE POLICY "user_progress_update_own_unlocked" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_lesson_unlocked(lesson_id, auth.uid())
  );

CREATE POLICY "user_progress_delete_own" ON public.user_progress
  FOR DELETE USING (auth.uid() = user_id);

COMMIT;

-- ============================================================
-- Follow-up applied in the same release: user_progress,
-- lesson_notes, and course_enrollments still had RLS DISABLED
-- (missed in the original five-table audit). Policies were
-- reviewed (own-row CRUD + instructor SELECTs) then RLS enabled
-- and anon writes revoked, activating the gating policies above.
-- ============================================================

ALTER TABLE public.user_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.user_progress, public.lesson_notes, public.course_enrollments
  FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON public.user_progress, public.lesson_notes, public.course_enrollments
  FROM authenticated;

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
