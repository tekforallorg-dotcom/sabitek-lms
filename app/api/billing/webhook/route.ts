import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { 
  sendSubscriptionReceiptEmail, 
  sendCourseReceiptEmail, 
  sendPaymentFailedEmail 
} from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event)

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'subscription.create':
        await handleSubscriptionCreate(event.data)
        break

      case 'subscription.not_renew':
      case 'subscription.disable':
        await handleSubscriptionCancel(event.data, event.event)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data)
        break

      default:
        console.log('Unhandled event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference
  const userId = data.metadata?.user_id
  const planId = data.metadata?.plan_id
  const planCode = data.metadata?.plan_code
  const transactionType = data.metadata?.transaction_type || 'subscription'
  const courseId = data.metadata?.course_id

  if (!userId) {
    console.error('Missing user_id in charge.success metadata')
    return
  }

  const { data: existingTx } = await supabaseAdmin
    .from('transactions')
    .select('status')
    .eq('provider_tx_ref', reference)
    .single()

  if (existingTx?.status === 'successful') {
    console.log('Transaction already processed:', reference)
    return
  }

  await supabaseAdmin
    .from('transactions')
    .update({
      status: 'successful',
      provider_transaction_id: String(data.id),
      raw_event: data,
    })
    .eq('provider_tx_ref', reference)

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  if (transactionType === 'course_purchase' && courseId) {
    await handleCoursePurchase(data, userId, courseId, reference, user)
  } else if (planId) {
    await handleSubscriptionPurchase(data, userId, planId, planCode, reference, user)
  }
}

async function handleSubscriptionPurchase(
  data: any, 
  userId: string, 
  planId: string, 
  planCode: string,
  reference: string,
  user: any
) {
  const periodStart = new Date()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      provider: 'paystack',
      provider_transaction_id: String(data.id),
      provider_customer_id: data.customer?.customer_code,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (planCode === 'pro') {
    const entitlements = ['sabiquiz', 'sabiadvisor', 'priority_support', 'pro_features']
    
    for (const key of entitlements) {
      await supabaseAdmin
        .from('entitlements')
        .upsert({
          user_id: userId,
          key,
          value: 'true',
          source: 'subscription',
          expires_at: periodEnd.toISOString(),
        }, {
          onConflict: 'user_id,key',
        })
    }
  }

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('name, price, currency')
    .eq('id', planId)
    .single()

  if (user?.email) {
    await sendSubscriptionReceiptEmail({
      to: user.email,
      userName: user.full_name || 'Learner',
      planName: plan?.name || 'Pro',
      amount: plan?.price || data.amount / 100,
      currency: plan?.currency || 'NGN',
      transactionRef: reference,
      billingPeriodEnd: periodEnd,
    })
  }

  console.log('Webhook: Subscription activated for user', userId)
}

async function handleCoursePurchase(
  data: any,
  userId: string,
  courseId: string,
  reference: string,
  user: any
) {
  const { data: existingPurchase } = await supabaseAdmin
    .from('course_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (existingPurchase) {
    console.log('Course already purchased:', courseId)
    return
  }

  await supabaseAdmin
    .from('course_purchases')
    .insert({
      user_id: userId,
      course_id: courseId,
      transaction_id: reference,
      amount: data.amount / 100,
      currency: data.currency || 'NGN',
      status: 'successful',
    })

  await supabaseAdmin
    .from('course_enrollments')
    .upsert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id',
    })

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('title, slug, price, currency')
    .eq('id', courseId)
    .single()

  if (user?.email && course) {
    await sendCourseReceiptEmail({
      to: user.email,
      userName: user.full_name || 'Learner',
      courseName: course.title,
      amount: course.price || data.amount / 100,
      currency: course.currency || 'NGN',
      transactionRef: reference,
      courseSlug: course.slug,
    })
  }

  console.log('Webhook: Course purchased by user', userId)
}

async function handleSubscriptionCreate(data: any) {
  const customerCode = data.customer?.customer_code
  const subscriptionCode = data.subscription_code

  if (!customerCode) return

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('provider_customer_id', customerCode)
    .single()

  if (subscription) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        provider_subscription_id: subscriptionCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    console.log('Subscription code updated for user', subscription.user_id)
  }
}

async function handleSubscriptionCancel(data: any, eventType: string) {
  const customerCode = data.customer?.customer_code

  if (!customerCode) return

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('provider_customer_id', customerCode)
    .single()

  if (!subscription) return

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  console.log('Subscription cancelled for user', subscription.user_id)
}

async function handlePaymentFailed(data: any) {
  const customerCode = data.customer?.customer_code

  if (!customerCode) return

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, plan_id')
    .eq('provider_customer_id', customerCode)
    .single()

  if (!subscription) return

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, full_name')
    .eq('id', subscription.user_id)
    .single()

  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('name, price, currency')
    .eq('id', subscription.plan_id)
    .single()

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: subscription.user_id,
      plan_id: subscription.plan_id,
      amount: plan?.price || data.amount / 100,
      currency: plan?.currency || 'NGN',
      provider: 'paystack',
      provider_tx_ref: 'failed_' + Date.now(),
      status: 'failed',
      transaction_type: 'subscription_renewal',
      raw_event: data,
    })

  if (user?.email && plan) {
    await sendPaymentFailedEmail({
      to: user.email,
      userName: user.full_name || 'Learner',
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
    })
  }

  console.log('Payment failed for user', subscription.user_id)
}
