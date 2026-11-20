'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/toast'
import SabiLoader from '@/components/ui/SabiLoader'
import { HelpCircle, Send } from 'lucide-react'

interface LessonQuestion {
  id: string
  lesson_id: string
  course_id: string
  user_id: string
  question: string
  answer: string | null
  answered_by: string | null
  answered_at: string | null
  created_at: string
}

interface LessonQuestionsProps {
  lessonId: string
  courseId: string
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function LessonQuestions({ lessonId, courseId }: LessonQuestionsProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<LessonQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      setQuestions(data || [])
    } catch {
      // Table may not exist yet — treat as empty rather than crashing.
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleAsk = async () => {
    const trimmed = question.trim()
    if (trimmed.length < 5 || !user) return
    setSending(true)
    try {
      const { error } = await supabase.from('lesson_questions').insert({
        lesson_id: lessonId,
        course_id: courseId,
        user_id: user.id,
        question: trimmed,
      })
      if (error) throw error
      toast.success('Question sent to your instructor')
      setQuestion('')
      await fetchQuestions()
    } catch {
      toast.error('Could not send. Try again.')
    } finally {
      setSending(false)
    }
  }

  const tooShort = question.trim().length < 5

  return (
    <div className="space-y-4">
      {/* Ask box */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your instructor about this lesson..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none text-sm bg-white/70 border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-gray-200 focus:outline-none rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400"
          />
          <span className="absolute bottom-2.5 right-3 text-xs text-gray-400 tabular-nums">
            {question.length}/1000
          </span>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAsk}
            disabled={tooShort || sending}
            className="relative overflow-hidden inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-full px-5 py-2 ring-1 ring-red-600/50 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SabiLoader text="Loading questions..." size="sm" />
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto bg-red-50 border border-gray-200 rounded-full flex items-center justify-center mb-3">
            <HelpCircle className="w-7 h-7 text-red-300" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No questions yet</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Stuck on something in this lesson? Your instructor is one question away.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900">{q.question}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(q.created_at)}</p>
              {q.answer ? (
                <div className="border-l-2 border-green-200 pl-3 mt-2">
                  <p className="text-xs tracking-widest text-green-600 font-medium">INSTRUCTOR</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{q.answer}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(q.answered_at)}</p>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 mt-2 px-3 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  awaiting answer
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
