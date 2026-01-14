/**
 * Evidence Populator
 * 
 * Links generated CV bullets to their source evidence from the resume.
 * This enables "Why this bullet?" UI functionality.
 */

import type { ResumeSchema } from './schemas'
import type { EvidenceSpan } from './schemas'

/**
 * Generate a unique evidence ID
 */
function generateEvidenceId(): string {
  return `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Calculate similarity between two strings (0-1)
 * Uses word overlap as a simple metric
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  let overlap = 0
  for (const word of words1) {
    if (words2.has(word)) overlap++
  }
  
  return overlap / Math.max(words1.size, words2.size)
}

/**
 * Find the best matching source bullet for a generated bullet
 */
function findBestMatch(
  generatedBullet: string,
  sourceBullets: Array<{ text: string; expIndex: number; bulletIndex: number }>
): { match: typeof sourceBullets[0] | null; confidence: number } {
  let bestMatch: typeof sourceBullets[0] | null = null
  let bestScore = 0
  
  for (const source of sourceBullets) {
    const score = calculateSimilarity(generatedBullet, source.text)
    if (score > bestScore && score > 0.3) { // Minimum threshold
      bestScore = score
      bestMatch = source
    }
  }
  
  return { match: bestMatch, confidence: bestScore }
}

/**
 * Build evidence spans from resume
 */
export function buildEvidenceSpans(resume: ResumeSchema): EvidenceSpan[] {
  const spans: EvidenceSpan[] = []
  
  // Add experience bullets as evidence
  resume.experience.forEach((exp, expIndex) => {
    exp.bullets.forEach((bullet, bulletIndex) => {
      spans.push({
        id: generateEvidenceId(),
        source: 'resume',
        text: bullet.text,
        section: `experience.${expIndex}.bullets.${bulletIndex}`,
        confidence: 1,
      })
    })
  })
  
  // Add skills as evidence
  const allSkills = [
    ...resume.skills.core,
    ...resume.skills.technical,
    ...resume.skills.tools,
    ...resume.skills.soft,
  ]
  
  if (allSkills.length > 0) {
    spans.push({
      id: generateEvidenceId(),
      source: 'resume',
      text: allSkills.join(', '),
      section: 'skills',
      confidence: 1,
    })
  }
  
  // Add summary if exists
  if (resume.summary) {
    spans.push({
      id: generateEvidenceId(),
      source: 'resume',
      text: resume.summary,
      section: 'summary',
      confidence: 1,
    })
  }
  
  return spans
}

/**
 * Populate evidence IDs for generated CV bullets
 * Maps each generated bullet back to its source evidence
 */
export function populateEvidenceIds(
  generatedExperience: Array<{
    title: string
    company: string
    location: string
    duration: string
    bullets: Array<{ text: string; isRewritten: boolean; evidenceIds: string[] }>
  }>,
  resume: ResumeSchema,
  evidenceSpans: EvidenceSpan[]
): {
  experience: typeof generatedExperience
  evidenceSpans: EvidenceSpan[]
} {
  // Build flat list of source bullets with indices
  const sourceBullets: Array<{ text: string; expIndex: number; bulletIndex: number }> = []
  resume.experience.forEach((exp, expIndex) => {
    exp.bullets.forEach((bullet, bulletIndex) => {
      sourceBullets.push({ text: bullet.text, expIndex, bulletIndex })
    })
  })
  
  // Map evidence spans by section
  const spansBySection = new Map<string, EvidenceSpan>()
  for (const span of evidenceSpans) {
    if (span.section) {
      spansBySection.set(span.section, span)
    }
  }
  
  // Process each generated bullet
  const updatedExperience = generatedExperience.map((exp, genExpIndex) => ({
    ...exp,
    bullets: exp.bullets.map((bullet) => {
      if (!bullet.isRewritten) {
        // Not rewritten - find exact match
        const exactMatch = sourceBullets.find(s => 
          calculateSimilarity(s.text, bullet.text) > 0.8
        )
        if (exactMatch) {
          const sectionKey = `experience.${exactMatch.expIndex}.bullets.${exactMatch.bulletIndex}`
          const span = spansBySection.get(sectionKey)
          return {
            ...bullet,
            evidenceIds: span ? [span.id] : [],
          }
        }
      }
      
      // Rewritten or no exact match - find best match
      const { match, confidence } = findBestMatch(bullet.text, sourceBullets)
      
      if (match && confidence > 0.3) {
        const sectionKey = `experience.${match.expIndex}.bullets.${match.bulletIndex}`
        const span = spansBySection.get(sectionKey)
        
        // If confidence is low, add a new span for the match
        if (confidence < 0.7 && span) {
          // Update span confidence
          span.confidence = confidence
        }
        
        return {
          ...bullet,
          evidenceIds: span ? [span.id] : [],
        }
      }
      
      // No match found - this might be a combination or new content
      return {
        ...bullet,
        evidenceIds: [],
      }
    }),
  }))
  
  return {
    experience: updatedExperience,
    evidenceSpans,
  }
}

/**
 * Get evidence details for a bullet
 */
export function getEvidenceForBullet(
  evidenceIds: string[],
  evidenceSpans: EvidenceSpan[]
): EvidenceSpan[] {
  return evidenceIds
    .map(id => evidenceSpans.find(s => s.id === id))
    .filter((s): s is EvidenceSpan => s !== undefined)
}

/**
 * Calculate evidence coverage stats
 */
export function calculateEvidenceCoverage(
  experience: Array<{ bullets: Array<{ evidenceIds: string[] }> }>
): {
  totalBullets: number
  bulletsWithEvidence: number
  coveragePercent: number
} {
  let totalBullets = 0
  let bulletsWithEvidence = 0
  
  for (const exp of experience) {
    for (const bullet of exp.bullets) {
      totalBullets++
      if (bullet.evidenceIds.length > 0) {
        bulletsWithEvidence++
      }
    }
  }
  
  return {
    totalBullets,
    bulletsWithEvidence,
    coveragePercent: totalBullets > 0 
      ? Math.round((bulletsWithEvidence / totalBullets) * 100) 
      : 0,
  }
}

export default {
  buildEvidenceSpans,
  populateEvidenceIds,
  getEvidenceForBullet,
  calculateEvidenceCoverage,
}