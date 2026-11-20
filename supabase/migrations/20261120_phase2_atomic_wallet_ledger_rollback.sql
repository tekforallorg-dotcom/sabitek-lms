-- =============================================================================
-- Rollback for 20261120_phase2_atomic_wallet_ledger.sql
-- =============================================================================
-- Removes the wallet functions. The application code from the same pull
-- request calls them, so REVERT THE CODE FIRST (redeploy the previous
-- version), otherwise every wallet operation will fail.
--
-- The idempotency_key column and the non-negative balance check are left in
-- place: they are harmless without the functions, and dropping the column
-- would discard the keys already recorded.
-- =============================================================================

begin;

drop function if exists public.wallet_purchase_course(uuid, uuid, integer);
drop function if exists public.wallet_complete_topup(text, integer, uuid, text, jsonb, integer);
drop function if exists public.wallet_apply(uuid, integer, text, text, text, text, uuid, text, jsonb, integer);
drop function if exists public.wallet_ensure(uuid, integer);

commit;
