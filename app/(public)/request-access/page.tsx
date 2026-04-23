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
  Building2,
  MapPin,
  Users,
  Briefcase,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  Rocket,
  Send,
} from 'lucide-react'

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organisation: '',
    role: '',
    country: '',
    type: '',
    learnerCount: '',
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
          organisation_name: formData.organisation,
          role_title: formData.role || undefined,
          country: formData.country || undefined,
          org_type: formData.type || 'other',
          learner_count: formData.learnerCount || undefined,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="text-3xl font-bold text-gray-900">Sabitek</span>
              <Sparkles className="w-5 h-5 text-red-500" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Application Received</h1>
              <p className="text-emerald-100 text-sm">
                We will review your application and respond to <strong className="text-white">{submittedEmail}</strong>
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  What happens next
                </p>
                <div className="space-y-4">
                  {[
                    { step: '1', label: 'Application review', desc: 'Our team reviews your details within 2-5 working days.', icon: Clock },
                    { step: '2', label: 'Approval email', desc: 'You receive an approval email with your workspace setup link.', icon: Mail },
                    { step: '3', label: 'Set up your workspace', desc: 'Create your first program, set up cohorts, and invite learners.', icon: Building2 },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-700">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">{item.label}</p>
                        <p className="text-xs text-blue-700 mt-0.5">{item.desc}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold text-gray-900">Sabitek</span>
            <Sparkles className="w-5 h-5 text-red-500" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 sm:p-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Get Started with Sabitek</h1>
            <p className="text-sm text-white/80">
              Tell us about your institution or training program. We review applications within 2-5 working days.
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
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Work email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="you@organisation.com"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Organisation name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      value={formData.organisation}
                      onChange={(e) => handleChange('organisation', e.target.value)}
                      placeholder="Your organisation"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Your role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      placeholder="e.g. Director, Program Manager"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g. Nigeria"
                      className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Organisation type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-red-500 bg-white text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="school">School or College</option>
                    <option value="ngo">NGO or Non-profit</option>
                    <option value="government">Government Agency or Program</option>
                    <option value="training_center">Training Center or Academy</option>
                    <option value="company">Company or Corporate Training</option>
                    <option value="tutor">Independent Instructor or Trainer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Approximate number of learners</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.learnerCount}
                    onChange={(e) => handleChange('learnerCount', e.target.value)}
                    placeholder="e.g. 50, 200, 1000+"
                    className="h-11 pl-10 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">What would you like to do with Sabitek? *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="e.g. Run digital skills training for 200 youth in Lagos"
                    rows={3}
                    maxLength={2000}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-red-500 focus:outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !formData.fullName || !formData.email || !formData.organisation || !formData.type || !formData.description}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 text-base"
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
              <span>Already have an account? <Link href="/auth/login" className="text-red-500 font-medium">Sign in</Link></span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span>Individual learner? <Link href="/waitlist" className="text-red-500 font-medium">Join the waitlist</Link></span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 mb-4">
            We review applications within 2-5 working days. No spam.
          </p>
        </div>
      </div>
    </div>
  )
}