'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import SabiLoader from '@/components/ui/SabiLoader'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
        <SabiLoader text="Loading..." size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Email Confirmed!</CardTitle>
            <CardDescription className="mt-2">
              {user?.email && (
                <>
                  Your email <span className="font-semibold">{user.email}</span> has been successfully verified.
                </>
              )}
              {!user?.email && (
                <>Your email has been successfully verified.</>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              You can now access all features of your Sabitek account.
            </p>
          </div>

          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>

          <Link href="/courses" className="block">
            <Button variant="outline" className="w-full">
              Browse Courses
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
