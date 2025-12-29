import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrCreateWallet, getWalletLedger } from '@/lib/sabiwrite/wallet'
import { formatNaira } from '@/lib/sabiwrite/pricing'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create wallet
    const wallet = await getOrCreateWallet(supabase, user.id)

    // Get recent transactions
    const ledger = await getWalletLedger(supabase, user.id, 10)

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balanceKobo: wallet.balance_kobo,
        balanceNaira: wallet.balance_kobo / 100,
        balanceFormatted: formatNaira(wallet.balance_kobo),
        currency: wallet.currency
      },
      recentTransactions: ledger.map(entry => ({
        id: entry.id,
        type: entry.transaction_type,
        amountKobo: entry.amount_kobo,
        amountFormatted: formatNaira(entry.amount_kobo),
        description: entry.description,
        createdAt: entry.created_at
      }))
    })
  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}