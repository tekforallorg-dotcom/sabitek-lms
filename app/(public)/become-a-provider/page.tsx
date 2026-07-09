'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckCircle,
  Mail,
  User,
  BookOpen,
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  Send,
  Award,
  Users,
  Clock,
  Building2,
  GraduationCap,
} from 'lucide-react'
import { GRAIN } from '@/components/marketing/primitives'

const inputClass =
  'h-11 pl-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400'

const labelClass = 'text-[13px] font-medium text-gray-700'

function PageBackdrop() {
  return (
    <>
      <div className="absolute -top-24 right-[-8%] w-[30rem] h-[30rem] bg-rose-100/70 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-72 left-[-10%] w-80 h-80 bg-red-50 rounded-full blur-[90px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 65% 50% at 50% 20%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 50% at 50% 20%, black, transparent)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: GRAIN }} />
    </>
  )
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_30px_60px_-25px_rgba(225,29,72,0.35)] overflow-hidden">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

export default function BecomeProviderPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    brandName: '',
    country: '',
    expertise: '',
    experience: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/institution-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          organisation_name: formData.brandName || `${formData.fullName}'s Training`,
          role_title: formData.expertise || undefined,
          country: formData.country || undefined,
          org_type: 'tutor',
          learner_count: formData.experience || undefined,
          description: formData.description,
        }),
      })

      const json = await res.json().catch(() => ({}))
      const payload = json.data || json

      if (res.ok) {
        setSubmittedEmail(formData.email)
        setSubmitted(true)
      } else {
        setError(payload.error || payload.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div className="relative min-h-screen bg-[#fffcfb] overflow-hidden">
        <PageBackdrop />
        <div className="relative max-w-xl mx-auto px-4 py-16 sm:py-20">
          <GlassCard>
            <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.5)] flex items-center justify-center mb-5">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Application{' '}
                <span className="font-serif italic text-red-600">received</span>
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                We will review your application and respond to{' '}
                <span className="font-semibold text-gray-900">{submittedEmail}</span>
              </p>
            </div>

            <div className="px-6 sm:px-10 pb-10 space-y-5">
              <div className="rounded-2xl bg-gradient-to-b from-rose-50/70 to-white border border-rose-100 p-5">
                <p className="text-sm font-semibold text-gray-800 mb-4">What happens next</p>
                <div className="space-y-4">
                  {[
                    { label: 'Application review', desc: 'Our team reviews your profile and expertise within 2-5 working days.', icon: Clock },
                    { label: 'Approval and workspace setup', desc: 'Once approved, you receive a welcome email with your workspace login.', icon: Mail },
                    { label: 'Start creating', desc: 'Build your first training program, create cohorts, and invite learners.', icon: GraduationCap },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          <span className="text-rose-400 font-serif italic mr-1.5">{i + 1}.</span>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center leading-relaxed px-2">
                If you don&apos;t hear from us within 5 working days, please check your spam folder
                or email us at{' '}
                <a href="mailto:impact@tekforall.org" className="text-red-500 hover:text-red-600 font-medium">
                  impact@tekforall.org
                </a>
              </p>

              <div className="flex flex-col gap-3">
                <Link href="/schools-and-tutors">
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    Learn more about Sabitek
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="w-full h-11 text-gray-500 hover:text-red-600 hover:bg-rose-50/60 text-sm font-medium rounded-full transition-all"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // ── Form state ──
  return (
    <div className="relative min-h-screen bg-[#fffcfb] overflow-hidden">
      <PageBackdrop />
      <div className="relative max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-rose-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
              For independent instructors and trainers
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-rose-300" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Become a verified{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-600">
              training provider
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Get your own workspace to create programs, manage cohorts, and issue
            credentials under your brand.
          </p>
        </div>

        {/* Value strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: 'Create programs', desc: 'Structured tracks' },
            { icon: Users, label: 'Manage cohorts', desc: 'Invite and track' },
            { icon: Award, label: 'Issue certificates', desc: 'QR-verifiable' },
          ].map((item, i) => (
            <div key={i} className="text-center p-3.5 bg-white/80 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_10px_25px_-18px_rgba(225,29,72,0.3)]">
              <item.icon className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <GlassCard>
          <div className="p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Full name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Brand or training name</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.brandName}
                      onChange={(e) => handleChange('brandName', e.target.value)}
                      placeholder="e.g. TechSkills Academy"
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Leave blank to use your name</p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g. Nigeria"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Area of expertise *</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      value={formData.expertise}
                      onChange={(e) => handleChange('expertise', e.target.value)}
                      placeholder="e.g. Data Analysis, Web Development"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Teaching experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-rose-100 bg-white/70 focus:border-red-400 focus:ring-red-400 text-sm cursor-pointer"
                  >
                    <option value="">Select experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Tell us about your training *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="What topics do you teach? Who are your typical learners? What formats do you use (live sessions, self-paced, workshops)?"
                    rows={4}
                    maxLength={2000}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-rose-100 bg-white/70 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 focus:outline-none text-sm resize-none transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !formData.fullName || !formData.email || !formData.expertise || !formData.description}
                className="group relative overflow-hidden w-full h-12 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-10px_rgba(225,29,72,0.6)] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit Application
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative mt-8 pt-5">
              <span
                className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent"
                aria-hidden="true"
              />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Representing an institution?{' '}
                  <Link href="/request-access" className="text-red-500 hover:text-red-600 font-medium">
                    Get Started here
                  </Link>
                </span>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-rose-300" aria-hidden="true" />
                <span>
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-medium">
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        <p className="text-center text-xs text-gray-400 mt-6">
          We review applications within 2-5 working days. Approved providers get a full workspace.
        </p>
      </div>
    </div>
  )
}
