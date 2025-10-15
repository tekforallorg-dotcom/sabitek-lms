'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-black">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600">
                We've sent a password reset link to <strong className="text-black">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Check your inbox for the reset email</li>
                  <li>Click the link in the email</li>
                  <li>Create a new password</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold">
                <span className="text-black">Sabitek</span>
              </h1>
            </Link>
            <p className="text-gray-600 mt-2">Reset your password</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-black">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                    required
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
                      <span className="ml-2">Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Link href="/auth/login" className="text-sm text-red-500 hover:text-red-600">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}