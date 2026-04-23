import { z } from 'zod'

/**
 * Known platform flag keys. Keeping this as a const union gives us
 * TypeScript auto-complete + refactor safety wherever flags are read.
 *
 * Adding a new flag:
 *   1. Add the key here
 *   2. INSERT it via a new migration (do NOT edit old migrations)
 *   3. Use isFlagEnabled / getFlag from lib/feature-flags.ts
 */
export const PLATFORM_FLAG_KEYS = [
  'public_signup_enabled',
  'waitlist_enabled',
  'provider_apps_enabled',
  'institution_apps_enabled',
  'domain_allowlist_enforced',
  'require_instructor_approval',
] as const

export type PlatformFlagKey = (typeof PLATFORM_FLAG_KEYS)[number]

export const platformFlagKeySchema = z.enum(PLATFORM_FLAG_KEYS)

/**
 * Runtime shape of a settings row returned by Supabase.
 * Kept loose on `value` because JSONB can be boolean|number|object|string.
 */
export const platformSettingRowSchema = z.object({
  key: platformFlagKeySchema,
  value: z.unknown(),
  description: z.string().nullable().optional(),
  is_public: z.boolean(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable().optional(),
})

export type PlatformSettingRow = z.infer<typeof platformSettingRowSchema>