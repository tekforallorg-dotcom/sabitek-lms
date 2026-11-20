import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The Claude side of lib/ai, with the Anthropic SDK replaced. Pins the request
 * the app sends to a current Claude model and how the reply is read.
 */

const sdk = vi.hoisted(() => {
  class APIError extends Error {
    status?: number
    constructor(status: number | undefined, message: string) {
      super(message)
      this.status = status
    }
  }
  class RateLimitError extends APIError {}
  class APIConnectionError extends APIError {}
  return {
    APIError,
    RateLimitError,
    APIConnectionError,
    requests: [] as Array<Record<string, unknown>>,
    next: null as null | (() => unknown),
  }
})

vi.mock('@anthropic-ai/sdk', () => {
  class Anthropic {
    static APIError = sdk.APIError
    static RateLimitError = sdk.RateLimitError
    static APIConnectionError = sdk.APIConnectionError
    messages = {
      create: async (request: Record<string, unknown>) => {
        sdk.requests.push(request)
        return sdk.next!()
      },
    }
  }
  return { default: Anthropic }
})

const inserts = vi.hoisted(() => [] as Array<Record<string, unknown>>)

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        inserts.push(row)
        return { error: null }
      },
    }),
  },
}))

import { AIError, AI_MODELS, generateText } from '@/lib/ai'

const message = (overrides: Record<string, unknown> = {}) => ({
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'Dear hiring manager' }],
  usage: { input_tokens: 120, output_tokens: 80, cache_read_input_tokens: 0 },
  ...overrides,
})

beforeEach(() => {
  inserts.length = 0
  sdk.requests.length = 0
  sdk.next = () => message()
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic')
  vi.stubEnv('DEEPSEEK_API_KEY', '')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('generateText on Claude', () => {
  it('uses the current model, sends no temperature and leaves room for thinking', async () => {
    const result = await generateText({
      provider: 'claude',
      system: 'you write cover letters',
      prompt: 'write the opening',
      maxTokens: 1000,
      temperature: 0.7,
    })

    expect(result.text).toBe('Dear hiring manager')
    expect(result.model).toBe('claude-haiku-5-5')
    expect(AI_MODELS.claude).toBe('claude-haiku-5-5')
    expect(result.usage).toEqual({ inputTokens: 120, cacheReadTokens: 0, outputTokens: 80 })

    const request = sdk.requests[0]
    expect(request.model).toBe('claude-haiku-5-5')
    expect(request.system).toBe('you write cover letters')
    expect(request.messages).toEqual([{ role: 'user', content: 'write the opening' }])
    expect(request.max_tokens).toBeGreaterThan(1000)
    expect(request).not.toHaveProperty('temperature')
    expect(request).not.toHaveProperty('top_p')
  })

  it('reads the answer after a thinking block', async () => {
    sdk.next = () =>
      message({
        content: [
          { type: 'thinking', thinking: '', signature: 'sig' },
          { type: 'text', text: 'First part. ' },
          { type: 'text', text: 'Second part.' },
        ],
      })

    const result = await generateText({ provider: 'claude', prompt: 'x', maxTokens: 200 })
    expect(result.text).toBe('First part. Second part.')
  })

  it('reports a safety decline as blocked', async () => {
    sdk.next = () => message({ stop_reason: 'refusal', content: [] })

    const error = await generateText({ provider: 'claude', prompt: 'x', maxTokens: 200, attempts: 1 }).catch((e) => e)
    expect(error).toBeInstanceOf(AIError)
    expect(error.kind).toBe('blocked')
  })

  it('still meters a call that Claude declined', async () => {
    sdk.next = () => message({ stop_reason: 'refusal', content: [] })

    await generateText({
      provider: 'claude',
      prompt: 'x',
      maxTokens: 200,
      attempts: 1,
      userId: 'user-1',
      feature: 'cover_letter',
    }).catch(() => null)

    expect(inserts).toEqual([
      {
        user_id: 'user-1',
        feature: 'cover_letter',
        model: AI_MODELS.claude,
        input_tokens: 120,
        cache_read_tokens: 0,
        output_tokens: 80,
      },
    ])
  })

  it('marks a rate limit as temporary and a bad request as final', async () => {
    sdk.next = () => {
      throw new sdk.RateLimitError(429, 'slow down')
    }
    const limited = await generateText({ provider: 'claude', prompt: 'x', maxTokens: 200, attempts: 1 }).catch((e) => e)
    expect(limited).toMatchObject({ kind: 'unavailable', status: 429 })

    sdk.next = () => {
      throw new sdk.APIError(400, 'model not found')
    }
    sdk.requests.length = 0
    const rejected = await generateText({ provider: 'claude', prompt: 'x', maxTokens: 200, attempts: 3 }).catch((e) => e)
    expect(rejected).toMatchObject({ kind: 'rejected', status: 400 })
    expect(sdk.requests).toHaveLength(1)
  })
})
