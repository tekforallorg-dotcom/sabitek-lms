import { Suspense } from 'react'
import BillingClient from './BillingClient'

function BillingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<BillingFallback />}>
      <BillingClient />
    </Suspense>
  )
}