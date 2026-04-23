import { z } from 'zod'

export const institutionApplicationSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(200),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email').max(255),
  organisation_name: z.string().trim().min(1, 'Organisation name is required').max(300),
  role_title: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  org_type: z.enum(['school', 'ngo', 'government', 'training_center', 'company', 'tutor', 'other']),
  learner_count: z.string().trim().max(50).optional(),
  description: z.string().trim().min(1, 'Please describe what you want to do with Sabitek').max(2000),
})

export type InstitutionApplicationInput = z.infer<typeof institutionApplicationSchema>

export const reviewApplicationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  review_notes: z.string().trim().max(1000).optional(),
  rejection_reason: z.string().trim().max(1000).optional(),
})

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>