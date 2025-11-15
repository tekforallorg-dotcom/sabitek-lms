import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  console.log('[CONFIRM] Token verification request:', { hasToken: !!token_hash, type })

  // Validate parameters
  if (!token_hash || !type) {
    console.error('[CONFIRM] Missing token_hash or type')
    return NextResponse.redirect(
      new URL('/auth/login?message=invalid-link', request.url)
    )
  }

  // Only handle recovery and signup types
  if (type !== 'recovery' && type !== 'signup') {
    console.error('[CONFIRM] Invalid type:', type)
    return NextResponse.redirect(
      new URL('/auth/login?message=invalid-link', request.url)
    )
  }

  // Create admin client for verification
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log(`[CONFIRM] Verifying ${type} token...`)

    // Verify the OTP token
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'signup',
    })

    if (error) {
      console.error('[CONFIRM] Verification failed:', error.message)
      return NextResponse.redirect(
        new URL('/auth/login?message=invalid-or-expired-link', request.url)
      )
    }

    if (!data.session || !data.user) {
      console.error('[CONFIRM] No session returned from verification')
      return NextResponse.redirect(
        new URL('/auth/login?message=verification-failed', request.url)
      )
    }

    console.log('[CONFIRM] ✅ Token verified for user:', data.user.email)

    // Build redirect URL with session tokens in hash fragment
    // This allows the client-side Supabase to pick up the session
    const redirectPath = type === 'recovery' ? '/auth/reset-password' : '/auth/confirmed'
    const redirectUrl = new URL(redirectPath, request.url)

    // Add session to URL hash (Supabase client will auto-detect this)
    redirectUrl.hash = `access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&expires_in=${data.session.expires_in}&token_type=bearer&type=${type}`

    console.log('[CONFIRM] Redirecting to:', redirectPath, 'with session in hash')

    return NextResponse.redirect(redirectUrl)
  } catch (err: any) {
    console.error('[CONFIRM] Unexpected error:', err)
    return NextResponse.redirect(
      new URL('/auth/login?message=verification-error', request.url)
    )
  }
}
