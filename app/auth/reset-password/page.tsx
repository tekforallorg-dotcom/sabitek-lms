'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

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
    const checkToken = async () => {
      try {
        // Check URL hash parameters (from email link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        console.log('Hash params:', { accessToken: !!accessToken, type })

        if (accessToken && type === 'recovery') {
          // Verify the session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Invalid or expired reset link.')
            setValidToken(false)
          } else if (session) {
            console.log('Valid session found')
            setValidToken(true)
          } else {
            setError('Invalid or expired reset link.')
            setValidToken(false)
          }
        } else {
          console.log('No valid token in URL')
          setError('Invalid or expired reset link. Please request a new password reset.')
          setValidToken(false)
        }
      } catch (err) {
        console.error('Token check error:', err)
        setError('An error occurred. Please try again.')
        setValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkToken()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Update password error:', updateError)
        setError(updateError.message)
        setLoading(false)
        return
      }

      console.log('Password updated successfully')
      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || 'Failed to reset password')
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

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
          <Link href="/" className="inline-flex items-center gap-1 justify-center">
            <span className="text-4xl font-bold text-black">Sabitek</span>
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-0.5 mb-6"></div>
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
                  {error}
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
                    placeholder="Enter new password (min 6 characters)"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
                    minLength={6}
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
                    minLength={6}
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