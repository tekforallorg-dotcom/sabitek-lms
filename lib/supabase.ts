import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Singleton instance - prevents multiple GoTrueClient warnings
let supabaseInstance: SupabaseClient | null = null

/**
 * Cookie-based browser client (@supabase/ssr).
 *
 * Sessions previously lived in localStorage ('sabitek-auth'), which the
 * server could never see — middleware and layouts could not verify auth.
 * Cookie storage makes the session visible to middleware.ts, enabling
 * true server-side route guards.
 *
 * MIGRATION NOTE: existing localStorage sessions do not transfer;
 * users sign in once after this deploys.
 */
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'sabitek-lms',
        },
      },
    })
  }
  return supabaseInstance
}

// Export the singleton instance
export const supabase = getSupabaseClient()

// Export function to get instance (for advanced use cases)
export const getSupabase = () => supabaseInstance || getSupabaseClient()
