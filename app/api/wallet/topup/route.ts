import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatNaira } from '@/lib/wallet'
import { validateBody, extractBearerToken } from '@/lib/validations'
import { topupSchema, WALLET_LIMITS } from '@/lib/validations/wallet'
import { apiSuccess, ApiErrors } from '@/lib/api-response'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.school'

// Preset amounts for quick selection (in kobo)
const TOPUP_PRESETS = [
  { kobo: 50000, label: '₦500' },
  { kobo: 100000, label: '₦1,000' },
  { kobo: 200000, label: '₦2,000' },
  { kobo: 500000, label: '₦5,000' },
  { kobo: 1000000, label: '₦10,000' },
]

/**
 * POST /api/wallet/topup
 * Initialize Paystack payment for wallet top-up
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return ApiErrors.unauthorized()
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return ApiErrors.unauthorized()
    }

    // 2. Validate request body with Zod
    const body = await request.json()
    const validation = validateBody(topupSchema, body)
    
    if (!validation.success) {
      return validation.error
    }
    
    const { amount_kobo, callback_url } = validation.data

    // 3. Get user email
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const email = userProfile?.email || user.email
    if (!email) {
      return ApiErrors.badRequest('User email not found')
    }

    // 4. Generate unique reference
    const reference = `sabitek_topup_${user.id.slice(0, 8)}_${Date.now()}`

    // 5. Create pending transaction record
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'credit',
        amount_kobo,
        reference,
        description: 'Wallet top-up via Paystack',
        status: 'pending',
        service: 'general',
        metadata: {
          callback_url: callback_url || `${APP_URL}/account/wallet?verify=true`
        }
      })

    if (txError) {
      console.error('Transaction insert error:', txError)
      // Continue anyway - we can reconcile later
    }

    // 6. Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount_kobo,
        currency: 'NGN',
        reference,
        callback_url: callback_url || `${APP_URL}/account/wallet?verify=true`,
        metadata: {
          user_id: user.id,
          transaction_type: 'wallet_topup',
          custom_fields: [
            {
              display_name: 'Purpose',
              variable_name: 'purpose',
              value: 'SabiTek Wallet Top-up',
            },
            {
              display_name: 'Amount',
              variable_name: 'amount',
              value: formatNaira(amount_kobo),
            },
          ],
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('Paystack error:', paystackData)

      // Update transaction to failed
      await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('reference', reference)

      return ApiErrors.badRequest(paystackData.message || 'Payment initialization failed')
    }

    return apiSuccess({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })

  } catch (error) {
    console.error('Topup API error:', error)
    return ApiErrors.internal()
  }
}

/**
 * GET /api/wallet/topup
 * Get top-up presets and limits
 */
export async function GET() {
  return apiSuccess({
    presets: TOPUP_PRESETS,
    limits: {
      min_kobo: WALLET_LIMITS.MIN_TOPUP_KOBO,
      max_kobo: WALLET_LIMITS.MAX_TOPUP_KOBO,
      min_formatted: formatNaira(WALLET_LIMITS.MIN_TOPUP_KOBO),
      max_formatted: formatNaira(WALLET_LIMITS.MAX_TOPUP_KOBO),
    }
  })
}