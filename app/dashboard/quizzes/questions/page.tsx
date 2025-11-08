'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Loader2
} from 'lucide-react'
import {
  getQuestionAnalytics,
  getInstructorCourses,
  type QuestionAnalytics,
} from '@/lib/dashboard/quiz-analytics'

export default function QuestionAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<QuestionAnalytics[]>([])
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedCourse])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch courses
      const coursesData = await getInstructorCourses(user.id)
      setCourses(coursesData)

      // Fetch question analytics
      const filters = selectedCourse !== 'all' ? { courseId: selectedCourse } : undefined
      const analyticsData = await getQuestionAnalytics(user.id, filters)
      setAnalytics(analyticsData)

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load question analytics')
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

  // Calculate summary stats
  const difficultQuestions = analytics.filter(q => q.correctRate < 50)
  const easyQuestions = analytics.filter(q => q.correctRate >= 80)
  const avgCorrectRate = analytics.length > 0
    ? Math.round(analytics.reduce((sum, q) => sum + q.correctRate, 0) / analytics.length)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Analytics</h1>
        <p className="text-gray-600">Identify difficult questions and improve your quizzes</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{analytics.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Difficult Questions</p>
                <p className="text-2xl font-bold text-red-600">{difficultQuestions.length}</p>
                <p className="text-xs text-gray-500 mt-1">{'<50% correct rate'}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Correct Rate</p>
                <p className="text-2xl font-bold text-green-600">{avgCorrectRate}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex-1 max-w-md">
            <label className="text-sm font-medium mb-2 block">Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Question Performance (Sorted by Difficulty)</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No question data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Question</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Lesson</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Attempts</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Correct</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Incorrect</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Correct Rate</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.map((question, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-mono text-xs mt-0.5">Q{question.questionIndex}</span>
                          <span className="line-clamp-2">{question.questionText}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{question.courseTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{question.lessonTitle}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{question.totalAttempts}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{question.correctCount}</td>
                      <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{question.incorrectCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${
                          question.correctRate >= 80 ? 'text-green-600' :
                          question.correctRate >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {question.correctRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {question.correctRate < 50 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Hard
                          </span>
                        ) : question.correctRate < 80 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Medium
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Easy
                          </span>
                        )}
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