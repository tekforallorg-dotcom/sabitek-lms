-- =============================================================================
-- Rollback for 20261120_phase0_security_lockdown.sql
-- =============================================================================
-- Restores the pre-lockdown policies, grants and functions exactly as they were
-- read from the live database on 2026-11-20. Running this RE-OPENS the security
-- holes the lockdown closed; use it only to recover from a breakage, and
-- re-apply a corrected lockdown as soon as possible.
-- =============================================================================

begin;

-- 8. avatars bucket ------------------------------------------------------------
drop policy if exists avatars_insert_signed_in on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy "Users can upload their own avatar" on storage.objects
  for insert to public with check (bucket_id = 'avatars'::text);
create policy "Users can update their own avatar" on storage.objects
  for update to public using (bucket_id = 'avatars'::text);
create policy "Users can delete their own avatar" on storage.objects
  for delete to public using (bucket_id = 'avatars'::text);

-- 7. privileged functions -------------------------------------------------------
grant execute on function public.add_milestone(uuid, text, text, text, jsonb) to public, anon, authenticated;
grant execute on function public.auto_generate_certificate(uuid, uuid) to public, anon, authenticated;
grant execute on function public.check_course_completion(uuid, uuid) to public, anon, authenticated;
grant execute on function public.update_study_streak(uuid) to public, anon, authenticated;
grant execute on function public.handle_new_user() to public, anon, authenticated;

-- 6. course_enrollments ---------------------------------------------------------
drop policy if exists course_enrollments_insert_own_entitled on public.course_enrollments;

create policy "Enable insert for authenticated users" on public.course_enrollments
  for insert to public with check (auth.uid() = user_id);
create policy "Users can enroll in courses" on public.course_enrollments
  for insert to authenticated with check (auth.uid() = user_id);

drop function if exists public.can_self_enroll(uuid);

-- 5. audit_logs / notifications ------------------------------------------------
create policy "System can insert audit logs" on public.audit_logs
  for insert to public with check (true);
create policy "System can create notifications" on public.notifications
  for insert to public with check (true);

-- 4. XP and badges --------------------------------------------------------------
drop policy if exists user_xp_write_own on public.user_xp;
create policy "Service can manage xp" on public.user_xp
  for all to public using (true) with check (true);

drop policy if exists xp_history_write_own on public.xp_history;
create policy "Service can manage xp history" on public.xp_history
  for all to public using (true) with check (true);

drop policy if exists user_badges_write_own on public.user_badges;
create policy "Service can manage badges" on public.user_badges
  for all to public using (true) with check (true);

-- 3. wallet ---------------------------------------------------------------------
alter view public.wallet_summary reset (security_invoker);

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
alter table public.wallet_transactions disable row level security;
grant select, insert, update, delete, truncate on public.wallet_transactions to anon, authenticated;

drop policy if exists wallet_ledger_select_own on public.wallet_ledger;
create policy "Service role can do everything on wallet_ledger" on public.wallet_ledger
  for all to public using (true) with check (true);
create policy "Users can view own ledger" on public.wallet_ledger
  for select to public using (auth.uid() = user_id);
create policy "Users view own ledger" on public.wallet_ledger
  for select to public using (auth.uid() = user_id);
create policy "Users can view own wallet_ledger" on public.wallet_ledger
  for select to authenticated using (user_id = auth.uid());
alter table public.wallet_ledger disable row level security;
grant select, insert, update, delete, truncate on public.wallet_ledger to anon, authenticated;

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy "Users can view own wallet" on public.wallet_accounts
  for select to public using (auth.uid() = user_id);
create policy "Users view own wallet" on public.wallet_accounts
  for select to public using (auth.uid() = user_id);
create policy "Users can update own wallet" on public.wallet_accounts
  for update to public using (auth.uid() = user_id);
create policy "Users update own wallet" on public.wallet_accounts
  for update to public using (auth.uid() = user_id);
create policy "Users insert own wallet" on public.wallet_accounts
  for insert to public with check (auth.uid() = user_id);
grant select, insert, update, delete, truncate on public.wallet_accounts to anon, authenticated;

-- 2. handle_new_user ------------------------------------------------------------
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
as $function$
BEGIN
  INSERT INTO public.users (
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
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'learner'::public.user_role),  -- Cast with public schema
    NULL,
    NULL,
    NULL,
    NULL,
    FALSE,
    'active'::public.user_status,  -- Cast with public schema
    'english',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

alter function public.handle_new_user() reset search_path;

-- 1. users ----------------------------------------------------------------------
drop policy if exists users_select_signed_in on public.users;
create policy "Anyone can view profiles" on public.users
  for select to public using (true);
create policy "Users can read own data" on public.users
  for select to public using (auth.uid() = id);

drop policy if exists users_update_own_profile on public.users;
create policy "Users can update own data" on public.users
  for update to public using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update to public using (auth.uid() = id);

revoke update (
  full_name, bio, avatar_url, profile_image_url, phone, location, website,
  preferred_language, updated_at
) on public.users from authenticated;
grant insert, update, delete, truncate on public.users to anon, authenticated;

commit;
