-- =============================================================================
-- Phase 2: atomic wallet ledger
-- =============================================================================
-- Until now every balance change was done by application code in three steps:
-- read the balance, compute the new one in JavaScript, write it back, then
-- insert a ledger row. Two requests at once could both read the same balance,
-- so a debit could be lost (spend twice, pay once) or a credit overwritten.
-- A failure between steps left the balance and the ledger disagreeing.
--
-- This moves balance changes into the database. Each function below runs in
-- one transaction and locks the user's wallet row first, so changes for one
-- user happen strictly one after another:
--
--   wallet_ensure            create the wallet (with the welcome bonus) once
--   wallet_apply             credit / debit / refund / bonus, with an optional
--                            idempotency key so a retry cannot apply twice
--   wallet_complete_topup    mark a Paystack top-up complete AND credit it, or
--                            do neither
--   wallet_purchase_course   debit, record the purchase and enrol, or do none
--
-- All four are callable by the service role only.
--
-- APPLY ORDER: this migration is additive and nothing uses the new functions
-- until the application code from the same pull request is deployed, so apply
-- it BEFORE merging. (The code calls these functions and would fail without
-- them.)
--
-- Rollback: 20261120_phase2_atomic_wallet_ledger_rollback.sql
-- =============================================================================

begin;

-- An idempotency key makes a ledger entry unique per user, so replaying the
-- same operation finds the existing entry instead of applying it again.
alter table public.wallet_ledger add column if not exists idempotency_key text;

create unique index if not exists wallet_ledger_user_idempotency_key
  on public.wallet_ledger (user_id, idempotency_key)
  where idempotency_key is not null;

-- Backstop: whatever the code does, a balance can never go below zero.
alter table public.wallet_accounts drop constraint if exists wallet_accounts_balance_nonnegative;
alter table public.wallet_accounts
  add constraint wallet_accounts_balance_nonnegative check (balance_kobo >= 0);

-- -----------------------------------------------------------------------------
-- wallet_ensure: create the wallet if it does not exist yet
-- -----------------------------------------------------------------------------
create or replace function public.wallet_ensure(p_user uuid, p_welcome_bonus_kobo integer default 0)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_wallet_id uuid;
  v_bonus integer := greatest(coalesce(p_welcome_bonus_kobo, 0), 0);
begin
  insert into wallet_accounts (user_id, balance_kobo)
  values (p_user, v_bonus)
  on conflict (user_id) do nothing
  returning id into v_wallet_id;

  if v_wallet_id is not null then
    -- This call created the wallet: record the welcome bonus, if any.
    if v_bonus > 0 then
      insert into wallet_ledger (
        wallet_id, user_id, transaction_type, amount_kobo, balance_before, balance_after,
        service, reference_type, description, idempotency_key
      ) values (
        v_wallet_id, p_user, 'bonus', v_bonus, 0, v_bonus,
        'general', 'free_trial', 'Welcome bonus - Free trial credits', 'welcome_bonus'
      );
    end if;
    return v_wallet_id;
  end if;

  select id into v_wallet_id from wallet_accounts where user_id = p_user;
  return v_wallet_id;
end;
$function$;

-- -----------------------------------------------------------------------------
-- wallet_apply: the only way a balance changes
-- -----------------------------------------------------------------------------
-- Returns jsonb:
--   { success: true,  new_balance, ledger_id, replayed }
--   { success: false, error, new_balance }
create or replace function public.wallet_apply(
  p_user uuid,
  p_amount_kobo integer,
  p_type text,
  p_service text,
  p_description text,
  p_reference_type text default null,
  p_service_ref_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_welcome_bonus_kobo integer default 0
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_wallet wallet_accounts%rowtype;
  v_existing_id uuid;
  v_delta integer;
  v_ledger_id uuid;
begin
  if p_amount_kobo is null or p_amount_kobo <= 0 then
    return jsonb_build_object('success', false, 'error', 'Amount must be positive');
  end if;

  if p_type not in ('credit', 'debit', 'refund', 'bonus') then
    return jsonb_build_object('success', false, 'error', 'Unknown transaction type');
  end if;

  perform wallet_ensure(p_user, p_welcome_bonus_kobo);

  -- Lock this user's wallet. Every other change for the same user waits here,
  -- so the balance read below cannot go stale before it is written.
  select * into v_wallet from wallet_accounts where user_id = p_user for update;

  -- Checked after taking the lock, so two concurrent calls with the same key
  -- cannot both get past this point.
  if p_idempotency_key is not null then
    select id into v_existing_id
      from wallet_ledger
     where user_id = p_user and idempotency_key = p_idempotency_key;

    if v_existing_id is not null then
      return jsonb_build_object(
        'success', true,
        'replayed', true,
        'new_balance', v_wallet.balance_kobo,
        'ledger_id', v_existing_id
      );
    end if;
  end if;

  v_delta := case when p_type = 'debit' then -p_amount_kobo else p_amount_kobo end;

  if v_wallet.balance_kobo + v_delta < 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'new_balance', v_wallet.balance_kobo
    );
  end if;

  update wallet_accounts
     set balance_kobo = balance_kobo + v_delta,
         updated_at = now()
   where id = v_wallet.id;

  insert into wallet_ledger (
    wallet_id, user_id, transaction_type, amount_kobo, balance_before, balance_after,
    service, service_ref_id, reference_type, description, metadata, idempotency_key
  ) values (
    v_wallet.id, p_user, p_type, p_amount_kobo, v_wallet.balance_kobo, v_wallet.balance_kobo + v_delta,
    p_service, p_service_ref_id, p_reference_type, p_description, coalesce(p_metadata, '{}'::jsonb), p_idempotency_key
  )
  returning id into v_ledger_id;

  return jsonb_build_object(
    'success', true,
    'replayed', false,
    'new_balance', v_wallet.balance_kobo + v_delta,
    'ledger_id', v_ledger_id
  );
end;
$function$;

-- -----------------------------------------------------------------------------
-- wallet_complete_topup: mark a top-up paid and credit it, together
-- -----------------------------------------------------------------------------
-- The caller must already have confirmed with Paystack that the payment
-- succeeded and how much was paid (p_paid_kobo). Pass p_expected_user when a
-- signed-in user is asking, so they can only complete their own top-up; the
-- Paystack webhook passes null and the owner is taken from the top-up row.
--
-- Returns jsonb: { outcome, amount_kobo?, new_balance?, user_id? } where
-- outcome is credited | already_processed | not_found | mismatch.
create or replace function public.wallet_complete_topup(
  p_reference text,
  p_paid_kobo integer,
  p_expected_user uuid default null,
  p_service text default 'general',
  p_metadata jsonb default '{}'::jsonb,
  p_welcome_bonus_kobo integer default 0
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_tx wallet_transactions%rowtype;
  v_result jsonb;
begin
  -- Lock the top-up row so two verifications of the same reference take turns.
  select * into v_tx from wallet_transactions where reference = p_reference for update;

  if not found
     or v_tx.type <> 'credit'
     or (p_expected_user is not null and v_tx.user_id <> p_expected_user) then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if v_tx.status = 'completed' then
    return jsonb_build_object(
      'outcome', 'already_processed',
      'amount_kobo', v_tx.amount_kobo,
      'user_id', v_tx.user_id
    );
  end if;

  if p_paid_kobo is distinct from v_tx.amount_kobo then
    return jsonb_build_object(
      'outcome', 'mismatch',
      'amount_kobo', v_tx.amount_kobo,
      'user_id', v_tx.user_id
    );
  end if;

  update wallet_transactions
     set status = 'completed',
         completed_at = now()
   where id = v_tx.id;

  v_result := wallet_apply(
    v_tx.user_id,
    v_tx.amount_kobo,
    'credit',
    p_service,
    'Wallet top-up',
    'paystack_topup',
    null,
    'topup:' || p_reference,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('paystack_reference', p_reference),
    p_welcome_bonus_kobo
  );

  if not coalesce((v_result->>'success')::boolean, false) then
    -- Undo the status change too: either both happen or neither does.
    raise exception 'Top-up credit failed: %', coalesce(v_result->>'error', 'unknown error');
  end if;

  return jsonb_build_object(
    'outcome', 'credited',
    'amount_kobo', v_tx.amount_kobo,
    'new_balance', (v_result->>'new_balance')::integer,
    'user_id', v_tx.user_id
  );
end;
$function$;

-- -----------------------------------------------------------------------------
-- wallet_purchase_course: pay for a course from the wallet, all or nothing
-- -----------------------------------------------------------------------------
-- Returns jsonb: { outcome, ... } where outcome is purchased | already_purchased
-- | course_not_found | course_is_free | insufficient_balance.
create or replace function public.wallet_purchase_course(
  p_user uuid,
  p_course uuid,
  p_welcome_bonus_kobo integer default 0
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_course record;
  v_price_kobo integer;
  v_reference text;
  v_result jsonb;
begin
  select id, title, price, is_free, currency, instructor_id
    into v_course
    from courses
   where id = p_course;

  if not found then
    return jsonb_build_object('outcome', 'course_not_found');
  end if;

  if coalesce(v_course.is_free, false) or coalesce(v_course.price, 0) = 0 then
    return jsonb_build_object('outcome', 'course_is_free');
  end if;

  v_price_kobo := round(v_course.price * 100)::integer;

  -- Take the wallet lock before the "already purchased" check, so two clicks
  -- cannot both pass it and both pay.
  perform wallet_ensure(p_user, p_welcome_bonus_kobo);
  perform 1 from wallet_accounts where user_id = p_user for update;

  if exists (
    select 1 from course_purchases
     where user_id = p_user and course_id = p_course and status = 'successful'
  ) then
    return jsonb_build_object('outcome', 'already_purchased');
  end if;

  v_reference := 'sabitek_wallet_course_' || p_course || '_' || p_user || '_'
                 || (extract(epoch from clock_timestamp()) * 1000)::bigint;

  v_result := wallet_apply(
    p_user,
    v_price_kobo,
    'debit',
    'courses',
    'Course purchase: ' || v_course.title,
    'course_purchase',
    p_course,
    null,
    jsonb_build_object(
      'course_id', p_course,
      'course_title', v_course.title,
      'instructor_id', v_course.instructor_id,
      'transaction_ref', v_reference
    ),
    p_welcome_bonus_kobo
  );

  if not coalesce((v_result->>'success')::boolean, false) then
    return jsonb_build_object(
      'outcome', 'insufficient_balance',
      'balance_kobo', (v_result->>'new_balance')::integer,
      'required_kobo', v_price_kobo
    );
  end if;

  insert into transactions (
    user_id, course_id, amount, currency, provider, provider_tx_ref, status, transaction_type
  ) values (
    p_user, p_course, v_course.price, coalesce(v_course.currency, 'NGN'), 'wallet', v_reference,
    'successful', 'course_purchase'
  );

  insert into course_purchases (
    user_id, course_id, amount, currency, provider, provider_tx_ref, status, purchased_at
  ) values (
    p_user, p_course, v_course.price, coalesce(v_course.currency, 'NGN'), 'wallet', v_reference,
    'successful', now()
  )
  on conflict (user_id, course_id) do update set
    amount = excluded.amount,
    currency = excluded.currency,
    provider = excluded.provider,
    provider_tx_ref = excluded.provider_tx_ref,
    status = excluded.status,
    purchased_at = excluded.purchased_at;

  insert into course_enrollments (user_id, course_id, progress_percentage)
  values (p_user, p_course, 0)
  on conflict (user_id, course_id) do nothing;

  return jsonb_build_object(
    'outcome', 'purchased',
    'transaction_ref', v_reference,
    'amount_kobo', v_price_kobo,
    'new_balance', (v_result->>'new_balance')::integer
  );
end;
$function$;

-- Server-only.
revoke execute on function public.wallet_ensure(uuid, integer) from public, anon, authenticated;
revoke execute on function public.wallet_apply(uuid, integer, text, text, text, text, uuid, text, jsonb, integer) from public, anon, authenticated;
revoke execute on function public.wallet_complete_topup(text, integer, uuid, text, jsonb, integer) from public, anon, authenticated;
revoke execute on function public.wallet_purchase_course(uuid, uuid, integer) from public, anon, authenticated;

grant execute on function public.wallet_ensure(uuid, integer) to service_role;
grant execute on function public.wallet_apply(uuid, integer, text, text, text, text, uuid, text, jsonb, integer) to service_role;
grant execute on function public.wallet_complete_topup(text, integer, uuid, text, jsonb, integer) to service_role;
grant execute on function public.wallet_purchase_course(uuid, uuid, integer) to service_role;

commit;
