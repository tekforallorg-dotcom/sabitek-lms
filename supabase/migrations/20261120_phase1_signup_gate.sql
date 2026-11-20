-- =============================================================================
-- Phase 1: enforce invite-only sign-up in the database
-- =============================================================================
-- "Sign up is by invite" was enforced only by the register page, which asks
-- /api/auth/signup-check before showing the form. Anyone could skip the page
-- and call the Supabase sign-up API directly with the public anon key, and get
-- an account.
--
-- This adds a BEFORE INSERT trigger on auth.users that applies the same rule
-- the app uses (lib/auth-gating.ts). A new account is allowed when ANY of:
--   1. the platform setting public_signup_enabled is true;
--   2. the server created it: app metadata carries provisioned_by = 'server'.
--      Only the service role can set app metadata, so a browser cannot fake
--      this. The two routes that create accounts set it
--      (institution application approval, team invite registration);
--   3. the sign-up carries a valid invite token in user metadata
--      (invite_token): an ACTIVE, unexpired, not-exhausted cohort invite or
--      institution invite. The register page now sends it.
-- Otherwise the insert is rejected and no account is created.
--
-- The token is removed from the stored metadata once checked, so it does not
-- end up in the user's session token.
--
-- APPLY ORDER: deploy the application code from the same pull request FIRST,
-- otherwise invited users signing up through the page would be rejected.
--
-- OPERATIONAL NOTE: while public sign-up is off, "Add user" in the Supabase
-- dashboard is rejected too (the database cannot tell it apart from a public
-- sign-up). To add someone by hand, either turn public_signup_enabled on
-- briefly, or create the user through the admin API with
-- app_metadata = {"provisioned_by": "server"}.
--
-- Rollback: 20261120_phase1_signup_gate_rollback.sql
-- =============================================================================

begin;

create or replace function public.enforce_signup_gate()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_public_open boolean;
  v_token text;
begin
  -- 2. Created by the server with the service role.
  if new.raw_app_meta_data->>'provisioned_by' = 'server' then
    return new;
  end if;

  -- 1. Public sign-up switched on by a platform admin.
  select (ps.value = 'true'::jsonb)
    into v_public_open
    from platform_settings ps
   where ps.key = 'public_signup_enabled';

  if coalesce(v_public_open, false) then
    return new;
  end if;

  -- 3. A valid invite.
  v_token := nullif(new.raw_user_meta_data->>'invite_token', '');

  if v_token is not null and (
       exists (
         select 1
         from cohort_invites ci
         where ci.token = v_token
           and ci.status::text = 'ACTIVE'
           and (ci.expires_at is null or ci.expires_at > now())
           and (ci.max_uses is null or ci.use_count < ci.max_uses)
       )
       or exists (
         select 1
         from institution_invites ii
         where ii.token = v_token
           and ii.status::text = 'ACTIVE'
           and (ii.expires_at is null or ii.expires_at > now())
           and (ii.max_uses is null or ii.use_count < ii.max_uses)
       )
     ) then
    -- Checked; do not keep the token in the account's metadata.
    new.raw_user_meta_data := new.raw_user_meta_data - 'invite_token';
    return new;
  end if;

  raise exception 'Sign up is by invite only'
    using errcode = 'P0001',
          hint = 'Use a valid invite link, or ask a platform admin to enable public sign-up.';
end;
$function$;

-- Trigger functions are not meant to be called directly.
revoke execute on function public.enforce_signup_gate() from public, anon, authenticated;
grant execute on function public.enforce_signup_gate() to supabase_auth_admin, service_role;

drop trigger if exists on_auth_user_signup_gate on auth.users;

create trigger on_auth_user_signup_gate
  before insert on auth.users
  for each row execute function public.enforce_signup_gate();

commit;
