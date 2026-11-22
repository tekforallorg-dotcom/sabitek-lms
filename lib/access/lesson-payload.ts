/**
 * What a lesson row may carry, depending on who is asking.
 *
 * The course page and the lesson page are loaded by service-role routes, so
 * row level security does not protect what they return. A lesson's body (its
 * text, video link and files) is what a learner enrols or pays for; the
 * outline (title, order, type, length) is what everyone may see.
 */

/** Columns for a curriculum outline. Contains nothing a learner must enrol to see. */
export const LESSON_OUTLINE_COLUMNS =
  'id, course_id, module_id, title, slug, lesson_order, duration_minutes, content_type'

/** The fields that hold a lesson's actual teaching material. */
export const LESSON_BODY_FIELDS = [
  'content',
  'youtube_url',
  'video_url',
  'pdf_url',
  'powerpoint_url',
] as const

/** A copy of the lesson with its teaching material removed. */
export function stripLessonBody<T extends Record<string, unknown>>(lesson: T): T {
  const copy: Record<string, unknown> = { ...lesson }
  for (const field of LESSON_BODY_FIELDS) {
    if (field in copy) copy[field] = field === 'content' ? '' : null
  }
  return copy as T
}
