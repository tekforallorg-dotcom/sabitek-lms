import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseAdminUntyped } from '@/lib/supabase-admin'
import { estimateCostUsd } from '@/lib/ai'

/** Platform cockpit numbers for super admins, incl. estimated AI spend. */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (!userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: me } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', userData.user.id)
      .single()
    if (!me?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const count = (table: string, filter?: (q: any) => any) => {
      // Table name is chosen at runtime, so this one query is untyped.
      let q = supabaseAdminUntyped.from(table).select('id', { count: 'exact', head: true })
      if (filter) q = filter(q)
      return q
    }

    const [users, learners, instructors, institutions, courses, enrollments, certificates, cohorts, aiRows] =
      await Promise.all([
        count('users'),
        count('users', (q) => q.eq('role', 'learner')),
        count('users', (q) => q.eq('role', 'instructor')),
        count('institutions', (q) => q.eq('status', 'approved')),
        count('courses', (q) => q.eq('status', 'published')),
        count('course_enrollments'),
        count('certificates'),
        count('cohorts'),
        supabaseAdmin
          .from('ai_usage')
          .select('model, input_tokens, cache_read_tokens, output_tokens')
          .gte('created_at', monthStart.toISOString()),
      ])

    let aiRequests = 0
    let aiCostUsd = 0
    const byModel: Record<string, { requests: number; cost: number }> = {}
    for (const r of (aiRows.data as any[]) || []) {
      aiRequests++
      const cost = estimateCostUsd(r.model, {
        inputTokens: r.input_tokens || 0,
        cacheReadTokens: r.cache_read_tokens || 0,
        outputTokens: r.output_tokens || 0,
      })
      aiCostUsd += cost
      const m = byModel[r.model] || { requests: 0, cost: 0 }
      m.requests++
      m.cost += cost
      byModel[r.model] = m
    }

    return NextResponse.json({
      totals: {
        users: users.count ?? 0,
        learners: learners.count ?? 0,
        instructors: instructors.count ?? 0,
        institutions: institutions.count ?? 0,
        published_courses: courses.count ?? 0,
        enrollments: enrollments.count ?? 0,
        certificates: certificates.count ?? 0,
        cohorts: cohorts.count ?? 0,
      },
      ai_this_month: {
        requests: aiRequests,
        est_cost_usd: Math.round(aiCostUsd * 100) / 100,
        by_model: Object.fromEntries(
          Object.entries(byModel).map(([k, v]) => [k, { requests: v.requests, est_cost_usd: Math.round(v.cost * 100) / 100 }])
        ),
      },
    })
  } catch (error) {
    console.error('admin metrics error:', error)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
