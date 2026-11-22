/**
 * A module quiz is a lesson of its own that holds only a quiz: no video, text
 * or file. It sits at the end of its module, so everything a lesson quiz
 * already does applies to it unchanged: grading, attempts, progress, and the
 * rule that the next lesson stays locked until the quiz is passed.
 *
 * Lessons, quizzes and attempts created before this existed are not touched:
 * a quiz attached to an ordinary lesson keeps working exactly as it did.
 */

export const MODULE_QUIZ_TYPE = 'quiz'

type LessonLike = {
  id: string
  module_id?: string | null
  content_type?: string | null
  lesson_order: number
}

export function isModuleQuiz(lesson: { content_type?: string | null } | null | undefined): boolean {
  return lesson?.content_type === MODULE_QUIZ_TYPE
}

/** The quiz that closes a module, if it has one. */
export function findModuleQuiz<T extends LessonLike>(lessons: T[], moduleId: string): T | undefined {
  return lessons.find((lesson) => lesson.module_id === moduleId && isModuleQuiz(lesson))
}

export function moduleQuizTitle(moduleTitle: string): string {
  const title = moduleTitle.trim()
  return title ? `${title}: quiz` : 'Module quiz'
}

/** An order value that places a lesson after every other lesson in the course. */
export function orderAfterAll(lessons: Pick<LessonLike, 'lesson_order'>[], atLeast = 0): number {
  const highest = lessons.reduce((max, lesson) => Math.max(max, lesson.lesson_order), atLeast)
  return highest + 10
}

/**
 * When a lesson is added to a module that already ends in a quiz, the quiz has
 * to move behind it, or learners would meet the quiz before the new lesson.
 * Returns the quiz and its new order, or null when nothing needs to move.
 */
export function quizOrderAfterNewLesson<T extends LessonLike>(
  lessons: T[],
  moduleId: string | null | undefined,
  newLessonOrder: number,
): { id: string; lesson_order: number } | null {
  if (!moduleId) return null
  const quiz = findModuleQuiz(lessons, moduleId)
  if (!quiz || quiz.lesson_order > newLessonOrder) return null
  return { id: quiz.id, lesson_order: orderAfterAll(lessons, newLessonOrder) }
}

/** A slug for the quiz that does not collide with another lesson in the course. */
export function uniqueSlug(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
