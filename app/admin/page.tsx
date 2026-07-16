'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  UserCheck,
  RefreshCw,
  GraduationCap,
  Presentation,
  Building2,
  UsersRound,
  Cpu
} from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import ActivityFeed from '@/components/admin/ActivityFeed'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  totalUsers: { value: number; change: number; trend: 'up' | 'down' }
  mau: { value: number; change: number; trend: 'up' | 'down' }
  activeCourses: { value: number; total: number; change: number; trend: 'up' | 'down' }
  totalEnrollments: { value: number; change: number; trend: 'up' | 'down' }
  totalCertificates: { value: number; change: number; trend: 'up' | 'down' }
}

interface Metrics {
  totals: {
    users: number
    learners: number
    instructors: number
    institutions: number
    published_courses: number
    enrollments: number
    certificates: number
    cohorts: number
  }
  ai_this_month: {
    requests: number
    est_cost_usd: number
    by_model: Record<string, { requests: number; est_cost_usd: number }>
  }
}

export default function AdminDashboard() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchDashboardData()
      fetchMetrics()
    }
  }, [authLoading, userProfile])

  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMetrics(null)
        return
      }
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        setMetrics(null)
        return
      }
      const data = await res.json()
      setMetrics(data)
    } catch {
      setMetrics(null)
    } finally {
      setMetricsLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
      }

      // Fetch stats and activity in parallel
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/activity?limit=10', { headers }),
      ])

      if (!statsResponse.ok || !activityResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const statsData = await statsResponse.json()
      const activityData = await activityResponse.json()

      setStats(statsData)
      setActivity(activityData.activity || [])
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                Platform admin
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Admin'} — your{' '}
                <span className="font-serif italic text-red-600">overview</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your platform today.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Platform cockpit (super admins only) */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] p-5 animate-pulse"
            >
              <div className="w-10 h-10 bg-rose-50/60 rounded-xl mb-3"></div>
              <div className="w-16 h-3 bg-rose-50/60 rounded-full mb-2"></div>
              <div className="w-20 h-6 bg-rose-50/60 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <section className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
            Platform cockpit
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total users', value: metrics.totals.users, icon: Users, from: 'from-red-500', to: 'to-rose-600' },
              { label: 'Learners', value: metrics.totals.learners, icon: GraduationCap, from: 'from-emerald-500', to: 'to-emerald-600' },
              { label: 'Instructors', value: metrics.totals.instructors, icon: Presentation, from: 'from-rose-500', to: 'to-rose-600' },
              { label: 'Institutions', value: metrics.totals.institutions, icon: Building2, from: 'from-amber-500', to: 'to-amber-600' },
              { label: 'Published courses', value: metrics.totals.published_courses, icon: BookOpen, from: 'from-red-500', to: 'to-rose-600' },
              { label: 'Enrollments', value: metrics.totals.enrollments, icon: TrendingUp, from: 'from-rose-500', to: 'to-rose-600' },
              { label: 'Certificates', value: metrics.totals.certificates, icon: Award, from: 'from-amber-500', to: 'to-amber-600' },
              { label: 'Cohorts', value: metrics.totals.cohorts, icon: UsersRound, from: 'from-emerald-500', to: 'to-emerald-600' },
            ].map((tile) => {
              const Icon = tile.icon
              return (
                <div
                  key={tile.label}
                  className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] p-5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-b ${tile.from} ${tile.to} flex items-center justify-center shadow-sm mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {tile.label}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                    {tile.value.toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 border border-white shadow-[0_20px_45px_-20px_rgba(225,29,72,0.4)] p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-red-500 to-rose-600 flex items-center justify-center shadow-sm shrink-0">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-600">
                  AI spend this month
                </p>
                <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                  <span className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                    ${metrics.ai_this_month.est_cost_usd.toFixed(2)} <span className="text-base font-normal text-gray-400">est.</span>
                  </span>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {metrics.ai_this_month.requests.toLocaleString()} requests
                  </span>
                </div>
                {Object.keys(metrics.ai_this_month.by_model).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {Object.entries(metrics.ai_this_month.by_model).map(([model, m]) => (
                      <p key={model} className="text-xs text-gray-500 tabular-nums">
                        <span className="font-medium text-gray-600">{model}</span> — ${m.est_cost_usd.toFixed(2)} · {m.requests.toLocaleString()} requests
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-rose-50/60 rounded-xl"></div>
                <div className="w-16 h-6 bg-rose-50/60 rounded-xl"></div>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-rose-50/60 rounded-xl"></div>
                <div className="w-32 h-8 bg-rose-50/60 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Users"
            value={stats.totalUsers.value.toLocaleString()}
            change={stats.totalUsers.change}
            trend={stats.totalUsers.trend}
            icon={Users}
            bgColor="bg-rose-50 border border-rose-100"
            iconColor="text-red-500"
            subtitle={`${stats.mau.value} active (30 days)`}
          />
          <StatCard
            label="Active Courses"
            value={stats.activeCourses.value.toLocaleString()}
            change={stats.activeCourses.change}
            trend={stats.activeCourses.trend}
            icon={BookOpen}
            bgColor="bg-rose-50 border border-rose-100"
            iconColor="text-red-500"
            subtitle={`${stats.activeCourses.total} total courses`}
          />
          <StatCard
            label="Certificates Issued"
            value={stats.totalCertificates.value.toLocaleString()}
            change={stats.totalCertificates.change}
            trend={stats.totalCertificates.trend}
            icon={Award}
            bgColor="bg-rose-50 border border-rose-100"
            iconColor="text-red-500"
          />
          <StatCard
            label="Total Enrollments"
            value={stats.totalEnrollments.value.toLocaleString()}
            change={stats.totalEnrollments.change}
            trend={stats.totalEnrollments.trend}
            icon={TrendingUp}
            bgColor="bg-rose-50 border border-rose-100"
            iconColor="text-red-500"
          />
        </div>
      ) : null}

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
          <h3 className="font-semibold tracking-tight text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="block w-full text-left px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-rose-50/60 text-sm font-medium text-gray-700 shadow-sm transition-colors"
            >
              View All Users
            </Link>
            <Link
              href="/admin/courses"
              className="block w-full text-left px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-rose-50/60 text-sm font-medium text-gray-700 shadow-sm transition-colors"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/certificates"
              className="block w-full text-left px-4 py-2 rounded-xl bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-rose-50/60 text-sm font-medium text-gray-700 shadow-sm transition-colors"
            >
              View Certificates
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
          <h3 className="font-semibold tracking-tight text-gray-900 mb-4">Recent Activity</h3>
          <ActivityFeed activities={activity} loading={loading} />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <h3 className="font-semibold tracking-tight text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-rose-50/40 border border-rose-100/60 rounded-xl">
            <span className="text-sm text-gray-600">Database</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold rounded-full">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-rose-50/40 border border-rose-100/60 rounded-xl">
            <span className="text-sm text-gray-600">Authentication</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold rounded-full">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-rose-50/40 border border-rose-100/60 rounded-xl">
            <span className="text-sm text-gray-600">API</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold rounded-full">Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}
