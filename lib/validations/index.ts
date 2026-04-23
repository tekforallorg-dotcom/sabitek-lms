import { z } from 'zod'
import { NextResponse } from 'next/server'

// ============================================
// COMMON SCHEMAS
// ============================================

/** UUID v4 validation */
export const uuidSchema = z.string().uuid('Invalid ID format')

/** Email validation */
export const emailSchema = z.string().email('Invalid email format')

/** Non-empty string */
export const nonEmptyString = z.string().min(1, 'This field is required')

/** Positive integer */
export const positiveInt = z.number().int().positive()

/** Kobo amount (Nigerian currency in smallest unit) */
export const koboAmountSchema = z.number().int().min(100, 'Amount must be at least ₦1')

/** Pagination params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/** Sort order */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

// ============================================
// VALIDATION HELPER
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: NextResponse }

/**
 * Validate request body against a Zod schema
 * Returns typed data or a NextResponse error
 */
export function validateBody<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.flatten()
    const firstError = Object.values(errors.fieldErrors)[0]?.[0] 
      || errors.formErrors[0] 
      || 'Validation failed'
    
    return {
      success: false,
      error: NextResponse.json(
        { 
          error: firstError,
          details: errors.fieldErrors 
        },
        { status: 400 }
      ),
    }
  }
  
  return { success: true, data: result.data }
}

/**
 * Validate query params against a Zod schema
 */
export function validateQuery<T extends z.ZodSchema>(
  schema: T,
  searchParams: URLSearchParams
): ValidationResult<z.infer<T>> {
  const params = Object.fromEntries(searchParams.entries())
  return validateBody(schema, params)
}

// ============================================
// AUTH HEADER HELPER
// ============================================

/**
 * Extract bearer token from authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}