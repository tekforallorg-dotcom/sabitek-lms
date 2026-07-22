'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AuthShell,
  AuthCard,
  AuthDivider,
  BtnSheen,
  authInputClass,
  authPrimaryBtnClass,
  authOutlineBtnClass,
} from '@/components/auth/AuthShell'
import {
  Mail,
  Lock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  User,
  CheckCircle,
  Award,
  Globe,
  Building2,
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

function RegisterPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [gate, setGate] = useState<SignupGateDecision | null>(null)
  const [gateLoading, setGateLoading] = useState(true)
  // Team invite (instructor/viewer/program manager): registered server-side so
  // the membership attaches atomically and no confirmation email is needed.
  const [teamInvite, setTeamInvite] = useState<{ email: string | null; role: string; institution_name: string } | null>(null)

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
        if (inviteToken) {
          const tRes = await fetch(`/api/join/team/${encodeURIComponent(inviteToken)}/preview`)
          if (tRes.ok) {
            const tJson = await tRes.json()
            const info = tJson.data || tJson
            if (!cancelled && info?.role) {
              setTeamInvite({ email: info.email || null, role: info.role, institution_name: info.institution_name })
              if (info.email) setValue('email', info.email)
            }
          }
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
    setValue,
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

    // Team invites register server-side: the account arrives confirmed with
    // the membership already attached, then we sign in and go straight in.
    if (teamInvite && inviteToken) {
      try {
        const res = await fetch(`/api/join/team/${encodeURIComponent(inviteToken)}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: data.fullName,
            email: data.email,
            password: data.password,
          }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(payload.error || payload.message || 'Could not create the account. Please try again.')
          setIsLoading(false)
          return
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: payload.email || data.email,
          password: data.password,
        })
        setIsLoading(false)
        if (signInError) {
          router.push('/auth/login')
          return
        }
        router.push(payload.next_route || '/dashboard')
      } catch {
        setError('Could not create the account. Please try again.')
        setIsLoading(false)
      }
      return
    }

    // When arriving via a learner invite, always register as learner.
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
      <AuthShell
        eyebrow="One last step"
        titleTop="You're almost"
        titleAccent="there."
        description="Just one more step to unlock your learning."
        mobileSubtitle="Check your email"
        footer={
          <>
            Need help?{' '}
            <a href="mailto:support@sabitek.store" className="text-red-500 hover:text-red-600 font-medium">
              Contact support
            </a>
          </>
        }
      >
        <AuthCard
          title="Check your"
          titleAccent="email"
          description={
            <>
              We&apos;ve sent a verification link to{' '}
              <span className="font-semibold text-gray-900">{registeredEmail}</span>
            </>
          }
          headerExtra={
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          }
        >
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-b from-rose-50/70 to-white border border-rose-100 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Next steps</p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  'Check your inbox for the verification email',
                  'Click the verification link in the email',
                  'Sign in to start learning',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-center text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder.
            </p>

            <Link href="/auth/login" className="block">
              <Button className={authPrimaryBtnClass}>
                <BtnSheen />
                <span className="flex items-center justify-center gap-2">
                  Back to Login
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Button>
            </Link>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  // ── Gate loading shell ──
  if (gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
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
      <AuthShell
        eyebrow="Access"
        titleTop="Learning built for"
        titleAccent="institutions."
        description="Schools, NGOs, government programs, and verified training providers use Sabitek to deliver structured learning at scale."
        features={[
          { icon: Building2, title: 'Institutions & NGOs', desc: 'Run cohorts, track outcomes, export evidence' },
          { icon: Award, title: 'Training Centers', desc: 'Publish structured tracks, issue credentials' },
          { icon: Globe, title: 'Verified Instructors', desc: 'Join as an approved subject expert' },
        ]}
        mobileSubtitle="Access by invite"
        footer={
          <>
            Need help?{' '}
            <a href="mailto:support@sabitek.store" className="text-red-500 hover:text-red-600 font-medium">
              Contact support
            </a>
          </>
        }
      >
        <AuthCard
          title={copy.title}
          description={copy.desc}
          headerExtra={
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
              <Ticket className="w-7 h-7 text-white" />
            </div>
          }
        >
          <div className="space-y-3.5">
            <Link href="/request-access" className="block">
              <Button className={authPrimaryBtnClass}>
                <BtnSheen />
                <span className="flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Button>
            </Link>

            <Link href="/auth/login" className="block">
              <Button variant="outline" className={authOutlineBtnClass}>
                I already have an account
              </Button>
            </Link>

            <div className="rounded-2xl bg-gradient-to-b from-rose-50/70 to-white border border-rose-100 p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Have an invite link?</strong> Paste it into
                your browser to continue. Invite links look like{' '}
                <code className="bg-white border border-rose-100 px-1.5 py-0.5 rounded text-[11px] text-rose-600">
                  /join/&lt;token&gt;
                </code>
                .
              </p>
            </div>

            <p className="text-center text-xs text-gray-500 pt-1">
              Individual learner?{' '}
              <Link href="/waitlist" className="text-red-500 hover:text-red-600 font-medium">
                Join the waitlist
              </Link>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  // ── Allowed: render the registration form ──
  const isInviteSignup = gate.reason === 'valid_invite'
  const invite = isInviteSignup ? gate.invite : null

  return (
    <AuthShell
      eyebrow={isInviteSignup ? 'You are invited' : 'Get started'}
      titleTop={isInviteSignup && invite ? 'Join' : 'Start your'}
      titleAccent={isInviteSignup && invite ? `${invite.cohort_name}.` : 'learning journey.'}
      description={
        isInviteSignup && invite ? (
          <>
            You&apos;ve been invited by{' '}
            <span className="text-gray-900 font-medium">{invite.institution_name}</span>
            {invite.program_name ? (
              <>
                {' '}to the{' '}
                <span className="text-gray-900 font-medium">{invite.program_name}</span> program.
              </>
            ) : (
              '.'
            )}
          </>
        ) : (
          'Create your account to continue.'
        )
      }
      features={[
        { icon: BookOpen, title: 'Structured programs', desc: 'Courses, modules, and lessons' },
        { icon: Award, title: 'Verifiable certificates', desc: 'QR-backed credentials' },
        { icon: Globe, title: 'Built for Africa', desc: 'Mobile-first, low-bandwidth friendly' },
      ]}
      mobileSubtitle={isInviteSignup && invite ? `Join ${invite.cohort_name}` : 'Create your account'}
      footer={
        <>
          By signing up, you agree to our{' '}
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
      {/* Invite confirmation strip (desktop shows context on left, so this is mainly for mobile clarity) */}
      {isInviteSignup && invite && (
        <div className="mb-4 bg-white/70 backdrop-blur rounded-2xl border border-white ring-1 ring-emerald-100 shadow-[0_10px_25px_-15px_rgba(16,185,129,0.4)] p-3.5 flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-3 h-3 text-white" />
          </span>
          <div className="text-xs text-gray-700">
            <p className="font-semibold text-gray-900">Invite verified</p>
            <p className="mt-0.5">
              Joining <strong>{invite.cohort_name}</strong> at <strong>{invite.institution_name}</strong>.
            </p>
          </div>
        </div>
      )}

      <AuthCard
        title="Create your"
        titleAccent="account"
        description={isInviteSignup ? 'Complete your details to finish joining.' : 'Sign up to continue.'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                className={authInputClass}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                readOnly={!!teamInvite?.email}
                className={`${authInputClass} ${teamInvite?.email ? 'opacity-75 cursor-not-allowed' : ''}`}
              />
            </div>
            {teamInvite?.email && (
              <p className="text-xs text-gray-500">This invite was sent to this email address.</p>
            )}
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          {/* Role selector only when NOT arriving via invite.
              Invite signups are always learner. */}
          {!isInviteSignup && (
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">I want to</label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <select
                  {...register('role')}
                  className="w-full h-12 pl-11 pr-3 rounded-xl border border-rose-100 bg-white/70 focus:border-red-400 focus:ring-red-400 text-sm cursor-pointer"
                >
                  <option value="learner">Learn (Student)</option>
                  <option value="instructor">Teach (Instructor)</option>
                </select>
              </div>
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>
          )}

          {/* Hidden role input when invite-arrived, so RHF submit sees 'learner'. */}
          {isInviteSignup && <input type="hidden" value="learner" {...register('role')} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <Input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={authInputClass}
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-gray-700">Confirm</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={authInputClass}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className={`${authPrimaryBtnClass} mt-2`}>
            <BtnSheen />
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isInviteSignup ? 'Join & Create Account' : 'Create Account'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </Button>

          <AuthDivider />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
          <SabiLoader text="Loading..." size="lg" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
