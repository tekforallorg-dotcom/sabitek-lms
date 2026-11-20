/**
 * Server-side access rules for the role-restricted page areas.
 *
 * Middleware calls this before a page under /admin, /instructor or
 * /institution is served, so someone without the role is redirected by the
 * server instead of being sent the page and bounced by a client component.
 * The client guards (components/admin/AdminGuard, components/auth/RouteGuard)
 * stay in place for in-app navigation; the rules here mirror theirs.
 *
 * `decideAreaAccess` is a pure function so the rules can be unit tested.
 */

export type ProtectedArea = 'admin' | 'instructor' | 'institution'

/** What we need to know about a user to decide. */
export interface AreaFacts {
  isSuperAdmin: boolean
  /** users.role: 'learner' | 'instructor' | 'admin' */
  role: string | null
  /** Roles of the user's ACTIVE institution memberships. */
  membershipRoles: string[]
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/')
}

/** Which restricted area a path belongs to, if any. */
export function getProtectedArea(pathname: string): ProtectedArea | null {
  if (isUnder(pathname, '/admin')) return 'admin'
  if (isUnder(pathname, '/instructor')) return 'instructor'
  if (isUnder(pathname, '/institution')) return 'institution'
  return null
}

/**
 * May a signed-in user with these facts open this path?
 *
 * - admin:       platform super admins only.
 * - instructor:  users whose role is instructor, anyone holding an active
 *                institution membership as an instructor, and super admins.
 * - institution: anyone with an active institution membership (any role), and
 *                super admins. /institution/apply is open to every signed-in
 *                user, because it is how you become an institution.
 */
export function decideAreaAccess(area: ProtectedArea, pathname: string, facts: AreaFacts): boolean {
  if (facts.isSuperAdmin) return true

  switch (area) {
    case 'admin':
      return false
    case 'instructor':
      return facts.role === 'instructor' || facts.membershipRoles.includes('instructor')
    case 'institution':
      if (pathname === '/institution/apply') return true
      return facts.membershipRoles.length > 0
  }
}

/** Where to send someone who may not open the area. */
export const AREA_DENIED_REDIRECT = '/dashboard'

/**
 * If the facts could not be loaded (database hiccup), should the request be
 * let through? Admin fails closed. The other two fail open to the page, where
 * the client guard and the API routes' own checks still apply, so a transient
 * error does not lock instructors and institutions out of their workspace.
 */
export function allowWhenFactsUnavailable(area: ProtectedArea): boolean {
  return area !== 'admin'
}
