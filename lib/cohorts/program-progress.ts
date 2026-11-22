/** Pure helpers for cohort progress. No database access, so they can be unit-tested. */

/** Average progress across a program's courses, 0 to 100. A course not started counts as 0. */
export function programProgress(courseIds: string[], progressByCourse: Map<string, number>): number {
  if (courseIds.length === 0) return 0
  const total = courseIds.reduce((sum, id) => {
    const value = Number(progressByCourse.get(id) ?? 0)
    return sum + Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
  }, 0)
  return Math.round(total / courseIds.length)
}

export function memberKey(cohortId: string, userId: string | null): string {
  return `${cohortId}:${userId ?? ''}`
}
