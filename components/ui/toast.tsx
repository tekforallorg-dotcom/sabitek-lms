'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

/**
 * Lightweight global toast system (no dependency), styled to the
 * rose-glass design language. Usage anywhere in client code:
 *
 *   import { toast } from '@/components/ui/toast'
 *   toast.success('Saved')
 *   toast.error('Something went wrong')
 *   toast.info('Heads up')
 *   toast.warning('Careful')
 *
 * <Toaster /> must be mounted once (done in ConditionalLayout).
 * Replaces browser alert() calls: non-blocking, auto-dismissing,
 * screen-reader announced via aria-live.
 */

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
let listeners: Listener[] = []
let nextId = 1

function emit() {
  for (const l of listeners) l([...toasts])
}

function push(type: ToastType, message: string, durationMs = 4500) {
  const id = nextId++
  toasts = [...toasts, { id, type, message }]
  emit()
  setTimeout(() => dismiss(id), durationMs)
  return id
}

function dismiss(id: number) {
  const before = toasts.length
  toasts = toasts.filter((t) => t.id !== id)
  if (toasts.length !== before) emit()
}

export const toast = {
  success: (message: string, durationMs?: number) => push('success', message, durationMs),
  error: (message: string, durationMs?: number) => push('error', message, durationMs ?? 6000),
  info: (message: string, durationMs?: number) => push('info', message, durationMs),
  warning: (message: string, durationMs?: number) => push('warning', message, durationMs ?? 6000),
  dismiss,
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const TILE_CLASSES: Record<ToastType, string> = {
  success: 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)]',
  error: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)]',
  info: 'bg-gradient-to-br from-red-400 to-rose-500 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.4)]',
  warning: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_8px_16px_-6px_rgba(245,158,11,0.5)]',
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener: Listener = (t) => setItems(t)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none"
      aria-live="polite"
      role="status"
    >
      {items.map((t) => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className="pointer-events-auto w-full flex items-start gap-3 bg-white/90 backdrop-blur-xl rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_20px_45px_-18px_rgba(225,29,72,0.4)] px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${TILE_CLASSES[t.type]}`}>
              <Icon className="w-4 h-4 text-white" />
            </span>
            <p className="flex-1 text-sm text-gray-800 leading-snug pt-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
