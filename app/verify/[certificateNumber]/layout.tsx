import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** Share-friendly metadata for public verify links. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ certificateNumber: string }>
}): Promise<Metadata> {
  const { certificateNumber } = await params
  let title = 'Verified certificate | Sabitek'
  let description = 'Verify the authenticity of a Sabitek certificate.'

  try {
    const admin = supabaseAdmin
    const { data } = await admin
      .from('certificates')
      .select(
        'kind, user:users!certificates_user_id_fkey(full_name), course:courses(title), program:programs(name)'
      )
      .eq('certificate_number', certificateNumber)
      .single()
    if (data) {
      const user: any = Array.isArray(data.user) ? data.user[0] : data.user
      const course: any = Array.isArray(data.course) ? data.course[0] : data.course
      const program: any = Array.isArray(data.program) ? data.program[0] : data.program
      const what = (data as any).kind === 'program' ? program?.name : course?.title
      if (user?.full_name && what) {
        title = `${user.full_name} - ${what} | Verified on Sabitek`
        description = `This certificate is authentic. ${user.full_name} completed ${what} on Sabitek.`
      }
    }
  } catch {
    // Generic metadata
  }

  return { title, description }
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
