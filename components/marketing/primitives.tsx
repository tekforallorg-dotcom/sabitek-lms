'use client'
import { useEffect, useRef, useState } from 'react'

/** Scroll-reveal wrapper (IntersectionObserver, respects reduced motion). */
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
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
