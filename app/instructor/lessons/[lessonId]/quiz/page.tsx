'use client'

import { useState, useEffect, use } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const supabase = createClientComponentClient()
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

  // Unwrap params promise in Next.js 15
  const resolvedParams = use(params)

  useEffect(() => {
    setLessonId(resolvedParams.lessonId)
    fetchLessonAndQuiz(resolvedParams.lessonId)
  }, [resolvedParams.lessonId])

  async function fetchLessonAndQuiz(lessonIdParam: string) {
    try {
      setLoading(true)
      setError(null)

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('title, course_id')
        .eq('id', lessonIdParam)
        .single()

      if (lessonError) throw lessonError
      setLessonTitle(lessonData.title)

      // Check if user is the instructor
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

      // Fetch existing quiz if it exists
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
      if (error.code !== 'PGRST116') { // Not found error is ok for new quiz
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

      // Validation
      if (!quiz.title) {
        setError('Quiz title is required')
        return
      }

      if (quiz.questions.length === 0) {
        setError('At least one question is required')
        return
      }

      // Validate each question
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
        // Update existing quiz
        const { error: updateError } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quiz.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
      } else {
        // Create new quiz
        const { data: newQuizData, error: insertError } = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single()

        if (insertError) {
          console.error('Create error:', insertError)
          throw insertError
        }
        
        // Update the quiz state with the new ID
        if (newQuizData) {
          setQuiz(prev => ({ ...prev, id: newQuizData.id }))
        }
      }

      alert('Quiz saved successfully!')
      // Stay on the page after saving
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      alert(`Failed to save quiz: ${error.message || 'Unknown error'}`)
      setError(error.message || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        onClick={() => router.push('/instructor')}
        variant="outline"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-bold mb-2">
        {quiz.id ? 'Edit Quiz' : 'Create Quiz'} for {lessonTitle}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={quiz.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pass_percentage">
                <Percent className="w-4 h-4 inline mr-1" />
                Pass Percentage
              </Label>
              <Input
                id="pass_percentage"
                type="number"
                min="0"
                max="100"
                value={quiz.pass_percentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuiz(prev => ({ 
                  ...prev, 
                  pass_percentage: parseInt(e.target.value) || 70 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="time_limit">
                <Clock className="w-4 h-4 inline mr-1" />
                Time Limit (minutes)
              </Label>
              <Input
                id="time_limit"
                type="number"
                min="0"
                value={quiz.time_limit_minutes || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuiz(prev => ({ 
                  ...prev, 
                  time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                }))}
                placeholder="No limit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions ({quiz.questions.length})</h2>
          <Button onClick={addQuestion} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {quiz.questions.map((question, qIndex) => (
          <Card key={question.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Answer Options</Label>
                <RadioGroup
                  value={question.correct_answer.toString()}
                  onValueChange={(value: string) => updateQuestion(qIndex, 'correct_answer', parseInt(value))}
                >
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Explanation (Optional)</Label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain why this answer is correct"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {quiz.questions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Question" to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <Button 
          onClick={saveQuiz}
          disabled={saving || quiz.questions.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : (quiz.id ? 'Update Quiz' : 'Save Quiz')}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/instructor')}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}