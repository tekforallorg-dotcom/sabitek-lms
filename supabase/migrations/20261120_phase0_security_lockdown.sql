-- =============================================================================
-- Phase 0 security lockdown
-- =============================================================================
-- Closes the permission holes found in the November 2026 audit. Every change
-- narrows access; nothing here changes data.
--
-- APPLY ORDER: deploy the application code from the same pull request FIRST,
-- then run this. The code stops relying on the open policies removed below.
--
-- Rollback: 20261120_phase0_security_lockdown_rollback.sql
--
-- What the app still does from the browser after this (all verified in code):
--   users            update own profile fields + preferred_language
--   wallet_accounts  read own row
--   wallet_ledger    read own rows
--   notifications    read / mark-read own rows
--   user_xp, xp_history, user_badges   SabiQuiz reads and writes OWN rows
--   course_enrollments  enrol self in a course the learner is entitled to
-- Everything else on these tables goes through API routes (service role).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. users: no self-promotion, no anonymous directory
-- -----------------------------------------------------------------------------
-- Before: "Users can update own data" let a signed-in user update EVERY column
-- of their own row, including is_super_admin, role, platform_role, plan_tier
-- and status. Any account could make itself a super admin.
--
-- After: the browser can only change profile fields. Privileged columns are
-- writable by the service role (API routes) alone.

revoke insert, update, delete, truncate on public.users from anon, authenticated;

grant update (
  full_name,
  bio,
  avatar_url,
  profile_image_url,
  phone,
  location,
  website,
  preferred_language,
  updated_at
) on public.users to authenticated;

drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users can update own profile" on public.users;

create policy users_update_own_profile on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Before: "Anyone can view profiles" (USING true, role public) exposed every
-- user's email and phone number to anyone holding the public anon key.
--
-- After: signed-out visitors can read nothing from this table. Signed-in users
-- can still read profiles, because course, community and admin pages join to
-- it from the browser. Hiding other users' email/phone from signed-in users
-- needs a public-profile view and is tracked for phase 1.

drop policy if exists "Anyone can view profiles" on public.users;
drop policy if exists "Users can read own data" on public.users;

create policy users_select_signed_in on public.users
  for select to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 2. handle_new_user: sign-up metadata may not grant the admin role
-- -----------------------------------------------------------------------------
-- Before: role was cast straight from raw_user_meta_data, which the person
-- signing up controls. Passing role=admin produced an admin-role profile, and
-- an unknown value made the cast fail and broke the sign-up.
--
-- After: only learner and instructor are honoured; anything else is learner.
-- Body is otherwise unchanged. search_path is pinned.

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    bio,
    profile_image_url,
    avatar_url,
    phone,
    is_super_admin,
    status,
    preferred_language,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' = 'instructor' then 'instructor'::public.user_role
      else 'learner'::public.user_role
    end,
    null,
    null,
    null,
    null,
    false,
    'active'::public.user_status,
    'english',
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 3. Wallet: balances and ledgers are server-written only
-- -----------------------------------------------------------------------------
-- Before: users could UPDATE their own wallet_accounts row (set any balance);
-- wallet_ledger and wallet_transactions had row level security switched OFF
-- with full grants to anon, so anyone could read, edit or delete every row.

-- wallet_accounts: keep read-own, remove every browser write path.
drop policy if exists "Users can update own wallet" on public.wallet_accounts;
drop policy if exists "Users update own wallet" on public.wallet_accounts;
drop policy if exists "Users insert own wallet" on public.wallet_accounts;
drop policy if exists "Users view own wallet" on public.wallet_accounts;       -- duplicate of the next one
drop policy if exists "Users can view own wallet" on public.wallet_accounts;

create policy wallet_accounts_select_own on public.wallet_accounts
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on public.wallet_accounts from anon, authenticated;
revoke select on public.wallet_accounts from anon;

-- wallet_ledger: turn RLS on, drop the USING(true) policy that was open to
-- every role, collapse three duplicate read policies into one.
alter table public.wallet_ledger enable row level security;

drop policy if exists "Service role can do everything on wallet_ledger" on public.wallet_ledger;
drop policy if exists "Users can view own ledger" on public.wallet_ledger;
drop policy if exists "Users view own ledger" on public.wallet_ledger;
drop policy if exists "Users can view own wallet_ledger" on public.wallet_ledger;
-- "Service role full access on wallet_ledger" (TO service_role) is kept.

create policy wallet_ledger_select_own on public.wallet_ledger
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on public.wallet_ledger from anon, authenticated;
revoke select on public.wallet_ledger from anon;

-- wallet_transactions: turn RLS on. Nothing in the browser reads it today; a
-- read-own policy is added so a "my top-ups" view can be built later.
alter table public.wallet_transactions enable row level security;

create policy wallet_transactions_select_own on public.wallet_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on public.wallet_transactions from anon, authenticated;
revoke select on public.wallet_transactions from anon;

-- wallet_summary ran with its owner's rights (SECURITY DEFINER view), which
-- bypassed the ledger's RLS. Make it respect the caller's.
alter view public.wallet_summary set (security_invoker = true);

-- -----------------------------------------------------------------------------
-- 4. XP and badges: own rows only
-- -----------------------------------------------------------------------------
-- Before: "Service can manage ..." was FOR ALL TO public USING (true), so any
-- visitor could rewrite anyone's XP, history or badges.
--
-- After: a signed-in user can write only their own rows. SabiQuiz still awards
-- XP from the browser (lib/sabiquiz/quiz-utils.ts), so own-row writes must stay
-- until that moves server-side in the SabiQuiz rebuild. A user can still
-- inflate their OWN XP; they can no longer touch anyone else's.

drop policy if exists "Service can manage xp" on public.user_xp;
create policy user_xp_write_own on public.user_xp
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Service can manage xp history" on public.xp_history;
create policy xp_history_write_own on public.xp_history
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Service can manage badges" on public.user_badges;
create policy user_badges_write_own on public.user_badges
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 5. audit_logs and notifications: only the server may insert
-- -----------------------------------------------------------------------------
-- Before: INSERT WITH CHECK (true) for role public. Anyone could forge audit
-- entries or push notifications to any user. Both are written exclusively via
-- the service role (lib/audit-logger.ts, lib/notifications.ts), which bypasses
-- RLS, so no replacement policy is needed.

drop policy if exists "System can insert audit logs" on public.audit_logs;
drop policy if exists "System can create notifications" on public.notifications;

-- -----------------------------------------------------------------------------
-- 6. course_enrollments: self-enrol only when entitled
-- -----------------------------------------------------------------------------
-- Before: any signed-in user could insert an enrolment for ANY course,
-- including paid ones, skipping payment.
--
-- After: same rule the server uses in lib/course-access.ts. Self-enrolment is
-- allowed when the course is free, or the learner has a successful purchase,
-- or they are in an active cohort whose program includes the course. Paid
-- purchases are still enrolled by the server after payment verification.

create or replace function public.can_self_enroll(p_course uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select
    exists (
      select 1 from courses c
      where c.id = p_course
        and (coalesce(c.is_free, false) or coalesce(c.price, 0) = 0)
    )
    or exists (
      select 1 from course_purchases cp
      where cp.course_id = p_course
        and cp.user_id = (select auth.uid())
        and cp.status = 'successful'
    )
    or exists (
      select 1
      from cohort_members cm
      join cohorts co on co.id = cm.cohort_id
      join program_courses pc on pc.program_id = co.program_id
      where cm.user_id = (select auth.uid())
        and cm.status in ('active', 'completed')
        and co.status = 'active'
        and pc.course_id = p_course
    );
$function$;

revoke execute on function public.can_self_enroll(uuid) from public, anon;
grant execute on function public.can_self_enroll(uuid) to authenticated, service_role;

drop policy if exists "Enable insert for authenticated users" on public.course_enrollments;
drop policy if exists "Users can enroll in courses" on public.course_enrollments;

create policy course_enrollments_insert_own_entitled on public.course_enrollments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.can_self_enroll(course_id)
  );

-- -----------------------------------------------------------------------------
-- 7. Privileged functions: server-only
-- -----------------------------------------------------------------------------
-- These SECURITY DEFINER functions write data for an arbitrary user id passed
-- as an argument and were callable by anyone through /rest/v1/rpc. They are
-- only called from API routes (service role) or as a trigger, and are not used
-- inside any RLS policy, so revoking browser access breaks nothing.
-- (The can_*/is_* helper functions are used by RLS policies and must stay
-- executable; they are read-only.)

revoke execute on function public.add_milestone(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.auto_generate_certificate(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.check_course_completion(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.update_study_streak(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.add_milestone(uuid, text, text, text, jsonb) to service_role;
grant execute on function public.auto_generate_certificate(uuid, uuid) to service_role;
grant execute on function public.check_course_completion(uuid, uuid) to service_role;
grant execute on function public.update_study_streak(uuid) to service_role;
-- The sign-up trigger on auth.users runs as the auth service.
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- -----------------------------------------------------------------------------
-- 8. avatars bucket: uploader-owned
-- -----------------------------------------------------------------------------
-- Before: the three write policies checked only bucket_id, for role public, so
-- anyone (signed in or not) could upload to, overwrite or delete any object in
-- the bucket. The bucket is currently empty; profile pictures are uploaded
-- elsewhere. Public read is kept.

drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

create policy avatars_insert_signed_in on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and owner = (select auth.uid()))
  with check (bucket_id = 'avatars' and owner = (select auth.uid()));

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and owner = (select auth.uid()));

commit;

-- =============================================================================
-- Verification (run after applying; each should return the value noted)
-- =============================================================================
-- Tables with RLS off in public                                   -> 0 rows
--   select relname from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;
--
-- Write policies open to everyone (USING/WITH CHECK true)         -> only sabiquiz_questions insert
--   select tablename, policyname, cmd, roles from pg_policies
--   where schemaname = 'public' and cmd <> 'SELECT'
--     and coalesce(qual, 'true') = 'true' and coalesce(with_check, 'true') = 'true'
--     and roles::text not like '%service_role%';
--
-- Columns a signed-in user may update on users                    -> the nine profile columns
--   select column_name from information_schema.column_privileges
--   where table_schema = 'public' and table_name = 'users'
--     and grantee = 'authenticated' and privilege_type = 'UPDATE';
