import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS, type AIProvider, type TokenUsage } from './models'

/**
 * The three AI providers behind one shape.
 *
 * Each `call*` function takes the same request and returns the same result,
 * so the rest of the app never knows which provider answered. Nothing outside
 * lib/ai should talk to a provider directly.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderRequest {
  system?: string
  messages: ChatMessage[]
  /** Upper bound on the length of the answer. */
  maxTokens: number
  /** Ignored by providers that do not accept it (Claude). */
  temperature?: number
}

export interface ProviderResult {
  text: string
  provider: AIProvider
  /** The model that actually answered. */
  model: string
  usage: TokenUsage
}

export type AIErrorKind =
  /** The provider's API key is not set. */
  | 'not_configured'
  /** The provider declined to answer on safety grounds. */
  | 'blocked'
  /** The provider answered with nothing usable. */
  | 'empty'
  /** Rate limit, overload, timeout or network failure: worth trying again. */
  | 'unavailable'
  /** The request itself was rejected: trying again will not help. */
  | 'rejected'

export class AIError extends Error {
  constructor(
    public readonly provider: AIProvider,
    public readonly kind: AIErrorKind,
    message: string,
    public readonly status?: number,
    /**
     * Set when the provider answered (and so charged for the call) but the
     * answer cannot be used, for example a safety decline. The call is still
     * metered from this.
     */
    public readonly billed?: { model: string; usage: TokenUsage }
  ) {
    super(message)
    this.name = 'AIError'
  }

  get retryable(): boolean {
    return this.kind === 'unavailable' || this.kind === 'empty'
  }
}

const REQUEST_TIMEOUT_MS = 120_000

function kindForStatus(status: number): AIErrorKind {
  return status === 408 || status === 429 || status >= 500 ? 'unavailable' : 'rejected'
}

async function postJson(
  provider: AIProvider,
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new AIError(provider, 'unavailable', `Could not reach ${provider}: ${String(error)}`)
  }
}

// ============================================================================
// DeepSeek
// ============================================================================

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepseekUsage {
  prompt_tokens?: number
  completion_tokens?: number
  prompt_cache_hit_tokens?: number
}

/** DeepSeek reports cached tokens inside the prompt total; split them out. */
export function normalizeDeepseekUsage(usage: DeepseekUsage | null | undefined): TokenUsage {
  const prompt = usage?.prompt_tokens ?? 0
  const cached = Math.min(usage?.prompt_cache_hit_tokens ?? 0, prompt)
  return {
    inputTokens: prompt - cached,
    cacheReadTokens: cached,
    outputTokens: usage?.completion_tokens ?? 0,
  }
}

// Set when DeepSeek rejects the current model name, so later calls in this
// server instance go straight to the name that works.
let deepseekUseLegacy = false

function deepseekBody(req: ProviderRequest, legacy: boolean, stream: boolean) {
  return {
    model: legacy ? AI_MODELS.deepseekLegacy : AI_MODELS.deepseek,
    messages: [
      ...(req.system ? [{ role: 'system', content: req.system }] : []),
      ...req.messages,
    ],
    max_tokens: req.maxTokens,
    temperature: req.temperature ?? 0.7,
    // The current model reasons before answering unless told not to. These
    // features want the direct answer the old model gave: faster, cheaper,
    // and `max_tokens` stays a limit on the answer itself.
    ...(legacy ? {} : { thinking: { type: 'disabled' } }),
    ...(stream ? { stream: true, stream_options: { include_usage: true } } : {}),
  }
}

/**
 * Send a DeepSeek request, falling back to the previous model name if the
 * current one is rejected as unknown.
 */
async function deepseekFetch(
  req: ProviderRequest,
  stream: boolean
): Promise<{ response: Response; model: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new AIError('deepseek', 'not_configured', 'DEEPSEEK_API_KEY is not set')
  const headers = { Authorization: `Bearer ${apiKey}` }

  const send = async (legacy: boolean) => ({
    response: await postJson('deepseek', DEEPSEEK_URL, headers, deepseekBody(req, legacy, stream)),
    model: legacy ? AI_MODELS.deepseekLegacy : AI_MODELS.deepseek,
  })

  let attempt = await send(deepseekUseLegacy)
  if (attempt.response.ok) return attempt

  const status = attempt.response.status
  const detail = await attempt.response.text().catch(() => '')

  // A 400 or 404 that mentions the model means the name is not accepted.
  if (!deepseekUseLegacy && (status === 400 || status === 404) && /model/i.test(detail)) {
    console.warn(
      `[ai] DeepSeek rejected model "${AI_MODELS.deepseek}" (${status}); using "${AI_MODELS.deepseekLegacy}"`
    )
    deepseekUseLegacy = true
    attempt = await send(true)
    if (attempt.response.ok) return attempt
    throw new AIError(
      'deepseek',
      kindForStatus(attempt.response.status),
      `DeepSeek error ${attempt.response.status}`,
      attempt.response.status
    )
  }

  throw new AIError('deepseek', kindForStatus(status), `DeepSeek error ${status}: ${detail.slice(0, 200)}`, status)
}

export async function callDeepseek(req: ProviderRequest): Promise<ProviderResult> {
  const { response, model } = await deepseekFetch(req, false)
  const data = await response.json().catch(() => null)
  return {
    text: data?.choices?.[0]?.message?.content || '',
    provider: 'deepseek',
    model,
    usage: normalizeDeepseekUsage(data?.usage),
  }
}

/**
 * Open a streaming DeepSeek chat. The caller reads the server-sent events
 * from `response.body` (OpenAI-compatible `data:` lines; the final chunk
 * carries `usage`, which `normalizeDeepseekUsage` understands).
 */
export async function openDeepseekStream(
  req: ProviderRequest
): Promise<{ response: Response; model: string }> {
  return deepseekFetch(req, true)
}

// ============================================================================
// Gemini
// ============================================================================

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/'

export async function callGemini(req: ProviderRequest): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new AIError('gemini', 'not_configured', 'GEMINI_API_KEY is not set')

  const model = AI_MODELS.gemini
  const response = await postJson(
    'gemini',
    `${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`,
    // The key goes in a header, never in the URL, so it cannot end up in logs.
    { 'x-goog-api-key': apiKey },
    {
      ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
      contents: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens,
      },
    }
  )

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new AIError(
      'gemini',
      kindForStatus(response.status),
      `Gemini error ${response.status}: ${detail.slice(0, 200)}`,
      response.status
    )
  }

  const data = await response.json().catch(() => null)
  const candidate = data?.candidates?.[0]

  const meta = data?.usageMetadata ?? {}
  const prompt: number = meta.promptTokenCount ?? 0
  const cached: number = Math.min(meta.cachedContentTokenCount ?? 0, prompt)
  const usage: TokenUsage = {
    inputTokens: prompt - cached,
    cacheReadTokens: cached,
    outputTokens: (meta.candidatesTokenCount ?? 0) + (meta.thoughtsTokenCount ?? 0),
  }

  if (data?.promptFeedback?.blockReason) {
    throw new AIError(
      'gemini',
      'blocked',
      `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`,
      undefined,
      { model, usage }
    )
  }
  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT') {
    throw new AIError('gemini', 'blocked', `Gemini blocked the answer: ${candidate.finishReason}`, undefined, {
      model,
      usage,
    })
  }

  const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts ?? []
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')

  return { text, provider: 'gemini', model, usage }
}

// ============================================================================
// Claude
// ============================================================================

// Claude thinks before it answers and that thinking counts towards
// `max_tokens`. Callers size `maxTokens` for the answer alone, so room for
// thinking is added on top.
const CLAUDE_THINKING_HEADROOM = 4096

let anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIError('claude', 'not_configured', 'ANTHROPIC_API_KEY is not set')
  }
  // The SDK retries rate limits, overloads and network errors itself.
  anthropic ??= new Anthropic({ maxRetries: 2, timeout: REQUEST_TIMEOUT_MS })
  return anthropic
}

export async function callClaude(req: ProviderRequest): Promise<ProviderResult> {
  const client = getAnthropic()
  const model = AI_MODELS.claude

  let response: Anthropic.Message
  try {
    // No `temperature`: current Claude models reject sampling parameters.
    response = await client.messages.create({
      model,
      max_tokens: req.maxTokens + CLAUDE_THINKING_HEADROOM,
      ...(req.system ? { system: req.system } : {}),
      messages: req.messages,
    })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new AIError('claude', 'unavailable', 'Claude rate limit reached', 429)
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AIError('claude', 'unavailable', `Could not reach Claude: ${error.message}`)
    }
    if (error instanceof Anthropic.APIError) {
      const status = typeof error.status === 'number' ? error.status : 500
      throw new AIError('claude', kindForStatus(status), `Claude error ${status}: ${error.message}`, status)
    }
    throw error
  }

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    outputTokens: response.usage.output_tokens ?? 0,
  }

  // A safety decline is a normal 200 response; check before reading content.
  if (response.stop_reason === 'refusal') {
    throw new AIError('claude', 'blocked', 'Claude declined the request', undefined, { model, usage })
  }

  // The answer can be preceded by thinking blocks, so read blocks by type.
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  return { text, provider: 'claude', model, usage }
}

export const PROVIDER_CALLS: Record<AIProvider, (req: ProviderRequest) => Promise<ProviderResult>> = {
  deepseek: callDeepseek,
  gemini: callGemini,
  claude: callClaude,
}

/** For tests: forget which DeepSeek model name was last accepted. */
export function resetProviderState(): void {
  deepseekUseLegacy = false
}
