import { NextResponse } from 'next/server'

// ============================================
// STANDARD API RESPONSES
// ============================================

/**
 * Success response with data
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Created response (201)
 */
export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

/**
 * Error response with consistent format
 */
export function apiError(
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * Common error shortcuts
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') => apiError(message, 401),
  forbidden: (message = 'Forbidden') => apiError(message, 403),
  notFound: (message = 'Not found') => apiError(message, 404),
  badRequest: (message: string, details?: Record<string, unknown>) => 
    apiError(message, 400, details),
  internal: (message = 'Internal server error') => apiError(message, 500),
  conflict: (message: string) => apiError(message, 409),
  tooManyRequests: (message = 'Too many requests') => apiError(message, 429),
}