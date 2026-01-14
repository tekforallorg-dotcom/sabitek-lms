'use client'

import { useState } from 'react'
import { 
  X, 
  Wallet, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { supabase } from '@/lib/supabase'

interface Course {
  id: string
  title: string
  price: number
  currency?: string
}

interface PurchaseCourseModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course
  onSuccess: () => void
}

export function PurchaseCourseModal({
  isOpen,
  onClose,
  course,
  onSuccess
}: PurchaseCourseModalProps) {
  const { balance, refreshBalance } = useWallet()
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const priceKobo = Math.round(course.price * 100)
  const canAfford = (balance?.balanceKobo || 0) >= priceKobo
  const shortfall = canAfford ? 0 : priceKobo - (balance?.balanceKobo || 0)

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  const handleWalletPurchase = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Please log in to continue')
        return
      }

      const response = await fetch('/api/wallet/purchase-course', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: course.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed')
      }

      // Refresh wallet balance
      await refreshBalance()
      
      setSuccess(true)
      
      // Call onSuccess after a short delay to show success state
      setTimeout(() => {
        onSuccess()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackPurchase = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please log in to continue')
        return
      }

      const response = await fetch('/api/billing/purchase-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          courseId: course.id,
          email: session.user.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setIsProcessing(false)
    }
  }

  const handlePurchase = () => {
    if (paymentMethod === 'wallet') {
      handleWalletPurchase()
    } else if (paymentMethod === 'paystack') {
      handlePaystackPurchase()
    }
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Purchase Successful!</h2>
          <p className="text-gray-600 mb-4">You now have access to this course.</p>
          <p className="text-sm text-gray-500">Redirecting to course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Purchase Course</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
            <p className="text-2xl font-bold text-gray-900">
              ₦{course.price.toLocaleString()}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Choose payment method</p>
            
            {/* Wallet Option */}
            <button
              onClick={() => setPaymentMethod('wallet')}
              disabled={isProcessing}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                paymentMethod === 'wallet'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'wallet' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Wallet className={`w-5 h-5 ${
                      paymentMethod === 'wallet' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pay with Wallet</p>
                    <p className="text-sm text-gray-500">
                      Balance: {balance?.balanceFormatted || '₦0'}
                    </p>
                  </div>
                </div>
                {paymentMethod === 'wallet' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              {/* Insufficient balance warning */}
              {!canAfford && (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Need {formatNaira(shortfall)} more. Top up first.</span>
                </div>
              )}
            </button>

            {/* Paystack Option */}
            <button
              onClick={() => setPaymentMethod('paystack')}
              disabled={isProcessing}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                paymentMethod === 'paystack'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'paystack' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <CreditCard className={`w-5 h-5 ${
                      paymentMethod === 'paystack' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pay with Card</p>
                    <p className="text-sm text-gray-500">Card, Bank Transfer, USSD</p>
                  </div>
                </div>
                {paymentMethod === 'paystack' && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePurchase}
            disabled={!paymentMethod || isProcessing || (paymentMethod === 'wallet' && !canAfford)}
            className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === 'wallet' && !canAfford ? (
              'Insufficient Balance'
            ) : (
              <>
                Complete Purchase
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          {paymentMethod === 'wallet' && !canAfford && (
            <button
              onClick={() => window.location.href = '/account/wallet'}
              className="w-full mt-2 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Top Up Wallet →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}