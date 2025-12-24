import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { planCode, userId, email } = await request.json()

    // Validate required fields
    if (!userId || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!planCode || planCode === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Verify user exists
    const { data: userExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('code', planCode)
      .eq('status', 'active')
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const txRef = `sabitek_${planCode}_${userId}_${Date.now()}`

    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency,
        provider: 'paystack',
        provider_tx_ref: txRef,
        status: 'pending',
        transaction_type: 'subscription',
      })

    if (txError) {
      console.error('Error creating transaction:', txError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: plan.price * 100,
        currency: plan.currency,
        reference: txRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.school'}/billing/verify`,
        metadata: {
          user_id: userId,
          plan_id: plan.id,
          plan_code: plan.code,
          transaction_type: 'subscription',
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: plan.name,
            },
          ],
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      console.error('Paystack error:', paystackData)
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('provider_tx_ref', txRef)

      return NextResponse.json({ error: paystackData.message || 'Payment initialization failed' }, { status: 400 })
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error('Initialize payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}