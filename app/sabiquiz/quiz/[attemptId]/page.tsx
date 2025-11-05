'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, Bookmark, Loader2, CheckCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { Question } from '@/lib/sabiquiz/types'

interface QuizState {
  attemptId: string
  questions: Question[]
  answers: Map<string, number>
  bookmarks: Set<string>
  timePerQuestion: Map<string, number>
  startTime: number
  currentQuestionStartTime: number
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [state, setState] = useState<QuizState>({
    attemptId,
    questions: [],
    answers: new Map(),
    bookmarks: new Set(),
    timePerQuestion: new Map(),
    startTime: Date.now(),
    currentQuestionStartTime: Date.now(),
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    fetchQuestions()
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  async function fetchQuestions() {
    try {
      setLoading(true)
      
      const { data: attemptData, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .select('question_ids, status')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      
      const questionIds = attemptData.question_ids
      if (!questionIds || questionIds.length === 0) {
        throw new Error('No questions found for this quiz')
      }
      
      const { data, error: fetchError } = await supabase
        .from('sabiquiz_questions')
        .select('*')
        .in('id', questionIds)

      if (fetchError) throw fetchError

      const orderedQuestions = questionIds.map((id: string) => 
        data.find(q => q.id === id)
      ).filter(Boolean)

      setState(prev => ({
        ...prev,
        questions: orderedQuestions,
      }))

      // Load draft answers if quiz is in progress
      if (attemptData.status === 'in_progress') {
        await loadDraftAnswers()
      }

      await supabase
        .from('sabiquiz_attempts')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString() 
        })
        .eq('id', attemptId)

    } catch (err: any) {
      console.error('Error fetching questions:', err)
      setError('Failed to load quiz questions')
    } finally {
      setLoading(false)
    }
  }

  async function loadDraftAnswers() {
    try {
      const { data, error } = await supabase
        .from('sabiquiz_draft_responses')
        .select('*')
        .eq('attempt_id', attemptId)

      if (error) throw error

      if (data && data.length > 0) {
        const answers = new Map<string, number>()
        const bookmarks = new Set<string>()

        data.forEach(draft => {
          if (draft.selected_answer !== null) {
            answers.set(draft.question_id, draft.selected_answer)
          }
          if (draft.bookmarked) {
            bookmarks.add(draft.question_id)
          }
        })

        setState(prev => ({
          ...prev,
          answers,
          bookmarks,
        }))
      }
    } catch (err) {
      console.error('Error loading draft answers:', err)
    }
  }

  function handleAnswerSelect(questionId: string, answerIndex: number) {
    setState(prev => {
      const newAnswers = new Map(prev.answers)
      newAnswers.set(questionId, answerIndex)
      return { ...prev, answers: newAnswers }
    })
  }

  function toggleBookmark(questionId: string) {
    setState(prev => {
      const newBookmarks = new Set(prev.bookmarks)
      if (newBookmarks.has(questionId)) {
        newBookmarks.delete(questionId)
      } else {
        newBookmarks.add(questionId)
      }
      return { ...prev, bookmarks: newBookmarks }
    })
  }

  async function handleSaveAndExit() {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Prepare draft responses
      const drafts = state.questions.map(q => ({
        attempt_id: attemptId,
        question_id: q.id,
        user_id: user.id,
        selected_answer: state.answers.get(q.id) ?? null,
        bookmarked: state.bookmarks.has(q.id),
      }))

      // Upsert draft responses
      const { error } = await supabase
        .from('sabiquiz_draft_responses')
        .upsert(drafts, { 
          onConflict: 'attempt_id,question_id',
          ignoreDuplicates: false 
        })

      if (error) throw error

      // Update attempt status
      await supabase
        .from('sabiquiz_attempts')
        .update({ status: 'in_progress' })
        .eq('id', attemptId)

      router.push('/sabiquiz/materials')
    } catch (err: any) {
      console.error('Error saving progress:', err)
      setError('Failed to save progress')
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (state.answers.size === 0) {
      alert('Please answer at least one question')
      return
    }

    const unanswered = state.questions.filter(q => !state.answers.has(q.id))
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const totalTime = Math.floor((Date.now() - state.startTime) / 1000)
      const avgTimePerQuestion = Math.floor(totalTime / state.questions.length)

      const responses = state.questions.map(q => {
        const selectedAnswer = state.answers.get(q.id)
        const isCorrect = selectedAnswer === q.correct_answer
        
        return {
          attempt_id: attemptId,
          question_id: q.id,
          user_id: user.id,
          selected_answer: selectedAnswer ?? null,
          correct: selectedAnswer !== undefined ? isCorrect : null,
          time_seconds: avgTimePerQuestion,
          bookmarked: state.bookmarks.has(q.id),
        }
      })

      const { error: responseError } = await supabase
        .from('sabiquiz_responses')
        .insert(responses)

      if (responseError) throw responseError

      const correctCount = responses.filter(r => r.correct === true).length
      const score = Math.round((correctCount / state.questions.length) * 100)

      const { error: updateError } = await supabase
        .from('sabiquiz_attempts')
        .update({
          correct_answers: correctCount,
          score,
          time_taken_seconds: totalTime,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      if (updateError) throw updateError

      // Delete draft responses
      await supabase
        .from('sabiquiz_draft_responses')
        .delete()
        .eq('attempt_id', attemptId)

      router.push(`/sabiquiz/results/${attemptId}`)

    } catch (err: any) {
      console.error('Error submitting quiz:', err)
      setError('Failed to submit quiz. Please try again.')
      setSubmitting(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const answeredCount = state.answers.size
  const totalQuestions = state.questions.length
  const bookmarkedCount = state.bookmarks.size

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
  <Button
    onClick={handleSaveAndExit}
    variant="outline"
    size="sm"
    disabled={submitting || saving}
  >
    {saving ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Saving...
      </>
    ) : (
      <>
        <Save className="w-4 h-4 mr-2" />
        Save & Exit
      </>
    )}
  </Button>
</div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{answeredCount}/{totalQuestions}</span>
              </div>
              {bookmarkedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-yellow-600" />
                  <span>{bookmarkedCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {state.questions.map((question, index) => {
            const selectedAnswer = state.answers.get(question.id)
            const isBookmarked = state.bookmarks.has(question.id)
            const isAnswered = selectedAnswer !== undefined

            return (
              <Card key={question.id} className={isBookmarked ? 'border-yellow-400 border-2' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        {question.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                        )}
                        {isAnswered && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-lg font-medium text-gray-900">{question.question}</p>
                    </div>
                    
                    <Button
                      onClick={() => toggleBookmark(question.id)}
                      variant="ghost"
                      size="sm"
                      className={isBookmarked ? 'text-yellow-600' : 'text-gray-400'}
                    >
                      {isBookmarked ? <Bookmark className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
                    </Button>
                  </div>

                  <RadioGroup
                    value={selectedAnswer?.toString()}
                    onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                  >
                    <div className="space-y-3 mt-4">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === optIndex
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                          }`}
                        >
                          <RadioGroupItem value={optIndex.toString()} id={`${question.id}-${optIndex}`} />
                          <Label
                            htmlFor={`${question.id}-${optIndex}`}
                            className="flex-1 cursor-pointer font-normal"
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {question.topic && (
                    <div className="mt-4 text-sm text-gray-500">
                      Topic: {question.topic}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 -mx-4 px-4 py-4 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {answeredCount === totalQuestions ? (
                <span className="text-green-600 font-medium">All questions answered!</span>
              ) : (
                <span>{totalQuestions - answeredCount} question(s) remaining</span>
              )}
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount === 0 || saving}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit Quiz (${answeredCount}/${totalQuestions})`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}