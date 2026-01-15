/**
 * CV Builder v2 - Elite Prompts
 * 
 * Architecture:
 * - Haiku = generator (writes content, section-by-section, outputs strict JSON)
 * - DeepSeek = validator (checks quality + groundedness + ATS compliance)
 * - Fix-pass: Haiku fixes only what validator flags
 * 
 * Critical Policy:
 * - NEVER invent: metrics, tools, employers, dates, titles, certifications
 * - If evidence missing, use neutral transferable bullets (no specific tools/numbers)
 * 
 * Formats:
 * - ATS-1page: min 5 bullets/role, max 7
 * - ATS-2page: min 8 bullets/role, max 10
 * - REMOTE_OPTIMISED_ATS: min 6 bullets/role, max 8
 */

// ============================================
// SHARED GUARDRAILS (prepend to all prompts)
// ============================================
export const SYSTEM_GUARDRAILS = `
You are a CV compiler. You must be accurate, grounded, and ATS-safe.

HARD RULES (NON-NEGOTIABLE):
- Do NOT invent: metrics, numbers, percentages, tools, certifications, employers, job titles, dates, or achievements.
- If a metric is not in evidence, rewrite WITHOUT a metric.
- If a tool is not in evidence, do NOT mention it.
- Follow experience_level_policy strictly (verbs + tone).
- Meet bullet_minimums by splitting, expanding, or reframing existing evidence, NOT fabricating.
- Output must match the requested JSON shape exactly. No extra commentary.
`

// ============================================
// EXPERIENCE LEVEL POLICIES
// ============================================
export const EXPERIENCE_LEVEL_POLICY = {
  entry: {
    maxYearsLabel: 2,
    allowedVerbs: ['Supported', 'Assisted', 'Resolved', 'Collaborated', 'Handled', 'Documented', 'Escalated', 'Updated', 'Configured', 'Maintained', 'Helped'],
    forbiddenVerbs: ['Led', 'Spearheaded', 'Strategic', 'Architected', 'Owned', 'Directed', 'Mentored', 'Designed', 'Drove', 'Transformed'],
    toneGuidance: 'Focus on learning, contribution, and execution under guidance. Avoid leadership claims. Use humble, growth-oriented language.',
  },
  mid: {
    maxYearsLabel: 5,
    allowedVerbs: ['Delivered', 'Owned', 'Improved', 'Coordinated', 'Resolved', 'Standardized', 'Reduced', 'Managed', 'Implemented', 'Developed'],
    forbiddenVerbs: ['Enterprise-wide strategy', 'Visionary', 'C-level', 'Spearheaded transformation', 'Architected'],
    toneGuidance: 'Balance execution with ownership. Limited leadership language. Show progression.',
  },
  senior: {
    maxYearsLabel: null,
    allowedVerbs: ['Led', 'Designed', 'Optimized', 'Mentored', 'Managed', 'Implemented', 'Architected', 'Spearheaded', 'Drove', 'Transformed', 'Established'],
    forbiddenVerbs: [],
    toneGuidance: 'Leadership and strategic impact allowed. Quantify where evidence exists.',
  },
}

// ============================================
// BULLET MINIMUMS BY FORMAT
// ============================================
export const BULLET_MINIMUMS = {
  'ATS-1page': { min: 5, max: 7 },
  'ATS-2page': { min: 8, max: 10 },
  'REMOTE_OPTIMISED_ATS': { min: 6, max: 8 },
}

// ============================================
// SAFE FILLER BULLETS (no hallucination)
// ============================================
export const SAFE_FILLER_BULLETS = [
  'Documented incidents and resolutions for repeatability and knowledge sharing.',
  'Escalated complex issues with clear context and troubleshooting notes.',
  'Provided end-user guidance and followed up to confirm resolution.',
  'Maintained accurate records of support activities for reporting purposes.',
  'Collaborated with team members to communicate updates and reduce repeat incidents.',
  'Followed established procedures and escalation paths for consistent service delivery.',
  'Prioritized and managed multiple requests while maintaining quality standards.',
  'Participated in team meetings and knowledge sharing sessions.',
]

// Remote-specific safe fillers
export const REMOTE_SAFE_BULLETS = [
  'Provided remote support via chat/email/remote tools, maintaining clear async updates.',
  'Wrote concise handover notes and status updates for stakeholders.',
  'Coordinated with distributed team members across time zones.',
  'Documented processes to enable self-service and reduce support load.',
]

// ============================================
// HAIKU: PROFESSIONAL SUMMARY GENERATOR
// ============================================
export const HAIKU_SUMMARY_SYSTEM = `${SYSTEM_GUARDRAILS}

You write a short, ATS-friendly professional summary.
- 60-100 words, 3-4 sentences
- Match experience level tone strictly
- Do NOT mention niche tools unless explicitly in evidence
- Do NOT invent metrics or achievements
- Use GENERAL industry terms, not specific tool names
`

export const HAIKU_SUMMARY_USER = `
Write a professional summary for a CV.

INPUTS:
- target_role: "{{target_role}}"
- experience_level: "{{experience_level}}"
- years_of_experience: {{years_of_experience}}
- top_keywords: {{keywords}}

EXPERIENCE LEVEL POLICY:
{{experience_level_policy}}

SUMMARY START RULE (CRITICAL):
- If years_of_experience is a NUMBER: start with "{{years_of_experience}}+ years of experience..."
- If years_of_experience is NULL: start with "Experienced {{target_role}} professional..." (NO years mentioned)

STYLE RULES:
- Use GENERAL industry terms, NOT specific tool names
- FORBIDDEN in summary: Galileo, Sabre, ServiceNow, or any niche tool unless it appears in BOTH resume AND JD keywords
- Include 3-5 JD keywords naturally IF supported by resume evidence
- Focus on capabilities and value, not specific past employers
- Match tone strictly to experience level:
  * Entry: learning, contribution, growth-focused
  * Mid: ownership, delivery, progression
  * Senior: leadership, strategy, impact

RESUME EVIDENCE (stay grounded to this):
{{resume_evidence}}

Return JSON only:
{ "summary": "..." }
`

// ============================================
// HAIKU: SKILLS OPTIMIZER
// ============================================
export const HAIKU_SKILLS_SYSTEM = `${SYSTEM_GUARDRAILS}

You create an ATS-friendly grouped skills section.
- Only include skills present in evidence
- If a JD keyword is missing in evidence, do NOT add it
- 20-30 total skills
`

export const HAIKU_SKILLS_USER = `
Create grouped skills for a CV.

INPUTS:
- target_role: "{{target_role}}"
- experience_level: "{{experience_level}}"
- jd_keywords: {{jd_keywords}}

RESUME SKILLS EVIDENCE:
{{resume_skills}}

RESUME EXPERIENCE (for implied skills):
{{resume_experience}}

RULES:
- Only include a skill if:
  A) It appears in resume skills, OR
  B) It appears in resume experience bullets, OR
  C) It is a direct synonym (without implying unproven tools)
- Prioritize JD keywords ONLY when supported by resume evidence
- Do NOT add tools not in evidence (e.g., don't add "ServiceNow" if not mentioned)
- Do NOT add certifications not in evidence

Return JSON only:
{
  "skills": {
    "core": ["skill1", "skill2", ...],
    "technical": ["skill1", "skill2", ...],
    "tools": ["tool1", "tool2", ...],
    "soft": ["skill1", "skill2", ...]
  }
}
`

// ============================================
// HAIKU: EXPERIENCE BULLET ENHANCER
// ============================================
export const HAIKU_BULLETS_SYSTEM = `${SYSTEM_GUARDRAILS}

You rewrite experience bullets for ATS while staying fully grounded.
- Meet minimum bullet counts WITHOUT fabricating achievements
- Use appropriate verbs for experience level
- NEVER invent metrics, percentages, or tools
`

export const HAIKU_BULLETS_USER = `
Enhance bullets for this experience entry.

INPUTS:
- target_role: "{{target_role}}"
- experience_level: "{{experience_level}}"
- cv_format: "{{cv_format}}"
- required_bullets: min {{min_bullets}}, max {{max_bullets}}

EXPERIENCE ENTRY:
- Company: {{company}}
- Role: {{role}}
- Duration: {{start}} - {{end}}
- Original Bullets:
{{original_bullets}}

VERB POLICY FOR {{experience_level}}:
- ALLOWED: {{allowed_verbs}}
- FORBIDDEN: {{forbidden_verbs}}

JD KEYWORDS TO INCLUDE (only if evidence supports):
{{jd_keywords}}

GROUNDEDNESS RULES (CRITICAL):
- NEVER invent numbers, %, $, time savings, volumes unless EXACTLY in original bullets
- NEVER invent tools not mentioned in original bullets
- NEVER use forbidden verbs for this experience level
- If evidence is vague, clarify WITHOUT adding new facts

HOW TO REACH MIN BULLETS WITHOUT INVENTION:
1. Split compound bullets into 2-3 separate bullets
2. Convert "responsible for X" into action + outcome (no metric)
3. Add safe workflow bullets if needed:
   - "Documented incidents and resolutions for repeatability."
   - "Escalated complex issues with clear context."
   - "Provided end-user guidance and confirmed resolution."
   - "Maintained accurate records for reporting purposes."

Return JSON only:
{
  "bullets": [
    {
      "text": "Enhanced bullet text...",
      "is_rewritten": true,
      "groundedness": "EVIDENCE" | "SAFE_INFERENCE"
    }
  ]
}
`

// ============================================
// HAIKU: EDUCATION FORMATTER
// ============================================
export const HAIKU_EDUCATION_SYSTEM = `${SYSTEM_GUARDRAILS}

You format education for ATS CVs.
- Use CV education if present, else use profile education
- NEVER merge both - use one source only
- Do not add or invent degrees/schools
`

export const HAIKU_EDUCATION_USER = `
Format education section.

INPUTS:
- education_from_cv: {{education_from_cv}}
- education_from_profile: {{education_from_profile}}

RULES:
- If education_from_cv is non-empty: use it ONLY (ignore profile completely)
- If education_from_cv is empty: use education_from_profile ONLY
- NEVER combine or merge entries from both sources
- NEVER create hybrid entries like "BSc Computer Science in Computer Science and IT"
- Format: "Degree in Field - School, Year" or "BSc Field - School, Year"

Return JSON only:
{ "education": [{ "degree": "...", "field": "...", "institution": "...", "year": "..." }] }
`

// ============================================
// HAIKU: FIX-PASS (repair validator issues)
// ============================================
export const HAIKU_FIX_PASS_SYSTEM = `${SYSTEM_GUARDRAILS}

You are a CV repair agent. Fix ONLY the reported issues.
- Do NOT rewrite unrelated sections
- Do NOT invent new content
- Remove or neutralize hallucinated claims
`

export const HAIKU_FIX_PASS_USER = `
Fix the CV based on validation failures.

FAILURES TO FIX:
{{failures}}

CURRENT CV JSON:
{{cv_json}}

RESUME EVIDENCE:
{{resume_json}}

FIX STRATEGIES:
- YEARS_WRONG: Remove years, use "Experienced professional..."
- SENIOR_TONE_MISMATCH: Replace verbs with allowed verbs for experience level
- INVENTED_METRIC: Delete metric or rewrite without it
- INVENTED_TOOL: Delete tool mention entirely
- BULLET_COUNT_LOW: Expand using safe inference bullets only
- KEYWORD_COVERAGE_LOW: Swap wording to include JD keywords where evidence supports

Return JSON only:
{ "fixed_cv": {...} }
`

// ============================================
// DEEPSEEK: VALIDATOR
// ============================================
export const DEEPSEEK_VALIDATOR_SYSTEM = `
You are a strict resume quality auditor and hallucination detector.
You do NOT rewrite. You ONLY evaluate and report issues in JSON.

Check for:
- Invented metrics/tools/claims not in evidence
- Bullet counts vs format requirements
- Tone vs experience level (entry using senior verbs = FAIL)
- JD keyword usage vs evidence
`

export const DEEPSEEK_VALIDATOR_USER = `
Validate this CV for quality, groundedness, and ATS compliance.

INPUTS:
- experience_level: "{{experience_level}}"
- cv_format: "{{cv_format}}"
- years_of_experience: {{years_of_experience}}
- target_role: "{{target_role}}"

CV JSON:
{{cv_json}}

RESUME EVIDENCE:
{{resume_json}}

JD JSON (may be null):
{{jd_json}}

VALIDATION RULES:
- HARD FAIL if: 
  * Any hallucinated metric (%, $, numbers not in evidence)
  * Any hallucinated tool (not in evidence)
  * Bullet minimum not met per role
  * Wrong years mentioned when years_of_experience is null
  * Entry-level uses senior verbs (Led/Architected/Spearheaded/Owned strategy)

Return JSON only:
{
  "scores": {
    "groundedness": 0-100,
    "ats_format": 0-100,
    "tone_match": 0-100,
    "keyword_coverage": 0-100,
    "overall": 0-100
  },
  "hard_fails": ["..."],
  "issues": [
    { "type": "HALLUCINATION|TONE|BULLET_COUNT|KEYWORD_GAP", "severity": "low|medium|high", "path": "...", "message": "...", "suggested_fix": "..." }
  ],
  "keyword_coverage": { "matched": ["..."], "missing": ["..."] },
  "verdict": "PASS" | "FIX_REQUIRED"
}
`

// ============================================
// HELPER: Build user prompt with variables
// ============================================
export function buildPrompt(template: string, variables: Record<string, unknown>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? 'null')
    result = result.replaceAll(placeholder, stringValue)
  }
  return result
}

// ============================================
// HELPER: Get experience level policy as string
// ============================================
export function getExperienceLevelPolicyString(level: string): string {
  const policy = EXPERIENCE_LEVEL_POLICY[level as keyof typeof EXPERIENCE_LEVEL_POLICY] || EXPERIENCE_LEVEL_POLICY.mid
  return `
Level: ${level}
Allowed Verbs: ${policy.allowedVerbs.join(', ')}
Forbidden Verbs: ${policy.forbiddenVerbs.join(', ')}
Tone: ${policy.toneGuidance}
`
}

// ============================================
// HELPER: Get bullet requirements for format
// ============================================
export function getBulletRequirements(format: string): { min: number; max: number } {
  return BULLET_MINIMUMS[format as keyof typeof BULLET_MINIMUMS] || BULLET_MINIMUMS['ATS-2page']
}

export default {
  SYSTEM_GUARDRAILS,
  EXPERIENCE_LEVEL_POLICY,
  BULLET_MINIMUMS,
  SAFE_FILLER_BULLETS,
  REMOTE_SAFE_BULLETS,
  HAIKU_SUMMARY_SYSTEM,
  HAIKU_SUMMARY_USER,
  HAIKU_SKILLS_SYSTEM,
  HAIKU_SKILLS_USER,
  HAIKU_BULLETS_SYSTEM,
  HAIKU_BULLETS_USER,
  HAIKU_EDUCATION_SYSTEM,
  HAIKU_EDUCATION_USER,
  HAIKU_FIX_PASS_SYSTEM,
  HAIKU_FIX_PASS_USER,
  DEEPSEEK_VALIDATOR_SYSTEM,
  DEEPSEEK_VALIDATOR_USER,
  buildPrompt,
  getExperienceLevelPolicyString,
  getBulletRequirements,
}
