'use client'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold">
              <span className="text-black">Sabitek</span>
            </h1>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-black">Check Your Email</CardTitle>
            <CardDescription className="text-gray-600">
              We've sent a verification link to{' '}
              <strong className="text-black">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Next steps:
              </p>
              <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                <li>Check your inbox for the verification email</li>
                <li>Click the verification link in the email</li>
                <li>You'll be redirected to login</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The link expires in 24 hours
              </p>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Didn't receive the email? Check your spam folder.
            </p>

            <Link href="/auth/login" className="block">
              <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-medium">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Having trouble?{' '}
          <Link href="/support" className="text-red-500 hover:text-red-600">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}