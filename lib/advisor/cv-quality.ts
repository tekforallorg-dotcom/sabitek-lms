import type { ResumeJSON, RoleProfile, ValidationResult } from './resume-schema'

/**
 * Banned filler phrases that reduce CV quality
 */
const BANNED_PHRASES = [
  'responsible for',
  'duties included',
  'worked on',
  'helped with',
  'assisted in',
  'involved in',
  'participated in',
  'was tasked with',
  'in charge of',
  'dealt with',
  'handled various',
  'did various',
  'team player',
  'hard worker',
  'quick learner',
  'self-starter',
  'detail-oriented', // overused
  'results-driven', // overused
  'synergy',
  'leverage',
  'utilize', // use "use" instead
]

/**
 * Strong action verbs that should start bullets
 */
const ACTION_VERBS = [
  'achieved', 'accelerated', 'accomplished', 'administered', 'analyzed',
  'architected', 'automated', 'built', 'collaborated', 'configured',
  'consolidated', 'created', 'decreased', 'delivered', 'deployed',
  'designed', 'developed', 'diagnosed', 'directed', 'drove',
  'eliminated', 'enabled', 'engineered', 'enhanced', 'established',
  'exceeded', 'executed', 'expanded', 'generated', 'grew',
  'identified', 'implemented', 'improved', 'increased', 'initiated',
  'integrated', 'introduced', 'launched', 'led', 'managed',
  'mentored', 'migrated', 'modernized', 'negotiated', 'optimized',
  'orchestrated', 'overhauled', 'pioneered', 'planned', 'produced',
  'programmed', 'reduced', 'redesigned', 'refactored', 'resolved',
  'restructured', 'revamped', 'scaled', 'secured', 'simplified',
  'spearheaded', 'standardized', 'streamlined', 'strengthened', 'supervised',
  'supported', 'transformed', 'troubleshot', 'upgraded', 'wrote'
]

/**
 * Validate CV output against quality standards
 */
export function validateCVOutput(
  cv: ResumeJSON,
  roleProfile: RoleProfile,
  mode: 'build' | 'tailor'
): ValidationResult {
  const issues: ValidationResult['issues'] = []
  let score = 100

  // 1. Check summary
  if (!cv.summary || cv.summary.length < 100) {
    issues.push({
      section: 'summary',
      severity: 'error',
      message: 'Professional summary is too short (minimum 100 characters)',
      fix: 'Regenerate summary with more detail'
    })
    score -= 15
  } else if (cv.summary.length > 500) {
    issues.push({
      section: 'summary',
      severity: 'warning',
      message: 'Professional summary is too long (recommended under 500 characters)',
      fix: 'Trim summary to be more concise'
    })
    score -= 5
  }

  // Check summary for banned phrases
  const summaryBanned = checkBannedPhrases(cv.summary || '')
  if (summaryBanned.length > 0) {
    issues.push({
      section: 'summary',
      severity: 'warning',
      message: `Summary contains weak phrases: ${summaryBanned.join(', ')}`,
      fix: 'Replace with stronger, more specific language'
    })
    score -= summaryBanned.length * 2
  }

  // 2. Check skills
  const totalSkills = [
    ...(cv.skills.core || []),
    ...(cv.skills.tools || []),
    ...(cv.skills.domain || []),
    ...(cv.skills.soft || [])
  ]

  if (totalSkills.length < 10) {
    issues.push({
      section: 'skills',
      severity: 'warning',
      message: `Only ${totalSkills.length} skills listed (recommended 15-25)`,
      fix: 'Add more relevant skills from your experience'
    })
    score -= 10
  }

  // 3. Check experience bullets
  let totalBullets = 0
  let bulletsWithMetrics = 0
  let bulletsWithActionVerbs = 0
  let bulletLengths: number[] = []

  cv.experience.forEach((exp, idx) => {
    const isRecent = idx < 2
    const minBullets = isRecent ? 4 : 2
    const maxBullets = isRecent ? 7 : 4

    if (!exp.bullets || exp.bullets.length < minBullets) {
      issues.push({
        section: 'experience',
        severity: 'error',
        message: `"${exp.role}" has only ${exp.bullets?.length || 0} bullets (minimum ${minBullets} required)`,
        fix: `Add ${minBullets - (exp.bullets?.length || 0)} more achievement bullets`
      })
      score -= 10
    }

    if (exp.bullets && exp.bullets.length > maxBullets) {
      issues.push({
        section: 'experience',
        severity: 'warning',
        message: `"${exp.role}" has ${exp.bullets.length} bullets (recommended max ${maxBullets})`,
        fix: 'Keep only the most impactful bullets'
      })
      score -= 3
    }

    // Analyze each bullet
    exp.bullets?.forEach(bullet => {
      totalBullets++
      bulletLengths.push(bullet.length)

      // Check for metrics
      if (/\d+%|\$\d+|\d+\+|\d+ (users|customers|clients|employees|team|projects|systems)/i.test(bullet)) {
        bulletsWithMetrics++
      }

      // Check for action verbs
      const firstWord = bullet.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
      if (ACTION_VERBS.includes(firstWord)) {
        bulletsWithActionVerbs++
      }

      // Check for banned phrases
      const bulletBanned = checkBannedPhrases(bullet)
      if (bulletBanned.length > 0) {
        issues.push({
          section: 'experience',
          severity: 'warning',
          message: `Bullet contains weak phrase: "${bulletBanned[0]}"`,
          fix: 'Rewrite with stronger action-oriented language'
        })
        score -= 2
      }
    })
  })

  // Check bullet diversity
  if (totalBullets > 5) {
    const avgLength = bulletLengths.reduce((a, b) => a + b, 0) / bulletLengths.length
    const lengthVariance = bulletLengths.reduce((sum, len) => sum + Math.abs(len - avgLength), 0) / bulletLengths.length

    if (lengthVariance < 20) {
      issues.push({
        section: 'experience',
        severity: 'suggestion',
        message: 'Bullet points are too similar in length - vary for better readability',
        fix: 'Mix shorter impact statements with detailed achievements'
      })
      score -= 5
    }
  }

  // Check action verb usage
  if (totalBullets > 0 && bulletsWithActionVerbs / totalBullets < 0.7) {
    issues.push({
      section: 'experience',
      severity: 'warning',
      message: `Only ${Math.round(bulletsWithActionVerbs / totalBullets * 100)}% of bullets start with action verbs (recommended 80%+)`,
      fix: 'Start each bullet with a strong action verb'
    })
    score -= 10
  }

  // 4. Keyword coverage (for tailor mode)
  let keywordCoverage = { total: 0, found: 0, missing: [] as string[] }
  
  if (roleProfile.keywords.length > 0) {
    const cvText = JSON.stringify(cv).toLowerCase()
    
    keywordCoverage.total = roleProfile.keywords.length
    roleProfile.keywords.forEach(keyword => {
      if (cvText.includes(keyword.toLowerCase())) {
        keywordCoverage.found++
      } else {
        keywordCoverage.missing.push(keyword)
      }
    })

    const coveragePercent = keywordCoverage.found / keywordCoverage.total

    if (mode === 'tailor' && coveragePercent < 0.6) {
      issues.push({
        section: 'keywords',
        severity: 'warning',
        message: `Only ${Math.round(coveragePercent * 100)}% keyword coverage (recommended 60%+)`,
        fix: 'Add missing keywords naturally to summary and skills'
      })
      score -= 15
    } else if (coveragePercent < 0.4) {
      issues.push({
        section: 'keywords',
        severity: 'suggestion',
        message: `Low keyword match (${Math.round(coveragePercent * 100)}%) - may affect ATS ranking`,
        fix: 'Consider adding relevant keywords from job description'
      })
      score -= 5
    }
  }

  // 5. Check education
  if (!cv.education || cv.education.length === 0) {
    issues.push({
      section: 'education',
      severity: 'warning',
      message: 'No education listed',
      fix: 'Add your educational background'
    })
    score -= 5
  }

  return {
    isValid: score >= 70,
    score: Math.max(0, score),
    issues,
    keywordCoverage,
    bulletAnalysis: {
      totalBullets,
      avgLength: bulletLengths.length > 0 
        ? Math.round(bulletLengths.reduce((a, b) => a + b, 0) / bulletLengths.length) 
        : 0,
      hasMetrics: bulletsWithMetrics,
      hasActionVerbs: bulletsWithActionVerbs
    }
  }
}

/**
 * Check text for banned phrases
 */
function checkBannedPhrases(text: string): string[] {
  const lowerText = text.toLowerCase()
  return BANNED_PHRASES.filter(phrase => lowerText.includes(phrase))
}

/**
 * Calculate ATS compatibility score
 */
export function calculateATSScore(
  cv: ResumeJSON,
  roleProfile: RoleProfile
): number {
  let score = 50 // Base score

  // Keyword presence (+30 max)
  if (roleProfile.keywords.length > 0) {
    const cvText = JSON.stringify(cv).toLowerCase()
    const matchedKeywords = roleProfile.keywords.filter(kw => 
      cvText.includes(kw.toLowerCase())
    )
    score += Math.round((matchedKeywords.length / roleProfile.keywords.length) * 30)
  }

  // Skills completeness (+10 max)
  const totalSkills = [
    ...(cv.skills.core || []),
    ...(cv.skills.tools || []),
    ...(cv.skills.domain || []),
    ...(cv.skills.soft || [])
  ].length
  score += Math.min(10, totalSkills)

  // Experience bullets with action verbs (+5 max)
  let actionVerbCount = 0
  cv.experience.forEach(exp => {
    exp.bullets?.forEach(bullet => {
      const firstWord = bullet.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
      if (ACTION_VERBS.includes(firstWord)) actionVerbCount++
    })
  })
  score += Math.min(5, Math.round(actionVerbCount / 3))

  // Summary presence (+5)
  if (cv.summary && cv.summary.length >= 100) score += 5

  return Math.min(100, score)
}