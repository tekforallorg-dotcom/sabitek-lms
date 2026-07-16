'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toast'
import SabiLoader from '@/components/ui/SabiLoader'
import { MessageCircleQuestion, Send } from 'lucide-react'

interface InstructorQuestion {
  id: string
  question: string
  answer: string | null
  answered_at: string | null
  created_at: string
  lesson_title: string
  lesson_slug: string
  course_title: string
  course_slug: string
  asker_name: string
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InstructorQuestionsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [questions, setQuestions] = useState<InstructorQuestion[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unanswered'>('unanswered')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/instructor/questions', {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      })
      if (!res.ok) {
        setQuestions([])
        return
      }
      const json = await res.json()
      setQuestions(json.questions || [])
    } catch {
      setQuestions([])
    } finally {
      setDataLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else {
        fetchQuestions()
      }
    }
  }, [user, loading, router, fetchQuestions])

  const handleSend = async (questionId: string) => {
    const answer = (drafts[questionId] || '').trim()
    if (!answer) return
    setSendingId(questionId)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/auth/login')
        return
      }
      const res = await fetch('/api/instructor/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ questionId, answer }),
      })
      const json = await res.json()
      if (!res.ok || !json.answered) {
        toast.error(json.error || 'Could not send answer. Try again.')
        return
      }
      toast.success('Answer sent - the learner has been notified')
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer, answered_at: new Date().toISOString() }
            : q
        )
      )
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    } catch {
      toast.error('Could not send answer. Try again.')
    } finally {
      setSendingId(null)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading questions..." size="lg" />
      </div>
    )
  }

  const visible = questions.filter((q) => (filter === 'unanswered' ? !q.answer : true))

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-rose-100/80">
        <div className="absolute -top-24 right-[-8%] w-96 h-96 bg-rose-100/70 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-[-8%] w-72 h-72 bg-red-50 rounded-full blur-[80px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
            Questions
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-1">
            Learner{' '}
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              questions
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Answer once - every learner in the lesson benefits.
          </p>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 p-1 bg-rose-50/70 border border-rose-100 rounded-full w-fit mt-5">
            {([
              { key: 'unanswered', label: 'Unanswered' },
              { key: 'all', label: 'All' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filter === f.key
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-rose-100'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
        {visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircleQuestion className="w-8 h-8 text-rose-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No questions{' '}
              <span className="font-serif italic text-red-600">yet</span>
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              When learners ask from inside your lessons, they land here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((q) => (
              <div
                key={q.id}
                className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-5"
              >
                <p className="text-[11px] text-gray-400">
                  {q.course_title} · {q.lesson_title}
                </p>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="text-sm font-semibold text-gray-900">{q.asker_name}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(q.created_at)}</p>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{q.question}</p>

                {q.answer ? (
                  <div className="border-l-2 border-emerald-200 pl-3 mt-3">
                    <p className="text-[9px] tracking-widest text-emerald-600 font-semibold">INSTRUCTOR</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{q.answer}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(q.answered_at)}</p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={drafts[q.id] || ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Write your answer..."
                      rows={2}
                      maxLength={3000}
                      className="w-full resize-none text-sm bg-white/70 border border-rose-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-200 focus:outline-none rounded-2xl px-3.5 py-2.5 text-gray-800 placeholder:text-gray-400"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSend(q.id)}
                        disabled={!(drafts[q.id] || '').trim() || sendingId === q.id}
                        className="relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full px-5 py-2 shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                        <Send className="w-3.5 h-3.5" />
                        {sendingId === q.id ? 'Sending...' : 'Send answer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
