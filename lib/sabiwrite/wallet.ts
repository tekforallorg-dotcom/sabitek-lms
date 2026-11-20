import { SupabaseClient } from '@supabase/supabase-js'
import { WalletLedgerEntry } from './types'

// Balance changes live in lib/wallet (backed by the wallet_apply database
// function). This module used to carry its own read-then-write copies of
// getOrCreateWallet, debitWallet and creditWallet; they are gone so there is
// exactly one way to change a balance.
export { getOrCreateWallet } from '@/lib/wallet'

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