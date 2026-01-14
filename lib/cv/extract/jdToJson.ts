/**
 * CV Builder v2 - Job Description Extraction Service
 * 
 * Extracts structured JobSchema from raw JD text
 * - Uses AI for intelligent extraction
 * - Validates output with Zod
 * - Extracts keywords, requirements, and tools
 */

import { JobSchema, JobSchemaZ, safeParseJobSchema } from '../schemas'
import { SYSTEM_PROMPTS, buildJDExtractionPrompt, extractJSON } from '../prompts'

// ============================================
// CONFIGURATION
// ============================================

const AI_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  maxRetries: 2,
  retryDelayMs: 1000,
  maxTokens: 2500,
  temperature: 0.3,
}

// ============================================
// AI CALL FUNCTION
// ============================================

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = AI_CONFIG.maxTokens
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📋 JD extraction - Attempt ${attempt}/${AI_CONFIG.maxRetries}`)
      
      const response = await fetch(AI_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: AI_CONFIG.temperature,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`AI API error: ${response.status}`, errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      if (!content || content.trim().length < 50) {
        throw new Error('Empty or too short response')
      }

      console.log(`✅ JD extraction completed (${data.usage?.total_tokens || 0} tokens)`)
      return content

    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error)
      
      if (attempt < AI_CONFIG.maxRetries) {
        const delay = AI_CONFIG.retryDelayMs * attempt
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error('JD extraction failed after all retries')
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

export interface JDExtractionResult {
  success: boolean
  job?: JobSchema
  error?: string
  warnings: string[]
}

/**
 * Extract structured JobSchema from raw JD text
 */
export async function extractJDFromText(jdText: string): Promise<JDExtractionResult> {
  const warnings: string[] = []
  
  // Pre-validation
  if (!jdText || jdText.trim().length < 50) {
    return {
      success: false,
      error: 'Job description text is too short',
      warnings: ['Minimum 50 characters required'],
    }
  }

  // Check for minimum content
  const wordCount = jdText.split(/\s+/).length
  if (wordCount < 30) {
    warnings.push('Very short job description - extraction may be incomplete')
  }

  try {
    // Build prompt and call AI
    const userPrompt = buildJDExtractionPrompt(jdText)
    const response = await callAI(
      SYSTEM_PROMPTS.jdExtraction,
      userPrompt,
      AI_CONFIG.maxTokens
    )

    // Extract and parse JSON
    const jsonData = extractJSON(response)
    if (!jsonData) {
      // Try fallback extraction
      const fallbackJob = fallbackJDExtraction(jdText)
      if (fallbackJob.keywords_top_25.length > 0) {
        warnings.push('Used fallback extraction - results may be less accurate')
        return {
          success: true,
          job: fallbackJob,
          warnings,
        }
      }
      
      return {
        success: false,
        error: 'Failed to extract valid JSON from AI response',
        warnings,
      }
    }

    // Validate with Zod
   const parseResult = safeParseJobSchema(jsonData)
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        error: `Schema validation failed: ${parseResult.error}`,
        warnings,
      }
    }


    const job = parseResult.data

    // Post-extraction quality checks
    if (!job.role_title) {
      warnings.push('Could not extract job title')
    }
    if (job.keywords_top_25.length < 5) {
      warnings.push('Few keywords extracted - JD may be too brief')
    }
    if (job.must_have.length === 0 && job.responsibilities.length === 0) {
      warnings.push('No requirements or responsibilities extracted')
    }

    // Deduplicate and clean
    job.keywords_top_25 = deduplicateKeywords(job.keywords_top_25)
    job.tools_stack = deduplicateKeywords(job.tools_stack)

    return {
      success: true,
      job,
      warnings,
    }

  } catch (error) {
    // Try fallback extraction on error
    const fallbackJob = fallbackJDExtraction(jdText)
    if (fallbackJob.keywords_top_25.length >= 5) {
      warnings.push('AI extraction failed - used fallback extraction')
      return {
        success: true,
        job: fallbackJob,
        warnings,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
      warnings,
    }
  }
}

// ============================================
// FALLBACK EXTRACTION (No AI)
// ============================================

/**
 * Extract JD data without AI - used as fallback
 */
function fallbackJDExtraction(jdText: string): JobSchema {
  const text = jdText.toLowerCase()
  
  // Extract job title from common patterns
  const titleMatch = jdText.match(/(?:position|role|job\s*title|title)\s*[:\-]\s*([^\n]+)/i)
    || jdText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/m)
  const role_title = titleMatch ? titleMatch[1].trim() : ''

  // Extract company
  const companyMatch = jdText.match(/(?:company|organization|employer)\s*[:\-]\s*([^\n]+)/i)
  const company = companyMatch ? companyMatch[1].trim() : ''

  // Determine level
  let level: JobSchema['level'] = 'mid'
  if (/\b(junior|entry|graduate|trainee)\b/i.test(text)) level = 'entry'
  if (/\b(senior|sr\.|lead|principal)\b/i.test(text)) level = 'senior'
  if (/\b(manager|head|director|vp|chief)\b/i.test(text)) level = 'lead'
  if (/\b(executive|c-level|cto|cio|cfo)\b/i.test(text)) level = 'executive'

  // Extract keywords using common patterns
  const keywords = extractKeywordsFromText(jdText)
  const tools = extractToolsFromText(jdText)
  const softSkills = extractSoftSkillsFromText(jdText)

  // Extract responsibilities (lines starting with bullets or action verbs)
  const responsibilities = extractBulletPoints(jdText)
    .filter(r => r.length > 20 && r.length < 200)
    .slice(0, 10)

  // Extract requirements
  const reqSection = jdText.match(/(?:requirements?|qualifications?|must\s*have)[:\s]*([\s\S]*?)(?=(?:nice|preferred|benefits|about|$))/i)
  const must_have = reqSection 
    ? extractBulletPoints(reqSection[1]).slice(0, 10)
    : []

  const niceSection = jdText.match(/(?:nice\s*to\s*have|preferred|bonus)[:\s]*([\s\S]*?)(?=(?:benefits|about|$))/i)
  const nice_to_have = niceSection
    ? extractBulletPoints(niceSection[1]).slice(0, 5)
    : []

  return {
    role_title,
    company,
    level,
    responsibilities,
    must_have,
    nice_to_have,
    keywords_top_25: keywords.slice(0, 30),
    tools_stack: tools,
    soft_skills: softSkills,
    industry: '',
  }
}

/**
 * Extract keywords from JD text
 */
function extractKeywordsFromText(text: string): string[] {
  const keywords: Set<string> = new Set()
  
  // Technical skills patterns
  const techPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|php|sql|html|css)\b/gi,
    /\b(react|angular|vue|node\.?js|express|django|flask|spring|\.net)\b/gi,
    /\b(aws|azure|gcp|google cloud|amazon web services|cloud)\b/gi,
    /\b(docker|kubernetes|k8s|jenkins|terraform|ansible|ci\/cd)\b/gi,
    /\b(mongodb|postgresql|mysql|redis|elasticsearch|dynamodb)\b/gi,
    /\b(rest|graphql|api|microservices|serverless)\b/gi,
    /\b(git|github|gitlab|bitbucket|jira|confluence)\b/gi,
    /\b(active directory|ad|office 365|microsoft 365|m365|exchange)\b/gi,
    /\b(servicenow|zendesk|freshdesk|helpdesk|service desk)\b/gi,
    /\b(itil|agile|scrum|devops|sla|kpi)\b/gi,
    /\b(networking|tcp\/ip|dns|dhcp|vpn|firewall|cisco)\b/gi,
    /\b(windows server|linux|ubuntu|centos|unix)\b/gi,
    /\b(powershell|bash|scripting|automation)\b/gi,
    /\b(security|cybersecurity|infosec|compliance|gdpr)\b/gi,
  ]

  for (const pattern of techPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(m => keywords.add(m.trim()))
    }
  }

  // Also extract capitalized multi-word terms (likely proper nouns/tools)
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g)
  if (properNouns) {
    properNouns
      .filter(n => n.length > 3 && n.length < 30)
      .forEach(n => keywords.add(n))
  }

  return [...keywords]
}

/**
 * Extract tools/technologies from JD text
 */
function extractToolsFromText(text: string): string[] {
  const tools: Set<string> = new Set()
  
  const toolPatterns = [
    // Microsoft stack
    /\b(Active Directory|Azure AD|Microsoft 365|Office 365|Exchange|SharePoint|Teams|Intune|Endpoint Manager)\b/gi,
    // Cloud platforms
    /\b(AWS|Amazon Web Services|Azure|Google Cloud|GCP|Oracle Cloud)\b/gi,
    // ITSM tools
    /\b(ServiceNow|Jira|Zendesk|Freshdesk|ManageEngine|SolarWinds|Splunk)\b/gi,
    // Networking
    /\b(Cisco|Juniper|Palo Alto|Fortinet|F5|VMware|Hyper-V)\b/gi,
    // Monitoring
    /\b(Nagios|Zabbix|Prometheus|Grafana|Datadog|New Relic|Dynatrace)\b/gi,
    // Development
    /\b(Git|GitHub|GitLab|Bitbucket|Jenkins|Docker|Kubernetes)\b/gi,
  ]

  for (const pattern of toolPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(m => tools.add(m.trim()))
    }
  }

  return [...tools]
}

/**
 * Extract soft skills from JD text
 */
function extractSoftSkillsFromText(text: string): string[] {
  const softSkills: Set<string> = new Set()
  
  const patterns = [
    /\b(communication skills?|verbal communication|written communication)\b/gi,
    /\b(teamwork|team player|collaboration|collaborative)\b/gi,
    /\b(problem.?solving|analytical|critical thinking)\b/gi,
    /\b(leadership|team lead|mentoring|coaching)\b/gi,
    /\b(customer service|client.?facing|stakeholder management)\b/gi,
    /\b(time management|prioritization|multitasking)\b/gi,
    /\b(attention to detail|detail.?oriented|meticulous)\b/gi,
    /\b(adaptability|flexible|self.?motivated)\b/gi,
    /\b(proactive|initiative|self.?starter)\b/gi,
    /\b(documentation|technical writing)\b/gi,
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(m => softSkills.add(m.trim()))
    }
  }

  return [...softSkills]
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const points: string[] = []
  const pattern = /^[\s•\-\*]\s*(.+)/gm
  let match
  
  while ((match = pattern.exec(text)) !== null) {
    const point = match[1].trim()
    if (point.length > 10) {
      points.push(point)
    }
  }

  // If no bullets found, try splitting by newlines
  if (points.length === 0) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20 && line.length < 200)
      .slice(0, 10)
  }

  return points
}

/**
 * Deduplicate keywords while preserving order
 */
function deduplicateKeywords(keywords: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  
  for (const keyword of keywords) {
    const normalized = keyword.toLowerCase().trim()
    if (!seen.has(normalized) && normalized.length > 1) {
      seen.add(normalized)
      result.push(keyword.trim())
    }
  }
  
  return result
}

// ============================================
// QUICK KEYWORD EXTRACTION (No AI needed)
// ============================================

/**
 * Quick extraction of keywords without full AI processing
 * Use when you just need keywords for evidence mapping
 */
export function quickExtractKeywords(jdText: string): {
  keywords: string[]
  tools: string[]
  softSkills: string[]
} {
  return {
    keywords: extractKeywordsFromText(jdText),
    tools: extractToolsFromText(jdText),
    softSkills: extractSoftSkillsFromText(jdText),
  }
}
