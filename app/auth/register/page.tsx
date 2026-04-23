'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  User,
  CheckCircle,
  Rocket,
  Award,
  Globe,
  Building2,
  Loader2,
  AlertCircle,
  Ticket,
} from 'lucide-react'
import SabiLoader from '@/components/ui/SabiLoader'
import type { SignupGateDecision } from '@/lib/validations/auth-gating'


const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['learner', 'instructor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
} as const)

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const { signUp } = useAuth()

  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [gate, setGate] = useState<SignupGateDecision | null>(null)
  const [gateLoading, setGateLoading] = useState(true)

  // Check signup eligibility on mount and whenever the invite token changes.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setGateLoading(true)
      try {
        const res = await fetch('/api/auth/signup-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_token: inviteToken || undefined }),
        })
        const json = await res.json()
        if (!cancelled) {
          // apiSuccess returns the payload directly (flat envelope).
          setGate((json.data || json) as SignupGateDecision)
        }
      } catch {
        if (!cancelled) {
          setGate({ allowed: false, reason: 'invite_required' })
        }
      } finally {
        if (!cancelled) setGateLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [inviteToken])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'learner',
    },
  })

  const onSubmit = async (data: RegisterInput) => {
    if (!gate?.allowed) {
      setError('Signup is not available. Please use an invite link or request access.')
      return
    }

    setIsLoading(true)
    setError(null)

    // When arriving via invite, always register as learner.
    const roleToUse = gate.reason === 'valid_invite' ? 'learner' : data.role

    const result = await signUp(data.email, data.password, data.fullName, roleToUse)

    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
    } else if (result.needsVerification) {
      setRegisteredEmail(data.email)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  // ── Verification success screen ──
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-tr from-green-900/30 via-transparent to-emerald-900/30" />
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl rotate-12 blur-sm" />
          <div className="absolute bottom-32 left-20 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl -rotate-12 blur-sm" />
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <Link href="/" className="flex items-center gap-2 mb-12">
              <h1 className="text-4xl font-bold flex items-center gap-1">
                <span className="text-white">Sabitek</span>
                <Sparkles className="w-7 h-7 text-green-500" />
              </h1>
            </Link>
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              You&apos;re almost<br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                there!
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Just one more step to unlock your learning.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-green-50/30">
          <div className="max-w-md w-full py-12">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 justify-center">
                <h1 className="text-3xl font-bold flex items-center gap-1">
                  <span className="text-black">Sabitek</span>
                  <Sparkles className="w-6 h-6 text-red-500" />
                </h1>
              </Link>
            </div>

            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  We&apos;ve sent a verification link to
                </CardDescription>
                <p className="text-gray-900 font-semibold mt-1">{registeredEmail}</p>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Next steps:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Check your inbox for the verification email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Click the verification link in the email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Sign in to start learning</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Didn&apos;t receive the email? Check your spam folder.
                  </p>
                </div>

                <Link href="/auth/login" className="block">
                  <Button className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20">
                    <span className="flex items-center gap-2">
                      Back to Login
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-gray-500 mt-8">
              Need help?{' '}
              <a href="mailto:support@sabitek.store" className="text-red-500 hover:text-red-600 font-medium">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Gate loading shell ──
  if (gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <SabiLoader text="Checking access..." size="lg" />
      </div>
    )
  }

  // ── Blocked state: invite required or invite invalid/expired/revoked ──
  if (!gate?.allowed) {
    const reasonCopy: Record<string, { title: string; desc: string }> = {
      invite_required: {
        title: 'Sign up is by invite',
        desc: 'Sabitek accounts are provisioned through institutions and verified training providers. Use an invite link to create your account, or request access for your organization.',
      },
      invite_invalid: {
        title: 'Invite link not recognized',
        desc: 'We could not verify this invite. It may have been mistyped or disabled. Please ask the admin who sent it for a fresh link.',
      },
      invite_expired: {
        title: 'This invite has expired',
        desc: 'The invite link you used is no longer active. Please request a new invite from your institution or training provider.',
      },
      invite_revoked: {
        title: 'This invite was revoked',
        desc: 'The admin has revoked this invite. Please contact them to request a new one.',
      },
      invite_exhausted: {
        title: 'This invite is fully used',
        desc: 'The invite has reached its usage limit. Please request a new invite from the admin who sent it.',
      },
    }
    const copy = reasonCopy[gate?.reason || 'invite_required'] || reasonCopy.invite_required

    return (
      <div className="min-h-screen flex">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/30 via-transparent to-pink-900/30" />
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl rotate-12 blur-sm" />
          <div className="absolute bottom-32 left-20 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl -rotate-12 blur-sm" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            <Link href="/" className="flex items-center gap-2 mb-12">
              <h1 className="text-4xl font-bold flex items-center gap-1">
                <span className="text-white">Sabitek</span>
                <Sparkles className="w-7 h-7 text-red-500" />
              </h1>
            </Link>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              Learning built for<br />
              <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                institutions
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-12 max-w-md">
              Schools, NGOs, government programs, and verified training providers use Sabitek to deliver structured learning at scale.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Institutions &amp; NGOs</h3>
                  <p className="text-gray-500 text-sm">Run cohorts, track outcomes, export evidence</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Training Centers</h3>
                  <p className="text-gray-500 text-sm">Publish structured tracks, issue credentials</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Verified Instructors</h3>
                  <p className="text-gray-500 text-sm">Join as an approved subject expert</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right blocked state */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-red-50/30">
          <div className="max-w-md w-full py-12">
            <div className="lg:hidden text-center mb-6">
              <Link href="/" className="inline-flex items-center gap-2 justify-center">
                <h1 className="text-3xl font-bold flex items-center gap-1">
                  <span className="text-black">Sabitek</span>
                  <Sparkles className="w-6 h-6 text-red-500" />
                </h1>
              </Link>
            </div>

            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/20">
                  <Ticket className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{copy.title}</CardTitle>
                <CardDescription className="text-gray-600 mt-2 px-2">
                  {copy.desc}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <Link href="/request-access" className="block">
                  <Button className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20">
                    <span className="flex items-center justify-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </Link>

                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl">
                    I already have an account
                  </Button>
                </Link>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-900">
                    <strong>Have an invite link?</strong> Paste it into your browser to continue. Invite links look like <code className="bg-white px-1.5 py-0.5 rounded text-[11px]">/join/&lt;token&gt;</code>.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Individual learner? <Link href="/waitlist" className="text-red-500 hover:text-red-600 font-medium">Join the waitlist</Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-gray-500 mt-6">
              Need help?{' '}
              <a href="mailto:support@sabitek.store" className="text-red-500 hover:text-red-600 font-medium">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Allowed: render the registration form ──
  const isInviteSignup = gate.reason === 'valid_invite'
  const invite = isInviteSignup ? gate.invite : null

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
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
              <Sparkles className="w-7 h-7 text-red-500" />
            </h1>
          </Link>

          {isInviteSignup && invite ? (
            <>
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                Join<br />
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  {invite.cohort_name}
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-12 max-w-md">
                You&apos;ve been invited by <span className="text-white font-medium">{invite.institution_name}</span>
                {invite.program_name ? <> to the <span className="text-white font-medium">{invite.program_name}</span> program.</> : '.'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                Start your<br />
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  learning journey
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-12 max-w-md">
                Create your account to continue.
              </p>
            </>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Structured programs</h3>
                <p className="text-gray-500 text-sm">Courses, modules, and lessons</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Verifiable certificates</h3>
                <p className="text-gray-500 text-sm">QR-backed credentials</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Built for Africa</h3>
                <p className="text-gray-500 text-sm">Mobile-first, low-bandwidth friendly</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="max-w-md w-full py-8">
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <h1 className="text-3xl font-bold flex items-center gap-1">
                <span className="text-black">Sabitek</span>
                <Sparkles className="w-6 h-6 text-red-500" />
              </h1>
            </Link>
            <p className="text-gray-600 mt-2 text-sm">
              {isInviteSignup && invite
                ? `Join ${invite.cohort_name}`
                : 'Create your account'}
            </p>
          </div>

          {/* Invite confirmation strip (desktop shows context on left, so this is mainly for mobile clarity) */}
          {isInviteSignup && invite && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-semibold">Invite verified</p>
                <p className="mt-0.5">
                  Joining <strong>{invite.cohort_name}</strong> at <strong>{invite.institution_name}</strong>.
                </p>
              </div>
            </div>
          )}

          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                {isInviteSignup ? 'Create your account' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-sm">
                {isInviteSignup
                  ? 'Complete your details to finish joining.'
                  : 'Sign up to continue.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      {...register('fullName')}
                      placeholder="John Doe"
                      className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName.message}</p>
                  )}
                </div>

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

                {/* Role selector only when NOT arriving via invite.
                    Invite signups are always learner. */}
                {!isInviteSignup && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      I want to
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        {...register('role')}
                        className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-red-500 bg-white text-sm"
                      >
                        <option value="learner">Learn (Student)</option>
                        <option value="instructor">Teach (Instructor)</option>
                      </select>
                    </div>
                    {errors.role && (
                      <p className="text-red-500 text-sm">{errors.role.message}</p>
                    )}
                  </div>
                )}

                {/* Hidden role input when invite-arrived, so RHF submit sees 'learner'. */}
                {isInviteSignup && (
                  <input type="hidden" value="learner" {...register('role')} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        {...register('password')}
                        type="password"
                        placeholder="••••••••"
                        className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Confirm
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        {...register('confirmPassword')}
                        type="password"
                        placeholder="••••••••"
                        className="h-12 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isInviteSignup ? 'Join & Create Account' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500">Or</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing up, you agree to our{' '}
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