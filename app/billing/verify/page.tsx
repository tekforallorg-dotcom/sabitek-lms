'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference found')
      return
    }

    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        setMessage('Your Pro subscription is now active!')
      } else {
        setStatus('failed')
        setMessage(data.error || 'Payment verification failed')
      }
    } catch (error) {
      setStatus('failed')
      setMessage('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 animate-spin mx-auto mb-4" />
            <h1 className="text-lg sm:text-xl font-bold text-black mb-2">Verifying Payment</h1>
            <p className="text-xs sm:text-sm text-gray-600">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-lg sm:text-xl font-bold text-black mb-2">Payment Successful!</h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{message}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg sm:text-xl font-bold text-black mb-2">Payment Failed</h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/pricing')}
                className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/support')}
                variant="outline"
                className="border-gray-300 text-xs sm:text-sm flex-1"
              >
                Get Help
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}