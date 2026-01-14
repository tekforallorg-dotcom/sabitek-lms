import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  getWalletTransactions, 
  formatNaira,
  WalletService 
} from '@/lib/wallet'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/wallet/transactions
 * Get user's wallet transaction history
 * 
 * Query params:
 * - service: Filter by service (sabiwrite, courses, community, etc.)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - type: Filter by transaction type (credit, debit, refund, bonus)
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service') as WalletService | null
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('wallet_ledger')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (service) {
      query = query.eq('service', service)
    }

    if (type) {
      query = query.eq('transaction_type', type)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Transactions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' }, 
        { status: 500 }
      )
    }

    // Format transactions for response
    const transactions = (data || []).map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount_kobo: tx.amount_kobo,
      amount_formatted: formatNaira(tx.amount_kobo),
      balance_before: tx.balance_before,
      balance_after: tx.balance_after,
      balance_before_formatted: formatNaira(tx.balance_before),
      balance_after_formatted: formatNaira(tx.balance_after),
      service: tx.service,
      service_ref_id: tx.service_ref_id,
      reference_type: tx.reference_type,
      description: tx.description,
      created_at: tx.created_at,
      metadata: tx.metadata
    }))

    // Calculate totals for filtered results
    const totals = {
      credits: 0,
      debits: 0,
      refunds: 0,
      bonuses: 0
    }

    for (const tx of data || []) {
      switch (tx.transaction_type) {
        case 'credit':
          totals.credits += tx.amount_kobo
          break
        case 'debit':
          totals.debits += tx.amount_kobo
          break
        case 'refund':
          totals.refunds += tx.amount_kobo
          break
        case 'bonus':
          totals.bonuses += tx.amount_kobo
          break
      }
    }

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_more: offset + limit < (count || 0)
      },
      totals: {
        credits_kobo: totals.credits,
        credits_formatted: formatNaira(totals.credits),
        debits_kobo: totals.debits,
        debits_formatted: formatNaira(totals.debits),
        refunds_kobo: totals.refunds,
        refunds_formatted: formatNaira(totals.refunds),
        bonuses_kobo: totals.bonuses,
        bonuses_formatted: formatNaira(totals.bonuses),
        net_kobo: totals.credits + totals.refunds + totals.bonuses - totals.debits,
        net_formatted: formatNaira(totals.credits + totals.refunds + totals.bonuses - totals.debits)
      },
      filters: {
        service: service || 'all',
        type: type || 'all'
      }
    })

  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}