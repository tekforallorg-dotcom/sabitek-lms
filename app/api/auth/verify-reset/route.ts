import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role (can bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Server-side password reset token verification
 * Handles cross-device password reset using token_hash + verifyOtp pattern
 *
 * This is the officially documented Supabase approach for SSR/cross-device email auth
 * Reference: https://supabase.com/docs/guides/auth/server-side
 */
export async function POST(request: NextRequest) {
  try {
    const { token_hash, type } = await request.json()

    if (!token_hash || !type) {
      return NextResponse.json(
        { error: 'Missing token_hash or type parameter' },
        { status: 400 }
      )
    }

    if (type !== 'recovery') {
      return NextResponse.json(
        { error: 'Invalid token type. Expected "recovery"' },
        { status: 400 }
      )
    }

    console.log('[VERIFY-RESET] Verifying password reset token...')

    // Use verifyOtp to validate the token and establish session
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })

    if (error) {
      console.error('[VERIFY-RESET] Verification failed:', error.message)
      return NextResponse.json(
        {
          error: 'Invalid or expired reset token',
          details: error.message
        },
        { status: 400 }
      )
    }

    if (!data.session || !data.user) {
      console.error('[VERIFY-RESET] No session returned')
      return NextResponse.json(
        { error: 'Failed to establish session' },
        { status: 500 }
      )
    }

    console.log('[VERIFY-RESET] ✅ Token verified for user:', data.user.email)

    // Return session tokens to client
    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    })
  } catch (error: any) {
    console.error('[VERIFY-RESET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
