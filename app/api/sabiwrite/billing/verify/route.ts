import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    // Check if already verified
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('status')
      .eq('reference', reference)
      .single()

    if (existingTx?.status === 'completed') {
      return NextResponse.json({
        verified: true,
        message: 'Payment already verified and credited.',
        already_processed: true
      })
    }

    // Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

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

    // Credit wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallet_accounts')
      .select('balance_kobo')
      .eq('user_id', user.id)
      .single()

    if (wallet) {
      await supabaseAdmin
        .from('wallet_accounts')
        .update({ 
          balance_kobo: wallet.balance_kobo + amountKobo,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      // Create wallet if doesn't exist
      await supabaseAdmin
        .from('wallet_accounts')
        .insert({
          user_id: user.id,
          balance_kobo: amountKobo,
        })
    }

    return NextResponse.json({
      verified: true,
      amount_kobo: amountKobo,
      message: 'Payment successful! Wallet credited.'
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}