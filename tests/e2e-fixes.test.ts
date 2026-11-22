import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildLessonSequence, computeLockMap } from '@/lib/lesson-gating'
import { LESSON_BODY_FIELDS, LESSON_OUTLINE_COLUMNS, stripLessonBody } from '@/lib/access/lesson-payload'
import { rememberReturnPath, safeReturnPath, takeReturnPath } from '@/lib/post-auth-redirect'
import { memberKey, programProgress } from '@/lib/cohorts/program-progress'
import { orderAfterAll } from '@/lib/lessons/module-quiz'

const lesson = (id: string, moduleId: string, order: number, type = 'youtube') => ({
  id,
  module_id: moduleId,
  lesson_order: order,
  content_type: type,
})

const modules = [
  { id: 'm1', order_index: 1 },
  { id: 'm2', order_index: 2 },
]

describe('moving through a course that has a module quiz', () => {
  // What "Add quiz" produces: the quiz gets the highest lesson_order in the
  // whole course, so sorted by lesson_order alone it sits after module 2.
  const lessons = [
    lesson('a', 'm1', 10),
    lesson('b', 'm1', 20),
    lesson('c', 'm2', 30),
    lesson('d', 'm2', 40),
    lesson('q', 'm1', 50, 'quiz'),
  ]

  it('puts the quiz straight after its module, so Next from the last lesson reaches it', () => {
    const sequence = buildLessonSequence(lessons, modules)
    expect(sequence.map((l) => l.id)).toEqual(['a', 'b', 'q', 'c', 'd'])

    const afterB = sequence[sequence.findIndex((l) => l.id === 'b') + 1]
    expect(afterB.id).toBe('q')
  })

  it('never points Next at a locked lesson once the current one is complete', () => {
    const sequence = buildLessonSequence(lessons, modules)
    const completed = new Set(['a', 'b'])
    const locks = computeLockMap(sequence, completed, new Set<string>(), new Set<string>())
    const next = sequence[sequence.findIndex((l) => l.id === 'b') + 1]
    expect(locks.get(next.id)?.locked).toBeFalsy()
  })
})

describe('lessons that share an order value', () => {
  it('breaks the tie by id, the way the database does', () => {
    const tied = [lesson('bbb', 'm1', 40), lesson('aaa', 'm1', 40), lesson('ccc', 'm1', 10)]
    expect(buildLessonSequence(tied, modules).map((l) => l.id)).toEqual(['ccc', 'aaa', 'bbb'])
    // The same answer whatever order the rows arrive in.
    expect(buildLessonSequence([...tied].reverse(), modules).map((l) => l.id)).toEqual(['ccc', 'aaa', 'bbb'])
  })

  it('gives a new lesson an order no other lesson has, even after a deletion', () => {
    // Four lessons, the one at 20 deleted: counting lessons would give 40 again.
    const afterDelete = [lesson('a', 'm1', 10), lesson('c', 'm1', 30), lesson('d', 'm1', 40)]
    const next = orderAfterAll(afterDelete)
    expect(afterDelete.map((l) => l.lesson_order)).not.toContain(next)
    expect(next).toBeGreaterThan(40)
  })
})

describe('what a lesson row carries for someone who is not enrolled', () => {
  it('the outline columns contain none of the teaching material', () => {
    const columns = LESSON_OUTLINE_COLUMNS.split(',').map((c) => c.trim())
    for (const field of LESSON_BODY_FIELDS) expect(columns).not.toContain(field)
    expect(columns).toEqual(expect.arrayContaining(['id', 'title', 'slug', 'lesson_order', 'content_type', 'module_id']))
  })

  it('strips the body and keeps the outline', () => {
    const full = {
      id: 'a',
      title: 'Intro',
      slug: 'intro',
      content: '<p>paid text</p>',
      youtube_url: 'https://youtu.be/x',
      video_url: 'https://cdn/x.mp4',
      pdf_url: 'https://cdn/x.pdf',
      powerpoint_url: 'https://cdn/x.pptx',
      content_type: 'youtube',
    }
    const stripped = stripLessonBody(full)
    expect(stripped).toMatchObject({ id: 'a', title: 'Intro', slug: 'intro', content_type: 'youtube' })
    expect(stripped.content).toBe('')
    expect(stripped.youtube_url).toBeNull()
    expect(stripped.video_url).toBeNull()
    expect(stripped.pdf_url).toBeNull()
    expect(stripped.powerpoint_url).toBeNull()
    // The original row is untouched.
    expect(full.content).toBe('<p>paid text</p>')
  })
})

describe('returning to the page that asked for sign-in', () => {
  it('accepts paths on this site only', () => {
    expect(safeReturnPath('/join/abc123')).toBe('/join/abc123')
    expect(safeReturnPath('/c/my-cohort?x=1')).toBe('/c/my-cohort?x=1')
    expect(safeReturnPath('https://evil.example/join')).toBeNull()
    expect(safeReturnPath('//evil.example')).toBeNull()
    expect(safeReturnPath('/\\evil.example')).toBeNull()
    expect(safeReturnPath('join/abc')).toBeNull()
    expect(safeReturnPath('/auth/login')).toBeNull()
    expect(safeReturnPath('')).toBeNull()
    expect(safeReturnPath(null)).toBeNull()
  })

  describe('with browser storage', () => {
    const store = new Map<string, string>()
    beforeEach(() => {
      store.clear()
      vi.stubGlobal('window', {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => void store.set(k, v),
          removeItem: (k: string) => void store.delete(k),
        },
      })
    })
    afterEach(() => vi.unstubAllGlobals())

    it('is used once', () => {
      rememberReturnPath('/join/abc123')
      expect(takeReturnPath()).toBe('/join/abc123')
      expect(takeReturnPath()).toBeNull()
    })

    it('ignores an unsafe value and an old one', () => {
      rememberReturnPath('https://evil.example')
      expect(takeReturnPath()).toBeNull()

      rememberReturnPath('/join/abc123')
      const twoDaysLater = Date.now() + 2 * 24 * 60 * 60 * 1000
      expect(takeReturnPath(twoDaysLater)).toBeNull()
    })
  })
})

describe('cohort progress', () => {
  it('averages across the program, counting an unstarted course as 0', () => {
    const progress = new Map([
      ['c1', 100],
      ['c2', 50],
    ])
    expect(programProgress(['c1', 'c2'], progress)).toBe(75)
    expect(programProgress(['c1', 'c2', 'c3'], progress)).toBe(50)
    expect(programProgress([], progress)).toBe(0)
  })

  it('keeps one person in two cohorts apart', () => {
    expect(memberKey('cohort-a', 'user-1')).not.toBe(memberKey('cohort-b', 'user-1'))
  })
})
