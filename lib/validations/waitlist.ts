import { z } from 'zod'

export const waitlistSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255),
  full_name: z
    .string()
    .trim()
    .max(200)
    .optional(),
  interest: z
    .string()
    .trim()
    .max(1000)
    .optional(),
  source: z
    .string()
    .trim()
    .max(50)
    .optional()
    .default('website'),
})

export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>