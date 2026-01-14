/**
 * CV Builder v2 - Prompt Templates
 * 
 * World-class prompts for:
 * - Resume extraction (CV text → ResumeSchema JSON)
 * - JD extraction (Job Description → JobSchema JSON)
 * - Fix-pass (repair failing sections)
 * - Bullet rewrite (evidence-based improvement)
 * - Summary generation
 * - Skills optimization
 */

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPTS = {
  /**
   * Resume-to-JSON extraction
   */
  resumeExtraction: `You are an information extraction engine specializing in CV/resume parsing.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations, no commentary
2. NEVER invent facts, metrics, tools, employers, dates, or certifications
3. Extract metrics EXACTLY as written (e.g., "99.9%", "200+", "₦1M", "50 tickets/day")
4. If data is missing or unclear, use empty string or empty array
5. Preserve the candidate's actual achievements - do not embellish
6. For each bullet, extract tools[] and metrics[] if mentioned

You are accurate, precise, and never hallucinate.`,

  /**
   * JD-to-JSON extraction
   */
  jdExtraction: `You are a structured job description analyzer specializing in ATS keyword extraction.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations
2. Extract ALL skills, tools, and requirements mentioned
3. Deduplicate items while preserving specificity
4. keywords_top_25 should include skills + tools + concepts that ATS systems match
5. tools_stack should be specific tools/platforms only (e.g., "Active Directory", "ServiceNow", "Azure")
6. Separate must-have from nice-to-have requirements

You are thorough and never miss important keywords.`,

  /**
   * CV generation (summary, skills, experience)
   */
  cvGeneration: `You are an elite CV writer with 20+ years crafting resumes for Fortune 500 executives and top tech companies. You are also an ATS (Applicant Tracking System) optimization expert.

CRITICAL RULES:
1. Output ONLY what is requested - no preamble, no explanations
2. NEVER invent facts, metrics, or achievements not in the source data
3. Use strong action verbs: Led, Spearheaded, Architected, Delivered, Optimized, Implemented
4. Include metrics only if they exist in the source data
5. NO first-person language (I, me, my, we, our)
6. ATS-friendly formatting - no fancy characters or symbols
7. Natural keyword integration - never stuff keywords unnaturally

Your output is professional, impactful, and 100% truthful.`,

  /**
   * Fix-pass (repair failing sections)
   */
  fixPass: `You are a CV quality repair engine. You fix ONLY the failing parts specified.

CRITICAL RULES:
1. Output ONLY valid JSON - same structure as input
2. Fix ONLY what fails validation - keep everything else unchanged
3. NEVER invent new employers, dates, certifications, or metrics
4. If a bullet needs improvement, enhance clarity using existing facts/tools/scope
5. Keep ATS-safe language - no first-person, no emojis, no fancy formatting

You make minimal, targeted fixes.`,

  /**
   * Bullet rewrite (evidence-based)
   */
  bulletRewrite: `You rewrite CV bullets with higher impact while staying 100% truthful.

CRITICAL RULES:
1. Keep it 1 sentence, maximum 28 words
2. Start with a STRONG action verb (Led, Spearheaded, Architected, Delivered, Optimized)
3. Include tool(s) if mentioned in the original
4. Include metric(s) ONLY if provided - NEVER fabricate numbers
5. Tie to JD keywords naturally without stuffing
6. Avoid vague phrasing: "responsible for", "worked on", "helped with"

Your rewrites are powerful, concise, and factually accurate.`,
}

// ============================================
// USER PROMPT TEMPLATES
// ============================================

/**
 * Resume-to-JSON extraction prompt
 */
export function buildResumeExtractionPrompt(rawText: string): string {
  return `TASK:
Convert the following resume/CV text into ResumeSchema JSON.

INPUT TEXT (raw resume):
${rawText.slice(0, 8000)}

OUTPUT REQUIREMENTS:
1) Output valid JSON only — no markdown code blocks
2) Do NOT invent any facts, metrics, tools, employers, dates, roles, certifications
3) Extract metrics exactly as written (e.g., "99.9%", "200+", "₦1M", "50 tickets/day")
4) For each experience bullet:
   - include tools[] if a tool/technology is mentioned
   - include metrics[] if any number appears
   - include tags[] from this set when obvious: ["support","systems","cloud","security","networking","automation","customer","operations","incident","problem","change","asset","monitoring","documentation","training"]
5) If data is missing or unclear, use empty string or empty array
6) Keep bullet text concise, but do not paraphrase away important facts
7) Generate unique IDs for experiences (exp_1, exp_2...) and bullets (b1, b2...)

ResumeSchema (MUST MATCH KEYS EXACTLY):
{
  "basics": {
    "name": "",
    "headline": "",
    "email": "",
    "phone": "",
    "location": "",
    "links": []
  },
  "summary": "",
  "skills": {
    "core": [],
    "technical": [],
    "tools": [],
    "cloud": [],
    "security": [],
    "systems": [],
    "support": [],
    "soft": [],
    "domain": []
  },
  "experience": [
    {
      "id": "exp_1",
      "title": "",
      "company": "",
      "location": "",
      "start": "",
      "end": "",
      "isCurrent": false,
      "bullets": [
        { "id": "b1", "text": "", "tools": [], "metrics": [], "tags": [] }
      ]
    }
  ],
  "projects": [
    { "name": "", "description": "", "tools": [], "metrics": [], "links": [] }
  ],
  "certifications": [
    { "name": "", "issuer": "", "date": "" }
  ],
  "education": [
    { "school": "", "degree": "", "field": "", "start": "", "end": "" }
  ]
}

NOW OUTPUT THE JSON ONLY:`
}

/**
 * JD-to-JSON extraction prompt
 */
export function buildJDExtractionPrompt(jdText: string): string {
  return `TASK:
Convert the following job description into JobSchema JSON.

JOB DESCRIPTION TEXT:
${jdText.slice(0, 5000)}

OUTPUT RULES:
1) Output valid JSON only - no markdown
2) Extract responsibilities, must-have, nice-to-have, keywords_top_25, tools_stack, soft_skills
3) Deduplicate items. Keep items short and specific
4) keywords_top_25 should include skills + tools + concepts that ATS would match (25-35 items)
5) tools_stack should be tools/platforms only (e.g., "Active Directory", "Microsoft 365", "ServiceNow", "Azure", "Jira")
6) Determine level from context: entry, mid, senior, lead, or executive

JobSchema:
{
  "role_title": "",
  "company": "",
  "level": "mid",
  "responsibilities": [],
  "must_have": [],
  "nice_to_have": [],
  "keywords_top_25": [],
  "tools_stack": [],
  "soft_skills": [],
  "industry": ""
}

NOW OUTPUT JSON ONLY:`
}

/**
 * Summary generation prompt
 */
export function buildSummaryPrompt(
  resumeJson: object,
  targetRole: string,
  level: string,
  jdKeywords?: string[]
): string {
  const keywordsSection = jdKeywords?.length 
    ? `\nJD KEYWORDS TO INCORPORATE NATURALLY: ${jdKeywords.slice(0, 15).join(', ')}`
    : ''

  return `TASK:
Write a powerful professional summary for this candidate.

TARGET ROLE: ${targetRole}
LEVEL: ${level}
${keywordsSection}

CANDIDATE DATA (ResumeSchema JSON):
${JSON.stringify(resumeJson, null, 2).slice(0, 4000)}

REQUIREMENTS:
1) 4-5 impactful sentences (80-120 words total)
2) Start with: "[X]+ years experienced [Role] with proven expertise in..."
3) Include 2-3 SPECIFIC achievements or metrics FROM THE DATA (do not invent)
4) Mention 3-4 key technical competencies relevant to target role
5) End with value proposition aligned to target position
6) NO weak phrases: "seeking to", "looking for", "passionate about"
7) NO first person "I" - use implied first person
8) Naturally incorporate relevant keywords

OUTPUT:
Return ONLY the summary text. No quotes, no labels, no explanation.`
}

/**
 * Skills optimization prompt
 */
export function buildSkillsPrompt(
  resumeJson: object,
  targetRole: string,
  jdKeywords?: string[]
): string {
  const keywordsSection = jdKeywords?.length
    ? `\nJD KEYWORDS TO PRIORITIZE: ${jdKeywords.slice(0, 25).join(', ')}`
    : ''

  return `TASK:
Create an optimized, ATS-friendly skills list for this candidate.

TARGET ROLE: ${targetRole}
${keywordsSection}

CANDIDATE DATA:
${JSON.stringify(resumeJson, null, 2).slice(0, 3000)}

REQUIREMENTS:
1) Return 20-30 skills total
2) Group into 3-5 categories with clear labels
3) Order by relevance to target role (most relevant first)
4) Use EXACT industry-standard terminology:
   - "JavaScript" not "JS"
   - "Microsoft Azure" not just "Azure"
   - "Node.js" not "NodeJS"
5) ONLY include skills the candidate ACTUALLY has
6) Mix: Technical (60-70%), Tools (20-30%), Soft skills (10-20%)

OUTPUT JSON ONLY:
[
  { "label": "Category Name", "items": ["Skill 1", "Skill 2", ...] },
  ...
]`
}

/**
 * Experience enhancement prompt
 */
export function buildExperiencePrompt(
  experience: object[],
  targetRole: string,
  jdKeywords?: string[],
  evidenceMap?: object
): string {
  const keywordsSection = jdKeywords?.length
    ? `\nJD KEYWORDS TO INCORPORATE: ${jdKeywords.slice(0, 20).join(', ')}`
    : ''

  const evidenceSection = evidenceMap
    ? `\nEVIDENCE MAP (which keywords are already covered):\n${JSON.stringify(evidenceMap, null, 2).slice(0, 1500)}`
    : ''

  return `TASK:
Transform these work experiences into powerful, ATS-optimized entries.

TARGET ROLE: ${targetRole}
${keywordsSection}
${evidenceSection}

EXPERIENCES TO TRANSFORM:
${JSON.stringify(experience, null, 2)}

ABSOLUTE REQUIREMENTS:
1) MINIMUM 5 bullets for recent roles (first 2), 4 bullets for older roles
2) Each bullet MUST follow: [Strong Action Verb] + [What You Did] + [Context/Scope] + [Result/Impact]
3) Start EVERY bullet with a POWER verb: Led, Spearheaded, Architected, Delivered, Optimized, Implemented, Managed, Developed, Built
4) Include METRICS only if they exist in the original data - NEVER fabricate
5) Vary bullet length - mix detailed (20-25 words) with concise (12-18 words)
6) Align language to target role requirements
7) PRESERVE all original facts, employers, dates, and achievements

OUTPUT JSON ONLY:
[
  {
    "title": "...",
    "company": "...",
    "location": "...",
    "duration": "...",
    "bullets": [
      { "text": "...", "isRewritten": true, "originalId": "b1" },
      ...
    ]
  }
]`
}

/**
 * Fix-pass prompt for repairing failing sections
 */
export function buildFixPassPrompt(
  cvJson: object,
  failures: Array<{ code: string; message: string; section?: string }>,
  resumeJson: object,
  jdJson?: object
): string {
  const failureList = failures.map(f => `- [${f.code}] ${f.message}`).join('\n')
  const jdSection = jdJson
    ? `\nJobSchema JSON (for context):\n${JSON.stringify(jdJson, null, 2).slice(0, 1500)}`
    : ''

  return `TASK:
Fix ONLY the failing parts of the CV JSON below. Keep everything else unchanged.

VALIDATION FAILURES:
${failureList}

CURRENT CV JSON:
${JSON.stringify(cvJson, null, 2)}

REFERENCE DATA (source of truth - facts only):
ResumeSchema JSON:
${JSON.stringify(resumeJson, null, 2).slice(0, 3000)}
${jdSection}

REPAIR RULES:
1) Fix ONLY what fails validation
2) Do NOT invent new employers, dates, certifications, projects, or metrics
3) If a bullet needs a metric but none exist, improve clarity using facts/tools/scope - do not fabricate
4) Keep ATS-safe language. No first-person. No emojis
5) Preserve the exact same JSON structure

OUTPUT:
Return the full corrected CV JSON (same structure as input).
JSON ONLY.`
}

/**
 * Single bullet rewrite prompt
 */
export function buildBulletRewritePrompt(
  bulletText: string,
  tools: string[],
  metrics: string[],
  experienceContext: string,
  targetRole: string,
  jdKeywords: string[]
): string {
  return `TASK:
Rewrite this bullet for maximum ATS impact, based strictly on evidence.

TARGET ROLE: ${targetRole}
JD KEYWORDS (top): ${jdKeywords.slice(0, 10).join(', ')}

EVIDENCE:
- Original bullet text: ${bulletText}
- Tools from resume: ${tools.join(', ') || 'None specified'}
- Metrics from resume: ${metrics.join(', ') || 'None specified'}
- Context (role/company): ${experienceContext}

RULES:
1) Keep it 1 sentence, max 28 words
2) Start with a strong action verb (Led, Spearheaded, Architected, Delivered, Optimized)
3) Include tool(s) if relevant
4) Include metric(s) ONLY if provided - do NOT fabricate
5) Tie to JD keywords naturally, without stuffing
6) Avoid vague phrasing ("responsible for", "worked on")

OUTPUT JSON:
{
  "rewritten": "",
  "used_tools": [],
  "used_metrics": [],
  "included_keywords": [],
  "confidence": 0.0
}`
}

/**
 * Selective tailoring prompt (minimal changes for JD alignment)
 */
export function buildTailoringPrompt(
  cvJson: object,
  resumeJson: object,
  jdJson: object,
  evidenceMap: object
): string {
  return `TASK:
Tailor this CV to the job description with MINIMAL changes. Only update what's necessary.

CURRENT CV JSON:
${JSON.stringify(cvJson, null, 2)}

JOB REQUIREMENTS (JobSchema):
${JSON.stringify(jdJson, null, 2)}

EVIDENCE MAP (what's already covered vs missing):
${JSON.stringify(evidenceMap, null, 2)}

SOURCE DATA (ResumeSchema - source of truth):
${JSON.stringify(resumeJson, null, 2).slice(0, 3000)}

TAILORING RULES:
1) Update ONLY these sections:
   - headline (align to target role)
   - summary (incorporate 2-3 JD keywords naturally)
   - skills ordering (prioritize JD-matched skills first)
   - 2-4 bullets in the most relevant experiences (use evidence map)
2) Do NOT rewrite the entire CV
3) Do NOT invent metrics, tools, or achievements
4) Keep all other content unchanged
5) Every change must be evidence-backed (exists in resume or CV)

OUTPUT:
Return the tailored CV JSON with minimal, targeted changes.
JSON ONLY.`
}

// ============================================
// PROMPT UTILITIES
// ============================================

/**
 * Clean AI response - remove markdown and extra formatting
 */
export function cleanAIResponse(content: string): string {
  let cleaned = content.trim()
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```(?:json|javascript|typescript)?\s*\n?/gi, '')
  cleaned = cleaned.replace(/\n?```\s*$/gi, '')
  
  // Remove leading/trailing quotes if wrapping entire content
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1)
  }
  
  // Remove common prefixes
  cleaned = cleaned.replace(/^(Summary|Professional Summary|Response|Output|Result|JSON):\s*/i, '')
  
  return cleaned.trim()
}

/**
 * Extract JSON from AI response
 */
export function extractJSON(content: string): object | null {
  const cleaned = cleanAIResponse(content)
  
  // Try to find JSON object or array
  const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (!jsonMatch) return null
  
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    // Try to fix common JSON issues
    let fixed = jsonMatch[0]
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/'/g, '"') // Replace single quotes
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
    
    try {
      return JSON.parse(fixed)
    } catch {
      return null
    }
  }
}
