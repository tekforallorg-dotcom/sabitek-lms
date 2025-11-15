'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const validateRecoverySession = async () => {
      try {
        console.log('[RESET] Starting recovery session validation...')
        console.log('[RESET] Current URL:', window.location.href)
        console.log('[RESET] Search params:', searchParams.toString())
        console.log('[RESET] Hash:', window.location.hash)

        // Check BOTH query params AND hash for tokens
        const code = searchParams.get('code')
        const errorDescription = searchParams.get('error_description')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type') || searchParams.get('type')

        console.log('[RESET] Token detection:', {
          hasCode: !!code,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          error: errorDescription
        })

        // Handle error from Supabase
        if (errorDescription) {
          console.error('[RESET] Error from Supabase:', errorDescription)
          if (mounted) {
            setError(errorDescription)
            setValidToken(false)
            setCheckingToken(false)
          }
          return
        }

        // CASE 1: We have a code parameter (PKCE flow)
        if (code) {
          console.log('[RESET] Found code parameter, exchanging for session...')

          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              console.error('[RESET] Code exchange error:', exchangeError)

              // Check if session already exists (code might have been used)
              const { data: { session: existingSession } } = await supabase.auth.getSession()

              if (existingSession?.user) {
                console.log('[RESET] Session already exists despite exchange error')
                if (mounted) {
                  setValidToken(true)
                  setCheckingToken(false)
                }
                return
              }

              if (mounted) {
                setError('Failed to verify reset link. It may have expired or already been used.')
                setValidToken(false)
                setCheckingToken(false)
              }
              return
            }

            if (data?.session) {
              console.log('[RESET] ✅ Code exchanged successfully for:', data.session.user.email)
              if (mounted) {
                setValidToken(true)
                setCheckingToken(false)
              }
              return
            }
          } catch (err) {
            console.error('[RESET] Code exchange exception:', err)
          }
        }

        // CASE 2: We have hash tokens (direct token flow)
        if (accessToken && type === 'recovery') {
          console.log('[RESET] Found hash tokens, waiting for auto-detection...')

          // Give Supabase time to auto-detect
          await new Promise(resolve => setTimeout(resolve, 1000))

          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            console.log('[RESET] ✅ Session established via hash tokens')
            if (mounted) {
              setValidToken(true)
              setCheckingToken(false)
            }
            return
          }

          // Try manual session set
          if (refreshToken) {
            console.log('[RESET] Attempting manual session set...')
            const { data: manualSession, error: manualError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (manualSession?.session) {
              console.log('[RESET] ✅ Manual session set successful')
              if (mounted) {
                setValidToken(true)
                setCheckingToken(false)
              }
              return
            }

            if (manualError) {
              console.error('[RESET] Manual session error:', manualError)
            }
          }
        }

        // CASE 3: Check if we already have a session (from previous auth)
        console.log('[RESET] Checking for existing session...')
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (currentSession?.user) {
          console.log('[RESET] ✅ Found existing session for:', currentSession.user.email)
          if (mounted) {
            setValidToken(true)
            setCheckingToken(false)
          }
          return
        }

        // CASE 4: Listen for auth state changes
        console.log('[RESET] No immediate session, setting up listener...')

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[RESET] Auth state changed:', event)

          if (session && mounted && checkingToken) {
            console.log('[RESET] ✅ Session established via auth state change')
            setValidToken(true)
            setCheckingToken(false)
          }
        })

        authSubscription = authListener

        // Final timeout check
        setTimeout(() => {
          if (mounted && checkingToken) {
            console.log('[RESET] ❌ Timeout - no valid session found')
            setError('Invalid or expired reset link. Please request a new password reset.')
            setValidToken(false)
            setCheckingToken(false)
          }
        }, 5000)

      } catch (err) {
        console.error('[RESET] Unexpected error:', err)
        if (mounted) {
          setError('An error occurred verifying your reset link. Please try again.')
          setValidToken(false)
          setCheckingToken(false)
        }
      }
    }

    validateRecoverySession()

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.subscription.unsubscribe()
      }
    }
  }, [searchParams, checkingToken])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error('[RESET] No session when trying to update password')
        setError('Session expired. Please request a new password reset.')
        setLoading(false)
        return
      }

      console.log('[RESET] Updating password for user:', session.user.email)

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('[RESET] Password update error:', updateError)
        setError(updateError.message || 'Failed to reset password')
        setLoading(false)
        return
      }

      console.log('[RESET] ✅ Password updated successfully')

      // Sign out after password reset
      await supabase.auth.signOut()

      setSuccess(true)

      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (err: any) {
      console.error('[RESET] Unexpected error during password update:', err)
      setError(err.message || 'Failed to reset password. Please try again.')
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <h1 className="text-4xl font-bold flex items-center gap-1">
                <span className="text-black">Sabitek</span>
                <span className="relative">
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
                </span>
              </h1>
            </Link>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">Password Reset Successful!</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Your password has been updated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-gray-600 mb-4">
                Redirecting to login page in 3 seconds...
              </p>
              <Link href="/auth/login">
                <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white">
                  Go to Login Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <h1 className="text-4xl font-bold flex items-center gap-1">
              <span className="text-black">Sabitek</span>
              <span className="relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
              </span>
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">Create a new password</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-black">Reset Your Password</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!validToken ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error || 'Invalid or expired reset link'}
                </div>
                <Link href="/auth/forgot-password">
                  <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full h-11 border-gray-300">
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="ml-2">Resetting Password...</span>
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-red-500 hover:text-red-600 hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}