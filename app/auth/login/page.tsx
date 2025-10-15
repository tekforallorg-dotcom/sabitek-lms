'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!loading && user && userProfile) {
      if (userProfile.role === 'instructor') {
        router.push('/instructor')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, userProfile, loading, router])

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        setIsSubmitting(false)
        return
      }

      if (!authData.user) {
        setError('Login failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setError('Failed to load user profile')
        setIsSubmitting(false)
        return
      }

      // Redirect based on role
      if (profile.role === 'instructor') {
        router.push('/instructor')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your Sabitek account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-red-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-red-500 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}