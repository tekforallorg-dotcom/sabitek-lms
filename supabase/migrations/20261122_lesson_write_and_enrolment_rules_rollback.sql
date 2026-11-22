-- Rollback for 20261122_lesson_write_and_enrolment_rules.sql.
--
-- Restores the rules exactly as they were on 2026-11-22, including the holes
-- the migration closed. Use only if the new rules block something legitimate.

-- 1. Lessons: the two original write policies
drop policy if exists lessons_write_course_owner on public.lessons;

drop policy if exists "Instructors can manage lessons in their modules" on public.lessons;
create policy "Instructors can manage lessons in their modules" on public.lessons
  for all
  to public
  using (
    (module_id is null)
    or exists (
      select 1 from modules m join courses c on c.id = m.course_id
      where m.id = lessons.module_id and c.instructor_id = auth.uid()
    )
  );

drop policy if exists "Instructors can manage own lessons" on public.lessons;
create policy "Instructors can manage own lessons" on public.lessons
  for all
  to public
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

-- 2. Enrolments: remove the identity guard
drop trigger if exists course_enrollments_keep_identity on public.course_enrollments;
drop function if exists public.course_enrollments_keep_identity();

-- 3. can_complete_lesson without the enrolment requirement
create or replace function public.can_complete_lesson(p_lesson_id uuid, p_user uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
select public.is_lesson_unlocked(p_lesson_id, p_user)
  and (
    exists (
      select 1 from lessons l join courses c on c.id = l.course_id
      where l.id = p_lesson_id and c.instructor_id = p_user
    )
    or exists (select 1 from users u where u.id = p_user and u.is_super_admin = true)
    or not exists (
      select 1 from quizzes q
      where q.lesson_id = p_lesson_id
        and jsonb_typeof(q.questions) = 'array'
        and jsonb_array_length(q.questions) > 0
    )
    or exists (
      select 1 from quiz_attempts qa
      where qa.user_id = p_user and qa.lesson_id = p_lesson_id and qa.passed = true
    )
  );
$$;
