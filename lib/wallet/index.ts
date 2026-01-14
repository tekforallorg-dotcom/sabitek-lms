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
 * Get or create wallet for a user
 * New users get ₦500 free trial credits
 */
export async function getOrCreateWallet(
  supabase: SupabaseClient,
  userId: string
): Promise<WalletAccount> {
  // Try to get existing wallet
  const { data: existing, error: fetchError } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing
  }

  // Create new wallet with free trial balance
  const { data: newWallet, error: createError } = await supabase
    .from('wallet_accounts')
    .insert({ 
      user_id: userId, 
      balance_kobo: FREE_TRIAL_BALANCE_KOBO 
    })
    .select('*')
    .single()

  if (createError || !newWallet) {
    console.error('Wallet create error:', createError)
    throw new Error('Failed to create wallet')
  }

  // Log the free trial credit
  await supabase
    .from('wallet_ledger')
    .insert({
      wallet_id: newWallet.id,
      user_id: userId,
      transaction_type: 'bonus',
      amount_kobo: FREE_TRIAL_BALANCE_KOBO,
      balance_before: 0,
      balance_after: FREE_TRIAL_BALANCE_KOBO,
      service: 'general',
      reference_type: 'free_trial',
      description: 'Welcome bonus - Free trial credits'
    })

  return newWallet
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

/**
 * Debit wallet for any service
 */
export async function debitWallet(
  supabase: SupabaseClient,
  params: {
    userId: string
    amountKobo: number
    service: WalletService
    serviceRefId?: string
    referenceType?: string
    referenceId?: string
    description: string
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { 
    userId, 
    amountKobo, 
    service, 
    serviceRefId,
    referenceType, 
    referenceId, 
    description,
    metadata 
  } = params

  // Get current wallet
  const wallet = await getOrCreateWallet(supabase, userId)

  if (wallet.balance_kobo < amountKobo) {
    return {
      success: false,
      newBalance: wallet.balance_kobo,
      error: 'Insufficient balance'
    }
  }

  const balanceBefore = wallet.balance_kobo
  const newBalance = wallet.balance_kobo - amountKobo

  // Update wallet balance
  const { error: updateError } = await supabase
    .from('wallet_accounts')
    .update({ 
      balance_kobo: newBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', wallet.id)

  if (updateError) {
    console.error('Wallet update error:', updateError)
    return { 
      success: false, 
      newBalance: wallet.balance_kobo, 
      error: 'Failed to update balance' 
    }
  }

  // Create ledger entry
  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'debit',
      amount_kobo: amountKobo,
      balance_before: balanceBefore,
      balance_after: newBalance,
      service,
      service_ref_id: serviceRefId || null,
      reference_type: referenceType || null,
      description,
      metadata: {
        ...metadata,
        reference_id: referenceId // Store string reference in metadata
      }
    })

  if (ledgerError) {
    console.error('Ledger entry error:', ledgerError)
    // Don't fail the transaction, just log
  }

  return { success: true, newBalance }
}

/**
 * Credit wallet (for top-ups, refunds, bonuses)
 */
export async function creditWallet(
  supabase: SupabaseClient,
  params: {
    userId: string
    amountKobo: number
    transactionType: 'credit' | 'refund' | 'bonus'
    service: WalletService
    serviceRefId?: string
    referenceType?: string
    referenceId?: string
    description: string
    metadata?: Record<string, unknown>
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { 
    userId, 
    amountKobo, 
    transactionType, 
    service,
    serviceRefId,
    referenceType, 
    referenceId, 
    description,
    metadata 
  } = params

  const wallet = await getOrCreateWallet(supabase, userId)
  const balanceBefore = wallet.balance_kobo
  const newBalance = wallet.balance_kobo + amountKobo

  // Update wallet balance
  const { error: updateError } = await supabase
    .from('wallet_accounts')
    .update({ 
      balance_kobo: newBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', wallet.id)

  if (updateError) {
    console.error('Wallet update error:', updateError)
    return { 
      success: false, 
      newBalance: wallet.balance_kobo, 
      error: 'Failed to update balance' 
    }
  }

  // Create ledger entry
  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: transactionType,
      amount_kobo: amountKobo,
      balance_before: balanceBefore,
      balance_after: newBalance,
      service,
      service_ref_id: serviceRefId || null,
      reference_type: referenceType || null,
      description,
      metadata: {
        ...metadata,
        reference_id: referenceId // Store string reference in metadata
      }
    })

  if (ledgerError) {
    console.error('Ledger entry error:', ledgerError)
  }

  return { success: true, newBalance }
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