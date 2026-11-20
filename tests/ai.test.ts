import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * lib/ai is the only code that talks to an AI provider. These tests pin what
 * it sends, how it reads each provider's reply, when it falls back, and how
 * usage is metered and limited. No provider is contacted: `fetch` and the
 * database client are replaced.
 */

const db = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
  rows: [] as Array<Record<string, unknown>>,
  selectError: null as { message: string } | null,
  insertError: null as { message: string } | null,
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        db.inserts.push(row)
        return { error: db.insertError }
      },
      select: () => ({
        eq: () => ({
          gte: () => ({
            limit: async () => ({ data: db.selectError ? null : db.rows, error: db.selectError }),
          }),
        }),
      }),
    }),
  },
}))

import {
  AIError,
  AI_MODELS,
  DAILY_TOKEN_BUDGET,
  checkAIQuota,
  decideQuota,
  estimateCostUsd,
  generateText,
  normalizeDeepseekUsage,
  openChatStream,
  quotaMessage,
  withAIContext,
} from '@/lib/ai'
import { resetProviderState } from '@/lib/ai/providers'

interface RequestBody {
  model?: string
  thinking?: unknown
  systemInstruction?: unknown
  contents: Array<{ role: string }>
  generationConfig: { maxOutputTokens: number }
  [key: string]: unknown
}

interface Call {
  url: string
  headers: Record<string, string>
  body: RequestBody
}

/** Replace `fetch` with a queue of canned replies and record every call. */
function stubFetch(replies: Array<{ status?: number; json?: unknown; text?: string }>) {
  const calls: Call[] = []
  const queue = [...replies]
  vi.stubGlobal('fetch', async (url: string, init: { headers: Record<string, string>; body: string }) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) })
    const reply = queue.shift()
    if (!reply) throw new Error('unexpected fetch call')
    const status = reply.status ?? 200
    const text = reply.text ?? JSON.stringify(reply.json ?? {})
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => text,
      json: async () => JSON.parse(text),
    }
  })
  return calls
}

const deepseekReply = (content: string, usage = { prompt_tokens: 100, completion_tokens: 20, prompt_cache_hit_tokens: 40 }) => ({
  json: { choices: [{ message: { content } }], usage },
})

const geminiReply = (text: string) => ({
  json: {
    candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 10 },
  },
})

beforeEach(() => {
  db.inserts.length = 0
  db.rows = []
  db.selectError = null
  db.insertError = null
  resetProviderState()
  vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek')
  vi.stubEnv('GEMINI_API_KEY', 'test-gemini')
  vi.stubEnv('ANTHROPIC_API_KEY', '')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('generateText on DeepSeek', () => {
  it('sends the current model with thinking off and the system prompt first', async () => {
    const calls = stubFetch([deepseekReply('hello')])

    const result = await generateText({ system: 'be brief', prompt: 'hi', maxTokens: 50, temperature: 0.3 })

    expect(result.text).toBe('hello')
    expect(result.provider).toBe('deepseek')
    expect(result.model).toBe(AI_MODELS.deepseek)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.deepseek.com/v1/chat/completions')
    expect(calls[0].headers.Authorization).toBe('Bearer test-deepseek')
    expect(calls[0].body).toMatchObject({
      model: AI_MODELS.deepseek,
      max_tokens: 50,
      temperature: 0.3,
      thinking: { type: 'disabled' },
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hi' },
      ],
    })
  })

  it('falls back to the previous model name when the current one is rejected, and remembers', async () => {
    const calls = stubFetch([
      { status: 400, text: '{"error":{"message":"Model Not Exist"}}' },
      deepseekReply('from legacy'),
      deepseekReply('again'),
    ])

    const first = await generateText({ prompt: 'hi', maxTokens: 50 })
    expect(first.text).toBe('from legacy')
    expect(first.model).toBe(AI_MODELS.deepseekLegacy)
    expect(calls[1].body.model).toBe(AI_MODELS.deepseekLegacy)
    expect(calls[1].body.thinking).toBeUndefined()

    await generateText({ prompt: 'hi again', maxTokens: 50 })
    expect(calls).toHaveLength(3)
    expect(calls[2].body.model).toBe(AI_MODELS.deepseekLegacy)
  })

  it('does not retry a request the provider rejected outright', async () => {
    const calls = stubFetch([{ status: 401, text: 'bad key' }])

    await expect(generateText({ prompt: 'hi', maxTokens: 50, attempts: 3 })).rejects.toMatchObject({
      name: 'AIError',
      kind: 'rejected',
      status: 401,
    })
    expect(calls).toHaveLength(1)
  })

  it('treats an answer shorter than minLength as a failure', async () => {
    stubFetch([deepseekReply('ok')])

    await expect(
      generateText({ prompt: 'hi', maxTokens: 50, minLength: 50, attempts: 1 })
    ).rejects.toMatchObject({ kind: 'empty' })
    // The provider still charged for the call, so it is still metered.
    expect(db.inserts).toHaveLength(1)
  })

  it('reports a missing key without calling the provider', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', '')
    const calls = stubFetch([])

    await expect(generateText({ prompt: 'hi', maxTokens: 50 })).rejects.toMatchObject({ kind: 'not_configured' })
    expect(calls).toHaveLength(0)
  })
})

describe('provider fall-back', () => {
  it('moves to the next provider when the first is unavailable', async () => {
    const calls = stubFetch([{ status: 503, text: 'overloaded' }, deepseekReply('rescued')])

    const result = await generateText({
      provider: 'gemini',
      fallback: ['deepseek'],
      prompt: 'hi',
      maxTokens: 50,
      attempts: 1,
    })

    expect(result.provider).toBe('deepseek')
    expect(result.text).toBe('rescued')
    expect(calls[0].url).toContain('generativelanguage.googleapis.com')
    expect(calls[1].url).toContain('api.deepseek.com')
  })

  it('writes the cover letter on DeepSeek when Claude has no key', async () => {
    const calls = stubFetch([deepseekReply('Dear hiring manager')])

    const result = await generateText({
      provider: 'claude',
      fallback: ['deepseek'],
      prompt: 'write the opening',
      maxTokens: 300,
    })

    expect(result.provider).toBe('deepseek')
    expect(calls).toHaveLength(1)
  })
})

describe('generateText on Gemini', () => {
  it('keeps the key out of the URL and reads text and usage', async () => {
    const calls = stubFetch([geminiReply('quiz json')])

    const result = await generateText({
      provider: 'gemini',
      system: 'you write quizzes',
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
      ],
      maxTokens: 800,
    })

    expect(result.text).toBe('quiz json')
    expect(result.usage).toEqual({ inputTokens: 50, cacheReadTokens: 0, outputTokens: 10 })
    expect(calls[0].url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.gemini}:generateContent`
    )
    expect(calls[0].url).not.toContain('test-gemini')
    expect(calls[0].headers['x-goog-api-key']).toBe('test-gemini')
    expect(calls[0].body.systemInstruction).toEqual({ parts: [{ text: 'you write quizzes' }] })
    expect(calls[0].body.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model', 'user'])
    expect(calls[0].body.generationConfig.maxOutputTokens).toBe(800)
  })

  it('reports a safety block as blocked and does not retry it', async () => {
    const calls = stubFetch([{ json: { promptFeedback: { blockReason: 'SAFETY' } } }])

    const error = await generateText({ provider: 'gemini', prompt: 'x', maxTokens: 50, attempts: 3 }).catch((e) => e)

    expect(error).toBeInstanceOf(AIError)
    expect(error.kind).toBe('blocked')
    expect(calls).toHaveLength(1)
  })

  it('still meters a call that was answered with a safety block', async () => {
    stubFetch([
      {
        json: {
          candidates: [{ finishReason: 'SAFETY' }],
          usageMetadata: { promptTokenCount: 70, candidatesTokenCount: 5 },
        },
      },
    ])

    await generateText({
      provider: 'gemini',
      prompt: 'x',
      maxTokens: 50,
      userId: 'user-1',
      feature: 'sabiquiz',
    }).catch(() => null)

    expect(db.inserts).toEqual([
      {
        user_id: 'user-1',
        feature: 'sabiquiz',
        model: AI_MODELS.gemini,
        input_tokens: 70,
        cache_read_tokens: 0,
        output_tokens: 5,
      },
    ])
  })
})

describe('usage metering', () => {
  it('records each call against the user and feature it was made for', async () => {
    stubFetch([deepseekReply('a')])

    await generateText({ prompt: 'hi', maxTokens: 50, userId: 'user-1', feature: 'lesson_qa' })

    expect(db.inserts).toEqual([
      {
        user_id: 'user-1',
        feature: 'lesson_qa',
        model: AI_MODELS.deepseek,
        input_tokens: 60,
        cache_read_tokens: 40,
        output_tokens: 20,
      },
    ])
  })

  it('takes the user and feature from the surrounding context', async () => {
    stubFetch([deepseekReply('a'), deepseekReply('b')])

    await withAIContext({ userId: 'user-2', feature: 'cv_build' }, async () => {
      await generateText({ prompt: 'one', maxTokens: 50 })
      await generateText({ prompt: 'two', maxTokens: 50 })
    })

    expect(db.inserts.map((r) => [r.user_id, r.feature])).toEqual([
      ['user-2', 'cv_build'],
      ['user-2', 'cv_build'],
    ])
  })

  it('still answers when the usage row cannot be written', async () => {
    db.insertError = { message: 'table missing' }
    stubFetch([deepseekReply('still here')])

    const result = await generateText({ prompt: 'hi', maxTokens: 50 })
    expect(result.text).toBe('still here')
  })

  it('splits cached tokens out of the DeepSeek prompt total', () => {
    expect(normalizeDeepseekUsage({ prompt_tokens: 100, completion_tokens: 7, prompt_cache_hit_tokens: 30 })).toEqual({
      inputTokens: 70,
      cacheReadTokens: 30,
      outputTokens: 7,
    })
    expect(normalizeDeepseekUsage(null)).toEqual({ inputTokens: 0, cacheReadTokens: 0, outputTokens: 0 })
  })

  it('estimates cost from the price table', () => {
    const cost = estimateCostUsd('claude-haiku-5-5', {
      inputTokens: 1_000_000,
      cacheReadTokens: 0,
      outputTokens: 1_000_000,
    })
    expect(cost).toBeCloseTo(0.6)
  })
})

describe('daily limits', () => {
  it('allows a call under the limit', () => {
    expect(decideQuota({ tokens: 1000, callsByFeature: { sabibot: 29 } }, 'sabibot', 'learner')).toEqual({
      ok: true,
      used: 29,
      limit: 30,
    })
  })

  it('stops a learner at the feature limit but not an instructor', () => {
    const usage = { tokens: 1000, callsByFeature: { sabibot: 30 } }

    const learner = decideQuota(usage, 'sabibot', 'learner')
    expect(learner).toEqual({ ok: false, reason: 'feature_limit', used: 30, limit: 30 })
    expect(quotaMessage(learner)).toContain('30')

    expect(decideQuota(usage, 'sabibot', 'instructor').ok).toBe(true)
  })

  it('stops everything once the daily token budget is spent', () => {
    const decision = decideQuota({ tokens: DAILY_TOKEN_BUDGET, callsByFeature: {} }, 'cv_build')
    expect(decision).toMatchObject({ ok: false, reason: 'daily_budget' })
  })

  it('puts no call limit on paid operations, only the token budget', () => {
    expect(decideQuota({ tokens: 5000, callsByFeature: { cv_build: 500 } }, 'cv_build')).toEqual({
      ok: true,
      used: 500,
      limit: null,
    })
  })

  it("adds up today's rows from the usage table", async () => {
    db.rows = Array.from({ length: 40 }, () => ({
      feature: 'lesson_qa',
      input_tokens: 10,
      cache_read_tokens: 0,
      output_tokens: 5,
    }))

    expect(await checkAIQuota('user-1', 'lesson_qa')).toEqual({
      ok: false,
      reason: 'feature_limit',
      used: 40,
      limit: 40,
    })
  })

  it('lets the call through if the usage table cannot be read', async () => {
    db.selectError = { message: 'timeout' }
    expect((await checkAIQuota('user-1', 'sabibot')).ok).toBe(true)
  })
})

describe('openChatStream', () => {
  it('asks for a stream with usage in the final event', async () => {
    const calls = stubFetch([{ text: 'data: [DONE]\n\n' }])

    const { model } = await openChatStream({
      system: 'you are SabiBot',
      messages: [{ role: 'user', content: 'hi' }],
      maxTokens: 700,
    })

    expect(model).toBe(AI_MODELS.deepseek)
    expect(calls[0].body).toMatchObject({
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 700,
    })
  })
})
