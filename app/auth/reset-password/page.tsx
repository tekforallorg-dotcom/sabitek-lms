'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield, KeyRound, ArrowRight } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500 mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-pink-500 mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="mt-6 text-gray-300 font-medium">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Show error if no valid session
  if (!hasSession) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-20 right-[20%] w-32 h-32 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl rotate-12 blur-sm" />
          <div className="absolute bottom-32 left-[15%] w-24 h-24 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl -rotate-12 blur-sm" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <h1 className="text-3xl font-bold text-white">Sabitek</h1>
              <Sparkles className="w-6 h-6 text-red-500" />
            </Link>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Link<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                Expired
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-md">
              Password reset links are time-sensitive for your security. Request a new link to continue.
            </p>
          </div>
        </div>

        {/* Right Side - Error */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-red-500 to-pink-600" />
              <CardHeader className="space-y-4 pt-8 pb-4 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Invalid Reset Link</CardTitle>
                <CardDescription className="text-gray-600">
                  {error || 'This password reset link is invalid or has expired.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-8">
                <Link href="/auth/forgot-password" className="block">
                  <Button className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20">
                    Request New Reset Link
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50">
                    Back to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          <div className="absolute top-20 right-[20%] w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl rotate-12 blur-sm" />
          <div className="absolute bottom-32 left-[15%] w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl -rotate-12 blur-sm" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <h1 className="text-3xl font-bold text-white">Sabitek</h1>
              <Sparkles className="w-6 h-6 text-red-500" />
            </Link>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Password<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Updated!
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-md">
              Your password has been successfully changed. You can now log in with your new credentials.
            </p>
          </div>
        </div>

        {/* Right Side - Success */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
              <CardHeader className="space-y-4 pt-8 pb-4 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Password Updated!</CardTitle>
                <CardDescription className="text-gray-600">
                  Your password has been successfully updated.<br />
                  Redirecting to login...
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-20 right-[20%] w-32 h-32 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl rotate-12 blur-sm" />
        <div className="absolute bottom-32 left-[15%] w-24 h-24 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 right-[10%] w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl rotate-45 blur-sm" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <h1 className="text-3xl font-bold text-white">Sabitek</h1>
            <Sparkles className="w-6 h-6 text-red-500" />
          </Link>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Create Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
              New Password
            </span>
          </h2>

          <p className="text-gray-400 text-lg mb-10 max-w-md">
            Choose a strong password to keep your account secure. We recommend using a mix of letters, numbers, and symbols.
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Stay Secure</h3>
                <p className="text-gray-400 text-xs">Use at least 6 characters</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Unique Password</h3>
                <p className="text-gray-400 text-xs">Don't reuse passwords from other sites</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <h1 className="text-3xl font-bold text-gray-900">Sabitek</h1>
              <Sparkles className="w-6 h-6 text-red-500" />
            </Link>
          </div>

          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-red-500 to-pink-600" />
            <CardHeader className="space-y-2 pt-8 pb-4 text-center">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mb-2">
                <KeyRound className="w-7 h-7 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Reset Your Password</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}