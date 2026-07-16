import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendCohortWelcomeEmail } from '@/lib/email'
import { notify } from '@/lib/notifications'

/**
 * Join a cohort from its vanity landing page.
 * Modes: 'open' joins directly; 'access_code' requires the matching code;
 * 'invite_only' is rejected (those come through invitation tokens).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sign in to join' }, { status: 401 })
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Sign in to join' }, { status: 401 })
    }
    const userId = userData.user.id

    const body = await request.json()
    const { slug, access_code } = body as { slug?: string; access_code?: string }
    if (!slug) return NextResponse.json({ error: 'Cohort link is invalid' }, { status: 400 })

    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select(
        'id, name, status, enrollment_mode, access_code, access_code_expires_at, seat_limit, enrollment_start_date, enrollment_end_date, allow_late_enrollment, start_date, default_sponsorship, send_welcome_email, program_id, programs(name, institutions(name))'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (!cohort || cohort.status === 'archived') {
      return NextResponse.json({ error: 'This cohort no longer exists' }, { status: 404 })
    }

    // Enrollment window
    const now = new Date()
    if (cohort.enrollment_start_date && now < new Date(cohort.enrollment_start_date)) {
      return NextResponse.json({ error: 'Enrollment has not opened yet' }, { status: 400 })
    }
    if (
      cohort.enrollment_end_date &&
      now > new Date(cohort.enrollment_end_date) &&
      !cohort.allow_late_enrollment
    ) {
      return NextResponse.json({ error: 'Enrollment has closed for this cohort' }, { status: 400 })
    }

    // Mode rules
    if (cohort.enrollment_mode === 'invite_only') {
      return NextResponse.json(
        { error: 'This cohort is invite-only. Ask your organization for an invitation.' },
        { status: 403 }
      )
    }
    if (cohort.enrollment_mode === 'access_code') {
      if (!access_code || access_code.trim().toUpperCase() !== (cohort.access_code || '').toUpperCase()) {
        return NextResponse.json({ error: 'That access code is not correct' }, { status: 400 })
      }
      if (cohort.access_code_expires_at && now > new Date(cohort.access_code_expires_at)) {
        return NextResponse.json({ error: 'This access code has expired' }, { status: 400 })
      }
    }

    // Already a member?
    const { data: existing } = await supabaseAdmin
      .from('cohort_members')
      .select('id, status')
      .eq('cohort_id', cohort.id)
      .eq('user_id', userId)
      .maybeSingle()
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ joined: true, already_member: true })
      }
      // Re-activate invited/withdrawn members joining via the public link
      await supabaseAdmin
        .from('cohort_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', existing.id)
      return NextResponse.json({ joined: true })
    }

    // Seat limit
    if (cohort.seat_limit) {
      const { count } = await supabaseAdmin
        .from('cohort_members')
        .select('id', { count: 'exact', head: true })
        .eq('cohort_id', cohort.id)
        .eq('status', 'active')
      if ((count ?? 0) >= cohort.seat_limit) {
        return NextResponse.json({ error: 'This cohort is full' }, { status: 400 })
      }
    }

    const { error: insertError } = await supabaseAdmin.from('cohort_members').insert({
      cohort_id: cohort.id,
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
      sponsorship: cohort.default_sponsorship ?? null,
    })
    if (insertError) {
      console.error('cohort join insert failed:', insertError)
      return NextResponse.json({ error: 'Could not join. Please try again.' }, { status: 500 })
    }

    notify(userId, {
      type: 'cohort',
      title: `Welcome to ${cohort.name}`,
      body: 'Your cohort courses are on your dashboard.',
      href: '/dashboard',
    })

    // Honor the cohort's welcome-email setting (a dormant column, now live)
    if (cohort.send_welcome_email) {
      try {
        const { data: joiner } = await supabaseAdmin
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single()
        if (joiner?.email) {
          const program = (cohort as any).programs
          sendCohortWelcomeEmail({
            to: joiner.email,
            firstName: (joiner.full_name || 'there').split(' ')[0],
            cohortName: cohort.name,
            institutionName: program?.institutions?.name || null,
            programName: program?.name || null,
          }).then((r) => {
            if (!r.success) console.log('welcome email failed:', r.error)
          })
        }
      } catch {
        // Email is a courtesy, never a blocker
      }
    }

    return NextResponse.json({ joined: true, cohort_name: cohort.name })
  } catch (error) {
    console.error('join-by-slug error:', error)
    return NextResponse.json({ error: 'Could not join. Please try again.' }, { status: 500 })
  }
}
