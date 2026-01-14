import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { debitWallet, formatNaira } from '@/lib/wallet'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/wallet/purchase-course
 * Purchase a course using wallet balance
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, price, is_free, currency, instructor_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if course is free
    if (course.is_free || !course.price || course.price === 0) {
      return NextResponse.json(
        { error: 'This course is free. Please enroll directly.' },
        { status: 400 }
      )
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabaseAdmin
      .from('course_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'successful')
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this course' },
        { status: 400 }
      )
    }

    // Convert price to kobo (price is stored in Naira)
    const priceKobo = Math.round(course.price * 100)

    // Debit wallet
    const debitResult = await debitWallet(supabaseAdmin, {
      userId: user.id,
      amountKobo: priceKobo,
      service: 'courses',
      serviceRefId: courseId,
      referenceType: 'course_purchase',
      description: `Course purchase: ${course.title}`,
      metadata: {
        course_id: courseId,
        course_title: course.title,
        instructor_id: course.instructor_id
      }
    })

    if (!debitResult.success) {
      return NextResponse.json(
        { 
          error: debitResult.error || 'Insufficient wallet balance',
          balance_required: priceKobo,
          balance_required_formatted: formatNaira(priceKobo)
        },
        { status: 400 }
      )
    }

    // Create transaction reference
    const txRef = `sabitek_wallet_course_${courseId}_${user.id}_${Date.now()}`

    // Record transaction
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: course.price,
        currency: course.currency || 'NGN',
        provider: 'wallet',
        provider_tx_ref: txRef,
        status: 'successful',
        transaction_type: 'course_purchase'
      })

    // Create course purchase record
    const { error: purchaseError } = await supabaseAdmin
      .from('course_purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: course.price,
        currency: course.currency || 'NGN',
        payment_method: 'wallet',
        transaction_reference: txRef,
        status: 'successful',
        purchased_at: new Date().toISOString()
      })

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError)
      // Don't fail - the wallet was debited, we can reconcile later
    }

    // Auto-enroll the user
    const { error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        progress_percentage: 0
      })

    if (enrollError && !enrollError.message.includes('duplicate')) {
      console.error('Enrollment error:', enrollError)
    }

    return NextResponse.json({
      success: true,
      message: 'Course purchased successfully!',
      transaction_ref: txRef,
      amount_paid: course.price,
      amount_paid_formatted: formatNaira(priceKobo),
      new_balance: debitResult.newBalance,
      new_balance_formatted: formatNaira(debitResult.newBalance)
    })

  } catch (error) {
    console.error('Wallet purchase error:', error)
    return NextResponse.json(
      { error: 'Purchase failed. Please try again.' },
      { status: 500 }
    )
  }
}