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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SabiLoader text="Loading questions..." size="lg" />
      </div>
    )
  }

  const visible = questions.filter((q) => (filter === 'unanswered' ? !q.answer : true))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600 mb-2">
            Questions
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 mb-1">
            Learner{' '}
            <span className="font-serif italic text-red-600">
              questions
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Answer once - every learner in the lesson benefits.
          </p>

          {/* Filter pills */}
          <div className="flex items-center gap-2 p-1 bg-gray-50 border border-gray-200 rounded-full w-fit mt-5">
            {([
              { key: 'unanswered', label: 'Unanswered' },
              { key: 'all', label: 'All' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filter === f.key
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-gray-200'
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
            <div className="w-16 h-16 mx-auto bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
              <MessageCircleQuestion className="w-8 h-8 text-red-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
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
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <p className="text-xs text-gray-400">
                  {q.course_title} · {q.lesson_title}
                </p>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="text-sm font-medium text-gray-900">{q.asker_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(q.created_at)}</p>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{q.question}</p>

                {q.answer ? (
                  <div className="border-l-2 border-green-200 pl-3 mt-3">
                    <p className="text-xs tracking-widest text-green-600 font-medium">INSTRUCTOR</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{q.answer}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(q.answered_at)}</p>
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
                      className="w-full resize-none text-sm bg-white/70 border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-gray-200 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSend(q.id)}
                        disabled={!(drafts[q.id] || '').trim() || sendingId === q.id}
                        className="relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full px-5 py-2 ring-1 ring-red-600/50 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
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
