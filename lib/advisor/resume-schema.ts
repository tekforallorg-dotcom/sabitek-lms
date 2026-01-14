/**
 * Canonical Resume JSON Schema
 * Single source of truth for all CV data
 */

export interface ResumeJSON {
  basics: {
    fullName: string
    headline?: string
    email?: string
    phone?: string
    location?: string
    links?: Array<{ label: string; url: string }>
  }
  summary?: string
  skills: {
    core?: string[]
    tools?: string[]
    domain?: string[]
    soft?: string[]
  }
  experience: Array<{
    id: string
    company: string
    role: string
    location?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    bullets: string[]
  }>
  projects?: Array<{
    id: string
    name: string
    link?: string
    stack?: string[]
    bullets: string[]
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    startDate?: string
    endDate?: string
  }>
  certifications?: Array<{
    name: string
    issuer?: string
    date?: string
  }>
  extras?: {
    volunteering?: string[]
    awards?: string[]
    languages?: string[]
  }
}

export interface RoleProfile {
  roleTitle: string
  level: 'Entry' | 'Mid' | 'Senior' | 'Executive'
  keywords: string[]
  competencies: string[]
  responsibilities: string[]
  industryContext?: string
}

export interface CVPlan {
  recommendedTemplate: 'ATS_1PAGE' | 'ATS_2PAGE' | 'TECH_PROJECTS'
  sectionOrder: string[]
  emphasis: {
    highlightExperienceIds?: string[]
    highlightProjects?: boolean
    prioritizeSkills: string[]
  }
  evidencePrompts: Array<{
    id: string
    question: string
    exampleAnswer?: string
    mapsTo: 'experience' | 'projects' | 'skills' | 'summary'
    experienceId?: string
    required: boolean
  }>
  styleRules: {
    summaryLines: number
    bulletsPerRecentRole: [number, number]
    bulletsPerOlderRole: [number, number]
    maxSkillsPerCategory: number
  }
}

export interface ParsedDocument {
  rawText: string
  sectionsGuess?: {
    headings: string[]
    emails: string[]
    phones: string[]
    links: string[]
    potentialSkills: string[]
  }
  meta: {
    fileType: 'pdf' | 'docx' | 'txt'
    charCount: number
    isScannedLikely: boolean
    parseQuality: 'good' | 'partial' | 'poor'
  }
}

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: Array<{
    section: string
    severity: 'error' | 'warning' | 'suggestion'
    message: string
    fix?: string
  }>
  keywordCoverage: {
    total: number
    found: number
    missing: string[]
  }
  bulletAnalysis: {
    totalBullets: number
    avgLength: number
    hasMetrics: number
    hasActionVerbs: number
  }
}

export interface EvidenceAnswer {
  promptId: string
  answer: string
}

/**
 * Normalize inputs from various sources into canonical ResumeJSON
 */
export function normalizeResumeInput(
  profileData: Record<string, any> | null,
  parsedCV: ParsedDocument | null,
  manualEdits?: Partial<ResumeJSON>
): { resume: ResumeJSON; missingCritical: string[] } {
  const resume: ResumeJSON = {
    basics: {
      fullName: '',
    },
    skills: {},
    experience: [],
  }

  const missingCritical: string[] = []

  // 1. Start with profile data (database)
  if (profileData) {
    resume.basics.fullName = profileData.full_name || ''
    resume.basics.email = profileData.email || ''
    resume.basics.phone = profileData.phone || ''
    resume.basics.location = profileData.location || ''
    resume.summary = profileData.summary || ''

    // Skills
    if (profileData.skills?.length) {
      resume.skills.core = profileData.skills
    }

    // Experience
    if (profileData.work_experience?.length) {
      resume.experience = profileData.work_experience.map((exp: any, idx: number) => ({
        id: exp.id || `exp-${idx}`,
        company: exp.company || '',
        role: exp.title || '',
        location: exp.location || '',
        startDate: exp.start_date || '',
        endDate: exp.end_date || '',
        isCurrent: exp.is_current || false,
        bullets: exp.bullets || [],
      }))
    }

    // Education
    if (profileData.education?.length) {
      resume.education = profileData.education.map((edu: any) => ({
        school: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        endDate: edu.year || '',
      }))
    }

    // Projects
    if (profileData.projects?.length) {
      resume.projects = profileData.projects.map((proj: any, idx: number) => ({
        id: proj.id || `proj-${idx}`,
        name: proj.name || '',
        link: proj.url || '',
        stack: proj.technologies || [],
        bullets: proj.description ? [proj.description] : [],
      }))
    }

    // Certifications
    if (profileData.certifications?.length) {
      resume.certifications = profileData.certifications
    }

    // Links
    if (profileData.links) {
      resume.basics.links = []
      if (profileData.links.linkedin) {
        resume.basics.links.push({ label: 'LinkedIn', url: profileData.links.linkedin })
      }
      if (profileData.links.github) {
        resume.basics.links.push({ label: 'GitHub', url: profileData.links.github })
      }
      if (profileData.links.portfolio) {
        resume.basics.links.push({ label: 'Portfolio', url: profileData.links.portfolio })
      }
    }
  }

  // 2. Enhance with parsed CV data
  if (parsedCV && parsedCV.meta.parseQuality !== 'poor') {
    // Extract emails if missing
    if (!resume.basics.email && parsedCV.sectionsGuess?.emails?.length) {
      resume.basics.email = parsedCV.sectionsGuess.emails[0]
    }

    // Extract phones if missing
    if (!resume.basics.phone && parsedCV.sectionsGuess?.phones?.length) {
      resume.basics.phone = parsedCV.sectionsGuess.phones[0]
    }

    // Add potential skills
    if (parsedCV.sectionsGuess?.potentialSkills?.length) {
      const existingSkills = new Set([
        ...(resume.skills.core || []),
        ...(resume.skills.tools || []),
      ].map(s => s.toLowerCase()))

      const newSkills = parsedCV.sectionsGuess.potentialSkills.filter(
        s => !existingSkills.has(s.toLowerCase())
      )

      if (newSkills.length) {
        resume.skills.tools = [...(resume.skills.tools || []), ...newSkills.slice(0, 10)]
      }
    }
  }

  // 3. Apply manual edits (highest priority)
  if (manualEdits) {
    if (manualEdits.basics) {
      resume.basics = { ...resume.basics, ...manualEdits.basics }
    }
    if (manualEdits.summary) {
      resume.summary = manualEdits.summary
    }
    if (manualEdits.skills) {
      resume.skills = { ...resume.skills, ...manualEdits.skills }
    }
    if (manualEdits.experience) {
      resume.experience = manualEdits.experience
    }
    if (manualEdits.education) {
      resume.education = manualEdits.education
    }
    if (manualEdits.projects) {
      resume.projects = manualEdits.projects
    }
    if (manualEdits.certifications) {
      resume.certifications = manualEdits.certifications
    }
  }

  // 4. Identify missing critical fields
  if (!resume.basics.fullName) {
    missingCritical.push('Full name is required')
  }
  if (!resume.basics.email) {
    missingCritical.push('Email address is required')
  }
  if (resume.experience.length === 0) {
    missingCritical.push('At least one work experience is required')
  } else {
    // Check for experience with no bullets
    resume.experience.forEach((exp, idx) => {
      if (!exp.bullets || exp.bullets.length === 0) {
        missingCritical.push(`Work experience "${exp.role || `#${idx + 1}`}" has no bullet points`)
      }
    })
  }

  return { resume, missingCritical }
}

/**
 * Calculate completeness score for a resume
 */
export function calculateResumeCompleteness(resume: ResumeJSON): number {
  let score = 0
  const maxScore = 100

  // Basics (20 points)
  if (resume.basics.fullName) score += 5
  if (resume.basics.email) score += 5
  if (resume.basics.phone) score += 3
  if (resume.basics.location) score += 3
  if (resume.basics.links?.length) score += 4

  // Summary (15 points)
  if (resume.summary && resume.summary.length > 100) score += 15
  else if (resume.summary && resume.summary.length > 50) score += 10
  else if (resume.summary) score += 5

  // Skills (15 points)
  const totalSkills = [
    ...(resume.skills.core || []),
    ...(resume.skills.tools || []),
    ...(resume.skills.domain || []),
    ...(resume.skills.soft || []),
  ].length
  if (totalSkills >= 15) score += 15
  else if (totalSkills >= 10) score += 10
  else if (totalSkills >= 5) score += 5

  // Experience (30 points)
  if (resume.experience.length >= 3) score += 10
  else if (resume.experience.length >= 2) score += 7
  else if (resume.experience.length >= 1) score += 4

  const totalBullets = resume.experience.reduce((sum, exp) => sum + (exp.bullets?.length || 0), 0)
  if (totalBullets >= 15) score += 20
  else if (totalBullets >= 10) score += 15
  else if (totalBullets >= 5) score += 10
  else if (totalBullets > 0) score += 5

  // Education (10 points)
  if (resume.education?.length) score += 10

  // Projects (5 points)
  if ((resume.projects?.length ?? 0) >= 2) score += 5
else if ((resume.projects?.length ?? 0) >= 1) score += 3

  // Certifications (5 points)
  if (resume.certifications?.length) score += 5

  return Math.min(score, maxScore)
}