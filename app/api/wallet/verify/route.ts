import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { creditWallet, formatNaira } from '@/lib/wallet'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

/**
 * GET /api/wallet/verify?reference=xxx
 * Verify Paystack payment and credit wallet
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get reference from query params
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' }, 
        { status: 400 }
      )
    }

    // Check if already processed
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('status, amount_kobo')
      .eq('reference', reference)
      .single()

    if (existingTx?.status === 'completed') {
      return NextResponse.json({
        verified: true,
        already_processed: true,
        amount_kobo: existingTx.amount_kobo,
        amount_formatted: formatNaira(existingTx.amount_kobo),
        message: 'Payment already verified and credited.'
      })
    }

    // Verify with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status) {
      return NextResponse.json({
        verified: false,
        message: 'Could not verify payment with Paystack'
      })
    }

    if (verifyData.data.status !== 'success') {
      // Update transaction to failed
      await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('reference', reference)

      return NextResponse.json({
        verified: false,
        message: `Payment ${verifyData.data.status}. Please try again.`
      })
    }

    const amountKobo = verifyData.data.amount

    // Update transaction status
    await supabaseAdmin
      .from('wallet_transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('reference', reference)

    // Credit wallet using unified function
    const creditResult = await creditWallet(supabaseAdmin, {
      userId: user.id,
      amountKobo,
      transactionType: 'credit',
      service: 'general',
      referenceType: 'paystack_topup',
      referenceId: reference,
      description: `Wallet top-up - ${formatNaira(amountKobo)}`,
      metadata: {
        paystack_reference: reference,
        paystack_status: verifyData.data.status,
        channel: verifyData.data.channel,
        paid_at: verifyData.data.paid_at
      }
    })

    if (!creditResult.success) {
      console.error('Failed to credit wallet:', creditResult.error)
      return NextResponse.json({
        verified: true,
        credited: false,
        message: 'Payment verified but failed to credit wallet. Please contact support.',
        error: creditResult.error
      }, { status: 500 })
    }

    return NextResponse.json({
      verified: true,
      credited: true,
      amount_kobo: amountKobo,
      amount_formatted: formatNaira(amountKobo),
      new_balance_kobo: creditResult.newBalance,
      new_balance_formatted: formatNaira(creditResult.newBalance),
      message: 'Payment successful! Wallet credited.'
    })

  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { error: 'Verification failed' }, 
      { status: 500 }
    )
  }
}