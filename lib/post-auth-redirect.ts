/**
 * Where to send someone after they sign in.
 *
 * Pages that need an account send people to `/auth/login?redirect=/where/they/were`.
 * Sign-in used to ignore that and always go to the role's home page, so a
 * learner who opened a cohort invite link, signed in, and landed on their
 * dashboard had lost the invite.
 *
 * The path is kept in localStorage rather than passed along in the address,
 * because a new account confirms its email in a fresh tab and the address is
 * gone by then. It expires after a day and is used once.
 */

const KEY = 'sabitek:return-to'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * A path on this site that is safe to navigate to, or null.
 * Rejects other sites (`https://…`, `//host`), odd characters, and the auth
 * pages themselves (which would loop).
 */
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.length > 500) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  if (/[\\\s]/.test(value)) return null
  if (value === '/auth' || value.startsWith('/auth/')) return null
  return value
}

/** Remember where to return to after sign-in. Ignores unsafe values. */
export function rememberReturnPath(value: string | null | undefined): void {
  const path = safeReturnPath(value)
  if (!path) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }))
  } catch {
    // Storage can be unavailable (private mode); the person lands on their home page.
  }
}

/** The remembered path, if there is a fresh one. Reading it clears it. */
export function takeReturnPath(now: number = Date.now()): string | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    window.localStorage.removeItem(KEY)
    const saved = JSON.parse(raw) as { path?: unknown; at?: unknown }
    if (typeof saved.path !== 'string' || typeof saved.at !== 'number') return null
    if (now - saved.at > MAX_AGE_MS) return null
    return safeReturnPath(saved.path)
  } catch {
    return null
  }
}
