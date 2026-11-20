import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_ITEMS,
  HOME_ROUTE,
  allNavHrefs,
  commandsFor,
  isActive,
  navFor,
  resolvePersona,
  shellModeFor,
  type Persona,
} from '@/lib/navigation'

const APP = join(__dirname, '..', 'app')

/** Every URL the app serves a page at, read from the app directory. */
function pageRoutes(dir: string = APP, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) pageRoutes(full, out)
    else if (name === 'page.tsx') {
      const segments = relative(APP, dir)
        .split(sep)
        // Route groups such as (tools) are not part of the URL.
        .filter((segment) => segment && !/^\(.*\)$/.test(segment))
      out.push('/' + segments.join('/'))
    }
  }
  return out
}

const PERSONAS: Persona[] = ['learner', 'instructor', 'institution', 'viewer', 'admin']

describe('navigation map', () => {
  it('only links to pages that exist', () => {
    const routes = new Set(pageRoutes())
    expect(routes.size).toBeGreaterThan(50)
    expect(allNavHrefs().filter((href) => !routes.has(href))).toEqual([])
  })

  it('gives every persona a home that is first in its menu', () => {
    for (const persona of PERSONAS) {
      expect(navFor(persona)[0].items[0].href).toBe(HOME_ROUTE[persona])
    }
  })

  it('never lists the same destination twice for one persona', () => {
    for (const persona of PERSONAS) {
      const hrefs = commandsFor(persona).map((command) => command.href)
      expect(hrefs.filter((href, index) => hrefs.indexOf(href) !== index)).toEqual([])
    }
  })

  it('keeps the deliberately hidden pages out of every menu', () => {
    const hrefs = allNavHrefs()
    for (const hidden of ['/account/wallet', '/account/billing', '/instructor/billing']) {
      expect(hrefs).not.toContain(hidden)
    }
    expect(ACCOUNT_ITEMS.map((item) => item.href)).toEqual(['/profile', '/support'])
  })
})

describe('who can open what', () => {
  const hrefsFor = (persona: Persona) => commandsFor(persona).map((command) => command.href)
  const under = (prefix: string) => (href: string) => href === prefix || href.startsWith(`${prefix}/`)

  it('never sends an account into an area the server would turn it away from', () => {
    // lib/route-access.ts: /instructor needs the instructor role, /institution
    // needs a membership, /admin needs a super admin.
    expect(hrefsFor('learner').filter((h) => ['/instructor', '/institution', '/admin'].some((p) => under(p)(h)))).toEqual([])
    expect(hrefsFor('instructor').filter((h) => ['/institution', '/admin'].some((p) => under(p)(h)))).toEqual([])
    expect(hrefsFor('institution').filter((h) => ['/instructor', '/admin'].some((p) => under(p)(h)))).toEqual([])
    expect(hrefsFor('viewer').filter((h) => ['/instructor', '/admin'].some((p) => under(p)(h)))).toEqual([])
  })

  it('never offers /dashboard to an account whose home is elsewhere', () => {
    // The learner guard sends those accounts straight back to their own home.
    for (const persona of PERSONAS.filter((p) => p !== 'learner')) {
      expect(hrefsFor(persona).filter(under('/dashboard'))).toEqual([])
    }
  })

  it('shows a reports-only member the reports page and nothing else of the institution', () => {
    expect(hrefsFor('viewer').filter(under('/institution'))).toEqual(['/institution/reports'])
  })
})

describe('resolvePersona', () => {
  it('trusts the server-resolved home over the role column', () => {
    expect(resolvePersona({ role: 'learner', homeRoute: '/institution/dashboard' })).toBe('institution')
    expect(resolvePersona({ role: 'instructor', homeRoute: '/institution/dashboard' })).toBe('institution')
    expect(resolvePersona({ role: 'learner', homeRoute: '/institution/reports' })).toBe('viewer')
    expect(resolvePersona({ role: 'learner', homeRoute: '/admin' })).toBe('admin')
    expect(resolvePersona({ role: 'learner', homeRoute: '/dashboard', isSuperAdmin: true })).toBe('admin')
  })

  it('falls back to the role', () => {
    expect(resolvePersona({ role: 'instructor', homeRoute: '/instructor' })).toBe('instructor')
    expect(resolvePersona({ role: 'learner', homeRoute: '/dashboard' })).toBe('learner')
    expect(resolvePersona({})).toBe('learner')
  })
})

describe('isActive', () => {
  it('matches a section and the pages under it, but not a lookalike', () => {
    const courses = { href: '/courses' }
    expect(isActive(courses, '/courses')).toBe(true)
    expect(isActive(courses, '/courses/python-101')).toBe(true)
    expect(isActive(courses, '/courses-archive')).toBe(false)
    expect(isActive(courses, null)).toBe(false)
  })

  it('matches a home page exactly', () => {
    const home = { href: '/instructor', exact: true }
    expect(isActive(home, '/instructor')).toBe(true)
    expect(isActive(home, '/instructor/questions')).toBe(false)
  })
})

describe('shellModeFor', () => {
  it('gives signed-in areas the app shell', () => {
    for (const path of ['/dashboard', '/courses', '/courses/python-101', '/instructor/questions', '/profile']) {
      expect(shellModeFor(path)).toBe('app')
    }
  })

  it('leaves a lesson and a quiz in progress alone', () => {
    expect(shellModeFor('/courses/python-101/lessons/intro')).toBe('focus')
    expect(shellModeFor('/sabiquiz/quiz/abc')).toBe('focus')
    expect(shellModeFor('/sabiquiz/quiz/start/abc')).toBe('focus')
  })

  it('leaves the document builders alone, which have their own sidebar', () => {
    for (const path of ['/sabiadvisor/cv', '/sabiadvisor/cover-letter', '/sabiadvisor/profile']) {
      expect(shellModeFor(path)).toBe('focus')
    }
    expect(shellModeFor('/sabiadvisor')).toBe('app-if-signed-in')
  })

  it('waits for sign-in state where visitors get a public page', () => {
    for (const path of ['/sabiquiz', '/sabiadvisor/survey', '/sabibot/chat', '/community/inbox']) {
      expect(shellModeFor(path)).toBe('app-if-signed-in')
    }
  })

  it('keeps the public site frame everywhere else', () => {
    for (const path of ['/', '/about', '/pricing', '/verify/SBT-1', '/join/token', '/coursesx', null]) {
      expect(shellModeFor(path)).toBe('site')
    }
  })
})
