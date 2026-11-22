import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { 
  sendSubscriptionReceiptEmail, 
  sendCourseReceiptEmail, 
  sendPaymentFailedEmail 
} from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { creditTopupFromWebhook } from '@/lib/wallet/topup'


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

    const expected = Buffer.from(hash, 'hex')
    const received = Buffer.from(signature, 'hex')
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
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
  const planCode = data.metadata?.plan_code

  // Wallet top-ups: credit them here, from the signed webhook, so the money
  // arrives even if the user closes the tab before the browser gets back to
  // the verify page. Returns not_found when this payment is not a top-up.
  const topup = await creditTopupFromWebhook({
    reference,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    channel: data.channel,
    paid_at: data.paid_at,
    metadata: data.metadata,
  })
  if (topup.outcome !== 'not_found') {
    if (topup.outcome === 'credit_failed' || topup.outcome === 'mismatch') {
      // Throwing makes the webhook answer 500, so Paystack retries it.
      throw new Error(`Wallet top-up ${reference} was not credited: ${topup.outcome}`)
    }
    console.log('Wallet top-up webhook:', reference, topup.outcome)
    return
  }

  // Only fulfil a payment this app started, for the person and the item
  // recorded when it started. Paystack signs every charge on the account, and
  // the metadata on a charge is whatever the payer's browser sent, so the
  // metadata alone must never decide who gets what.
  const { data: tx } = await supabaseAdmin
    .from('transactions')
    .select('id, user_id, amount, currency, status, transaction_type, plan_id, course_id')
    .eq('provider_tx_ref', reference)
    .maybeSingle()

  if (!tx || !tx.user_id) {
    console.error('charge.success for a reference this app did not create, ignored:', reference)
    return
  }

  if (tx.status === 'successful') {
    console.log('Transaction already processed:', reference)
    return
  }

  // What was paid must match what we asked for.
  const expectedKobo = Math.round(Number(tx.amount) * 100)
  const expectedCurrency = tx.currency || 'NGN'
  if (data.amount !== expectedKobo || (data.currency || 'NGN') !== expectedCurrency) {
    console.error('Webhook payment amount mismatch, not fulfilled', {
      reference,
      expectedKobo,
      paidKobo: data.amount,
      expectedCurrency,
      paidCurrency: data.currency,
    })
    return
  }

  const userId: string = tx.user_id
  const transactionType: string = tx.transaction_type || 'subscription'
  const courseId: string | null = tx.course_id
  const planId: string | null = tx.plan_id

  // Claim in one statement, as /api/billing/verify does. Only the request
  // that flips the row goes on to fulfil, so the two cannot both grant.
  const { data: claimed } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'successful',
      provider_transaction_id: String(data.id),
      raw_event: data,
    })
    .eq('provider_tx_ref', reference)
    .neq('status', 'successful')
    .select('id')

  if (!claimed || claimed.length === 0) {
    console.log('Transaction already processed:', reference)
    return
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  try {
    if (transactionType === 'course_purchase' && courseId) {
      await handleCoursePurchase(data, userId, courseId, reference, user)
    } else if (planId) {
      await handleSubscriptionPurchase(data, userId, planId, planCode, reference, user)
    }
  } catch (error) {
    // Give the claim back and answer 500 so Paystack sends the event again.
    await supabaseAdmin
      .from('transactions')
      .update({ status: tx.status })
      .eq('provider_tx_ref', reference)
    throw error
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
  // Upsert, not insert: a retry after a purchase was recorded but the
  // enrolment failed must carry on and enrol, not stop at "already purchased".
  const { error: purchaseError } = await supabaseAdmin
    .from('course_purchases')
    .upsert({
      user_id: userId,
      course_id: courseId,
      provider: 'paystack',
      provider_tx_ref: reference,
      provider_transaction_id: String(data.id),
      amount: data.amount / 100,
      currency: data.currency || 'NGN',
      status: 'successful',
      purchased_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id',
    })
  if (purchaseError) {
    throw new Error(`Course purchase ${reference} was not recorded: ${purchaseError.message}`)
  }

  const { error: enrolmentError } = await supabaseAdmin
    .from('course_enrollments')
    .upsert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id',
    })
  if (enrolmentError) {
    throw new Error(`Enrolment for purchase ${reference} failed: ${enrolmentError.message}`)
  }

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
