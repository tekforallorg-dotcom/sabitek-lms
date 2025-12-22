import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error('Error checking subscription:', error)
    return false
  }

  return !!data
}

export async function hasProSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      id, 
      status, 
      current_period_end,
      plan:plans(code)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('current_period_end', new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error('Error checking pro subscription:', error)
    return false
  }

  const plan = Array.isArray(data?.plan) ? data.plan[0] : data?.plan
  return plan?.code === 'pro'
}

export async function hasEntitlement(userId: string, key: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('entitlements')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  if (error) {
    console.error('Error checking entitlement:', error)
    return false
  }

  if (!data) return false

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false
  }

  return true
}

export async function hasPurchasedCourse(userId: string, courseId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('course_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'successful')
    .maybeSingle()

  if (error) {
    console.error('Error checking course purchase:', error)
    return false
  }

  return !!data
}

export async function canAccessPaidCourse(userId: string, courseId: string): Promise<boolean> {
  const purchased = await hasPurchasedCourse(userId, courseId)
  return purchased
}

export async function canAccessSabiQuiz(userId: string): Promise<boolean> {
  const hasPro = await hasProSubscription(userId)
  if (hasPro) return true

  const hasKey = await hasEntitlement(userId, 'sabiquiz')
  return hasKey
}

export async function canAccessSabiAdvisor(userId: string): Promise<boolean> {
  const hasPro = await hasProSubscription(userId)
  if (hasPro) return true

  const hasKey = await hasEntitlement(userId, 'sabiadvisor')
  return hasKey
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const hasPro = await hasProSubscription(userId)
  return hasPro ? 'pro' : 'free'
}

export async function grantEntitlement(
  userId: string, 
  key: string, 
  source: string,
  expiresAt?: Date
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('entitlements')
    .upsert({
      user_id: userId,
      key,
      value: 'true',
      source,
      expires_at: expiresAt?.toISOString()
    }, {
      onConflict: 'user_id,key'
    })

  if (error) {
    console.error('Error granting entitlement:', error)
    return false
  }

  return true
}

export async function revokeEntitlement(userId: string, key: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('entitlements')
    .delete()
    .eq('user_id', userId)
    .eq('key', key)

  if (error) {
    console.error('Error revoking entitlement:', error)
    return false
  }

  return true
}