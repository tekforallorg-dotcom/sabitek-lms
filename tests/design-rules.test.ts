import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Keeps the interface to the rules in docs/design-rules.md. Each test scans
 * every component and page for one kind of class the rules do not allow, and
 * names the file and line if it finds one.
 */

const ROOT = join(__dirname, '..')
const posix = (p: string) => p.split(sep).join('/')

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else if (/\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

const FILES = [...sourceFiles(join(ROOT, 'app')), ...sourceFiles(join(ROOT, 'components'))]
  .map((full) => ({ path: posix(relative(ROOT, full)), lines: readFileSync(full, 'utf8').split('\n') }))
  // Social preview images and the emails sent by server routes are documents,
  // not interface.
  .filter((file) => !file.path.endsWith('opengraph-image.tsx') && !file.path.startsWith('app/api/'))

const isSabiQuiz = (path: string) => path.includes('/sabiquiz/')

function offenders(
  pattern: RegExp,
  options: { skipFile?: (path: string) => boolean; skipLine?: (line: string) => boolean } = {}
): string[] {
  const found: string[] = []
  for (const file of FILES) {
    if (options.skipFile?.(file.path)) continue
    file.lines.forEach((line, index) => {
      if (options.skipLine?.(line)) return
      const match = line.match(pattern)
      if (match) found.push(`${file.path}:${index + 1}  ${match[0]}`)
    })
  }
  return found
}

const PROPS =
  '(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|from|via|to|shadow|fill|stroke|divide|outline|decoration|placeholder|caret|accent)'
const OFF_PALETTE =
  '(?:rose|pink|fuchsia|purple|violet|indigo|sky|cyan|teal|emerald|lime|yellow|orange|slate|zinc|neutral|stone)'

describe('design rules', () => {
  it('has files to check', () => {
    expect(FILES.length).toBeGreaterThan(100)
  })

  it('1. uses no gradients (a black fade over a photo is the one exception)', () => {
    expect(
      offenders(/\bbg-gradient-to-[a-z]+/, { skipLine: (line) => /\bfrom-black\b/.test(line) })
    ).toEqual([])
    expect(
      offenders(/(?:linear|radial|conic)-gradient\(/, {
        // The quiz race track is a two-colour progress bar, not decoration.
        skipFile: isSabiQuiz,
      })
    ).toEqual([])
  })

  it('2. uses no blur and no shadow larger than shadow-sm', () => {
    expect(offenders(/\bbackdrop-(?:blur|saturate)\b/)).toEqual([])
    expect(offenders(/(?<![\w-])blur-(?:xl|2xl|3xl|\[)/)).toEqual([])
    expect(offenders(/(?<![\w-])(?:drop-)?shadow-(?:md|lg|xl|2xl|\[)/)).toEqual([])
  })

  it('3. stays inside the five-colour palette', () => {
    expect(offenders(new RegExp(`\\b${PROPS}-${OFF_PALETTE}-\\d{2,3}\\b`))).toEqual([])
  })

  it('4. uses only the 400 and 500 font weights', () => {
    expect(offenders(/\bfont-(?:thin|extralight|light|semibold|bold|extrabold|black)\b/)).toEqual([])
  })

  it('5. keeps padding, margin and gap on the 4px grid', () => {
    expect(
      offenders(
        /(?<!\w)(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y)-(?:0\.5|1\.5|2\.5|3\.5)(?![\w.])/
      )
    ).toEqual([])
  })

  it('6. rounds corners by at most 12px', () => {
    expect(offenders(/\brounded(?:-[trblse]{1,2})?-(?:2xl|3xl)\b/)).toEqual([])
  })

  it('7. does not bounce, ping or zoom on hover', () => {
    expect(offenders(/\banimate-(?:bounce|ping)\b/)).toEqual([])
    expect(offenders(/\bhover:-?scale-\d/)).toEqual([])
  })

  it('8. uses icons, not emojis', () => {
    expect(offenders(/[\u{1F300}-\u{1FAFF}]|[✅❌✨⭐]/u, { skipFile: isSabiQuiz })).toEqual([])
  })
})
