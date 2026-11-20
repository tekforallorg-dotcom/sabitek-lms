import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import colors from 'tailwindcss/colors'
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

const load = (dirs: string[]) =>
  dirs
    .flatMap((dir) => sourceFiles(join(ROOT, dir)))
    .map((full) => ({ path: posix(relative(ROOT, full)), lines: readFileSync(full, 'utf8').split('\n') }))

const FILES = load(['app', 'components'])
  // Social preview images and the emails sent by server routes are documents,
  // not interface.
  .filter((file) => !file.path.endsWith('opengraph-image.tsx') && !file.path.startsWith('app/api/'))

// Class names also live in shared constants (status colours and the like).
// The theme produces no CSS for a colour or weight outside it, so those are
// checked too.
const SHARED = load(['types', 'hooks'])

const isSabiQuiz = (path: string) => path.includes('/sabiquiz/')

function offenders(
  pattern: RegExp,
  options: {
    skipFile?: (path: string) => boolean
    skipLine?: (line: string) => boolean
    files?: typeof FILES
  } = {}
): string[] {
  const found: string[] = []
  for (const file of options.files ?? FILES) {
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
const OFF_PALETTE_HUES = [
  'rose',
  'pink',
  'fuchsia',
  'purple',
  'violet',
  'indigo',
  'sky',
  'cyan',
  'teal',
  'emerald',
  'lime',
  'yellow',
  'orange',
  'slate',
  'zinc',
  'neutral',
  'stone',
] as const
const OFF_PALETTE = `(?:${OFF_PALETTE_HUES.join('|')})`

// The same hues written as hex codes, as charts and inline SVG do.
const OFF_PALETTE_HEX = new Set(
  OFF_PALETTE_HUES.flatMap((hue) => Object.values(colors[hue] as Record<string, string>)).map((hex) =>
    hex.toLowerCase()
  )
)

describe('design rules', () => {
  it('has files to check', () => {
    expect(FILES.length).toBeGreaterThan(100)
    expect(SHARED.length).toBeGreaterThan(0)
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
    expect(offenders(/<(?:linear|radial)Gradient\b/)).toEqual([])
  })

  it('2. uses no blur and no shadow larger than shadow-sm', () => {
    expect(offenders(/\bbackdrop-(?:blur|saturate)\b/)).toEqual([])
    expect(offenders(/(?<![\w-])blur-(?:sm|md|lg|xl|2xl|3xl|\[)/)).toEqual([])
    expect(offenders(/(?<![\w-])(?:drop-)?shadow-(?:md|lg|xl|2xl|\[)/)).toEqual([])
    // A bare `shadow` is one step larger than `shadow-sm`.
    expect(
      offenders(/(?<=[\s"'`:])shadow(?=[\s"'`])/, { skipLine: (line) => /[sS]hadow\s*[:=]/.test(line) })
    ).toEqual([])
  })

  it('3. stays inside the five-colour palette', () => {
    const offPaletteClass = new RegExp(`\\b${PROPS}-${OFF_PALETTE}-\\d{2,3}\\b`)
    expect(offenders(offPaletteClass)).toEqual([])
    expect(offenders(offPaletteClass, { files: SHARED })).toEqual([])

    const offPaletteHex: string[] = []
    for (const file of FILES) {
      file.lines.forEach((line, index) => {
        for (const match of line.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
          if (OFF_PALETTE_HEX.has(match[0].toLowerCase())) {
            offPaletteHex.push(`${file.path}:${index + 1}  ${match[0]}`)
          }
        }
      })
    }
    expect(offPaletteHex).toEqual([])
  })

  it('4. uses only the 400 and 500 font weights', () => {
    const heavyOrLight = /\bfont-(?:thin|extralight|light|semibold|bold|extrabold|black)\b/
    expect(offenders(heavyOrLight)).toEqual([])
    expect(offenders(heavyOrLight, { files: SHARED })).toEqual([])
  })

  it('5. keeps padding, margin and gap on the 4px grid', () => {
    expect(
      offenders(
        /(?<!\w)(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y)-(?:0\.5|1\.5|2\.5|3\.5)(?![\w.])/
      )
    ).toEqual([])
  })

  it('6. rounds corners by at most 12px', () => {
    expect(offenders(/\brounded(?:-[trblse]{1,2})?-(?:2xl|3xl|\[)/)).toEqual([])
  })

  it('7. does not bounce, ping, float or zoom on hover', () => {
    // Only animations that tell the user something are allowed: loading, an
    // error shake, and content arriving or leaving.
    expect(
      offenders(/\banimate-(?!(?:spin|pulse|in|out|none|shake|fade\w*|slide\w*)(?![\w-]))[a-z][\w-]*/)
    ).toEqual([])
    expect(offenders(/\bhover:-?scale-\d/)).toEqual([])
  })

  it('8. uses icons, not emojis', () => {
    expect(offenders(/[\u{1F300}-\u{1FAFF}]|[✅❌✨⭐]/u, { skipFile: isSabiQuiz })).toEqual([])
  })
})
