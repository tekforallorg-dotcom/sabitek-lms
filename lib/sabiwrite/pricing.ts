import { supabase } from '@/lib/supabase'
import { ToolType, PlanTier, CostEstimate, PricingRule } from './types'

const MAX_TOKENS_PER_CHUNK = 4000
const CONFIRMATION_THRESHOLD_KOBO = 20000 // ₦200

// Approximate token count (4 chars ≈ 1 token)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Convert kobo to naira
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

// Convert naira to kobo
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

// Format naira for display
export function formatNaira(kobo: number): string {
  const naira = koboToNaira(kobo)
  return `₦${naira.toLocaleString()}`
}

// Get pricing rule from database
export async function getPricingRule(
  toolType: ToolType,
  planTier: PlanTier
): Promise<PricingRule | null> {
  const { data, error } = await supabase
    .from('sabiwrite_pricing_rules')
    .select('*')
    .eq('tool_type', toolType)
    .eq('plan_tier', planTier)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    // Fallback to free tier
    const { data: fallback } = await supabase
      .from('sabiwrite_pricing_rules')
      .select('*')
      .eq('tool_type', toolType)
      .eq('plan_tier', 'free')
      .eq('is_active', true)
      .single()
    
    return fallback || null
  }

  return data
}

// Estimate cost before operation
export function calculateCostEstimate(
  inputTokens: number,
  pricingRule: PricingRule
): CostEstimate {
  const chunkCount = Math.max(1, Math.ceil(inputTokens / MAX_TOKENS_PER_CHUNK))
  const baseCostKobo = pricingRule.base_cost_kobo
  const totalCostKobo = baseCostKobo + (pricingRule.per_chunk_cost_kobo * (chunkCount - 1))

  return {
    baseCostKobo,
    chunkCount,
    totalCostKobo,
    totalCostNaira: koboToNaira(totalCostKobo),
    requiresConfirmation: totalCostKobo > CONFIRMATION_THRESHOLD_KOBO || chunkCount > 1,
    breakdown: {
      perChunkCostKobo: pricingRule.per_chunk_cost_kobo,
      inputTokens,
      estimatedOutputTokens: Math.ceil(inputTokens * 1.2)
    }
  }
}

// Get user wallet balance
export async function getWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('balance_kobo')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return 0
  }

  return data.balance_kobo
}

// Create wallet if not exists
export async function ensureWalletExists(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('wallet_accounts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing.id
  }

  const { data: newWallet, error } = await supabase
    .from('wallet_accounts')
    .insert({ user_id: userId, balance_kobo: 0 })
    .select('id')
    .single()

  if (error) {
    throw new Error('Failed to create wallet')
  }

  return newWallet.id
}

// Check if user can afford operation
export async function canAffordOperation(
  userId: string,
  costKobo: number
): Promise<{ canAfford: boolean; balance: number; shortfall: number }> {
  const balance = await getWalletBalance(userId)
  const canAfford = balance >= costKobo
  const shortfall = canAfford ? 0 : costKobo - balance

  return { canAfford, balance, shortfall }
}