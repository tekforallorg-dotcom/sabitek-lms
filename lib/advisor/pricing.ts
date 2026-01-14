import { SupabaseClient } from '@supabase/supabase-js'
import { debitWallet, canAfford, formatNaira } from '@/lib/wallet'
import crypto from 'crypto'

// ============================================
// TYPES
// ============================================

export type AdvisorModule = 'cv' | 'cover_letter' | 'interview' | 'roadmap' | 'sabiquiz'

export type AdvisorOperationType = 
  | 'cv_build'
  | 'cv_rewrite_section'
  | 'cv_tailor'
  | 'cv_ats_check'
  | 'cover_generate'
  | 'cover_shorten'
  | 'cover_personalize'
  | 'interview_kit'
  | 'interview_grade'
  | 'interview_mock'
  | 'roadmap_generate'
  | 'roadmap_update'
  | 'quiz_generate'
  | 'material_process'

export interface AdvisorPricing {
  id: string
  operation_type: AdvisorOperationType
  module: AdvisorModule
  base_cost_kobo: number
  display_name: string
  description: string
  is_active: boolean
  requires_profile: boolean
  cacheable: boolean
  cache_ttl_hours: number
}

export interface CostEstimate {
  operationType: AdvisorOperationType
  costKobo: number
  costFormatted: string
  displayName: string
  description: string
  requiresProfile: boolean
  cacheable: boolean
}

export interface OperationResult {
  success: boolean
  operationId?: string
  outputId?: string
  costKobo?: number
  costFormatted?: string
  newBalance?: number
  newBalanceFormatted?: string
  error?: string
  cached?: boolean
}

// ============================================
// PRICING FUNCTIONS
// ============================================

/**
 * Get pricing for an operation type
 */
export async function getOperationPricing(
  supabase: SupabaseClient,
  operationType: AdvisorOperationType
): Promise<AdvisorPricing | null> {
  const { data, error } = await supabase
    .from('advisor_pricing')
    .select('*')
    .eq('operation_type', operationType)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('Pricing fetch error:', error)
    return null
  }

  return data as AdvisorPricing
}

/**
 * Get all pricing for a module
 */
export async function getModulePricing(
  supabase: SupabaseClient,
  module: AdvisorModule
): Promise<AdvisorPricing[]> {
  const { data, error } = await supabase
    .from('advisor_pricing')
    .select('*')
    .eq('module', module)
    .eq('is_active', true)
    .order('base_cost_kobo', { ascending: true })

  if (error) {
    console.error('Module pricing fetch error:', error)
    return []
  }

  return data as AdvisorPricing[]
}

/**
 * Estimate cost for an operation
 */
export async function estimateOperationCost(
  supabase: SupabaseClient,
  operationType: AdvisorOperationType
): Promise<CostEstimate | null> {
  const pricing = await getOperationPricing(supabase, operationType)
  
  if (!pricing) {
    return null
  }

  return {
    operationType,
    costKobo: pricing.base_cost_kobo,
    costFormatted: formatNaira(pricing.base_cost_kobo),
    displayName: pricing.display_name,
    description: pricing.description,
    requiresProfile: pricing.requires_profile,
    cacheable: pricing.cacheable
  }
}

// ============================================
// CACHE FUNCTIONS
// ============================================

/**
 * Generate hash for cache lookup
 */
export function generateInputHash(input: Record<string, unknown>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort())
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32)
}

/**
 * Check cache for existing result
 */
export async function checkCache(
  supabase: SupabaseClient,
  operationType: AdvisorOperationType,
  inputHash: string
): Promise<{ cached: boolean; data?: unknown; outputId?: string }> {
  const { data, error } = await supabase
    .from('advisor_ai_cache')
    .select('output_data, output_ref_id, expires_at')
    .eq('operation_type', operationType)
    .eq('input_hash', inputHash)
    .single()

  if (error || !data) {
    return { cached: false }
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { cached: false }
  }

  // Increment hit count
  await supabase
    .from('advisor_ai_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }) })
    .eq('operation_type', operationType)
    .eq('input_hash', inputHash)

  return {
    cached: true,
    data: data.output_data,
    outputId: data.output_ref_id
  }
}

/**
 * Store result in cache
 */
export async function storeCache(
  supabase: SupabaseClient,
  operationType: AdvisorOperationType,
  inputHash: string,
  outputData: unknown,
  outputRefId?: string,
  outputRefTable?: string,
  ttlHours: number = 24
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  await supabase
    .from('advisor_ai_cache')
    .upsert({
      input_hash: inputHash,
      operation_type: operationType,
      output_data: outputData,
      output_ref_id: outputRefId,
      output_ref_table: outputRefTable,
      expires_at: expiresAt.toISOString(),
      hit_count: 0
    }, {
      onConflict: 'input_hash,operation_type'
    })
}

// ============================================
// OPERATION EXECUTION
// ============================================

/**
 * Execute a paid operation with atomic billing
 * Returns operation result after: check balance → debit → execute → store
 */
export async function executeAdvisorOperation<T>(
  supabase: SupabaseClient,
  params: {
    userId: string
    operationType: AdvisorOperationType
    module: AdvisorModule
    inputForCache?: Record<string, unknown>
    inputSummary?: Record<string, unknown>
    skipCache?: boolean
    executor: () => Promise<{ outputId: string; outputTable: string; data: T }>
  }
): Promise<OperationResult & { data?: T }> {
  const {
    userId,
    operationType,
    module,
    inputForCache,
    inputSummary,
    skipCache = false,
    executor
  } = params

  const startTime = Date.now()

  // Get pricing
  const pricing = await getOperationPricing(supabase, operationType)
  if (!pricing) {
    return { success: false, error: 'Operation pricing not found' }
  }

  // Check cache first (if cacheable and not skipped)
  if (pricing.cacheable && !skipCache && inputForCache) {
    const inputHash = generateInputHash(inputForCache)
    const cacheResult = await checkCache(supabase, operationType, inputHash)
    
    if (cacheResult.cached) {
      return {
        success: true,
        cached: true,
        outputId: cacheResult.outputId,
        costKobo: 0,
        costFormatted: '₦0 (cached)',
        data: cacheResult.data as T
      }
    }
  }

  // Check if user can afford
  const affordCheck = await canAfford(supabase, userId, pricing.base_cost_kobo)
  if (!affordCheck.canAfford) {
    return {
      success: false,
      error: `Insufficient balance. You need ${formatNaira(pricing.base_cost_kobo)} but have ${formatNaira(affordCheck.balance)}.`
    }
  }

  // Create operation record (pending)
  const { data: operation, error: opError } = await supabase
    .from('advisor_operations')
    .insert({
      user_id: userId,
      operation_type: operationType,
      module,
      cost_kobo: pricing.base_cost_kobo,
      input_summary: inputSummary,
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (opError || !operation) {
    console.error('Operation create error:', opError)
    return { success: false, error: 'Failed to create operation record' }
  }

  const operationId = operation.id

  try {
    // Debit wallet BEFORE executing (fail fast)
    const debitResult = await debitWallet(supabase, {
      userId,
      amountKobo: pricing.base_cost_kobo,
      service: 'advisor',
      serviceRefId: operationId,
      referenceType: operationType,
      description: `${pricing.display_name}`,
      metadata: {
        module,
        operation_type: operationType
      }
    })

    if (!debitResult.success) {
      // Update operation as failed
      await supabase
        .from('advisor_operations')
        .update({ status: 'failed', error_message: debitResult.error })
        .eq('id', operationId)

      return { success: false, error: debitResult.error || 'Payment failed' }
    }

    // Execute the actual operation
    const result = await executor()

    // Update operation as completed
    await supabase
      .from('advisor_operations')
      .update({
        status: 'completed',
        output_id: result.outputId,
        output_table: result.outputTable,
        wallet_ledger_id: operationId,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      })
      .eq('id', operationId)

    // Store in cache if cacheable
    if (pricing.cacheable && inputForCache) {
      const inputHash = generateInputHash(inputForCache)
      await storeCache(
        supabase,
        operationType,
        inputHash,
        result.data,
        result.outputId,
        result.outputTable,
        pricing.cache_ttl_hours
      )
    }

    return {
      success: true,
      operationId,
      outputId: result.outputId,
      costKobo: pricing.base_cost_kobo,
      costFormatted: formatNaira(pricing.base_cost_kobo),
      newBalance: debitResult.newBalance,
      newBalanceFormatted: formatNaira(debitResult.newBalance),
      data: result.data
    }

  } catch (error) {
    console.error('Operation execution error:', error)

    // Update operation as failed
    await supabase
      .from('advisor_operations')
      .update({
        status: 'failed',
        error_message: String(error),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      })
      .eq('id', operationId)

    // TODO: Consider refunding if debit was successful but execution failed
    // For now, we don't auto-refund - admin can handle manually

    return { success: false, error: 'Operation failed. Please try again.' }
  }
}