import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Fire-and-forget in-app notification (service role). Failures are
 * logged, never thrown - notifications are a courtesy layer.
 */
export function notify(
  userId: string,
  n: { type: 'badge' | 'announcement' | 'cohort' | 'completion' | 'system'; title: string; body?: string; href?: string }
): void {
  supabaseAdmin
    .from('notifications')
    .insert({ user_id: userId, type: n.type, title: n.title, body: n.body ?? null, href: n.href ?? null })
    .then(({ error }) => {
      if (error) console.log('notification skipped:', error.message)
    })
}
