import { supabaseAdmin } from '@/lib/supabase-admin'
import { creditWallet, type WalletService } from '@/lib/wallet'

const PAYSTACK_VERIFY_URL = 'https://api.paystack.co/transaction/verify/'

export type TopupResult =
  /** This call credited the wallet. */
  | { outcome: 'credited'; amountKobo: number; newBalance: number }
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

/**
 * Verify a Paystack wallet top-up and credit it to the caller exactly once.
 *
 * Every wallet top-up route goes through here. A credit happens only when all
 * of these hold:
 *   1. a `wallet_transactions` row for the reference exists and belongs to the
 *      caller (so course, subscription and other users' payments are rejected);
 *   2. Paystack reports the payment as successful;
 *   3. the amount and currency paid match that row;
 *   4. this call is the one that moves the row to `completed`. That is a single
 *      UPDATE guarded on the current status, so replays and concurrent calls
 *      cannot both win.
 */
export async function verifyAndCreditTopup(params: {
  reference: string
  userId: string
  service?: WalletService
}): Promise<TopupResult> {
  const { reference, userId, service = 'general' } = params

  const { data: tx } = await supabaseAdmin
    .from('wallet_transactions')
    .select('id, user_id, amount_kobo, status, type')
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

  const payment = verifyData.data

  if (payment.status !== 'success') {
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ status: 'failed' })
      .eq('id', tx.id)
      .eq('status', 'pending')
    return { outcome: 'not_successful', paystackStatus: String(payment.status) }
  }

  if (payment.amount !== tx.amount_kobo || (payment.currency || 'NGN') !== 'NGN') {
    console.error('Wallet top-up mismatch', {
      reference,
      expectedKobo: tx.amount_kobo,
      paidKobo: payment.amount,
      paidCurrency: payment.currency,
    })
    return { outcome: 'mismatch' }
  }

  // Claim the top-up. Only the call whose UPDATE matches a not-yet-completed
  // row may credit the wallet.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('wallet_transactions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', tx.id)
    .neq('status', 'completed')
    .select('id, status')

  if (claimError) {
    console.error('Wallet top-up claim error:', claimError)
    return { outcome: 'credit_failed', amountKobo: tx.amount_kobo, error: 'Could not record the payment' }
  }

  if (!claimed || claimed.length === 0) {
    return { outcome: 'already_processed', amountKobo: tx.amount_kobo }
  }

  const credit = await creditWallet(supabaseAdmin, {
    userId,
    amountKobo: tx.amount_kobo,
    transactionType: 'credit',
    service,
    referenceType: 'paystack_topup',
    referenceId: reference,
    description: `Wallet top-up - ₦${(tx.amount_kobo / 100).toLocaleString()}`,
    metadata: {
      paystack_reference: reference,
      paystack_status: payment.status,
      channel: payment.channel,
      paid_at: payment.paid_at,
    },
  })

  if (!credit.success) {
    // Release the claim so the user (or support) can retry the verification.
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ status: 'pending', completed_at: null })
      .eq('id', tx.id)
    return { outcome: 'credit_failed', amountKobo: tx.amount_kobo, error: credit.error }
  }

  return { outcome: 'credited', amountKobo: tx.amount_kobo, newBalance: credit.newBalance }
}
