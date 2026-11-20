/**
 * Claude calls for the CV builder.
 *
 * Hybrid approach:
 * - Claude: CV writing and the fix pass (better prose)
 * - DeepSeek: extraction tasks, and the fall-back when Claude cannot answer
 *
 * The model id, retries and usage metering live in lib/ai; this file only
 * keeps the shapes the CV builder expects, plus its prompts.
 */

import { generateText } from '@/lib/ai'

interface ClaudeTokens {
  input: number
  output: number
  total: number
}

/**
 * Ask Claude for text. Throws if Claude cannot answer, so the caller can fall
 * back to DeepSeek.
 */
export async function callClaude(options: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}): Promise<{ content: string; tokens: ClaudeTokens; model: string }> {
  const result = await generateText({
    provider: 'claude',
    system: options.systemPrompt,
    prompt: options.userPrompt,
    maxTokens: options.maxTokens ?? 2000,
    // The Anthropic SDK already retries temporary failures.
    attempts: 1,
  })

  const input = result.usage.inputTokens + result.usage.cacheReadTokens
  return {
    content: result.text,
    tokens: { input, output: result.usage.outputTokens, total: result.totalTokens },
    model: result.model,
  }
}

/**
 * Call Claude and parse JSON response
 */
export async function callClaudeJSON<T = unknown>(options: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}): Promise<{
  data: T | null
  raw: string
  tokens: ClaudeTokens
  parseError?: string
}> {
  const result = await callClaude(options)

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