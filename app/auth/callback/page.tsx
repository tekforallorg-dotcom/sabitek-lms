'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    let mounted = true

    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const type = searchParams.get('type')
        const errorDesc = searchParams.get('error_description')

        // Check for error in URL
        if (errorDesc) {
          console.error('[CALLBACK] Error from Supabase:', errorDesc)
          if (mounted) {
            setError(errorDesc)
            setIsProcessing(false)
          }
          return
        }

        console.log('[CALLBACK] Type:', type, 'Code:', code ? 'present' : 'not present')

        // First check if we already have a session (PKCE might have auto-established it)
        const { data: { session: existingSession } } = await supabase.auth.getSession()

        if (existingSession) {
          console.log('[CALLBACK] Session already exists for:', existingSession.user.email)

          // For signup type, show success message
          if (type === 'signup') {
            console.log('[CALLBACK] Email confirmed! Showing success message')
            if (mounted) {
              setSuccess(true)
              setIsProcessing(false)
            }
            return
          }

          // For other types, redirect based on role
          const { data: profile } = await supabase
            .from('users')
            .select('role, is_super_admin')
            .eq('id', existingSession.user.id)
            .single()

          if (mounted) {
            setIsProcessing(false)
            if (profile?.is_super_admin) {
              router.push('/admin')
            } else if (profile?.role === 'instructor') {
              router.push('/instructor')
            } else {
              router.push('/dashboard')
            }
          }
          return
        }

        // If we have a code, try to exchange it
        if (code) {
          console.log('[CALLBACK] Exchanging code for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('[CALLBACK] Exchange error:', exchangeError)
            if (mounted) {
              setError('Authentication failed. Please try again.')
              setIsProcessing(false)
              setTimeout(() => router.push('/auth/login'), 3000)
            }
            return
          }

          console.log('[CALLBACK] ✅ Code exchanged successfully!')
          console.log('[CALLBACK] User:', data.session?.user?.email)

          if (!data.session?.user) {
            console.error('[CALLBACK] No session after exchange')
            if (mounted) {
              setError('No session created. Please try again.')
              setIsProcessing(false)
              setTimeout(() => router.push('/auth/login'), 3000)
            }
            return
          }

          // Check for existing profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (!profile) {
            console.log('[CALLBACK] Creating new profile...')

            const fullName = data.session.user.user_metadata?.full_name ||
                            data.session.user.user_metadata?.name ||
                            data.session.user.email?.split('@')[0] ||
                            'User'

            await supabase.from('users').insert({
              id: data.session.user.id,
              email: data.session.user.email!,
              full_name: fullName,
              role: 'learner',
              is_super_admin: false,
              status: 'active',
              avatar_url: data.session.user.user_metadata?.avatar_url ||
                         data.session.user.user_metadata?.picture,
            })
          }

          // Show success message for email confirmation
          if (type === 'signup') {
            console.log('[CALLBACK] Email confirmed! Showing success message')
            if (mounted) {
              setSuccess(true)
              setIsProcessing(false)
            }
            return
          }

          // For other auth types, redirect immediately
          if (mounted) {
            setIsProcessing(false)
            if (profile?.is_super_admin) {
              router.push('/admin')
            } else if (profile?.role === 'instructor') {
              router.push('/instructor')
            } else {
              router.push('/dashboard')
            }
          }
          return
        }

        // No code and no session - wait for auth state change
        console.log('[CALLBACK] No code or session, waiting for auth state...')

        // Listen for auth state changes (PKCE flow might establish session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[CALLBACK] Auth state changed:', event)

          if (event === 'SIGNED_IN' && session && mounted) {
            console.log('[CALLBACK] ✅ User signed in:', session.user.email)

            // For signup, show success
            if (type === 'signup') {
              setSuccess(true)
              setIsProcessing(false)
              return
            }

            // Otherwise redirect based on role
            supabase
              .from('users')
              .select('role, is_super_admin')
              .eq('id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                if (mounted) {
                  setIsProcessing(false)
                  if (profile?.is_super_admin) {
                    router.push('/admin')
                  } else if (profile?.role === 'instructor') {
                    router.push('/instructor')
                  } else {
                    router.push('/dashboard')
                  }
                }
              })
          }
        })

        // If nothing happens after 5 seconds, show error
        setTimeout(() => {
          if (mounted && isProcessing) {
            console.log('[CALLBACK] Timeout - no auth event received')
            setError('Authentication timeout. Please try again.')
            setIsProcessing(false)
            setTimeout(() => router.push('/auth/login'), 3000)
          }
        }, 5000)

        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe()
        }
      } catch (err: any) {
        console.error('[CALLBACK] Unexpected error:', err)
        if (mounted) {
          setError('Something went wrong. Please try again.')
          setIsProcessing(false)
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      }
    }

    handleAuthCallback()

    return () => {
      mounted = false
    }
  }, [searchParams, router, isProcessing])

  // Success state - Email confirmed!
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1 justify-center">
              <span className="text-4xl font-bold text-black">Sabitek</span>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-0.5 mb-6"></div>
            </Link>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Email Confirmed!</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Your account has been successfully verified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Your email has been verified. You can now sign in to access your account.
                </p>
              </div>

              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1 justify-center">
              <span className="text-4xl font-bold text-black">Sabitek</span>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-0.5 mb-6"></div>
            </Link>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">Authentication Failed</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login" className="block">
                <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Processing state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
        <p className="text-gray-600">Please wait a moment</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  )
}