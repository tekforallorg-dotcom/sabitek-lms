import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Light, read-only JSON lookup with no Node-only APIs - safe on the edge.
export const runtime = 'edge'

/**
 * Public certificate verification.
 *
 * Certificates are RLS-protected (owner/instructor/admin reads only),
 * so the public /verify page cannot query them with the anon key.
 * This route looks up a single certificate by its exact number with
 * the service role and returns only the fields shown on the public
 * verification page. No listing, no enumeration beyond guessing full
 * certificate numbers.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  const { certificateNumber } = await params

  if (!certificateNumber || certificateNumber.length > 100) {
    return NextResponse.json({ error: 'invalid_certificate_number' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      id,
      certificate_number,
      grade_percentage,
      issued_at,
      kind,
      revoked_at,
      user:users!certificates_user_id_fkey(
        full_name
      ),
      course:courses(
        title,
        instructor:users!courses_instructor_id_fkey(full_name)
      ),
      program:programs(
        name,
        institution:institutions(name)
      )
    `)
    .eq('certificate_number', certificateNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    console.error('Certificate verification error:', error)
    return NextResponse.json({ error: 'verification_failed' }, { status: 500 })
  }

  // Verification results are public and rarely change - let the CDN serve
  // repeat lookups (and shield the DB) while staying reasonably fresh.
  return NextResponse.json(
    { data },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  )
}
