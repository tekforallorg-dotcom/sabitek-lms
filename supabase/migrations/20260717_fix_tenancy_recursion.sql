-- HOTFIX: courses/lessons tenancy policies referenced institution_members,
-- whose own (pre-existing) policy is self-referencing -> "infinite recursion
-- detected in policy" -> every authenticated course query returned 500.
-- Cure: move all lookups into SECURITY DEFINER functions (they bypass RLS
-- evaluation, exactly like is_lesson_unlocked), and rebuild the three
-- policies on top of them.

BEGIN;

-- One function answers "may this user read this course?" for every layer.
CREATE OR REPLACE FUNCTION public.can_read_course(p_course uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1 FROM courses co
  WHERE co.id = p_course
    AND (
      (co.status = 'published' AND co.institution_id IS NULL)
      OR co.instructor_id = p_user
      OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true)
      OR (
        co.status = 'published'
        AND co.institution_id IS NOT NULL
        AND (
          EXISTS (
            SELECT 1 FROM institution_members im
            WHERE im.institution_id = co.institution_id
              AND im.user_id = p_user
              AND im.status = 'active'
          )
          OR EXISTS (
            SELECT 1
            FROM cohort_members cm
            JOIN cohorts c ON c.id = cm.cohort_id
            JOIN program_courses pc ON pc.program_id = c.program_id
            WHERE pc.course_id = co.id
              AND cm.user_id = p_user
              AND cm.status = 'active'
          )
        )
      )
    )
);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_lesson_quiz(p_lesson uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1 FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE l.id = p_lesson AND c.instructor_id = p_user
)
OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user AND u.is_super_admin = true);
$$;

-- Rebuild the authenticated courses policy (anon public-published one is
-- plain-column and safe; leave it).
DROP POLICY IF EXISTS "courses_select_tenancy" ON public.courses;
CREATE POLICY "courses_select_tenancy" ON public.courses
  FOR SELECT TO authenticated
  USING (public.can_read_course(id, auth.uid()));

DROP POLICY IF EXISTS "lessons_select_tenancy" ON public.lessons;
CREATE POLICY "lessons_select_tenancy" ON public.lessons
  FOR SELECT TO authenticated
  USING (public.can_read_course(course_id, auth.uid()));

-- Quizzes policy joined courses directly (same recursion path via courses'
-- policy referencing institution_members); rebuild on the definer function.
DROP POLICY IF EXISTS "quizzes_select_instructor_or_admin" ON public.quizzes;
CREATE POLICY "quizzes_select_instructor_or_admin" ON public.quizzes
  FOR SELECT TO authenticated
  USING (public.can_manage_lesson_quiz(lesson_id, auth.uid()));

COMMIT;
