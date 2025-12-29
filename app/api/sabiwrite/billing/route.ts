import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Initialize Paystack payment for wallet top-up
export async function POST(request: NextRequest) {
  try {
    const { amount, userId, email, callback_url } = await request.json()

    // Validate required fields
    if (!userId || !email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate amount (in kobo)
    if (!amount || amount < 10000) { // Min ₦100 = 10000 kobo
      return NextResponse.json({ error: 'Minimum top-up amount is ₦100' }, { status: 400 })
    }

    if (amount > 10000000) { // Max ₦100,000 = 10000000 kobo
      return NextResponse.json({ error: 'Maximum top-up amount is ₦100,000' }, { status: 400 })
    }

    // Verify user exists
    const { data: userExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Generate unique reference
    const txRef = `sabiwrite_topup_${userId.slice(0, 8)}_${Date.now()}`

    // Create pending transaction record
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'credit',
        amount_kobo: amount,
        reference: txRef,
        description: 'Wallet top-up via Paystack',
        status: 'pending',
        metadata: {
          source: 'sabiwrite',
          callback_url
        }
      })

    if (txError) {
      console.error('Transaction insert error:', txError)
      // Continue anyway - we can reconcile later
    }

    // Initialize Paystack payment
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount, // Already in kobo
        currency: 'NGN',
        reference: txRef,
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://sabitek.school'}/sabiwrite/billing?verify=true`,
        metadata: {
          user_id: userId,
          transaction_type: 'sabiwrite_topup',
          custom_fields: [
            {
              display_name: 'Purpose',
              variable_name: 'purpose',
              value: 'SabiWrite Wallet Top-up',
            },
            {
              display_name: 'Amount',
              variable_name: 'amount',
              value: `₦${(amount / 100).toLocaleString()}`,
            },
          ],
        },
      }),
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status) {
      console.error('Paystack error:', paystackData)
      
      // Update transaction to failed
      await supabaseAdmin
        .from('wallet_transactions')
        .update({ status: 'failed' })
        .eq('reference', txRef)

      return NextResponse.json({ 
        error: paystackData.message || 'Payment initialization failed' 
      }, { status: 400 })
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch billing history and stats
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const toolType = searchParams.get('toolType')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Check if verifying a payment
    const verify = searchParams.get('verify')
    const reference = searchParams.get('reference')

    if (verify === 'true' && reference) {
      // Verify payment with Paystack
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.status && verifyData.data.status === 'success') {
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
      } else {
        return NextResponse.json({
          verified: false,
          message: 'Payment verification failed'
        })
      }
    }

    const offset = (page - 1) * limit

    // Build query for operations
    let query = supabaseAdmin
      .from('sabiwrite_operations')
      .select(`
        id,
        session_id,
        tool_type,
        action,
        input_chars,
        input_tokens,
        output_tokens,
        chunk_count,
        model_provider,
        model_name,
        cost_kobo,
        status,
        created_at,
        completed_at,
        duration_ms
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (toolType) {
      query = query.eq('tool_type', toolType)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: operations, error: opsError, count } = await query

    if (opsError) {
      console.error('Operations fetch error:', opsError)
      return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
    }

    // Get wallet balance
    const { data: wallet } = await supabaseAdmin
      .from('wallet_accounts')
      .select('balance_kobo')
      .eq('user_id', user.id)
      .single()

    // Get summary stats
    const { data: stats } = await supabaseAdmin
      .from('sabiwrite_operations')
      .select('cost_kobo, status')
      .eq('user_id', user.id)

    const totalSpent = stats?.reduce((sum, op) => sum + (op.cost_kobo || 0), 0) || 0
    const totalOperations = stats?.length || 0
    const successfulOperations = stats?.filter(op => op.status === 'completed').length || 0

    return NextResponse.json({
      operations: operations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      wallet: {
        balanceKobo: wallet?.balance_kobo || 0
      },
      stats: {
        totalSpentKobo: totalSpent,
        totalOperations,
        successfulOperations
      }
    })

  } catch (error) {
    console.error('Billing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}