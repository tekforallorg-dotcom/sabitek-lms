/**
 * The one place that names AI models.
 *
 * Every model id used by the app is read from here, so moving to a newer
 * model is a one-line change (or an environment variable, with no code change
 * at all). Nothing else in the codebase should contain a model id string.
 */

export type AIProvider = 'deepseek' | 'gemini' | 'claude'

export const AI_MODELS = {
  /** DeepSeek's current general model. Runs almost every AI feature. */
  deepseek: process.env.AI_DEEPSEEK_MODEL || 'deepseek-flash',
  /**
   * The name DeepSeek used before `deepseek-flash`. It was announced for
   * discontinuation on 2026-07-24 but was still answering in November 2026.
   * Kept only as an automatic fall-back if the current name is rejected.
   */
  deepseekLegacy: 'deepseek-chat',
  /** Quiz generation and career roadmaps. */
  gemini: process.env.AI_GEMINI_MODEL || 'gemini-2.5-flash-lite',
  /** Cover-letter prose. */
  claude: process.env.AI_CLAUDE_MODEL || 'claude-haiku-5-5',
} as const

export interface TokenUsage {
  /** Prompt tokens billed at the full input rate (cache reads excluded). */
  inputTokens: number
  /** Prompt tokens served from the provider's cache, billed at a discount. */
  cacheReadTokens: number
  outputTokens: number
}

/**
 * List prices in USD per million tokens, for the admin spend estimate.
 * These are estimates for a dashboard, not billing: check the provider's own
 * invoice for real spend.
 */
export const MODEL_PRICES: Record<string, { input: number; cached: number; output: number }> = {
  // DeepSeek charges half this off-peak; the peak rate is used so the
  // estimate errs high.
  'deepseek-flash': { input: 0.3, cached: 0.006, output: 1.2 },
  // Usage rows recorded before the move to deepseek-flash.
  'deepseek-chat': { input: 0.27, cached: 0.027, output: 1.1 },
  'gemini-2.5-flash-lite': { input: 0.1, cached: 0.025, output: 0.4 },
  'claude-haiku-5-5': { input: 0.1, cached: 0.01, output: 0.5 },
}

const FALLBACK_PRICE = MODEL_PRICES['deepseek-flash']

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const price = MODEL_PRICES[model] || FALLBACK_PRICE
  return (
    (usage.inputTokens / 1e6) * price.input +
    (usage.cacheReadTokens / 1e6) * price.cached +
    (usage.outputTokens / 1e6) * price.output
  )
}
