import { supabase } from '@/lib/supabase'

/**
 * Browser-side fetch that attaches the signed-in user's access token as
 * `Authorization: Bearer <token>`. API routes identify the caller from this
 * header (see `requireUser` in lib/api-auth.ts), so use it for every call to
 * an authenticated `/api/*` route.
 *
 * When nobody is signed in the request goes out without the header and the
 * route answers 401.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, { ...init, headers })
}
