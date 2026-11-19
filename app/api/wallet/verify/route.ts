import { NextRequest, NextResponse } from 'next/server'
import { formatNaira } from '@/lib/wallet'
import { verifyAndCreditTopup } from '@/lib/wallet/topup'
import { requireUser } from '@/lib/api-auth'

/**
 * GET /api/wallet/verify?reference=xxx
 * Verify a Paystack wallet top-up and credit the caller's wallet (once).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    const result = await verifyAndCreditTopup({
      reference,
      userId: auth.user.id,
      service: 'general',
    })

    switch (result.outcome) {
      case 'credited':
        return NextResponse.json({
          verified: true,
          credited: true,
          amount_kobo: result.amountKobo,
          amount_formatted: formatNaira(result.amountKobo),
          new_balance_kobo: result.newBalance,
          new_balance_formatted: formatNaira(result.newBalance),
          message: 'Payment successful! Wallet credited.',
        })

      case 'already_processed':
        return NextResponse.json({
          verified: true,
          already_processed: true,
          amount_kobo: result.amountKobo,
          amount_formatted: formatNaira(result.amountKobo),
          message: 'Payment already verified and credited.',
        })

      case 'not_found':
        return NextResponse.json(
          { verified: false, message: 'No matching wallet top-up was found for your account.' },
          { status: 404 }
        )

      case 'unverifiable':
        return NextResponse.json({
          verified: false,
          message: 'Could not verify payment with Paystack',
        })

      case 'not_successful':
        return NextResponse.json({
          verified: false,
          message: `Payment ${result.paystackStatus}. Please try again.`,
        })

      case 'mismatch':
        return NextResponse.json(
          { verified: false, message: 'The amount paid does not match this top-up. Please contact support.' },
          { status: 400 }
        )

      case 'credit_failed':
        return NextResponse.json(
          {
            verified: true,
            credited: false,
            message: 'Payment verified but failed to credit wallet. Please try again or contact support.',
            error: result.error,
          },
          { status: 500 }
        )
    }
  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
