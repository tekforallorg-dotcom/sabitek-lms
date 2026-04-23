// ============================================================================
// ITERATION 3: MODULE VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod'

// ============================================================================
// MODULE SCHEMAS
// ============================================================================

export const createModuleSchema = z.object({
  title: z.string()
    .min(2, 'Module title must be at least 2 characters')
    .max(200, 'Module title must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable()
    .transform(v => v || undefined),
})

export const updateModuleSchema = z.object({
  title: z.string()
    .min(2, 'Module title must be at least 2 characters')
    .max(200, 'Module title must be less than 200 characters')
    .optional(),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable()
    .transform(v => v ?? undefined),
  order_index: z.number().int().min(1, 'Order index must be at least 1').optional(),
})

export const reorderModulesSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  module_ids: z.array(z.string().uuid()).min(1, 'At least one module ID required'),
})

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const moduleQuerySchema = z.object({
  course_id: z.string().uuid().optional().nullable().transform(v => v ?? undefined),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateModuleInput = z.infer<typeof createModuleSchema>
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>
export type ModuleQueryInput = z.infer<typeof moduleQuerySchema>