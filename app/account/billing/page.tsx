'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  CreditCard, 
  Crown, 
  Calendar, 
  CheckCircle, 
  Clock,
  Receipt,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface Subscription {
  id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  plan: {
    name: string
    code: string
    price: number
    currency: string
    interval: string
  }
}

interface Transaction {
  id: string
  amount: number
  currency: string
  status: string
  transaction_type: string
  created_at: string
  plan?: {
    name: string
  }
  course?: {
    title: string
  }
}

export default function BillingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchBillingData()
    }
  }, [authLoading, user])

  const fetchBillingData = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plans(name, code, price, currency, interval)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (subData) {
        setSubscription(subData as Subscription)
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          *,
          plan:plans(name),
          course:courses(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setTransactions(txData || [])

    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription || !confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    try {
      setCancelling(true)

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      if (error) throw error

      setSubscription({
        ...subscription,
        cancel_at_period_end: true
      })

      alert('Your subscription will be cancelled at the end of the billing period.')

    } catch (error: any) {
      console.error('Cancel error:', error)
      alert(error.message || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Billing & Subscription
        </h1>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-amber-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {subscription.plan?.name || 'Pro'} Plan
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(subscription.plan?.price || 3000, subscription.plan?.currency)}/{subscription.plan?.interval || 'month'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.cancel_at_period_end ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        Cancels {formatDate(subscription.current_period_end)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Billing Period Started</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(subscription.current_period_start)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Next Billing Date</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>

                {!subscription.cancel_at_period_end && (
                  <div className="pt-4">
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      size="sm"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Free Plan</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upgrade to Pro for AI-powered features
                </p>
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-gray-500" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Your recent payments and purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.status === 'successful' ? 'bg-green-100' : 
                        tx.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                      }`}>
                        {tx.status === 'successful' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : tx.status === 'pending' ? (
                          <Clock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tx.transaction_type === 'subscription' 
                            ? `${tx.plan?.name || 'Pro'} Subscription`
                            : tx.course?.title || 'Course Purchase'
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <p className={`text-xs capitalize ${
                        tx.status === 'successful' ? 'text-green-600' : 
                        tx.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
