import { supabaseAdmin } from '@/lib/supabase-admin'
import type { TokenUsage } from './models'

/**
 * Per-user AI metering and daily limits.
 *
 * Every model call writes one row to `ai_usage` (who, which feature, which
 * model, how many tokens). Limits are read back from the same table, so there
 * is one source of truth and nothing to keep in step.
 *
 * Two limits apply to each user, per UTC day:
 *   1. a call limit on each free feature, and
 *   2. a token budget across everything, as a ceiling on what one account
 *      can cost in a day whatever it is doing.
 */

/** Calls per user per day. Features not listed have no call limit. */
export const DAILY_CALL_LIMITS: Record<string, { learner: number; instructor: number }> = {
  sabibot: { learner: 30, instructor: 100 },
  // Runs once after each SabiBot message, so it follows SabiBot's ceiling.
  sabibot_insights: { learner: 100, instructor: 100 },
  lesson_qa: { learner: 40, instructor: 40 },
  // Summaries are cached per lesson; this only counts fresh generations.
  lesson_summary: { learner: 20, instructor: 60 },
}

/** Tokens (input + output) per user per day, across every feature. */
export const DAILY_TOKEN_BUDGET = 1_000_000

export interface UsageToday {
  tokens: number
  callsByFeature: Record<string, number>
}

export type QuotaDecision =
  | { ok: true; used: number; limit: number | null }
  | { ok: false; reason: 'feature_limit' | 'daily_budget'; used: number; limit: number }

/** The decision itself, separate from the database read so it can be tested. */
export function decideQuota(usage: UsageToday, feature: string, role?: string | null): QuotaDecision {
  if (usage.tokens >= DAILY_TOKEN_BUDGET) {
    return { ok: false, reason: 'daily_budget', used: usage.tokens, limit: DAILY_TOKEN_BUDGET }
  }

  const used = usage.callsByFeature[feature] ?? 0
  const limits = DAILY_CALL_LIMITS[feature]
  if (!limits) return { ok: true, used, limit: null }

  const limit = role === 'instructor' ? limits.instructor : limits.learner
  if (used >= limit) return { ok: false, reason: 'feature_limit', used, limit }
  return { ok: true, used, limit }
}

function startOfUtcDay(): string {
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)
  return dayStart.toISOString()
}

export async function getUsageToday(userId: string): Promise<UsageToday | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_usage')
    .select('feature, input_tokens, cache_read_tokens, output_tokens')
    .eq('user_id', userId)
    .gte('created_at', startOfUtcDay())
    .limit(5000)

  if (error || !data) {
    console.error('[ai] Could not read usage for quota check:', error?.message)
    return null
  }

  const usage: UsageToday = { tokens: 0, callsByFeature: {} }
  for (const row of data) {
    usage.tokens += row.input_tokens + row.cache_read_tokens + row.output_tokens
    usage.callsByFeature[row.feature] = (usage.callsByFeature[row.feature] ?? 0) + 1
  }
  return usage
}

/**
 * May this user make another AI call for this feature today?
 *
 * If the usage table cannot be read the answer is yes: a database hiccup
 * should not switch AI off for everyone. The failure is logged.
 */
export async function checkAIQuota(
  userId: string,
  feature: string,
  role?: string | null
): Promise<QuotaDecision> {
  const usage = await getUsageToday(userId)
  if (!usage) return { ok: true, used: 0, limit: null }
  return decideQuota(usage, feature, role)
}

export function quotaMessage(decision: QuotaDecision): string {
  if (decision.ok) return ''
  return decision.reason === 'feature_limit'
    ? `You have reached today's limit of ${decision.limit} for this feature. It resets at midnight UTC.`
    : "You have reached today's AI usage limit. It resets at midnight UTC."
}

/**
 * Record one model call. Never throws: failing to meter must not fail the
 * feature. Awaited by callers so the row is written before a serverless
 * function is frozen.
 */
export async function recordAIUsage(entry: {
  userId: string | null
  feature: string
  model: string
  usage: TokenUsage
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('ai_usage').insert({
      user_id: entry.userId,
      feature: entry.feature,
      model: entry.model,
      input_tokens: entry.usage.inputTokens,
      cache_read_tokens: entry.usage.cacheReadTokens,
      output_tokens: entry.usage.outputTokens,
    })
    if (error) console.error('[ai] Could not record usage:', error.message)
  } catch (error) {
    console.error('[ai] Could not record usage:', error)
  }
}
