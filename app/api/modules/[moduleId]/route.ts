import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateModule, deleteModule } from '@/lib/db/modules'
import type { UpdateModuleInput } from '@/types/module'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Helper function to verify user authorization
 */
async function verifyAuthorization(token: string, moduleId: string) {
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

  if (authError || !user) {
    return { authorized: false, error: 'Invalid authentication token', status: 401 }
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('role, is_super_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { authorized: false, error: 'User profile not found', status: 403 }
  }

  // Check if user is instructor or admin
  const isInstructor = profile.role === 'instructor'
  const isAdmin = profile.role === 'admin' || profile.is_super_admin

  if (!isInstructor && !isAdmin) {
    return { authorized: false, error: 'Only instructors and admins can modify modules', status: 403 }
  }

  // Get module to check course ownership
  const { data: module, error: moduleError } = await supabaseClient
    .from('modules')
    .select('course_id')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return { authorized: false, error: 'Module not found', status: 404 }
  }

  // If instructor, verify they own the course
  if (isInstructor && !isAdmin) {
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('instructor_id')
      .eq('id', module.course_id)
      .single()

    if (courseError || !course) {
      return { authorized: false, error: 'Course not found', status: 404 }
    }

    if (course.instructor_id !== user.id) {
      return { authorized: false, error: 'You can only modify modules for your own courses', status: 403 }
    }
  }

  return { authorized: true, user, profile }
}

/**
 * PATCH /api/modules/[moduleId]
 * Update an existing module
 * Requires instructor/admin authentication
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params

    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify authorization
    const authResult = await verifyAuthorization(token, moduleId)
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, description, order_index } = body

    // Validate at least one field is provided
    if (title === undefined && description === undefined && order_index === undefined) {
      return NextResponse.json(
        { success: false, error: 'At least one field must be provided for update' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: UpdateModuleInput = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (order_index !== undefined) updateData.order_index = order_index

    // Update module
    const module = await updateModule(moduleId, updateData)

    return NextResponse.json({
      success: true,
      data: module,
    })
  } catch (error: any) {
    console.error('[PATCH /api/modules/[moduleId]] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update module',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/modules/[moduleId]
 * Delete a module (lessons will be unlinked, not deleted)
 * Requires instructor/admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { moduleId } = params

    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify authorization
    const authResult = await verifyAuthorization(token, moduleId)
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    // Delete module
    await deleteModule(moduleId)

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully. Lessons have been unlinked.',
    })
  } catch (error: any) {
    console.error('[DELETE /api/modules/[moduleId]] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete module',
      },
      { status: 500 }
    )
  }
}
