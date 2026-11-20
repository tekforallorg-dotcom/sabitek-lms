import { supabase } from '@/lib/supabase'

/**
 * The fields of another user that any signed-in user may see.
 * Deliberately excludes email, phone and every account/permission field.
 */
export interface PublicProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  profile_image_url: string | null
  bio: string | null
  role: string | null
}

/**
 * Look up display details for other users.
 *
 * `public.users` only returns the caller's own row (plus rows an admin or the
 * learner's instructor is entitled to), so the browser cannot read another
 * person's name by selecting from or embedding `users`. Use this instead: it
 * calls the `get_public_profiles` database function, which returns the safe
 * columns only.
 */
export async function fetchPublicProfiles(
  ids: Array<string | null | undefined>
): Promise<Map<string, PublicProfile>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))]
  const profiles = new Map<string, PublicProfile>()
  if (unique.length === 0) return profiles

  const { data, error } = await supabase.rpc('get_public_profiles', { p_ids: unique })

  if (error) {
    console.error('Could not load public profiles:', error.message)
    return profiles
  }

  for (const row of (data || []) as PublicProfile[]) {
    profiles.set(row.id, row)
  }
  return profiles
}
