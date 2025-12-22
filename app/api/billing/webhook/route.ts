import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
      case 'subscription.not_renew':
      case 'subscription.disable':
        await handleSubscriptionUpdate(event.data, event.event)
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

  if (!userId || !planId) {
    console.error('Missing metadata in charge.success')
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

  console.log(`Webhook: Subscription activated for user ${userId}`)
}

async function handleSubscriptionUpdate(data: any, eventType: string) {
  const customerCode = data.customer?.customer_code

  if (!customerCode) return

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id')
    .eq('provider_customer_id', customerCode)
    .single()

  if (!subscription) return

  if (eventType === 'subscription.disable' || eventType === 'subscription.not_renew') {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    console.log(`Subscription cancelled for user ${subscription.user_id}`)
  }
}