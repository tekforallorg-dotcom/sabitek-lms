'use client'
import Link from 'next/link'
import { Sparkles, type LucideIcon } from 'lucide-react'

export function SabitekWordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="inline-flex items-center gap-1 cursor-pointer">
      <span className={`font-medium text-gray-900 ${size === 'lg' ? 'text-4xl' : 'text-3xl'}`}>
        Sabitek
      </span>
      <Sparkles className={`text-red-500 ${size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}`} />
    </Link>
  )
}

export function AuthFeatureRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon
  title: string
  desc: string
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  )
}

/**
 * Split-screen auth layout in the light glass design language.
 * Left: layered brand panel (desktop only). Right: page content.
 */
export function AuthShell({
  eyebrow,
  titleTop,
  titleAccent,
  description,
  features,
  children,
  footer,
  mobileSubtitle,
}: {
  eyebrow?: string
  titleTop: string
  titleAccent: string
  description: React.ReactNode
  features?: { icon: LucideIcon; title: string; desc: string }[]
  children: React.ReactNode
  footer?: React.ReactNode
  mobileSubtitle?: string
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* ---------- Left brand panel ---------- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-red-50">
        {/* washes */}

        {/* concentric rings, bottom right */}
        <div className="absolute -bottom-44 -right-44 pointer-events-none" aria-hidden="true">
          <div className="w-[32rem] h-[32rem] rounded-full border border-gray-200" />
          <div className="absolute inset-12 rounded-full border border-gray-200" />
          <div className="absolute inset-24 rounded-full border border-gray-200" />
        </div>

        {/* dotted texture + grain */}

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16 w-full">
          <div className="mb-12">
            <SabitekWordmark size="lg" />
          </div>

          {eyebrow && (
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-red-600" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red-600">
                {eyebrow}
              </p>
            </div>
          )}

          <h2 className="text-4xl xl:text-5xl font-medium tracking-tight leading-[1.1] mb-4">
            {titleTop}
            <br />
            <span className="font-serif italic text-red-600">
              {titleAccent}
            </span>
          </h2>
          <p className="text-gray-600 leading-relaxed mb-10 max-w-md">{description}</p>

          {features && features.length > 0 && (
            <div className="space-y-3 max-w-md">
              {features.map((f, i) => (
                <AuthFeatureRow key={i} icon={f.icon} title={f.title} desc={f.desc} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Right content panel ---------- */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-md w-full py-12">
          <div className="lg:hidden text-center mb-8">
            <SabitekWordmark />
            {mobileSubtitle && <p className="text-gray-600 mt-2 text-sm">{mobileSubtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-7 text-center text-xs text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

/** Frosted form card with gradient hairline and soft rose depth. */
export function AuthCard({
  title,
  titleAccent,
  description,
  children,
  headerExtra,
}: {
  title: string
  titleAccent?: string
  description?: React.ReactNode
  children: React.ReactNode
  headerExtra?: React.ReactNode
}) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gray-200"
        aria-hidden="true"
      />
      <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
        {headerExtra}
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          {title}
          {titleAccent && (
            <>
              {' '}
              <span className="font-serif italic text-red-600">{titleAccent}</span>
            </>
          )}
        </h1>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>
      <div className="px-6 sm:px-8 pb-8">{children}</div>
    </div>
  )
}

/** Class strings shared by auth forms. */
export const authInputClass =
  'h-12 pl-11 rounded-xl bg-white/70 border-gray-200 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400'

export const authPrimaryBtnClass =
  'group relative overflow-hidden w-full h-12 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full ring-1 ring-red-600/50 transition-all'

export const authOutlineBtnClass =
  'w-full h-12 bg-white border-gray-200 hover:border-gray-200 hover:bg-white text-gray-700 text-sm font-medium rounded-full shadow-sm transition-all'

/** Divider with a small centered word. */
export function AuthDivider({ label = 'Or' }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-widest">
        <span className="bg-white px-3 text-gray-400">{label}</span>
      </div>
    </div>
  )
}
