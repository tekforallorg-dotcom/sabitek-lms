/**
 * Sequential lesson gating.
 *
 * A lesson is unlocked when every lesson BEFORE it in the course sequence
 * is completed AND, where a preceding lesson has an instructor quiz, that
 * quiz has been passed. Completed lessons are always unlocked (review).
 * Instructors bypass gating entirely (callers decide that).
 *
 * The sequence respects the module hierarchy (modules by order_index,
 * lessons by lesson_order within each module, then unassigned lessons by
 * lesson_order). Legacy flat courses (no modules) fall back to plain
 * lesson_order, so old content keeps working unchanged.
 */

export interface GatingLesson {
  id: string
  lesson_order: number
  module_id?: string | null
}

export interface GatingModule {
  id: string
  order_index: number
}

export type LockReason = 'prev_incomplete' | 'quiz_required'

export interface LockInfo {
  locked: boolean
  reason?: LockReason
  /** The lesson that must be finished first (for messaging). */
  blockingLessonId?: string
}

/** Canonical course sequence: module order, then lesson order; unassigned last. */
export function buildLessonSequence<T extends GatingLesson>(
  lessons: T[],
  modules: GatingModule[]
): T[] {
  if (!modules || modules.length === 0) {
    return [...lessons].sort((a, b) => a.lesson_order - b.lesson_order)
  }

  const byModule = new Map<string, T[]>()
  const unassigned: T[] = []
  for (const l of lessons) {
    if (l.module_id) {
      const arr = byModule.get(l.module_id) || []
      arr.push(l)
      byModule.set(l.module_id, arr)
    } else {
      unassigned.push(l)
    }
  }

  const sequence: T[] = []
  const orderedModules = [...modules].sort((a, b) => a.order_index - b.order_index)
  for (const m of orderedModules) {
    const arr = (byModule.get(m.id) || []).sort((a, b) => a.lesson_order - b.lesson_order)
    sequence.push(...arr)
    byModule.delete(m.id)
  }
  // Lessons pointing at modules we don't know about, then unassigned.
  for (const arr of byModule.values()) {
    sequence.push(...arr.sort((a, b) => a.lesson_order - b.lesson_order))
  }
  sequence.push(...unassigned.sort((a, b) => a.lesson_order - b.lesson_order))
  return sequence
}

/**
 * Compute lock state for every lesson.
 *
 * @param sequence        ordered lessons from buildLessonSequence
 * @param completedIds    lesson ids the learner has completed
 * @param quizLessonIds   lesson ids that HAVE an instructor quiz
 * @param passedQuizIds   lesson ids whose quiz the learner has PASSED
 */
export function computeLockMap(
  sequence: GatingLesson[],
  completedIds: Set<string>,
  quizLessonIds: Set<string>,
  passedQuizIds: Set<string>
): Map<string, LockInfo> {
  const map = new Map<string, LockInfo>()
  // Tracks the first unmet requirement while walking the sequence.
  let blocking: { id: string; reason: LockReason } | null = null

  for (const lesson of sequence) {
    if (completedIds.has(lesson.id)) {
      // Already completed: always open for review.
      map.set(lesson.id, { locked: false })
    } else if (blocking) {
      map.set(lesson.id, {
        locked: true,
        reason: blocking.reason,
        blockingLessonId: blocking.id,
      })
      continue // everything after stays locked on the same blocker
    } else {
      map.set(lesson.id, { locked: false })
    }

    // Does THIS lesson now block the ones after it?
    if (!blocking) {
      if (!completedIds.has(lesson.id)) {
        blocking = { id: lesson.id, reason: 'prev_incomplete' }
      } else if (quizLessonIds.has(lesson.id) && !passedQuizIds.has(lesson.id)) {
        blocking = { id: lesson.id, reason: 'quiz_required' }
      }
    }
  }

  return map
}
