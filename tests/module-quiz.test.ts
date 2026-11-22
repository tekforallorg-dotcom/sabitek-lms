import { describe, expect, it } from 'vitest'
import {
  MODULE_QUIZ_TYPE,
  findModuleQuiz,
  isModuleQuiz,
  moduleQuizTitle,
  orderAfterAll,
  quizOrderAfterNewLesson,
  uniqueSlug,
} from '@/lib/lessons/module-quiz'
import { buildLessonSequence, computeLockMap } from '@/lib/lesson-gating'

const lesson = (id: string, moduleId: string, order: number, type = 'youtube') => ({
  id,
  module_id: moduleId,
  lesson_order: order,
  content_type: type,
})

describe('module quiz helpers', () => {
  it('recognises a quiz-only lesson and nothing else', () => {
    expect(isModuleQuiz({ content_type: MODULE_QUIZ_TYPE })).toBe(true)
    for (const type of ['text', 'youtube', 'video', 'pdf', 'powerpoint', null, undefined]) {
      expect(isModuleQuiz({ content_type: type })).toBe(false)
    }
    expect(isModuleQuiz(null)).toBe(false)
  })

  it('finds the quiz of one module without picking up another module', () => {
    const lessons = [lesson('a', 'm1', 10), lesson('q1', 'm1', 20, 'quiz'), lesson('q2', 'm2', 30, 'quiz')]
    expect(findModuleQuiz(lessons, 'm1')?.id).toBe('q1')
    expect(findModuleQuiz(lessons, 'm2')?.id).toBe('q2')
    expect(findModuleQuiz(lessons, 'm3')).toBeUndefined()
  })

  it('names the quiz after its module', () => {
    expect(moduleQuizTitle('Introduction to AI')).toBe('Introduction to AI: quiz')
    expect(moduleQuizTitle('  ')).toBe('Module quiz')
  })

  it('places a new item after every lesson in the course', () => {
    expect(orderAfterAll([])).toBe(10)
    expect(orderAfterAll([lesson('a', 'm1', 10), lesson('b', 'm2', 70)])).toBe(80)
  })

  it('moves the quiz behind a lesson added to its module later', () => {
    const lessons = [lesson('a', 'm1', 10), lesson('q1', 'm1', 20, 'quiz'), lesson('b', 'm2', 30)]
    // A fourth lesson gets order 40 in the builder and lands in module 1.
    expect(quizOrderAfterNewLesson(lessons, 'm1', 40)).toEqual({ id: 'q1', lesson_order: 50 })
    // A module with no quiz, and a lesson with no module, need nothing.
    expect(quizOrderAfterNewLesson(lessons, 'm2', 40)).toBeNull()
    expect(quizOrderAfterNewLesson(lessons, null, 40)).toBeNull()
    // A quiz already behind the new lesson stays where it is.
    expect(quizOrderAfterNewLesson([lesson('q1', 'm1', 90, 'quiz')], 'm1', 40)).toBeNull()
  })

  it('keeps slugs unique within a course', () => {
    expect(uniqueSlug('module-1-quiz', [])).toBe('module-1-quiz')
    expect(uniqueSlug('module-1-quiz', ['module-1-quiz'])).toBe('module-1-quiz-2')
    expect(uniqueSlug('module-1-quiz', ['module-1-quiz', 'module-1-quiz-2'])).toBe('module-1-quiz-3')
  })
})

describe('a module quiz in the lesson sequence', () => {
  // The same rules the learner page uses to lock and unlock lessons.
  const modules = [
    { id: 'm1', order_index: 0 },
    { id: 'm2', order_index: 1 },
  ]
  const lessons = [
    lesson('m1-a', 'm1', 10),
    lesson('m1-b', 'm1', 20),
    lesson('m2-a', 'm2', 30),
    lesson('m1-quiz', 'm1', 40, 'quiz'),
  ]
  const sequence = buildLessonSequence(lessons, modules)
  const order = sequence.map((item) => item.id)

  it('comes last in its module and before the next module', () => {
    expect(order).toEqual(['m1-a', 'm1-b', 'm1-quiz', 'm2-a'])
  })

  it('keeps the next module locked until the quiz is passed', () => {
    const completed = new Set(['m1-a', 'm1-b'])
    const quizLessons = new Set(['m1-quiz'])

    const before = computeLockMap(sequence, completed, quizLessons, new Set())
    expect(before.get('m1-quiz')?.locked).toBeFalsy()
    expect(before.get('m2-a')?.locked).toBe(true)

    const after = computeLockMap(
      sequence,
      new Set([...completed, 'm1-quiz']),
      quizLessons,
      new Set(['m1-quiz']),
    )
    expect(after.get('m2-a')?.locked).toBeFalsy()
  })

  it('does not change a lesson that carries its own quiz', () => {
    // An old-style quiz attached to a video lesson still gates the next lesson.
    const old = buildLessonSequence([lesson('a', 'm1', 10), lesson('b', 'm1', 20)], modules)
    const locks = computeLockMap(old, new Set(['a']), new Set(['a']), new Set())
    expect(locks.get('b')?.locked).toBe(true)
    const passed = computeLockMap(old, new Set(['a']), new Set(['a']), new Set(['a']))
    expect(passed.get('b')?.locked).toBeFalsy()
  })
})
