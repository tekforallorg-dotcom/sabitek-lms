'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Mail, Lock, ArrowRight, Building2, Award, Users } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publicSignupOpen, setPublicSignupOpen] = useState(false)
  const { signIn } = useAuth()

  // Ask the gate endpoint whether public signup is open, so the footer
  // link matches reality. Fail closed = show "Request Access".
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/auth/signup-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const json = await res.json()
        const decision = json.data || json
        if (!cancelled) {
          setPublicSignupOpen(decision?.allowed === true && decision?.reason === 'public_open')
        }
      } catch {
        if (!cancelled) setPublicSignupOpen(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    const result = await signIn(data.email, data.password)

    if (result.error) {
      setError(result.error.message)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/30 via-transparent to-pink-900/30" />

        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl rotate-12 blur-sm" />
        <div className="absolute bottom-32 left-20 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl -rotate-12 blur-sm" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl rotate-45 blur-sm" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <h1 className="text-4xl font-bold flex items-center gap-1">
              <span className="text-white">Sabitek</span>
              <span className="relative">
                <Sparkles className="w-7 h-7 text-red-500" />
              </span>
            </h1>
          </Link>

          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
            Welcome back to<br />
            <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              Sabitek
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-md">
            Sign in to your institution workspace. Built for educators, administrators, and learners.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Institutions &amp; NGOs</h3>
                <p className="text-gray-500 text-sm">Run programs and cohorts at scale</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Training Centers</h3>
                <p className="text-gray-500 text-sm">Publish structured tracks and credentials</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Verified Instructors</h3>
                <p className="text-gray-500 text-sm">Approved subject experts, teaching with rigor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="max-w-md w-full py-12">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <h1 className="text-3xl font-bold flex items-center gap-1">
                <span className="text-black">Sabitek</span>
                <span className="relative">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </span>
              </h1>
            </Link>
          </div>

          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 pb-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs">!</span>
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      {...register('password')}
                      type="password"
                      placeholder="Enter your password"
                      className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500">Or</span>
                  </div>
                </div>

                <div className="text-center">
                  {publicSignupOpen ? (
                    <p className="text-sm text-gray-600">
                      Don&apos;t have an account?{' '}
                      <Link href="/auth/register" className="text-red-500 hover:text-red-600 font-semibold">
                        Sign up for free
                      </Link>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      New to Sabitek?{' '}
                      <Link href="/request-access" className="text-red-500 hover:text-red-600 font-semibold">
                        Get Started
                      </Link>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-8">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-red-500 hover:text-red-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-red-500 hover:text-red-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}