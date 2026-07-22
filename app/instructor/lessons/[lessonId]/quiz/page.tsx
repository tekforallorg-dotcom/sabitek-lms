'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Clock,
  Percent,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

interface Quiz {
  id?: string
  title: string
  pass_percentage: number
  time_limit_minutes: number | null
  questions: Question[]
}

interface PageProps {
  params: Promise<{ lessonId: string }>
}

export default function QuizPage({ params }: PageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonId, setLessonId] = useState<string>('')
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    pass_percentage: 70,
    time_limit_minutes: null,
    questions: []
  })

  const resolvedParams = use(params)

  useEffect(() => {
    setLessonId(resolvedParams.lessonId)
    fetchLessonAndQuiz(resolvedParams.lessonId)
  }, [resolvedParams.lessonId])

  async function fetchLessonAndQuiz(lessonIdParam: string) {
    try {
      setLoading(true)
      setError(null)

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('title, course_id')
        .eq('id', lessonIdParam)
        .single()

      if (lessonError) throw lessonError
      setLessonTitle(lessonData.title)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('instructor_id')
          .eq('id', lessonData.course_id)
          .single()

        if (courseData?.instructor_id !== session.user.id) {
          setError('You are not authorized to edit this quiz')
          return
        }
      }

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonIdParam)
        .single()

      if (quizData) {
        setQuiz({
          id: quizData.id,
          title: quizData.title || '',
          pass_percentage: quizData.pass_percentage || 70,
          time_limit_minutes: quizData.time_limit_minutes || null,
          questions: quizData.questions || []
        })
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      if (error.code !== 'PGRST116') {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function addQuestion() {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    }
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  function updateQuestion(index: number, field: keyof Question, value: any) {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
          : q
      )
    }))
  }

  function removeQuestion(index: number) {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  async function saveQuiz() {
    try {
      setSaving(true)
      setError(null)

      if (!quiz.title) {
        setError('Quiz title is required')
        return
      }

      if (quiz.questions.length === 0) {
        setError('At least one question is required')
        return
      }

      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i]
        if (!q.question) {
          setError(`Question ${i + 1}: Question text is required`)
          return
        }
        if (q.options.some(opt => !opt)) {
          setError(`Question ${i + 1}: All options must be filled`)
          return
        }
      }

      const quizData = {
        lesson_id: lessonId,
        title: quiz.title,
        pass_percentage: quiz.pass_percentage,
        time_limit_minutes: quiz.time_limit_minutes,
        questions: quiz.questions,
        updated_at: new Date().toISOString()
      }

      if (quiz.id) {
        const { error: updateError } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quiz.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else {
        const { data: newQuizData, error: insertError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single()

        if (insertError) {
          console.error('Create error:', insertError)
          throw insertError
        }

        if (newQuizData) {
          setQuiz(prev => ({ ...prev, id: newQuizData.id }))
        }
      }

      toast.success('Quiz saved successfully!')
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      toast.error(`Failed to save quiz: ${error.message || 'Unknown error'}`)
      setError(error.message || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  const inputClasses = "rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
  const labelClasses = "text-[13px] font-medium text-gray-700"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-rose-100/70 rounded-xl w-1/3"></div>
            <div className="h-64 bg-rose-100/50 rounded-3xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      <div className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl">
        <button
          onClick={() => router.push('/instructor')}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">Quiz builder</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            {quiz.id ? 'Edit the' : 'Create a'} <span className="font-serif italic text-red-600">quiz</span> for {lessonTitle}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Quiz Settings */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] mb-8">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-5 sm:px-8 py-5 border-b border-rose-100/70">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Quiz Settings</h2>
          </div>
          <div className="px-5 sm:px-8 py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={labelClasses}>Quiz Title</Label>
              <Input
                id="title"
                value={quiz.title}
                onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pass_percentage" className={labelClasses}>
                  <Percent className="w-4 h-4 inline mr-1 text-red-500" />
                  Pass Percentage
                </Label>
                <Input
                  id="pass_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.pass_percentage}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    pass_percentage: parseInt(e.target.value) || 70
                  }))}
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit" className={labelClasses}>
                  <Clock className="w-4 h-4 inline mr-1 text-red-500" />
                  Time Limit (minutes)
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  min="0"
                  value={quiz.time_limit_minutes || ''}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    time_limit_minutes: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  placeholder="No limit"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Questions</h2>
              <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-red-600 rounded-full text-xs font-semibold">
                {quiz.questions.length}
              </span>
            </div>
            <Button
              onClick={addQuestion}
              variant="ghost"
              className="hover:bg-rose-50 rounded-full text-gray-400 hover:text-red-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {quiz.questions.map((question, qIndex) => (
            <div key={question.id} className="border border-rose-100 rounded-xl bg-white/70 shadow-sm">
              <div className="px-5 sm:px-6 py-4 border-b border-rose-100/70 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-red-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-gray-900">Question {qIndex + 1}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                  className="hover:bg-rose-50 rounded-full text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="px-5 sm:px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <Label className={labelClasses}>Question Text</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question"
                    rows={3}
                    className={inputClasses}
                  />
                </div>

                <div className="space-y-3">
                  <Label className={labelClasses}>Answer Options</Label>
                  <RadioGroup
                    value={question.correct_answer.toString()}
                    onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', parseInt(value))}
                  >
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-xl border transition-colors ${
                          question.correct_answer === oIndex
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-white/70 border-rose-100'
                        }`}
                      >
                        <RadioGroupItem
                          value={oIndex.toString()}
                          id={`q${qIndex}-o${oIndex}`}
                          className="text-red-600 focus:ring-red-500 border-rose-200"
                        />
                        <Input
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className={`flex-1 ${inputClasses}`}
                        />
                        {question.correct_answer === oIndex && (
                          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex-shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses}>Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    placeholder="Explain why this answer is correct"
                    rows={2}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          ))}

          {quiz.questions.length === 0 && (
            <div className="border border-dashed border-rose-200 bg-rose-50/40 rounded-2xl text-center py-10 px-4 text-sm text-gray-500">
              No questions added yet. Click &quot;Add Question&quot; to get started.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button
            onClick={saveQuiz}
            disabled={saving || quiz.questions.length === 0}
            className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
            <span className="relative flex items-center">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : (quiz.id ? 'Update Quiz' : 'Save Quiz')}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/instructor')}
            className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
