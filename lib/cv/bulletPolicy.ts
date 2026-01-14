/**
 * CV Format & Bullet Policy
 * 
 * Supported formats:
 * - ATS-1page: ATS-Friendly Resume (1 Page) - min 5 bullets/role
 * - ATS-2page: ATS-Friendly Resume (2 Pages) - min 8 bullets/role
 * - REMOTE_OPTIMISED_ATS: Remote Optimised Resume - min 6 bullets/role
 */

export type CVFormat = 'ATS-1page' | 'ATS-2page' | 'REMOTE_OPTIMISED_ATS'

// Legacy format mapping
export type LegacyFormat = 'ats_1' | 'ats_2' | '1-page' | '2-page'

export interface BulletPolicy {
  minPerRole: number
  maxPerRole: number
}

export interface FormatConfig {
  id: CVFormat
  displayName: string
  shortName: string
  description: string
  bulletPolicy: BulletPolicy
  summaryLength: {
    minWords: number
    maxWords: number
  }
  sections: {
    summary: boolean
    skills: 'grouped' | 'flat' | 'with-remote'
    experience: boolean
    projects: boolean
    education: boolean
    certifications: boolean
  }
  remoteOptimised: boolean
  atsOptimized: boolean
}

/**
 * Format configurations (STRICT RULES)
 */
export const FORMAT_CONFIGS: Record<CVFormat, FormatConfig> = {
  'ATS-1page': {
    id: 'ATS-1page',
    displayName: 'ATS-Friendly Resume (1 Page)',
    shortName: '1-Page ATS',
    description: 'Best for strict ATS + quick applications',
    bulletPolicy: {
      minPerRole: 5,
      maxPerRole: 7,
    },
    summaryLength: {
      minWords: 60,
      maxWords: 100,
    },
    sections: {
      summary: true,
      skills: 'grouped',
      experience: true,
      projects: false,
      education: true,
      certifications: true,
    },
    remoteOptimised: false,
    atsOptimized: true,
  },
  
  'ATS-2page': {
    id: 'ATS-2page',
    displayName: 'ATS-Friendly Resume (2 Pages)',
    shortName: '2-Page ATS',
    description: 'Best for experienced candidates',
    bulletPolicy: {
      minPerRole: 8,
      maxPerRole: 10,
    },
    summaryLength: {
      minWords: 80,
      maxWords: 120,
    },
    sections: {
      summary: true,
      skills: 'grouped',
      experience: true,
      projects: true,
      education: true,
      certifications: true,
    },
    remoteOptimised: false,
    atsOptimized: true,
  },
  
  REMOTE_OPTIMISED_ATS: {
    id: 'REMOTE_OPTIMISED_ATS',
    displayName: 'Remote Optimised Resume (ATS + Remote-Ready)',
    shortName: 'Remote ATS',
    description: 'Best for remote/hybrid jobs; highlights async communication + documentation',
    bulletPolicy: {
      minPerRole: 6,
      maxPerRole: 8,
    },
    summaryLength: {
      minWords: 70,
      maxWords: 110,
    },
    sections: {
      summary: true,
      skills: 'with-remote',  // Includes Remote Collaboration line
      experience: true,
      projects: true,
      education: true,
      certifications: true,
    },
    remoteOptimised: true,
    atsOptimized: true,
  },
}

/**
 * Remote-readiness competencies to emphasize
 */
export const REMOTE_COMPETENCIES = [
  'async communication',
  'documentation',
  'ticket hygiene',
  'SLA discipline',
  'customer empathy',
  'stakeholder updates',
  'incident triage',
  'prioritization',
  'escalation',
  'handover notes',
  'self-management',
  'time zone coordination',
]

/**
 * Remote collaboration skills line
 */
export const REMOTE_SKILLS_LINE = 'Remote Support: async updates, stakeholder communication, documentation, handovers'

/**
 * Safe filler bullet patterns (NO hallucination)
 * These can be used when source CV is short on bullets
 */
export const SAFE_FILLER_BULLETS = [
  'Resolved end-user issues using structured troubleshooting and clear documentation to restore service quickly.',
  'Collaborated with cross-functional teams to communicate updates, manage expectations, and reduce repeat incidents.',
  'Maintained accurate records of support activities and outcomes for reporting and continuous improvement.',
  'Provided timely updates to stakeholders on issue status, resolution progress, and preventive measures.',
  'Followed established procedures and escalation paths to ensure consistent service delivery.',
  'Documented solutions and workarounds to build knowledge base and reduce future resolution time.',
  'Prioritized and managed multiple support requests while maintaining quality and meeting response targets.',
  'Participated in team meetings and knowledge sharing sessions to improve overall support effectiveness.',
]

/**
 * Map legacy format names to new format IDs
 */
export function mapLegacyFormat(format: string): CVFormat {
  const mapping: Record<string, CVFormat> = {
    'ats_1': 'ATS-1page',
    'ats_2': 'ATS-2page',
    '1-page': 'ATS-1page',
    '2-page': 'ATS-2page',
    'remote': 'REMOTE_OPTIMISED_ATS',
    'remote_optimised': 'REMOTE_OPTIMISED_ATS',
  }
  
  return mapping[format.toLowerCase()] || 'ATS-2page'
}

/**
 * Get format configuration
 */
export function getFormatConfig(format: CVFormat | LegacyFormat | string): FormatConfig {
  // Handle if already a valid CVFormat
  if (format in FORMAT_CONFIGS) {
    return FORMAT_CONFIGS[format as CVFormat]
  }
  
  // Map legacy format
  const mapped = mapLegacyFormat(format)
  return FORMAT_CONFIGS[mapped]
}

/**
 * Get bullet policy for format
 */
export function getBulletPolicy(format: CVFormat | LegacyFormat | string): BulletPolicy {
  return getFormatConfig(format).bulletPolicy
}

/**
 * Get required bullet count for a role (same for all roles in format)
 */
export function getBulletCountForRole(format: CVFormat | string): { min: number; max: number } {
  const policy = getBulletPolicy(format)
  return {
    min: policy.minPerRole,
    max: policy.maxPerRole,
  }
}

/**
 * Validate bullet counts - FAILS if any role is below minimum
 */
export function validateBulletCounts(
  experience: Array<{ title: string; bullets: Array<unknown> }>,
  format: CVFormat | string
): {
  valid: boolean
  failures: Array<{ role: string; actual: number; required: number }>
} {
  const policy = getBulletPolicy(format)
  const failures: Array<{ role: string; actual: number; required: number }> = []
  
  for (const role of experience) {
    const actual = role.bullets.length
    if (actual < policy.minPerRole) {
      failures.push({
        role: role.title,
        actual,
        required: policy.minPerRole,
      })
    }
  }
  
  return {
    valid: failures.length === 0,
    failures,
  }
}

/**
 * Get bullet expansion instructions for AI
 */
export function getBulletExpansionInstructions(format: CVFormat | string): string {
  const policy = getBulletPolicy(format)
  const config = getFormatConfig(format)
  
  return `
BULLET COUNT RULES (STRICT - MUST FOLLOW):
- Minimum: ${policy.minPerRole} bullets per role
- Maximum: ${policy.maxPerRole} bullets per role

BULLET EXPANSION LOGIC (if source CV has fewer bullets):
1. Split long/compound bullets into 2-3 separate bullets
2. Convert responsibilities into outcome-focused bullets using existing evidence
3. If still short, add evidence-safe transferable bullets (NO new tools/metrics/dates)

ALLOWED "safe filler" patterns (no hallucination):
- "Resolved end-user issues using structured troubleshooting and clear documentation to restore service quickly."
- "Collaborated with cross-functional teams to communicate updates, manage expectations, and reduce repeat incidents."
- "Maintained accurate records of support activities and outcomes for reporting and continuous improvement."

NOT ALLOWED:
- Adding tools not in CV (e.g., "ServiceNow", "Jira") unless present in source
- Adding fake metrics (e.g., "reduced downtime by 40%") unless in evidence
- Inventing employers, certifications, or dates
${config.remoteOptimised ? `
REMOTE OPTIMISED EMPHASIS:
- Highlight: async communication, documentation, ticket hygiene, SLA discipline
- Highlight: customer empathy, stakeholder updates, incident triage
- Highlight: prioritization, escalation, handover notes
- Add remote collaboration signals where consistent with role history` : ''}`
}

/**
 * Get summary instructions based on format
 */
export function getSummaryInstructions(format: CVFormat | string, yearsPhrase: string): string {
  const config = getFormatConfig(format)
  const { minWords, maxWords } = config.summaryLength
  
  let instructions = `Write a professional summary (${minWords}-${maxWords} words).
Start with "${yearsPhrase}" and role focus.`

  if (config.remoteOptimised) {
    instructions += `
Include remote-readiness signals: documentation skills, async communication, stakeholder updates.
Example: "...with strong documentation practices and proven ability to support distributed teams."`
  }

  return instructions
}

/**
 * Get skills formatting instructions
 */
export function getSkillsInstructions(format: CVFormat | string): string {
  const config = getFormatConfig(format)
  
  if (config.sections.skills === 'with-remote') {
    return `Group skills by category. Include a "Remote Collaboration" line:
"Remote Support: async updates, stakeholder communication, documentation, handovers"
Only add this if consistent with the resume role context (support roles usually are).`
  }
  
  return `Group skills by category (Core Skills, Technical Skills, Tools & Technologies).`
}

/**
 * Get fix-pass prompt for bullet count failures
 */
export function getFixPassPrompt(
  failures: Array<{ role: string; actual: number; required: number }>,
  format: CVFormat | string
): string {
  const config = getFormatConfig(format)
  
  return `
FIX REQUIRED: The following roles have insufficient bullets:
${failures.map(f => `- "${f.role}": has ${f.actual}, needs ${f.required}`).join('\n')}

EXPAND bullets using these rules:
1. Split compound bullets into separate achievements
2. Convert responsibilities into outcomes using existing evidence
3. Add evidence-safe transferable bullets if needed

STRICT RULES:
- Do NOT invent tools, systems, metrics, or dates
- Do NOT add certifications or employers not in source
- Use only evidence from the original CV
${config.remoteOptimised ? `
For REMOTE OPTIMISED format, emphasize:
- Async communication, documentation, ticket hygiene
- Stakeholder updates, incident triage, handovers` : ''}

Return the corrected CV JSON with all roles meeting the minimum bullet count.`
}

/**
 * Get all available formats for UI dropdown
 */
export function getAvailableFormats(): Array<{
  value: CVFormat
  label: string
  description: string
}> {
  return [
    {
      value: 'ATS-1page',
      label: 'ATS-Friendly Resume (1 Page)',
      description: 'Best for strict ATS + quick applications',
    },
    {
      value: 'ATS-2page',
      label: 'ATS-Friendly Resume (2 Pages)',
      description: 'Best for experienced candidates',
    },
    {
      value: 'REMOTE_OPTIMISED_ATS',
      label: 'Remote Optimised Resume (ATS + Remote-Ready)',
      description: 'Best for remote/hybrid jobs; highlights async communication + documentation',
    },
  ]
}

export default {
  FORMAT_CONFIGS,
  REMOTE_COMPETENCIES,
  REMOTE_SKILLS_LINE,
  SAFE_FILLER_BULLETS,
  mapLegacyFormat,
  getFormatConfig,
  getBulletPolicy,
  getBulletCountForRole,
  validateBulletCounts,
  getBulletExpansionInstructions,
  getSummaryInstructions,
  getSkillsInstructions,
  getFixPassPrompt,
  getAvailableFormats,
}