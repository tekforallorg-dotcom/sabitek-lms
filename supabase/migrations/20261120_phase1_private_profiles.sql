-- =============================================================================
-- Phase 1: private profiles
-- =============================================================================
-- After the phase 0 lockdown, any SIGNED-IN user could still read every row and
-- column of public.users, including other people's email and phone number.
-- Sign-up is only gated in the app, so "signed in" is not a meaningful barrier.
--
-- After this migration a signed-in user can read from public.users:
--   * their own row (all columns)
--   * every row, if they are a platform admin
--   * the rows of learners enrolled in, or who took a quiz in, a course they
--     teach (the instructor sales table and quiz analytics show learner emails)
-- Names and avatars of anyone else come from get_public_profiles(), which
-- returns display fields only.
--
-- APPLY ORDER: deploy the application code from the same pull request FIRST.
-- The code stops embedding public.users to show other people's names.
--
-- Rollback: 20261120_phase1_private_profiles_rollback.sql
-- =============================================================================

begin;

-- Does the signed-in caller teach this user?
create or replace function public.instructor_can_view_user(p_user uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    exists (
      select 1
      from course_enrollments ce
      join courses c on c.id = ce.course_id
      where ce.user_id = p_user
        and c.instructor_id = (select auth.uid())
    )
    or exists (
      select 1
      from quiz_attempts qa
      join courses c on c.id = qa.course_id
      where qa.user_id = p_user
        and c.instructor_id = (select auth.uid())
    );
$function$;

revoke execute on function public.instructor_can_view_user(uuid) from public, anon;
grant execute on function public.instructor_can_view_user(uuid) to authenticated, service_role;

-- Display fields of other users. No email, phone or account fields, ever.
-- Capped at 200 ids per call so it cannot be used to page through the table.
create or replace function public.get_public_profiles(p_ids uuid[])
 returns table (
   id uuid,
   full_name text,
   avatar_url text,
   profile_image_url text,
   bio text,
   role text
 )
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    u.id,
    u.full_name::text,
    u.avatar_url,
    u.profile_image_url,
    u.bio,
    u.role::text
  from users u
  where u.id = any (p_ids[1:200]);
$function$;

revoke execute on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_profiles(uuid[]) to authenticated, service_role;

-- Replace "every signed-in user sees every row" with the three cases above.
-- is_platform_admin() and instructor_can_view_user() are SECURITY DEFINER, so
-- the policy does not recurse into public.users.
drop policy if exists users_select_signed_in on public.users;

create policy users_select_visible on public.users
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_platform_admin((select auth.uid()))
    or public.instructor_can_view_user(id)
  );

commit;

-- =============================================================================
-- Verification (run after applying)
-- =============================================================================
-- As a learner:     select count(*) from public.users;            -> 1
-- As an instructor: select count(*) from public.users;            -> 1 + their learners
-- As a super admin: select count(*) from public.users;            -> all users
-- As a learner:     select * from public.get_public_profiles(array['<other id>']::uuid[]);
--                   -> one row, six display columns, no email/phone
