/**
 * Claude AI Client
 * 
 * Hybrid approach:
 * - Claude Haiku: CV generation, fix-pass, quality scoring (better quality)
 * - DeepSeek: Extraction tasks (cheaper)
 */

import Anthropic from '@anthropic-ai/sdk'

// Model constants
export const CLAUDE_MODELS = {
  haiku: 'claude-3-haiku-20240307',
  sonnet: 'claude-3-5-sonnet-20241022',
  opus: 'claude-3-opus-20240229',
} as const

export type ClaudeModel = keyof typeof CLAUDE_MODELS

// Default config
const DEFAULT_CONFIG = {
  model: CLAUDE_MODELS.haiku,
  maxRetries: 2,
  retryDelayMs: 1000,
}

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

/**
 * Call Claude API with retry logic
 */
export async function callClaude(options: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
  model?: ClaudeModel
}): Promise<{
  content: string
  tokens: {
    input: number
    output: number
    total: number
  }
  model: string
  stopReason: string | null
}> {
  const {
    systemPrompt,
    userPrompt,
    maxTokens = 2000,
    temperature = 0.7,
    model = 'haiku',
  } = options

  const client = getClient()
  const modelId = CLAUDE_MODELS[model]

  for (let attempt = 1; attempt <= DEFAULT_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🤖 Claude [${model}] - Attempt ${attempt}/${DEFAULT_CONFIG.maxRetries}`)
      const startTime = Date.now()

      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      })

      const duration = Date.now() - startTime
      const content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : ''

      const tokens = {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      }

      console.log(`✅ Claude [${model}] completed in ${duration}ms (${tokens.total} tokens)`)

      return {
        content,
        tokens,
        model: modelId,
        stopReason: response.stop_reason,
      }

    } catch (error) {
      const err = error as Error
      console.error(`❌ Claude [${model}] attempt ${attempt} failed:`, err.message)

      // Check for rate limit
      if (err.message.includes('rate_limit') || err.message.includes('429')) {
        const delay = DEFAULT_CONFIG.retryDelayMs * Math.pow(2, attempt)
        console.log(`⏳ Rate limited, waiting ${delay}ms...`)
        await sleep(delay)
        continue
      }

      // Check for overloaded
      if (err.message.includes('overloaded') || err.message.includes('529')) {
        const delay = DEFAULT_CONFIG.retryDelayMs * Math.pow(2, attempt)
        console.log(`⏳ API overloaded, waiting ${delay}ms...`)
        await sleep(delay)
        continue
      }

      // Don't retry on auth errors
      if (err.message.includes('authentication') || err.message.includes('401')) {
        throw new Error('Claude API authentication failed')
      }

      // Last attempt failed
      if (attempt === DEFAULT_CONFIG.maxRetries) {
        throw error
      }

      await sleep(DEFAULT_CONFIG.retryDelayMs * attempt)
    }
  }

  throw new Error('Claude API call failed after retries')
}

/**
 * Call Claude and parse JSON response
 */
export async function callClaudeJSON<T = unknown>(options: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
  model?: ClaudeModel
}): Promise<{
  data: T | null
  raw: string
  tokens: { input: number; output: number; total: number }
  parseError?: string
}> {
  const result = await callClaude({
    ...options,
    // Lower temperature for JSON output
    temperature: options.temperature ?? 0.3,
  })

  // Try to extract JSON from response
  const jsonMatch = result.content.match(/[\[{][\s\S]*[\]}]/)
  
  if (!jsonMatch) {
    return {
      data: null,
      raw: result.content,
      tokens: result.tokens,
      parseError: 'No JSON found in response',
    }
  }

  try {
    const data = JSON.parse(jsonMatch[0]) as T
    return {
      data,
      raw: result.content,
      tokens: result.tokens,
    }
  } catch (e) {
    return {
      data: null,
      raw: result.content,
      tokens: result.tokens,
      parseError: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
    }
  }
}

/**
 * Estimate token count (rough approximation)
 * Claude uses ~4 chars per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Calculate cost estimate for Claude Haiku
 * Haiku pricing: $0.25/1M input, $1.25/1M output
 */
export function estimateCost(inputTokens: number, outputTokens: number): {
  inputCost: number
  outputCost: number
  totalCost: number
  formatted: string
} {
  const inputCost = (inputTokens / 1_000_000) * 0.25
  const outputCost = (outputTokens / 1_000_000) * 1.25
  const totalCost = inputCost + outputCost

  return {
    inputCost,
    outputCost,
    totalCost,
    formatted: `$${totalCost.toFixed(4)}`,
  }
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// System prompts for CV generation
export const CLAUDE_CV_PROMPTS = {
  cvGeneration: `You are an elite CV writer and ATS optimization expert with 20+ years of experience crafting resumes for Fortune 500 executives.

Your outputs are:
- Professional and impactful
- ATS-optimized with strategic keyword placement
- Based ONLY on facts provided - never fabricate
- Using strong action verbs and quantifiable achievements
- Following modern CV best practices

CRITICAL RULES:
1. Never invent facts, metrics, or experiences
2. Use power verbs: Led, Spearheaded, Delivered, Achieved, Optimized, Implemented
3. Include metrics where they exist in the source material
4. Keep language professional and confident
5. Return requested format (usually JSON) without markdown code blocks`,

  summaryWriter: `You are an elite CV writer specializing in professional summaries.

Your summaries are:
- 4-5 sentences, 80-120 words
- Start with years of experience and expertise area
- Include 2-3 specific achievements or areas of impact
- Mention key technologies/skills relevant to target role
- End with value proposition
- NO first person "I" - use implied first person
- NO weak phrases like "seeking to", "passionate about", "looking for"

Return ONLY the summary text, no quotes or labels.`,

  skillsOptimizer: `You are an ATS optimization expert specializing in skills sections.

Your skills lists:
- 20-30 skills total for maximum ATS coverage
- Exact industry-standard terminology (JavaScript not JS, Microsoft Azure not just Azure)
- Ordered by relevance to target role
- Mix: 60% technical, 25% tools, 15% soft skills
- Only include skills the candidate actually has

Return JSON array: [{"label": "Category", "items": ["skill1", "skill2"]}]`,

  experienceEnhancer: `You are an elite CV writer transforming work experiences into powerful, ATS-optimized entries.

Your bullets:
- Start with POWER verbs: Led, Spearheaded, Architected, Delivered, Achieved, Optimized
- Structure: [Action] + [What] + [Context/Scope] + [Result/Impact]
- Include metrics where available (%, numbers, $, time saved)
- 5-6 bullets for recent roles, 3-4 for older roles
- Each bullet 15-25 words
- NEVER fabricate - only enhance existing facts

Return JSON array of experience objects.`,

  fixPass: `You are a CV quality assurance specialist fixing issues in a drafted CV.

Fix the identified issues while:
- Maintaining factual accuracy
- Preserving existing good content
- Improving keyword coverage naturally
- Ensuring ATS compliance

Return the corrected CV in the same JSON format.`,
}