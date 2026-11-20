import { createClient } from '@supabase/supabase-js'

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
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
