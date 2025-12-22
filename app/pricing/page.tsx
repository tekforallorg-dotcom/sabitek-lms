'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Loader2 } from 'lucide-react'

const plans = [
  {
    code: 'free',
    name: 'Free',
    price: 0,
    currency: '₦',
    interval: 'forever',
    description: 'Get started with basic learning',
    features: [
      { name: 'All free courses', included: true },
      { name: 'SabiBot AI assistant', included: true },
      { name: 'Progress tracking', included: true },
      { name: 'Course certificates', included: true },
      { name: 'SabiQuiz AI quizzes', included: false },
      { name: 'SabiAdvisor career guidance', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 3000,
    currency: '₦',
    interval: 'month',
    description: 'Unlock all AI-powered features',
    features: [
      { name: 'All free courses', included: true },
      { name: 'SabiBot AI assistant', included: true },
      { name: 'Progress tracking', included: true },
      { name: 'Course certificates', included: true },
      { name: 'SabiQuiz AI quizzes', included: true },
      { name: 'SabiAdvisor career guidance', included: true },
      { name: 'Priority support', included: true },
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (planCode: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing')
      return
    }

    if (planCode === 'free') return

    setLoading(planCode)
    setError(null)

    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      window.location.href = data.authorization_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2 sm:mb-3">
            Choose Your Plan
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Start learning for free or upgrade to Pro for full access to AI-powered tools
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.code}
              className={`relative border-2 ${
                plan.popular ? 'border-red-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-red-500 text-white text-xs font-medium px-2 sm:px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="p-4 sm:p-5 lg:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-lg sm:text-xl text-black">{plan.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-black">
                    {plan.currency}{plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-1">
                    /{plan.interval}
                  </span>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs sm:text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.code)}
                  disabled={loading === plan.code || plan.code === 'free'}
                  className={`w-full text-xs sm:text-sm ${
                    plan.popular
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading === plan.code ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Paid courses require separate purchase regardless of plan.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  )
}