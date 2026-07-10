'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  MessageSquare,
  Target,
  TrendingUp
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  getSystemStats,
  getUsageChartData,
  isAdmin,
  type SystemStats,
} from '@/lib/admin/sabiquiz-admin'

const COLORS = ['#e11d48', '#fb7185', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']

export default function AnalyticsAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [usageData, setUsageData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const adminCheck = await isAdmin(user.id)
      if (!adminCheck) {
        router.push('/')
        return
      }

      // Fetch stats
      const statsData = await getSystemStats()
      setStats(statsData)

      // Fetch usage chart data
      const usageChartData = await getUsageChartData()
      setUsageData(usageChartData)

      // Fetch category distribution
      const { data: materials } = await supabase
        .from('sabiquiz_materials')
        .select('category')

      const categoryCounts = new Map<string, number>()
      materials?.forEach(m => {
        const cat = m.category || 'Uncategorized'
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      })

      const categoryChartData = Array.from(categoryCounts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      setCategoryData(categoryChartData)

    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffcfb]">
        <div className="animate-pulse space-y-8 p-6 md:p-8">
          <div className="space-y-3">
            <div className="h-3 w-36 rounded-full bg-rose-100/80" />
            <div className="h-8 w-72 rounded-lg bg-rose-50/60" />
            <div className="h-4 w-56 rounded-lg bg-rose-50/60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl bg-rose-50/60" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map(i => (
              <div key={i} className="bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 space-y-3">
                {[0, 1, 2, 3, 4].map(j => (
                  <div key={j} className="bg-rose-50/60 rounded-lg h-10" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
        <p className="text-red-600">{error || 'Failed to load data'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600 mb-2">SabiQuiz admin</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
          SabiQuiz <span className="font-serif italic text-red-600">analytics</span>
        </h1>
        <p className="text-gray-600">System-wide performance and usage metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.totalMaterials}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">
                +{stats.materialsThisMonth} this month
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.totalQuestions}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">
                +{stats.questionsThisMonth} this month
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.totalAttempts}</p>
              <p className="text-xs font-semibold text-emerald-600 mt-1">
                +{stats.attemptsThisMonth} this month
              </p>
            </div>
            <Target className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{stats.averageScore}%</p>
              <p className="text-xs text-gray-500 mt-1">Across all quizzes</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Usage Trend */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Usage Trend (Last 14 Days)</h2>
          </div>
          <div className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="materials"
                  stroke="#fb7185"
                  strokeWidth={2}
                  name="Materials Uploaded"
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke="#e11d48"
                  strokeWidth={2}
                  name="Quiz Attempts"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Materials by Category</h2>
          </div>
          <div className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#e11d48"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Monthly Growth</h2>
          </div>
          <div className="p-6 pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Materials', value: stats.materialsThisMonth },
                  { name: 'Questions', value: stats.questionsThisMonth },
                  { name: 'Attempts', value: stats.attemptsThisMonth },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">System Health Metrics</h2>
          </div>
          <div className="p-6 pt-2">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Questions per Material</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {stats.totalMaterials > 0
                      ? Math.round(stats.totalQuestions / stats.totalMaterials)
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalQuestions / stats.totalMaterials) / 50) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Attempts per Material</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {stats.totalMaterials > 0
                      ? Math.round(stats.totalAttempts / stats.totalMaterials)
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalAttempts / stats.totalMaterials) / 10) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Average Score</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">{stats.averageScore}%</span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-rose-400 to-rose-500 h-2 rounded-full"
                    style={{ width: `${stats.averageScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Platform Adoption</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {stats.totalUsers > 0
                      ? Math.round((stats.totalAttempts / stats.totalUsers) * 100) / 100
                      : 0}{' '}
                    attempts/user
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.totalAttempts / stats.totalUsers) / 5) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
