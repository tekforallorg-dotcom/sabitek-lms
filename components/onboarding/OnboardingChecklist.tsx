'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Check, ChevronRight, X } from 'lucide-react'

interface OnboardingStep {
  key: string
  label: string
  description: string
  href: string
  done: boolean
}

interface ChecklistData {
  steps: OnboardingStep[]
  completed: number
  total: number
}

type Persona = 'learner' | 'instructor' | 'institution'

const PERSONA_TITLES: Record<Persona, string> = {
  learner: 'Start learning',
  instructor: 'Start teaching',
  institution: 'Set up your workspace',
}

const RING_SIZE = 44
const RING_STROKE = 4
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function OnboardingChecklist({ persona }: { persona: Persona }) {
  const [data, setData] = useState<ChecklistData | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [ringProgress, setRingProgress] = useState(0)

  const dismissKey = `sabitek-onboarding-dismissed-${persona}`

  useEffect(() => {
    // localStorage only exists in the browser — check inside the effect
    if (localStorage.getItem(dismissKey) === '1') {
      setDismissed(true)
      return
    }
    setDismissed(false)

    let cancelled = false

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch(`/api/onboarding/checklist?persona=${persona}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) return

        const json = await res.json()
        const payload = (json.data || json) as ChecklistData
        if (!payload.steps || payload.steps.length === 0) return
        if (!cancelled) setData(payload)
      } catch {
        // Fetch failure: the checklist simply doesn't render
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [persona, dismissKey])

  // Animate the ring in after data arrives
  useEffect(() => {
    if (!data) return
    const raf = requestAnimationFrame(() =>
      setRingProgress(data.total > 0 ? data.completed / data.total : 0)
    )
    return () => cancelAnimationFrame(raf)
  }, [data])

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }

  if (dismissed || !data) return null
  if (data.completed === data.total) return null

  const { steps, completed, total } = data
  const title =
    completed >= total - 1 ? "You're almost set up" : PERSONA_TITLES[persona]
  const firstPendingKey = steps.find((s) => !s.done)?.key
  const gradientId = `onboarding-ring-${persona}`

  return (
    <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-5">
      <span
        className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
        aria-hidden="true"
      />

      {/* Header: ring + titles + dismiss */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#ffe4e6"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringProgress)}
              style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-gray-900">
            {completed}/{total}
          </span>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-0.5">
            Getting started
          </p>
          <h2 className="font-semibold tracking-tight text-gray-900">{title}</h2>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss getting started checklist"
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-rose-50 transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step) => {
          const emphasized = !step.done && step.key === firstPendingKey
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                step.done
                  ? 'hover:bg-rose-50/40'
                  : emphasized
                    ? 'bg-rose-50/50 ring-1 ring-rose-100 hover:bg-rose-50/60'
                    : 'hover:bg-rose-50/60'
              }`}
            >
              {step.done ? (
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-rose-200 flex-shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0">
                <span
                  className={`block text-sm truncate ${
                    step.done ? 'line-through text-gray-400' : 'font-medium text-gray-800'
                  }`}
                >
                  {step.label}
                </span>
                {!step.done && step.description && (
                  <span className="block text-[11px] text-gray-400 truncate">{step.description}</span>
                )}
              </span>
              {!step.done && (
                <ChevronRight className="w-3.5 h-3.5 text-rose-300 ml-auto flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
