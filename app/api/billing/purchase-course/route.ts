// app/api/billing/purchase-course/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, email } = await request.json()

    if (!userId || !courseId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, is_free, currency')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if course is free
    if (course.is_free || course.price === 0) {
      return NextResponse.json(
        { error: 'This course is free. Please enroll directly.' },
        { status: 400 }
      )
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('course_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'successful')
      .single()

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this course' },
        { status: 400 }
      )
    }

    // Create unique transaction reference
    const txRef = `sabitek_course_${courseId}_${userId}_${Date.now()}`

    // Create pending transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount: course.price,
        currency: course.currency || 'NGN',
        provider: 'paystack',
        provider_tx_ref: txRef,
        status: 'pending',
        transaction_type: 'course_purchase'
      })

    if (txError) {
      console.error('Transaction creation error:', txError)
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: Math.round(course.price * 100), // Paystack uses kobo
        reference: txRef,
        currency: course.currency || 'NGN',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.app'}/billing/verify?type=course`,
        metadata: {
          user_id: userId,
          course_id: courseId,
          course_title: course.title,
          transaction_type: 'course_purchase'
        }
      })
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('provider_tx_ref', txRef)

      return NextResponse.json(
        { error: paystackData.message || 'Payment initialization failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: txRef
    })

  } catch (error) {
    console.error('Purchase course error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}