'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Mail,
  User,
  BookOpen,
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  Rocket,
  Send,
  Award,
  Users,
  Clock,
  GraduationCap,
} from 'lucide-react'

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
        <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="text-3xl font-bold text-gray-900">Sabitek</span>
              <Sparkles className="w-5 h-5 text-red-500" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Application Received</h1>
              <p className="text-purple-100 text-sm">
                We will review your application and respond to <strong className="text-white">{submittedEmail}</strong>
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  What happens next
                </p>
                <div className="space-y-4">
                  {[
                    { step: '1', label: 'Application review', desc: 'Our team reviews your profile and expertise within 2-5 working days.' },
                    { step: '2', label: 'Approval and workspace setup', desc: 'Once approved, you receive a welcome email with your workspace login.' },
                    { step: '3', label: 'Start creating', desc: 'Build your first training program, create cohorts, and invite learners.' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-700">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">{item.label}</p>
                        <p className="text-xs text-purple-700 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 border rounded-xl p-4">
                <p className="text-xs text-gray-600 text-center">
                  If you don't hear from us within 5 working days, please check your spam folder or email us at <a href="mailto:impact@tekforall.org" className="text-red-500 font-medium">impact@tekforall.org</a>
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/schools-and-tutors">
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    Learn more about Sabitek
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full h-11 rounded-xl text-gray-500">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form state ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
        </div>

        {/* Value prop strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: 'Create programs', desc: 'Structured tracks' },
            { icon: Users, label: 'Manage cohorts', desc: 'Invite and track' },
            { icon: Award, label: 'Issue certificates', desc: 'QR-verifiable' },
          ].map((item, i) => (
            <div key={i} className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <item.icon className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 sm:p-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Become a Verified Training Provider</h1>
            <p className="text-sm text-white/80">
              Get your own workspace to create programs, manage cohorts, and issue credentials.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Full name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Your full name"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@email.com"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Brand or training name</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.brandName}
                      onChange={(e) => handleChange('brandName', e.target.value)}
                      placeholder="e.g. TechSkills Academy"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Leave blank to use your name</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g. Nigeria"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Area of expertise *</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      value={formData.expertise}
                      onChange={(e) => handleChange('expertise', e.target.value)}
                      placeholder="e.g. Data Analysis, Web Development"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teaching experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white text-sm"
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
                <label className="text-sm font-medium text-gray-700">Tell us about your training *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="What topics do you teach? Who are your typical learners? What formats do you use (live sessions, self-paced, workshops)?"
                    rows={4}
                    maxLength={2000}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 focus:outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !formData.fullName || !formData.email || !formData.expertise || !formData.description}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 text-base"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit Application
                    <Send className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-500">
              <span>Representing an institution? <Link href="/request-access" className="text-red-500 font-medium">Get Started here</Link></span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span>Already have an account? <Link href="/auth/login" className="text-red-500 font-medium">Sign in</Link></span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 mb-4">
            We review applications within 2-5 working days. Approved providers get a full workspace.
          </p>
        </div>
      </div>
    </div>
  )
}