import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Public cohort landing data for vanity links (sabitek.app/join/<slug>).
 * Returns branding + enrollment shape only - no member data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select(
        'id, name, slug, description, status, enrollment_mode, seat_limit, start_date, end_date, enrollment_start_date, enrollment_end_date, program_id'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (!cohort || cohort.status === 'archived') {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
    }

    const [programRes, seatsRes] = await Promise.all([
      supabaseAdmin
        .from('programs')
        .select('id, name, short_description, institution_id, institutions(name, logo_url, accent_color, banner_url)')
        .eq('id', cohort.program_id)
        .single(),
      supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact', head: true })
        .eq('cohort_id', cohort.id)
        .eq('status', 'active'),
    ])

    const program = programRes.data as any
    const courseCountRes = program
      ? await supabaseAdmin
          .from('program_courses')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', program.id)
      : { count: 0 }

    const seatsTaken = seatsRes.count ?? 0

    return NextResponse.json({
      cohort: {
        id: cohort.id,
        name: cohort.name,
        slug: cohort.slug,
        description: cohort.description,
        status: cohort.status,
        enrollment_mode: cohort.enrollment_mode,
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        enrollment_start_date: cohort.enrollment_start_date,
        enrollment_end_date: cohort.enrollment_end_date,
        seat_limit: cohort.seat_limit,
        seats_taken: seatsTaken,
        seats_left: cohort.seat_limit ? Math.max(0, cohort.seat_limit - seatsTaken) : null,
      },
      program: program
        ? {
            name: program.name,
            short_description: program.short_description,
            course_count: courseCountRes.count ?? 0,
          }
        : null,
      institution: program?.institutions
        ? {
            name: program.institutions.name,
            logo_url: program.institutions.logo_url,
            accent_color: program.institutions.accent_color,
            banner_url: program.institutions.banner_url,
          }
        : null,
    })
  } catch (error) {
    console.error('cohort by-slug error:', error)
    return NextResponse.json({ error: 'Failed to load cohort' }, { status: 500 })
  }
}
