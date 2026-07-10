'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import {
  CreditCard,
  Crown,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Receipt,
  AlertCircle,
  Loader2,
  Search,
  Gift,
  Download,
  Calendar,
  RefreshCw,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Eye,
  ExternalLink,
  User,
  Mail,
  Hash,
  FileText,
  CreditCard as CardIcon
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface Stats {
  totalRevenue: number
  revenueToday: number
  revenue7Days: number
  revenueThisMonth: number
  mrr: number
  refundsThisMonth: number
  netRevenueThisMonth: number
  activeSubscriptions: number
  totalTransactions: number
  coursePurchases: number
}

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  transaction_type: string
  provider_tx_ref: string
  provider_transaction_id?: string
  created_at: string
  updated_at?: string
  raw_event?: any
  user_id?: string
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
  plan?: {
    id: string
    name: string
    price: number
  }
  course?: {
    id: string
    title: string
    slug: string
  }
}

interface ChartData {
  date: string
  revenue: number
  transactions: number
}

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
]

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Successful', value: 'successful' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
]

export default function AdminBillingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    revenueToday: 0,
    revenue7Days: 0,
    revenueThisMonth: 0,
    mrr: 0,
    refundsThisMonth: 0,
    netRevenueThisMonth: 0,
    activeSubscriptions: 0,
    totalTransactions: 0,
    coursePurchases: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Drawer
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filters
  const [dateFilter, setDateFilter] = useState('30days')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Grant Pro
  const [grantEmail, setGrantEmail] = useState('')
  const [granting, setGranting] = useState(false)

  // Export
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndFetch()
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!authLoading && user) {
      fetchTransactions()
    }
  }, [dateFilter, statusFilter])

  const checkAdminAndFetch = async () => {
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('role, is_super_admin')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin' && !userData?.is_super_admin) {
      router.push('/dashboard')
      return
    }

    fetchBillingData()
  }

  const getDateRange = (filter: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filter) {
      case 'today':
        return { start: today, end: now }
      case '7days':
        const week = new Date(today)
        week.setDate(week.getDate() - 7)
        return { start: week, end: now }
      case '30days':
        const month = new Date(today)
        month.setDate(month.getDate() - 30)
        return { start: month, end: now }
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start: monthStart, end: now }
      default:
        return { start: null, end: now }
    }
  }

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Get all successful transactions
      const { data: allTx } = await supabase
        .from('transactions')
        .select('amount, created_at, transaction_type')
        .eq('status', 'successful')

      const totalRevenue = allTx?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      const revenueToday = allTx?.filter(tx =>
        new Date(tx.created_at) >= today
      ).reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      const revenue7Days = allTx?.filter(tx =>
        new Date(tx.created_at) >= weekAgo
      ).reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      const revenueThisMonth = allTx?.filter(tx =>
        new Date(tx.created_at) >= monthStart
      ).reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      // Calculate MRR from active subscriptions
      const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('plan:plans(price)')
        .eq('status', 'active')

      const mrr = activeSubs?.reduce((sum, sub: any) => sum + (sub.plan?.price || 0), 0) || 0

      // Get refunds this month (placeholder - will add refunds table later)
      const refundsThisMonth = 0
      const netRevenueThisMonth = revenueThisMonth - refundsThisMonth

      // Counts
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })

      const { count: coursePurchases } = await supabase
        .from('course_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'successful')

      setStats({
        totalRevenue,
        revenueToday,
        revenue7Days,
        revenueThisMonth,
        mrr,
        refundsThisMonth,
        netRevenueThisMonth,
        activeSubscriptions: activeSubscriptions || 0,
        totalTransactions: totalTransactions || 0,
        coursePurchases: coursePurchases || 0
      })

      // Generate chart data (last 30 days)
      await generateChartData()
      await fetchTransactions()

    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = async () => {
    const days = 30
    const chartData: ChartData[] = []

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'successful')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayTx = txData?.filter(tx =>
        tx.created_at.startsWith(dateStr)
      ) || []

      chartData.push({
        date: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        revenue: dayTx.reduce((sum, tx) => sum + (tx.amount || 0), 0),
        transactions: dayTx.length
      })
    }

    setChartData(chartData)
  }

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url),
          plan:plans(id, name, price),
          course:courses(id, title, slug)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply date filter
      const { start } = getDateRange(dateFilter)
      if (start) {
        query = query.gte('created_at', start.toISOString())
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data: txData } = await query
      setTransactions(txData || [])

    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions

    const query = searchQuery.toLowerCase()
    return transactions.filter(tx =>
      tx.user?.email?.toLowerCase().includes(query) ||
      tx.user?.full_name?.toLowerCase().includes(query) ||
      tx.provider_tx_ref?.toLowerCase().includes(query)
    )
  }, [transactions, searchQuery])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBillingData()
    setRefreshing(false)
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)

      const headers = ['Date', 'User', 'Email', 'Type', 'Amount', 'Status', 'Reference']
      const rows = filteredTransactions.map(tx => [
        new Date(tx.created_at).toISOString(),
        tx.user?.full_name || 'Unknown',
        tx.user?.email || '',
        tx.transaction_type,
        tx.amount,
        tx.status,
        tx.provider_tx_ref || ''
      ])

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `sabitek-transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleGrantPro = async () => {
    if (!grantEmail.trim()) {
      toast.warning('Please enter an email address')
      return
    }

    try {
      setGranting(true)

      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', grantEmail.trim().toLowerCase())
        .single()

      if (userError || !targetUser) {
        toast.error('User not found with that email')
        return
      }

      const { data: proPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'pro')
        .single()

      if (!proPlan) {
        toast.error('Pro plan not found')
        return
      }

      const periodEnd = new Date()
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: targetUser.id,
          plan_id: proPlan.id,
          status: 'active',
          provider: 'manual',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false
        }, {
          onConflict: 'user_id'
        })

      if (subError) throw subError

      const entitlements = ['sabiquiz', 'sabiadvisor', 'priority_support', 'pro_features']
      for (const key of entitlements) {
        await supabase
          .from('entitlements')
          .upsert({
            user_id: targetUser.id,
            key,
            value: 'true',
            source: 'manual_grant',
            expires_at: periodEnd.toISOString()
          }, {
            onConflict: 'user_id,key'
          })
      }

      toast.success(`Pro access granted to ${grantEmail} for 1 year!`)
      setGrantEmail('')
      fetchBillingData()

    } catch (error: any) {
      console.error('Grant error:', error)
      toast.error(error.message || 'Failed to grant Pro access')
    } finally {
      setGranting(false)
    }
  }

  const handleViewTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedTransaction(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'pending': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'refunded': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-red-100 text-red-700 border-red-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6 bg-[#fffcfb] rounded-3xl">
        {/* Header skeleton */}
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-28 bg-rose-50/60 rounded-lg"></div>
          <div className="h-8 w-64 bg-rose-50/60 rounded-lg"></div>
          <div className="h-3 w-80 bg-rose-50/60 rounded-lg"></div>
        </div>

        {/* Stat card skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 p-4 animate-pulse"
            >
              <div className="h-3 w-16 bg-rose-50/60 rounded-lg mb-3"></div>
              <div className="h-6 w-24 bg-rose-50/60 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 p-6 space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-rose-50/60 rounded-lg mb-4"></div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-rose-50/60 rounded-lg h-10"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Admin · Billing</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            Billing <span className="font-serif italic text-red-600">dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor revenue, transactions, and subscriptions</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Today</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {formatCurrency(stats.revenueToday)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Last 7 Days</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {formatCurrency(stats.revenue7Days)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">This Month</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {formatCurrency(stats.revenueThisMonth)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">MRR</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {formatCurrency(stats.mrr)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-xl font-semibold tabular-nums text-emerald-600 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Pro</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {stats.activeSubscriptions}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Transactions</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {stats.totalTransactions}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Course Sales</p>
              <p className="text-xl font-semibold tabular-nums text-gray-900 mt-1">
                {stats.coursePurchases}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffe4e6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency((value as number) || 0), 'Revenue']}
                labelStyle={{ color: '#666' }}
              />
              <Bar dataKey="revenue" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grant Pro Access */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
            <Gift className="w-4 h-4 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Grant Pro Access</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Manually grant Pro subscription to a user for 1 year
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter user email..."
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            className="flex-1 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400"
          />
          <Button
            onClick={handleGrantPro}
            disabled={granting || !grantEmail.trim()}
            className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true"/>
            {granting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Granting...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Grant 1 Year Pro
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="relative overflow-hidden bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] p-6">
        <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true"/>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Transactions</h2>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={exporting || filteredTransactions.length === 0}
            variant="outline"
            size="sm"
            className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
          >
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by email or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-white/70 border-rose-100 focus:border-red-400 focus:ring-red-400"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400 focus:outline-none"
          >
            {DATE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/70 border border-rose-100 text-sm focus:border-red-400 focus:ring-red-400 focus:outline-none"
          >
            {STATUS_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-[#fffcfb] rounded-2xl border border-rose-100/70">
            <div className="w-12 h-12 mx-auto mb-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rose-100">
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3">User</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3 hidden sm:table-cell">Type</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3">Amount</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3">Status</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3 hidden lg:table-cell">Reference</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3 hidden md:table-cell">Date</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-rose-50 hover:bg-rose-50/40 cursor-pointer"
                    onClick={() => handleViewTransaction(tx)}
                  >
                    <td className="py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[180px]">
                          {tx.user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[180px]">
                          {tx.user?.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-900">
                        {tx.transaction_type === 'subscription'
                          ? tx.plan?.name || 'Pro'
                          : tx.course?.title || 'Course'
                        }
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {tx.transaction_type?.replace('_', ' ')}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="text-sm font-semibold tabular-nums text-gray-900">
                        {formatCurrency(tx.amount)}
                      </p>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'successful' ? 'bg-emerald-50 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-rose-50 text-rose-600' :
                        tx.status === 'refunded' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tx.status === 'successful' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : tx.status === 'pending' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                        {tx.provider_tx_ref || '-'}
                      </p>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.created_at)}
                      </p>
                    </td>
                    <td className="py-3">
                      <Eye className="w-4 h-4 text-rose-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        <div className="mt-4 text-xs text-gray-500">
          Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Transaction Details Drawer */}
      <Sheet
        open={drawerOpen}
        onClose={closeDrawer}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="p-4 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(selectedTransaction.status)}`}>
                {selectedTransaction.status === 'successful' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : selectedTransaction.status === 'pending' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
              </span>
              <span className="text-xs text-gray-500">
                ID: {selectedTransaction.id.slice(0, 8)}...
              </span>
            </div>

            {/* Amount */}
            <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className="text-3xl font-semibold tabular-nums text-gray-900">
                {formatCurrency(selectedTransaction.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedTransaction.transaction_type?.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            {/* User Info */}
            <div className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-red-500" />
                Customer
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {selectedTransaction.user?.avatar_url ? (
                    <img
                      src={selectedTransaction.user.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <span className="text-red-600 font-semibold">
                        {selectedTransaction.user?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedTransaction.user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedTransaction.user?.email || 'No email'}
                    </p>
                  </div>
                </div>
                {selectedTransaction.user?.id && (
                  <a
                    href={`/admin/users?id=${selectedTransaction.user.id}`}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Profile <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-rose-50">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {selectedTransaction.transaction_type?.replace('_', ' ')}
                  </span>
                </div>
                {selectedTransaction.plan && (
                  <div className="flex justify-between items-center py-2 border-b border-rose-50">
                    <span className="text-sm text-gray-500">Plan</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedTransaction.plan.name}
                    </span>
                  </div>
                )}
                {selectedTransaction.course && (
                  <div className="flex justify-between items-center py-2 border-b border-rose-50">
                    <span className="text-sm text-gray-500">Course</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedTransaction.course.title}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-rose-50">
                  <span className="text-sm text-gray-500">Currency</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedTransaction.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-rose-50">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(selectedTransaction.created_at)}
                  </span>
                </div>
                {selectedTransaction.updated_at && (
                  <div className="flex justify-between items-center py-2 border-b border-rose-50">
                    <span className="text-sm text-gray-500">Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedTransaction.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CardIcon className="w-4 h-4 text-red-500" />
                Payment Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-rose-50">
                  <span className="text-sm text-gray-500">Provider</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    Paystack
                  </span>
                </div>
                {selectedTransaction.provider_tx_ref && (
                  <div className="flex justify-between items-start py-2 border-b border-rose-50">
                    <span className="text-sm text-gray-500">Reference</span>
                    <span className="text-xs font-mono text-gray-900 text-right max-w-[200px] break-all">
                      {selectedTransaction.provider_tx_ref}
                    </span>
                  </div>
                )}
                {selectedTransaction.provider_transaction_id && (
                  <div className="flex justify-between items-start py-2 border-b border-rose-50">
                    <span className="text-sm text-gray-500">Transaction ID</span>
                    <span className="text-xs font-mono text-gray-900">
                      {selectedTransaction.provider_transaction_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/95 backdrop-blur rounded-2xl ring-1 ring-rose-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div className="w-0.5 h-full bg-rose-100"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">Transaction Created</p>
                    <p className="text-xs text-gray-500">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                </div>
                {selectedTransaction.status === 'successful' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedTransaction.updated_at || selectedTransaction.created_at)}</p>
                    </div>
                  </div>
                )}
                {selectedTransaction.status === 'failed' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Failed</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedTransaction.updated_at || selectedTransaction.created_at)}</p>
                    </div>
                  </div>
                )}
                {selectedTransaction.status === 'pending' && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Awaiting Payment</p>
                      <p className="text-xs text-gray-500">In progress...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-rose-100">
              <Button
                variant="outline"
                className="w-full bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white rounded-full shadow-sm"
                onClick={closeDrawer}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
