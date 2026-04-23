import { z } from 'zod'
import { uuidSchema, emailSchema } from './index'

// ============================================
// BILLING SCHEMAS
// ============================================

/** Initialize subscription payment */
export const initializePaymentSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required'),
  userId: uuidSchema,
  email: emailSchema,
})

/** Purchase course */
export const purchaseCourseSchema = z.object({
  courseId: uuidSchema,
  userId: uuidSchema,
  email: emailSchema,
})

/** Verify payment */
export const verifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
})

// ============================================
// TYPES (auto-inferred from schemas)
// ============================================

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>
export type PurchaseCourseInput = z.infer<typeof purchaseCourseSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>