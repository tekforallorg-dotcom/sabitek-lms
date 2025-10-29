import { supabaseAdmin } from './supabase-admin'
import { AuditLogEntry } from '@/types'

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_user_id: entry.actor_user_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        before: entry.before || null,
        after: entry.after || null,
        reason: entry.reason || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
      })

    if (error) {
      console.error('Failed to create audit log:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Audit log error:', error)
    return { success: false, error }
  }
}