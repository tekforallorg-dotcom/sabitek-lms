'use client'
import { useEffect, useRef, useState } from 'react'
import { List, X, Clock } from 'lucide-react'
import '@/styles/lesson-content.css'

interface TocItem {
  id: string
  text: string
  level: number
}

/**
 * Magazine-style reader for text lessons.
 *
 * Wraps lesson HTML (Tiptap output) with:
 *  - editorial typography via the shared lesson-content stylesheet
 *  - reading-time estimate
 *  - a scroll progress bar
 *  - an "On this page" TOC auto-built from headings (floating rail on
 *    desktop, collapsible pill on mobile)
 *  - figure/caption upgrading (img title -> figcaption) + tap-to-lightbox
 */
export default function LessonReader({ content }: { content: string }) {
  const articleRef = useRef<HTMLDivElement>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [tocOpen, setTocOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [readingMinutes, setReadingMinutes] = useState(1)

  // Post-process the rendered HTML: heading ids for the TOC, figure
  // wrapping for captions, lightbox handlers, reading time.
  useEffect(() => {
    const root = articleRef.current
    if (!root) return

    // Reading time (~200 wpm)
    const words = (root.textContent || '').trim().split(/\s+/).filter(Boolean).length
    setReadingMinutes(Math.max(1, Math.round(words / 200)))

    // Headings -> TOC
    const headings = Array.from(root.querySelectorAll('h1, h2, h3'))
    const items: TocItem[] = headings.map((h, i) => {
      const text = h.textContent?.trim() || `Section ${i + 1}`
      const id = `section-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`
      h.id = id
      return { id, text, level: Number(h.tagName[1]) }
    })
    setToc(items)

    // Wrap captioned images (title attr) in real figures
    root.querySelectorAll('img[title]').forEach((el) => {
      const img = el as HTMLImageElement
      if (img.closest('figure')) return
      const caption = img.getAttribute('title')
      if (!caption) return
      const figure = document.createElement('figure')
      // carry the alignment class up to the figure
      Array.from(img.classList)
        .filter((c) => c.startsWith('img-'))
        .forEach((c) => figure.classList.add(c))
      img.parentNode?.insertBefore(figure, img)
      figure.appendChild(img)
      const figcaption = document.createElement('figcaption')
      figcaption.textContent = caption
      figure.appendChild(figcaption)
    })

    // Lightbox on click
    const onClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        setLightboxSrc((target as HTMLImageElement).src)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [content])

  // Scroll progress + active TOC section
  useEffect(() => {
    const onScroll = () => {
      const root = articleRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const viewport = window.innerHeight
      const total = rect.height - viewport
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1))
      setProgress(total > 0 ? Math.round((scrolled / total) * 100) : rect.top < viewport ? 100 : 0)

      // Active section: last heading above the fold
      let current = ''
      for (const item of toc) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top < viewport * 0.3) {
          current = item.id
        }
      }
      setActiveId(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTocOpen(false)
  }

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />

      {/* Progress bar */}
      <div className="sticky top-0 z-20 h-1 bg-rose-50">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-pink-400 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reader header: reading time + TOC toggle */}
      <div className="flex items-center justify-between gap-3 px-5 md:px-8 pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          {readingMinutes} min read
        </span>
        {toc.length > 1 && (
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/70 border border-rose-100 text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
            On this page
          </button>
        )}
      </div>

      {/* Collapsible TOC */}
      {tocOpen && toc.length > 1 && (
        <nav className="mx-5 md:mx-8 mt-3 rounded-xl bg-rose-50/50 border border-rose-100 p-3">
          <ul className="space-y-1">
            {toc.map((item) => (
              <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                <button
                  onClick={() => jumpTo(item.id)}
                  className={`text-left text-sm transition-colors cursor-pointer ${
                    activeId === item.id
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* The article */}
      <div
        ref={articleRef}
        className="lesson-content px-5 md:px-8 py-6 md:py-8 max-w-3xl mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
