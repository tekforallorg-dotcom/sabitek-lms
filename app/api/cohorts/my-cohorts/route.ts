import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'
import { getMyCohortsForUser } from '@/lib/cohorts/my-cohorts'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Light JSON, supabase-js only (no Node-only APIs) - safe on the edge.
export const runtime = 'edge'

/**
 * GET /api/cohorts/my-cohorts
 * Returns the current user's cohort enrollments with program + course details.
 *
 * Used on the learner dashboard to show "My Programs & Cohorts".
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    const cohorts = await getMyCohortsForUser(user.id)
    return apiSuccess({ cohorts })
  } catch (error) {
    console.error('My cohorts error:', error)
    return ApiErrors.internal()
  }
}
