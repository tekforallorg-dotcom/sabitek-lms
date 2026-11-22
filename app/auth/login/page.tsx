'use client'
import { useState, useEffect } from 'react'
import { rememberReturnPath } from '@/lib/post-auth-redirect'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AuthShell,
  AuthCard,
  authInputClass,
  authPrimaryBtnClass,
} from '@/components/auth/AuthShell'
import { Mail, Lock, ArrowRight, Building2, Award, Users, AlertCircle, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [publicSignupOpen, setPublicSignupOpen] = useState(false)
  const { signIn } = useAuth()

  // Pages that need an account link here with ?redirect=/where/they/were.
  // Remember it so sign-in can send the person back there.
  useEffect(() => {
    rememberReturnPath(new URLSearchParams(window.location.search).get('redirect'))
  }, [])

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
    <AuthShell
      eyebrow="Welcome back"
      titleTop="Sign in to"
      titleAccent="your workspace."
      description="Your institution workspace, built for educators, administrators, and learners."
      features={[
        { icon: Building2, title: 'Institutions & NGOs', desc: 'Run programs and cohorts at scale' },
        { icon: Award, title: 'Training Centers', desc: 'Publish structured tracks and credentials' },
        { icon: Users, title: 'Verified Instructors', desc: 'Approved subject experts, teaching with rigor' },
      ]}
      mobileSubtitle="Sign in to your workspace"
      footer={
        <>
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-red-500 hover:text-red-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-red-500 hover:text-red-600">
            Privacy Policy
          </Link>
        </>
      }
    >
      <AuthCard
        title="Sign"
        titleAccent="in"
        description="Enter your email and password"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input
                {...register('email')}
                id="login-email"
                autoComplete="email"
                type="email"
                placeholder="name@example.com"
                className={authInputClass}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input
                {...register('password')}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`${authInputClass} pr-12`}
              />
              {/* Typing a password on a phone is error-prone; let people check it. */}
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign in
                <ArrowRight className="w-4 h-4 transition-transform" />
              </span>
            )}
          </Button>


          <div className="text-center">
            {publicSignupOpen ? (
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-red-500 hover:text-red-600 font-medium">
                  Sign up for free
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                New to Sabitek?{' '}
                <Link href="/request-access" className="text-red-500 hover:text-red-600 font-medium">
                  Request access
                </Link>
              </p>
            )}
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
