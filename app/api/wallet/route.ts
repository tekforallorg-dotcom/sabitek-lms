import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  getWalletBalance, 
  getSpendingSummary,
  formatNaira 
} from '@/lib/wallet'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/wallet
 * Get user's wallet balance and summary
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

    // Get wallet balance
    const wallet = await getWalletBalance(supabaseAdmin, user.id)

    // Get spending summary by service (optional, based on query param)
    const { searchParams } = new URL(request.url)
    const includeSummary = searchParams.get('summary') === 'true'

    let summary = null
    if (includeSummary) {
      summary = await getSpendingSummary(supabaseAdmin, user.id)
    }

    return NextResponse.json({
      wallet,
      ...(summary && { summary })
    })

  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}