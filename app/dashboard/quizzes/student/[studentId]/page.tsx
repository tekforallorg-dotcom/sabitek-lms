'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  Target,
  Loader2
} from 'lucide-react'
import {
  getStudentQuizAttempts,
  calculateStudentProgress,
  formatTime,
  type QuizAttempt,
} from '@/lib/dashboard/quiz-analytics'

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string

  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [studentName, setStudentName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  async function fetchStudentData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const attemptsData = await getStudentQuizAttempts(studentId, user.id)
      setAttempts(attemptsData)
      
      if (attemptsData.length > 0) {
        setStudentName(attemptsData[0].student_name)
      }

    } catch (err: any) {
      console.error('Error fetching student data:', err)
      setError(err.message || 'Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = calculateStudentProgress(attempts)
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length)
    : 0
  const passRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
    : 0
  const avgTime = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / attempts.length)
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/quizzes')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Quiz Results
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{studentName}</h1>
        <p className="text-gray-600">
          {attempts.length > 0 ? attempts[0].student_email : ''}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">{attempts.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{avgScore}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-2xl font-bold">{formatTime(avgTime)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">First Attempt Average</p>
              <p className="text-3xl font-bold">{progress.firstAttemptAvg}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Latest Attempt Average</p>
              <p className="text-3xl font-bold">{progress.latestAttemptAvg}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Improvement</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${
                  progress.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {progress.improvement > 0 ? '+' : ''}{progress.improvement}%
                </p>
                {progress.improvement >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quiz attempts yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Lesson</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Time</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Attempt</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{attempt.course_title}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{attempt.lesson_title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${
                          attempt.score_percentage >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score_percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attempt.passed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Passed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {formatTime(attempt.time_taken_seconds || 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        #{attempt.attempt_number}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}