-- =============================================================================
-- Rollback for 20261120_phase1_signup_gate.sql
-- =============================================================================
-- Removes the database-level sign-up gate. Sign-up is then restricted only by
-- the register page again, and anyone can create an account through the
-- Supabase API. Use this if legitimate sign-ups are being rejected.
-- =============================================================================

begin;

drop trigger if exists on_auth_user_signup_gate on auth.users;
drop function if exists public.enforce_signup_gate();

commit;
