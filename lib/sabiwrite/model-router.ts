import { ToolType, PlanTier, ToneType, ModelProvider, RouteDecision } from './types'

const HAIKU_MODEL = 'claude-3-haiku-20240307'
const DEEPSEEK_MODEL = 'deepseek-chat'

// Thresholds for routing decisions
const MIN_TOKENS_FOR_HAIKU = 2000
const COMPLEX_TONES: ToneType[] = ['executive', 'academic', 'formal']
const PREMIUM_TOOLS: ToolType[] = ['humanize', 'plagiarism']
const PREMIUM_TIERS: PlanTier[] = ['weekly', 'monthly', 'pro']

// Environment overrides
function getOverrides(): { forceDeepSeek: boolean; forceHaiku: boolean } {
  return {
    forceDeepSeek: process.env.SABIWRITE_FORCE_DEEPSEEK === 'true',
    forceHaiku: process.env.SABIWRITE_FORCE_HAIKU === 'true'
  }
}

export function routeModel(params: {
  toolType: ToolType
  planTier: PlanTier
  inputTokens: number
  tone?: ToneType
  modelPreference?: 'deepseek' | 'haiku' | 'auto'
}): RouteDecision {
  const { toolType, planTier, inputTokens, tone, modelPreference } = params
  const overrides = getOverrides()

  // Override checks first
  if (overrides.forceDeepSeek) {
    return { provider: 'deepseek', model: DEEPSEEK_MODEL, reason: 'env_override_deepseek' }
  }
  if (overrides.forceHaiku) {
    return { provider: 'anthropic', model: HAIKU_MODEL, reason: 'env_override_haiku' }
  }

  // Explicit model preference from pricing rule
  if (modelPreference === 'haiku') {
    return { provider: 'anthropic', model: HAIKU_MODEL, reason: 'pricing_rule_haiku' }
  }
  if (modelPreference === 'deepseek') {
    return { provider: 'deepseek', model: DEEPSEEK_MODEL, reason: 'pricing_rule_deepseek' }
  }

  // Auto routing logic
  
  // Premium tools always use Haiku for paid tiers
  if (PREMIUM_TOOLS.includes(toolType) && PREMIUM_TIERS.includes(planTier)) {
    return { provider: 'anthropic', model: HAIKU_MODEL, reason: 'premium_tool_paid_tier' }
  }

  // Complex tones use Haiku for paid tiers
  if (tone && COMPLEX_TONES.includes(tone) && PREMIUM_TIERS.includes(planTier)) {
    return { provider: 'anthropic', model: HAIKU_MODEL, reason: 'complex_tone_paid_tier' }
  }

  // Large input uses Haiku for coherence (paid tiers only)
  if (inputTokens > MIN_TOKENS_FOR_HAIKU && PREMIUM_TIERS.includes(planTier)) {
    return { provider: 'anthropic', model: HAIKU_MODEL, reason: 'large_input_coherence' }
  }

  // Default to DeepSeek for cost efficiency
  return { provider: 'deepseek', model: DEEPSEEK_MODEL, reason: 'default_cost_effective' }
}

export function getModelConfig(provider: ModelProvider): {
  apiUrl: string
  apiKeyEnv: string
  maxTokens: number
} {
  if (provider === 'anthropic') {
    return {
      apiUrl: 'https://api.anthropic.com/v1/messages',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      maxTokens: 4096
    }
  }

  return {
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    maxTokens: 4096
  }
}