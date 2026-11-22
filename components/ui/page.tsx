import * as React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The building blocks every signed-in page is laid out with. They carry the
 * type scale in docs/design-rules.md, so a page that uses them cannot drift:
 *
 *   page title      text-2xl  medium     PageHeader
 *   section title   text-lg   medium     Section
 *   card title      text-base medium     (set by the page inside a Panel)
 *   body            text-sm
 *   secondary       text-xs   gray-500
 *   label           text-xs   medium, uppercase   Stat
 *   big number      text-2xl  medium, tabular     Stat
 */

/** The one card surface. Flat white, one border, 12px corners. */
export const PANEL = 'rounded-xl border border-gray-200 bg-white'

export function Page({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8', className)}>{children}</div>
}

/**
 * Title, one line of context, and the actions the person came to this page
 * for. Put at most one primary button in `actions`, named after its outcome.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-medium leading-8 tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** A titled group of related content, with an optional link or button on the right. */
export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium leading-7 text-gray-900">{title}</h2>
          {description && <p className="text-sm leading-5 text-gray-500">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

/**
 * Secondary content that stays out of the way until asked for. Uses the
 * browser's own disclosure element, so it works without JavaScript.
 */
export function Collapsible({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode
  /** A few words shown beside the title while closed, e.g. "3 this week". */
  summary?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className={cn(PANEL, 'group')}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span
          className="h-2 w-2 flex-shrink-0 rotate-[-45deg] border-b border-r border-gray-400 transition-transform group-open:rotate-45"
          aria-hidden="true"
        />
        <span className="font-medium text-gray-900">{title}</span>
        {summary && <span className="truncate text-gray-500">{summary}</span>}
      </summary>
      <div className="border-t border-gray-200 p-4">{children}</div>
    </details>
  )
}

export interface StatItem {
  label: string
  value: React.ReactNode
  /** A short qualifier under the number, e.g. "of 5 courses". */
  hint?: React.ReactNode
  href?: string
}

/**
 * A row of figures in one panel, divided by hairlines. No icons and no
 * decoration: the number is the content.
 */
export function StatRow({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    // The gray background shows through the 1px gaps as hairlines.
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none',
        className
      )}
    >
      {items.map((item, index) => {
        const lastAndOdd = index === items.length - 1 && items.length % 2 === 1
        const cell = cn('block bg-white p-4', lastAndOdd && 'max-sm:col-span-2')
        const body = (
          <>
            <dt className="text-xs font-medium uppercase leading-4 tracking-wider text-gray-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-medium leading-8 tabular-nums text-gray-900">{item.value}</dd>
            {item.hint && <dd className="text-xs leading-4 text-gray-500">{item.hint}</dd>}
          </>
        )
        return item.href ? (
          <Link key={item.label} href={item.href} className={cn(cell, 'transition-colors hover:bg-gray-50')}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={cell}>
            {body}
          </div>
        )
      })}
    </dl>
  )
}

/** What a list shows when it has nothing in it: why, and the way forward. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(PANEL, 'px-6 py-12 text-center', className)}>
      {Icon && <Icon className="mx-auto mb-4 h-8 w-8 text-gray-300" aria-hidden="true" />}
      <h3 className="text-base font-medium leading-6 text-gray-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-gray-500">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

/** Progress as a thin bar. Green only once finished. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label ?? 'Progress'}
      className="h-1 w-full overflow-hidden rounded-full bg-gray-100"
    >
      <div
        className={cn('h-full rounded-full', clamped === 100 ? 'bg-green-600' : 'bg-red-600')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
