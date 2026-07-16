'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Activity,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  Filter,
  HelpCircle,
  UsersRound,
  Megaphone,
  Send,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'

interface Summary {
  enrolled: number
  active_7d: number
  completed: number
  completion_rate: number
  at_risk: number
}
interface TrendPoint {
  week: string
  count: number
}
interface FunnelStep {
  lesson_id: string
  title: string
  order: number
  completions: number
}
interface QuizItem {
  question: string
  answered: number
  correct_rate: number | null
}
interface Quiz {
  lesson_id: string
  lesson_title: string
  attempts: number
  pass_rate: number | null
  avg_score: number | null
  items: QuizItem[]
}
interface RosterEntry {
  name: string
  enrolled_at: string
  lessons_completed: number
  total_lessons: number
  progress_pct: number
  last_active: string | null
  at_risk: boolean
}
interface Analytics {
  course_title: string
  summary: Summary
  trend: TrendPoint[]
  funnel: FunnelStep[]
  quizzes: Quiz[]
  roster: RosterEntry[]
}

const glassCard =
  'relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]'

function Hairline() {
  return (
    <span
      className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
      aria-hidden="true"
    />
  )
}

function formatDate(value: string | null) {
  if (!value) return 'never'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'never'
  return d.toLocaleDateString()
}

export default function CourseAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const slug = params.slug as string

  const [data, setData] = useState<Analytics | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  const [message, setMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const loadAnalytics = async () => {
    setPageLoading(true)
    setErrored(false)
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('slug', slug)
        .eq('instructor_id', user?.id)
        .single()

      if (courseError || !courseData) {
        router.push('/instructor')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(`/api/instructor/course-analytics?courseId=${courseData.id}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      })

      if (!res.ok) {
        setErrored(true)
        return
      }

      const json: Analytics = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setErrored(true)
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile?.role !== 'instructor') {
        router.push('/dashboard')
      } else {
        loadAnalytics()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile, loading, slug])

  const handleSend = async () => {
    if (!data || !message.trim()) return
    setSending(true)
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .eq('instructor_id', user?.id)
        .single()

      const { data: sessionData } = await supabase.auth.getSession()
      if (!courseData || !sessionData.session) {
        toast.error('Session expired. Please refresh and try again.')
        return
      }

      const res = await fetch('/api/instructor/announce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ courseId: courseData.id, message: message.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to send announcement')
        return
      }

      toast.success(`Sent to ${json.sent} learners`)
      if (json.failed > 0) {
        toast.warning(`${json.failed} message${json.failed === 1 ? '' : 's'} could not be delivered`)
      }
      setMessage('')
      setConfirmOpen(false)
    } catch (error) {
      console.error('Error sending announcement:', error)
      toast.error('Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading analytics..." size="lg" />
      </div>
    )
  }

  if (errored || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb] px-4">
        <div className={`${glassCard} max-w-md w-full p-8 text-center`}>
          <Hairline />
          <div className="w-14 h-14 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">
            We couldn&apos;t load your{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              analytics
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Something went wrong fetching the numbers. Give it another try.
          </p>
          <button
            onClick={loadAnalytics}
            className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full px-5 py-2.5 text-sm shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { summary, trend, funnel, quizzes, roster } = data

  const maxTrend = Math.max(1, ...trend.map((t) => t.count))
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.completions))

  const kpis = [
    {
      icon: Users,
      label: 'Enrolled',
      value: summary.enrolled,
      sub: 'learners in this course',
      amber: false,
    },
    {
      icon: Activity,
      label: 'Active this week',
      value: summary.active_7d,
      sub: 'active in the last 7 days',
      amber: false,
    },
    {
      icon: GraduationCap,
      label: 'Completed',
      value: summary.completed,
      sub: `${summary.completion_rate}% completion rate`,
      amber: false,
    },
    {
      icon: AlertTriangle,
      label: 'At risk',
      value: summary.at_risk,
      sub: 'quiet for two weeks or more',
      amber: summary.at_risk > 0,
    },
  ]

  const visibleRoster = roster.slice(0, 30)
  const hiddenRoster = roster.length - visibleRoster.length

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-rose-100/80">
        <div className="absolute -top-24 right-[-8%] w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-20 left-[-8%] w-72 h-72 bg-red-50 rounded-full blur-[80px]" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <button
            onClick={() => router.push(`/instructor/courses/${slug}`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors mb-5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to course
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
            Course Analytics
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-2">
            {data.course_title}
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Live numbers from your learners. Refreshed every visit.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 space-y-6">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className={`${glassCard} p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(225,29,72,0.45)] transition-all`}
            >
              <Hairline />
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)] ${
                    kpi.amber
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-red-500 to-rose-500'
                  }`}
                >
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
                  <p
                    className={`text-2xl font-semibold tabular-nums ${
                      kpi.amber ? 'text-amber-600' : 'text-gray-900'
                    }`}
                  >
                    {kpi.value}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 truncate">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Enrollment trend */}
        <div className={`${glassCard} p-5 sm:p-6`}>
          <Hairline />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Enrollments · last 12 weeks
              </h2>
              <p className="text-xs text-gray-500">New learners joining, week by week</p>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-24">
            {trend.map((point, i) => {
              const pct = point.count > 0 ? Math.max(4, (point.count / maxTrend) * 100) : 0
              return (
                <div key={i} className="flex-1 h-full flex items-end" title={`${point.week}: ${point.count}`}>
                  {point.count > 0 ? (
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-red-500 to-rose-400"
                      style={{ height: `${pct}%` }}
                    />
                  ) : (
                    <div className="w-full h-0.5 rounded bg-gray-100" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-2">
            {trend.map((point, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-gray-400 tabular-nums">
                {i % 2 === 0 ? point.week : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Lesson funnel */}
        <div className={`${glassCard} p-5 sm:p-6`}>
          <Hairline />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Where learners stop
              </h2>
              <p className="text-xs text-gray-500">Completions per lesson, in order</p>
            </div>
          </div>

          {funnel.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3">
                <Filter className="w-6 h-6 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500">No lessons to chart yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {funnel.map((step, i) => {
                const prev = i > 0 ? funnel[i - 1].completions : null
                const bigDrop =
                  prev !== null && prev > 0 && (prev - step.completions) / prev > 0.3
                const width = maxFunnel > 0 ? (step.completions / maxFunnel) * 100 : 0
                return (
                  <div key={step.lesson_id} className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-gray-300 tabular-nums text-right flex-shrink-0">
                      {step.order}
                    </span>
                    <span className="text-sm text-gray-700 truncate w-40 sm:w-56 flex-shrink-0">
                      {step.title}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-rose-50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    {bigDrop && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
                        big drop
                      </span>
                    )}
                    <span
                      className={`w-10 text-sm font-semibold tabular-nums text-right flex-shrink-0 ${
                        bigDrop ? 'text-amber-600' : 'text-gray-900'
                      }`}
                    >
                      {step.completions}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quiz insights */}
        {quizzes.length > 0 && (
          <div className={`${glassCard} p-5 sm:p-6`}>
            <Hairline />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">Quiz insights</h2>
                <p className="text-xs text-gray-500">Which questions trip learners up</p>
              </div>
            </div>

            <div className="space-y-5">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.lesson_id}
                  className="rounded-2xl border border-rose-100 bg-white/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mr-1">{quiz.lesson_title}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 tabular-nums">
                      {quiz.attempts} attempts
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 tabular-nums">
                      {quiz.pass_rate ?? 0}% pass
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 tabular-nums">
                      avg {quiz.avg_score ?? 0}%
                    </span>
                  </div>

                  {quiz.items.length === 0 ? (
                    <p className="text-xs text-gray-400">No question data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {quiz.items.map((item, idx) => {
                        if (item.correct_rate === null) {
                          return (
                            <div key={idx}>
                              <p className="text-xs text-gray-700 line-clamp-2 mb-1">{item.question}</p>
                              <p className="text-xs text-gray-400">no data yet</p>
                            </div>
                          )
                        }
                        const review = item.correct_rate < 50
                        return (
                          <div key={idx}>
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <p className="text-xs text-gray-700 line-clamp-2 flex-1">{item.question}</p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {review && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                    review this question
                                  </span>
                                )}
                                <span
                                  className={`text-xs font-semibold tabular-nums ${
                                    review ? 'text-amber-600' : 'text-gray-900'
                                  }`}
                                >
                                  {item.correct_rate}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-rose-50 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  review
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-500 to-rose-400'
                                }`}
                                style={{ width: `${item.correct_rate}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roster */}
        <div className={`${glassCard} p-5 sm:p-6`}>
          <Hairline />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
              <UsersRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Learners ({roster.length})
              </h2>
              <p className="text-xs text-gray-500">Sorted by progress</p>
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3">
                <UsersRound className="w-6 h-6 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500">No enrolled learners yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visibleRoster.map((learner, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white/70 px-3 py-2.5"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                        learner.at_risk
                          ? 'bg-amber-50 border-amber-100 text-amber-600'
                          : 'bg-rose-50 border-rose-100 text-red-600'
                      }`}
                    >
                      {(learner.name || '?').charAt(0).toUpperCase()}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{learner.name}</p>
                        {learner.at_risk && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
                            at risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-2 rounded-full bg-rose-50 overflow-hidden max-w-[220px]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
                            style={{ width: `${learner.progress_pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 tabular-nums flex-shrink-0">
                          {learner.lessons_completed}/{learner.total_lessons}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-gray-400 tabular-nums flex-shrink-0 hidden sm:block">
                      {formatDate(learner.last_active)}
                    </span>
                  </div>
                ))}
              </div>
              {hiddenRoster > 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  +{hiddenRoster} more learner{hiddenRoster === 1 ? '' : 's'}
                </p>
              )}
            </>
          )}
        </div>

        {/* Announcement composer */}
        <div className={`${glassCard} p-5 sm:p-6`}>
          <Hairline />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(225,29,72,0.5)]">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                Message your learners
              </p>
              <p className="text-xs text-gray-500">One email to everyone enrolled</p>
            </div>
          </div>

          <textarea
            rows={4}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share an update, encouragement, or a heads-up about new lessons..."
            className="w-full rounded-2xl border border-rose-100 bg-white/70 backdrop-blur px-4 py-3 text-sm placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400 tabular-nums">{message.length}/2000</span>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!message.trim() || summary.enrolled === 0}
              className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full px-5 py-2.5 text-sm shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
              <span className="relative flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                Send to {summary.enrolled} learner{summary.enrolled === 1 ? '' : 's'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm overlay */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !sending && setConfirmOpen(false)}
          />
          <div className="relative bg-white/95 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_50px_-20px_rgba(225,29,72,0.45)] max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-gray-900">Send announcement?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                This emails {summary.enrolled} enrolled learner{summary.enrolled === 1 ? '' : 's'}. Replies go
                to your email.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={sending}
                  className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 font-medium rounded-full px-5 py-2.5 text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full px-5 py-2.5 text-sm shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
                >
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                  {sending ? (
                    <span className="relative [&>div]:!py-0">
                      <SabiLoader text="Sending..." size="sm" />
                    </span>
                  ) : (
                    <span className="relative">Send now</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
