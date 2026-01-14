import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executeAdvisorOperation, generateInputHash } from '@/lib/advisor/pricing'
import {
  buildCoverLetter,
  tailorCoverLetter,
  type BuildCoverLetterInput,
  type TailorCoverLetterInput,
  type CoverLetterDocument,
} from '@/lib/cover-letter'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// GET - Fetch user's cover letters
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

    // Fetch single cover letter by ID
    if (id) {
      const { data: letter, error } = await supabaseAdmin
        .from('cover_letter_documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !letter) {
        return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 })
      }

      return NextResponse.json({ letter })
    }

    // Fetch all cover letters for user
    const { data: letters, error } = await supabaseAdmin
      .from('cover_letter_documents')
      .select('id, target_role, company_name, tone, length, status, action, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Cover letter fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch cover letters' }, { status: 500 })
    }

    return NextResponse.json({ letters })

  } catch (error) {
    console.error('Cover Letter API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST - Generate or tailor cover letter
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
      action,
      targetRole,
      companyName,
      tone,
      length,
      jobDescription,
      uploadedCVText,
      extraInfo,
      oldCoverLetter,
      whatChanged,
    } = body

    // Validation
    if (!action || !['build', 'tailor'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "build" or "tailor".' }, { status: 400 })
    }

    if (!targetRole || targetRole.trim().length < 2) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 })
    }

    if (action === 'tailor' && (!oldCoverLetter || oldCoverLetter.trim().length < 100)) {
      return NextResponse.json({ error: 'Existing cover letter is required for tailoring' }, { status: 400 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('career_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
    }

    // Build profile object
    const profileData: Record<string, unknown> = profile || {}
    
    // If no profile, try to get basic user info
    if (!profile) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        profileData.full_name = userData.full_name
        profileData.email = userData.email
      }
    }

    // Prepare input for caching
    const inputForCache = {
      action,
      targetRole,
      companyName,
      tone,
      length,
      jobDescription: jobDescription?.substring(0, 500),
      oldCoverLetter: oldCoverLetter?.substring(0, 500),
    }

    // Determine operation type for pricing
    const operationType = action === 'build' ? 'cover_generate' : 'cover_personalize'

    // Execute with pricing (matching CV route signature)
    const result = await executeAdvisorOperation(supabaseAdmin, {
      userId: user.id,
      operationType,
      module: 'cover_letter',
      inputForCache,
      inputSummary: { targetRole, companyName, tone, length },
      executor: async () => {
        let generationResult

        // Build the cover letter
        if (action === 'build') {
          const input: BuildCoverLetterInput = {
            profile: profileData,
            targetRole: targetRole.trim(),
            companyName: companyName?.trim(),
            tone: tone || 'professional',
            length: length || 'standard',
            jobDescription: jobDescription?.trim(),
            uploadedCVText: uploadedCVText?.trim(),
            extraInfo: extraInfo?.trim(),
          }

          generationResult = await buildCoverLetter(input)
          
          if (!generationResult.success || !generationResult.letter) {
            throw new Error(generationResult.error || 'Failed to generate cover letter')
          }
        } 
        // Tailor the cover letter
        else {
          const input: TailorCoverLetterInput = {
            profile: profileData,
            targetRole: targetRole.trim(),
            companyName: companyName?.trim(),
            tone: tone || 'professional',
            length: length || 'standard',
            jobDescription: jobDescription?.trim(),
            uploadedCVText: uploadedCVText?.trim(),
            extraInfo: extraInfo?.trim(),
            oldCoverLetter: oldCoverLetter.trim(),
            whatChanged: whatChanged?.trim(),
          }

          generationResult = await tailorCoverLetter(input)
          
          if (!generationResult.success || !generationResult.letter) {
            throw new Error(generationResult.error || 'Failed to tailor cover letter')
          }
        }

        // Save to database
        const { data: savedLetter, error: saveError } = await supabaseAdmin
          .from('cover_letter_documents')
          .insert({
            user_id: user.id,
            target_role: targetRole.trim(),
            company_name: companyName?.trim() || null,
            tone: tone || 'professional',
            length: length || 'standard',
            letter_text: generationResult.letter.letterText,
            sections: generationResult.letter.sections,
            insights: generationResult.letter.insights,
            status: 'completed',
            action,
            version: 1,
            is_current: true,
          })
          .select()
          .single()

        if (saveError) {
          console.error('Save error:', saveError)
        }

        console.log(`🎉 Cover Letter saved! Quality: ${generationResult.qualityScore}`)

        return {
          outputId: savedLetter?.id || 'temp-id',
          outputTable: 'cover_letter_documents',
          data: {
            letter: {
              ...generationResult.letter,
              id: savedLetter?.id,
            },
            qualityScore: generationResult.qualityScore,
            qualityIssues: generationResult.qualityCheck?.issues || [],
            warnings: generationResult.warnings,
            missingMetricsQuestions: generationResult.missingMetricsQuestions,
          },
        }
      },
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Operation failed' },
        { status: result.error?.includes('Insufficient') ? 402 : 500 }
      )
    }

    // Extract data from result
    const data = result.data as {
      letter: CoverLetterDocument & { id?: string }
      qualityScore: number
      qualityIssues: Array<{ message: string }>
      warnings: string[]
      missingMetricsQuestions?: string[]
    }

    return NextResponse.json({
      success: true,
      letter: data.letter,
      qualityScore: data.qualityScore,
      qualityIssues: data.qualityIssues,
      warnings: data.warnings,
      missingMetricsQuestions: data.missingMetricsQuestions,
      charged: result.costFormatted,
      cached: result.cached,
      newBalance: result.newBalanceFormatted,
    })

  } catch (error) {
    console.error('Cover Letter generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Remove a cover letter
// ============================================
export async function DELETE(request: NextRequest) {
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

    if (!id) {
      return NextResponse.json({ error: 'Cover letter ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('cover_letter_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete cover letter' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}