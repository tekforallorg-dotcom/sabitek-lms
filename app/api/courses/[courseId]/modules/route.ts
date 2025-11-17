import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCourseModules, createModule, reorderModules } from '@/lib/db/modules'
import type { CreateModuleInput, ModuleReorderInput } from '@/types/module'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/courses/[courseId]/modules
 * Get all modules for a course with optional progress tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Get modules with lessons and progress
    const modules = await getCourseModules(courseId, userId || undefined)

    return NextResponse.json({
      success: true,
      data: modules,
    })
  } catch (error: any) {
    console.error('[GET /api/courses/[courseId]/modules] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch modules',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses/[courseId]/modules
 * Create a new module for a course
 * Requires instructor/admin authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params

    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Create Supabase client with user's token
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
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 403 }
      )
    }

    // Check if user is instructor or admin
    const isInstructor = profile.role === 'instructor'
    const isAdmin = profile.role === 'admin' || profile.is_super_admin

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only instructors and admins can create modules' },
        { status: 403 }
      )
    }

    // If instructor, verify they own the course
    if (isInstructor && !isAdmin) {
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        )
      }

      if (course.instructor_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You can only create modules for your own courses' },
          { status: 403 }
        )
      }
    }

    // Parse request body
    const body = await request.json()
    const { title, description, order_index } = body

    if (!title || order_index === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, order_index' },
        { status: 400 }
      )
    }

    // Create module
    const moduleData: CreateModuleInput = {
      course_id: courseId,
      title,
      description,
      order_index,
    }

    const module = await createModule(moduleData)

    return NextResponse.json(
      {
        success: true,
        data: module,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[POST /api/courses/[courseId]/modules] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create module',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/courses/[courseId]/modules
 * Reorder modules for a course
 * Requires instructor/admin authentication
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params

    // Get auth token from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Create Supabase client with user's token
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
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 403 }
      )
    }

    // Check if user is instructor or admin
    const isInstructor = profile.role === 'instructor'
    const isAdmin = profile.role === 'admin' || profile.is_super_admin

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only instructors and admins can reorder modules' },
        { status: 403 }
      )
    }

    // If instructor, verify they own the course
    if (isInstructor && !isAdmin) {
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        )
      }

      if (course.instructor_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You can only reorder modules for your own courses' },
          { status: 403 }
        )
      }
    }

    // Parse request body
    const body = await request.json()
    const { moduleOrders } = body as { moduleOrders: ModuleReorderInput[] }

    if (!Array.isArray(moduleOrders) || moduleOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid moduleOrders array' },
        { status: 400 }
      )
    }

    // Validate each module order entry
    for (const item of moduleOrders) {
      if (!item.id || item.order_index === undefined) {
        return NextResponse.json(
          { success: false, error: 'Each module order must have id and order_index' },
          { status: 400 }
        )
      }
    }

    // Reorder modules
    await reorderModules(courseId, moduleOrders)

    return NextResponse.json({
      success: true,
      message: 'Modules reordered successfully',
    })
  } catch (error: any) {
    console.error('[PATCH /api/courses/[courseId]/modules] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reorder modules',
      },
      { status: 500 }
    )
  }
}
