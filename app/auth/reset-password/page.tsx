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
  const [hasSession, setHasSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Simple session check - no token verification here
  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        console.log('[RESET] Checking for active session...')
        console.log('[RESET] Current hash:', window.location.hash)

        // If hash contains session tokens, manually set the session
        if (window.location.hash.includes('access_token')) {
          console.log('[RESET] Hash tokens detected, manually setting session...')

          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')

          if (access_token && refresh_token) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
              })

              if (error) {
                console.error('[RESET] Failed to set session from hash:', error)
              } else {
                console.log('[RESET] ✅ Session set from hash for:', data.session?.user?.email)

                // Clear the hash from URL for security
                window.history.replaceState(null, '', window.location.pathname + window.location.search)

                if (mounted) {
                  setHasSession(true)
                  setCheckingSession(false)
                }
                return
              }
            } catch (err) {
              console.error('[RESET] Error setting session from hash:', err)
            }
          }
        }

        // Otherwise check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[RESET] Session error:', sessionError)
        }

        if (mounted) {
          if (session?.user) {
            console.log('[RESET] ✅ Active session found for:', session.user.email)
            setHasSession(true)
            setCheckingSession(false)
          } else {
            console.log('[RESET] ❌ No active session')
            setHasSession(false)

            // Check for error messages from confirm route
            const message = searchParams.get('message')
            if (message === 'invalid-or-expired-link') {
              setError('This reset link is invalid or has expired. Please request a new one.')
            } else if (message) {
              setError('Unable to verify reset link. Please request a new one.')
            } else {
              setError('No active reset session. Please request a password reset link.')
            }
            setCheckingSession(false)
          }
        }
      } catch (err) {
        console.error('[RESET] Unexpected error checking session:', err)
        if (mounted) {
          setHasSession(false)
          setError('An error occurred. Please try again.')
          setCheckingSession(false)
        }
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[RESET] Auth event:', event)
      if (mounted) {
        if (session?.user) {
          console.log('[RESET] Session established via auth event')
          setHasSession(true)
          setCheckingSession(false)
        } else if (event === 'SIGNED_OUT') {
          setHasSession(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      console.log('[RESET] Updating password...')

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('[RESET] Password update failed:', updateError)
        setError(updateError.message)
        setLoading(false)
        return
      }

      console.log('[RESET] ✅ Password updated successfully')
      setSuccess(true)
      setLoading(false)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login?message=password-updated')
      }, 2000)
    } catch (err: any) {
      console.error('[RESET] Unexpected error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Verifying session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if no valid session
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              <CardDescription className="mt-2">
                {error || 'This password reset link is invalid or has expired.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/auth/forgot-password" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription className="mt-2">
                Your password has been successfully updated. Redirecting to login...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription className="mt-2">
              Enter your new password below
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
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
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
