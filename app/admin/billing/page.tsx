'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  CreditCard, 
  Crown, 
  Users,
  TrendingUp,
  CheckCircle, 
  Clock,
  Receipt,
  AlertCircle,
  Loader2,
  Search,
  Gift
} from 'lucide-react'

interface Stats {
  totalRevenue: number
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
  created_at: string
  user?: {
    email: string
    full_name: string
  }
  plan?: {
    name: string
  }
  course?: {
    title: string
  }
}

export default function AdminBillingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalTransactions: 0,
    coursePurchases: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [grantEmail, setGrantEmail] = useState('')
  const [granting, setGranting] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndFetch()
    }
  }, [authLoading, user])

  const checkAdminAndFetch = async () => {
    if (!user) return

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchBillingData()
  }

  const fetchBillingData = async () => {
    try {
      setLoading(true)

      // Get total revenue (successful transactions)
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'successful')

      const totalRevenue = revenueData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

      // Get active subscriptions count
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get total transactions
      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })

      // Get course purchases count
      const { count: coursePurchases } = await supabase
        .from('course_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'successful')

      setStats({
        totalRevenue,
        activeSubscriptions: activeSubscriptions || 0,
        totalTransactions: totalTransactions || 0,
        coursePurchases: coursePurchases || 0
      })

      // Fetch recent transactions with user info
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          *,
          user:users(email, full_name),
          plan:plans(name),
          course:courses(title)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(txData || [])

    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantPro = async () => {
    if (!grantEmail.trim()) {
      alert('Please enter an email address')
      return
    }

    try {
      setGranting(true)

      // Find user by email
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', grantEmail.trim().toLowerCase())
        .single()

      if (userError || !targetUser) {
        alert('User not found with that email')
        return
      }

      // Get Pro plan
      const { data: proPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'pro')
        .single()

      if (!proPlan) {
        alert('Pro plan not found')
        return
      }

      const periodEnd = new Date()
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)

      // Create subscription
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

      // Grant entitlements
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

      alert(`Pro access granted to ${grantEmail} for 1 year!`)
      setGrantEmail('')
      fetchBillingData()

    } catch (error: any) {
      console.error('Grant error:', error)
      alert(error.message || 'Failed to grant Pro access')
    } finally {
      setGranting(false)
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
    return `₦${amount.toLocaleString()}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading billing dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Billing Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Pro</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {stats.activeSubscriptions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {stats.totalTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Course Sales</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {stats.coursePurchases}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grant Pro Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-amber-500" />
              Grant Pro Access
            </CardTitle>
            <CardDescription>
              Manually grant Pro subscription to a user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter user email..."
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleGrantPro}
                disabled={granting || !grantEmail.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
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
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-gray-500" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">User</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Type</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {tx.user?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                              {tx.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
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
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(tx.amount)}
                          </p>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'successful' ? 'bg-green-100 text-green-700' : 
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
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
                        <td className="py-3">
                          <p className="text-xs text-gray-500">
                            {formatDate(tx.created_at)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}