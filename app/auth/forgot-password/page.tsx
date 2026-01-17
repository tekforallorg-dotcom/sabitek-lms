'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, Mail, ArrowLeft, CheckCircle, KeyRound, Shield, Clock } from 'lucide-react'

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
      <div className="min-h-screen flex">
        {/* Left Side - Hero (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
          {/* Floating elements */}
          <div className="absolute top-20 right-[20%] w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl rotate-12 blur-sm" />
          <div className="absolute bottom-32 left-[15%] w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl -rotate-12 blur-sm" />
          <div className="absolute top-1/2 right-[10%] w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl rotate-45 blur-sm" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 mb-12">
              <h1 className="text-3xl font-bold text-white">Sabitek</h1>
              <Sparkles className="w-6 h-6 text-red-500" />
            </Link>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Check Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Email Inbox
              </span>
            </h2>

            <p className="text-gray-400 text-lg mb-10 max-w-md">
              We've sent you a secure link to reset your password. Follow the instructions in the email.
            </p>

            {/* Steps */}
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Check your inbox</h3>
                  <p className="text-gray-400 text-xs">Look for an email from Sabitek</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Click the reset link</h3>
                  <p className="text-gray-400 text-xs">Opens our secure password page</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Create new password</h3>
                  <p className="text-gray-400 text-xs">Set a strong, secure password</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
              <CardHeader className="text-center space-y-4 pt-8 pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
                <CardDescription className="text-gray-600">
                  We've sent a password reset link to<br />
                  <strong className="text-gray-900">{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Next steps:</p>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                      Check your inbox for the reset email
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                      Click the link in the email
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                      Create a new password
                    </li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-500 text-center">
                  Didn't receive the email? Check your spam folder or try again.
                </p>

                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
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
            Forgot Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
              Password?
            </span>
          </h2>

          <p className="text-gray-400 text-lg mb-10 max-w-md">
            No worries! Enter your email and we'll send you a secure link to reset your password.
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Secure Reset</h3>
                <p className="text-gray-400 text-xs">Encrypted link sent to your email</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Quick Process</h3>
                <p className="text-gray-400 text-xs">Reset your password in under a minute</p>
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
            <CardHeader className="space-y-2 pt-8 pb-4">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <form onSubmit={handleForgotPassword} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
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