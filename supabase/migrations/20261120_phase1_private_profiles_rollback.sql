-- =============================================================================
-- Rollback for 20261120_phase1_private_profiles.sql
-- =============================================================================
-- Restores the phase 0 state: every signed-in user can read every row of
-- public.users (including other people's email and phone). Use only to recover
-- from a breakage. The helper functions are left in place because deployed
-- code calls get_public_profiles(); they are harmless on their own.
-- =============================================================================

begin;

drop policy if exists users_select_visible on public.users;

create policy users_select_signed_in on public.users
  for select to authenticated
  using (true);

commit;
