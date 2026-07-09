'use client'
import Link from 'next/link'
import { Sparkles, type LucideIcon } from 'lucide-react'

export const AUTH_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

export function SabitekWordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="inline-flex items-center gap-1 cursor-pointer">
      <span className={`font-bold text-gray-900 ${size === 'lg' ? 'text-4xl' : 'text-3xl'}`}>
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
    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100/80 shadow-[0_14px_30px_-18px_rgba(225,29,72,0.3)] px-4 py-3.5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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
    <div className="min-h-screen flex bg-[#fffcfb] text-gray-900">
      {/* ---------- Left brand panel ---------- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-rose-50 via-[#fff7f6] to-pink-50">
        {/* washes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-100/80 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -left-28 w-80 h-80 bg-pink-100/70 rounded-full blur-[90px]" />

        {/* concentric rings, bottom right */}
        <div className="absolute -bottom-44 -right-44 pointer-events-none" aria-hidden="true">
          <div className="w-[32rem] h-[32rem] rounded-full border border-rose-200/60" />
          <div className="absolute inset-12 rounded-full border border-rose-200/50" />
          <div className="absolute inset-24 rounded-full border border-rose-200/40" />
        </div>

        {/* dotted texture + grain */}
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 40% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 40% 40%, black, transparent)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: AUTH_GRAIN }} />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16 w-full">
          <div className="mb-12">
            <SabitekWordmark size="lg" />
          </div>

          {eyebrow && (
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-gradient-to-r from-red-500 to-transparent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                {eyebrow}
              </p>
            </div>
          )}

          <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            {titleTop}
            <br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-600">
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
        <div
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fecdd3 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
          }}
        />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-rose-50 rounded-full blur-[90px] pointer-events-none" />

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
    <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_30px_60px_-25px_rgba(225,29,72,0.35)] overflow-hidden">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />
      <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
        {headerExtra}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
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
  'h-12 pl-11 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400'

export const authPrimaryBtnClass =
  'group relative overflow-hidden w-full h-12 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-10px_rgba(225,29,72,0.6)]'

export const authOutlineBtnClass =
  'w-full h-12 bg-white/70 backdrop-blur border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5'

/** Top sheen for primary buttons, drop inside the Button as first child. */
export function BtnSheen() {
  return (
    <span
      className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

/** Divider with a small centered word. */
export function AuthDivider({ label = 'Or' }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-rose-100" />
      </div>
      <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
        <span className="bg-white px-3 text-gray-400">{label}</span>
      </div>
    </div>
  )
}
