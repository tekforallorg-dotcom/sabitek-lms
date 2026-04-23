/**
 * Feature flag reader — server-side only.
 *
 * Usage:
 *   import { isFlagEnabled, getFlag } from '@/lib/feature-flags'
 *
 *   if (await isFlagEnabled('public_signup_enabled')) { ... }
 *
 * Caching:
 *   In-memory, per serverless instance, 30s TTL. Good enough for current scale.
 *   To force-refresh during development, call invalidateFlagCache().
 *   Scale-out plan (post-MVP): swap this file's impl for Upstash Redis; keep the API.
 *
 * Safety:
 *   Never throws. If DB is unreachable or row is missing, returns the documented
 *   FAIL_SAFE_DEFAULTS — which match Model A (restrictive by default).
 */

import { createClient } from '@supabase/supabase-js'
import type { PlatformFlagKey } from '@/lib/validations/platform-flags'

/* ──────────────────────────────────────────────────────────────────────────
 * Fail-safe defaults (used on DB read failure or missing row).
 * Chosen so the *safer* outcome wins when the system can't read config.
 * ────────────────────────────────────────────────────────────────────────── */
const FAIL_SAFE_DEFAULTS: Record<PlatformFlagKey, unknown> = {
  public_signup_enabled:       false, // fail closed → invite-only stays on
  waitlist_enabled:            true,  // fail toward capturing demand
  provider_apps_enabled:       false, // fail closed
  institution_apps_enabled:    true,  // fail toward accepting institutions
  domain_allowlist_enforced:   true,  // fail toward stricter join
  require_instructor_approval: true,  // fail toward manual review
}

const CACHE_TTL_MS = 30_000

type CacheEntry = { value: unknown; fetchedAt: number }
const cache = new Map<PlatformFlagKey, CacheEntry>()

/* ──────────────────────────────────────────────────────────────────────────
 * Internal: lazy Supabase admin client (uses service role — bypasses RLS).
 * Kept local (not imported from supabase-admin.ts) so this module has zero
 * import-cycle risk and can be used very early in request lifecycles.
 * ────────────────────────────────────────────────────────────────────────── */
let _admin: ReturnType<typeof createClient> | null = null
function getAdmin() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // Do not throw — callers expect fail-safe behavior.
    return null
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Read a flag as its raw JSON value (boolean | number | string | object | null).
 * Returns fail-safe default if unreadable.
 */
export async function getFlag<T = unknown>(key: PlatformFlagKey): Promise<T> {
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value as T
  }

  const admin = getAdmin()
  if (!admin) {
    return FAIL_SAFE_DEFAULTS[key] as T
  }

  try {
    const { data, error } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) {
      cache.set(key, { value: FAIL_SAFE_DEFAULTS[key], fetchedAt: now })
      return FAIL_SAFE_DEFAULTS[key] as T
    }

    const row = data as { value: unknown }
    cache.set(key, { value: row.value, fetchedAt: now })
    return row.value as T
  } catch {
    cache.set(key, { value: FAIL_SAFE_DEFAULTS[key], fetchedAt: now })
    return FAIL_SAFE_DEFAULTS[key] as T
  }
}

/**
 * Convenience: coerce a flag to boolean. Any truthy JSONB value → true.
 */
export async function isFlagEnabled(key: PlatformFlagKey): Promise<boolean> {
  const v = await getFlag(key)
  return v === true || v === 'true' || v === 1
}

/**
 * Read all public-safe flags (for GET /api/platform/flags).
 * Only returns rows where is_public = true in DB.
 * Does NOT use the per-key cache — one query, short-cached separately.
 */
let publicCache: { data: Record<string, unknown>; fetchedAt: number } | null = null
export async function getPublicFlags(): Promise<Record<string, unknown>> {
  const now = Date.now()
  if (publicCache && now - publicCache.fetchedAt < CACHE_TTL_MS) {
    return publicCache.data
  }
  const admin = getAdmin()
  if (!admin) return {}
  try {
    const { data, error } = await admin
      .from('platform_settings')
      .select('key, value')
      .eq('is_public', true)
    if (error || !data) return {}
    const out: Record<string, unknown> = {}
    for (const row of data as Array<{ key: string; value: unknown }>) {
      out[row.key] = row.value
    }
    publicCache = { data: out, fetchedAt: now }
    return out
  } catch {
    return {}
  }
}

/**
 * Force-drop all caches. Call from dev/test or after a deliberate flag flip.
 */
export function invalidateFlagCache(): void {
  cache.clear()
  publicCache = null
}