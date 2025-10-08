'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/providers/auth-provider'

interface QuizTakerProps {
  lessonId: string
  onComplete?: () => void
}

interface Quiz {
  id: string
  title: string
  description?: string
  pass_percentage: number
  time_limit_minutes?: number
  questions: Question[]
}

interface Question {
  id: string
  question_text: string
  question_order: number
  points: number
  explanation?: string
  options: Option[]
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  option_order: number
}

interface UserAnswer {
  questionId: string
  selectedOptionId: string
}

export default function QuizTaker({ lessonId, onComplete }: QuizTakerProps) {
  const { user } = useAuthContext()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([])

  useEffect(() => {
    if (user && lessonId) {
      fetchQuizData()
    }
  }, [user, lessonId])

  useEffect(() => {
    if (started && timeLeft && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      if (timeLeft === 1) {
        submitQuiz()
      }

      return () => clearTimeout(timer)
    }
  }, [started, timeLeft])

  const fetchQuizData = async () => {
    try {
      // Fetch quiz with questions and options
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions:quiz_questions(
            *,
            options:quiz_options(*)
          )
        `)
        .eq('lesson_id', lessonId)
        .single()

      if (quizError || !quizData) {
        console.log('No quiz found for this lesson')
        setLoading(false)
        return
      }

      // Format the quiz data
      const formattedQuiz: Quiz = {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        pass_percentage: quizData.pass_percentage,
        time_limit_minutes: quizData.time_limit_minutes,
        questions: quizData.questions
          ?.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            question_order: q.question_order,
            points: q.points,
            explanation: q.explanation,
            options: q.options?.sort((a: any, b: any) => a.option_order - b.option_order) || []
          }))
          .sort((a: any, b: any) => a.question_order - b.question_order) || []
      }

      setQuiz(formattedQuiz)

      // Fetch previous attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizData.id)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })

      setPreviousAttempts(attempts || [])
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = () => {
    setStarted(true)
    if (quiz?.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60)
    }
  }

  const selectAnswer = (questionId: string, optionId: string) => {
    const newAnswers = userAnswers.filter(a => a.questionId !== questionId)
    newAnswers.push({ questionId, selectedOptionId: optionId })
    setUserAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const submitQuiz = async () => {
    if (!quiz || !user) return

    const startTime = Date.now() - ((quiz.time_limit_minutes || 0) * 60 - (timeLeft || 0)) * 1000

    try {
      // Calculate score
      let totalScore = 0
      let totalPoints = 0
      const answerResults = []

      for (const question of quiz.questions) {
        totalPoints += question.points
        const userAnswer = userAnswers.find(a => a.questionId === question.id)
        
        if (userAnswer) {
          const selectedOption = question.options.find(o => o.id === userAnswer.selectedOptionId)
          const isCorrect = selectedOption?.is_correct || false
          
          if (isCorrect) {
            totalScore += question.points
          }
          
          answerResults.push({
            questionId: question.id,
            selectedOptionId: userAnswer.selectedOptionId,
            isCorrect,
            pointsEarned: isCorrect ? question.points : 0
          })
        }
      }

      const percentage = (totalScore / totalPoints) * 100
      const passed = percentage >= quiz.pass_percentage

      // Create attempt record
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          user_id: user.id,
          score: totalScore,
          total_points: totalPoints,
          percentage: percentage,
          passed: passed,
          completed_at: new Date().toISOString(),
          time_spent_seconds: Math.floor((Date.now() - startTime) / 1000)
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      // Save answers
      const answersToInsert = answerResults.map(result => ({
        attempt_id: attempt.id,
        question_id: result.questionId,
        selected_option_id: result.selectedOptionId,
        is_correct: result.isCorrect,
        points_earned: result.pointsEarned
      }))

      await supabase
        .from('quiz_answers')
        .insert(answersToInsert)

      setResults({
        score: totalScore,
        totalPoints,
        percentage,
        passed,
        answers: answerResults
      })
      
      setSubmitted(true)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Failed to submit quiz')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-600">
          No quiz available for this lesson yet.
        </CardContent>
      </Card>
    )
  }

  if (submitted && results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>{quiz.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className={`text-4xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
              {results.percentage.toFixed(1)}%
            </div>
            <p className="text-lg mt-2">
              {results.score} / {results.totalPoints} points
            </p>
            <p className={`text-lg mt-2 font-medium ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
              {results.passed ? '✓ Passed' : '✗ Failed'}
            </p>
            {!results.passed && (
              <p className="text-sm text-gray-600 mt-2">
                Required: {quiz.pass_percentage}% to pass
              </p>
            )}
          </div>

          {/* Show correct answers and explanations */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Answers:</h3>
            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers.find(a => a.questionId === question.id)
              const selectedOption = question.options.find(o => o.id === userAnswer?.selectedOptionId)
              const correctOption = question.options.find(o => o.is_correct)
              const isCorrect = selectedOption?.is_correct

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <p className="font-medium mb-2">
                    {index + 1}. {question.question_text}
                  </p>
                  <div className="ml-4 space-y-1">
                    <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      Your answer: {selectedOption?.option_text || 'Not answered'}
                      {isCorrect ? ' ✓' : ' ✗'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600">
                        Correct answer: {correctOption?.option_text}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        Explanation: {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• {quiz.questions.length} questions</p>
            <p>• Pass mark: {quiz.pass_percentage}%</p>
            {quiz.time_limit_minutes && (
              <p>• Time limit: {quiz.time_limit_minutes} minutes</p>
            )}
            {previousAttempts.length > 0 && (
              <p>• Previous attempts: {previousAttempts.length}</p>
            )}
          </div>

          {previousAttempts.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Last Attempt:</p>
              <p className="text-sm text-gray-600">
                Score: {previousAttempts[0].percentage.toFixed(1)}% 
                {previousAttempts[0].passed ? ' (Passed)' : ' (Failed)'}
              </p>
            </div>
          )}

          <Button
            onClick={startQuiz}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const currentAnswer = userAnswers.find(a => a.questionId === currentQuestion.id)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </CardTitle>
          {timeLeft !== null && (
            <div className={`text-lg font-medium ${timeLeft < 60 ? 'text-red-600' : ''}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-medium mb-4">{currentQuestion.question_text}</p>
          <div className="space-y-2">
            {currentQuestion.options.map(option => (
              <label
                key={option.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentAnswer?.selectedOptionId === option.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={currentAnswer?.selectedOptionId === option.id}
                  onChange={() => selectAnswer(currentQuestion.id, option.id)}
                  className="mr-3 text-red-500"
                />
                <span>{option.option_text}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="border-gray-300"
          >
            Previous
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={submitQuiz}
              disabled={userAnswers.length !== quiz.questions.length}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Next
            </Button>
          )}
        </div>

        {/* Question progress indicator */}
        <div className="flex gap-1 justify-center pt-4">
          {quiz.questions.map((_, index) => {
            const isAnswered = userAnswers.some(a => a.questionId === quiz.questions[index].id)
            return (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 text-xs font-medium rounded ${
                  index === currentQuestionIndex
                    ? 'bg-red-500 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}