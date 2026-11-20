import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export type WalletService = 
  | 'sabiwrite' 
  | 'courses' 
  | 'community' 
  | 'advisor' 
  | 'quiz' 
  | 'general' 
  | 'subscription'

export type TransactionType = 'credit' | 'debit' | 'refund' | 'bonus'

export interface WalletAccount {
  id: string
  user_id: string
  balance_kobo: number
  currency: string
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  transaction_type: TransactionType
  amount_kobo: number
  balance_before: number
  balance_after: number
  service: WalletService
  service_ref_id?: string
  reference_type?: string
  reference_id?: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface WalletBalance {
  id: string
  balanceKobo: number
  balanceNaira: number
  balanceFormatted: string
  currency: string
}

// ============================================
// CONSTANTS
// ============================================

const FREE_TRIAL_BALANCE_KOBO = 50000 // ₦500

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatNaira(kobo: number): string {
  const naira = kobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(naira)
}

export function koboToNaira(kobo: number): number {
  return kobo / 100
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

// ============================================
// WALLET FUNCTIONS
// ============================================

/**
 * Get or create wallet for a user.
 * New users get the welcome bonus (free trial credits) exactly once: the
 * wallet row and its bonus ledger entry are created together in the database.
 */
export async function getOrCreateWallet(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletAccount> {
  const { error: ensureError } = await supabase.rpc('wallet_ensure', {
    p_user: userId,
    p_welcome_bonus_kobo: FREE_TRIAL_BALANCE_KOBO,
  })

  if (ensureError) {
    console.error('Wallet create error:', ensureError)
    throw new Error('Failed to create wallet')
  }

  const { data: wallet, error: fetchError } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError || !wallet) {
    console.error('Wallet fetch error:', fetchError)
    throw new Error('Failed to load wallet')
  }

  return wallet
}

/**
 * Get wallet balance formatted for API response
 */
export async function getWalletBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletBalance> {
  const wallet = await getOrCreateWallet(supabase, userId)
  
  return {
    id: wallet.id,
    balanceKobo: wallet.balance_kobo,
    balanceNaira: koboToNaira(wallet.balance_kobo),
    balanceFormatted: formatNaira(wallet.balance_kobo),
    currency: wallet.currency || 'NGN'
  }
}

// ============================================
// BALANCE CHANGES
// ============================================
//
// Every credit, debit, refund and bonus goes through the `wallet_apply`
// database function. It locks the user's wallet row, checks the balance,
// updates it and writes the ledger entry in ONE transaction, so:
//   - two requests at once cannot both spend the same money;
//   - the balance and the ledger cannot disagree;
//   - an operation given an idempotency key is applied at most once, however
//     many times it is retried.
// Never update wallet_accounts.balance_kobo from application code.

export interface WalletChangeResult {
  success: boolean
  newBalance: number
  error?: string
  /** The ledger entry for this change. */
  ledgerId?: string
  /** True when the idempotency key had already been used: nothing changed. */
  replayed?: boolean
}

interface WalletChangeParams {
  userId: string
  amountKobo: number
  service: WalletService
  serviceRefId?: string
  referenceType?: string
  referenceId?: string
  description: string
  metadata?: Record<string, unknown>
  /**
   * Makes the change safe to retry. Use a key that identifies the business
   * event, for example `debit:advisor:<operationId>`.
   */
  idempotencyKey?: string
}

async function applyWalletChange(
  supabase: SupabaseClient,
  type: TransactionType,
  params: WalletChangeParams
): Promise<WalletChangeResult> {
  const { data, error } = await supabase.rpc('wallet_apply', {
    p_user: params.userId,
    p_amount_kobo: params.amountKobo,
    p_type: type,
    p_service: params.service,
    p_description: params.description,
    p_reference_type: params.referenceType ?? null,
    p_service_ref_id: params.serviceRefId ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
    p_metadata: {
      ...(params.metadata || {}),
      ...(params.referenceId ? { reference_id: params.referenceId } : {}),
    },
    p_welcome_bonus_kobo: FREE_TRIAL_BALANCE_KOBO,
  })

  if (error || !data) {
    console.error('Wallet change failed:', error)
    return { success: false, newBalance: 0, error: 'Failed to update balance' }
  }

  const result = data as {
    success?: boolean
    new_balance?: number
    ledger_id?: string
    replayed?: boolean
    error?: string
  }

  return {
    success: !!result.success,
    newBalance: result.new_balance ?? 0,
    ledgerId: result.ledger_id,
    replayed: !!result.replayed,
    error: result.success ? undefined : result.error || 'Failed to update balance',
  }
}

/**
 * Debit wallet for any service. Fails with "Insufficient balance" (and changes
 * nothing) if the wallet cannot cover it.
 */
export async function debitWallet(
  supabase: SupabaseClient,
  params: WalletChangeParams
): Promise<WalletChangeResult> {
  return applyWalletChange(supabase, 'debit', params)
}

/**
 * Credit wallet (for top-ups, refunds, bonuses)
 */
export async function creditWallet(
  supabase: SupabaseClient,
  params: WalletChangeParams & { transactionType: 'credit' | 'refund' | 'bonus' }
): Promise<WalletChangeResult> {
  const { transactionType, ...rest } = params
  return applyWalletChange(supabase, transactionType, rest)
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  supabase: SupabaseClient,
  userId: string,
  options: {
    service?: WalletService
    limit?: number
    offset?: number
  } = {}
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const { service, limit = 20, offset = 0 } = options

  let query = supabase
    .from('wallet_ledger')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (service) {
    query = query.eq('service', service)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Transaction fetch error:', error)
    return { transactions: [], total: 0 }
  }

  return { 
    transactions: data || [], 
    total: count || 0 
  }
}

/**
 * Check if user can afford an amount
 */
export async function canAfford(
  supabase: SupabaseClient,
  userId: string,
  amountKobo: number
): Promise<{ canAfford: boolean; balance: number; shortfall: number }> {
  const wallet = await getOrCreateWallet(supabase, userId)
  const canAffordAmount = wallet.balance_kobo >= amountKobo
  const shortfall = canAffordAmount ? 0 : amountKobo - wallet.balance_kobo

  return {
    canAfford: canAffordAmount,
    balance: wallet.balance_kobo,
    shortfall
  }
}

/**
 * Get spending summary by service
 */
export async function getSpendingSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<WalletService, { spent: number; credited: number; count: number }>> {
  const { data, error } = await supabase
    .from('wallet_summary')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) {
    return {} as Record<WalletService, { spent: number; credited: number; count: number }>
  }

  const summary: Record<string, { spent: number; credited: number; count: number }> = {}
  
  for (const row of data) {
    summary[row.service] = {
      spent: row.total_spent_kobo || 0,
      credited: row.total_credited_kobo || 0,
      count: row.transaction_count || 0
    }
  }

  return summary as Record<WalletService, { spent: number; credited: number; count: number }>
}