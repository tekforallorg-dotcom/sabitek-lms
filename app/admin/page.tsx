'use client'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp,
  UserCheck,
  RefreshCw
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

export default function AdminDashboard() {
  const { loading: authLoading, userProfile } = useAdminAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchDashboardData()
    }
  }, [authLoading, userProfile])

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
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your platform today.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-8 bg-gray-200 rounded"></div>
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
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            subtitle={`${stats.mau.value} active (30 days)`}
          />
          <StatCard
            label="Active Courses"
            value={stats.activeCourses.value.toLocaleString()}
            change={stats.activeCourses.change}
            trend={stats.activeCourses.trend}
            icon={BookOpen}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            subtitle={`${stats.activeCourses.total} total courses`}
          />
          <StatCard
            label="Certificates Issued"
            value={stats.totalCertificates.value.toLocaleString()}
            change={stats.totalCertificates.change}
            trend={stats.totalCertificates.trend}
            icon={Award}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            label="Total Enrollments"
            value={stats.totalEnrollments.value.toLocaleString()}
            change={stats.totalEnrollments.change}
            trend={stats.totalEnrollments.trend}
            icon={TrendingUp}
            bgColor="bg-red-50"
            iconColor="text-red-600"
          />
        </div>
      ) : null}

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/admin/users"
              className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              View All Users
            </Link>
            <Link
              href="/admin/courses"
              className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Manage Courses
            </Link>
            <Link
              href="/admin/certificates"
              className="block w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            >
              View Certificates
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <ActivityFeed activities={activity} loading={loading} />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Database</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Authentication</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">API</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Online</span>
          </div>
        </div>
      </div>
    </div>
  )
}