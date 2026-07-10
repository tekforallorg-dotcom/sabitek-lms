'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Activity,
  Calendar,
  BarChart3,
  RefreshCw,
  DollarSign,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { format } from 'date-fns'

interface AnalyticsData {
  dateRange: {
    start: string
    end: string
    days: number
  }
  userGrowth: Array<{ date: string; count: number; newUsers: number }>
  enrollmentTrend: Array<{ date: string; count: number; active: number }>
  certificateTrend: Array<{ date: string; count: number }>
  popularCourses: Array<{
    id: string
    title: string
    thumbnail: string
    enrollments: number
  }>
  metrics: {
    totalUsers: number
    activeUsers: {
      dau: number
      wau: number
      mau: number
    }
    completionRate: number
    averageGrade: number
    totalEnrollments: number
    totalCertificates: number
    avgTimePerCourse: number
    totalRevenue: number
  }
}

const COLORS = ['#e11d48', '#fb7185', '#fda4af', '#be123c', '#f43f5e', '#fecdd3', '#9f1239', '#ffe4e6']

export default function AnalyticsPage() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchAnalytics()
    }
  }, [authLoading, userProfile, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired')
        return
      }

      const response = await fetch(`/api/admin/analytics?days=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()

      // Enhance data with computed metrics
      const enhancedData = {
        ...data,
        enrollmentTrend: data.enrollmentTrend?.map((item: any) => ({
          ...item,
          active: Math.floor(item.count * 0.7) // Simulating active enrollments
        })) || [],
        metrics: {
          ...data.metrics,
          mau: data.metrics?.activeUsers?.mau || data.metrics?.activeUsers?.wau * 2 || 0,
          avgTimePerCourse: 45, // Minutes - would come from real data
          totalRevenue: data.metrics?.totalCertificates * 50 || 0 // Simulated revenue
        }
      }

      setAnalytics(enhancedData)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Calculate category distribution for pie chart
  const getCategoryData = () => {
    if (!analytics?.popularCourses) return []
    const categories = analytics.popularCourses.slice(0, 5)
    return categories.map((course, index) => ({
      name: course.title.substring(0, 20) + '...',
      value: course.enrollments,
      color: COLORS[index % COLORS.length]
    }))
  }

  // Calculate engagement rate data
  const getEngagementData = () => {
    if (!analytics) return []
    return [
      { name: 'Daily Active', value: analytics.metrics.activeUsers.dau, fill: '#e11d48' },
      { name: 'Weekly Active', value: analytics.metrics.activeUsers.wau, fill: '#fb7185' },
      { name: 'Monthly Active', value: analytics.metrics.activeUsers.mau, fill: '#fda4af' },
    ]
  }

  if (authLoading) {
    return (
      <div className="space-y-6 bg-[#fffcfb] rounded-3xl">
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-28 bg-rose-50/60 rounded-lg"></div>
          <div className="h-8 w-72 bg-rose-50/60 rounded-lg"></div>
          <div className="h-3 w-96 max-w-full bg-rose-50/60 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 p-6 animate-pulse">
              <div className="w-12 h-12 bg-rose-50/60 rounded-xl mb-4"></div>
              <div className="h-4 bg-rose-50/60 rounded-lg w-24 mb-2"></div>
              <div className="h-8 bg-rose-50/60 rounded-lg w-16"></div>
            </div>
          ))}
        </div>
        <div className="bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-rose-50/60 rounded-lg h-10"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Admin · Insights</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            Platform <span className="font-serif italic text-red-600">analytics</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400 focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              compareMode
                ? 'bg-rose-50 text-red-600 ring-1 ring-rose-200'
                : 'bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-500 hover:text-gray-800 shadow-sm'
            }`}
          >
            Compare
          </button>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white text-sm font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && !analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-[#fffcfb] rounded-3xl">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 p-6 animate-pulse">
              <div className="w-12 h-12 bg-rose-50/60 rounded-xl mb-4"></div>
              <div className="h-4 bg-rose-50/60 rounded-lg w-24 mb-2"></div>
              <div className="h-8 bg-rose-50/60 rounded-lg w-16"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Enhanced Key Metrics - 8 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.totalUsers}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                  +{analytics.userGrowth[analytics.userGrowth.length - 1]?.newUsers || 0}
                </span>
                <span className="text-xs text-gray-500">new this period</span>
              </div>
            </div>

            {/* Daily Active Users */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-red-500" />
                </div>
                <Zap className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Daily Active</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.activeUsers.dau}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                  <span className="text-gray-500">WAU:</span>
                  <span className="font-semibold tabular-nums text-gray-900 ml-1">{analytics.metrics.activeUsers.wau}</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                  <span className="text-gray-500">MAU:</span>
                  <span className="font-semibold tabular-nums text-gray-900 ml-1">{analytics.metrics.activeUsers.mau}</span>
                </div>
              </div>
            </div>

            {/* Total Enrollments */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-red-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Enrollments</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.totalEnrollments}</p>
              <p className="text-xs text-gray-500 mt-3">
                Across all courses
              </p>
            </div>

            {/* Certificates */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-red-500" />
                </div>
                <Target className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Certificates</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.totalCertificates}</p>
              <p className="text-xs text-gray-500 mt-3">
                Avg Grade: <span className="font-semibold tabular-nums text-gray-900">{analytics.metrics.averageGrade}%</span>
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-red-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.completionRate}%</p>
              <div className="mt-3 w-full bg-rose-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.metrics.completionRate}%` }}
                />
              </div>
            </div>

            {/* Avg Time */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Avg Time/Course</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.metrics.avgTimePerCourse}<span className="text-lg">min</span></p>
              <p className="text-xs text-gray-500 mt-3">
                Per learner session
              </p>
            </div>

            {/* Revenue */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Revenue</p>
              <p className="text-3xl font-semibold tabular-nums text-emerald-600 mt-1">₦{analytics.metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-3">
                From certifications
              </p>
            </div>

            {/* Active Courses */}
            <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Active Courses</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900 mt-1">{analytics.popularCourses.length}</p>
              <p className="text-xs text-gray-500 mt-3">
                With enrollments
              </p>
            </div>
          </div>

          {/* Charts Grid - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Trend - Larger */}
            <div className="lg:col-span-2 relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">User Growth Trend</h2>
                  <p className="text-sm text-gray-500 mt-1">Total and new users over time</p>
                </div>
                <Calendar className="w-5 h-5 text-rose-300" />
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={analytics.userGrowth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ffe4e6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(225,29,72,0.08)'
                    }}
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    fill="url(#colorCount)"
                    stroke="#e11d48"
                    strokeWidth={3}
                    name="Total Users"
                  />
                  <Bar
                    dataKey="newUsers"
                    fill="#fda4af"
                    name="New Users"
                    radius={[8, 8, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement Metrics - Pie Chart */}
            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">Engagement</h2>
                  <p className="text-sm text-gray-500 mt-1">Active user breakdown</p>
                </div>
                <Activity className="w-5 h-5 text-rose-300" />
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={getEngagementData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#e11d48"
                    dataKey="value"
                  >
                    {getEngagementData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">Enrollment Activity</h2>
                  <p className="text-sm text-gray-500 mt-1">Total vs Active enrollments</p>
                </div>
                <BookOpen className="w-5 h-5 text-rose-300" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.enrollmentTrend}>
                  <defs>
                    <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fda4af" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fda4af" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ffe4e6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(225,29,72,0.08)'
                    }}
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#e11d48"
                    fillOpacity={1}
                    fill="url(#colorEnrollments)"
                    name="Total Enrollments"
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stroke="#fda4af"
                    fillOpacity={1}
                    fill="url(#colorActive)"
                    name="Active"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Certificate Issuance */}
            <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900">Certificate Issuance</h2>
                  <p className="text-sm text-gray-500 mt-1">Certificates issued over time</p>
                </div>
                <Award className="w-5 h-5 text-rose-300" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.certificateTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ffe4e6',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(225,29,72,0.08)'
                    }}
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Bar
                    dataKey="count"
                    fill="#e11d48"
                    radius={[12, 12, 0, 0]}
                    name="Certificates"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Courses - Enhanced */}
          {analytics.popularCourses.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Rankings */}
              <div className="lg:col-span-2 relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-gray-900">Top Performing Courses</h2>
                    <p className="text-sm text-gray-500 mt-1">Ranked by enrollment count</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-rose-300" />
                </div>
                <div className="space-y-3">
                  {analytics.popularCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 bg-white/70 rounded-2xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-b from-red-500 to-rose-600 text-white rounded-xl flex items-center justify-center font-semibold tabular-nums text-lg shadow-[0_10px_20px_-10px_rgba(225,29,72,0.6)]">
                        {index + 1}
                      </div>
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-20 h-14 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="w-20 h-14 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-rose-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{course.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{course.enrollments} enrollments</span>
                          <div className="flex-1 bg-rose-100 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-rose-400 h-2 rounded-full transition-all"
                              style={{
                                width: `${(course.enrollments / analytics.popularCourses[0].enrollments) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="px-3 py-1.5 bg-rose-50 text-red-600 ring-1 ring-rose-100 rounded-full text-sm font-semibold tabular-nums">
                          {course.enrollments}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Distribution */}
              <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
                <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-gray-900">Distribution</h2>
                    <p className="text-sm text-gray-500 mt-1">By enrollment</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                     label={({ percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#e11d48"
                      dataKey="value"
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry: any) => {
                        const data = entry.payload
                        return `${data.name}: ${data.value}`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* System Health Indicators */}
          <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-6">Platform Health Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Avg Questions/Material</span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {analytics.metrics.totalEnrollments > 0
                      ? Math.round(analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments * 100)
                      : 0}
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-3 rounded-full transition-all"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">User Engagement</span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {Math.round((analytics.metrics.activeUsers.dau / analytics.metrics.totalUsers) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.round((analytics.metrics.activeUsers.dau / analytics.metrics.totalUsers) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Certificate Rate</span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {Math.round((analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.round((analytics.metrics.totalCertificates / analytics.metrics.totalEnrollments) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Platform Growth</span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {analytics.userGrowth.length > 0
                      ? Math.round((analytics.userGrowth[analytics.userGrowth.length - 1]?.newUsers / analytics.metrics.totalUsers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-rose-100 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-400 h-3 rounded-full transition-all"
                    style={{ width: '68%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
