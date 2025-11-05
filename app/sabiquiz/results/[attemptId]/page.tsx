'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, BookOpen, TrendingUp, AlertCircle, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Question } from '@/lib/sabiquiz/types'

interface QuizAttempt {
  id: string
  material_id: string
  title: string
  score: number
  correct_answers: number
  total_questions: number
  time_taken_seconds: number
}

interface QuizResponse {
  id: string
  question_id: string
  selected_answer: number
  correct: boolean
  time_seconds: number
}

interface QuestionWithResponse extends Question {
  response: QuizResponse
}

interface TopicPerformance {
  topic: string
  correct: number
  total: number
  percentage: number
}

interface DifficultyPerformance {
  difficulty: string
  correct: number
  total: number
  percentage: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [questions, setQuestions] = useState<QuestionWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([])
  const [difficultyPerformance, setDifficultyPerformance] = useState<DifficultyPerformance[]>([])

  useEffect(() => {
    fetchResults()
  }, [attemptId])

  async function fetchResults() {
    try {
      setLoading(true)

      const { data: attemptData, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      setAttempt(attemptData)

      const { data: responses, error: responsesError } = await supabase
        .from('sabiquiz_responses')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: true })

      if (responsesError) throw responsesError

      const questionIds = responses.map(r => r.question_id)
      const { data: questionsData, error: questionsError } = await supabase
        .from('sabiquiz_questions')
        .select('*')
        .in('id', questionIds)

      if (questionsError) throw questionsError

      const questionsWithResponses = questionsData.map(q => ({
        ...q,
        response: responses.find(r => r.question_id === q.id)!
      }))

      setQuestions(questionsWithResponses)
      calculatePerformance(questionsWithResponses)

    } catch (err: any) {
      console.error('Error fetching results:', err)
      setError('Failed to load quiz results')
    } finally {
      setLoading(false)
    }
  }

  function calculatePerformance(questions: QuestionWithResponse[]) {
    const topicMap = new Map<string, { correct: number; total: number }>()
    const difficultyMap = new Map<string, { correct: number; total: number }>()

    questions.forEach(q => {
      const topic = q.topic || 'General'
      const difficulty = q.difficulty || 'medium'
      const isCorrect = q.response.correct

      if (!topicMap.has(topic)) {
        topicMap.set(topic, { correct: 0, total: 0 })
      }
      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, { correct: 0, total: 0 })
      }

      const topicStats = topicMap.get(topic)!
      const diffStats = difficultyMap.get(difficulty)!

      topicStats.total++
      diffStats.total++

      if (isCorrect) {
        topicStats.correct++
        diffStats.correct++
      }
    })

    const topicPerf = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    })).sort((a, b) => a.percentage - b.percentage)

    const diffPerf = Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
      difficulty,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }))

    setTopicPerformance(topicPerf)
    setDifficultyPerformance(diffPerf)
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getScoreMessage(score: number) {
    if (score >= 90) return 'Outstanding! 🎉'
    if (score >= 80) return 'Great job! 👏'
    if (score >= 70) return 'Good work! 👍'
    if (score >= 60) return 'Not bad! 💪'
    return 'Keep practicing! 📚'
  }

  function getRecommendations(score: number, topicPerf: TopicPerformance[], diffPerf: DifficultyPerformance[]) {
    const recommendations: string[] = []

    if (score < 60) {
      recommendations.push('Focus on reviewing the material thoroughly before retaking the quiz.')
    }

    const weakTopics = topicPerf.filter(t => t.percentage < 60)
    if (weakTopics.length > 0) {
      recommendations.push(`Study these topics: ${weakTopics.map(t => t.topic).join(', ')}`)
    }

    const hardQuestions = diffPerf.find(d => d.difficulty === 'hard')
    if (hardQuestions && hardQuestions.percentage < 50) {
      recommendations.push('Practice more hard-level questions to improve mastery.')
    }

    if (score >= 80) {
      recommendations.push('Excellent work! Try harder difficulty levels to challenge yourself.')
    }

    if (recommendations.length === 0) {
      recommendations.push('Review the explanations and try the quiz again to reinforce your learning.')
    }

    return recommendations
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">{error || 'Quiz results not found'}</p>
          </CardContent>
        </Card>
        <Button onClick={() => router.push('/sabiquiz/materials')} className="mt-4">
          Back to Materials
        </Button>
      </div>
    )
  }

  const score = attempt.score || 0
  const correctAnswers = attempt.correct_answers || 0
  const totalQuestions = attempt.total_questions || questions.length
  const recommendations = getRecommendations(score, topicPerformance, difficultyPerformance)

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/sabiquiz/materials')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Materials
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h1>
        <p className="text-sm text-gray-600">{attempt.title}</p>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-red-50 to-white border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-500" />
              <div>
                <h2 className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</h2>
                <p className="text-sm text-gray-600">{getScoreMessage(score)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Correct</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600">Incorrect</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {topicPerformance.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance by Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicPerformance.map((topic) => (
              <div key={topic.topic} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-gray-600">
                    {topic.correct}/{topic.total} ({topic.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      topic.percentage >= 80 ? 'bg-green-500' :
                      topic.percentage >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {difficultyPerformance.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Performance by Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {difficultyPerformance.map((diff) => (
                <div key={diff.difficulty} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1 capitalize">{diff.difficulty}</p>
                  <p className="text-xl font-bold">{diff.percentage}%</p>
                  <p className="text-xs text-gray-500">{diff.correct}/{diff.total}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => router.push(`/sabiquiz/quiz/start/${attempt.material_id}`)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Quiz
        </Button>
        <Button
          onClick={() => router.push('/sabiquiz/materials')}
          variant="outline"
          className="flex-1"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Browse Materials
        </Button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4">Review Answers</h3>

      <div className="space-y-4">
        {questions.map((q, index) => {
          const isCorrect = q.response.correct
          const selectedAnswer = q.response.selected_answer
          const correctAnswer = q.correct_answer

          return (
            <Card key={q.id} className={isCorrect ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium flex-1">
                    <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                    {q.question}
                  </CardTitle>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {q.options.map((option, optIndex) => {
                    const isSelected = selectedAnswer === optIndex
                    const isCorrectOption = correctAnswer === optIndex
                    
                    let bgColor = 'bg-gray-50'
                    let borderColor = 'border-gray-200'
                    let textColor = 'text-gray-700'
                    
                    if (isCorrectOption) {
                      bgColor = 'bg-green-50'
                      borderColor = 'border-green-300'
                      textColor = 'text-green-800'
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-red-50'
                      borderColor = 'border-red-300'
                      textColor = 'text-red-800'
                    }

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${textColor}`}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>
                          {isCorrectOption && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {q.rationale && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Explanation:</p>
                    <p className="text-sm text-blue-800">{q.rationale}</p>
                  </div>
                )}

                {q.topic && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Topic: {q.topic}</span>
                    {q.difficulty && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{q.difficulty}</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}