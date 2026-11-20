import { NextRequest, NextResponse } from 'next/server'
import { formatNaira } from '@/lib/wallet'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

// Keep in step with FREE_TRIAL_BALANCE_KOBO in lib/wallet/index.ts: buying a
// course can be the first thing that touches a wallet.
const WELCOME_BONUS_KOBO = 50000

type PurchaseOutcome =
  | { outcome: 'purchased'; transaction_ref: string; amount_kobo: number; new_balance: number }
  | { outcome: 'already_purchased' }
  | { outcome: 'course_not_found' }
  | { outcome: 'course_is_free' }
  | { outcome: 'insufficient_balance'; balance_kobo: number; required_kobo: number }

/**
 * POST /api/wallet/purchase-course
 * Purchase a course using wallet balance.
 *
 * The whole purchase is one database call (`wallet_purchase_course`): the
 * wallet is debited, the purchase and transaction are recorded and the learner
 * is enrolled in a single transaction, or none of it happens. Two clicks at
 * once cannot pay twice, and a failure cannot take the money without
 * recording the purchase.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if ('error' in auth) return auth.error

    const { courseId } = await request.json()

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.rpc('wallet_purchase_course', {
      p_user: auth.user.id,
      p_course: courseId,
      p_welcome_bonus_kobo: WELCOME_BONUS_KOBO,
    })

    if (error || !data) {
      // The function rolled back: nothing was charged.
      console.error('Wallet purchase error:', error?.message)
      return NextResponse.json(
        { error: 'Purchase failed. You have not been charged. Please try again.' },
        { status: 500 }
      )
    }

    const result = data as PurchaseOutcome

    switch (result.outcome) {
      case 'purchased':
        return NextResponse.json({
          success: true,
          message: 'Course purchased successfully!',
          transaction_ref: result.transaction_ref,
          amount_paid: result.amount_kobo / 100,
          amount_paid_formatted: formatNaira(result.amount_kobo),
          new_balance: result.new_balance,
          new_balance_formatted: formatNaira(result.new_balance),
        })

      case 'already_purchased':
        return NextResponse.json(
          { error: 'You have already purchased this course' },
          { status: 400 }
        )

      case 'course_not_found':
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })

      case 'course_is_free':
        return NextResponse.json(
          { error: 'This course is free. Please enroll directly.' },
          { status: 400 }
        )

      case 'insufficient_balance':
        return NextResponse.json(
          {
            error: 'Insufficient wallet balance',
            balance_required: result.required_kobo,
            balance_required_formatted: formatNaira(result.required_kobo),
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wallet purchase error:', error)
    return NextResponse.json(
      { error: 'Purchase failed. Please try again.' },
      { status: 500 }
    )
  }
}
