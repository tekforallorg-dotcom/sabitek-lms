import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Verified Sabitek certificate'

/**
 * Link-preview card for shared verify links: WhatsApp/LinkedIn unfurl a
 * certificate-styled image with the learner's real name and achievement.
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>
}) {
  const { certificateNumber } = await params

  let name = 'A Sabitek learner'
  let achievement = 'Verified achievement'
  let sub = 'Verify at sabitek.app'
  let found = false

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await admin
      .from('certificates')
      .select(
        'certificate_number, kind, user:users!certificates_user_id_fkey(full_name), course:courses(title), program:programs(name, institution:institutions(name))'
      )
      .eq('certificate_number', certificateNumber)
      .single()
    if (data) {
      found = true
      const user: any = Array.isArray(data.user) ? data.user[0] : data.user
      const course: any = Array.isArray(data.course) ? data.course[0] : data.course
      const program: any = Array.isArray(data.program) ? data.program[0] : data.program
      const institution: any = program?.institution
        ? Array.isArray(program.institution)
          ? program.institution[0]
          : program.institution
        : null
      name = user?.full_name || name
      achievement =
        (data as any).kind === 'program'
          ? program?.name || 'Program completed'
          : course?.title || 'Course completed'
      sub =
        (data as any).kind === 'program' && institution?.name
          ? `Program by ${institution.name} · verify at sabitek.app`
          : `Verify at sabitek.app · ${data.certificate_number}`
    }
  } catch {
    // Render the generic card
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffcf9',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            width: 1120,
            height: 550,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fda4af',
            borderRadius: 24,
            background: '#ffffff',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              bottom: 14,
              border: '1px solid #fecdd3',
              borderRadius: 16,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#111827' }}>
            Sabi
            <span style={{ fontStyle: 'italic', color: '#e11d48' }}>tek</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 16,
              letterSpacing: 8,
              color: '#9ca3af',
              marginTop: 10,
              textTransform: 'uppercase',
            }}
          >
            {found ? 'Certificate of Completion' : 'Verified Certificates'}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              color: '#111827',
              marginTop: 34,
              maxWidth: 980,
              textAlign: 'center',
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: 'flex',
              width: 120,
              height: 2,
              background: '#fda4af',
              marginTop: 18,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: '#374151',
              marginTop: 22,
              maxWidth: 960,
              textAlign: 'center',
            }}
          >
            {achievement}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 36, gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                background: 'linear-gradient(180deg, #ef4444, #e11d48)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: '#9ca3af' }}>{sub}</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
