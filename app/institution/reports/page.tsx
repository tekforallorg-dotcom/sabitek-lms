'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SabiLoader from '@/components/ui/SabiLoader'
import { toast } from '@/components/ui/toast'
import {
  Building2,
  Users,
  TrendingUp,
  GraduationCap,
  BookOpen,
  Layers,
  UsersRound,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Download,
  type LucideIcon,
} from 'lucide-react'

interface Totals {
  programs: number
  cohorts: number
  courses: number
  published_courses: number
  team_members: number
  active_learners: number
  completions: number
  avg_progress: number
}

interface CohortReport {
  id: string
  name: string
  program_name: string
  status: string
  start_date: string | null
  end_date: string | null
  seat_limit: number | null
  active_members: number
  avg_progress: number
  completed: number
  at_risk: number
}

const statusChip: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  upcoming: 'bg-amber-50 text-amber-700 border-amber-100',
  draft: 'bg-gray-50 text-gray-500 border-gray-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
}

/** Escape a single CSV field: quote when it contains a comma, quote, or newline. */
function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function InstitutionReportsPage() {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [cohorts, setCohorts] = useState<CohortReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const h = { Authorization: `Bearer ${session.access_token}` }
      const m = await fetch('/api/institutions/my-membership', { headers: h })
      if (!m.ok) return

      const mJson = await m.json()
      const membership = mJson.data || mJson
      const instId = membership.institution_id as string

      const res = await fetch(`/api/institutions/${instId}/reports`, { headers: h })
      if (!res.ok) {
        setError('We could not load your reports. Please try again.')
        return
      }

      const json = await res.json()
      const payload = json.data || json
      setTotals(payload.totals || null)
      setCohorts(payload.cohorts || [])
    } catch {
      setError('Something went wrong loading your reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedCohorts = useMemo(
    () => [...cohorts].sort((a, b) => b.active_members - a.active_members),
    [cohorts]
  )

  const canExport = !loading && !error && !!totals && cohorts.length > 0

  const handleExport = () => {
    if (!canExport || !totals) return

    const totalsRows: [string, string | number][] = [
      ['Active learners', totals.active_learners],
      ['Average progress (%)', totals.avg_progress],
      ['Completions', totals.completions],
      ['Published courses', totals.published_courses],
      ['Programs', totals.programs],
      ['Cohorts', totals.cohorts],
      ['Team members', totals.team_members],
    ]

    const lines: string[] = []
    lines.push('Metric,Value')
    for (const [label, value] of totalsRows) {
      lines.push(`${csvCell(label)},${csvCell(value)}`)
    }
    lines.push('')
    lines.push(
      'Cohort,Program,Status,Start date,End date,Active learners,Avg progress (%),Completed,At risk'
    )
    for (const c of sortedCohorts) {
      lines.push(
        [
          csvCell(c.name),
          csvCell(c.program_name),
          csvCell(c.status),
          csvCell(c.start_date ? c.start_date.slice(0, 10) : ''),
          csvCell(c.end_date ? c.end_date.slice(0, 10) : ''),
          csvCell(c.active_members),
          csvCell(c.avg_progress),
          csvCell(c.completed),
          csvCell(c.at_risk),
        ].join(',')
      )
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sabitek-reports-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Report exported')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb] flex items-center justify-center">
        <SabiLoader size="lg" text="Crunching the numbers..." />
      </div>
    )
  }

  const cardClass =
    'relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]'

  const primaryKpis: { label: string; value: string | number; icon: LucideIcon }[] = totals
    ? [
        { label: 'Active learners', value: totals.active_learners, icon: Users },
        { label: 'Avg progress', value: `${totals.avg_progress}%`, icon: TrendingUp },
        { label: 'Completions', value: totals.completions, icon: GraduationCap },
        { label: 'Published courses', value: totals.published_courses, icon: BookOpen },
      ]
    : []

  const secondaryKpis: { label: string; value: string | number; icon: LucideIcon }[] = totals
    ? [
        { label: 'Programs', value: totals.programs, icon: Layers },
        { label: 'Cohorts', value: totals.cohorts, icon: BarChart3 },
        { label: 'Team members', value: totals.team_members, icon: UsersRound },
      ]
    : []

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Sub-header bar */}
      <div className="bg-white/85 backdrop-blur border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-red-500" />
            <Link href="/institution/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
              Institution
            </Link>
            <span className="text-rose-300">/</span>
            <span className="font-medium text-gray-900">Reports</span>
          </div>
        </div>
      </div>

      {/* Header / hero */}
      <div className="relative overflow-hidden border-b border-rose-100">
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 bg-rose-100/60 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">
                Reports
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                Impact you can{' '}
                <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                  prove
                </span>
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Live numbers from real learner activity. Nothing self-reported.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport}
              title={canExport ? undefined : 'No cohort data yet'}
              className={`inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 border border-rose-100 rounded-full text-xs font-semibold text-gray-700 shadow-sm transition-colors flex-shrink-0 ${
                canExport
                  ? 'hover:border-rose-200 hover:bg-white cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-red-500" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className={`${cardClass} p-8 text-center max-w-md mx-auto`}>
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">
              Couldn&apos;t load <span className="font-serif italic text-red-600">reports</span>
            </h2>
            <p className="text-sm text-gray-600 mb-5">{error}</p>
            <button
              type="button"
              onClick={load}
              className="relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full px-5 py-2.5 shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Primary KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {primaryKpis.map((kpi) => (
                <div key={kpi.label} className={`${cardClass} p-5 sm:p-6`}>
                  <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center mb-4">
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Secondary KPI row */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
              {secondaryKpis.map((kpi) => (
                <div key={kpi.label} className={`${cardClass} p-4 flex items-center gap-3`}>
                  <span className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_8px_16px_-6px_rgba(225,29,72,0.5)] flex items-center justify-center flex-shrink-0">
                    <kpi.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-semibold tracking-tight text-gray-900 tabular-nums">
                      {kpi.value}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cohort performance */}
            <div className={`${cardClass} p-6`}>
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-1">
                  Cohort performance
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  How your <span className="font-serif italic text-red-600">cohorts</span> are doing
                </h2>
              </div>

              {sortedCohorts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-1">
                    No cohorts <span className="font-serif italic text-red-600">yet</span>
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Create a program and cohort to see live performance here.
                  </p>
                  <Link
                    href="/institution/programs"
                    className="relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold text-sm rounded-full px-5 py-2.5 shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                    Go to programs
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-rose-50">
                  {sortedCohorts.map((cohort) => {
                    const chip = statusChip[cohort.status] || 'bg-gray-50 text-gray-500 border-gray-200'
                    return (
                      <div
                        key={cohort.id}
                        className="flex flex-col lg:flex-row lg:items-center gap-4 py-4"
                      >
                        {/* Left: identity */}
                        <div className="lg:w-1/3 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">{cohort.name}</span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${chip}`}
                            >
                              {cohort.status}
                            </span>
                          </div>
                          {cohort.program_name && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{cohort.program_name}</p>
                          )}
                        </div>

                        {/* Right: metrics */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="text-sm text-gray-600 tabular-nums sm:w-24 flex-shrink-0">
                            {cohort.active_members}{' '}
                            <span className="text-gray-400">
                              {cohort.active_members === 1 ? 'learner' : 'learners'}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="flex-1 h-2 rounded-full bg-rose-50 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, cohort.avg_progress))}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums w-11 text-right">
                              {cohort.avg_progress}%
                            </span>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm text-emerald-700 tabular-nums whitespace-nowrap">
                              {cohort.completed} <span className="text-emerald-600/70">done</span>
                            </span>
                            {cohort.at_risk > 0 && (
                              <span
                                title="No activity in 14+ days"
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap cursor-help tabular-nums"
                              >
                                {cohort.at_risk} at risk
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
