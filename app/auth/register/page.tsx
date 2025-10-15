'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['learner', 'instructor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
} as const)

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const { signUp } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'learner',
    },
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    const result = await signUp(data.email, data.password, data.fullName, data.role)
    
    if (result.error) {
      setError(result.error.message)
      setIsLoading(false)
    } else if (result.needsVerification) {
      // Email verification required - show success screen
      setRegisteredEmail(data.email)
      setIsLoading(false)
    } else {
      // No verification needed - user will be auto-redirected by useAuth
      setIsLoading(false)
    }
  }

  // Show verification success screen
 // Show verification success screen
if (registeredEmail) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-black">Check Your Email</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              We've sent a verification link to
            </CardDescription>
            <p className="text-black font-semibold mt-1">{registeredEmail}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-3">Next steps:</p>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check your inbox for the verification email</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Sign in to start learning</span>
                </li>
              </ul>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <Link href="/auth/login" className="block">
              <Button className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-medium">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="mailto:support@sabitek.store" className="text-red-500 hover:text-red-600">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

  // Show registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-8">
      {/* Register Form Content */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1 justify-center">
              <span className="text-4xl font-bold text-black">Sabitek</span>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-0.5 mb-6"></div>
            </Link>
            <p className="text-gray-600 mt-2">Start your learning journey today</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-black">Create Account</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign up to access world-class education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    {...register('fullName')}
                    placeholder="John Doe"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    I want to
                  </label>
                  <select
                    {...register('role')}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500 bg-white"
                  >
                    <option value="learner">Learn (Student)</option>
                    <option value="instructor">Teach (Instructor)</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="Create a strong password"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="Confirm your password"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="ml-2">Creating account...</span>
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-red-500 hover:text-red-600 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-red-500 hover:text-red-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-red-500 hover:text-red-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}