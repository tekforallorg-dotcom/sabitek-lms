/**
 * CV Builder v2 - Evidence Mapping Engine
 * 
 * The "secret sauce" that prevents hallucination by:
 * - Mapping JD requirements to actual candidate evidence
 * - Using deterministic matching first (no AI needed)
 * - Calculating keyword coverage percentage
 * - Identifying gaps for targeted improvement
 */

import type { ResumeSchema, JobSchema, EvidenceMap } from '../schemas'

// Add this type locally since KeywordCoverage is used
type KeywordCoverage = EvidenceMap['keyword_coverage'][0]

// ============================================
// SYNONYMS DICTIONARY
// ============================================

/**
 * Common technology/skill synonyms for fuzzy matching
 */
const SYNONYMS: Record<string, string[]> = {
  // Microsoft stack
  'microsoft 365': ['m365', 'office 365', 'o365', 'microsoft office', 'ms office', 'office suite'],
  'active directory': ['ad', 'azure ad', 'azure active directory', 'entra id', 'microsoft entra'],
  'microsoft azure': ['azure', 'azure cloud', 'ms azure'],
  'microsoft teams': ['teams', 'ms teams'],
  'sharepoint': ['sharepoint online', 'spo'],
  'exchange': ['exchange online', 'exchange server', 'ms exchange'],
  'windows server': ['windows servers', 'win server'],
  'powershell': ['ps', 'powershell scripting'],
  'intune': ['microsoft intune', 'endpoint manager', 'mem'],
  
  // Cloud platforms
  'amazon web services': ['aws', 'amazon cloud'],
  'google cloud': ['gcp', 'google cloud platform'],
  
  // ITSM
  'servicenow': ['snow', 'service-now'],
  'jira': ['jira service desk', 'jira service management', 'jsm'],
  'zendesk': ['zendesk support'],
  
  // Networking
  'tcp/ip': ['tcp ip', 'tcpip', 'tcp-ip'],
  'dns': ['domain name system', 'dns management'],
  'dhcp': ['dynamic host configuration'],
  'vpn': ['virtual private network', 'vpn connectivity'],
  'lan': ['local area network'],
  'wan': ['wide area network'],
  
  // Security
  'information security': ['infosec', 'cybersecurity', 'cyber security', 'it security'],
  'mfa': ['multi-factor authentication', 'two-factor', '2fa', 'multi factor'],
  'sso': ['single sign-on', 'single sign on'],
  
  // Methodologies
  'itil': ['it service management', 'itsm', 'itil framework', 'itil v4', 'itil v3'],
  'agile': ['agile methodology', 'scrum', 'kanban'],
  
  // Support levels
  'level 1': ['l1', 'tier 1', 'tier-1', 'first line'],
  'level 2': ['l2', 'tier 2', 'tier-2', 'second line'],
  'level 3': ['l3', 'tier 3', 'tier-3', 'third line'],
  
  // General IT
  'troubleshooting': ['troubleshoot', 'problem-solving', 'issue resolution', 'debugging'],
  'technical support': ['tech support', 'it support', 'desktop support', 'end user support'],
  'help desk': ['helpdesk', 'service desk', 'support desk'],
  'system administration': ['sysadmin', 'systems administration', 'server administration'],
  
  // Soft skills
  'communication': ['communication skills', 'verbal communication', 'written communication'],
  'leadership': ['team leadership', 'team lead', 'leading teams'],
  'project management': ['pm', 'project coordination', 'managing projects'],
}

/**
 * Normalize a keyword for comparison
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Get all variations of a keyword (including synonyms)
 */
function getKeywordVariations(keyword: string): string[] {
  const normalized = normalizeKeyword(keyword)
  const variations = [normalized]
  
  // Check if this keyword has synonyms
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    const allForms = [normalizeKeyword(canonical), ...synonyms.map(normalizeKeyword)]
    
    if (allForms.includes(normalized)) {
      // Add all related forms
      variations.push(...allForms.filter(v => v !== normalized))
    }
  }
  
  return [...new Set(variations)]
}

/**
 * Check if text contains keyword (with fuzzy matching)
 */
function textContainsKeyword(text: string, keyword: string): { found: boolean; confidence: number } {
  const normalizedText = normalizeKeyword(text)
  const variations = getKeywordVariations(keyword)
  
  for (const variation of variations) {
    // Exact match
    if (normalizedText.includes(variation)) {
      return { found: true, confidence: 1.0 }
    }
    
    // Word boundary match (for short keywords)
    const wordBoundaryRegex = new RegExp(`\\b${variation.replace(/\s+/g, '\\s*')}\\b`, 'i')
    if (wordBoundaryRegex.test(text)) {
      return { found: true, confidence: 0.95 }
    }
  }
  
  // Partial match (for longer keywords)
  const keywordWords = normalizeKeyword(keyword).split(' ')
  if (keywordWords.length >= 2) {
    const matchedWords = keywordWords.filter(word => 
      word.length > 2 && normalizedText.includes(word)
    )
    if (matchedWords.length >= keywordWords.length * 0.7) {
      return { found: true, confidence: 0.7 }
    }
  }
  
  return { found: false, confidence: 0 }
}

// ============================================
// EVIDENCE SEARCH FUNCTIONS
// ============================================

interface EvidenceResult {
  exp_id: string
  bullet_id: string
  text: string
  confidence: number
}

/**
 * Search for keyword evidence in experience bullets
 */
function searchExperienceEvidence(
  resume: ResumeSchema,
  keyword: string
): EvidenceResult[] {
  const evidence: EvidenceResult[] = []
  
  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      const { found, confidence } = textContainsKeyword(bullet.text, keyword)
      
      if (found) {
        evidence.push({
          exp_id: exp.id,
          bullet_id: bullet.id,
          text: bullet.text,
          confidence,
        })
      }
      
      // Also check bullet tools
      for (const tool of bullet.tools) {
        const { found: toolFound, confidence: toolConf } = textContainsKeyword(tool, keyword)
        if (toolFound && !evidence.some(e => e.bullet_id === bullet.id)) {
          evidence.push({
            exp_id: exp.id,
            bullet_id: bullet.id,
            text: bullet.text,
            confidence: toolConf * 0.9, // Slightly lower confidence for tool match
          })
        }
      }
    }
  }
  
  return evidence.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Search for keyword in skills
 */
function searchSkillsEvidence(
  resume: ResumeSchema,
  keyword: string
): { found: boolean; confidence: number; category?: string } {
  const allSkills = [
    ...resume.skills.core,
    ...resume.skills.technical,
    ...resume.skills.tools,
    ...resume.skills.cloud,
    ...resume.skills.security,
    ...resume.skills.systems,
    ...resume.skills.support,
    ...resume.skills.soft,
    ...resume.skills.domain,
  ]
  
  for (const skill of allSkills) {
    const { found, confidence } = textContainsKeyword(skill, keyword)
    if (found) {
      return { found: true, confidence }
    }
  }
  
  return { found: false, confidence: 0 }
}

/**
 * Search for keyword in projects
 */
function searchProjectsEvidence(
  resume: ResumeSchema,
  keyword: string
): { found: boolean; confidence: number } {
  for (const project of resume.projects) {
    const textToSearch = `${project.name} ${project.description} ${project.tools.join(' ')}`
    const { found, confidence } = textContainsKeyword(textToSearch, keyword)
    if (found) {
      return { found: true, confidence }
    }
  }
  
  return { found: false, confidence: 0 }
}

/**
 * Search for keyword in certifications
 */
function searchCertificationsEvidence(
  resume: ResumeSchema,
  keyword: string
): { found: boolean; confidence: number } {
  for (const cert of resume.certifications) {
    const textToSearch = `${cert.name} ${cert.issuer}`
    const { found, confidence } = textContainsKeyword(textToSearch, keyword)
    if (found) {
      return { found: true, confidence }
    }
  }
  
  return { found: false, confidence: 0 }
}

/**
 * Search for keyword in summary
 */
function searchSummaryEvidence(
  resume: ResumeSchema,
  keyword: string
): { found: boolean; confidence: number } {
  if (!resume.summary) return { found: false, confidence: 0 }
  return textContainsKeyword(resume.summary, keyword)
}

// ============================================
// MAIN EVIDENCE MAPPING FUNCTION
// ============================================

/**
 * Build complete evidence map from resume against JD requirements
 * This is the core function that prevents hallucination
 */
export function buildEvidenceMap(resume: ResumeSchema, jd: JobSchema): EvidenceMap {
  const keywordCoverage: KeywordCoverage[] = []
  const coveredKeywords: string[] = []
  const missingKeywords: string[] = []
  const toolsMatched: string[] = []
  const toolsMissing: string[] = []
  
  // Combine all JD keywords for matching
  const allJDKeywords = [
    ...new Set([
      ...jd.keywords_top_25,
      ...jd.must_have,
      ...jd.tools_stack,
    ])
  ]
  
  // Process each keyword
  for (const keyword of allJDKeywords) {
    if (!keyword || keyword.trim().length < 2) continue
    
    let covered = false
    let bestConfidence = 0
    let source: KeywordCoverage['source'] = undefined
    const evidence: EvidenceResult[] = []
    
    // 1. Search experience bullets (highest value)
    const expEvidence = searchExperienceEvidence(resume, keyword)
    if (expEvidence.length > 0) {
      covered = true
      bestConfidence = Math.max(bestConfidence, expEvidence[0].confidence)
      evidence.push(...expEvidence.slice(0, 3)) // Top 3 evidence items
      source = 'experience'
    }
    
    // 2. Search skills
    const skillResult = searchSkillsEvidence(resume, keyword)
    if (skillResult.found) {
      covered = true
      if (skillResult.confidence > bestConfidence) {
        bestConfidence = skillResult.confidence
        source = 'skills'
      }
    }
    
    // 3. Search projects
    const projectResult = searchProjectsEvidence(resume, keyword)
    if (projectResult.found) {
      covered = true
      if (projectResult.confidence > bestConfidence) {
        bestConfidence = projectResult.confidence
        source = 'projects'
      }
    }
    
    // 4. Search certifications
    const certResult = searchCertificationsEvidence(resume, keyword)
    if (certResult.found) {
      covered = true
      if (certResult.confidence > bestConfidence) {
        bestConfidence = certResult.confidence
        source = 'certifications'
      }
    }
    
    // 5. Search summary
    const summaryResult = searchSummaryEvidence(resume, keyword)
    if (summaryResult.found) {
      covered = true
      if (summaryResult.confidence > bestConfidence && !source) {
        bestConfidence = summaryResult.confidence
        source = 'summary'
      }
    }
    
    // Record coverage
    keywordCoverage.push({
      keyword,
      covered,
      evidence,
      confidence: bestConfidence,
      source,
    })
    
    if (covered) {
      coveredKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  }
  
  // Process tools specifically
  for (const tool of jd.tools_stack) {
    if (!tool || tool.trim().length < 2) continue
    
    const isMatched = keywordCoverage.some(
      kc => normalizeKeyword(kc.keyword) === normalizeKeyword(tool) && kc.covered
    )
    
    if (isMatched) {
      toolsMatched.push(tool)
    } else {
      toolsMissing.push(tool)
    }
  }
  
  // Calculate coverage percentage
  const coveragePercentage = allJDKeywords.length > 0
    ? Math.round((coveredKeywords.length / allJDKeywords.length) * 100)
    : 0
  
  // Identify best experiences (most evidence matches)
  const experienceScores: Record<string, number> = {}
  for (const kc of keywordCoverage) {
    for (const ev of kc.evidence) {
      experienceScores[ev.exp_id] = (experienceScores[ev.exp_id] || 0) + ev.confidence
    }
  }
  
  const bestExperiences = Object.entries(experienceScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([expId]) => expId)
  
  return {
    keyword_coverage: keywordCoverage,
    covered_keywords: coveredKeywords,
    missing_keywords: missingKeywords,
    coverage_percentage: coveragePercentage,
    best_experiences: bestExperiences,
    tools_matched: toolsMatched,
    tools_missing: toolsMissing,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get prioritized keywords for CV tailoring
 * Returns keywords that should be emphasized based on evidence
 */
export function getPrioritizedKeywords(evidenceMap: EvidenceMap): {
  strongMatch: string[]   // High confidence, should emphasize
  weakMatch: string[]     // Low confidence, could strengthen
  noMatch: string[]       // Missing, cannot claim
} {
  const strongMatch: string[] = []
  const weakMatch: string[] = []
  const noMatch: string[] = []
  
  for (const kc of evidenceMap.keyword_coverage) {
    if (!kc.covered) {
      noMatch.push(kc.keyword)
    } else if (kc.confidence >= 0.8) {
      strongMatch.push(kc.keyword)
    } else {
      weakMatch.push(kc.keyword)
    }
  }
  
  return { strongMatch, weakMatch, noMatch }
}

/**
 * Get bullets that should be rewritten for JD alignment
 * Only returns bullets that have evidence for JD keywords but could be strengthened
 */
export function getBulletsToRewrite(
  resume: ResumeSchema,
  evidenceMap: EvidenceMap,
  maxBullets: number = 4
): Array<{
  exp_id: string
  bullet_id: string
  text: string
  matchedKeywords: string[]
  suggestedKeywords: string[]
}> {
  const bulletScores: Map<string, {
    exp_id: string
    bullet_id: string
    text: string
    matchedKeywords: string[]
    score: number
  }> = new Map()
  
  // Score bullets by how many keywords they match
  for (const kc of evidenceMap.keyword_coverage as KeywordCoverage[]) {
    if (!kc.covered) continue
    
    for (const ev of kc.evidence) {
      const key = `${ev.exp_id}:${ev.bullet_id}`
      const existing = bulletScores.get(key)
      
      if (existing) {
        existing.matchedKeywords.push(kc.keyword)
        existing.score += ev.confidence
      } else {
        bulletScores.set(key, {
          exp_id: ev.exp_id,
          bullet_id: ev.bullet_id,
          text: ev.text,
          matchedKeywords: [kc.keyword],
          score: ev.confidence,
        })
      }
    }
  }
  
  // Sort by score and take top N
  const sorted = Array.from(bulletScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxBullets)
  
  // Add suggested keywords (from missing that could apply)
  return sorted.map(bullet => ({
    ...bullet,
    suggestedKeywords: evidenceMap.missing_keywords
      .filter((mk: string) => {
        // Suggest keywords that are related to matched keywords
        const bulletVariations = bullet.matchedKeywords.flatMap(getKeywordVariations)
        const mkVariations = getKeywordVariations(mk)
        return mkVariations.some(v => bulletVariations.some(bv => 
          bv.includes(v.split(' ')[0]) || v.includes(bv.split(' ')[0])
        ))
      })
      .slice(0, 3),
  }))
}

/**
 * Calculate ATS score based on evidence map
 */
export function calculateATSScoreFromEvidence(evidenceMap: EvidenceMap): number {
  const baseScore = evidenceMap.coverage_percentage
  
  // Bonus for tool coverage
  const toolsCoverage = evidenceMap.tools_matched.length / 
    Math.max(1, evidenceMap.tools_matched.length + evidenceMap.tools_missing.length)
  const toolsBonus = toolsCoverage * 10
  
  // Bonus for experience evidence (not just skills)
  const experienceEvidence = evidenceMap.keyword_coverage.filter(
    kc => kc.source === 'experience' && kc.covered
  ).length
  const expBonus = Math.min(10, experienceEvidence * 0.5)
  
  return Math.min(100, Math.round(baseScore + toolsBonus + expBonus))
}

/**
 * Generate tailoring suggestions based on evidence map
 */
export function getTailoringSuggestions(evidenceMap: EvidenceMap): {
  summary: string[]
  skills: string[]
  experience: string[]
} {
  const suggestions = {
    summary: [] as string[],
    skills: [] as string[],
    experience: [] as string[],
  }
  
  // Summary suggestions
  if (evidenceMap.coverage_percentage < 50) {
    suggestions.summary.push('Consider mentioning more JD keywords naturally in your summary')
  }
  
  const topMissing = evidenceMap.missing_keywords.slice(0, 5)
  if (topMissing.length > 0) {
    suggestions.summary.push(`Missing keywords that could strengthen your summary: ${topMissing.join(', ')}`)
  }
  
  // Skills suggestions
  if (evidenceMap.tools_missing.length > 0) {
    suggestions.skills.push(`Add these tools if you have experience: ${evidenceMap.tools_missing.slice(0, 5).join(', ')}`)
  }
  
  // Experience suggestions
  if (evidenceMap.best_experiences.length > 0) {
    suggestions.experience.push(`Focus on strengthening bullets in your top matching experiences: ${evidenceMap.best_experiences.join(', ')}`)
  }
  
  const weakMatches = evidenceMap.keyword_coverage.filter((kc: KeywordCoverage) => kc.covered && kc.confidence < 0.7)
  if (weakMatches.length > 0) {
    suggestions.experience.push(`These keywords have weak matches - consider making them more explicit: ${weakMatches.slice(0, 3).map((w: KeywordCoverage) => w.keyword).join(', ')}`)
  }
  
  return suggestions
}
