import { supabase } from '@/lib/supabase'

export interface QuizAttempt {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  score_percentage: number
  passed: boolean
  time_taken_seconds: number
  attempt_number: number
  created_at: string
  student_name: string
  student_email: string
  course_title: string
  lesson_title: string
}

export interface QuizStats {
  totalAttempts: number
  averageScore: number
  passRate: number
  averageTime: number
  uniqueStudents: number
}

/**
 * Get all quiz attempts for courses taught by instructor
 */
export async function getInstructorQuizAttempts(
  instructorId: string,
  filters?: {
    courseId?: string
    lessonId?: string
    startDate?: string
    endDate?: string
  }
): Promise<QuizAttempt[]> {
  let query = supabase
    .from('quiz_attempts')
    .select(`
      id,
      user_id,
      lesson_id,
      course_id,
      score_percentage,
      passed,
      time_taken_seconds,
      attempt_number,
      created_at,
      users!user_id(full_name, email),
      courses!course_id(title),
      lessons!lesson_id(title)
    `)
    .eq('courses.instructor_id', instructorId)
    .order('created_at', { ascending: false })

  if (filters?.courseId) {
    query = query.eq('course_id', filters.courseId)
  }

  if (filters?.lessonId) {
    query = query.eq('lesson_id', filters.lessonId)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching quiz attempts:', error)
    throw error
  }

  return data.map((attempt: any) => ({
    id: attempt.id,
    user_id: attempt.user_id,
    lesson_id: attempt.lesson_id,
    course_id: attempt.course_id,
    score_percentage: attempt.score_percentage,
    passed: attempt.passed,
    time_taken_seconds: attempt.time_taken_seconds,
    attempt_number: attempt.attempt_number,
    created_at: attempt.created_at,
    student_name: attempt.users?.full_name || 'Unknown',
    student_email: attempt.users?.email || '',
    course_title: attempt.courses?.title || 'Unknown Course',
    lesson_title: attempt.lessons?.title || 'Unknown Lesson',
  }))
}

/**
 * Calculate quiz statistics
 */
export function calculateQuizStats(attempts: QuizAttempt[]): QuizStats {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      averageTime: 0,
      uniqueStudents: 0,
    }
  }

  const totalAttempts = attempts.length
  const averageScore = Math.round(
    attempts.reduce((sum, a) => sum + a.score_percentage, 0) / totalAttempts
  )
  const passedCount = attempts.filter(a => a.passed).length
  const passRate = Math.round((passedCount / totalAttempts) * 100)
  const averageTime = Math.round(
    attempts.reduce((sum, a) => sum + a.time_taken_seconds, 0) / totalAttempts
  )
  const uniqueStudents = new Set(attempts.map(a => a.user_id)).size

  return {
    totalAttempts,
    averageScore,
    passRate,
    averageTime,
    uniqueStudents,
  }
}

/**
 * Get instructor's courses for filtering
 */
export async function getInstructorCourses(instructorId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title')
    .eq('instructor_id', instructorId)
    .eq('status', 'published')
    .order('title')

  if (error) {
    console.error('Error fetching courses:', error)
    throw error
  }

  return data
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Export quiz attempts to CSV
 */
export function exportToCSV(attempts: QuizAttempt[]): void {
  if (attempts.length === 0) {
    alert('No data to export')
    return
  }

  // CSV headers
  const headers = [
    'Student Name',
    'Student Email',
    'Course',
    'Lesson',
    'Score (%)',
    'Status',
    'Time (seconds)',
    'Time (formatted)',
    'Attempt Number',
    'Date',
    'Time'
  ]

  // Convert attempts to CSV rows with null-safe handling
  const rows = attempts.map(attempt => [
    attempt.student_name || 'Unknown',
    attempt.student_email || 'N/A',
    attempt.course_title || 'Unknown Course',
    attempt.lesson_title || 'Unknown Lesson',
    attempt.score_percentage?.toString() || '0',
    attempt.passed ? 'Passed' : 'Failed',
    attempt.time_taken_seconds?.toString() || '0',
    attempt.time_taken_seconds ? formatTime(attempt.time_taken_seconds) : '0:00',
    attempt.attempt_number?.toString() || '1',
    attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : 'N/A',
    attempt.created_at ? new Date(attempt.created_at).toLocaleTimeString() : 'N/A',
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `quiz-results-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Get all quiz attempts for a specific student
 */
export async function getStudentQuizAttempts(
  studentId: string,
  instructorId: string
): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      id,
      user_id,
      lesson_id,
      course_id,
      score_percentage,
      passed,
      time_taken_seconds,
      attempt_number,
      created_at,
      users!user_id(full_name, email),
      courses!course_id(title, instructor_id),
      lessons!lesson_id(title)
    `)
    .eq('user_id', studentId)
    .eq('courses.instructor_id', instructorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching student attempts:', error)
    throw error
  }

  return data.map((attempt: any) => ({
    id: attempt.id,
    user_id: attempt.user_id,
    lesson_id: attempt.lesson_id,
    course_id: attempt.course_id,
    score_percentage: attempt.score_percentage,
    passed: attempt.passed,
    time_taken_seconds: attempt.time_taken_seconds,
    attempt_number: attempt.attempt_number,
    created_at: attempt.created_at,
    student_name: attempt.users?.full_name || 'Unknown',
    student_email: attempt.users?.email || '',
    course_title: attempt.courses?.title || 'Unknown Course',
    lesson_title: attempt.lessons?.title || 'Unknown Lesson',
  }))
}

/**
 * Calculate student progress (improvement over time)
 */
export function calculateStudentProgress(attempts: QuizAttempt[]): {
  firstAttemptAvg: number
  latestAttemptAvg: number
  improvement: number
} {
  if (attempts.length === 0) {
    return { firstAttemptAvg: 0, latestAttemptAvg: 0, improvement: 0 }
  }

  // Group by lesson
  const lessonAttempts = new Map<string, QuizAttempt[]>()
  attempts.forEach(attempt => {
    const key = attempt.lesson_id
    if (!lessonAttempts.has(key)) {
      lessonAttempts.set(key, [])
    }
    lessonAttempts.get(key)!.push(attempt)
  })

  let firstAttemptScores: number[] = []
  let latestAttemptScores: number[] = []

  lessonAttempts.forEach(lessonAtts => {
    // Sort by created_at
    const sorted = lessonAtts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    if (sorted.length > 0) {
      firstAttemptScores.push(sorted[0].score_percentage)
      latestAttemptScores.push(sorted[sorted.length - 1].score_percentage)
    }
  })

  const firstAttemptAvg = firstAttemptScores.length > 0
    ? Math.round(firstAttemptScores.reduce((a, b) => a + b, 0) / firstAttemptScores.length)
    : 0

  const latestAttemptAvg = latestAttemptScores.length > 0
    ? Math.round(latestAttemptScores.reduce((a, b) => a + b, 0) / latestAttemptScores.length)
    : 0

  const improvement = latestAttemptAvg - firstAttemptAvg

  return { firstAttemptAvg, latestAttemptAvg, improvement }
}

export interface QuestionAnalytics {
  questionText: string
  questionIndex: number
  totalAttempts: number
  correctCount: number
  incorrectCount: number
  correctRate: number
  lessonTitle: string
  courseTitle: string
}

/**
 * Analyze question performance across all attempts
 */
export async function getQuestionAnalytics(
  instructorId: string,
  filters?: {
    courseId?: string
    lessonId?: string
  }
): Promise<QuestionAnalytics[]> {
  try {
    // Step 1: Get all quiz attempts
    let attemptsQuery = supabase
      .from('quiz_attempts')
      .select(`
        id,
        lesson_id,
        answers,
        courses!course_id(title, instructor_id),
        lessons!lesson_id(title, id)
      `)
      .eq('courses.instructor_id', instructorId)
      .not('answers', 'is', null)

    if (filters?.courseId) {
      attemptsQuery = attemptsQuery.eq('course_id', filters.courseId)
    }

    if (filters?.lessonId) {
      attemptsQuery = attemptsQuery.eq('lesson_id', filters.lessonId)
    }

    const { data: attempts, error: attemptsError } = await attemptsQuery

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError)
      throw attemptsError
    }

    if (!attempts || attempts.length === 0) {
      return []
    }

    // Step 2: Get unique lesson IDs
    const lessonIds = [...new Set(attempts.map((a: any) => a.lesson_id))]

    // Step 3: Fetch quizzes for these lessons
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('lesson_id, questions')
      .in('lesson_id', lessonIds)

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      throw quizzesError
    }

    // Step 4: Create a map of lesson_id to quiz
    const quizMap = new Map()
    quizzes?.forEach((quiz: any) => {
      quizMap.set(quiz.lesson_id, quiz.questions)
    })

    // Step 5: Aggregate question statistics
    const questionStats = new Map<string, {
      questionText: string
      questionIndex: number
      totalAttempts: number
      correctCount: number
      lessonTitle: string
      courseTitle: string
    }>()

    attempts.forEach((attempt: any) => {
      const answers = attempt.answers as any[]
      const quizQuestions = quizMap.get(attempt.lesson_id)
      const lessonTitle = attempt.lessons?.title || 'Unknown Lesson'
      const courseTitle = attempt.courses?.title || 'Unknown Course'

      if (!Array.isArray(answers) || !Array.isArray(quizQuestions)) return

      answers.forEach((answer, index) => {
        const question = quizQuestions[index]
        if (!question) return

        // Use lesson_id + question index as unique key
        const key = `${attempt.lesson_id}-${index}`
        
        if (!questionStats.has(key)) {
          questionStats.set(key, {
            questionText: question.question || question.text || 'Unknown Question',
            questionIndex: index + 1,
            totalAttempts: 0,
            correctCount: 0,
            lessonTitle,
            courseTitle,
          })
        }

        const stats = questionStats.get(key)!
        stats.totalAttempts++
        
        // Check if answer is correct
        if (answer.correct === true || answer.isCorrect === true) {
          stats.correctCount++
        }
      })
    })

    // Step 6: Convert to array and calculate rates
    return Array.from(questionStats.values())
      .map(stats => ({
        ...stats,
        incorrectCount: stats.totalAttempts - stats.correctCount,
        correctRate: Math.round((stats.correctCount / stats.totalAttempts) * 100),
      }))
      .sort((a, b) => a.correctRate - b.correctRate)

  } catch (error) {
    console.error('Error in getQuestionAnalytics:', error)
    throw error
  }
}