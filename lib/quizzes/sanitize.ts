import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Parse a quiz's `questions` column, which may be stored as JSON or a
 * JSON string. Always returns an array.
 */
export function parseQuizQuestions(raw: unknown): any[] {
  let qs = raw
  if (typeof qs === 'string') {
    try {
      qs = JSON.parse(qs)
    } catch {
      qs = []
    }
  }
  return Array.isArray(qs) ? qs : []
}

export interface SanitizedQuiz {
  id: string
  lesson_id: string
  title: string
  description: string | null
  pass_percentage: number
  time_limit: number | null
  questions: Array<{ id: string; question: string; options: string[] }>
}

/**
 * Sanitized quiz delivery for a lesson.
 *
 * Learners get questions WITHOUT correct answers or explanations (those
 * come back from /api/quizzes/grade after submission). Also returns which
 * lessons in the course carry a real quiz, for sequential gating - so the
 * client never needs to read the quizzes table directly.
 *
 * This is the single source of truth for answer-stripping: both
 * /api/quizzes/for-lesson and the consolidated lesson-data loader call it,
 * so correct_answer / explanation can never leak into a client payload.
 */
export async function getSanitizedLessonQuiz(
  courseId: string,
  lessonId: string
): Promise<{ quiz: SanitizedQuiz | null; quizLessonIds: string[] }> {
  const { data: lessonRows } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
  const lessonIds = (lessonRows || []).map((l) => l.id)

  // Select only columns that exist on `quizzes`. An earlier version asked for
  // `description` and `time_limit`, which the table does not have; the query
  // failed, its error was ignored, and no learner was ever shown a quiz.
  const { data: quizRows, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('id, lesson_id, title, pass_percentage, time_limit_minutes, questions')
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000'])

  if (quizError) {
    // Log loudly: without its quiz a gated lesson cannot be completed. The
    // lesson itself still loads, so a database hiccup does not blank the page.
    console.error('Failed to load lesson quizzes:', quizError.message)
  }

  const quizLessonIds = (quizRows || [])
    .filter((q) => parseQuizQuestions(q.questions).length > 0)
    .map((q) => q.lesson_id)

  const current = (quizRows || []).find((q) => q.lesson_id === lessonId) || null
  let quiz: SanitizedQuiz | null = null
  if (current) {
    const questions = parseQuizQuestions(current.questions)
    if (questions.length > 0) {
      quiz = {
        id: current.id,
        lesson_id: current.lesson_id,
        title: current.title,
        description: null, // the quizzes table has no description column
        pass_percentage: current.pass_percentage,
        time_limit: current.time_limit_minutes,
        questions: questions.map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          question: q.question,
          options: q.options,
          // correct_answer and explanation deliberately withheld
        })),
      }
    }
  }

  return { quiz, quizLessonIds }
}
