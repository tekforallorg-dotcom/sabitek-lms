/**
 * Cover Letter Builder - AI Prompts
 * 
 * Section-by-section generation prompts for high-quality, 
 * evidence-grounded cover letters.
 */

import {
  CoverLetterTone,
  CoverLetterLength,
  RoleRequirements,
  CandidateEvidence,
  EvidenceMapping,
  TONE_DESCRIPTORS,
  LENGTH_CONSTRAINTS,
} from './schemas'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPTS = {
  roleAnalysis: `You are an expert job description analyzer. Extract structured information from job descriptions accurately.

RULES:
- Extract only what's explicitly stated or clearly implied
- Don't invent requirements not present in the JD
- Identify seniority signals from language and requirements
- Separate must-have from nice-to-have skills
- Extract keywords that would be important for ATS matching

Return JSON only, no markdown.`,

  evidenceExtraction: `You are an expert resume analyst. Extract candidate evidence from CV/profile data.

RULES:
- Focus on quantifiable achievements
- Identify leadership and collaboration signals
- Extract technical skills and tools
- Note domain expertise areas
- Calculate approximate years of experience
- Don't embellish or invent details

Return JSON only, no markdown.`,

  paragraphWriter: `You are an expert cover letter writer. Write natural, compelling paragraphs.

CORE PRINCIPLES:
1. EVIDENCE-GROUNDED: Every claim must be backed by provided evidence
2. SPECIFIC: Use concrete examples, numbers, and details
3. NATURAL: Vary sentence length, avoid repetitive patterns
4. HONEST: Never invent achievements, metrics, or company facts
5. APPROPRIATE TONE: Match the requested tone consistently

AVOID:
- Clichés: "excited to apply", "dynamic professional", "fast learner", "passionate about"
- Overclaiming: "expert", "world-class", "unmatched" (unless senior + proven)
- Generic filler: "I believe I would be a great fit" without specifics
- Robotic patterns: Starting every sentence the same way

Write in first person. Be concise but impactful.`,

  finalPolish: `You are an expert editor. Polish cover letters for clarity, flow, and impact.

TASKS:
1. Remove redundant phrases
2. Vary sentence structure
3. Ensure consistent tone throughout
4. Check for clichés and replace them
5. Verify claims match evidence provided
6. Tighten language while preserving meaning

Return the polished text only.`,
}

// ============================================
// ROLE ANALYSIS PROMPT
// ============================================

export function buildRoleAnalysisPrompt(jobDescription: string): string {
  return `Analyze this job description and extract structured information.

JOB DESCRIPTION:
${jobDescription}

Extract and return JSON:
{
  "responsibilities": ["list of key responsibilities"],
  "mustHaveSkills": ["required skills/qualifications"],
  "niceToHaveSkills": ["preferred/bonus qualifications"],
  "seniorityLevel": "entry|mid|senior|lead|executive",
  "industry": "industry if identifiable",
  "keywords": ["important keywords for ATS matching"]
}

Return ONLY valid JSON, no explanation.`
}

// ============================================
// EVIDENCE EXTRACTION PROMPT
// ============================================

export function buildEvidenceExtractionPrompt(
  profileData: Record<string, unknown>,
  cvText?: string,
  extraInfo?: string
): string {
  const profileStr = JSON.stringify(profileData, null, 2)
  
  return `Extract candidate evidence from this profile and CV data.

PROFILE DATA:
${profileStr}

${cvText ? `CV TEXT:\n${cvText}\n` : ''}
${extraInfo ? `ADDITIONAL INFO:\n${extraInfo}\n` : ''}

Extract and return JSON:
{
  "topAchievements": ["3-5 most impressive quantifiable achievements"],
  "relevantProjects": ["notable projects with brief descriptions"],
  "toolsAndStack": ["technical tools, software, frameworks used"],
  "domainExperience": ["industries/domains worked in"],
  "leadershipSignals": ["evidence of leadership, mentoring, team coordination"],
  "yearsOfExperience": <number>,
  "currentRole": "current or most recent job title",
  "education": "highest degree and institution"
}

Return ONLY valid JSON, no explanation.`
}

// ============================================
// EVIDENCE MAPPING PROMPT
// ============================================

export function buildEvidenceMappingPrompt(
  requirements: RoleRequirements,
  evidence: CandidateEvidence
): string {
  return `Map candidate evidence to job requirements.

JOB REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

CANDIDATE EVIDENCE:
${JSON.stringify(evidence, null, 2)}

Analyze alignment and return JSON:
{
  "alignmentPoints": ["top 3 strongest matches between requirements and evidence"],
  "keywordGaps": ["2-3 required skills candidate doesn't clearly have"],
  "repositioningStrategy": "how to frame transferable skills for gaps (if any)",
  "strengthScore": <0-100 alignment score>
}

Return ONLY valid JSON, no explanation.`
}

// ============================================
// SECTION GENERATION PROMPTS
// ============================================

export function buildOpeningPrompt(
  targetRole: string,
  companyName: string | undefined,
  tone: CoverLetterTone,
  topEvidence: string[],
  length: CoverLetterLength
): string {
  const toneDesc = TONE_DESCRIPTORS[tone]
  const wordTarget = length === 'short' ? '40-60' : length === 'standard' ? '50-70' : '60-90'
  
  return `Write the opening paragraph of a cover letter.

TARGET ROLE: ${targetRole}
COMPANY: ${companyName || '[Company not specified - keep generic but professional]'}
TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
AVOID: ${toneDesc.avoid.join(', ')}
WORD TARGET: ${wordTarget} words

TOP EVIDENCE TO REFERENCE (pick 1-2 most relevant):
${topEvidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}

REQUIREMENTS:
- Start with why you're applying (be specific, not generic)
- Mention the role and company naturally
- Include 1-2 relevant highlights from evidence
- Hook the reader immediately
- NO clichés like "I am excited to apply" or "I was thrilled to see"

Write the opening paragraph only. First person. No headers or labels.`
}

export function buildValuePrompt(
  targetRole: string,
  tone: CoverLetterTone,
  alignmentPoints: string[],
  achievements: string[],
  keywords: string[],
  length: CoverLetterLength
): string {
  const toneDesc = TONE_DESCRIPTORS[tone]
  const wordTarget = length === 'short' ? '80-100' : length === 'standard' ? '100-140' : '140-180'
  
  return `Write the value proposition paragraph of a cover letter.

TARGET ROLE: ${targetRole}
TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
WORD TARGET: ${wordTarget} words

ALIGNMENT POINTS (use these as structure):
${alignmentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

ACHIEVEMENTS TO INCLUDE (pick 2-3 most relevant):
${achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

KEYWORDS TO NATURALLY INCLUDE (if relevant):
${keywords.slice(0, 8).join(', ')}

REQUIREMENTS:
- Showcase 2-3 achievements aligned to role requirements
- Include metrics/numbers where available
- Use keywords naturally (don't stuff)
- Each achievement should connect to what the role needs
- Show impact, not just responsibilities

Write the value paragraph only. First person. No headers or labels.`
}

export function buildFitPrompt(
  targetRole: string,
  companyName: string | undefined,
  tone: CoverLetterTone,
  companyInfo: string | undefined,
  domainExperience: string[],
  length: CoverLetterLength
): string {
  const toneDesc = TONE_DESCRIPTORS[tone]
  const wordTarget = length === 'short' ? '50-70' : length === 'standard' ? '70-100' : '100-130'
  
  const companyContext = companyName 
    ? companyInfo 
      ? `Company: ${companyName}\nKnown info: ${companyInfo}`
      : `Company: ${companyName}\n(No specific company info provided - keep generic but don't make up facts)`
    : 'No company specified - write about general industry fit'
  
  return `Write the "why this company/why now" paragraph of a cover letter.

TARGET ROLE: ${targetRole}
${companyContext}
TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
WORD TARGET: ${wordTarget} words

CANDIDATE'S DOMAIN EXPERIENCE:
${domainExperience.join(', ') || 'General professional experience'}

REQUIREMENTS:
- Explain why this specific opportunity appeals (or general industry fit)
- Connect your experience to their context
- Show genuine interest without being sycophantic
- If company info is limited, focus on the role and industry
- NEVER invent company facts, products, or values not provided
- Keep it authentic - don't over-praise

Write the fit paragraph only. First person. No headers or labels.`
}

export function buildClosingPrompt(
  targetRole: string,
  tone: CoverLetterTone,
  length: CoverLetterLength
): string {
  const toneDesc = TONE_DESCRIPTORS[tone]
  const wordTarget = length === 'short' ? '30-50' : length === 'standard' ? '40-60' : '50-80'
  
  return `Write the closing paragraph of a cover letter.

TARGET ROLE: ${targetRole}
TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
WORD TARGET: ${wordTarget} words

REQUIREMENTS:
- Clear call to action (interview request)
- Express availability/flexibility
- Brief gratitude (not excessive)
- Confident but not presumptuous
- Match the tone established earlier
- End strong, not weakly

Write the closing paragraph only. First person. No headers or labels.`
}

// ============================================
// TAILOR MODE PROMPTS
// ============================================

export function buildTailorAnalysisPrompt(
  oldCoverLetter: string,
  newJobDescription: string,
  whatChanged?: string
): string {
  return `Analyze this existing cover letter against a new job description.

EXISTING COVER LETTER:
${oldCoverLetter}

NEW JOB DESCRIPTION:
${newJobDescription}

${whatChanged ? `WHAT CHANGED FOR THE CANDIDATE:\n${whatChanged}\n` : ''}

Analyze and return JSON:
{
  "keepSections": ["parts of the letter that still work well"],
  "updateSections": ["parts that need updating for the new role"],
  "addElements": ["new achievements/skills to highlight based on JD"],
  "removeElements": ["irrelevant content to cut"],
  "toneAdjustment": "same|more_formal|more_casual|more_confident",
  "keywordGaps": ["keywords from new JD not in current letter"]
}

Return ONLY valid JSON, no explanation.`
}

export function buildTailorRewritePrompt(
  oldCoverLetter: string,
  requirements: RoleRequirements,
  evidence: CandidateEvidence,
  tailorAnalysis: Record<string, unknown>,
  tone: CoverLetterTone,
  length: CoverLetterLength
): string {
  const constraints = LENGTH_CONSTRAINTS[length]
  const toneDesc = TONE_DESCRIPTORS[tone]
  
  return `Rewrite this cover letter for a new job opportunity.

ORIGINAL LETTER:
${oldCoverLetter}

NEW ROLE REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

CANDIDATE EVIDENCE:
${JSON.stringify(evidence, null, 2)}

TAILORING ANALYSIS:
${JSON.stringify(tailorAnalysis, null, 2)}

TARGET TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
TARGET LENGTH: ${constraints.min}-${constraints.max} words

REQUIREMENTS:
1. Keep strong elements identified in analysis
2. Update sections flagged for change
3. Add new relevant achievements/skills
4. Remove irrelevant content
5. Naturally incorporate missing keywords
6. Maintain the candidate's authentic voice
7. Don't invent new facts not in evidence

Return the complete rewritten cover letter. No headers, just the letter text.`
}

// ============================================
// FINAL POLISH PROMPT
// ============================================

export function buildPolishPrompt(
  letterText: string,
  tone: CoverLetterTone,
  targetWordCount: { min: number; max: number }
): string {
  const toneDesc = TONE_DESCRIPTORS[tone]
  
  return `Polish this cover letter for clarity, flow, and impact.

LETTER:
${letterText}

TONE: ${tone} - ${toneDesc.adjectives.join(', ')}
TARGET LENGTH: ${targetWordCount.min}-${targetWordCount.max} words

POLISH TASKS:
1. Remove redundant words/phrases
2. Vary sentence openings and lengths
3. Replace any clichés with specific statements
4. Ensure smooth transitions between paragraphs
5. Tighten language while preserving meaning
6. Check tone consistency throughout
7. Ensure strong opening and closing

Return ONLY the polished letter text. No explanations or commentary.`
}

// ============================================
// INSIGHTS GENERATION PROMPT
// ============================================

export function buildInsightsPrompt(
  letterText: string,
  requirements: RoleRequirements,
  evidence: CandidateEvidence
): string {
  return `Analyze this cover letter and generate insights.

COVER LETTER:
${letterText}

JOB REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

CANDIDATE EVIDENCE:
${JSON.stringify(evidence, null, 2)}

Generate insights JSON:
{
  "matchedKeywords": ["keywords from requirements that appear in letter"],
  "missingKeywords": ["important keywords not included"],
  "strongestEvidence": ["best achievements/evidence used"],
  "warnings": ["any potential issues: overclaiming, generic language, etc."],
  "specificityScore": <0-100 how specific vs generic>,
  "toneMatch": "description of tone achieved"
}

Return ONLY valid JSON, no explanation.`
}

// ============================================
// MISSING METRICS QUESTIONS
// ============================================

export function generateMissingMetricsQuestions(evidence: CandidateEvidence): string[] {
  const questions: string[] = []
  
  // Check if achievements lack numbers
  const achievementsWithNumbers = evidence.topAchievements.filter(a => /\d+/.test(a))
  if (achievementsWithNumbers.length < 2) {
    questions.push('Can you quantify the impact of your work? (e.g., users supported, time saved, revenue generated)')
  }
  
  // Check for team size
  const hasTeamSize = evidence.leadershipSignals.some(s => /\d+/.test(s))
  if (evidence.leadershipSignals.length > 0 && !hasTeamSize) {
    questions.push('How many people did you lead, mentor, or collaborate with?')
  }
  
  // Check for project scale
  const hasScale = evidence.relevantProjects.some(p => /\d+/.test(p))
  if (evidence.relevantProjects.length > 0 && !hasScale) {
    questions.push('What was the scale of your projects? (users, budget, timeline)')
  }
  
  // Generic improvement questions
  if (questions.length < 3) {
    questions.push('What measurable improvements did you deliver in your roles?')
  }
  
  return questions.slice(0, 4)
}

// ============================================
// JSON EXTRACTION HELPER
// ============================================

export function extractJSON(text: string): unknown | null {
  try {
    // Try direct parse first
    return JSON.parse(text)
  } catch {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}