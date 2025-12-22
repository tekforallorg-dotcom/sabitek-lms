export type PlanCode = 'free' | 'pro'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'

export type TransactionStatus = 'pending' | 'successful' | 'failed' | 'refunded'

export type TransactionType = 'subscription' | 'course_purchase'

export interface Plan {
  id: string
  code: PlanCode
  name: string
  price: number
  currency: string
  interval: string
  status: string
  features: string[]
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  provider: string
  provider_subscription_id?: string
  provider_customer_id?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  plan?: Plan
}

export interface Transaction {
  id: string
  user_id: string
  plan_id?: string
  course_id?: string
  amount: number
  currency: string
  provider: string
  provider_tx_ref?: string
  provider_transaction_id?: string
  status: TransactionStatus
  transaction_type: TransactionType
  raw_event?: Record<string, unknown>
  created_at: string
}

export interface Entitlement {
  id: string
  user_id: string
  key: string
  value: string
  source: string
  expires_at?: string
  created_at: string
}

export interface CoursePurchase {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  provider: string
  provider_tx_ref?: string
  provider_transaction_id?: string
  status: TransactionStatus
  purchased_at?: string
  created_at: string
}

export type EntitlementKey = 
  | 'sabiquiz'
  | 'sabiadvisor'
  | 'priority_support'
  | 'pro_features'