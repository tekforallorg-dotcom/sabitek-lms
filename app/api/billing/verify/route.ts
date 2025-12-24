
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

    // Check if already processed
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('provider_tx_ref', reference)
      .single()

    if (existingTx?.status === 'successful') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Verify with Paystack
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
    const transactionType = txData.metadata?.transaction_type || 'subscription'

    if (!userId) {
      return NextResponse.json({ error: 'Invalid metadata: missing user_id' }, { status: 400 })
    }

    // Update transaction as successful
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'successful',
        provider_transaction_id: String(txData.id),
        raw_event: paystackData,
      })
      .eq('provider_tx_ref', reference)

    // Handle based on transaction type
    if (transactionType === 'course_purchase') {
      // Course purchase flow
      const courseId = txData.metadata?.course_id

      if (!courseId) {
        return NextResponse.json({ error: 'Invalid metadata: missing course_id' }, { status: 400 })
      }

      // Create course purchase record
      await supabaseAdmin
        .from('course_purchases')
        .upsert({
          user_id: userId,
          course_id: courseId,
          amount: txData.amount / 100, // Convert from kobo
          currency: txData.currency || 'NGN',
          provider: 'paystack',
          provider_tx_ref: reference,
          provider_transaction_id: String(txData.id),
          status: 'successful',
          purchased_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,course_id',
        })

      // Auto-enroll user in the course
      const { data: existingEnrollment } = await supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (!existingEnrollment) {
        await supabaseAdmin
          .from('course_enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
          })
      }

      console.log(`Course ${courseId} purchased by user ${userId}`)

      return NextResponse.json({ 
        success: true, 
        type: 'course_purchase',
        courseId 
      })

    } else {
      // Subscription flow
      const planId = txData.metadata?.plan_id
      const planCode = txData.metadata?.plan_code

      if (!planId) {
        return NextResponse.json({ error: 'Invalid metadata: missing plan_id' }, { status: 400 })
      }

      const periodStart = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      // Create/update subscription
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

      // Grant entitlements for Pro plan
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

      return NextResponse.json({ 
        success: true, 
        type: 'subscription' 
      })
    }

  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}