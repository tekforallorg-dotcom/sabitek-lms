/**
 * CV Builder v2 - Pipeline Orchestrator
 * 
 * World-class CV generation pipeline:
 * 1. Input normalization (parse documents, extract to JSON)
 * 2. Evidence mapping (match JD to resume)
 * 3. Selective generation (only rewrite what's needed)
 * 4. Quality validation (enforce standards)
 * 5. Fix-pass loop (auto-repair failures)
 */

import {
  ResumeSchema,
  JobSchema,
  EvidenceMap,
  CVData,
  CVDataZ,
  CVFailure,
  validateCVWorldClass,
  calculateQualityScore,
  passesQualityGate,
  safeParseCVData,
} from './schemas'

import { 
  injectKeywordsIntoSkills, 
  calculateATSScore, 
  recalculateCoverage 
} from './ats-optimizer'

import { getKeywordsForRole } from './role-keywords'

import {
  extractResumeFromText,
  profileToResumeSchema,
  mergeResumeData,
} from './extract/resumeToJson'

import {
  extractJDFromText,
  quickExtractKeywords,
} from './extract/jdToJson'

import {
  buildEvidenceMap,
  getPrioritizedKeywords,
  getBulletsToRewrite,
  calculateATSScoreFromEvidence,
  getTailoringSuggestions,
} from './match/evidenceMap'

import {
  SYSTEM_PROMPTS,
  buildSummaryPrompt,
  buildSkillsPrompt,
  buildExperiencePrompt,
  buildFixPassPrompt,
  extractJSON,
  cleanAIResponse,
} from './prompts'

import {
  generateSummary,
  generateSkills,
  enhanceExperience,
  fixCVIssues,
  generateMissingMetricsQuestions,
} from './ai-hybrid'

import {
  analyzeRoleDiff,
  type RoleDiff,
} from './tone'

import {
  buildEvidenceSpans,
  populateEvidenceIds,
} from './evidence'

// ============================================
// PIPELINE CONFIGURATION
// ============================================

const PIPELINE_CONFIG = {
  ai: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    maxRetries: 2,
    retryDelayMs: 1000,
  },
  quality: {
    minScore: 70,
    maxFixPasses: 2,
  },
  limits: {
    maxSummaryWords: 120,
    minSummaryWords: 60,
    maxSkills: 35,
    minSkills: 15,
    minBulletsRecent: 5,
    minBulletsOlder: 3,
  },
}

// ============================================
// PIPELINE STEP LOGGING
// ============================================

export interface PipelineStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  error?: string
  data?: unknown
}

export interface PipelineContext {
  steps: PipelineStep[]
  currentStep: number
  totalTokens: number
  warnings: string[]
}

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
  console.log(`▶️ [Step ${ctx.currentStep + 1}] ${name}`)
}

function completeStep(ctx: PipelineContext, data?: unknown): void {
  const step = ctx.steps[ctx.currentStep]
  step.status = 'completed'
  step.endTime = Date.now()
  step.data = data
  const duration = step.endTime - (step.startTime || 0)
  console.log(`✅ [Step ${ctx.currentStep + 1}] ${step.name} completed (${duration}ms)`)
}

function failStep(ctx: PipelineContext, error: string): void {
  const step = ctx.steps[ctx.currentStep]
  step.status = 'failed'
  step.endTime = Date.now()
  step.error = error
  console.error(`❌ [Step ${ctx.currentStep + 1}] ${step.name} failed: ${error}`)
}

// ============================================
// AI CALL HELPER
// ============================================

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature: number = 0.7
): Promise<{ content: string; tokens: number }> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  for (let attempt = 1; attempt <= PIPELINE_CONFIG.ai.maxRetries; attempt++) {
    try {
      const response = await fetch(PIPELINE_CONFIG.ai.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: PIPELINE_CONFIG.ai.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return {
        content: data.choices?.[0]?.message?.content || '',
        tokens: data.usage?.total_tokens || 0,
      }

    } catch (error) {
      if (attempt < PIPELINE_CONFIG.ai.maxRetries) {
        await new Promise(r => setTimeout(r, PIPELINE_CONFIG.ai.retryDelayMs * attempt))
      } else {
        throw error
      }
    }
  }

  throw new Error('AI call failed after retries')
}

// ============================================
// MAIN PIPELINE: BUILD CV
// ============================================

export interface BuildCVInput {
  profile: Record<string, unknown>
  uploadedCVText?: string
  targetRole: string
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  region?: string
  format?: string
  extraInstructions?: string
}

export interface BuildCVResult {
  success: boolean
  cv?: CVData
  resumeJson?: ResumeSchema
  qualityScore: number
  atsScore: number
  failures: CVFailure[]
  warnings: string[]
  pipeline: PipelineContext
  error?: string
  // New fields for v2
  aiProvider?: string
  roleDiff?: RoleDiff
  missingMetricsQuestions?: string[]
}

/**
 * Build CV from profile (no JD tailoring)
 */
export async function buildCV(input: BuildCVInput): Promise<BuildCVResult> {
  const ctx = createContext()
  
  try {
    // ============================================
    // STEP 1: Input Normalization
    // ============================================
    startStep(ctx, 'Input Normalization')
    
    // Convert profile to ResumeSchema
    const profileResume = profileToResumeSchema(input.profile)
    
    // If uploaded CV, extract and merge
    let finalResume: ResumeSchema = profileResume
    
    if (input.uploadedCVText && input.uploadedCVText.length > 100) {
      const extractResult = await extractResumeFromText(input.uploadedCVText)
      
      if (extractResult.success && extractResult.resume) {
        finalResume = mergeResumeData(profileResume, extractResult.resume)
        ctx.warnings.push(...extractResult.warnings)
      } else {
        ctx.warnings.push('Could not extract uploaded CV - using profile data only')
      }
    }
    
    completeStep(ctx, { experienceCount: finalResume.experience.length })

    // ============================================
    // STEP 2: Role Analysis (create synthetic JD for keywords)
    // ============================================
    startStep(ctx, 'Role Analysis')
    
    // Create a synthetic job schema for the target role
    const syntheticJD: JobSchema = {
      role_title: input.targetRole,
      level: input.level,
      company: '',
      responsibilities: [],
      must_have: [],
      nice_to_have: [],
      keywords_top_25: await generateRoleKeywords(input.targetRole, input.level),
      tools_stack: [],
      soft_skills: [],
      industry: '',
    }
    
    completeStep(ctx, { keywords: syntheticJD.keywords_top_25.length })

    // ============================================
    // STEP 3: Evidence Mapping
    // ============================================
    startStep(ctx, 'Evidence Mapping')
    
    const evidenceMap = buildEvidenceMap(finalResume, syntheticJD)
    
    completeStep(ctx, { 
      coverage: evidenceMap.coverage_percentage,
      covered: evidenceMap.covered_keywords.length,
      missing: evidenceMap.missing_keywords.length,
    })

    // ============================================
    // STEP 4: Generate Summary (Claude Hybrid)
    // ============================================
    startStep(ctx, 'Generate Summary')
    
    const summaryGenResult = await generateSummary(
      finalResume,
      input.targetRole,
      input.level,
      evidenceMap.covered_keywords.slice(0, 10),
      undefined // No roleDiff for build mode
    )
    ctx.totalTokens += summaryGenResult.tokens
    
    const summary = summaryGenResult.summary
    const aiProvider = summaryGenResult.provider
    
    completeStep(ctx, { words: summary.split(/\s+/).length, provider: aiProvider })

    // ============================================
    // STEP 5: Optimize Skills (Claude Hybrid)
    // ============================================
    startStep(ctx, 'Optimize Skills')
    
    const skillsGenResult = await generateSkills(
      finalResume,
      input.targetRole,
      evidenceMap.covered_keywords,
      undefined, // No roleDiff for build mode
      input.level
    )
    ctx.totalTokens += skillsGenResult.tokens
    
    // Inject missing keywords into skills to ensure 70%+ ATS coverage
    const baseSkills = skillsGenResult.skills.length > 0 
      ? skillsGenResult.skills 
      : generateFallbackSkills(finalResume)
    
    const skills = injectKeywordsIntoSkills(
      baseSkills,
      syntheticJD.keywords_top_25,
      70 // Target 70% minimum coverage
    )
    
    completeStep(ctx, { categories: skills.length, provider: skillsGenResult.provider })

    // ============================================
    // STEP 6: Enhance Experience (Claude Hybrid)
    // ============================================
    startStep(ctx, 'Enhance Experience')
    
    const expGenResult = await enhanceExperience(
      finalResume.experience,
      input.targetRole,
      evidenceMap.covered_keywords,
      undefined, // No roleDiff for build mode
      { best_experiences: evidenceMap.best_experiences }
    )
    ctx.totalTokens += expGenResult.tokens
    
    const experience = expGenResult.experience.length > 0
      ? expGenResult.experience
      : formatFallbackExperience(finalResume.experience)
    
    completeStep(ctx, { roles: experience.length, provider: expGenResult.provider })

    // Generate missing metrics questions
    const missingMetricsQuestions = generateMissingMetricsQuestions(finalResume.experience)

    // ============================================
    // STEP 7: Format Education & Certifications
    // ============================================
    startStep(ctx, 'Format Education')
    
    const education = finalResume.education.map(edu => ({
      institution: expandInstitutionName(edu.school || ''),
      degree: edu.field ? `${edu.degree} in ${edu.field}` : edu.degree,
      year: edu.end || '',
    }))
    
    const certifications = finalResume.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      year: cert.date,
    }))
    
    const projects = finalResume.projects.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.tools,
    }))
    
    completeStep(ctx, { 
      education: education.length,
      certifications: certifications.length,
      projects: projects.length,
    })

    // ============================================
    // STEP 8: Assemble Tailored CV with Evidence
    // ============================================
    startStep(ctx, 'Assemble Tailored CV with Evidence')
    
// // Recalculate coverage with enhanced skills
    const finalCoverage = recalculateCoverage(
      skills,
      summary,
      experience,
      syntheticJD.keywords_top_25  // <-- Use syntheticJD for BUILD
    )
    
    // Calculate final ATS score (ensures 70%+ minimum)
    const atsScore = calculateATSScore(
      finalCoverage.covered,
      syntheticJD.keywords_top_25,  // <-- Use syntheticJD for BUILD
      true,
      true
    )
    // Build evidence spans from resume
    const evidenceSpans = buildEvidenceSpans(finalResume)
    
    // Populate evidence IDs for generated bullets
    const { experience: experienceWithEvidence, evidenceSpans: finalEvidenceSpans } = 
      populateEvidenceIds(experience, finalResume, evidenceSpans)
    
    const cvData: CVData = {
      header: {
        name: finalResume.basics.name,
        headline: input.targetRole,
        contact_line: [
          finalResume.basics.location,
          finalResume.basics.email,
          finalResume.basics.phone,
        ].filter(Boolean).join(' • '),
        email: finalResume.basics.email,
        phone: finalResume.basics.phone,
        location: finalResume.basics.location,
        links: finalResume.basics.links,
      },
      summary,
      skills,
      experience: experienceWithEvidence,
      projects,
      certifications,
      education,
      evidence: finalEvidenceSpans,
      ats: {
        keyword_coverage_pct: finalCoverage.percentage,
        missing_keywords: finalCoverage.missing.slice(0, 10),
        matched_keywords: finalCoverage.covered,
        score: atsScore,
      },
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 9: Quality Validation
    // ============================================
    startStep(ctx, 'Quality Validation')
    
    const failures = validateCVWorldClass(cvData)
    const qualityScore = calculateQualityScore(failures)
    
    completeStep(ctx, { 
      qualityScore,
      errors: failures.filter(f => f.severity === 'error').length,
      warnings: failures.filter(f => f.severity === 'warning').length,
    })

    // ============================================
    // STEP 10: Fix-Pass Loop (if needed)
    // ============================================
    let finalCV = cvData
    
    if (!passesQualityGate(failures) && failures.length > 0) {
      startStep(ctx, 'Fix-Pass Loop')
      
      const fixedCV = await runFixPass(finalCV, failures, finalResume, ctx)
      if (fixedCV) {
        finalCV = fixedCV
      }
      
      completeStep(ctx)
    }

    // ============================================
    // RETURN RESULT
    // ============================================
    const finalFailures = validateCVWorldClass(finalCV)
    const finalScore = calculateQualityScore(finalFailures)

    return {
      success: true,
      cv: finalCV,
      resumeJson: finalResume,
      qualityScore: finalScore,
      atsScore,
      failures: finalFailures,
      warnings: ctx.warnings,
      pipeline: ctx,
      aiProvider,
      missingMetricsQuestions,
    }

  } catch (error) {
    failStep(ctx, error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      qualityScore: 0,
      atsScore: 0,
      failures: [],
      warnings: ctx.warnings,
      pipeline: ctx,
      error: error instanceof Error ? error.message : 'Pipeline failed',
    }
  }
}

// ============================================
// MAIN PIPELINE: TAILOR CV
// ============================================

export interface TailorCVInput extends BuildCVInput {
  jobDescription: string
}

export interface TailorCVResult extends BuildCVResult {
  jobJson?: JobSchema
  evidenceMap?: EvidenceMap
  roleDiff?: RoleDiff
}

/**
 * Tailor CV to specific job description
 */
export async function tailorCV(input: TailorCVInput): Promise<TailorCVResult> {
  const ctx = createContext()
  
  try {
    // ============================================
    // STEP 1: Input Normalization
    // ============================================
    startStep(ctx, 'Input Normalization')
    
    const profileResume = profileToResumeSchema(input.profile)
    let finalResume: ResumeSchema = profileResume
    
    if (input.uploadedCVText && input.uploadedCVText.length > 100) {
      const extractResult = await extractResumeFromText(input.uploadedCVText)
      if (extractResult.success && extractResult.resume) {
        finalResume = mergeResumeData(profileResume, extractResult.resume)
        ctx.warnings.push(...extractResult.warnings)
      }
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 2: Extract JD to JSON
    // ============================================
    startStep(ctx, 'JD Extraction')
    
    const jdResult = await extractJDFromText(input.jobDescription)
    
    if (!jdResult.success || !jdResult.job) {
      // Use quick extraction as fallback
      const quickKw = quickExtractKeywords(input.jobDescription)
      jdResult.job = {
        role_title: input.targetRole,
        level: input.level,
        company: '',
        responsibilities: [],
        must_have: [],
        nice_to_have: [],
        keywords_top_25: [...quickKw.keywords, ...quickKw.tools],
        tools_stack: quickKw.tools,
        soft_skills: quickKw.softSkills,
        industry: '',
      }
    }
    
    ctx.warnings.push(...jdResult.warnings)
    completeStep(ctx, { keywords: jdResult.job.keywords_top_25.length })

    // ============================================
    // STEP 3: Evidence Mapping
    // ============================================
    startStep(ctx, 'Evidence Mapping')
    
    const evidenceMap = buildEvidenceMap(finalResume, jdResult.job)
    const prioritized = getPrioritizedKeywords(evidenceMap)
    const bulletsToRewrite = getBulletsToRewrite(finalResume, evidenceMap, 4)
    
    completeStep(ctx, {
      coverage: evidenceMap.coverage_percentage,
      strongMatches: prioritized.strongMatch.length,
      weakMatches: prioritized.weakMatch.length,
      noMatches: prioritized.noMatch.length,
      bulletsToRewrite: bulletsToRewrite.length,
    })

    // ============================================
    // STEP 3.5: Analyze Role Compatibility (NEW)
    // ============================================
    startStep(ctx, 'Role Compatibility Analysis')
    
    const roleDiff = analyzeRoleDiff(finalResume, jdResult.job)
    
    if (roleDiff.warnings.length > 0) {
      ctx.warnings.push(...roleDiff.warnings)
    }
    
    completeStep(ctx, {
      compatibility: Math.round(roleDiff.compatibilityScore * 100),
      toneShift: roleDiff.toneShift,
      keywordGaps: roleDiff.keywordGaps.length,
    })

    // ============================================
    // STEP 4: Generate Tailored Summary (Claude Hybrid)
    // ============================================
    startStep(ctx, 'Generate Tailored Summary')
    
    const summaryGenResult = await generateSummary(
      finalResume,
      jdResult.job.role_title || input.targetRole,
      input.level,
      [...prioritized.strongMatch, ...prioritized.weakMatch].slice(0, 12),
      roleDiff
    )
    ctx.totalTokens += summaryGenResult.tokens
    
    const summary = summaryGenResult.summary
    const aiProvider = summaryGenResult.provider
    
    completeStep(ctx, { provider: aiProvider })

    // ============================================
// STEP 5: Optimize Skills for JD (Claude Hybrid) - ENHANCED
// ============================================
startStep(ctx, 'Optimize Skills for JD')

// Get role-based keywords (same as BUILD CV) to supplement JD keywords
const roleKeywords = getKeywordsForRole(input.targetRole, input.level)

// Combine JD keywords with role keywords for richer skill generation
const combinedKeywords = [
  ...new Set([
    ...(jdResult.job.keywords_top_25 || []),
    ...roleKeywords.slice(0, 25)
  ])
]

const skillsGenResult = await generateSkills(
  finalResume,
  jdResult.job.role_title || input.targetRole,
  combinedKeywords,  // Use combined keywords
  roleDiff,
  input.level
)
ctx.totalTokens += skillsGenResult.tokens

// Start with fallback skills as base (ensures comprehensive coverage)
const fallbackSkills = generateFallbackSkills(finalResume)

// Merge AI-generated skills with fallback
const baseSkills = mergeSkillCategories(
  skillsGenResult.skills.length > 0 ? skillsGenResult.skills : [],
  fallbackSkills
)

// Inject JD + role keywords to ensure 70%+ ATS coverage
const skills = injectKeywordsIntoSkills(
  baseSkills,
  combinedKeywords,
  70 // Target 70% minimum coverage
)

completeStep(ctx, { 
  categories: skills.length, 
  totalSkills: skills.reduce((sum, cat) => sum + cat.items.length, 0),
  provider: skillsGenResult.provider 
})

    // ============================================
    // STEP 6: Tailor Experience (Claude Hybrid)
    // ============================================
    startStep(ctx, 'Tailor Experience')
    
    const expGenResult = await enhanceExperience(
      finalResume.experience,
      jdResult.job.role_title || input.targetRole,
      jdResult.job.keywords_top_25,
      roleDiff,
      { best_experiences: evidenceMap.best_experiences }
    )
    ctx.totalTokens += expGenResult.tokens
    
    const experience = expGenResult.experience.length > 0
      ? expGenResult.experience
      : formatFallbackExperience(finalResume.experience)
    
    completeStep(ctx, { roles: experience.length, provider: expGenResult.provider })

    // Generate missing metrics questions
    const missingMetricsQuestions = generateMissingMetricsQuestions(finalResume.experience)


    // ============================================
    // STEP 7: Format Supporting Sections
    // ============================================
    startStep(ctx, 'Format Supporting Sections')
    
    const education = finalResume.education.map(edu => ({
      institution: expandInstitutionName(edu.school || ''),
      degree: edu.field ? `${edu.degree} in ${edu.field}` : edu.degree,
      year: edu.end || '',
    }))
    
    const certifications = finalResume.certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      year: cert.date,
    }))
    
    const projects = finalResume.projects.map(proj => ({
      name: proj.name,
      description: proj.description,
      technologies: proj.tools,
    }))
    
    completeStep(ctx)

    // ============================================
    // STEP 8: Assemble Tailored CV
    // ============================================
   startStep(ctx, 'Assemble Tailored CV')

// Ensure we have keywords - fallback to role keywords if JD parsing failed
const targetKeywords = (jdResult.job.keywords_top_25 && jdResult.job.keywords_top_25.length > 0)
  ? jdResult.job.keywords_top_25
  : getKeywordsForRole(input.targetRole, input.level)

// Recalculate coverage with enhanced skills
const finalCoverage = recalculateCoverage(
  skills,
  summary,
  experience,
  targetKeywords
)


    // Calculate final ATS score (ensures 70%+ minimum)
    const atsScore = calculateATSScore(
      finalCoverage.covered,
      jdResult.job.keywords_top_25,
      true,
      true
    )
    
    const cvData: CVData = {
      header: {
        name: finalResume.basics.name,
        headline: jdResult.job.role_title || input.targetRole,
        contact_line: [
          finalResume.basics.location,
          finalResume.basics.email,
          finalResume.basics.phone,
        ].filter(Boolean).join(' • '),
        email: finalResume.basics.email,
        phone: finalResume.basics.phone,
        location: finalResume.basics.location,
        links: finalResume.basics.links,
      },
      summary,
      skills,
      experience,
      projects,
      certifications,
      education,
      evidence: [],  // Will be populated by evidence mapping
      ats: {
        keyword_coverage_pct: finalCoverage.percentage,
        missing_keywords: finalCoverage.missing.slice(0, 10),
        matched_keywords: finalCoverage.covered,
        score: atsScore,
      },
    }
    
    completeStep(ctx)

    // ============================================
    // STEP 9: Quality Validation
    // ============================================
    startStep(ctx, 'Quality Validation')
    
    const failures = validateCVWorldClass(cvData)
    const qualityScore = calculateQualityScore(failures)
    
    completeStep(ctx, { qualityScore, failures: failures.length })

    // ============================================
    // STEP 10: Fix-Pass if needed
    // ============================================
    let finalCV = cvData
    
    if (!passesQualityGate(failures)) {
      startStep(ctx, 'Fix-Pass Loop')
      const fixedCV = await runFixPass(finalCV, failures, finalResume, ctx, jdResult.job)
      if (fixedCV) finalCV = fixedCV
      completeStep(ctx)
    }

    // ============================================
    // RETURN RESULT
    // ============================================
    const finalFailures = validateCVWorldClass(finalCV)
    const finalScore = calculateQualityScore(finalFailures)

    return {
      success: true,
      cv: finalCV,
      resumeJson: finalResume,
      jobJson: jdResult.job,
      evidenceMap,
      qualityScore: finalScore,
      atsScore,
      failures: finalFailures,
      warnings: ctx.warnings,
      pipeline: ctx,
      aiProvider,
      roleDiff,
      missingMetricsQuestions,
    }

  } catch (error) {
    failStep(ctx, error instanceof Error ? error.message : 'Unknown error')
    
    return {
      success: false,
      qualityScore: 0,
      atsScore: 0,
      failures: [],
      warnings: ctx.warnings,
      pipeline: ctx,
      error: error instanceof Error ? error.message : 'Pipeline failed',
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function generateRoleKeywords(role: string, level: string): Promise<string[]> {
  // Use comprehensive role keyword database
  return getKeywordsForRole(role, level)
}

function formatExperience(exp: Record<string, unknown>): CVData['experience'][0] {
  return {
    title: String(exp.title || ''),
    company: String(exp.company || ''),
    location: String(exp.location || ''),
    duration: String(exp.duration || ''),
    bullets: (Array.isArray(exp.bullets) ? exp.bullets : []).map((b: unknown) => ({
      text: typeof b === 'string' ? b : String((b as Record<string, unknown>).text || ''),
      isRewritten: typeof b === 'object' && (b as Record<string, unknown>).isRewritten === true,
      originalId: typeof b === 'object' ? String((b as Record<string, unknown>).originalId || '') : undefined,
      evidenceIds: typeof b === 'object' && Array.isArray((b as Record<string, unknown>).evidenceIds) 
        ? (b as Record<string, unknown>).evidenceIds as string[]
        : [],
    })),
  }
}

function formatFallbackExperience(experience: ResumeSchema['experience']): CVData['experience'] {
  return experience.map(exp => ({
    title: exp.title,
    company: exp.company,
    location: exp.location,
    duration: `${exp.start} - ${exp.isCurrent ? 'Present' : exp.end}`,
    bullets: exp.bullets.map(b => ({
      text: b.text,
      isRewritten: false,
      evidenceIds: [],
    })),
  }))
}

function generateFallbackSkills(resume: ResumeSchema): CVData['skills'] {
  const allSkills = [
    ...resume.skills.core,
    ...resume.skills.technical,
    ...resume.skills.tools,
  ]

  return [
    { label: 'Core Skills', items: allSkills.slice(0, 10) },
    { label: 'Technical', items: resume.skills.technical.slice(0, 8) },
    { label: 'Tools', items: resume.skills.tools.slice(0, 8) },
  ].filter(g => g.items.length > 0)
}

async function runFixPass(
  cv: CVData,
  failures: CVFailure[],
  resume: ResumeSchema,
  ctx: PipelineContext,
  jd?: JobSchema
): Promise<CVData | null> {
  const errorFailures = failures.filter(f => f.severity === 'error')
  if (errorFailures.length === 0) return null

  try {
    const fixPrompt = buildFixPassPrompt(cv, errorFailures, resume, jd)
    
    const result = await callAI(
      SYSTEM_PROMPTS.fixPass,
      fixPrompt,
      3000,
      0.5
    )
    ctx.totalTokens += result.tokens

    const fixedJson = extractJSON(result.content)
    if (!fixedJson) return null

    const parseResult = safeParseCVData(fixedJson)
    if (!parseResult.success || !parseResult.data) return null

    return parseResult.data
  } catch {
    return null
  }
}

/**
 * Merge skill categories, avoiding duplicates
 */
function mergeSkillCategories(
  primary: Array<{ label: string; items: string[] }>,
  secondary: Array<{ label: string; items: string[] }>
): Array<{ label: string; items: string[] }> {
  const merged = new Map<string, Set<string>>()
  
  // Add primary skills
  for (const cat of primary) {
    const normalizedLabel = cat.label.toLowerCase()
    if (!merged.has(normalizedLabel)) {
      merged.set(normalizedLabel, new Set())
    }
    for (const item of cat.items) {
      merged.get(normalizedLabel)!.add(item)
    }
  }
  
  // Add secondary skills (fallback)
  for (const cat of secondary) {
    const normalizedLabel = cat.label.toLowerCase()
    if (!merged.has(normalizedLabel)) {
      merged.set(normalizedLabel, new Set())
    }
    for (const item of cat.items) {
      merged.get(normalizedLabel)!.add(item)
    }
  }
  
  // Convert back to array format
  const result: Array<{ label: string; items: string[] }> = []
  
  // Preferred order
  const labelOrder = ['core skills', 'technical', 'tools', 'soft skills', 'methodologies']
  
  for (const preferredLabel of labelOrder) {
    if (merged.has(preferredLabel)) {
      const items = Array.from(merged.get(preferredLabel)!)
      if (items.length > 0) {
        result.push({
          label: preferredLabel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          items
        })
      }
      merged.delete(preferredLabel)
    }
  }
  
  // Add remaining categories
  for (const [label, items] of merged) {
    const itemsArray = Array.from(items)
    if (itemsArray.length > 0) {
      result.push({
        label: label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        items: itemsArray
      })
    }
  }
  
  return result
}

// ============================================
// EXPORTS
// ============================================

export {
  buildEvidenceMap,
  getPrioritizedKeywords,
  getBulletsToRewrite,
  calculateATSScoreFromEvidence,
  getTailoringSuggestions,
  extractResumeFromText,
  extractJDFromText,
  validateCVWorldClass,
  calculateQualityScore,
  passesQualityGate,
}
/**
 * Expand common institution name abbreviations
 */
function expandInstitutionName(name: string): string {
  if (!name) return ''
  
  let expanded = name.trim()
  
  const expansions: [RegExp, string][] = [
    [/\bUni\b/gi, 'University'],
    [/\bUniv\b/gi, 'University'],
    [/\bInst\b/gi, 'Institute'],
    [/\bPoly\b/gi, 'Polytechnic'],
    [/\bTech\b/gi, 'Technology'],
    [/\bColl\b/gi, 'College'],
    [/\bSch\b/gi, 'School'],
    [/\bFed\b/gi, 'Federal'],
    [/\bNat\b/gi, 'National'],
    [/\bInt'?l\b/gi, 'International'],
  ]
  
  for (const [pattern, replacement] of expansions) {
    expanded = expanded.replace(pattern, replacement)
  }
  
  return expanded
}