import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBody } from '@/lib/validations'
import { initializePaymentSchema } from '@/lib/validations/billing'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body with Zod
    const body = await request.json()
    const validation = validateBody(initializePaymentSchema, body)
    
    if (!validation.success) {
      return validation.error
    }
    
    const { planCode, userId, email } = validation.data

    // 2. Reject free plan
    if (planCode === 'free') {
      return ApiErrors.badRequest('Cannot initialize payment for free plan')
    }

    // 3. Verify user exists
    const { data: userExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!userExists) {
      return ApiErrors.unauthorized('User not found')
    }

    // 4. Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('code', planCode)
      .eq('status', 'active')
      .single()

    if (planError || !plan) {
      return ApiErrors.notFound('Plan not found')
    }

    // 5. Create transaction reference
    const txRef = `sabitek_${planCode}_${userId}_${Date.now()}`

    // 6. Create pending transaction
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
      return ApiErrors.internal('Failed to create transaction')
    }

    // 7. Initialize Paystack payment
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
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

      return ApiErrors.badRequest(paystackData.message || 'Payment initialization failed')
    }

    return apiSuccess({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })

  } catch (error) {
    console.error('Initialize payment error:', error)
    return ApiErrors.internal()
  }
}