-- Three database rules found open by the end-to-end test of 2026-11-22.
--
-- 1. Any signed-in user could add a lesson to anyone's course.
--    "Instructors can manage lessons in their modules" allowed every command
--    when module_id IS NULL, with no WITH CHECK, so an insert with a null
--    module passed. "Instructors can manage own lessons" checked
--    instructor_id = auth.uid(), and instructor_id defaults to auth.uid(), so
--    any insert passed that one too. Both are replaced by one rule: only the
--    course's instructor writes its lessons, and a lesson's module must belong
--    to the same course.
--
-- 2. A learner could move an existing enrolment to another course.
--    New enrolments are checked by can_self_enroll(), but the update policy
--    only checks user_id, so changing course_id on a free enrolment gave
--    access to a paid course. An enrolment's person and course are now fixed.
--
-- 3. Lesson completion did not require enrolment.
--    can_complete_lesson() checked the lesson order and the quiz, nothing
--    else, so any signed-in user could record progress in a public course.
--    Learners now need an enrolment. Instructors and super admins are
--    unchanged.
--
-- Nothing here changes or removes data.

-- 1. Lessons: one write rule, tied to course ownership ------------------------

drop policy if exists "Instructors can manage lessons in their modules" on public.lessons;
drop policy if exists "Instructors can manage own lessons" on public.lessons;
drop policy if exists lessons_write_course_owner on public.lessons;

create policy lessons_write_course_owner on public.lessons
  for all
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
        and c.instructor_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
        and c.instructor_id = (select auth.uid())
    )
    and (
      lessons.module_id is null
      or exists (
        select 1 from public.modules m
        where m.id = lessons.module_id
          and m.course_id = lessons.course_id
      )
    )
  );

-- 2. Enrolments: the person and the course cannot be changed ------------------

create or replace function public.course_enrollments_keep_identity()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.course_id is distinct from old.course_id then
    raise exception 'An enrolment cannot be moved to another course or person'
      using errcode = '42501';
  end if;
  return new;
end
$$;

revoke all on function public.course_enrollments_keep_identity() from public, anon, authenticated;

drop trigger if exists course_enrollments_keep_identity on public.course_enrollments;
create trigger course_enrollments_keep_identity
  before update on public.course_enrollments
  for each row execute function public.course_enrollments_keep_identity();

-- 3. Completing a lesson needs an enrolment -----------------------------------

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
    or (
      exists (
        select 1 from lessons l join course_enrollments ce on ce.course_id = l.course_id
        where l.id = p_lesson_id and ce.user_id = p_user
      )
      and (
        not exists (
          select 1 from quizzes q
          where q.lesson_id = p_lesson_id
            and jsonb_typeof(q.questions) = 'array'
            and jsonb_array_length(q.questions) > 0
        )
        or exists (
          select 1 from quiz_attempts qa
          where qa.user_id = p_user and qa.lesson_id = p_lesson_id and qa.passed = true
        )
      )
    )
  );
$$;
