import { supabaseAdmin } from '@/lib/supabase-admin'
import type { WalletService } from '@/lib/wallet'

const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify/'

// Keep in step with FREE_TRIAL_BALANCE_KOBO in lib/wallet/index.ts: a top-up
// can be the first thing that touches a wallet.
const WELCOME_BONUS_KOBO = 50000

export type TopupResult =
  /** This call credited the wallet. */
  | { outcome: 'credited'; amountKobo: number; newBalance: number; userId: string }
  /** The reference was credited earlier; nothing was changed. */
  | { outcome: 'already_processed'; amountKobo: number }
  /** No top-up with this reference belongs to the caller. */
  | { outcome: 'not_found' }
  /** Paystack could not be reached or did not recognise the reference. */
  | { outcome: 'unverifiable' }
  /** Paystack knows the payment but it did not succeed. */
  | { outcome: 'not_successful'; paystackStatus: string }
  /** The amount or currency paid differs from the top-up that was started. */
  | { outcome: 'mismatch' }
  /** Payment is good but the balance update failed; safe to retry. */
  | { outcome: 'credit_failed'; amountKobo: number; error?: string }

interface PaystackPayment {
  status: string
  amount: number
  currency?: string
  channel?: string
  paid_at?: string
}

/**
 * Record a confirmed Paystack payment against its top-up and credit the wallet.
 *
 * This is a single database call (`wallet_complete_topup`): the top-up is
 * marked complete and the wallet is credited in one transaction, or neither
 * happens. Replays and concurrent calls for the same reference credit once.
 *
 * `expectedUserId` restricts the top-up to that user. The Paystack webhook has
 * no signed-in user and passes null; the owner then comes from the top-up row
 * this app created when the payment was started.
 */
async function completeTopup(params: {
  reference: string
  payment: PaystackPayment
  expectedUserId: string | null
  service: WalletService
}): Promise<TopupResult> {
  const { reference, payment, expectedUserId, service } = params

  if ((payment.currency || 'NGN') !== 'NGN') {
    console.error('Wallet top-up in unexpected currency', { reference, currency: payment.currency })
    return { outcome: 'mismatch' }
  }

  const { data, error } = await supabaseAdmin.rpc('wallet_complete_topup', {
    p_reference: reference,
    p_paid_kobo: payment.amount,
    p_expected_user: expectedUserId ?? undefined,
    p_service: service,
    p_metadata: {
      paystack_status: payment.status,
      channel: payment.channel ?? null,
      paid_at: payment.paid_at ?? null,
    },
    p_welcome_bonus_kobo: WELCOME_BONUS_KOBO,
  })

  if (error || !data) {
    // The function rolled back: the top-up is still pending and can be retried.
    console.error('Wallet top-up could not be completed:', error?.message)
    return { outcome: 'credit_failed', amountKobo: payment.amount, error: 'Could not record the payment' }
  }

  const result = data as {
    outcome: 'credited' | 'already_processed' | 'not_found' | 'mismatch'
    amount_kobo?: number
    new_balance?: number
    user_id?: string
  }

  switch (result.outcome) {
    case 'credited':
      return {
        outcome: 'credited',
        amountKobo: result.amount_kobo ?? payment.amount,
        newBalance: result.new_balance ?? 0,
        userId: result.user_id ?? '',
      }
    case 'already_processed':
      return { outcome: 'already_processed', amountKobo: result.amount_kobo ?? payment.amount }
    case 'mismatch':
      console.error('Wallet top-up mismatch', {
        reference,
        expectedKobo: result.amount_kobo,
        paidKobo: payment.amount,
      })
      return { outcome: 'mismatch' }
    default:
      return { outcome: 'not_found' }
  }
}

/**
 * Verify a Paystack wallet top-up with Paystack and credit it to the signed-in
 * caller exactly once. Used by the routes the browser returns to after paying.
 *
 * A credit happens only when a top-up row for the reference exists and belongs
 * to the caller, Paystack reports the payment as successful, and the amount
 * and currency match that row.
 */
export async function verifyAndCreditTopup(params: {
  reference: string
  userId: string
  service?: WalletService
}): Promise<TopupResult> {
  const { reference, userId, service = 'general' } = params

  // Cheap pre-check so unknown or foreign references never reach Paystack.
  const { data: tx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('user_id, amount_kobo, status, type')
    .eq('reference', reference)
    .maybeSingle()

  if (!tx || tx.user_id !== userId || tx.type !== 'credit') {
    return { outcome: 'not_found' }
  }

  if (tx.status === 'completed') {
    return { outcome: 'already_processed', amountKobo: tx.amount_kobo }
  }

  const verifyResponse = await fetch(PAYSTACK_VERIFY_URL + encodeURIComponent(reference), {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const verifyData = await verifyResponse.json().catch(() => null)

  if (!verifyData?.status || !verifyData.data) {
    return { outcome: 'unverifiable' }
  }

  const payment = verifyData.data as PaystackPayment

  if (payment.status !== 'success') {
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ status: 'failed' })
      .eq('reference', reference)
      .eq('status', 'pending')
    return { outcome: 'not_successful', paystackStatus: String(payment.status) }
  }

  return completeTopup({ reference, payment, expectedUserId: userId, service })
}

/**
 * Credit a wallet top-up from a Paystack `charge.success` webhook event.
 *
 * The webhook is the source of truth: it arrives even if the user closes the
 * tab before the browser returns to the verify page. The caller must have
 * checked the webhook signature. Returns `not_found` when the reference is not
 * a wallet top-up (for example a subscription or course payment), so the
 * webhook handler can fall through to its other cases.
 */
export async function creditTopupFromWebhook(event: {
  reference: string
  amount: number
  currency?: string
  status?: string
  channel?: string
  paid_at?: string
  metadata?: { transaction_type?: string } | null
}): Promise<TopupResult> {
  const service: WalletService =
    event.metadata?.transaction_type === 'sabiwrite_topup' ? 'sabiwrite' : 'general'

  return completeTopup({
    reference: event.reference,
    payment: {
      status: event.status || 'success',
      amount: event.amount,
      currency: event.currency,
      channel: event.channel,
      paid_at: event.paid_at,
    },
    expectedUserId: null,
    service,
  })
}
