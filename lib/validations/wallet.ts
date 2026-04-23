import { z } from 'zod'
import { uuidSchema } from './index'

// ============================================
// WALLET CONSTANTS
// ============================================

export const WALLET_LIMITS = {
  MIN_TOPUP_KOBO: 10000,      // ₦100
  MAX_TOPUP_KOBO: 10000000,   // ₦100,000
} as const

// ============================================
// WALLET SCHEMAS
// ============================================

/** Wallet top-up request */
export const topupSchema = z.object({
  amount_kobo: z
    .number()
    .int('Amount must be a whole number')
    .min(WALLET_LIMITS.MIN_TOPUP_KOBO, `Minimum top-up is ₦${WALLET_LIMITS.MIN_TOPUP_KOBO / 100}`)
    .max(WALLET_LIMITS.MAX_TOPUP_KOBO, `Maximum top-up is ₦${WALLET_LIMITS.MAX_TOPUP_KOBO / 100}`),
  callback_url: z.string().url().optional(),
})

/** Wallet purchase (debit) */
export const walletPurchaseSchema = z.object({
  courseId: uuidSchema,
})

/** Wallet transaction query */
export const walletTransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['credit', 'debit', 'all']).default('all'),
  service: z.string().optional(),
})

// ============================================
// TYPES
// ============================================

export type TopupInput = z.infer<typeof topupSchema>
export type WalletPurchaseInput = z.infer<typeof walletPurchaseSchema>
export type WalletTransactionQuery = z.infer<typeof walletTransactionQuerySchema>