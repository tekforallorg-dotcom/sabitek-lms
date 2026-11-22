
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'


export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    // The reference must be one this app created in /api/billing/initialize or
    // /api/billing/purchase-course. Wallet top-ups and anything else are not
    // ours to fulfil here.
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id, user_id, amount, currency, status, transaction_type, plan_id, course_id')
      .eq('provider_tx_ref', reference)
      .maybeSingle()

    if (!existingTx) {
      return NextResponse.json({ error: 'Unknown payment reference' }, { status: 404 })
    }

    if (existingTx.status === 'successful') {
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

    // What was paid must match what we asked for.
    const expectedKobo = Math.round(Number(existingTx.amount) * 100)
    const expectedCurrency = existingTx.currency || 'NGN'
    if (txData.amount !== expectedKobo || (txData.currency || 'NGN') !== expectedCurrency) {
      console.error('Payment amount mismatch', {
        reference,
        expectedKobo,
        paidKobo: txData.amount,
        expectedCurrency,
        paidCurrency: txData.currency,
      })
      return NextResponse.json({ error: 'Payment amount does not match the order' }, { status: 400 })
    }

    // Fulfil for the user who started the transaction, as recorded by us.
    const userId: string = existingTx.user_id
    const transactionType: string = existingTx.transaction_type || 'subscription'

    // Claim the transaction in a single statement. Only the request that flips
    // it to successful goes on to fulfil, so a replay or a race with the
    // webhook cannot grant twice.
    const { data: claimed } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'successful',
        provider_transaction_id: String(txData.id),
        raw_event: paystackData,
      })
      .eq('provider_tx_ref', reference)
      .neq('status', 'successful')
      .select('id')

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Handle based on transaction type
    if (transactionType === 'course_purchase') {
      // Course purchase flow
      const courseId = existingTx.course_id || txData.metadata?.course_id

      if (!courseId) {
        return NextResponse.json({ error: 'Invalid metadata: missing course_id' }, { status: 400 })
      }

      // Create course purchase record
      const { error: purchaseError } = await supabaseAdmin
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
      let enrolmentError: { message: string } | null = null
      if (!purchaseError) {
        const { data: existingEnrollment } = await supabaseAdmin
          .from('course_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle()

        if (!existingEnrollment) {
          const { error } = await supabaseAdmin
            .from('course_enrollments')
            .insert({
              user_id: userId,
              course_id: courseId,
              enrolled_at: new Date().toISOString(),
              progress_percentage: 0,
            })
          enrolmentError = error
        }
      }

      if (purchaseError || enrolmentError) {
        // The money is in but the course is not unlocked. Give the claim back
        // so the next call here, or the webhook, fulfils it. Leaving the
        // transaction "successful" would make every retry stop at
        // "Already processed" with the customer still locked out.
        await supabaseAdmin
          .from('transactions')
          .update({ status: existingTx.status })
          .eq('provider_tx_ref', reference)
        console.error('Course purchase fulfilment failed after payment', {
          reference,
          userId,
          courseId,
          error: (purchaseError || enrolmentError)?.message,
        })
        return NextResponse.json(
          { error: 'Payment received, but the course could not be unlocked yet. Refresh this page in a moment. If it keeps happening, contact support.' },
          { status: 500 }
        )
      }

      console.log(`Course ${courseId} purchased by user ${userId}`)

      return NextResponse.json({ 
        success: true, 
        type: 'course_purchase',
        courseId 
      })

    } else {
      // Subscription flow
      const planId = existingTx.plan_id || txData.metadata?.plan_id
      const planCode = txData.metadata?.plan_code

      if (!planId) {
        return NextResponse.json({ error: 'Invalid metadata: missing plan_id' }, { status: 400 })
      }

      const periodStart = new Date()
      const periodEnd = new Date()
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      // Create/update subscription
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          provider: 'paystack',
          provider_customer_id: txData.customer?.customer_code,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      if (subscriptionError) {
        // The payment is real and already claimed; say so plainly rather than
        // reporting success with no subscription behind it.
        console.error('Subscription activation failed after payment', {
          reference,
          userId,
          error: subscriptionError.message,
        })
        return NextResponse.json(
          { error: 'Payment received but the subscription could not be activated. Please contact support.' },
          { status: 500 }
        )
      }

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