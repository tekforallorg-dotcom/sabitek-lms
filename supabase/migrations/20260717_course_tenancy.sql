-- Course tenancy: proprietary (institution-owned) courses and their lessons
-- are invisible to everyone except the owning institution's members, the
-- course instructor, cohort-covered learners, and super admins. Public
-- courses (institution_id IS NULL) behave exactly as before.

BEGIN;

-- ── courses: replace all SELECT policies with the tenancy-aware one ──
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'courses' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.courses', r.policyname);
  END LOOP;
END $$;

-- Anonymous visitors may still read public published courses (verify page,
-- previews); proprietary courses are authenticated-and-authorized only.
CREATE POLICY "courses_select_public_published" ON public.courses
  FOR SELECT TO anon
  USING (status = 'published' AND institution_id IS NULL);

CREATE POLICY "courses_select_tenancy" ON public.courses
  FOR SELECT TO authenticated
  USING (
    (status = 'published' AND institution_id IS NULL)
    OR instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_super_admin = true
    )
    OR (
      status = 'published'
      AND institution_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1 FROM public.institution_members im
          WHERE im.institution_id = courses.institution_id
            AND im.user_id = auth.uid()
            AND im.status = 'active'
        )
        OR EXISTS (
          SELECT 1
          FROM public.cohort_members cm
          JOIN public.cohorts c   ON c.id = cm.cohort_id
          JOIN public.program_courses pc ON pc.program_id = c.program_id
          WHERE pc.course_id = courses.id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    )
  );

-- ── lessons: mirror the same tenancy through the course join ──
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lessons' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.lessons', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "lessons_select_tenancy" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses co
      WHERE co.id = lessons.course_id
        AND (
          (co.status = 'published' AND co.institution_id IS NULL)
          OR co.instructor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.is_super_admin = true
          )
          OR (
            co.status = 'published'
            AND co.institution_id IS NOT NULL
            AND (
              EXISTS (
                SELECT 1 FROM public.institution_members im
                WHERE im.institution_id = co.institution_id
                  AND im.user_id = auth.uid()
                  AND im.status = 'active'
              )
              OR EXISTS (
                SELECT 1
                FROM public.cohort_members cm
                JOIN public.cohorts c   ON c.id = cm.cohort_id
                JOIN public.program_courses pc ON pc.program_id = c.program_id
                WHERE pc.course_id = co.id
                  AND cm.user_id = auth.uid()
                  AND cm.status = 'active'
              )
            )
          )
        )
    )
  );

COMMIT;
