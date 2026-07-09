'use client'
import { useEffect, useRef, useState } from 'react'

/** Film-grain data URI shared by marketing surfaces. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

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
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-red-400" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
          {children}
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-red-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8 bg-gradient-to-r from-red-500 to-transparent" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
        {children}
      </span>
    </div>
  )
}
