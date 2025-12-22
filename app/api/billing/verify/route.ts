import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('provider_tx_ref', reference)
      .single()

    if (existingTx?.status === 'successful') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed', raw_event: paystackData })
        .eq('provider_tx_ref', reference)

      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    const txData = paystackData.data
    const userId = txData.metadata?.user_id
    const planId = txData.metadata?.plan_id
    const planCode = txData.metadata?.plan_code

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'successful',
        provider_transaction_id: String(txData.id),
        raw_event: paystackData,
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
        provider_transaction_id: String(txData.id),
        provider_customer_id: txData.customer?.customer_code,
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

    console.log(`Subscription activated for user ${userId}, plan ${planCode}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}