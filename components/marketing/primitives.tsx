'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Fades a block in as it scrolls into view.
 *
 * The block is visible until proven otherwise. It used to start invisible and
 * wait for a script to reveal it, so on a slow phone the headline and
 * everything else on the page stayed blank until the script had loaded, and
 * stayed blank for good if it failed. Now the page is readable as soon as the
 * HTML arrives; after the script loads, only blocks that are still below the
 * screen are hidden, and they fade in when reached. Anything on screen at
 * load never animates, and people who ask for reduced motion get none.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'shown' | 'waiting' | 'revealed'>('shown')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let io: IntersectionObserver | null = null
    const frame = requestAnimationFrame(() => {
      // Already on screen (or above it): leave it alone.
      if (el.getBoundingClientRect().top < window.innerHeight) return
      setPhase('waiting')
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPhase('revealed')
            io?.disconnect()
          }
        },
        { threshold: 0.15 }
      )
      io.observe(el)
    })
    return () => {
      cancelAnimationFrame(frame)
      io?.disconnect()
    }
  }, [])

  const animated = phase !== 'shown'
  return (
    <div
      ref={ref}
      style={animated ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${animated ? 'transition-all duration-700 ease-out ' : ''}${
        phase === 'waiting' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Tracked-caps section label with a thin gradient rule. */
export function SectionLabel({
  children,
  centered = false,
}: {
  children: React.ReactNode
  centered?: boolean
}) {
  if (centered) {
    return (
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="h-px w-10 bg-red-600" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">
          {children}
        </span>
        <span className="h-px w-10 bg-red-600" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8 bg-red-600" />
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">
        {children}
      </span>
    </div>
  )
}
