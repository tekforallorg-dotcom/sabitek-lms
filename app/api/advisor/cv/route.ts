import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executeAdvisorOperation, generateInputHash } from '@/lib/advisor/pricing'

// Import new CV Builder v2 pipeline
import {
  buildCV as pipelineBuildCV,
  tailorCV as pipelineTailorCV,
  type CVData,
  type BuildCVInput,
  type TailorCVInput,
  type CVFailure,
} from '@/lib/cv'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// CV Section structure for database storage (matches existing schema)
interface CVSections {
  summary?: string
  skills?: string[]
  experience?: Array<{
    company: string
    title: string
    duration: string
    location?: string
    bullets: string[]
  }>
  projects?: Array<{
    name: string
    description: string
    technologies?: string[]
  }>
  education?: Array<{
    institution: string
    degree: string
    year: string
  }>
  certifications?: Array<{
    name: string
    issuer: string
    year?: string
  }>
}

// ============================================
// GET - Fetch user's CV documents
// ============================================

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const { data: cv, error } = await supabaseAdmin
        .from('cv_documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !cv) {
        return NextResponse.json({ error: 'CV not found' }, { status: 404 })
      }

      return NextResponse.json({ cv })
    }

    const { data: cvs, error } = await supabaseAdmin
      .from('cv_documents')
      .select('id, title, target_role, level, format, status, ats_score, version, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('CV fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch CVs' }, { status: 500 })
    }

    return NextResponse.json({ cvs })

  } catch (error) {
    console.error('CV API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST - Create/generate CV
// ============================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      action = 'build',
      targetRole,
      level = 'mid',
      region = 'global',
      format = 'ats-1page',
      jobDescription,
      uploadedCVText,
      extraInstructions,
      cvId,
      sectionToRewrite
    } = body

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('career_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'Please complete your career profile first',
        requiresProfile: true 
      }, { status: 400 })
    }

    if (profile.profile_completeness < 30) {
      return NextResponse.json({ 
        error: 'Please add more information to your profile (at least 30% complete)',
        profileCompleteness: profile.profile_completeness,
        requiresProfile: true 
      }, { status: 400 })
    }

    // Handle different actions
    switch (action) {
      case 'build':
        return await handleBuildCV(user.id, profile, { 
          targetRole, level, region, format, uploadedCVText, extraInstructions 
        })
      
      case 'tailor':
  if (!jobDescription) {
    return NextResponse.json({ error: 'Job description is required for tailoring' }, { status: 400 })
  }
        return await handleTailorCV(user.id, profile, cvId, jobDescription || '', { 
          targetRole, level, region, format, uploadedCVText 
        })
      
      case 'rewrite_section':
        if (!cvId || !sectionToRewrite) {
          return NextResponse.json({ error: 'CV ID and section name required' }, { status: 400 })
        }
        return await handleRewriteSection(user.id, cvId, sectionToRewrite)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('CV API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// BUILD CV - Using new pipeline
// ============================================

async function handleBuildCV(
  userId: string,
  profile: Record<string, unknown>,
  settings: { 
    targetRole: string
    level: string
    region: string
    format: string
    uploadedCVText?: string
    extraInstructions?: string 
  }
) {
  const { targetRole, level, region, format, uploadedCVText, extraInstructions } = settings

  if (!targetRole) {
    return NextResponse.json({ error: 'Target role is required' }, { status: 400 })
  }

  const inputForCache = {
    profileId: profile.id,
    profileUpdatedAt: profile.updated_at,
    targetRole,
    level,
    region,
    format,
    hasUploadedCV: !!uploadedCVText,
    extraInstructionsHash: extraInstructions ? generateInputHash({ ei: extraInstructions }) : null
  }

  const result = await executeAdvisorOperation(supabaseAdmin, {
    userId,
    operationType: 'cv_build',
    module: 'cv',
    inputForCache,
    inputSummary: { targetRole, level, format },
    executor: async () => {
      console.log('🚀 Starting CV Builder v2 pipeline (BUILD)...')
      
      // Prepare input for new pipeline
      const pipelineInput: BuildCVInput = {
        profile,
        uploadedCVText,
        targetRole,
        level: level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive',
        region,
        format,
        extraInstructions,
      }

      // Run the new pipeline
      const pipelineResult = await pipelineBuildCV(pipelineInput)

      if (!pipelineResult.success || !pipelineResult.cv) {
        throw new Error(pipelineResult.error || 'CV generation failed')
      }

      console.log(`✅ Pipeline complete! Quality: ${pipelineResult.qualityScore}, ATS: ${pipelineResult.atsScore}`)

      // Convert CVData to CVSections format for database storage
      const sections = convertToSections(pipelineResult.cv)

      // Extract keywords from the CV for storage
      const keywords = pipelineResult.cv.ats.matched_keywords || []

      // Mark previous versions as not current
      await supabaseAdmin
        .from('cv_documents')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('target_role', targetRole)

      // Save to database
      const { data: cv, error } = await supabaseAdmin
        .from('cv_documents')
        .insert({
          user_id: userId,
          profile_id: profile.id,
          target_role: targetRole,
          level,
          region,
          format,
          sections,
          job_description_keywords: keywords,
          title: `${targetRole} CV`,
          status: 'complete',
          ats_score: pipelineResult.atsScore,
          version: 1,
          is_current: true
        })
        .select('*')
        .single()

      if (error) throw error

      console.log('🎉 CV saved! ATS Score:', pipelineResult.atsScore)

      // Return with validation info
      const validation = {
        score: pipelineResult.qualityScore,
        issues: pipelineResult.failures.map((f: CVFailure) => ({
          section: f.section || 'general',
          message: f.message,
          severity: f.severity,
        })),
      }

      return {
        outputId: cv.id,
        outputTable: 'cv_documents',
        data: { 
          ...cv, 
          validation,
          ats: pipelineResult.cv.ats,
          _missingMetricsQuestions: pipelineResult.missingMetricsQuestions,
          _aiProvider: pipelineResult.aiProvider,
        }
      }
    }
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    cv: result.data,
    charged: result.costFormatted,
    newBalance: result.newBalanceFormatted,
    cached: result.cached,
    missingMetricsQuestions: result.data?._missingMetricsQuestions,
    aiProvider: result.data?._aiProvider,
  })
}

// ============================================
// TAILOR CV - Using new pipeline with evidence mapping
// ============================================

async function handleTailorCV(
  userId: string,
  profile: Record<string, unknown>,
  existingCvId: string | undefined,
  jobDescription: string,
  settings: { 
    targetRole: string
    level: string
    region: string
    format: string
    uploadedCVText?: string 
  }
) {
  const { targetRole, level, region, format, uploadedCVText } = settings

  const inputForCache = {
    profileId: profile.id,
    profileUpdatedAt: profile.updated_at,
    jdHash: jobDescription ? generateInputHash({ jd: jobDescription.slice(0, 1000) }) : null,
    targetRole,
    hasUploadedCV: !!uploadedCVText
  }

  const result = await executeAdvisorOperation(supabaseAdmin, {
    userId,
    operationType: 'cv_tailor',
    module: 'cv',
    inputForCache,
    inputSummary: { targetRole, level, format },
    executor: async () => {
      console.log('🎯 Starting CV Builder v2 pipeline (TAILOR)...')
      
      // Prepare input for new pipeline
      const pipelineInput: TailorCVInput = {
        profile,
        uploadedCVText,
        targetRole,
        level: level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive',
        region,
        format,
        jobDescription,
      }

      // Run the new tailoring pipeline
      const pipelineResult = await pipelineTailorCV(pipelineInput)

      if (!pipelineResult.success || !pipelineResult.cv) {
        throw new Error(pipelineResult.error || 'CV tailoring failed')
      }

      console.log(`✅ Tailoring complete! Quality: ${pipelineResult.qualityScore}, ATS: ${pipelineResult.atsScore}`)
      console.log(`📊 Evidence Map: ${pipelineResult.evidenceMap?.coverage_percentage || 0}% keyword coverage`)

      // Convert CVData to CVSections format
      const sections = convertToSections(pipelineResult.cv)

      // Extract keywords
      const keywords = pipelineResult.cv.ats.matched_keywords || []

      // Mark previous versions as not current
      await supabaseAdmin
        .from('cv_documents')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('target_role', targetRole)

      // Save to database
      const { data: cv, error } = await supabaseAdmin
        .from('cv_documents')
        .insert({
          user_id: userId,
          profile_id: profile.id,
          target_role: targetRole,
          level,
          region,
          format,
          sections,
          job_description_text: jobDescription,
          job_description_keywords: keywords,
          title: `${targetRole} CV (Tailored)`,
          status: 'complete',
          ats_score: pipelineResult.atsScore,
          version: 1,
          is_current: true,
          parent_version_id: existingCvId || null
        })
        .select('*')
        .single()

      if (error) throw error

      console.log('🎉 Tailored CV saved! ATS Score:', pipelineResult.atsScore)

      const validation = {
        score: pipelineResult.qualityScore,
        issues: pipelineResult.failures.map((f: CVFailure) => ({
          section: f.section || 'general',
          message: f.message,
          severity: f.severity,
        })),
      }

      // Include evidence map summary in response
      const evidenceSummary = pipelineResult.evidenceMap ? {
        coveragePercentage: pipelineResult.evidenceMap.coverage_percentage,
        coveredKeywords: pipelineResult.evidenceMap.covered_keywords.length,
        missingKeywords: pipelineResult.evidenceMap.missing_keywords.slice(0, 10),
        toolsMatched: pipelineResult.evidenceMap.tools_matched,
        toolsMissing: pipelineResult.evidenceMap.tools_missing,
      } : null

      return {
       outputId: cv.id,
        outputTable: 'cv_documents',
        data: { 
          ...cv, 
          validation, 
          evidenceSummary,
          ats: pipelineResult.cv.ats,
          _missingMetricsQuestions: pipelineResult.missingMetricsQuestions,
          _aiProvider: pipelineResult.aiProvider,
          _roleDiff: pipelineResult.roleDiff,
        }
      }
    }
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    cv: result.data,
    charged: result.costFormatted,
    newBalance: result.newBalanceFormatted,
    cached: result.cached,
    missingMetricsQuestions: result.data?._missingMetricsQuestions,
    aiProvider: result.data?._aiProvider,
    roleDiff: result.data?._roleDiff,
  })
}

// ============================================
// REWRITE SECTION - Simple AI call
// ============================================

async function handleRewriteSection(
  userId: string,
  cvId: string,
  sectionName: string
) {
  const { data: existingCv, error: cvError } = await supabaseAdmin
    .from('cv_documents')
    .select('*')
    .eq('id', cvId)
    .eq('user_id', userId)
    .single()

  if (cvError || !existingCv) {
    return NextResponse.json({ error: 'CV not found' }, { status: 404 })
  }

  const result = await executeAdvisorOperation(supabaseAdmin, {
    userId,
    operationType: 'cv_rewrite_section',
    module: 'cv',
    skipCache: true,
    inputSummary: { cvId, section: sectionName },
    executor: async () => {
      const currentSections = existingCv.sections as CVSections
      
      // Simple AI call for section rewrite
      const newSection = await rewriteSectionWithAI(
        sectionName, 
        currentSections[sectionName as keyof CVSections],
        existingCv.target_role
      )

      const updatedSections = {
        ...currentSections,
        [sectionName]: newSection
      }

      const { data: cv, error } = await supabaseAdmin
        .from('cv_documents')
        .update({
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', cvId)
        .select('*')
        .single()

      if (error) throw error

      return {
        outputId: cv.id,
        outputTable: 'cv_documents',
        data: cv
      }
    }
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    cv: result.data,
    charged: result.costFormatted,
    newBalance: result.newBalanceFormatted
  })
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert CVData (new format) to CVSections (database format)
 */
function convertToSections(cvData: CVData): CVSections {
  return {
    summary: cvData.summary,
    skills: cvData.skills.flatMap((group: { label: string; items: string[] }) => group.items),
    experience: cvData.experience.map((exp: {
      title?: string
      company?: string
      duration?: string
      location?: string
      bullets: { text: string }[]
    }) => ({
      company: exp.company || '',
      title: exp.title || '',
      duration: exp.duration || '',
      location: exp.location,
      bullets: exp.bullets.map((b: { text: string }) => b.text),
    })),
    projects: cvData.projects.map((proj: {
      name?: string
      description?: string
      technologies?: string[]
    }) => ({
      name: proj.name || '',
      description: proj.description || '',
      technologies: proj.technologies,
    })),
    education: cvData.education.map((edu: {
      institution?: string
      degree?: string
      year?: string
    }) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      year: edu.year || '',
    })),
    certifications: cvData.certifications.map((cert: {
      name?: string
      issuer?: string
      year?: string
    }) => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      year: cert.year,
    })),
  }
}

/**
 * Simple AI call for section rewriting
 */
async function rewriteSectionWithAI(
  sectionName: string,
  currentContent: unknown,
  targetRole: string
): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
  }

  const prompt = `Improve this ${sectionName} section for a ${targetRole} CV.

REQUIREMENTS:
- Make it more impactful with action verbs and achievements
- Add quantifiable metrics where reasonable
- Use professional, ATS-friendly language
- Keep factual accuracy
- Do NOT invent new facts

Current ${sectionName}:
${JSON.stringify(currentContent, null, 2)}

Return improved content in the same JSON structure. Output JSON only, no explanation.`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an elite CV writer. Output JSON only, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Try to parse JSON from response
    const jsonMatch = content.match(/[\[{][\s\S]*[\]}]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Section rewrite error:', error)
  }

  // Return original if rewrite fails
  return currentContent
}