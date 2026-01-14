/**
 * Cover Letter Builder - Pipeline Orchestrator
 * 
 * Section-by-section generation for high-quality cover letters:
 * 1. Input normalization
 * 2. Role requirements extraction
 * 3. Candidate evidence extraction
 * 4. Evidence mapping
 * 5. Section-by-section generation
 * 6. Assembly and polish
 * 7. Quality validation
 */

import {
  BuildCoverLetterInput,
  TailorCoverLetterInput,
  CoverLetterDocument,
  CoverLetterSections,
  CoverLetterInsights,
  RoleRequirements,
  CandidateEvidence,
  EvidenceMapping,
  PipelineContext,
  PipelineStep,
  CoverLetterTone,
  CoverLetterLength,
  LENGTH_CONSTRAINTS,
  validateCoverLetter,
  QualityCheckResult,
} from './schemas'

import {
  SYSTEM_PROMPTS,
  buildRoleAnalysisPrompt,
  buildEvidenceExtractionPrompt,
  buildEvidenceMappingPrompt,
  buildOpeningPrompt,
  buildValuePrompt,
  buildFitPrompt,
  buildClosingPrompt,
  buildTailorAnalysisPrompt,
  buildTailorRewritePrompt,
  buildPolishPrompt,
  buildInsightsPrompt,
  generateMissingMetricsQuestions,
  extractJSON,
} from './prompts'

// ============================================
// CONFIGURATION
// ============================================

const PIPELINE_CONFIG = {
  claudeApi: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    maxRetries: 2,
    retryDelayMs: 1000,
  },
  deepseekApi: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
  },
}

// ============================================
// PIPELINE LOGGING
// ============================================

function createContext(): PipelineContext {
  return {
    steps: [],
    currentStep: 0,
    totalTokens: 0,
    warnings: [],
  }
}

function startStep(ctx: PipelineContext, name: string): void {
  const step: PipelineStep = {
    name,
    status: 'running',
    startTime: Date.now(),
  }
  ctx.steps.push(step)
  ctx.currentStep = ctx.steps.length - 1
  console.log(`▶️ [CL Step ${ctx.currentStep + 1}] ${name}`)
}

function completeStep(ctx: PipelineContext, data?: unknown): void {
  const step = ctx.steps[ctx.currentStep]
  step.status = 'completed'
  step.endTime = Date.now()
  step.data = data
  const duration = step.endTime - (step.startTime || 0)
  console.log(`✅ [CL Step ${ctx.currentStep + 1}] ${step.name} completed (${duration}ms)`)
}

function failStep(ctx: PipelineContext, error: string): void {
  const step = ctx.steps[ctx.currentStep]
  step.status = 'failed'
  step.endTime = Date.now()
  step.error = error
  console.error(`❌ [CL Step ${ctx.currentStep + 1}] ${step.name} failed: ${error}`)
}

// ============================================
// AI CALL HELPERS
// ============================================

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 1000
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  for (let attempt = 1; attempt <= PIPELINE_CONFIG.claudeApi.maxRetries; attempt++) {
    try {
      console.log(`🤖 Claude [haiku] - Attempt ${attempt}/${PIPELINE_CONFIG.claudeApi.maxRetries}`)
      
      const response = await fetch(PIPELINE_CONFIG.claudeApi.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: PIPELINE_CONFIG.claudeApi.model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Claude API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text || ''
      const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      
      console.log(`✅ Claude [haiku] completed (${tokens} tokens)`)
      return { content, tokens }

    } catch (error) {
      if (attempt < PIPELINE_CONFIG.claudeApi.maxRetries) {
        console.log(`⚠️ Claude attempt ${attempt} failed, retrying...`)
        await new Promise(r => setTimeout(r, PIPELINE_CONFIG.claudeApi.retryDelayMs * attempt))
      } else {
        throw error
      }
    }
  }

  throw new Error('Claude API failed after retries')
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2000
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  const response = await fetch(PIPELINE_CONFIG.deepseekApi.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PIPELINE_CONFIG.deepseekApi.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  }
}

// ============================================
// BUILD COVER LETTER PIPELINE
// ============================================

export interface BuildCoverLetterResult {
  success: boolean
  letter?: CoverLetterDocument
  qualityScore: number
  qualityCheck?: QualityCheckResult
  warnings: string[]
  pipeline: PipelineContext
  error?: string
  missingMetricsQuestions?: string[]
}

export async function buildCoverLetter(input: BuildCoverLetterInput): Promise<BuildCoverLetterResult> {
  const ctx = createContext()
  
  const tone: CoverLetterTone = input.tone || 'professional'
  const length: CoverLetterLength = input.length || 'standard'
  
  try {
    console.log('📝 Starting Cover Letter Builder pipeline (BUILD)...')

    // ============================================
    // STEP 1: Input Normalization
    // ============================================
    startStep(ctx, 'Input Normalization')
    
    const profileStr = JSON.stringify(input.profile, null, 2)
    
    completeStep(ctx, { profileLength: profileStr.length })

    // ============================================
    // STEP 2: Role Requirements Extraction
    // ============================================
    let requirements: RoleRequirements = {
      responsibilities: [],
      mustHaveSkills: [],
      niceToHaveSkills: [],
      seniorityLevel: 'mid',
      keywords: [],
    }

    if (input.jobDescription && input.jobDescription.length > 100) {
      startStep(ctx, 'Role Requirements Extraction')
      
      const roleResult = await callDeepSeek(
        SYSTEM_PROMPTS.roleAnalysis,
        buildRoleAnalysisPrompt(input.jobDescription),
        1500
      )
      ctx.totalTokens += roleResult.tokens
      
      const parsed = extractJSON(roleResult.content)
      if (parsed && typeof parsed === 'object') {
        requirements = parsed as RoleRequirements
      }
      
      completeStep(ctx, { keywords: requirements.keywords.length })
    } else {
      ctx.warnings.push('No job description provided - letter will be more generic')
    }

    // ============================================
    // STEP 3: Candidate Evidence Extraction
    // ============================================
    startStep(ctx, 'Candidate Evidence Extraction')
    
    const evidenceResult = await callDeepSeek(
      SYSTEM_PROMPTS.evidenceExtraction,
      buildEvidenceExtractionPrompt(input.profile, input.uploadedCVText, input.extraInfo),
      2000
    )
    ctx.totalTokens += evidenceResult.tokens
    
    let evidence: CandidateEvidence = {
      topAchievements: [],
      relevantProjects: [],
      toolsAndStack: [],
      domainExperience: [],
      leadershipSignals: [],
      yearsOfExperience: 0,
    }
    
    const parsedEvidence = extractJSON(evidenceResult.content)
    if (parsedEvidence && typeof parsedEvidence === 'object') {
      evidence = parsedEvidence as CandidateEvidence
    }
    
    completeStep(ctx, { achievements: evidence.topAchievements.length })

    // ============================================
    // STEP 4: Evidence Mapping
    // ============================================
    startStep(ctx, 'Evidence Mapping')
    
    let mapping: EvidenceMapping = {
      alignmentPoints: [],
      keywordGaps: [],
      strengthScore: 50,
    }

    if (requirements.keywords.length > 0) {
      const mappingResult = await callDeepSeek(
        SYSTEM_PROMPTS.roleAnalysis,
        buildEvidenceMappingPrompt(requirements, evidence),
        1000
      )
      ctx.totalTokens += mappingResult.tokens
      
      const parsedMapping = extractJSON(mappingResult.content)
      if (parsedMapping && typeof parsedMapping === 'object') {
        mapping = parsedMapping as EvidenceMapping
      }
    } else {
      // Create generic alignment points from evidence
      mapping.alignmentPoints = evidence.topAchievements.slice(0, 3)
    }
    
    completeStep(ctx, { alignmentPoints: mapping.alignmentPoints.length })

    // ============================================
    // STEP 5: Generate Sections
    // ============================================
    startStep(ctx, 'Generate Opening Paragraph')
    
    const openingResult = await callClaude(
      SYSTEM_PROMPTS.paragraphWriter,
      buildOpeningPrompt(
        input.targetRole,
        input.companyName,
        tone,
        [...mapping.alignmentPoints, ...evidence.topAchievements].slice(0, 4),
        length
      ),
      500
    )
    ctx.totalTokens += openingResult.tokens
    const opening = openingResult.content.trim()
    
    completeStep(ctx, { words: opening.split(/\s+/).length })

    // Generate Value Paragraph
    startStep(ctx, 'Generate Value Paragraph')
    
    const valueResult = await callClaude(
      SYSTEM_PROMPTS.paragraphWriter,
      buildValuePrompt(
        input.targetRole,
        tone,
        mapping.alignmentPoints,
        evidence.topAchievements,
        requirements.keywords,
        length
      ),
      700
    )
    ctx.totalTokens += valueResult.tokens
    const value = valueResult.content.trim()
    
    completeStep(ctx, { words: value.split(/\s+/).length })

    // Generate Fit Paragraph
    startStep(ctx, 'Generate Fit Paragraph')
    
    const fitResult = await callClaude(
      SYSTEM_PROMPTS.paragraphWriter,
      buildFitPrompt(
        input.targetRole,
        input.companyName,
        tone,
        input.extraInfo, // May contain company info
        evidence.domainExperience,
        length
      ),
      500
    )
    ctx.totalTokens += fitResult.tokens
    const fit = fitResult.content.trim()
    
    completeStep(ctx, { words: fit.split(/\s+/).length })

    // Generate Closing Paragraph
    startStep(ctx, 'Generate Closing Paragraph')
    
    const closingResult = await callClaude(
      SYSTEM_PROMPTS.paragraphWriter,
      buildClosingPrompt(input.targetRole, tone, length),
      300
    )
    ctx.totalTokens += closingResult.tokens
    const closing = closingResult.content.trim()
    
    completeStep(ctx, { words: closing.split(/\s+/).length })

    // ============================================
    // STEP 6: Assembly
    // ============================================
    startStep(ctx, 'Assembly')
    
    // Build header
    const profile = input.profile as Record<string, unknown>
    const header = buildHeader(
      String(profile.full_name || ''),
      String(profile.email || ''),
      String(profile.phone || ''),
      String(profile.location || ''),
      input.companyName,
      input.targetRole
    )
    
    const signature = `Sincerely,\n\n${profile.full_name || 'Your Name'}`
    
    const sections: CoverLetterSections = {
      header,
      opening,
      value,
      fit,
      closing,
      signature,
    }
    
    // Assemble full letter
    const letterText = [
      opening,
      '',
      value,
      '',
      fit,
      '',
      closing,
      '',
      signature,
    ].join('\n')
    
    completeStep(ctx)

    // ============================================
    // STEP 7: Polish
    // ============================================
    startStep(ctx, 'Polish')
    
    const constraints = LENGTH_CONSTRAINTS[length]
    const polishResult = await callClaude(
      SYSTEM_PROMPTS.finalPolish,
      buildPolishPrompt(letterText, tone, { min: constraints.min, max: constraints.max }),
      1000
    )
    ctx.totalTokens += polishResult.tokens
    const polishedText = polishResult.content.trim()
    
    completeStep(ctx)

    // ============================================
    // STEP 8: Generate Insights
    // ============================================
    startStep(ctx, 'Generate Insights')
    
    let insights: CoverLetterInsights = {
      matchedKeywords: [],
      missingKeywords: requirements.keywords.slice(0, 5),
      strongestEvidence: evidence.topAchievements.slice(0, 3),
      warnings: [],
      specificityScore: 70,
      toneMatch: tone,
    }

    if (requirements.keywords.length > 0) {
      const insightsResult = await callClaude(
        SYSTEM_PROMPTS.roleAnalysis,
        buildInsightsPrompt(polishedText, requirements, evidence),
        800
      )
      ctx.totalTokens += insightsResult.tokens
      
      const parsedInsights = extractJSON(insightsResult.content)
      if (parsedInsights && typeof parsedInsights === 'object') {
        insights = parsedInsights as CoverLetterInsights
      }
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 9: Quality Validation
    // ============================================
    startStep(ctx, 'Quality Validation')
    
    const letterDoc: CoverLetterDocument = {
      targetRole: input.targetRole,
      companyName: input.companyName,
      tone,
      length,
      letterText: polishedText,
      sections,
      insights,
    }
    
    const qualityCheck = validateCoverLetter(letterDoc)
    
    completeStep(ctx, { score: qualityCheck.score, issues: qualityCheck.issues.length })

    // Generate missing metrics questions
    const missingMetricsQuestions = generateMissingMetricsQuestions(evidence)

    console.log(`✅ Cover Letter complete! Quality: ${qualityCheck.score}`)

    return {
      success: true,
      letter: letterDoc,
      qualityScore: qualityCheck.score,
      qualityCheck,
      warnings: ctx.warnings,
      pipeline: ctx,
      missingMetricsQuestions,
    }

  } catch (error) {
    failStep(ctx, error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      qualityScore: 0,
      warnings: ctx.warnings,
      pipeline: ctx,
      error: error instanceof Error ? error.message : 'Pipeline failed',
    }
  }
}

// ============================================
// TAILOR COVER LETTER PIPELINE
// ============================================

export interface TailorCoverLetterResult extends BuildCoverLetterResult {
  tailorAnalysis?: Record<string, unknown>
}

export async function tailorCoverLetter(input: TailorCoverLetterInput): Promise<TailorCoverLetterResult> {
  const ctx = createContext()
  
  const tone: CoverLetterTone = input.tone || 'professional'
  const length: CoverLetterLength = input.length || 'standard'
  
  try {
    console.log('📝 Starting Cover Letter Builder pipeline (TAILOR)...')

    // ============================================
    // STEP 1: Input Normalization
    // ============================================
    startStep(ctx, 'Input Normalization')
    
    if (!input.oldCoverLetter || input.oldCoverLetter.length < 100) {
      throw new Error('Old cover letter is required for tailoring')
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 2: Role Requirements Extraction
    // ============================================
    startStep(ctx, 'Role Requirements Extraction')
    
    let requirements: RoleRequirements = {
      responsibilities: [],
      mustHaveSkills: [],
      niceToHaveSkills: [],
      seniorityLevel: 'mid',
      keywords: [],
    }

    if (input.jobDescription && input.jobDescription.length > 100) {
      const roleResult = await callDeepSeek(
        SYSTEM_PROMPTS.roleAnalysis,
        buildRoleAnalysisPrompt(input.jobDescription),
        1500
      )
      ctx.totalTokens += roleResult.tokens
      
      const parsed = extractJSON(roleResult.content)
      if (parsed && typeof parsed === 'object') {
        requirements = parsed as RoleRequirements
      }
    }
    
    completeStep(ctx, { keywords: requirements.keywords.length })

    // ============================================
    // STEP 3: Candidate Evidence Extraction
    // ============================================
    startStep(ctx, 'Candidate Evidence Extraction')
    
    const evidenceResult = await callDeepSeek(
      SYSTEM_PROMPTS.evidenceExtraction,
      buildEvidenceExtractionPrompt(input.profile, input.uploadedCVText, input.extraInfo),
      2000
    )
    ctx.totalTokens += evidenceResult.tokens
    
    let evidence: CandidateEvidence = {
      topAchievements: [],
      relevantProjects: [],
      toolsAndStack: [],
      domainExperience: [],
      leadershipSignals: [],
      yearsOfExperience: 0,
    }
    
    const parsedEvidence = extractJSON(evidenceResult.content)
    if (parsedEvidence && typeof parsedEvidence === 'object') {
      evidence = parsedEvidence as CandidateEvidence
    }
    
    completeStep(ctx, { achievements: evidence.topAchievements.length })

    // ============================================
    // STEP 4: Tailor Analysis
    // ============================================
    startStep(ctx, 'Tailor Analysis')
    
    const tailorAnalysisResult = await callDeepSeek(
      SYSTEM_PROMPTS.roleAnalysis,
      buildTailorAnalysisPrompt(input.oldCoverLetter, input.jobDescription || '', input.whatChanged),
      1500
    )
    ctx.totalTokens += tailorAnalysisResult.tokens
    
    let tailorAnalysis: Record<string, unknown> = {}
    const parsedAnalysis = extractJSON(tailorAnalysisResult.content)
    if (parsedAnalysis && typeof parsedAnalysis === 'object') {
      tailorAnalysis = parsedAnalysis as Record<string, unknown>
    }
    
    completeStep(ctx, { updates: Object.keys(tailorAnalysis).length })

    // ============================================
    // STEP 5: Rewrite Letter
    // ============================================
    startStep(ctx, 'Rewrite Letter')
    
    const rewriteResult = await callClaude(
      SYSTEM_PROMPTS.paragraphWriter,
      buildTailorRewritePrompt(
        input.oldCoverLetter,
        requirements,
        evidence,
        tailorAnalysis,
        tone,
        length
      ),
      1500
    )
    ctx.totalTokens += rewriteResult.tokens
    const rewrittenText = rewriteResult.content.trim()
    
    completeStep(ctx, { words: rewrittenText.split(/\s+/).length })

    // ============================================
    // STEP 6: Polish
    // ============================================
    startStep(ctx, 'Polish')
    
    const constraints = LENGTH_CONSTRAINTS[length]
    const polishResult = await callClaude(
      SYSTEM_PROMPTS.finalPolish,
      buildPolishPrompt(rewrittenText, tone, { min: constraints.min, max: constraints.max }),
      1000
    )
    ctx.totalTokens += polishResult.tokens
    const polishedText = polishResult.content.trim()
    
    completeStep(ctx)

    // ============================================
    // STEP 7: Generate Insights
    // ============================================
    startStep(ctx, 'Generate Insights')
    
    let insights: CoverLetterInsights = {
      matchedKeywords: [],
      missingKeywords: requirements.keywords.slice(0, 5),
      strongestEvidence: evidence.topAchievements.slice(0, 3),
      warnings: [],
      specificityScore: 70,
      toneMatch: tone,
    }

    const insightsResult = await callClaude(
      SYSTEM_PROMPTS.roleAnalysis,
      buildInsightsPrompt(polishedText, requirements, evidence),
      800
    )
    ctx.totalTokens += insightsResult.tokens
    
    const parsedInsights = extractJSON(insightsResult.content)
    if (parsedInsights && typeof parsedInsights === 'object') {
      insights = parsedInsights as CoverLetterInsights
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 8: Quality Validation
    // ============================================
    startStep(ctx, 'Quality Validation')
    
    // Parse sections from polished text
    const sections = parseSectionsFromText(polishedText, input.profile)
    
    const letterDoc: CoverLetterDocument = {
      targetRole: input.targetRole,
      companyName: input.companyName,
      tone,
      length,
      letterText: polishedText,
      sections,
      insights,
    }
    
    const qualityCheck = validateCoverLetter(letterDoc)
    
    completeStep(ctx, { score: qualityCheck.score })

    const missingMetricsQuestions = generateMissingMetricsQuestions(evidence)

    console.log(`✅ Cover Letter tailored! Quality: ${qualityCheck.score}`)

    return {
      success: true,
      letter: letterDoc,
      qualityScore: qualityCheck.score,
      qualityCheck,
      warnings: ctx.warnings,
      pipeline: ctx,
      tailorAnalysis,
      missingMetricsQuestions,
    }

  } catch (error) {
    failStep(ctx, error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      qualityScore: 0,
      warnings: ctx.warnings,
      pipeline: ctx,
      error: error instanceof Error ? error.message : 'Pipeline failed',
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildHeader(
  name: string,
  email: string,
  phone: string,
  location: string,
  companyName?: string,
  targetRole?: string
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const lines = [
    name,
    [email, phone, location].filter(Boolean).join(' • '),
    '',
    date,
  ]
  
  if (companyName) {
    lines.push('', companyName)
    if (targetRole) {
      lines.push(`Re: ${targetRole} Position`)
    }
  }
  
  return lines.join('\n')
}

function parseSectionsFromText(
  text: string,
  profile: Record<string, unknown>
): CoverLetterSections {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  
  // Simple heuristic: first paragraph is opening, last is closing
  // Middle paragraphs are value and fit
  const name = String(profile.full_name || 'Your Name')
  
  return {
    header: '', // Header is generated separately
    opening: paragraphs[0] || '',
    value: paragraphs[1] || '',
    fit: paragraphs[2] || '',
    closing: paragraphs[3] || paragraphs[paragraphs.length - 1] || '',
    signature: `Sincerely,\n\n${name}`,
  }
}

// ============================================
// EXPORTS
// ============================================

export type {
  BuildCoverLetterInput,
  TailorCoverLetterInput,
  CoverLetterDocument,
  CoverLetterSections,
  CoverLetterInsights,
  CoverLetterTone,
  CoverLetterLength,
}