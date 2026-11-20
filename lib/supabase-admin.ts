import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase admin environment variables. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local'
  )
}

/**
 * THE service-role client for server code. It bypasses row level security, so
 * every route that uses it must first establish who is calling (see
 * `requireUser` in lib/api-auth.ts) and check what they are allowed to do.
 *
 * Import this instead of calling createClient() with the service-role key in
 * each route.
 *
 * Never call a session-changing auth method on it (verifyOtp, signInWith*,
 * signUp, setSession, exchangeCodeForSession, updateUser). Those attach a user
 * session to the client they are called on, and every later query on this
 * shared instance would then run as that user. Routes that need them build
 * their own throwaway client: see app/api/auth/verify-reset/route.ts and
 * app/auth/confirm/route.ts. `auth.getUser(token)` and `auth.admin.*` are fine.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * The same client without database types. Only for areas scheduled for removal
 * or rebuild, where fixing every query to match the schema is not worth it.
 * New code must use `supabaseAdmin`.
 */
export const supabaseAdminUntyped = supabaseAdmin as unknown as SupabaseClient
