/**
 * CV Builder v2 - Zod Schemas
 */

import { z } from 'zod'

// Helpers
const OptionalTrimmed = z.string().optional().transform((s) => (s ?? '').trim())
const StringArray = z.array(z.string().transform(s => s.trim())).default([])
const Id = z.string().min(1)

// Evidence tracking for bullet provenance
export const EvidenceSpanSchema = z.object({
  id: z.string(),                    // Unique ID for this evidence
  source: z.enum(['resume', 'profile', 'jd']),  // Where it came from
  text: z.string(),                  // The source text snippet
  section: z.string().optional(),    // e.g., 'experience', 'skills'
  confidence: z.number().min(0).max(1).default(1), // Match confidence
})

export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>

// Resume Bullet Schema
export const ResumeBulletSchema = z.object({
  id: Id,
  text: z.string().transform(s => s.trim()),
  tools: StringArray,
  metrics: StringArray,
  tags: StringArray,
})

// Resume Experience Schema
export const ResumeExperienceSchema = z.object({
  id: Id,
  title: OptionalTrimmed,
  company: OptionalTrimmed,
  location: OptionalTrimmed,
  start: OptionalTrimmed,
  end: OptionalTrimmed,
  isCurrent: z.boolean().optional().default(false),
  bullets: z.array(ResumeBulletSchema).default([]),
})

// Resume Skills Schema
export const ResumeSkillsSchema = z.object({
  core: StringArray,
  technical: StringArray,
  tools: StringArray,
  cloud: StringArray,
  security: StringArray,
  systems: StringArray,
  support: StringArray,
  soft: StringArray,
  domain: StringArray,
})

// Full Resume Schema
export const ResumeSchemaZ = z.object({
  basics: z.object({
    name: OptionalTrimmed,
    headline: OptionalTrimmed,
    email: OptionalTrimmed,
    phone: OptionalTrimmed,
    location: OptionalTrimmed,
    links: StringArray,
  }),
  summary: OptionalTrimmed,
  skills: ResumeSkillsSchema,
  experience: z.array(ResumeExperienceSchema).default([]),
  projects: z.array(z.object({
    name: OptionalTrimmed,
    description: OptionalTrimmed,
    tools: StringArray,
    metrics: StringArray,
    links: StringArray,
  })).default([]),
  certifications: z.array(z.object({
    name: OptionalTrimmed,
    issuer: OptionalTrimmed,
    date: OptionalTrimmed,
  })).default([]),
  education: z.array(z.object({
    school: OptionalTrimmed,
    degree: OptionalTrimmed,
    field: OptionalTrimmed,
    start: OptionalTrimmed,
    end: OptionalTrimmed,
  })).default([]),
})

export type ResumeSchema = z.infer<typeof ResumeSchemaZ>

// Job Schema
export const JobSchemaZ = z.object({
  role_title: OptionalTrimmed,
  company: OptionalTrimmed,
  level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  responsibilities: StringArray,
  must_have: StringArray,
  nice_to_have: StringArray,
  keywords_top_25: z.array(z.string().transform(s => s.trim())).max(40).default([]),
  tools_stack: StringArray,
  soft_skills: StringArray,
  industry: OptionalTrimmed,
})

export type JobSchema = z.infer<typeof JobSchemaZ>

// Evidence Map Schema
export const EvidenceMapSchema = z.object({
  keyword_coverage: z.array(z.object({
    keyword: z.string(),
    covered: z.boolean(),
    evidence: z.array(z.object({
      exp_id: z.string(),
      bullet_id: z.string(),
      text: z.string(),
      confidence: z.number(),
    })).default([]),
    confidence: z.number().min(0).max(1).default(0),
    source: z.enum(['skills', 'experience', 'projects', 'certifications', 'summary']).optional(),
  })).default([]),
  missing_keywords: StringArray,
  covered_keywords: StringArray,
  coverage_percentage: z.number().min(0).max(100).default(0),
  best_experiences: z.array(z.string()).default([]),
  tools_matched: StringArray,
  tools_missing: StringArray,
})

export type EvidenceMap = z.infer<typeof EvidenceMapSchema>

// CV Output Schema
export const CVDataZ = z.object({
  header: z.object({
    name: z.string(),
    headline: OptionalTrimmed,
    contact_line: OptionalTrimmed,
    email: OptionalTrimmed,
    phone: OptionalTrimmed,
    location: OptionalTrimmed,
    links: StringArray,
  }),
  summary: z.string().default(''),
  skills: z.array(z.object({
    label: z.string(),
    items: StringArray,
  })).default([]),
  experience: z.array(z.object({
    title: OptionalTrimmed,
    company: OptionalTrimmed,
    location: OptionalTrimmed,
    duration: OptionalTrimmed,
    bullets: z.array(z.object({
      text: z.string(),
      isRewritten: z.boolean().optional().default(false),
      originalId: z.string().optional(),
       evidenceIds: z.array(z.string()).optional().default([]),
    })).default([]),
  })).default([]),
  projects: z.array(z.object({
    name: OptionalTrimmed,
    description: OptionalTrimmed,
    technologies: StringArray,
  })).default([]),
  certifications: z.array(z.object({
    name: OptionalTrimmed,
    issuer: OptionalTrimmed,
    year: OptionalTrimmed,
  })).default([]),
  education: z.array(z.object({
    institution: OptionalTrimmed,
    degree: OptionalTrimmed,
    year: OptionalTrimmed,
  })).default([]),
   evidence: z.array(EvidenceSpanSchema).optional().default([]),
  ats: z.object({
    keyword_coverage_pct: z.number().min(0).max(100).default(0),
    missing_keywords: StringArray,
    matched_keywords: StringArray,
    score: z.number().min(0).max(100).default(0),
  }).default({ keyword_coverage_pct: 0, missing_keywords: [], matched_keywords: [], score: 0 }),
})

export type CVData = z.infer<typeof CVDataZ>

// Quality Validation
export type CVFailure = {
  code: string
  message: string
  section?: string
  severity: 'error' | 'warning'
}

const VAGUE_PATTERNS = [
  /\bresponsible for\b/i,
  /\bworked on\b/i,
  /\bassisted with\b/i,
  /\bhelped with\b/i,
]

const FIRST_PERSON = /\b(I |I'|me |my |we |our )\b/i

export function validateCVWorldClass(cv: CVData): CVFailure[] {
  const failures: CVFailure[] = []

  // Header validation
  if (!cv.header.name || cv.header.name.trim().length < 2) {
    failures.push({ code: 'MISSING_NAME', message: 'CV must have a name', section: 'header', severity: 'error' })
  }

  // First person check
  if (FIRST_PERSON.test(JSON.stringify(cv))) {
    failures.push({ code: 'FIRST_PERSON', message: 'CV contains first-person language', severity: 'error' })
  }

  // Summary validation
  const summaryWords = cv.summary.split(/\s+/).filter(w => w.length > 0).length
  if (summaryWords < 40) {
    failures.push({ code: 'SUMMARY_SHORT', message: `Summary too short (${summaryWords} words)`, section: 'summary', severity: 'error' })
  }

  // Skills validation
  const totalSkills = cv.skills.reduce((acc, g) => acc + g.items.length, 0)
  if (totalSkills < 12) {
    failures.push({ code: 'SKILLS_FEW', message: `Only ${totalSkills} skills`, section: 'skills', severity: 'warning' })
  }

  // Experience validation
  cv.experience.forEach((exp, i) => {
    const minBullets = i < 2 ? 5 : 3
    if ((exp.bullets?.length ?? 0) < minBullets) {
      failures.push({ code: 'BULLETS_FEW', message: `${exp.title} has only ${exp.bullets?.length} bullets`, section: 'experience', severity: 'error' })
    }
    
    exp.bullets?.forEach(b => {
      if (VAGUE_PATTERNS.some(p => p.test(b.text))) {
        failures.push({ code: 'VAGUE_BULLET', message: `Vague language in bullet`, section: 'experience', severity: 'warning' })
      }
    })
  })

  return failures
}

export function calculateQualityScore(failures: CVFailure[]): number {
  let score = 100
  failures.forEach(f => { score -= f.severity === 'error' ? 15 : 5 })
  return Math.max(0, Math.min(100, score))
}

export function passesQualityGate(failures: CVFailure[]): boolean {
  const errors = failures.filter(f => f.severity === 'error')
  return errors.length === 0
}


export function safeParseResumeSchema(json: unknown) {
  try {
    const result = ResumeSchemaZ.safeParse(json)
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export function safeParseJobSchema(json: unknown) {
  try {
    const result = JobSchemaZ.safeParse(json)
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}


export function safeParseCVData(json: unknown) {
  try {
    const result = CVDataZ.safeParse(json)
    return result.success ? { success: true, data: result.data } : { success: false, error: result.error.message }
  } catch (e) {
    return { success: false, error: String(e) }
  }

  
}