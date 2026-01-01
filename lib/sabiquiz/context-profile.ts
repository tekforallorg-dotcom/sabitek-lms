// lib/sabiquiz/context-profile.ts

// ============================================================================
// TYPES
// ============================================================================

export type GenerationMode = 'school' | 'corporate' | 'certification'

export type ExamStyle = 
  | 'classroom_quiz'      // School: straightforward, clear language
  | 'workplace_scenario'  // Corporate: job-task realistic scenarios
  | 'vendor_certification' // Certification: precise terminology, scenario-based

export interface ContextProfile {
  mode: GenerationMode
  examStyle: ExamStyle
  domain: string
  audience: string
  tone: string
  languageLevel: string
  questionStyle: QuestionStyleRules
  terminology: TerminologyRules
  constraints: GenerationConstraints
}

export interface QuestionStyleRules {
  preferredTypes: ('single_correct' | 'multi_select' | 'best_answer')[]
  scenarioFrequency: 'low' | 'medium' | 'high'
  abstractionLevel: 'concrete' | 'mixed' | 'abstract'
  realWorldExamples: boolean
  caseStudyStyle: boolean
}

export interface TerminologyRules {
  useJargon: boolean
  requireDefinitions: boolean
  acronymHandling: 'expand_first' | 'assume_known' | 'avoid'
  formalityLevel: 'casual' | 'formal' | 'technical'
}

export interface GenerationConstraints {
  maxQuestionLength: number
  maxOptionLength: number
  minDistractorQuality: number
  requireExplanation: boolean
  explanationMinLength: number
  allowNigerianContext: boolean
  culturalNeutrality: 'strict' | 'moderate' | 'flexible'
}

export interface ProfileInput {
  category: string
  level: string
  mode?: GenerationMode
  materialDomain?: string
}

// ============================================================================
// MODE DETECTION
// ============================================================================

/**
 * Auto-detect generation mode from category and level
 */
export function detectMode(category: string, level: string): GenerationMode {
  const categoryLower = category.toLowerCase()
  const levelLower = level.toLowerCase()

  // School indicators
  const schoolLevels = ['school', 'jss', 'sss', 'secondary', 'foundation', 'beginner']
  const isSchoolLevel = schoolLevels.some(s => levelLower.includes(s))

  // Certification indicators
  const certKeywords = ['certification', 'exam', 'cert', 'prep']
  const isCertLevel = certKeywords.some(k => levelLower.includes(k))
  const isCertCategory = certKeywords.some(k => categoryLower.includes(k))

  // Corporate/Professional indicators
  const corpKeywords = ['professional', 'workplace', 'career', 'leadership', 'business']
  const isCorpLevel = levelLower.includes('professional') || levelLower.includes('workplace')
  const isCorpCategory = corpKeywords.some(k => categoryLower.includes(k))

  if (isCertLevel || isCertCategory) {
    return 'certification'
  }

  if (isSchoolLevel) {
    return 'school'
  }

  if (isCorpLevel || isCorpCategory) {
    return 'corporate'
  }

  // Default based on level complexity
  if (levelLower.includes('advanced') || levelLower.includes('tertiary')) {
    return 'corporate'
  }

  if (levelLower.includes('intermediate')) {
    return 'corporate'
  }

  return 'school' // Safe default
}

/**
 * Derive domain from category
 */
export function deriveDomain(category: string): string {
  const categoryMap: Record<string, string> = {
    'technology & software development': 'Software Engineering & Development',
    'digital skills & productivity': 'Digital Literacy & Tools',
    'data & analytics': 'Data Science & Analytics',
    'cybersecurity & online safety': 'Information Security',
    'business & entrepreneurship': 'Business Management',
    'career development & employability': 'Professional Development',
    'professional certifications & exams': 'Certification Preparation',
    'communication & writing': 'Communication Skills',
    'leadership & workplace skills': 'Leadership & Management',
    'general studies & personal development': 'General Education',
  }

  const lowerCategory = category.toLowerCase()
  
  for (const [key, domain] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
      return domain
    }
  }

  return category // Return original if no match
}

// ============================================================================
// PROFILE BUILDERS
// ============================================================================

/**
 * Build context profile for school mode
 */
function buildSchoolProfile(domain: string, level: string): ContextProfile {
  const isJunior = level.toLowerCase().includes('jss') || level.toLowerCase().includes('junior')
  
  return {
    mode: 'school',
    examStyle: 'classroom_quiz',
    domain,
    audience: isJunior ? 'Junior secondary students (ages 12-15)' : 'Senior secondary students (ages 15-18)',
    tone: 'Educational, encouraging, and clear',
    languageLevel: isJunior ? 'Simple and accessible' : 'Clear with appropriate academic vocabulary',
    questionStyle: {
      preferredTypes: ['single_correct'],
      scenarioFrequency: 'low',
      abstractionLevel: 'concrete',
      realWorldExamples: true,
      caseStudyStyle: false,
    },
    terminology: {
      useJargon: false,
      requireDefinitions: true,
      acronymHandling: 'expand_first',
      formalityLevel: 'casual',
    },
    constraints: {
      maxQuestionLength: 150,
      maxOptionLength: 80,
      minDistractorQuality: 0.6,
      requireExplanation: true,
      explanationMinLength: 50,
      allowNigerianContext: true,
      culturalNeutrality: 'flexible',
    },
  }
}

/**
 * Build context profile for corporate mode
 */
function buildCorporateProfile(domain: string, level: string): ContextProfile {
  const isAdvanced = level.toLowerCase().includes('advanced') || level.toLowerCase().includes('professional')
  
  return {
    mode: 'corporate',
    examStyle: 'workplace_scenario',
    domain,
    audience: isAdvanced ? 'Experienced professionals and managers' : 'Working professionals and career developers',
    tone: 'Professional, practical, and results-oriented',
    languageLevel: 'Business professional with industry terminology',
    questionStyle: {
      preferredTypes: ['single_correct', 'best_answer'],
      scenarioFrequency: 'high',
      abstractionLevel: 'mixed',
      realWorldExamples: true,
      caseStudyStyle: true,
    },
    terminology: {
      useJargon: true,
      requireDefinitions: false,
      acronymHandling: 'assume_known',
      formalityLevel: 'formal',
    },
    constraints: {
      maxQuestionLength: 250,
      maxOptionLength: 120,
      minDistractorQuality: 0.7,
      requireExplanation: true,
      explanationMinLength: 80,
      allowNigerianContext: false,
      culturalNeutrality: 'strict',
    },
  }
}

/**
 * Build context profile for certification mode
 */
function buildCertificationProfile(domain: string, level: string): ContextProfile {
  return {
    mode: 'certification',
    examStyle: 'vendor_certification',
    domain,
    audience: 'Certification candidates preparing for professional exams',
    tone: 'Precise, exam-focused, and technically accurate',
    languageLevel: 'Technical with precise terminology matching exam standards',
    questionStyle: {
      preferredTypes: ['single_correct', 'multi_select', 'best_answer'],
      scenarioFrequency: 'high',
      abstractionLevel: 'abstract',
      realWorldExamples: true,
      caseStudyStyle: true,
    },
    terminology: {
      useJargon: true,
      requireDefinitions: false,
      acronymHandling: 'assume_known',
      formalityLevel: 'technical',
    },
    constraints: {
      maxQuestionLength: 300,
      maxOptionLength: 150,
      minDistractorQuality: 0.8,
      requireExplanation: true,
      explanationMinLength: 100,
      allowNigerianContext: false,
      culturalNeutrality: 'strict',
    },
  }
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build a complete context profile for question generation
 */
export function buildContextProfile(input: ProfileInput): ContextProfile {
  const { category, level, mode: explicitMode, materialDomain } = input

  // Detect or use explicit mode
  const mode = explicitMode || detectMode(category, level)
  
  // Derive domain
  const domain = materialDomain || deriveDomain(category)

  // Build profile based on mode
  switch (mode) {
    case 'school':
      return buildSchoolProfile(domain, level)
    case 'corporate':
      return buildCorporateProfile(domain, level)
    case 'certification':
      return buildCertificationProfile(domain, level)
    default:
      return buildSchoolProfile(domain, level)
  }
}

/**
 * Get a human-readable summary of the context profile
 */
export function getProfileSummary(profile: ContextProfile): string {
  return `Mode: ${profile.mode} | Style: ${profile.examStyle} | Domain: ${profile.domain} | Audience: ${profile.audience}`
}

/**
 * Validate that a profile is complete and valid
 */
export function validateProfile(profile: ContextProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!profile.mode) errors.push('Missing mode')
  if (!profile.examStyle) errors.push('Missing exam style')
  if (!profile.domain) errors.push('Missing domain')
  if (!profile.audience) errors.push('Missing audience')
  if (!profile.questionStyle) errors.push('Missing question style rules')
  if (!profile.terminology) errors.push('Missing terminology rules')
  if (!profile.constraints) errors.push('Missing constraints')

  return {
    valid: errors.length === 0,
    errors,
  }
}