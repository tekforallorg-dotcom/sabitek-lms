import { SupabaseClient } from '@supabase/supabase-js'
import { WalletAccount, WalletLedgerEntry } from './types'

// Get or create wallet for user
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

  // Create new wallet with FREE TRIAL balance (₦500 = 50000 kobo)
  const FREE_TRIAL_BALANCE = 50000
  
  const { data: newWallet, error: createError } = await supabase
    .from('wallet_accounts')
    .insert({ 
      user_id: userId, 
      balance_kobo: FREE_TRIAL_BALANCE 
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
      user_id: userId,
      transaction_type: 'bonus',
      amount_kobo: FREE_TRIAL_BALANCE,
      balance_after_kobo: FREE_TRIAL_BALANCE,
      reference_type: 'free_trial',
      description: 'Free trial credits - Welcome to SabiWrite!'
    })

  return newWallet
}

// Debit wallet (for operations)
export async function debitWallet(
  supabase: SupabaseClient,
  params: {
    userId: string
    amountKobo: number
    referenceType: string
    referenceId: string
    description: string
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { userId, amountKobo, referenceType, referenceId, description } = params

  // Get current wallet
  const wallet = await getOrCreateWallet(supabase, userId)

  if (wallet.balance_kobo < amountKobo) {
    return {
      success: false,
      newBalance: wallet.balance_kobo,
      error: 'Insufficient balance'
    }
  }

  const newBalance = wallet.balance_kobo - amountKobo

  // Update wallet balance
  const { error: updateError } = await supabase
    .from('wallet_accounts')
    .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  if (updateError) {
    return { success: false, newBalance: wallet.balance_kobo, error: 'Failed to update balance' }
  }

  // Create ledger entry
  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .insert({
      user_id: userId,
      transaction_type: 'debit',
      amount_kobo: amountKobo,
      balance_after_kobo: newBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      description
    })

  if (ledgerError) {
    console.error('Failed to create ledger entry:', ledgerError)
  }

  return { success: true, newBalance }
}

// Credit wallet (for top-ups, refunds, bonuses)
export async function creditWallet(
  supabase: SupabaseClient,
  params: {
    userId: string
    amountKobo: number
    transactionType: 'credit' | 'refund' | 'bonus'
    referenceType: string
    referenceId?: string
    description: string
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { userId, amountKobo, transactionType, referenceType, referenceId, description } = params

  const wallet = await getOrCreateWallet(supabase, userId)
  const newBalance = wallet.balance_kobo + amountKobo

  // Update wallet balance
  const { error: updateError } = await supabase
    .from('wallet_accounts')
    .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  if (updateError) {
    return { success: false, newBalance: wallet.balance_kobo, error: 'Failed to update balance' }
  }

  // Create ledger entry
  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .insert({
      user_id: userId,
      transaction_type: transactionType,
      amount_kobo: amountKobo,
      balance_after_kobo: newBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      description
    })

  if (ledgerError) {
    console.error('Failed to create ledger entry:', ledgerError)
  }

  return { success: true, newBalance }
}

// Get wallet ledger (transaction history)
export async function getWalletLedger(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<WalletLedgerEntry[]> {
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch ledger:', error)
    return []
  }

  return data || []
}