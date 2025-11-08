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
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Download,
  Loader2
} from 'lucide-react'
import {
  getInstructorQuizAttempts,
  getInstructorCourses,
  calculateQuizStats,
  formatTime,
  exportToCSV, // ✅ ADD THIS
  type QuizAttempt,
} from '@/lib/dashboard/quiz-analytics'



export default function InstructorQuizzesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
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

      // Fetch quiz attempts
      const filters = selectedCourse !== 'all' ? { courseId: selectedCourse } : undefined
      const attemptsData = await getInstructorQuizAttempts(user.id, filters)
      setAttempts(attemptsData)

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load quiz data')
    } finally {
      setLoading(false)
    }
  }

  const stats = calculateQuizStats(attempts)

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
        <p className="text-gray-600">Monitor student quiz performance across your courses</p>
      </div>



<div className="flex justify-end mb-4">
  <Button
    onClick={() => router.push('/dashboard/quizzes/questions')}
    variant="outline"
  >
    View Question Analytics
  </Button>
</div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              </div>
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Students</p>
                <p className="text-2xl font-bold">{stats.uniqueStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.passRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-2xl font-bold">{formatTime(stats.averageTime)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
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
          <div className="flex gap-4 items-center">
            <div className="flex-1">
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
            
            <Button 
  variant="outline" 
  size="sm" 
  className="mt-7"
  onClick={() => exportToCSV(attempts)}
  disabled={attempts.length === 0}
>
  <Download className="w-4 h-4 mr-2" />
  Export CSV
</Button>

          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
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
                      <td className="px-4 py-3">
  <button
    onClick={() => router.push(`/dashboard/quizzes/student/${attempt.user_id}`)}
    className="text-left hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
  >
    <p className="font-medium text-gray-900 hover:text-red-600">{attempt.student_name}</p>
    <p className="text-sm text-gray-500">{attempt.student_email}</p>
  </button>
</td>
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
                        {formatTime(attempt.time_taken_seconds)}
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