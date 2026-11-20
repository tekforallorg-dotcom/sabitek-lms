import { describe, expect, it } from 'vitest'
import {
  allowWhenFactsUnavailable,
  decideAreaAccess,
  getProtectedArea,
  type AreaFacts,
} from '@/lib/route-access'

const learner: AreaFacts = { isSuperAdmin: false, role: 'learner', membershipRoles: [] }
const instructor: AreaFacts = { isSuperAdmin: false, role: 'instructor', membershipRoles: [] }
const superAdmin: AreaFacts = { isSuperAdmin: true, role: 'learner', membershipRoles: [] }
const member = (...roles: string[]): AreaFacts => ({
  isSuperAdmin: false,
  role: 'learner',
  membershipRoles: roles,
})

describe('getProtectedArea', () => {
  it('maps restricted paths to their area', () => {
    expect(getProtectedArea('/admin')).toBe('admin')
    expect(getProtectedArea('/admin/users')).toBe('admin')
    expect(getProtectedArea('/instructor/courses/new')).toBe('instructor')
    expect(getProtectedArea('/institution/cohorts/123')).toBe('institution')
  })

  it('ignores everything else', () => {
    expect(getProtectedArea('/dashboard')).toBeNull()
    expect(getProtectedArea('/courses/intro')).toBeNull()
    expect(getProtectedArea('/')).toBeNull()
  })

  it('does not match a path that merely starts with the same letters', () => {
    expect(getProtectedArea('/administrator')).toBeNull()
    expect(getProtectedArea('/instructors')).toBeNull()
    expect(getProtectedArea('/institutions')).toBeNull()
  })
})

describe('decideAreaAccess: /admin', () => {
  it('lets a super admin in', () => {
    expect(decideAreaAccess('admin', '/admin', superAdmin)).toBe(true)
  })

  it('keeps everyone else out', () => {
    expect(decideAreaAccess('admin', '/admin', learner)).toBe(false)
    expect(decideAreaAccess('admin', '/admin/billing', instructor)).toBe(false)
    expect(decideAreaAccess('admin', '/admin', member('institution_admin'))).toBe(false)
  })

  it('does not treat the legacy users.role = admin as a super admin', () => {
    const legacyAdmin: AreaFacts = { isSuperAdmin: false, role: 'admin', membershipRoles: [] }
    expect(decideAreaAccess('admin', '/admin', legacyAdmin)).toBe(false)
  })
})

describe('decideAreaAccess: /instructor', () => {
  it('lets instructors in, by profile role or by institution membership', () => {
    expect(decideAreaAccess('instructor', '/instructor', instructor)).toBe(true)
    expect(decideAreaAccess('instructor', '/instructor', member('instructor'))).toBe(true)
  })

  it('lets a super admin in', () => {
    expect(decideAreaAccess('instructor', '/instructor/courses', superAdmin)).toBe(true)
  })

  it('keeps learners and non-teaching institution staff out', () => {
    expect(decideAreaAccess('instructor', '/instructor', learner)).toBe(false)
    expect(decideAreaAccess('instructor', '/instructor', member('viewer'))).toBe(false)
    expect(decideAreaAccess('instructor', '/instructor', member('institution_admin'))).toBe(false)
  })
})

describe('decideAreaAccess: /institution', () => {
  it('lets any active member in, whatever their role', () => {
    for (const role of ['institution_admin', 'program_manager', 'facilitator', 'instructor', 'viewer']) {
      expect(decideAreaAccess('institution', '/institution/dashboard', member(role))).toBe(true)
    }
  })

  it('keeps people with no membership out', () => {
    expect(decideAreaAccess('institution', '/institution/dashboard', learner)).toBe(false)
    expect(decideAreaAccess('institution', '/institution/cohorts', instructor)).toBe(false)
  })

  it('leaves the application page open to every signed-in user', () => {
    expect(decideAreaAccess('institution', '/institution/apply', learner)).toBe(true)
  })

  it('does not extend that exception to sub-paths', () => {
    expect(decideAreaAccess('institution', '/institution/apply/anything', learner)).toBe(false)
  })

  it('lets a super admin in', () => {
    expect(decideAreaAccess('institution', '/institution/settings', superAdmin)).toBe(true)
  })
})

describe('allowWhenFactsUnavailable', () => {
  it('fails closed for admin and open for the other areas', () => {
    expect(allowWhenFactsUnavailable('admin')).toBe(false)
    expect(allowWhenFactsUnavailable('instructor')).toBe(true)
    expect(allowWhenFactsUnavailable('institution')).toBe(true)
  })
})
