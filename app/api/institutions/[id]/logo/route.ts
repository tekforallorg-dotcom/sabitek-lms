import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractBearerToken } from '@/lib/validations'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'course-materials'
const MAX_BYTES = 2 * 1024 * 1024 // 2MB is plenty for a logo
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return ApiErrors.unauthorized()

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return ApiErrors.unauthorized()

    // Only this institution's admin (or a super admin) may change the logo
    const { data: membership } = await supabaseAdmin
      .from('institution_members')
      .select('role, status')
      .eq('institution_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership?.role !== 'institution_admin') {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()
      if (!profile?.is_super_admin) return ApiErrors.forbidden('Only the institution admin can update the logo')
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return ApiErrors.badRequest('No file provided')
    if (!ALLOWED.includes(file.type)) return ApiErrors.badRequest('Logo must be a PNG, JPG, WebP or SVG image')
    if (file.size > MAX_BYTES) return ApiErrors.badRequest('Logo must be under 2MB')

    const ext = file.type === 'image/svg+xml' ? 'svg' : (file.type.split('/')[1] || 'png')
    const path = `institution-logos/${id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      })
    if (uploadError) {
      console.error('Logo upload failed:', uploadError)
      return ApiErrors.internal('Could not store the logo. Please try again.')
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    const logoUrl = pub.publicUrl

    const { error: updateError } = await supabaseAdmin
      .from('institutions')
      .update({ logo_url: logoUrl })
      .eq('id', id)
    if (updateError) {
      console.error('Logo url update failed:', updateError)
      return ApiErrors.internal('Could not save the logo. Please try again.')
    }

    return apiSuccess({ logo_url: logoUrl })
  } catch (error) {
    console.error('Logo route error:', error)
    return ApiErrors.internal('Could not upload the logo. Please try again.')
  }
}
