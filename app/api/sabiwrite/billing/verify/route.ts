import { NextRequest, NextResponse } from 'next/server'
import { verifyAndCreditTopup } from '@/lib/wallet/topup'
import { requireUser } from '@/lib/api-auth'

/**
 * GET /api/sabiwrite/billing/verify?reference=xxx
 * Verify a Paystack wallet top-up started from SabiWrite and credit it (once).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 })
    }

    const result = await verifyAndCreditTopup({
      reference,
      userId: auth.user.id,
      service: 'sabiwrite',
    })

    switch (result.outcome) {
      case 'credited':
        return NextResponse.json({
          verified: true,
          amount_kobo: result.amountKobo,
          message: 'Payment successful! Wallet credited.',
        })

      case 'already_processed':
        return NextResponse.json({
          verified: true,
          message: 'Payment already verified and credited.',
          already_processed: true,
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
          },
          { status: 500 }
        )
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
