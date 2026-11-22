import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

const PUBLIC_PAGES = [
  'app/page.tsx',
  'app/(public)/about/page.tsx',
  'app/(public)/schools-and-tutors/page.tsx',
  'app/(public)/request-access/page.tsx',
  'app/(public)/become-a-provider/page.tsx',
  'components/layout/header.tsx',
  'components/layout/footer.tsx',
]

/**
 * Sign-up is by invite. A visitor without an invite cannot create an account,
 * so nothing on a public page may promise that they can.
 */
describe('public pages match how access really works', () => {
  it('the header offers the application form, not a sign-up page that turns visitors away', () => {
    const header = read('components/layout/header.tsx')
    expect(header).toContain('href="/request-access"')
    expect(header).not.toContain('href="/auth/register"')
  })

  it('no public page uses a vague or misleading call to action', () => {
    for (const path of PUBLIC_PAGES) {
      const source = read(path)
      expect(source, path).not.toMatch(/Get Started/)
      expect(source, path).not.toMatch(/Sign Up/)
    }
  })

  it('the landing page does not describe an open sign-up', () => {
    expect(read('app/page.tsx')).not.toMatch(/Sign up as an instructor/)
  })

  it('the plans page, which sells something that cannot be bought, is redirected', () => {
    expect(read('next.config.ts')).toMatch(/source: '\/pricing', destination: '\/schools-and-tutors'/)
  })
})

describe('public pages are readable before any script runs', () => {
  it('Reveal renders visible first and has a single implementation', () => {
    const reveal = read('components/marketing/primitives.tsx')
    // The first render (what the server sends) must not be the hidden state.
    expect(reveal).toMatch(/useState<'shown' \| 'waiting' \| 'revealed'>\('shown'\)/)
    expect(read('app/page.tsx')).not.toMatch(/function Reveal\(/)
  })
})
