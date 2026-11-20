import { getAIContext } from './context'
import type { AIProvider, TokenUsage } from './models'
import {
  AIError,
  PROVIDER_CALLS,
  openDeepseekStream,
  type ChatMessage,
  type ProviderRequest,
} from './providers'
import { recordAIUsage } from './quota'

/**
 * The app's single entry point to AI models.
 *
 *   generateText(...)   one answer, with retries, provider fall-back and
 *                       per-user usage metering
 *   openChatStream(...) a streamed chat (SabiBot)
 *   withAIContext(...)  say who a group of calls is for
 *   checkAIQuota(...)   per-user daily limits
 *
 * Model ids live in ./models and nowhere else.
 */

export { withAIContext, getAIContext, type AIContext } from './context'
export { AI_MODELS, MODEL_PRICES, estimateCostUsd, type AIProvider, type TokenUsage } from './models'
export { AIError, normalizeDeepseekUsage, type ChatMessage } from './providers'
export {
  checkAIQuota,
  decideQuota,
  quotaMessage,
  recordAIUsage,
  DAILY_CALL_LIMITS,
  DAILY_TOKEN_BUDGET,
  type QuotaDecision,
} from './quota'

export interface GenerateTextInput {
  /** Provider to try first. Defaults to DeepSeek. */
  provider?: AIProvider
  /** Providers to try, in order, if the first cannot answer. */
  fallback?: AIProvider[]
  system?: string
  /** A single user message. Use `messages` instead for a conversation. */
  prompt?: string
  messages?: ChatMessage[]
  /** Upper bound on the length of the answer. */
  maxTokens: number
  temperature?: number
  /** Tries per provider for temporary failures. Defaults to 2. */
  attempts?: number
  /** Treat an answer shorter than this as a failure and try again. */
  minLength?: number
  /**
   * Who and what this call is metered against. Defaults to the surrounding
   * `withAIContext`, so pipelines do not have to pass these down.
   */
  userId?: string | null
  feature?: string
}

export interface GenerateTextResult {
  text: string
  provider: AIProvider
  model: string
  usage: TokenUsage
  /** Input + cached + output, for callers that keep a running total. */
  totalTokens: number
}

const RETRY_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  const context = getAIContext()
  const userId = input.userId !== undefined ? input.userId : context?.userId ?? null
  const feature = input.feature ?? context?.feature ?? 'unknown'

  const messages: ChatMessage[] = input.messages ?? [{ role: 'user', content: input.prompt ?? '' }]
  const request: ProviderRequest = {
    system: input.system,
    messages,
    maxTokens: input.maxTokens,
    temperature: input.temperature,
  }

  const providers = [input.provider ?? 'deepseek', ...(input.fallback ?? [])]
  const attempts = Math.max(1, input.attempts ?? 2)
  const minLength = Math.max(1, input.minLength ?? 1)
  let lastError: unknown = null

  for (const provider of providers) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await PROVIDER_CALLS[provider](request)

        // The provider was paid for this call whether or not the answer is
        // usable, so it is metered either way.
        await recordAIUsage({ userId, feature, model: result.model, usage: result.usage })

        if (result.text.trim().length < minLength) {
          throw new AIError(provider, 'empty', `${provider} returned an empty or too short answer`)
        }

        return {
          ...result,
          totalTokens:
            result.usage.inputTokens + result.usage.cacheReadTokens + result.usage.outputTokens,
        }
      } catch (error) {
        lastError = error
        const retryable = error instanceof AIError ? error.retryable : true
        console.error(
          `[ai] ${feature}: ${provider} attempt ${attempt}/${attempts} failed:`,
          error instanceof Error ? error.message : error
        )
        if (!retryable) break
        if (attempt < attempts) await sleep(RETRY_DELAY_MS * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI request failed')
}

/**
 * Open a streamed chat for SabiBot. The caller reads the event stream and
 * records usage itself once the stream ends (the token counts arrive in the
 * last event).
 */
export async function openChatStream(input: {
  system?: string
  messages: ChatMessage[]
  maxTokens: number
  temperature?: number
}): Promise<{ response: Response; model: string }> {
  return openDeepseekStream(input)
}
