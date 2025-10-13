import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware ensures auth cookies are properly handled
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Allow Supabase auth to work properly
  response.headers.set('x-middleware-cache', 'no-cache')
  
  return response
}

// Only apply to routes that need authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/instructor/:path*',
    '/courses/:path*',
    '/api/:path*',
  ]
}